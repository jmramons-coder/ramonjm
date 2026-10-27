/**
 * STREAMING AssemblyAI (tranche 2.1) — l'entrée live de qualité constante.
 * Client-only : AudioWorklet (PCM16 16 kHz, trames ~100 ms) → WebSocket v3
 * (universal-3-5-pro, mode balanced, diarisation) via jeton éphémère minté
 * côté serveur. En cas d'échec (navigateur, réseau, jeton), l'appelant
 * retombe sur la reconnaissance du navigateur — jamais bloquant.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEUX DÉFAUTS MESURÉS EN RENCONTRE RÉELLE (2026-08-06) SE CORRIGENT ICI
 *
 * ① **Une phrase inventée.** Le moteur a rendu un tour anglais fluide que
 *    personne n'avait prononcé, fabriqué sur du silence de pièce, que notre
 *    diarisation a étiqueté « Client ». Deux parades, dans cet ordre :
 *    la PORTE D'ÉNERGIE (`lib/live/voice-gate.ts`) qui n'envoie plus le silence
 *    — un modèle qui ne reçoit pas de silence n'hallucine pas dessus — puis le
 *    FILTRE DE TOURS (`lib/transcription/hallucination.ts`) en défense en
 *    profondeur, alimenté par ce que la porte a vu.
 *
 * ② **La voie rapide ne se déclenchait qu'à la pause.** On ne lisait que les
 *    messages `Turn` portant `end_of_turn: true`. Les partiels
 *    (`end_of_turn: false`) étaient jetés, alors que ce sont eux qui arrivent
 *    PENDANT qu'on parle. Ils sont maintenant remontés par `onPartial` — et
 *    jamais écrits dans le transcript (Loi 25 : le document de référence est
 *    fait de tours finalisés).
 *
 * ⚠️ `continuous_partials` : la doc live est explicite — quand `speaker_labels`
 * est actif, le serveur bascule sur des défauts « diarisation »
 * (`min_turn_silence: 640`, `max_turn_silence: 768`, **partiels continus
 * désactivés**). Sans le remettre à `true` explicitement, un tour de 23 s
 * n'aurait produit qu'UN partiel précoce puis plus rien : la correction ② ne
 * tiendrait pas. Un réglage explicite l'emporte sur le préréglage.
 */

import { creerPorteEnergie } from "./voice-gate.ts";
import { evaluerTour } from "../transcription/hallucination.ts";

export type LiveStreamHandle = {
  pause: () => void;
  resume: () => void;
  stop: () => Promise<void>;
};

type StartOptions = {
  stream: MediaStream;
  fetchToken: () => Promise<string>;
  prompt?: string;
  keyterms?: string[];
  onFinal: (text: string, speakerLabel: string | null) => void;
  /**
   * Un tour EN COURS. Chaque message re-transcrit tout le tour depuis le début :
   * remplacer, jamais concaténer. À ne jamais stocker comme ligne de transcript.
   */
  onPartial?: (text: string) => void;
  /** Un tour jeté par le filtre d'hallucination — diagnostic, silencieux à l'écran. */
  onRejet?: (text: string, raison: string) => void;
  onStatus: (status: "active" | "error" | "closed") => void;
};

/**
 * Fenêtre de parole exigée autour d'un tour finalisé. Un tour dont la fin
 * tombe plus de 6 s après la dernière parole détectée par la porte est
 * « arrivé sur du silence » — c'est l'indice porteur du filtre. La fenêtre est
 * large exprès : le moteur rend son final après son propre délai de silence
 * (768 ms) plus la latence réseau, et on préfère cent fois rater une
 * hallucination que jeter une vraie phrase.
 */
const FENETRE_PAROLE_MS = 6_000;

const PROCESSOR_CODE = `
class Pcm16Batcher extends AudioWorkletProcessor {
  constructor() { super(); this._buf = new Int16Array(1600); this._n = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) {
      for (let i = 0; i < ch.length; i++) {
        let s = ch[i];
        if (s > 1) s = 1; else if (s < -1) s = -1;
        this._buf[this._n++] = s < 0 ? s * 0x8000 : s * 0x7fff;
        if (this._n === this._buf.length) {
          const out = this._buf.slice(0);
          this.port.postMessage(out.buffer, [out.buffer]);
          this._n = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor("pcm16-batcher", Pcm16Batcher);
`;

