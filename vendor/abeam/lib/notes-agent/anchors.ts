/**
 * PROVENANCE DU RÉCAP — l'ancre d'une PHRASE, héritée des champs qu'elle cite.
 *
 * C'est le cœur du lot. §6.1bis : « les ⟨mm:ss⟩ quittent les 30 cartes pour se
 * poser sur les phrases du récap […] l'ancre est HÉRITÉE de `ancre_ms` de ces
 * champs. Aucun nouvel appariement, aucune invention possible. » Le modèle ne
 * produit jamais une milliseconde : il cite des champs, et ce module lit les
 * ancres que `lib/extraction/anchor.ts` a déjà dérivées du verbatim.
 *
 * Les quatre règles, dans l'ordre où elles comptent :
 *
 *  1. LA PLUS PRÉCOCE. Parmi les champs cités, on prend l'ancre la plus petite —
 *     le moment où la chose a été dite pour la première fois, donc l'ORIGINE du
 *     fait. Même choix qu'`anchor.ts` en cas d'égalité : les occurrences
 *     suivantes ne sont que des confirmations.
 *  2. UN CHAMP SANS ANCRE EST IGNORÉ. Chemin absent d'un brief plus ancien,
 *     nœud qui n'est pas un champ, `ancre_ms: null` (verbatim non retrouvé) :
 *     on passe, sans faire échouer la phrase pour autant.
 *  3. AUCUN CHAMP ANCRÉ → `null`. Jamais une ancre approchée, jamais l'ancre du
 *     champ voisin. Une phrase sans ancre s'affiche sans puce de provenance ;
 *     une phrase MAL ancrée détruit la confiance dans toutes les autres (loi 4,
 *     et même arbitrage que le seuil d'`anchor.ts`).
 *  4. AUCUN MÉLANGE DE SESSIONS. Sur un brief de dossier, les champs cités
 *     peuvent venir de deux conversations différentes : un timecode n'a de sens
 *     que dans SON enregistrement. On retient alors la session la plus RÉCENTE
 *     (l'état courant du dossier), on y prend l'ancre la plus précoce, et on le
 *     SIGNALE (`sessions_melangees`). Si la récence n'est pas connaissable —
 *     aucun ordre de sessions fourni, ou une session citée hors de cet ordre —
 *     on rend `null` : pointer la mauvaise conversation est pire que ne rien
 *     pointer.
 *
 * PONT DE VOCABULAIRE. `CHAMPS_ANCRABLES` dit, pour chaque chemin citable, où
 * l'ancre se LIT dans le brief. Depuis la correction de `CHAMPS_CITABLES` du
 * 2026-08-06 (la liste est maintenant dérivée de `trip-brief.ts` bloc par bloc),
 * ce pont est une IDENTITÉ — et c'est exactement ce qu'on voulait : le chemin
 * cité par le modèle est le chemin réel. On le garde tout de même, pour deux
 * raisons qui ont chacune coûté un bug : `Record<ChampCitable, …>` fait échouer
 * la compilation le jour où un chemin citable est ajouté sans qu'on ait dit où il
 * se lit (c'est ce qui a fait remonter le défaut de la première liste), et un
 * chemin citable n'est pas garanti d'être un `Field<>` — voir
 * `CHAMPS_SANS_PORTEUR`.
 */

import type { TripBrief } from "../extraction/trip-brief";
import { CHAMPS_CITABLES } from "./prompt.ts";
import { isChampCitable, type ChampCitable } from "./schema.ts";
import type { NotesAgent, NotesClaim } from "./types";

/** L'ancre d'une phrase : un couple (enregistrement, milliseconde). */
export type ClaimAnchor = {
  ancre_ms: number;
  /**
   * L'enregistrement dans lequel `ancre_ms` a un sens. `null` quand le brief a
   * été ancré hors dossier (une seule session en contexte) : l'appelant sait
   * alors de quel enregistrement il parle.
   */
  ancre_session_id: string | null;
};

