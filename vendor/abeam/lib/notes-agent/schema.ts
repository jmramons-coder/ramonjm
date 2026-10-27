/**
 * SCHÉMA DU RÉCAP INTERNE — la forme de `NotesAgent`, rendue OPPOSABLE.
 *
 * Le prompt (`prompt.ts`) demande des plafonds de longueur, des sections courtes
 * et des champs cités pris dans une liste fermée. Un prompt *demande* ; un schéma
 * *refuse*. Tout ce qui protège l'écran de l'agente est donc ici, en code :
 *
 *  · `titre` ≤ 90 caractères, chaque ligne ≤ 200 (une phrase, pas un paragraphe) ;
 *  · `resume` de 2 à 4 entrées — en dessous ce n'est pas un récap, au-dessus ce
 *    n'est plus lisible en dix secondes ;
 *  · `ce_qui_compte`/`contraintes` ≤ 4, `a_clarifier` ≤ 5, `prochaines_etapes` ≤ 4 ;
 *  · `champs` restreint à `CHAMPS_CITABLES` et non vide. C'est le point dur : un
 *    chemin inventé doit être un ÉCHEC DE VALIDATION, pas une ancre morte sous
 *    une phrase. Une affirmation sans champ citable ne doit pas être écrite
 *    (§6.1bis : la provenance est ce qui permet de retirer le schéma de l'écran).
 *
 * Répartition schéma / garde, calquée sur `lib/passes/registry.ts` : le SCHÉMA
 * porte ce qui est représentable en JSON Schema (formes, plafonds, listes
 * fermées) — donc ce que le fournisseur peut contraindre à la source ; la GARDE
 * (`gardeNotesAgent`) porte les règles rédactionnelles, appliquées après coup et
 * renvoyées au modèle en correction. Aucune règle ne repose sur l'espoir.
 *
 * Fichier PUR : pas de `server-only`, aucun appel réseau. Il est donc lisible par
 * le banc hors-ligne `scripts/check-notes-agent.ts` comme par l'exécuteur.
 *
 * `version` n'est PAS demandée au modèle (elle n'est pas dans le contrat JSON du
 * prompt) : elle est estampillée en code par `run.ts`. D'où deux schémas —
 * `notesAgentOutputSchema` (ce que le modèle rend) et `notesAgentSchema` (le
 * livrable complet, tel que `types.ts` le décrit).
 */

import { z } from "zod";

import { CHAMPS_CITABLES } from "./prompt.ts";
import type { NotesAgent, NotesClaim } from "./types";

/**
 * Les plafonds, en un seul endroit : le banc les cite, l'UI peut les afficher,
 * et le jour où le prompt change de chiffre, il n'y a qu'un endroit à corriger.
 */
export const NOTES_LIMITES = {
  /** « Voyage de noces dans le Sud, en janvier » tient largement dedans. */
  titre: 90,
  /** Le cadre est une étiquette de lecture (« Première prise de contact »). */
  cadre: 120,
  /** Une ligne = une phrase. Le prompt le dit, le schéma le fait respecter. */
  ligne: 200,
  resumeMin: 2,
  resumeMax: 4,
  ceQuiCompteMax: 4,
  contraintesMax: 4,
  aClarifierMax: 5,
  prochainesEtapesMax: 4,
} as const;

function phrase(max: number, quoi: string) {
  return z
    .string()
    .min(1, `${quoi} : ne peut pas être vide (une section vide reste vide, elle ne se remplit pas).`)
    .max(max, `${quoi} : ${max} caractères maximum.`);
}

/** Un chemin de champ citable. Liste FERMÉE — voir `CHAMPS_CITABLES`. */
export const champCitableSchema = z.enum(CHAMPS_CITABLES);
export type ChampCitable = z.infer<typeof champCitableSchema>;

export function isChampCitable(valeur: unknown): valeur is ChampCitable {
  return champCitableSchema.safeParse(valeur).success;
}

/**
 * Une affirmation + sa provenance. `min(1)` sur `champs` est la règle « une ligne
 * dont tu ne peux citer aucun champ, tu ne l'écris pas » : sans elle, le modèle
 * peut affirmer sans que l'agente puisse vérifier.
 */
export const notesClaimSchema = z.object({
  texte: phrase(NOTES_LIMITES.ligne, "texte"),
  champs: z
    .array(champCitableSchema)
    .min(1, "champs : une affirmation doit citer au moins un champ du brief (sinon elle ne s'écrit pas).")
    .max(CHAMPS_CITABLES.length),
});

