/**
 * REGISTRE DES PASSES (T5 du design sheet v2).
 *
 * Une passe = un extracteur supplémentaire qu'une agente lance À LA DEMANDE sur
 * une conversation sauvegardée. Elle déclare :
 *   - son identité (`id`, `titre` FR, `description` FR courte, coût indicatif) ;
 *   - son GATE : les champs du `TripBrief` sans lesquels elle n'a pas de sens.
 *     Même logique que les gates de complétude de `regles-curation-notifications.md`
 *     §1 : pas d'inputs → pas d'expédition. Une passe qui n'a pas ses entrées ne
 *     s'exécute PAS et explique ce qui manque (et quoi demander au client) ;
 *   - la forme de sa sortie (schéma Zod) et sa garde de sortie ;
 *   - son prompt versionné (`lib/passes/prompts.ts`).
 *
 * Fichier PUR : aucune clé, aucun appel réseau, pas de `server-only`. Il est donc
 * lisible par le banc hors-ligne `scripts/check-passes.ts` et par l'UI (W5) pour
 * afficher le catalogue. L'exécution vit dans `lib/passes/run.ts`.
 */

import { z } from "zod";

import type { SessionMeta, TripBrief } from "../extraction/trip-brief";
import {
  buildChecklistDocumentsPrompt,
  buildFicheSoumissionPrompt,
  buildRelanceJ7Prompt,
  CHECKLIST_DOCUMENTS_PROMPT_VERSION,
  FICHE_SOUMISSION_PROMPT_VERSION,
  RELANCE_J7_PROMPT_VERSION,
  type PassePromptInput,
} from "./prompts.ts";

export const PASSE_MODEL_ID = "gpt-4.1-mini";

export const PASSE_IDS = ["fiche-soumission", "checklist-documents", "relance-j7"] as const;
export type PasseId = (typeof PASSE_IDS)[number];

type Nature = SessionMeta["nature_conversation"];

/** `interne` = document de travail pour l'agente. `brouillon_client` = texte destiné au client, éditable, JAMAIS envoyé par la passe. */
export type Livrable = "interne" | "brouillon_client";

/**
 * Une exigence de gate est remplie si AU MOINS UN de ses `chemins` porte une
 * valeur captée. Plusieurs chemins = plusieurs façons acceptables de savoir la
 * même chose (« où » = destination OU région OU hôtel nommé).
 */
export type ExigenceGate = {
  chemins: readonly string[];
  /** Ce qui manque, en français, du point de vue de l'agente. */
  libelle: string;
  /** La question à poser au client pour débloquer (esprit nudge : on souffle, on ne pousse pas). */
  demande: string;
};

export type GateManque = {
  /** Chemin(s) du TripBrief concerné(s), pour l'UI et le débogage. */
  champ: string;
  libelle: string;
  demande: string;
};

export type GateVerdict = { ok: boolean; manquant: GateManque[] };

export type PasseDefinition = {
  id: PasseId;
  titre: string;
  description: string;
  livrable: Livrable;
  /** Natures de conversation où la passe a du sens (une passe soumission sur un « hors_sujet » n'en a pas). */
  naturesAcceptees: readonly Nature[];
  gate: readonly ExigenceGate[];
  promptVersion: string;
  schema: z.ZodType;
  schemaName: string;
  schemaDescription: string;
  buildPrompt: (input: PassePromptInput) => string;
  /**
   * Garde de sortie : vérifie EN CODE les garde-fous qu'un prompt seul ne peut
   * pas garantir (ex. l'avertissement obligatoire de la checklist). Reçoit une
   * valeur déjà validée par `schema`. Retourne la liste des manquements.
   */
  garde: (donnees: unknown) => string[];
  /** Coût annoncé à l'agente avant de lancer (motif Fireflies « Run » + coût). */
  cout: { appelsModele: number; modele: string; appelsRecherche: number };
};

export type PasseResultat = {
  passeId: PasseId;
  titre: string;
  livrable: Livrable;
  promptVersion: string;
  modele: string;
  /** ISO. */
  genereLe: string;
  /** Invariant du produit : une passe ne transmet jamais rien à personne. */
  envoiAutomatique: false;
  donnees: unknown;
};

// ─────────────────────────────────────────────────────────────────────────────
// Lecture d'un TripBrief par chemin (Field, DateFloue ou valeur nue)
// ─────────────────────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Résout `"lieu.destinations"` sur un brief. `undefined` = chemin inexistant (bug de registre). */
export function lireChemin(brief: TripBrief, chemin: string): unknown {
  return chemin.split(".").reduce<unknown>((noeud, segment) => {
    if (!isRecord(noeud)) return undefined;
    return noeud[segment];
  }, brief);
}