export type ClaimAnchorRaison =
  /** Ancre trouvée. */
  | "ancree"
  /** Aucun champ cité ne porte d'ancre (brief legacy, chemin absent, verbatim non retrouvé). */
  | "aucun_champ_ancre"
  /** Champs de plusieurs sessions et récence inconnaissable → on préfère ne rien dire. */
  | "recence_inconnue";

export type ClaimAnchorResolution = {
  ancre: ClaimAnchor | null;
  raison: ClaimAnchorRaison;
  /** Vrai dès que les champs cités portaient PLUSIEURS enregistrements. */
  sessions_melangees: boolean;
  /** Les enregistrements rencontrés, dans l'ordre de citation. */
  sessions_citees: string[];
  /** Les chemins cités qui n'ont rien donné — utile au banc et au débogage. */
  champs_sans_ancre: string[];
};

export type ClaimAnchorOptions = {
  /**
   * Les sessions du dossier, ordonnées de la PLUS ANCIENNE à la PLUS RÉCENTE.
   * Indispensable dès qu'un brief fusionné est en jeu : c'est la seule manière
   * de savoir laquelle de deux sessions citées est la conversation courante.
   * Sur une session unique, l'omettre est sans effet.
   */
  sessionOrder?: readonly string[];
};

/**
 * Une phrase du récap, avec sa provenance résolue en code.
 *
 * La provenance est émise DEUX FOIS, et c'est voulu :
 *  · `ancre` — la forme explicite (présente / absente d'un coup d'œil) ;
 *  · `ancre_ms` / `ancre_session_id` à plat — le vocabulaire `Anchor` déjà porté
 *    par tous les champs du brief. Un seul vocabulaire de provenance dans le
 *    produit : ce que l'UI lit sur un champ, elle le lit pareil sur une phrase.
 *
 * Les deux clés à plat sont écrites explicitement, `null` compris : après passage,
 * une phrase DÉCLARE son état d'ancrage (« située » vs « pas située »), au lieu de
 * laisser l'affichage deviner — même discipline que `deriveTripBriefAnchors`.
 */
export type ResolvedNotesClaim = NotesClaim & {
  ancre_ms: number | null;
  ancre_session_id: string | null;
  ancre: ClaimAnchor | null;
  /** L'ancre a été choisie parmi des champs venus de plusieurs enregistrements. */
  sessions_melangees: boolean;
};

export type ResolvedNotesAgent = Omit<NotesAgent, "resume" | "ce_qui_compte" | "contraintes"> & {
  resume: ResolvedNotesClaim[];
  ce_qui_compte: ResolvedNotesClaim[];
  contraintes: ResolvedNotesClaim[];
};

/**
 * Où se lit, dans un vrai `TripBrief`, chaque chemin que le modèle a le droit de
 * citer.
 *
 * Depuis la correction de `CHAMPS_CITABLES` (2026-08-06), la liste citable EST
 * dérivée de `lib/extraction/trip-brief.ts` : ce pont est donc devenu une
 * **identité**. On le garde malgré tout, pour deux raisons qui valent son poids :
 * il rend la relation explicite et vérifiable par le banc, et son
 * `Record<ChampCitable, …>` exhaustif fait **échouer la compilation** dès que le
 * prompt et le schéma divergent — c'est exactement ce qui a fait remonter le
 * défaut initial au lieu de le laisser produire des ancres approximatives.
 *
 * `croisiere.*` mérite une note : le bloc vaut `null` quand ce n'est pas une
 * croisière, donc le chemin est simplement absent — la résolution l'ignore, elle
 * ne lève pas.
 */
export const CHAMPS_ANCRABLES: Readonly<Record<ChampCitable, readonly string[]>> = Object.fromEntries(
  CHAMPS_CITABLES.map((chemin) => [chemin, [chemin] as readonly string[]]),
) as Readonly<Record<ChampCitable, readonly string[]>>;

