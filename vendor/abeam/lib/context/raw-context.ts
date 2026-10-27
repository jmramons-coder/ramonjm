/**
 * RAW CONTEXT AGENT — 1ʳᵉ station de la chaîne (PDF d'architecture).
 * Répare le transcript STT « comme la dictée de Claude » : corrections
 * fidèles de ce qui a été dit, en continu, SANS notion voyage embarquée
 * (les noms propres sont déjà biaisés en amont par les keyterms AssemblyAI ;
 * le sens voyage appartient au Master Context Agent en aval).
 *
 * Contrat strict : même nombre de lignes, mêmes ids, mêmes locuteurs —
 * seule la propriété `text` peut changer. Toute sortie non conforme est
 * rejetée et l'original est conservé (fail-safe, jamais bloquant).
 *
 * ⚠️ PORTÉE (décision 2026-08-06) : cet agent ne travaille QUE sur le
 * BROUILLON NAVIGATEUR (reconnaissance vocale du navigateur), utilisé en repli
 * quand la transcription AssemblyAI échoue. Le transcript AssemblyAI n'est
 * JAMAIS réécrit : il est le document de référence de la rencontre, AssemblyAI
 * ponctue/accentue et applique déjà nos keyterms, et faire réécrire par un LLM
 * ce que le client a dit abîmerait sa fidélité pour un gain nul.
 * Prompt = ARTEFACT DE JUGEMENT (équipe). Imports relatifs (scripts Node).
 */

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

import type { TranscriptLine } from "../transcription/types";

export const RAW_CONTEXT_PROMPT_VERSION = "raw-context-v1";
const MODEL_ID = "gpt-4.1-mini";

const PROMPT = `Tu es le correcteur de transcription d'une consultation dans une agence de voyage au Québec (français québécois, parfois entrecoupé d'anglais).
On te donne des lignes de transcript produites par la reconnaissance vocale. Certaines contiennent des erreurs de captation : homophones, mots coupés ou collés, accents perdus, noms écorchés, ponctuation absente.

TA SEULE TÂCHE : réparer ce qui a été DIT, ligne par ligne.
RÈGLES STRICTES :
1. Corrige uniquement les erreurs de captation évidentes d'après le contexte de la conversation. Ajoute la ponctuation et les accents qui manquent.
2. NE reformule PAS, NE résume PAS, NE traduis PAS (les passages anglais restent en anglais), NE fusionne PAS et NE découpe PAS les lignes, N'ajoute AUCUN mot qui n'a pas été dit.
3. Si une ligne est incompréhensible, laisse-la TELLE QUELLE. Dans le doute, ne touche pas.
4. Conserve le registre oral (« on va y aller », « faque ») — tu répares la captation, pas le style.

SORTIE : uniquement un JSON valide de la forme {"lines":[{"id":"...","text":"..."}]} — une entrée par ligne reçue, mêmes ids, même ordre. Aucun texte hors du JSON.`;

export type RawContextResult = {
  lines: TranscriptLine[];
  changed: number;      // nb de lignes modifiées
  applied: boolean;     // false = sortie non conforme, original conservé
};

export async function cleanTranscript(lines: TranscriptLine[]): Promise<RawContextResult> {
  if (lines.length === 0) return { lines, changed: 0, applied: false };

  const payload = lines.map((l) => ({ id: l.id, text: l.text }));
  const result = await generateText({
    model: openai(MODEL_ID),
    temperature: 0,
    prompt: `${PROMPT}\n\nLIGNES:\n${JSON.stringify(payload)}`,
  });

  const match = result.text.match(/\{[\s\S]*\}/);
  if (!match) return { lines, changed: 0, applied: false };

  let parsed: { lines?: Array<{ id?: string; text?: string }> };
  try {
    parsed = JSON.parse(match[0]) as { lines?: Array<{ id?: string; text?: string }> };
  } catch {
    return { lines, changed: 0, applied: false };
  }

  const out = parsed.lines;
  // Contrat strict : même nombre, mêmes ids, textes non vides — sinon rejet.
  if (!Array.isArray(out) || out.length !== lines.length) return { lines, changed: 0, applied: false };
  const byId = new Map(out.map((l) => [l.id, l.text]));
  if (lines.some((l) => typeof byId.get(l.id) !== "string" || !String(byId.get(l.id)).trim())) {
    return { lines, changed: 0, applied: false };
  }

  let changed = 0;
  const cleaned = lines.map((l) => {
    const text = String(byId.get(l.id));
    if (text !== l.text) changed += 1;
    return { ...l, text };
  });
  return { lines: cleaned, changed, applied: true };
}