function valeurNonVide(valeur: unknown): boolean {
  if (valeur === null || valeur === undefined) return false;
  if (typeof valeur === "string") return valeur.trim().length > 0;
  if (Array.isArray(valeur)) return valeur.length > 0;
  return true;
}

/**
 * Un champ compte comme capté si son statut n'est pas « manquant » ET qu'il
 * porte quelque chose d'exploitable. Les statuts « incertain » et
 * « contradiction » comptent : ils ont une valeur, à faire valider — c'est
 * justement le travail d'une passe de le signaler.
 *
 * CAS DES DATES FLOUES : en production, « en mars » arrive avec `valeur: null`,
 * `precision: "mois"` et le verbatim (voir `lib/live/live-brief.ts`). C'est une
 * information CAPTÉE, pas un trou : une fiche de soumission doit pouvoir écrire
 * « mars, précision : mois ». On l'accepte donc sur precision + verbatim.
 */
export function estCapte(brief: TripBrief, chemin: string): boolean {
  const noeud = lireChemin(brief, chemin);
  if (noeud === undefined) return false;
  if (isRecord(noeud) && "statut" in noeud) {
    if (noeud.statut === "manquant") return false;
    if (valeurNonVide(noeud.valeur)) return true;
    const dateFloue = "precision" in noeud;
    return dateFloue && valeurNonVide(noeud.precision) && valeurNonVide(noeud.verbatim);
  }
  return valeurNonVide(noeud);
}

/**
 * Champs suivis pour l'état de captation injecté dans les prompts : ce qu'une
 * agente a besoin de savoir pour monter une soumission ou relancer un client.
 * Le libellé est en français — c'est ce que le modèle a le droit d'écrire quand
 * il nomme un trou.
 */
export const CHAMPS_SUIVIS: ReadonlyArray<{ chemin: string; libelle: string }> = [
  { chemin: "meta.source_demande", libelle: "source de la demande" },
  { chemin: "voyageurs.adultes", libelle: "nombre d'adultes" },
  { chemin: "voyageurs.enfants_ages", libelle: "âges des enfants" },
  { chemin: "voyageurs.nombre_chambres", libelle: "nombre de chambres" },
  { chemin: "voyageurs.type_groupe", libelle: "type de groupe" },
  { chemin: "voyageurs.composition", libelle: "composition du groupe" },
  { chemin: "lieu.origine", libelle: "ville de départ" },
  { chemin: "lieu.destinations", libelle: "destination" },
  { chemin: "lieu.region", libelle: "région" },
  { chemin: "lieu.hotel_nomme", libelle: "hôtel nommé" },
  { chemin: "temps.depart", libelle: "date de départ" },
  { chemin: "temps.retour", libelle: "date de retour" },
  { chemin: "temps.duree", libelle: "durée du séjour" },
  { chemin: "temps.flexibilite", libelle: "flexibilité des dates" },
  { chemin: "type_voyage.type", libelle: "type de voyage" },
  { chemin: "type_voyage.composantes", libelle: "composantes à réserver" },
  { chemin: "vols.classe", libelle: "classe de vol" },
  { chemin: "vols.bagages_soute", libelle: "bagages en soute" },
  { chemin: "vols.correspondances", libelle: "correspondances" },
  { chemin: "hebergement.type_hebergement", libelle: "type d'hébergement" },
  { chemin: "hebergement.niveau_confort", libelle: "niveau de confort" },
  { chemin: "hebergement.plan_repas", libelle: "plan repas" },
  { chemin: "hebergement.localisation", libelle: "localisation souhaitée" },
  { chemin: "motivation.motivations", libelle: "motivations du voyage" },
  { chemin: "motivation.ambiance", libelle: "ambiance recherchée" },
  { chemin: "motivation.occasion", libelle: "occasion spéciale" },
  { chemin: "budget.total", libelle: "budget total" },
  { chemin: "budget.par_personne", libelle: "budget par personne" },
  { chemin: "services.elements_importants", libelle: "éléments importants" },
  { chemin: "services.elements_a_eviter", libelle: "éléments à éviter" },
  { chemin: "contraintes.mobilite_sante", libelle: "mobilité ou santé" },
  { chemin: "contraintes.restrictions_alimentaires", libelle: "restrictions alimentaires" },
  { chemin: "assurance.statut_assurance", libelle: "assurance voyage" },
  { chemin: "decision.raison_hesitation", libelle: "raison d'hésitation" },
];

/** Partage les champs suivis en captés / absents, en libellés FR. */
export function etatCaptation(brief: TripBrief): { captes: string[]; manquants: string[] } {
  const captes: string[] = [];
  const manquants: string[] = [];
  for (const champ of CHAMPS_SUIVIS) {
    (estCapte(brief, champ.chemin) ? captes : manquants).push(champ.libelle);
  }
  return { captes, manquants };
}

// ─────────────────────────────────────────────────────────────────────────────
// Schémas de sortie
// ─────────────────────────────────────────────────────────────────────────────