export async function startAssemblyLiveStream(opts: StartOptions): Promise<LiveStreamHandle> {
  const token = await opts.fetchToken();

  const context = new AudioContext({ sampleRate: 16_000 });
  if (Math.round(context.sampleRate) !== 16_000) {
    await context.close();
    throw new Error(`AudioContext à ${context.sampleRate} Hz — 16 kHz requis.`);
  }
  const moduleUrl = URL.createObjectURL(new Blob([PROCESSOR_CODE], { type: "application/javascript" }));
  try {
    await context.audioWorklet.addModule(moduleUrl);
  } finally {
    URL.revokeObjectURL(moduleUrl);
  }

  const params = new URLSearchParams({
    token,
    sample_rate: "16000",
    speech_model: "universal-3-5-pro",
    mode: "balanced",
    speaker_labels: "true",
    max_speakers: "4",
    // Voir l'en-tête : `speaker_labels` les désactive par défaut, et sans eux
    // un long tour ne produit plus rien avant sa finalisation.
    continuous_partials: "true",
  });
  if (opts.prompt) params.set("prompt", opts.prompt.slice(0, 1400));
  if (opts.keyterms?.length) params.set("keyterms_prompt", JSON.stringify(opts.keyterms.slice(0, 100)));

  const ws = new WebSocket(`wss://streaming.assemblyai.com/v3/ws?${params.toString()}`);

  let paused = false;
  let stopping = false;

  // La porte d'énergie : un état par session, le plancher de bruit appartient
  // à la pièce. Elle décide seule de ce qui sort d'ici.
  const porte = creerPorteEnergie();

  const source = context.createMediaStreamSource(opts.stream);
  const node = new AudioWorkletNode(context, "pcm16-batcher");
  node.port.onmessage = (event) => {
    if (paused || stopping || ws.readyState !== WebSocket.OPEN) return;
    const trame = new Int16Array(event.data as ArrayBuffer);
    // ① La porte, AVANT l'envoi : le silence de la pièce ne quitte pas la pièce.
    // Elle rend le pré-roll retenu à l'ouverture (la première syllabe survit)
    // et continue d'émettre pendant le hangover (le moteur a besoin du silence
    // de fin pour FINALISER le tour — sans ça, plus aucun tour ne se ferme).
    const { aEmettre } = porte.pousser(trame, Date.now());
    for (const t of aEmettre) {
      if (ws.readyState !== WebSocket.OPEN) break;
      ws.send(t.buffer as ArrayBuffer);
    }
  };
  // Sortie silencieuse (le processeur n'écrit rien en sortie) — garde le graphe actif.
  source.connect(node);
  node.connect(context.destination);

  ws.onopen = () => opts.onStatus("active");
  ws.onmessage = (event) => {
    try {
      /**
       * Forme RÉELLE du message `Turn` (doc live v3, vérifiée le 2026-08-06) :
       * `{ type, turn_order, end_of_turn, turn_is_formatted, transcript,
       *    utterance, end_of_turn_confidence, speaker_label, words[] }`
       * avec `words[] = { text, start, end, confidence, word_is_final, speaker }`.
       *
       * `end_of_turn_confidence` n'est PAS lue : elle mesure la confiance que le
       * tour est TERMINÉ, pas que le texte est vrai — et sur universal-3-5-pro
       * la fin de tour est décidée sur la ponctuation de toute façon. La seule
       * confiance de transcription exposée en streaming est celle par MOT.
       */
      const message = JSON.parse(String(event.data)) as {
        type?: string;
        end_of_turn?: boolean;
        transcript?: string;
        speaker_label?: string;
        words?: Array<{ confidence?: number }>;
      };
      if (message.type !== "Turn") return;
      const text = (message.transcript ?? "").trim();
      if (!text) return;

      // ② Partiel : il ARME la voie rapide, il n'entre jamais dans le transcript.
      if (!message.end_of_turn) {
        opts.onPartial?.(text);
        return;
      }

      // ③ Tour finalisé : le filtre d'hallucination, alimenté par ce que la
      // porte d'énergie a réellement entendu pendant la fenêtre du tour.
      const confiances = (message.words ?? [])
        .map((w) => w.confidence)
        .filter((c): c is number => typeof c === "number");
      const verdict = evaluerTour({
        texte: text,
        confiancesParMot: confiances.length > 0 ? confiances : null,
        surSilence: !porte.paroleRecente(Date.now(), FENETRE_PAROLE_MS),
        // La rencontre est francophone mais réellement bilingue : `null` laisse
        // le test lexical s'appliquer sans jamais suffire à lui seul.
        langueAttendue: "fr",
        vocabulaireDeLaRencontre: opts.keyterms,
      });
      if (!verdict.garder) {
        opts.onRejet?.(text, verdict.raison);
        return;
      }
      opts.onFinal(text, message.speaker_label ?? null);
    } catch {
      // trame non-JSON : ignorée
    }
  };
  ws.onerror = () => {
    if (!stopping) opts.onStatus("error");
  };
  ws.onclose = () => {
    if (!stopping) opts.onStatus("closed");
  };

  const teardownAudio = async () => {
    try { source.disconnect(); } catch { /* déjà déconnecté */ }
    try { node.disconnect(); } catch { /* déjà déconnecté */ }
    try { await context.close(); } catch { /* déjà fermé */ }
  };

  return {
    pause: () => {
      paused = true;
      void context.suspend();
    },
    resume: () => {
      paused = false;
      void context.resume();
    },
    stop: async () => {
      stopping = true;
      try {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "Terminate" }));
      } catch { /* déjà fermé */ }
      await new Promise((resolve) => setTimeout(resolve, 250));
      try { ws.close(); } catch { /* déjà fermé */ }
      await teardownAudio();
    },
  };
}