/** Ce que le MODÈLE rend : la forme du contrat JSON de `buildNotesAgentPrompt`. */
export const notesAgentOutputSchema = z.object({
  titre: phrase(NOTES_LIMITES.titre, "titre"),
  cadre: phrase(NOTES_LIMITES.cadre, "cadre").nullable(),
  resume: z.array(notesClaimSchema).min(NOTES_LIMITES.resumeMin).max(NOTES_LIMITES.resumeMax),
  ce_qui_compte: z.array(notesClaimSchema).max(NOTES_LIMITES.ceQuiCompteMax),
  contraintes: z.array(notesClaimSchema).max(NOTES_LIMITES.contraintesMax),
  a_clarifier: z.array(phrase(NOTES_LIMITES.ligne, "a_clarifier")).max(NOTES_LIMITES.aClarifierMax),
  prochaines_etapes: z.array(phrase(NOTES_LIMITES.ligne, "prochaines_etapes")).max(NOTES_LIMITES.prochainesEtapesMax),
});

/** Le livrable complet, estampillé. */
export const notesAgentSchema = notesAgentOutputSchema.extend({
  version: z.string().min(1),
});

export type NotesAgentOutput = z.infer<typeof notesAgentOutputSchema>;
export type NotesAgentValide = z.infer<typeof notesAgentSchema>;

/**
 * Alignement au caractère près sur `types.ts` : ces deux alias ne valent que
 * `true`. Si `NotesAgent` ou `NotesClaim` bouge sans que le schéma suive, la
 * compilation casse ici — pas en production, sous une phrase, avec une ancre qui
 * ne résout plus.
 */
export type NotesClaimAligne = z.infer<typeof notesClaimSchema> extends NotesClaim ? true : never;
export type NotesAgentAligne = NotesAgentValide extends NotesAgent ? true : never;

/**
 * Un mot d'énumération brut (« tout_inclus », « mobilite_sante ») dans une phrase
 * française est la signature du schéma qui remonte à l'écran — exactement ce que
 * la loi 9 interdit. Le français n'utilise pas le tiret bas : le refuser ne coûte
 * aucun faux positif, et rattrape la fuite que le prompt ne peut que déconseiller.
 */
const CLE_TECHNIQUE = /[a-zà-ÿ]{2,}_[a-zà-ÿ]{2,}/i;

/**
 * Le remplissage : « rien à signaler », « aucune contrainte connue », « n/a »,
 * un tiret seul. Loi 4 — rien à dire, rien d'affiché. Une section vide doit
 * rester un TABLEAU VIDE, jamais une ligne qui ressemble à du contenu.
 */
const REMPLISSAGE = [
  /^[-–—•.\s]*$/,
  /^n\s*\/?\s*a$/i,
  /^(aucun|aucune|rien|non\s+applicable|sans\s+objet|non\s+renseign)/i,
  /^(pas\s+(de|d'))/i,
  /^(à\s+déterminer|a\s+determiner|inconnu|indéterminé|indetermine)/i,
];

function estRemplissage(ligne: string) {
  const texte = ligne.trim();
  return REMPLISSAGE.some((motif) => motif.test(texte));
}

/**
 * GARDE DE SORTIE — ce qu'un schéma JSON ne sait pas dire. Rend la liste des
 * manquements (vide = conforme), pour que `run.ts` la renvoie au modèle en
 * correction plutôt que d'afficher une note qui trahit la loi 9 ou la loi 4.
 */
export function gardeNotesAgent(notes: NotesAgentOutput): string[] {
  const manquements: string[] = [];

  const lignes: Array<{ ou: string; texte: string }> = [
    { ou: "titre", texte: notes.titre },
    ...(notes.cadre === null ? [] : [{ ou: "cadre", texte: notes.cadre }]),
    ...notes.resume.map((claim, i) => ({ ou: `resume[${i}]`, texte: claim.texte })),
    ...notes.ce_qui_compte.map((claim, i) => ({ ou: `ce_qui_compte[${i}]`, texte: claim.texte })),
    ...notes.contraintes.map((claim, i) => ({ ou: `contraintes[${i}]`, texte: claim.texte })),
    ...notes.a_clarifier.map((texte, i) => ({ ou: `a_clarifier[${i}]`, texte })),
    ...notes.prochaines_etapes.map((texte, i) => ({ ou: `prochaines_etapes[${i}]`, texte })),
  ];

  for (const { ou, texte } of lignes) {
    if (CLE_TECHNIQUE.test(texte)) {
      manquements.push(`${ou} : clé technique du schéma dans une phrase française (« ${texte.trim()} »). Écris ce que la chose est.`);
    }
    if (estRemplissage(texte)) {
      manquements.push(`${ou} : ligne de remplissage (« ${texte.trim()} »). Une section vide reste un tableau vide.`);
    }
  }

  return manquements;
}

/**
 * Message d'échec lisible, dans le style de `lib/passes/run.ts` : on nomme le
 * chemin et la raison, parce que c'est ce qui repart au modèle en correction.
 */
export function decrireEchec(erreur: z.ZodError): string {
  return erreur.issues
    .slice(0, 5)
    .map((issue) => `${issue.path.join(".") || "(racine)"}: ${issue.message}`)
    .join(" ; ");
}