/**
 * Les chemins citables qui, par la FORME du `TripBrief`, ne peuvent porter aucune
 * ancre : leur nœud n'est pas un `Field<>` / `DateFloue`, il n'a donc ni verbatim
 * ni `ancre_ms`.
 *
 *  · `temps.itineraire` est une liste de `Segment` (origine/destination/date) ;
 *  · `budget.devise` est le littéral « CAD ».
 *
 * Ils restent CITABLES — une phrase a le droit de dire d'où elle tire un
 * itinéraire multi-villes ou une devise — mais elle s'affichera **sans** ancre
 * plutôt qu'avec celle d'un champ voisin (règle 3 : jamais d'ancre approchée).
 *
 * La liste est écrite en dur, et le banc vérifie qu'elle est EXACTEMENT l'ensemble
 * des chemins non-`Field<>` sur un brief complet. C'est ce qui la garde honnête :
 * la déduire de la forme la rendrait toujours « vraie », donc muette le jour où un
 * chemin citable cesse d'être ancrable sans que personne ne l'ait décidé.
 */
export const CHAMPS_SANS_PORTEUR: readonly ChampCitable[] = ["temps.itineraire", "budget.devise"];

type UnknownRecord = Record<string, unknown>;

function isRecord(valeur: unknown): valeur is UnknownRecord {
  return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);
}

/**
 * Lecture d'un chemin imbriqué, sûre face à un brief plus ancien où la branche
 * n'existe pas (`croisiere: null`, bloc absent, clé renommée) : `undefined`,
 * jamais une exception.
 */
function lireChemin(brief: TripBrief, chemin: string): unknown {
  return chemin.split(".").reduce<unknown>((noeud, segment) => {
    if (!isRecord(noeud)) return undefined;
    return noeud[segment];
  }, brief);
}

/** Un `Field<T>` ou une `DateFloue` — même critère qu'`anchor.ts`. */
function estChampLike(valeur: unknown): valeur is UnknownRecord {
  return isRecord(valeur) && "verbatim" in valeur && "valeur" in valeur && "statut" in valeur;
}

type Candidat = { ms: number; sessionId: string | null; chemin: string };

function lireCandidat(brief: TripBrief, cheminReel: string, cheminCite: string): Candidat | null {
  const noeud = lireChemin(brief, cheminReel);
  if (!estChampLike(noeud)) return null;

  const ms = noeud.ancre_ms;
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) return null;

  const sessionId = typeof noeud.ancre_session_id === "string" && noeud.ancre_session_id.length > 0
    ? noeud.ancre_session_id
    : null;

  return { ms: Math.round(ms), sessionId, chemin: cheminCite };
}

function plusPrecoce(candidats: Candidat[]): Candidat {
  return candidats.reduce((a, b) => (b.ms < a.ms ? b : a));
}

/**
 * L'ancre d'une phrase, à partir des champs qu'elle cite. Voir l'en-tête du
 * fichier pour les quatre règles ; ce corps ne fait que les appliquer.
 */