const ficheSoumissionSchema = z.object({
  titre: z.string(),
  voyageurs: z.string(),
  periode: z.string(),
  destinations: z.array(z.string()),
  type_voyage: z.string(),
  budget: z.string(),
  contraintes: z.array(z.string()),
  preferences: z.array(z.string()),
  a_confirmer: z.array(z.string()),
  points_de_vigilance: z.array(z.string()),
});

const checklistDocumentsSchema = z.object({
  contexte: z.string(),
  items: z.array(
    z.object({
      document: z.string(),
      qui: z.string(),
      a_verifier: z.string(),
      source_a_consulter: z.string(),
    }),
  ),
  manque_pour_preciser: z.array(z.string()),
  avertissement: z.string(),
});

const relanceJ7Schema = z.object({
  objet: z.string(),
  corps: z.string(),
  points_a_valider: z.array(z.string()),
});

export type FicheSoumission = z.infer<typeof ficheSoumissionSchema>;
export type ChecklistDocuments = z.infer<typeof checklistDocumentsSchema>;
export type RelanceJ7 = z.infer<typeof relanceJ7Schema>;

/**
 * Fabrique une définition : le `garde` est typé à l'écriture (sur la sortie du
 * schéma) puis exposé en `(donnees: unknown) => string[]`. Le cast est sûr parce
 * que `run.ts` n'appelle `garde` QUE sur une valeur déjà validée par `schema`.
 */
