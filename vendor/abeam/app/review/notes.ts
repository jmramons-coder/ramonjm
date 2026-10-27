/**
 * Resolve displayed note claims against their source conversation and timestamp.
 * The server's explicit anchor decision, including null, takes precedence.
 * Network parsing and display caps live in lib/notes-agent/parse.ts.
 */

import { hasAncre } from "../../lib/ui/provenance.ts";
import type { Anchor, TripBrief } from "@/lib/extraction/trip-brief";
import type { NotesClaim } from "@/lib/notes-agent/types";

/**
 * Le contrat élargi : un générateur qui résout l'ancre côté serveur la pose sur
 * la phrase. Les clés sont OPTIONNELLES — l'UI n'en dépend pas, elle sait
 * hériter. (Même forme que `Anchor` sur les champs du brief : un seul vocabulaire
 * de provenance dans tout le produit.)
 */
type NotesClaimAnchored = NotesClaim & Anchor;

/** Ce qu'il faut pour afficher une provenance : le moment, son enregistrement, sa preuve. */
export type ClaimAnchor = {
  ancreMs: number | null;
  ancreSessionId: string | null;
  verbatim: string | null;
};

/** Tout porteur d'ancre du brief : `Field<T>` comme `DateFloue` en sont. */
type Ancrable = Anchor & { verbatim: string | null };

/**
 * Il n'y a PAS de table d'alias ici, et il n'en faut pas.
 *
 * Elle a existé parce que `CHAMPS_CITABLES` contenait des chemins qui n'étaient
 * pas ceux du `TripBrief` (`voyageurs.chambres`, `preferences.*`…). La liste a
 * été corrigée à la source le 2026-08-06 : un chemin cité EST un chemin réel, et
 * le schéma fermé de la route rejette tout le reste. Un simple parcours suffit
 * donc — et deux tables de correspondance auraient été deux vérités à maintenir.
 *
 * `CHAMPS_CITABLES` n'est pas importé pour autant : ce serait embarquer le texte
 * complet du prompt dans le bundle client pour rien.
 */

/**
 * Le porteur d'ancre au bout d'un chemin, ou `null`.
 *
 * `null` couvre trois cas qui se comportent pareil à l'écran (aucune pastille) :
 * le chemin ne mène nulle part, il mène à une constante de session
 * (`meta.nature_conversation`, `budget.devise`), ou il mène à une liste de
 * segments (`temps.itineraire`) qui ne porte pas d'ancre au schéma. Aucun de ces
 * cas ne doit fabriquer une ancre : mieux vaut pas de pastille qu'un faux
 * timecode (loi 4).
 */
function porteur(brief: TripBrief, chemin: string): Ancrable | null {
  let courant: unknown = brief;
  for (const segment of chemin.split(".")) {
    if (!courant || typeof courant !== "object") return null;
    courant = (courant as Record<string, unknown>)[segment];
  }
  if (!courant || typeof courant !== "object" || Array.isArray(courant)) return null;

  // Un porteur d'ancre est un `Field` ou un `DateFloue` : les deux ont un statut
  // et un verbatim. Tout le reste du brief n'en est pas un.
  const candidat = courant as Record<string, unknown>;
  if (typeof candidat.statut !== "string" || !("verbatim" in candidat)) return null;

  return {
    verbatim: typeof candidat.verbatim === "string" ? candidat.verbatim : null,
    ancre_ms: typeof candidat.ancre_ms === "number" ? candidat.ancre_ms : null,
    ancre_session_id: typeof candidat.ancre_session_id === "string" ? candidat.ancre_session_id : null,
  };
}

const SANS_ANCRE: ClaimAnchor = { ancreMs: null, ancreSessionId: null, verbatim: null };

/**
 * L'ancre d'une affirmation.
 *
 * Quand une phrase cite plusieurs champs ancrés, on retient le **plus tôt dit** :
 * c'est le moment où le sujet est apparu dans la conversation, donc l'endroit
 * d'où une agente veut réécouter. Le verbatim retenu est celui de ce champ-là —
 * l'infobulle montre exactement ce qui a été entendu à cette seconde.
 */
export function resolveClaimAnchor(claim: NotesClaim, brief: TripBrief): ClaimAnchor {
  const ancres = claim.champs
    .map((chemin) => porteur(brief, chemin))
    .filter((porteur): porteur is Ancrable => porteur !== null && hasAncre(porteur.ancre_ms))
    .sort((a, b) => (a.ancre_ms ?? 0) - (b.ancre_ms ?? 0));

  const resolue = claim as NotesClaimAnchored;

  // LE SERVEUR EST SEUL JUGE DE L'ANCRE.
  //
  // `lib/notes-agent/anchors.ts` écrit `ancre_ms` EXPLICITEMENT, `null` compris :
  // la présence de la clé signifie « j'ai tranché ». Et son `null` est parfois un
  // refus MOTIVÉ — le cas « champs venus de deux conversations dont la récence
  // est inconnaissable », où pointer le mauvais enregistrement serait pire que ne
  // rien pointer. Redériver ici afficherait précisément l'ancre que le serveur
  // vient d'écarter. On ne redérive donc jamais quand la clé est là ; on se
  // contente d'aller chercher le verbatim (que le serveur n'envoie pas) pour
  // l'infobulle, en le prenant sur le champ cité dont l'ancre coïncide.
  if ("ancre_ms" in resolue) {
    if (!hasAncre(resolue.ancre_ms)) return SANS_ANCRE;
    const jumelle = ancres.find((porteur) => porteur.ancre_ms === resolue.ancre_ms) ?? null;
    return {
      ancreMs: resolue.ancre_ms,
      ancreSessionId: resolue.ancre_session_id ?? jumelle?.ancre_session_id ?? null,
      verbatim: jumelle?.verbatim ?? null,
    };
  }

  // Clé absente = cette note n'est jamais passée par le résolveur (récap plus
  // ancien, note reconstruite localement). Là seulement, on hérite du champ cité
  // le plus tôt dit — sur un brief de session, il n'y a qu'un enregistrement,
  // donc pas d'ambiguïté possible.
  const premiere = ancres[0];
  if (!premiere || !hasAncre(premiere.ancre_ms)) return SANS_ANCRE;
  return {
    ancreMs: premiere.ancre_ms,
    ancreSessionId: premiere.ancre_session_id ?? null,
    verbatim: premiere.verbatim,
  };
}

/* ── Lecture défensive de la réponse du générateur ────────────────────────── */