export function resolveClaimAnchor(
  brief: TripBrief,
  champs: readonly string[],
  options: ClaimAnchorOptions = {},
): ClaimAnchorResolution {
  const cites = [...new Set(champs)];
  const candidats: Candidat[] = [];
  const champsSansAncre: string[] = [];

  for (const cite of cites) {
    // Un chemin hors liste ne devrait jamais arriver ici (le schéma le refuse),
    // mais des notes relues depuis la base peuvent être plus anciennes que la
    // liste : on l'ignore, on ne devine pas.
    const cheminsReels = isChampCitable(cite) ? CHAMPS_ANCRABLES[cite] : [];
    const trouves = cheminsReels
      .map((cheminReel) => lireCandidat(brief, cheminReel, cite))
      .filter((candidat): candidat is Candidat => candidat !== null);

    if (trouves.length === 0) champsSansAncre.push(cite);
    else candidats.push(...trouves);
  }

  const sessionsCitees = [...new Set(candidats.map((c) => c.sessionId).filter((id): id is string => id !== null))];
  const melange = sessionsCitees.length > 1;

  if (candidats.length === 0) {
    return {
      ancre: null,
      raison: "aucun_champ_ancre",
      sessions_melangees: false,
      sessions_citees: [],
      champs_sans_ancre: champsSansAncre,
    };
  }

  // Une seule session (ou aucune session déclarée) : l'ancre la plus précoce.
  if (!melange) {
    // Si UN champ est attribué à un enregistrement, les ancres orphelines
    // (ms sans session) ne peuvent pas se comparer aux siennes : on ne garde que
    // les attribuées. Même arbitrage que `mergeSessionBriefs`, qui remet une
    // ancre orpheline à `null` plutôt que de la transporter.
    const session = sessionsCitees[0] ?? null;
    const retenus = session === null ? candidats : candidats.filter((c) => c.sessionId === session);
    const gagnant = plusPrecoce(retenus);
    return {
      ancre: { ancre_ms: gagnant.ms, ancre_session_id: session },
      raison: "ancree",
      sessions_melangees: false,
      sessions_citees: sessionsCitees,
      champs_sans_ancre: champsSansAncre,
    };
  }

  // Mélange de sessions : il faut la plus récente, et on ne l'invente pas.
  const ordre = options.sessionOrder ?? [];
  const rangs = new Map(ordre.map((id, index) => [id, index]));
  const inconnues = sessionsCitees.filter((id) => !rangs.has(id));
  if (inconnues.length > 0) {
    return {
      ancre: null,
      raison: "recence_inconnue",
      sessions_melangees: true,
      sessions_citees: sessionsCitees,
      champs_sans_ancre: champsSansAncre,
    };
  }

  const sessionRecente = sessionsCitees.reduce((a, b) => ((rangs.get(b) ?? -1) > (rangs.get(a) ?? -1) ? b : a));
  const gagnant = plusPrecoce(candidats.filter((c) => c.sessionId === sessionRecente));

  return {
    ancre: { ancre_ms: gagnant.ms, ancre_session_id: sessionRecente },
    raison: "ancree",
    sessions_melangees: true,
    sessions_citees: sessionsCitees,
    champs_sans_ancre: champsSansAncre,
  };
}

function resolveClaim(brief: TripBrief, claim: NotesClaim, options: ClaimAnchorOptions): ResolvedNotesClaim {
  const resolution = resolveClaimAnchor(brief, claim.champs, options);
  return {
    ...claim,
    ancre_ms: resolution.ancre?.ancre_ms ?? null,
    ancre_session_id: resolution.ancre?.ancre_session_id ?? null,
    ancre: resolution.ancre,
    sessions_melangees: resolution.sessions_melangees,
  };
}

/**
 * Pose l'ancre sur chaque phrase des trois sections citantes. Le titre, le cadre,
 * « à clarifier » et « prochaines étapes » n'en portent pas : ce ne sont pas des
 * affirmations sur ce qui s'est dit (le prompt ne leur demande d'ailleurs aucun
 * champ).
 */
export function resolveNotesAgentAnchors(
  brief: TripBrief,
  notes: NotesAgent,
  options: ClaimAnchorOptions = {},
): ResolvedNotesAgent {
  return {
    ...notes,
    resume: notes.resume.map((claim) => resolveClaim(brief, claim, options)),
    ce_qui_compte: notes.ce_qui_compte.map((claim) => resolveClaim(brief, claim, options)),
    contraintes: notes.contraintes.map((claim) => resolveClaim(brief, claim, options)),
  };
}

/** ⟨mm:ss⟩ — le format d'affichage des ancres du récap. */
export function formatAncre(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const secondes = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secondes).padStart(2, "0")}`;
}
