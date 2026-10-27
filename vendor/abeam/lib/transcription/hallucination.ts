/**
 * FILTRE D'HALLUCINATION — la défense en profondeur, derrière la porte d'énergie.
 *
 * Le 2026-08-06, en rencontre réelle, AssemblyAI a rendu ce tour :
 *
 *   « Being slapped, putting it in containers, shipping it across the Atlantic
 *     Ocean on one of those cargo ships that you and I've been on. »
 *
 * Personne ne l'a prononcé. Le moteur l'a fabriqué sur du silence de pièce, et
 * notre diarisation sémantique l'a étiqueté « Client » : il serait entré dans
 * le transcript officiel, dans le brief, dans le récap, et potentiellement dans
 * le courriel envoyé à un vrai client.
 *
 * La vraie parade est en amont (`lib/live/voice-gate.ts` : on n'envoie plus le
 * silence). Ce module est la seconde ligne — pour le batch, où il n'y a pas de
 * porte, et pour le live quand la porte laisse passer du bruit qui ressemble à
 * de la parole.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE L'API FOURNIT VRAIMENT (vérifié contre la doc live, 2026-08-06 —
 * `llms-full.txt`, streaming v3 et pre-recorded ; ne pas se fier à la mémoire)
 *
 * • **Streaming v3, message `Turn`** : `{ type, turn_order, end_of_turn,
 *   turn_is_formatted, transcript, utterance, end_of_turn_confidence, words[] }`
 *   où `words[] = { text, start, end, confidence, word_is_final, speaker }`.
 *   ⚠️ `end_of_turn_confidence` n'est **PAS** une confiance de transcription :
 *   c'est la confiance que le TOUR est terminé. Sur `universal-3-5-pro` la
 *   détection de fin de tour est de surcroît **basée sur la ponctuation**, et
 *   `end_of_turn_confidence_threshold` y est **silencieusement ignoré**. Ce
 *   champ ne dit donc rien sur la véracité du texte : on ne s'en sert pas.
 *   La confiance exploitable est celle **par mot** (`words[].confidence`,
 *   0-1, toujours présente, aucun réglage à activer).
 * • **Pre-recorded** : `utterances[].confidence` existe, et c'est bien, elle,
 *   une confiance de TRANSCRIPTION sur le tour.
 * • **Pas d'indicateur de parole/silence exploitable côté réponse.** Il existe
 *   un message `SpeechStarted { type, timestamp, confidence }`, mais la doc dit
 *   qu'il « n'est émis que lorsque le modèle produit un transcript » : il
 *   accompagne l'hallucination au lieu de la dénoncer. Le VAD d'AssemblyAI est
 *   interne (`vad_threshold`), jamais exposé par tour. C'est pour ça que le
 *   signal « arrivé sur du silence » doit venir de NOUS.
 * • **Détection de langue par tour** : la doc se contredit d'une section à
 *   l'autre (une page l'annonce réservée à `universal-streaming-multilingual`
 *   et « non supportée sur U3 Pro Streaming », le tableau comparatif la coche
 *   pour U3 Pro, la section LiveKit dit qu'elle est à `false` par défaut sur
 *   l'API directe). Non vérifiable sans tirer sur l'API : on ne s'appuie donc
 *   PAS dessus. Le test de langue ci-dessous est **lexical**, chez nous.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA RÈGLE, ET LES FAUX NÉGATIFS QU'ELLE ASSUME
 *
 * Les rencontres de La Forfaiterie sont RÉELLEMENT bilingues : un client PEUT
 * dire une phrase en anglais. « C'est de l'anglais » n'est donc pas un signal.
 * Le signal, c'est le FAISCEAU. On ne jette un tour que si les QUATRE indices
 * tombent ensemble (§B) — ou si la confiance est au plancher (§A).
 *
 * Dans le doute, **on garde**. Jeter une vraie phrase du client est un mal pire
 * qu'en laisser passer une fausse, que la voie lente et la relecture humaine
 * peuvent encore attraper.
 *
 * Faux négatifs ASSUMÉS (des hallucinations que ce filtre laissera passer) :
 *  – une hallucination **française** (le moteur est amorcé sur du contexte FR :
 *    c'est un cas réel) — aucun de nos indices ne la distingue d'une vraie
 *    phrase ; seule la porte d'énergie la prévient ;
 *  – une hallucination **courte** (< 12 mots : « Thank you. », « Bye. ») — les
 *    jeter jetterait aussi les vrais « Okay », « Perfect », « Thank you » d'un
 *    client bilingue, qui sont fréquents ;
 *  – une hallucination anglaise qui contient un mot du vocabulaire voyage —
 *    elle passe le test « sans lien avec le sujet » ;
 *  – une hallucination arrivée **pendant** que quelqu'un parlait ailleurs dans
 *    la pièce (la porte était ouverte) ;
 *  – une hallucination à **haute** confiance par mot : un modèle génératif est
 *    souvent très sûr de ce qu'il invente. La confiance est un signal faible
 *    ici, c'est pourquoi son seuil est bas (§A) et qu'elle ne pèse qu'un
 *    quart du faisceau (§B).
 *
 * Logique PURE : testée hors ligne par `pnpm check:sttgarde`.
 */

