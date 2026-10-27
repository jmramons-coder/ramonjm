/**
 * ANCRAGE TEMPOREL DU BRIEF (défaut D2, transposition T1, loi 5 « provenance obligatoire »).
 *
 * Règle centrale, non négociable : **l'ancre n'est jamais inventée par le LLM**.
 * Le modèle produit un `verbatim` (une citation) ; ce module *dérive* le moment
 * correspondant en retrouvant cette citation dans les tours de parole horodatés
 * fournis par le STT (`utterance.start` d'AssemblyAI). Aucune ancre ne figure dans
 * le contrat de sortie JSON du modèle.
 *
 * Le problème réel : un `verbatim` n'est pas un extrait au caractère près. Il perd
 * la ponctuation et la casse, il est parfois recousu à partir de deux bouts de
 * phrase (« dans le sud… mais on n'aime pas la plage »), il subit de petites
 * reformulations, et le STT lui-même écrit « tout-inclus » là où le modèle écrit
 * « tout inclus ». L'appariement doit donc être tolérant — mais il doit **rendre
 * `null` plutôt qu'une ancre fausse** : un timecode qui envoie l'agente au mauvais
 * endroit de l'enregistrement est pire que pas de timecode du tout (loi 4).
 *
 * Méthode :
 *  1. normalisation (casse, accents, apostrophes, ponctuation, espaces de milliers) ;
 *  2. découpage du verbatim en fragments sur `…`, `...` et `|` (les séparateurs que
 *     produisent nos propres prompts et la fusion de briefs) ;
 *  3. pour chaque fragment, score de recouvrement **pondéré par la rareté** (idf)
 *     des mots, sur une fenêtre de 1 à 2 tours de parole consécutifs ;
 *  4. sélection du meilleur candidat, égalité → le tour de parole le plus TÔT ;
 *  5. rejet sous le seuil `ANCHOR_MIN_SCORE`.
 *
 * La pondération idf est ce qui rend le seuil interprétable : les mots-outils
 * (« de », « la », « on »), présents partout, ne pèsent presque rien, tandis que
 * « Punta », « 8000 » ou « mégacomplexe » pèsent lourd. Un score de 0,6 signifie
 * donc « au moins 60 % du poids *informatif* du verbatim est littéralement présent
 * dans ce tour de parole ».
 */

import type { TripBrief } from "@/lib/extraction/trip-brief";
import type { TranscriptLine } from "@/lib/transcription/types";

/** Un tour de parole horodaté : le seul intrant dont l'ancrage a besoin. */
export type AnchorUtterance = {
  /** Début du tour de parole, en millisecondes depuis le début de l'enregistrement. */
  startMs: number;
  text: string;
};

export type AnchorMatch = {
  /** Ancre retenue, en millisecondes. */
  ancre_ms: number;
  /** Score de l'appariement, dans [0,1]. */
  score: number;
  /** Index du tour de parole retenu dans le tableau fourni. */
  index: number;
  /** Le fragment de verbatim qui a servi à l'appariement. */
  fragment: string;
};

/**
 * Seuil d'acceptation.
 *
 * Justification (calculs refaits dans `scripts/check-anchor.ts`) : sur un verbatim
 * de 5-6 mots, laisser tomber UN mot porteur (reformulation, mot avalé par le STT)
 * garde le score autour de 0,75-0,80 → on ancre. En laisser tomber DEUX fait passer
 * sous 0,60 → on rend `null`, parce que ce n'est plus une citation mais un résumé,
 * et qu'on ne peut plus garantir de pointer le bon tour de parole. À l'inverse, un
 * tour de parole qui ne partage avec le verbatim que des mots-outils plus un mot
 * porteur plafonne autour de 0,35-0,40 → jamais d'ancre fausse.
 *
 * Le seuil est volontairement du côté « je préfère ne rien dire » : un champ sans
 * ancre s'affiche sans puce de provenance ; un champ mal ancré détruit la confiance
 * dans TOUS les autres.
 */
export const ANCHOR_MIN_SCORE = 0.6;

/** Un verbatim peut chevaucher une question et sa réponse : on tolère 2 tours. */
export const ANCHOR_MAX_WINDOW = 2;

/** Pénalité par tour de parole supplémentaire dans la fenêtre (une fenêtre large
 *  recouvre mécaniquement plus de mots : elle doit « payer » pour cet avantage). */
const WINDOW_PENALTY = 0.05;

/** Deux candidats à moins de ce delta sont considérés à égalité → on prend le plus tôt. */
const AMBIGUITY_DELTA = 0.02;

/** Sous cette longueur normalisée, un verbatim n'identifie plus rien. */
const MIN_VERBATIM_LENGTH = 3;

const FRAGMENT_SEPARATORS = /\s*(?:…|\.{3,}|\|)\s*/;

/**
 * Normalisation d'appariement : casse, accents, ligatures, apostrophes typographiques,
 * ponctuation, et espaces de milliers (« 5 000 $ » ≡ « 5000$ »).
 */