function definirPasse<S extends z.ZodType>(
  def: Omit<PasseDefinition, "schema" | "garde"> & {
    schema: S;
    garde: (donnees: z.output<S>) => string[];
  },
): PasseDefinition {
  const { garde, ...reste } = def;
  return { ...reste, garde: (donnees: unknown) => garde(donnees as z.output<S>) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Les trois passes
// ─────────────────────────────────────────────────────────────────────────────

const PLANIFICATION: readonly Nature[] = ["planification"];

const ficheSoumission = definirPasse({
  id: "fiche-soumission",
  titre: "Fiche de soumission",
  description: "La fiche de travail interne pour monter une soumission : voyageurs, dates, destinations, budget, contraintes, préférences et ce qui reste à confirmer.",
  livrable: "interne",
  naturesAcceptees: PLANIFICATION,
  gate: [
    {
      chemins: ["voyageurs.adultes", "voyageurs.type_groupe", "voyageurs.composition"],
      libelle: "qui voyage (nombre d'adultes, type de groupe ou composition)",
      demande: "Vous seriez combien de personnes à partir ?",
    },
    {
      chemins: ["lieu.destinations", "lieu.region", "lieu.hotel_nomme"],
      libelle: "où (destination, région ou hôtel nommé)",
      demande: "Vous avez une destination ou une région en tête ?",
    },
  ],
  promptVersion: FICHE_SOUMISSION_PROMPT_VERSION,
  schema: ficheSoumissionSchema,
  schemaName: "FicheSoumission",
  schemaDescription: "Fiche de travail interne pour monter une soumission voyage.",
  buildPrompt: buildFicheSoumissionPrompt,
  garde: (donnees) => {
    const manquements: string[] = [];
    if (!donnees.titre.trim()) manquements.push("Le titre de la fiche est vide.");
    if (!donnees.voyageurs.trim()) manquements.push("La ligne voyageurs est vide.");
    if (!donnees.periode.trim()) manquements.push("La ligne période est vide.");
    return manquements;
  },
  cout: { appelsModele: 1, modele: PASSE_MODEL_ID, appelsRecherche: 0 },
});

const checklistDocuments = definirPasse({
  id: "checklist-documents",
  titre: "Checklist documents",
  description: "Aide-mémoire des documents à vérifier (passeport, visa, assurance, profil des voyageurs). Signale ce qui doit être validé aux sources officielles — ne fait pas autorité.",
  livrable: "interne",
  naturesAcceptees: PLANIFICATION,
  gate: [
    {
      chemins: ["lieu.destinations", "lieu.region", "lieu.hotel_nomme"],
      libelle: "la destination (pays, région ou hôtel nommé)",
      demande: "On parle de quel pays exactement ?",
    },
    {
      chemins: ["voyageurs.adultes", "voyageurs.composition", "voyageurs.type_groupe", "voyageurs.enfants_ages"],
      libelle: "le profil des voyageurs (nombre, âges ou composition)",
      demande: "Qui voyage — des adultes seulement, ou des enfants aussi ?",
    },
  ],
  promptVersion: CHECKLIST_DOCUMENTS_PROMPT_VERSION,
  schema: checklistDocumentsSchema,
  schemaName: "ChecklistDocuments",
  schemaDescription: "Aide-mémoire des documents de voyage à vérifier, avec avertissement de non-autorité.",
  buildPrompt: buildChecklistDocumentsPrompt,
  garde: (donnees) => {
    const manquements: string[] = [];
    // L'avertissement de non-autorité est un invariant produit : on ne le laisse
    // pas dépendre de la bonne volonté du modèle.
    if (donnees.avertissement.trim().length < 40) {
      manquements.push("L'avertissement de non-autorité est absent ou trop court.");
    }
    if (donnees.items.length === 0) {
      manquements.push("Aucun point de vérification produit.");
    }
    const sansSource = donnees.items.filter((item) => !item.source_a_consulter.trim());
    if (sansSource.length > 0) {
      manquements.push(`${sansSource.length} point(s) de vérification sans source à consulter.`);
    }
    const sansAction = donnees.items.filter((item) => !item.a_verifier.trim());
    if (sansAction.length > 0) {
      manquements.push(`${sansAction.length} point(s) sans action de vérification.`);
    }
    return manquements;
  },
  cout: { appelsModele: 1, modele: PASSE_MODEL_ID, appelsRecherche: 0 },
});

const relanceJ7 = definirPasse({
  id: "relance-j7",
  titre: "Relance J+7",
  description: "Brouillon de courriel de relance pour une conversation restée sans suite, avec tact sur la raison d'hésitation si elle a été captée. Éditable, jamais envoyé.",
  livrable: "brouillon_client",
  naturesAcceptees: PLANIFICATION,
  gate: [
    {
      chemins: ["lieu.destinations", "lieu.region", "type_voyage.type"],
      libelle: "l'objet du projet (destination, région ou type de voyage)",
      demande: "Est-ce qu'on repart de la même idée de voyage, ou ça a changé ?",
    },
    {
      chemins: ["voyageurs.adultes", "voyageurs.type_groupe", "voyageurs.composition", "temps.depart", "temps.duree"],
      libelle: "un repère concret sur le voyage (voyageurs ou période)",
      demande: "Vous visiez quelle période, et vous seriez combien ?",
    },
  ],
  promptVersion: RELANCE_J7_PROMPT_VERSION,
  schema: relanceJ7Schema,
  schemaName: "RelanceJ7",
  schemaDescription: "Brouillon de courriel de relance à J+7, en français, jamais envoyé automatiquement.",
  buildPrompt: buildRelanceJ7Prompt,
  garde: (donnees) => {
    const manquements: string[] = [];
    if (!donnees.objet.trim()) manquements.push("L'objet du courriel est vide.");
    if (donnees.corps.trim().length < 120) manquements.push("Le corps du courriel est vide ou trop court.");
    if (donnees.points_a_valider.length === 0) {
      manquements.push("Aucun point à valider avant envoi : un brouillon doit dire ce que l'agente doit relire.");
    }
    return manquements;
  },
  cout: { appelsModele: 1, modele: PASSE_MODEL_ID, appelsRecherche: 0 },
});

export const PASSES: Readonly<Record<PasseId, PasseDefinition>> = {
  "fiche-soumission": ficheSoumission,
  "checklist-documents": checklistDocuments,
  "relance-j7": relanceJ7,
};

export function listPasses(): PasseDefinition[] {
  return PASSE_IDS.map((id) => PASSES[id]);
}

export function isPasseId(value: unknown): value is PasseId {
  return typeof value === "string" && (PASSE_IDS as readonly string[]).includes(value);
}

export function getPasse(id: PasseId): PasseDefinition {
  return PASSES[id];
}

// ─────────────────────────────────────────────────────────────────────────────
// Le gate
// ─────────────────────────────────────────────────────────────────────────────

const LIBELLE_NATURE: Record<Nature, string> = {
  planification: "planification",
  info: "demande d'information",
  hors_sujet: "hors sujet",
};

/**
 * Vérifie qu'une passe a ses entrées. Aucune exécution si le verdict est
 * négatif : on rend la liste de ce qui manque et la question à poser.
 */
export function evaluateGate(passe: PasseDefinition, brief: TripBrief): GateVerdict {
  const manquant: GateManque[] = [];

  const nature = brief.meta?.nature_conversation;
  if (nature && !passe.naturesAcceptees.includes(nature)) {
    manquant.push({
      champ: "meta.nature_conversation",
      libelle: `une conversation de planification (nature captée : ${LIBELLE_NATURE[nature] ?? nature})`,
      demande: "Cette conversation n'est pas un projet de voyage : rien à produire ici.",
    });
  }

  for (const exigence of passe.gate) {
    const satisfaite = exigence.chemins.some((chemin) => estCapte(brief, chemin));
    if (!satisfaite) {
      manquant.push({
        champ: exigence.chemins.join(" | "),
        libelle: exigence.libelle,
        demande: exigence.demande,
      });
    }
  }

  return { ok: manquant.length === 0, manquant };
}