import { TRAVEL_KEYTERMS } from "./keyterms.ts";

export const FILTRE = {
  /**
   * §A — plancher de confiance. Très bas VOLONTAIREMENT : une confiance
   * moyenne sous 0,40 sur un tour d'au moins 4 mots, ce n'est plus de la
   * captation difficile, c'est du bruit interprété.
   */
  CONFIANCE_PLANCHER: 0.4,
  /** …et jamais sur un tour court : « oui », « Cassis » mal captés se gardent. */
  CONFIANCE_MOTS_MIN: 4,
  /**
   * §B — longueur au-delà de laquelle un tour 100 % anglais devient suspect.
   * 12 mots : au-dessous, c'est le registre normal d'un client bilingue
   * (« Yes, we've been there twice with the kids »).
   */
  ANGLAIS_MOTS_MIN: 12,
  /** §B — la confiance qui compte comme indice quand elle est disponible. */
  ANGLAIS_CONFIANCE_MAX: 0.9,
} as const;

/**
 * Marqueurs français NON ambigus avec l'anglais. La liste est courte et sûre
 * par construction : un seul de ces mots suffit à garder le tour, donc une
 * omission ne coûte qu'un tour douteux de plus retenu — jamais une vraie
 * phrase jetée.
 */
const MARQUEURS_FR = new Set([
  "le", "la", "les", "un", "une", "des", "du", "de", "au", "aux", "ce", "cet", "cette", "ces",
  "je", "tu", "il", "elle", "nous", "vous", "ils", "elles", "moi", "toi", "lui", "eux",
  // « ton » est volontairement absent : c'est aussi un mot anglais (voir HOMOGRAPHES_FR_EN).
  "mon", "ma", "mes", "tes", "notre", "nos", "votre", "vos", "leur", "leurs",
  "est", "sont", "etait", "etaient", "sera", "seront", "suis", "sommes", "etes",
  "ai", "avons", "avez", "ont", "avait", "avaient", "aura", "auront",
  "que", "qui", "quoi", "dont", "ou", "quand", "comment", "pourquoi", "parce",
  "avec", "sans", "pour", "dans", "chez", "vers", "entre", "sous", "sur",
  "mais", "donc", "alors", "aussi", "encore", "deja", "toujours", "jamais",
  "tres", "trop", "moins", "beaucoup", "peut", "peux", "veut", "veux", "doit", "dois",
  "fait", "faire", "vais", "allez", "allons", "vont",
  "oui", "non", "voila", "merci", "bonjour", "salut",
  "ne", "pas", "se", "sa", "ses", "si", "ca", "cela", "ceci", "y", "en",
  "hotel", "voyage", "semaine", "jours", "mois", "annee", "enfants", "conjoint",
  "vol", "vols", "depart", "retour", "prix", "budget", "plage", "chambre",
]);