export function normalizeForAnchor(text: string): string {
  return text
    .replace(/[\u00a0\u202f\u2007]/g, " ")
    .replace(/(\d)\s(?=\d{3}(?!\d))/g, "$1")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Les tokens d'une seule lettre (« l' », « n' », « à ») ne portent aucune information. */
function tokenize(normalized: string): string[] {
  if (!normalized) return [];
  return normalized.split(" ").filter((token) => token.length > 1 || /^\d$/.test(token));
}

type PreparedUtterance = {
  startMs: number;
  normalized: string;
  tokens: string[];
};

export type AnchorIndex = {
  utterances: PreparedUtterance[];
  weights: Map<string, number>;
  /** Poids d'un token absent du transcript : le maximum, donc pénalisant. */
  unseenWeight: number;
};

/**
 * Prépare une fois les tours de parole (normalisation + poids idf) pour ancrer les
 * ~60 champs d'un brief sans tout recalculer à chaque champ.
 */
export function prepareAnchorIndex(utterances: AnchorUtterance[]): AnchorIndex {
  const prepared: PreparedUtterance[] = utterances.map((utterance) => {
    const normalized = normalizeForAnchor(utterance.text);
    return {
      startMs: Number.isFinite(utterance.startMs) ? Math.max(0, Math.round(utterance.startMs)) : 0,
      normalized,
      tokens: tokenize(normalized),
    };
  });

  const total = prepared.length;
  const documentFrequency = new Map<string, number>();
  for (const utterance of prepared) {
    for (const token of new Set(utterance.tokens)) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }

  const weights = new Map<string, number>();
  for (const [token, frequency] of documentFrequency) {
    weights.set(token, Math.log(1 + total / (1 + frequency)));
  }

  return { utterances: prepared, weights, unseenWeight: Math.log(1 + total) };
}

function weightOf(token: string, index: AnchorIndex) {
  return index.weights.get(token) ?? index.unseenWeight;
}

/** Poids des tokens du verbatim effectivement présents dans la fenêtre (sémantique de sac). */
function matchedWeight(verbatimTokens: string[], windowTokens: string[], index: AnchorIndex) {
  const pool = new Map<string, number>();
  for (const token of windowTokens) pool.set(token, (pool.get(token) ?? 0) + 1);

  let matched = 0;
  for (const token of verbatimTokens) {
    const remaining = pool.get(token) ?? 0;
    if (remaining > 0) {
      pool.set(token, remaining - 1);
      matched += weightOf(token, index);
    }
  }

  return matched;
}

type Candidate = { score: number; index: number; startMs: number };

function bestCandidateForFragment(fragment: string, index: AnchorIndex): Candidate | null {
  const normalized = normalizeForAnchor(fragment);
  if (normalized.length < MIN_VERBATIM_LENGTH) return null;

  const verbatimTokens = tokenize(normalized);
  if (verbatimTokens.length === 0) return null;

  const totalWeight = verbatimTokens.reduce((sum, token) => sum + weightOf(token, index), 0);
  if (totalWeight <= 0) return null;

  const candidates: Candidate[] = [];

  for (let start = 0; start < index.utterances.length; start += 1) {
    const maxWindow = Math.min(ANCHOR_MAX_WINDOW, index.utterances.length - start);

    for (let size = 1; size <= maxWindow; size += 1) {
      const window = index.utterances.slice(start, start + size);

      // Une fenêtre de 2 tours n'est légitime que si le verbatim touche VRAIMENT les
      // deux : sinon le second tour ne fait que gonfler le recouvrement gratuitement.
      if (size > 1 && window.some((utterance) => matchedWeight(verbatimTokens, utterance.tokens, index) === 0)) {
        continue;
      }

      const windowText = window.map((utterance) => utterance.normalized).join(" ");
      const windowTokens = window.flatMap((utterance) => utterance.tokens);

      // Citation littérale retrouvée telle quelle : c'est le signal le plus fort.
      const base = windowText.includes(normalized)
        ? 1
        : matchedWeight(verbatimTokens, windowTokens, index) / totalWeight;

      const score = base - WINDOW_PENALTY * (size - 1);
      if (score >= ANCHOR_MIN_SCORE) {
        candidates.push({ score, index: start, startMs: window[0].startMs });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Meilleur score ; à égalité (delta serré, p. ex. un verbatim qui apparaît deux
  // fois à l'identique) on prend le tour de parole le plus TÔT : c'est le moment où
  // la chose a été dite pour la première fois, donc l'origine du fait. Les
  // occurrences suivantes sont des confirmations.
  const best = candidates.reduce((a, b) => (b.score > a.score ? b : a));
  return candidates
    .filter((candidate) => candidate.score >= best.score - AMBIGUITY_DELTA)
    .reduce((a, b) => (b.startMs < a.startMs ? b : a));
}

/**
 * Retrouve le moment d'un verbatim dans des tours de parole horodatés.
 * Rend `null` dès que la correspondance est trop faible, absente, ou que le verbatim
 * est vide — jamais une ancre approximative.
 */
export function findAnchor(verbatim: string | null | undefined, index: AnchorIndex): AnchorMatch | null {
  if (typeof verbatim !== "string") return null;
  if (index.utterances.length === 0) return null;

  const fragments = verbatim
    .split(FRAGMENT_SEPARATORS)
    .map((fragment) => fragment.trim())
    .filter((fragment) => fragment.length > 0);

  const matches: AnchorMatch[] = [];
  for (const fragment of fragments) {
    const candidate = bestCandidateForFragment(fragment, index);
    if (candidate) {
      matches.push({ ancre_ms: candidate.startMs, score: candidate.score, index: candidate.index, fragment });
    }
  }

  if (matches.length === 0) return null;

  // Entre fragments d'un même verbatim (cas des contradictions « A… mais B »), on
  // garde celui qu'on situe avec le plus de certitude ; à égalité, le plus tôt.
  const best = matches.reduce((a, b) => (b.score > a.score ? b : a));
  return matches
    .filter((match) => match.score >= best.score - AMBIGUITY_DELTA)
    .reduce((a, b) => (b.ancre_ms < a.ancre_ms ? b : a));
}

/** Raccourci : l'ancre en millisecondes, ou `null`. */
export function findAnchorMs(verbatim: string | null | undefined, utterances: AnchorUtterance[]): number | null {
  return findAnchor(verbatim, prepareAnchorIndex(utterances))?.ancre_ms ?? null;
}

/**
 * Tours de parole ancrables à partir d'un transcript applicatif.
 * `startMs` (posé par l'adaptateur AssemblyAI) est utilisé quand il existe ; sinon on
 * retombe sur la seconde arrondie, la seule information disponible sur les
 * transcripts historiques ou saisis à la main.
 */
export function anchorUtterancesFromTranscript(lines: TranscriptLine[]): AnchorUtterance[] {
  return lines.map((line) => ({
    startMs: typeof line.startMs === "number" && Number.isFinite(line.startMs)
      ? Math.max(0, Math.round(line.startMs))
      : Math.max(0, Math.round(line.time * 1000)),
    text: line.text,
  }));
}

export type AnchorDerivationOptions = {
  /**
   * Session (enregistrement) dans laquelle les ancres ont un sens. Fortement
   * recommandé : sans elle, l'ancre est perdue à la fusion en brief de dossier
   * (voir `mergeSessionBriefs`), parce qu'un timecode sans son enregistrement ne
   * désigne rien.
   */
  sessionId?: string | null;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Un `Field<T>` ou une `DateFloue` : tout ce qui porte verbatim + valeur + statut. */
function isFieldLike(value: UnknownRecord) {
  return "verbatim" in value && "valeur" in value && "statut" in value;
}

function visitFields(node: unknown, visit: (field: UnknownRecord) => void) {
  if (Array.isArray(node)) {
    for (const item of node) visitFields(item, visit);
    return;
  }

  if (!isRecord(node)) return;

  if (isFieldLike(node)) {
    visit(node);
    return;
  }

  for (const value of Object.values(node)) visitFields(value, visit);
}

/**
 * Pose `ancre_ms` / `ancre_session_id` sur tous les champs d'un brief, à partir de
 * leur `verbatim` et des tours de parole horodatés de LA session qui a produit ce
 * brief. Le brief d'entrée n'est pas muté.
 *
 * Les deux clés sont écrites explicitement, `null` compris : après passage, un brief
 * déclare son état d'ancrage (« situé » vs « pas retrouvé »), au lieu de laisser
 * l'affichage deviner. Un brief qui n'a jamais traversé cette fonction reste, lui,
 * exactement dans sa forme historique — aucune clé ajoutée.
 */
export function deriveTripBriefAnchors(
  brief: TripBrief,
  utterances: AnchorUtterance[],
  options: AnchorDerivationOptions = {},
): TripBrief {
  const anchored = JSON.parse(JSON.stringify(brief)) as TripBrief;
  const index = prepareAnchorIndex(utterances);
  const sessionId = options.sessionId ?? null;

  visitFields(anchored, (field) => {
    const verbatim = typeof field.verbatim === "string" ? field.verbatim : null;
    const match = findAnchor(verbatim, index);
    field.ancre_ms = match ? match.ancre_ms : null;
    field.ancre_session_id = match ? sessionId : null;
  });

  return anchored;
}

/** Variante prenant directement un transcript applicatif. */
export function deriveTripBriefAnchorsFromTranscript(
  brief: TripBrief,
  transcript: TranscriptLine[],
  options: AnchorDerivationOptions = {},
): TripBrief {
  return deriveTripBriefAnchors(brief, anchorUtterancesFromTranscript(transcript), options);
}
