import type { Anchor } from "../extraction/trip-brief.ts";
import type { NotesAgent, NotesClaim } from "./types.ts";

type NotesClaimAnchored = NotesClaim & Anchor;

/** Plafonds d'AFFICHAGE (§6.2). Ils ne font pas confiance au modèle. */
const PLAFONDS = {
  resume: 4,
  ce_qui_compte: 4,
  contraintes: 4,
  a_clarifier: 5,
  prochaines_etapes: 4,
} as const;

/** Longueur maximale d'une ligne rendue. Au-delà, ce n'est plus une phrase. */
const LONGUEUR_MAX = 400;

function phrase(valeur: unknown): string | null {
  if (typeof valeur !== "string") return null;
  const propre = valeur.trim();
  if (propre.length === 0) return null;
  return propre.length > LONGUEUR_MAX ? propre.slice(0, LONGUEUR_MAX) : propre;
}

function lignes(valeur: unknown, plafond: number): string[] {
  if (!Array.isArray(valeur)) return [];
  const propres: string[] = [];
  for (const item of valeur) {
    const texte = phrase(item);
    if (texte && !propres.includes(texte)) propres.push(texte);
    if (propres.length >= plafond) break;
  }
  return propres;
}

function affirmations(valeur: unknown, plafond: number): NotesClaim[] {
  if (!Array.isArray(valeur)) return [];
  const propres: NotesClaim[] = [];
  for (const item of valeur) {
    if (!item || typeof item !== "object") continue;
    const source = item as Record<string, unknown>;
    const texte = phrase(source.texte);
    if (!texte) continue;

    const champs = Array.isArray(source.champs)
      ? source.champs.filter((chemin): chemin is string => typeof chemin === "string")
      : [];

    const claim: NotesClaimAnchored = { texte, champs };
    if (source.ancre_ms === null || typeof source.ancre_ms === "number") claim.ancre_ms = source.ancre_ms;
    if (source.ancre_session_id === null || typeof source.ancre_session_id === "string") claim.ancre_session_id = source.ancre_session_id;

    propres.push(claim);
    if (propres.length >= plafond) break;
  }
  return propres;
}

/**
 * Lit une réponse du générateur. `null` = rien d'affichable — ce qui est un
 * ÉCHEC honnête, pas un récap vide : l'écran doit alors proposer de régénérer,
 * pas faire semblant.
 */
export function parseNotesAgent(valeur: unknown): NotesAgent | null {
  if (!valeur || typeof valeur !== "object") return null;
  const source = valeur as Record<string, unknown>;

  const titre = phrase(source.titre);
  const resume = affirmations(source.resume, PLAFONDS.resume);
  const ce_qui_compte = affirmations(source.ce_qui_compte, PLAFONDS.ce_qui_compte);
  const contraintes = affirmations(source.contraintes, PLAFONDS.contraintes);
  const a_clarifier = lignes(source.a_clarifier, PLAFONDS.a_clarifier);
  const prochaines_etapes = lignes(source.prochaines_etapes, PLAFONDS.prochaines_etapes);

  // Un récap sans titre NI résumé ne dit rien de la conversation : il ne mérite
  // pas l'écran, même si les autres sections sont remplies.
  if (!titre && resume.length === 0) return null;

  return {
    version: typeof source.version === "string" && source.version.trim() ? source.version.trim() : "inconnue",
    titre: titre ?? "",
    cadre: phrase(source.cadre),
    resume,
    ce_qui_compte,
    contraintes,
    a_clarifier,
    prochaines_etapes,
  };
}