/**
 * Homographes FR/EN — présents dans une phrase anglaise sans que ce soit du
 * français. Ils sont exclus de `MARQUEURS_FR` par construction ; la liste est
 * ici pour que le banc puisse vérifier qu'aucun ne s'y est glissé.
 *
 * Le cas qui a motivé la liste : la phrase hallucinée contient DEUX fois
 * « on », qui est un pronom français très courant. Un lexique naïf l'aurait
 * déclarée « contient du français » et le filtre n'aurait rien attrapé.
 */
export const HOMOGRAPHES_FR_EN = [
  "on", "a", "as", "or", "but", "son", "ton", "note", "plan", "chat", "pain",
  "coin", "tour", "part", "sale", "four", "rose", "fin", "main", "car", "pot",
  "ok", "sang", "long", "chose",
];

function sansAccents(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/** Mots d'un texte, désaccentués et en minuscules. Les apostrophes séparent. */
function mots(texte: string): string[] {
  return sansAccents(texte)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Une lettre accentuée. Volontairement PAS limitée au français : ce qu'on
 * cherche à établir, c'est « ce tour est-il de l'anglais pur ? ». Un « é », un
 * « ñ » ou un « ú » (Cancún, Holguín, Curaçao — du vocabulaire courant ici)
 * suffisent à répondre non, et donc à garder le tour. Une règle plus étroite
 * n'aurait fait que jeter davantage.
 */
const A_UN_ACCENT = /[àâäçéèêëîïôöùûüÿœæáíóúñãõ]/i;

/** Combien de mots de ce tour sont identifiables comme non-anglais / français ? */
export function motsFrancais(texte: string): number {
  const marqueurs = mots(texte).filter((m) => MARQUEURS_FR.has(m)).length;
  return A_UN_ACCENT.test(texte) ? marqueurs + 1 : marqueurs;
}

/**
 * Le vocabulaire voyage, désaccentué, en EXPRESSIONS complètes.
 *
 * Volontairement pas token par token : « Ocean Hotels » est un keyterm, et un
 * appariement au mot aurait fait matcher « Atlantic Ocean » dans la phrase
 * hallucinée — le filtre l'aurait déclarée « sur le sujet » et gardée.
 */
const EXPRESSIONS_VOYAGE = TRAVEL_KEYTERMS.map((t) => sansAccents(t).toLowerCase().trim()).filter(Boolean);

/** Le tour parle-t-il du sujet de la rencontre ? (vocabulaire voyage) */
export function parleDuSujet(texte: string, vocabulaireEnPlus: string[] = []): boolean {
  const plat = ` ${mots(texte).join(" ")} `;
  const tous = [...EXPRESSIONS_VOYAGE, ...vocabulaireEnPlus.map((t) => sansAccents(t).toLowerCase().trim())];
  return tous.some((terme) => terme.length > 2 && plat.includes(` ${terme} `));
}

export type TourRecu = {
  texte: string;
  /** Confiances par mot (`words[].confidence` en streaming) — `null` si absentes. */
  confiancesParMot?: number[] | null;
  /** Confiance du tour (`utterances[].confidence` en batch) — `null` si absente. */
  confianceDuTour?: number | null;
  /**
   * Le tour est-il arrivé SUR DU SILENCE ? C'est l'indice porteur du faisceau.
   *   – en live : la porte d'énergie n'a détecté aucune parole dans la fenêtre ;
   *   – en batch : le tour est temporellement ISOLÉ (grand blanc avant ET après).
   * Quand on ne sait pas, c'est `false` — et le faisceau ne se referme jamais.
   */
  surSilence: boolean;
  /**
   * Langue attendue de la rencontre. `"fr"` ou `null` (mode auto) → le test
   * lexical s'applique. Toute autre valeur le désactive : dans une rencontre
   * épinglée en anglais, « c'est de l'anglais » n'est évidemment plus un indice.
   */
  langueAttendue?: string | null;
  /** Noms déjà entendus dans la rencontre — ils comptent comme « sur le sujet ». */
  vocabulaireDeLaRencontre?: string[];
};

export type VerdictTour = {
  garder: boolean;
  /** Lisible, pour le banc et la journalisation. Jamais affiché à l'agent. */
  raison: string;
  /** Les indices réunis (diagnostic). */
  indices: string[];
};

function confianceMoyenne(tour: TourRecu): number | null {
  if (typeof tour.confianceDuTour === "number") return tour.confianceDuTour;
  const c = tour.confiancesParMot;
  if (!c || c.length === 0) return null;
  return c.reduce((somme, v) => somme + v, 0) / c.length;
}

/**
 * Garder ce tour, ou le jeter ? Voir l'en-tête pour la règle et ses faux
 * négatifs assumés. Le défaut, en cas de doute, est TOUJOURS `garder: true`.
 */
export function evaluerTour(tour: TourRecu): VerdictTour {
  const texte = tour.texte.trim();
  if (!texte) return { garder: false, raison: "tour vide", indices: [] };

  const nbMots = mots(texte).length;
  const confiance = confianceMoyenne(tour);

  // ── §A — plancher de confiance. Seul verdict qui ne demande pas de faisceau,
  // parce qu'une confiance sous 0,40 sur plusieurs mots n'a pas d'autre lecture.
  if (
    confiance !== null &&
    confiance < FILTRE.CONFIANCE_PLANCHER &&
    nbMots >= FILTRE.CONFIANCE_MOTS_MIN
  ) {
    return {
      garder: false,
      raison: `confiance moyenne ${confiance.toFixed(2)} sous le plancher ${FILTRE.CONFIANCE_PLANCHER} sur ${nbMots} mots`,
      indices: ["confiance au plancher"],
    };
  }

  // ── §B — le faisceau. Il faut les QUATRE indices. Un seul manquant → on garde.
  const langue = tour.langueAttendue ?? null;
  const langueTestable = langue === null || langue === "fr";

  const indices: string[] = [];
  if (tour.surSilence) indices.push("arrivé sur du silence");
  if (langueTestable && motsFrancais(texte) === 0) indices.push("pas un seul mot français");
  if (nbMots >= FILTRE.ANGLAIS_MOTS_MIN) indices.push(`long (${nbMots} mots)`);
  if (!parleDuSujet(texte, tour.vocabulaireDeLaRencontre ?? [])) indices.push("sans lien avec le sujet");

  if (indices.length === 4) {
    return {
      garder: false,
      raison: `faisceau complet — ${indices.join(", ")}`,
      indices,
    };
  }

  return {
    garder: true,
    raison: indices.length === 0 ? "aucun indice" : `faisceau incomplet (${indices.length}/4) — dans le doute, on garde`,
    indices,
  };
}

/**
 * BATCH — le même trou existe à la sauvegarde. Il n'y a pas de porte d'énergie
 * là-bas : le substitut honnête de « arrivé sur du silence » est
 * l'ISOLEMENT TEMPOREL, directement mesurable sur `utterances[].start/end`.
 * Un tour entouré d'un grand blanc des deux côtés est un tour posé sur du
 * silence — exactement la situation qui a produit la phrase inventée.
 */
export const ISOLEMENT_BATCH_MS = 3_000;

export function estIsoleDansLeTemps(
  index: number,
  bornes: Array<{ start: number; end: number }>,
  seuilMs: number = ISOLEMENT_BATCH_MS,
): boolean {
  const courant = bornes[index];
  if (!courant) return false;
  const precedent = bornes[index - 1];
  const suivant = bornes[index + 1];
  /**
   * Un voisin MANQUANT ne compte pas comme un blanc. Le premier et le dernier
   * tour d'un enregistrement sont naturellement bordés de silence (on démarre
   * le micro avant de parler, on l'arrête après) : les traiter comme isolés
   * mettrait en cause la première et la dernière phrase de chaque rencontre.
   * Dans le doute, on garde — un tour de bord n'est jamais « sur du silence ».
   */
  if (!precedent || !suivant) return false;
  return courant.start - precedent.end >= seuilMs && suivant.start - courant.end >= seuilMs;
}
