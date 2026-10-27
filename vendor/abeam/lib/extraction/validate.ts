// Import relatif avec extension explicite (même convention que lib/live/live-brief.ts)
// pour que ce module reste chargeable tel quel par les bancs `node scripts/*.ts`.
import { STATUTS, type TripBrief } from "./trip-brief.ts";

type UnknownRecord = Record<string, unknown>;

const NATURES = ["planification", "info", "hors_sujet"] as const;
const LANGUES = ["fr", "en"] as const;
const PRECISIONS = ["jour", "mois", "saison"] as const;
const SOURCE_DEMANDE = ["courriel", "telephone", "site_web", "feuille_demande", "walk_in", "reference_client", "salon_evenement", "client_repeat"] as const;
const TYPE_GROUPE = ["solo", "couple", "famille", "groupe"] as const;
const REGIONS = ["afrique_subsaharienne", "amerique_nord", "amerique_sud_centrale", "asie", "destination_soleil", "europe", "maghreb_moyen_orient", "oceanie_pacifique_sud"] as const;
const DUREES = ["moins_7j", "sept_j", "dix_j", "quatorze_j", "plus_14j"] as const;
const FLEX_DATES = ["dates_fixes", "plus_moins_3j", "plus_moins_1sem", "tres_flexible", "non_flexible"] as const;
const TYPE_TRAJET = ["aller_retour", "aller_simple", "multi_villes"] as const;
const TYPES_VOYAGE = ["forfait_soleil", "croisiere", "forfait_circuit_europe", "long_sejour", "hotel_seulement", "a_la_carte", "groupe_agence", "vol_seul", "luxe_haut_de_gamme", "disney", "indecis", "autre"] as const;
const COMPOSANTES = ["vol", "hotel", "location_auto", "transferts", "excursions", "croisiere", "autres"] as const;
const ENCADREMENTS = ["organise", "equilibre", "en_liberte", "cent_pourcent_libre"] as const;
const CLASSES_VOL = ["economique", "economique_premium", "affaires", "premiere", "flexible", "plus_espace", "peu_importe"] as const;
const BAGAGES = ["aucun", "un", "deux", "trois_plus"] as const;
const CORRESPONDANCES = ["direct_seulement", "une_max", "peu_importe"] as const;
const TYPES_HEBERGEMENT = ["tout_inclus", "petit_hotel_intime", "grand_complexe", "adultes_18plus", "familial", "luxe", "bon_rapport_qualite_prix", "local_authentique", "activites_plus", "appart_hotel", "petit_navire", "moyen_navire", "grand_navire"] as const;
const NIVEAUX_CONFORT = ["trois_etoiles", "quatre_etoiles", "cinq_etoiles", "grand_luxe"] as const;
const PLANS_REPAS = ["tous_inclus", "demi_pension", "petit_dejeuner", "sans_repas", "cuisinette"] as const;
const MOTIVATIONS = ["safari", "ski", "golf", "plongee", "spectacles_nature", "aventure_plein_air", "expedition_polaire", "culture_patrimoine", "gastronomie_vins", "bien_etre_spa", "festif_vie_nocturne", "immersif_hors_sentiers", "repos_deconnexion", "romance_lune_de_miel", "voyage_famille"] as const;
const AMBIANCES = ["animee_dynamique", "calme_intime", "familiale", "festive_party", "style_club_med", "equilibre"] as const;
const OCCASIONS = ["lune_de_miel", "anniversaire_couple", "anniversaire_age", "retraite", "celebration_diverse", "graduation"] as const;
const ASSURANCES = ["a_valider", "a_faire_complete", "a_faire_medicale", "a_faire_annulation", "a_faire_interruption", "a_faire_rappel_predepart", "client_assure_carte_credit", "client_assure_collective", "client_assure_autre", "fait"] as const;
const RAISONS_HESITATION = ["prix", "dates", "attend_co_voyageur", "compare", "budget_indispo", "pas_pret"] as const;

export type TripBriefValidation = {
  ok: boolean;
  errors: string[];
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(root: unknown, path: string) {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!isRecord(current)) return undefined;
    return current[segment];
  }, root);
}

function inList(value: unknown, allowed: readonly string[]) {
  return typeof value === "string" && allowed.includes(value);
}

/**
 * ANCRE TEMPORELLE — validation volontairement PERMISSIVE.
 *
 * `ancre_ms` / `ancre_session_id` sont optionnels : les briefs déjà en base n'en ont
 * pas et doivent continuer de valider tel quel. On ne vérifie donc QUE la forme des
 * clés lorsqu'elles sont présentes (et `null` est toujours accepté : c'est la valeur
 * qui dit « verbatim non retrouvé dans l'enregistrement »).
 */
function validateAnchor(value: UnknownRecord, path: string, errors: string[]) {
  if ("ancre_ms" in value && value.ancre_ms !== null && value.ancre_ms !== undefined) {
    const ms = value.ancre_ms;
    if (typeof ms !== "number" || !Number.isFinite(ms) || ms < 0) {
      errors.push(`${path}.ancre_ms doit être un nombre de millisecondes >= 0, ou null.`);
    }
  }

  if ("ancre_session_id" in value && value.ancre_session_id !== null && value.ancre_session_id !== undefined) {
    if (typeof value.ancre_session_id !== "string") {
      errors.push(`${path}.ancre_session_id doit être string|null.`);
    }
  }
}

/**
 * RÉSOLUTION DE LIEU — validation PERMISSIVE, pour la même raison que l'ancre.
 *
 * `lieu.resolution` est arrivée le 2026-08-06 (règle 18). Les briefs déjà en base
 * n'en ont pas : une clé ABSENTE est donc valide, et `null` aussi (« rien de
 * géographique n'a été dit » est une réponse). On ne vérifie la forme que
 * lorsqu'un objet est présent.
 *
 * Ce qui est vérifié strictement, en revanche : `confiance` dans [0,1]. C'est le
 * nombre que le Payload compare à son seuil pour décider entre « je cherche » et
 * « je demande » — un 1.5 ou un `"0.9"` ferait tirer une recherche que la loi §1
 * voulait remplacer par une question. Et aucun champ n'est requis d'être non
 * `null` : une résolution qui ne connaît que le pays reste une information.
 */
function validateResolution(root: unknown, path: string, errors: string[]) {
  const lieu = getPath(root, path);
  if (!isRecord(lieu)) return; // l'erreur a déjà été signalée par les champs de `lieu`
  if (!("resolution" in lieu)) return; // brief historique : forme préservée
  const value = lieu.resolution;
  if (value === null || value === undefined) return;

  if (!isRecord(value)) {
    errors.push(`${path}.resolution doit être un objet|null.`);
    return;
  }

  for (const key of ["ville", "pays", "region_touristique", "base_sur"] as const) {
    const item = value[key];
    if (item !== null && item !== undefined && typeof item !== "string") {
      errors.push(`${path}.resolution.${key} doit être string|null.`);
    }
  }

  const confiance = value.confiance;
  if (typeof confiance !== "number" || !Number.isFinite(confiance) || confiance < 0 || confiance > 1) {
    errors.push(`${path}.resolution.confiance doit être un nombre entre 0 et 1.`);
  }
}

function validateField(
  root: unknown,
  path: string,
  errors: string[],
  options: {
    array?: boolean;
    number?: boolean;
    string?: boolean;
    enum?: readonly string[];
  } = {},
) {
  const value = getPath(root, path);
  if (!isRecord(value)) {
    errors.push(`${path} doit être un Field.`);
    return;
  }

  if (!(typeof value.verbatim === "string" || value.verbatim === null)) errors.push(`${path}.verbatim doit être string|null.`);
  if (typeof value.confiance !== "number" || value.confiance < 0 || value.confiance > 1) errors.push(`${path}.confiance doit être entre 0 et 1.`);
  if (!inList(value.statut, STATUTS)) errors.push(`${path}.statut invalide.`);
  validateAnchor(value, path, errors);

  const fieldValue = value.valeur;
  if (fieldValue === null) return;
  if (options.array && !Array.isArray(fieldValue)) errors.push(`${path}.valeur doit être un tableau|null.`);
  if (options.number && typeof fieldValue !== "number") errors.push(`${path}.valeur doit être number|null.`);
  if (options.string && typeof fieldValue !== "string") errors.push(`${path}.valeur doit être string|null.`);
  if (options.enum) {
    const values = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
    for (const item of values) {
      if (!inList(item, options.enum)) errors.push(`${path}.valeur contient une enum invalide: ${String(item)}.`);
    }
  }
}

function validateDate(root: unknown, path: string, errors: string[]) {
  const value = getPath(root, path);
  if (!isRecord(value)) {
    errors.push(`${path} doit être une DateFloue.`);
    return;
  }

  if (!(typeof value.verbatim === "string" || value.verbatim === null)) errors.push(`${path}.verbatim doit être string|null.`);
  if (!(typeof value.valeur === "string" || value.valeur === null)) errors.push(`${path}.valeur doit être string|null.`);
  if (value.precision !== null && !inList(value.precision, PRECISIONS)) errors.push(`${path}.precision invalide.`);
  if (typeof value.confiance !== "number" || value.confiance < 0 || value.confiance > 1) errors.push(`${path}.confiance doit être entre 0 et 1.`);
  if (!inList(value.statut, STATUTS)) errors.push(`${path}.statut invalide.`);
  validateAnchor(value, path, errors);
}

export function validateTripBrief(value: unknown): TripBriefValidation {
  const errors: string[] = [];
  if (!isRecord(value)) return { ok: false, errors: ["TripBrief doit être un objet."] };

  if (!isRecord(value.meta)) errors.push("meta est requis.");
  if (!inList(getPath(value, "meta.nature_conversation"), NATURES)) errors.push("meta.nature_conversation invalide.");
  if (!inList(getPath(value, "meta.langue"), LANGUES)) errors.push("meta.langue invalide.");
  validateField(value, "meta.source_demande", errors, { enum: SOURCE_DEMANDE });

  validateField(value, "voyageurs.adultes", errors, { number: true });
  validateField(value, "voyageurs.enfants_ages", errors, { array: true });
  validateField(value, "voyageurs.nombre_chambres", errors, { number: true });
  validateField(value, "voyageurs.type_groupe", errors, { enum: TYPE_GROUPE });
  validateField(value, "voyageurs.composition", errors, { string: true });

  validateField(value, "lieu.origine", errors, { string: true });
  validateField(value, "lieu.destinations", errors, { array: true });
  validateField(value, "lieu.region", errors, { enum: REGIONS });
  validateField(value, "lieu.hotel_nomme", errors, { string: true });
  validateResolution(value, "lieu", errors);

  validateDate(value, "temps.depart", errors);
  validateDate(value, "temps.retour", errors);
  validateField(value, "temps.duree", errors, { enum: DUREES });
  validateField(value, "temps.flexibilite", errors, { enum: FLEX_DATES });
  validateField(value, "temps.type_trajet", errors, { enum: TYPE_TRAJET });

  validateField(value, "type_voyage.type", errors, { enum: TYPES_VOYAGE });
  validateField(value, "type_voyage.composantes", errors, { array: true, enum: COMPOSANTES });
  validateField(value, "type_voyage.encadrement", errors, { enum: ENCADREMENTS });

  if (getPath(value, "vols.aeroport_depart") !== undefined) {
    validateField(value, "vols.aeroport_depart", errors, { string: true });
  }
  validateField(value, "vols.classe", errors, { enum: CLASSES_VOL });
  validateField(value, "vols.bagages_soute", errors, { enum: BAGAGES });
  validateField(value, "vols.correspondances", errors, { enum: CORRESPONDANCES });
  validateField(value, "vols.escales_a_eviter", errors, { array: true });
  validateField(value, "vols.compagnie_preferee", errors, { string: true });

  validateField(value, "hebergement.type_hebergement", errors, { enum: TYPES_HEBERGEMENT });
  validateField(value, "hebergement.niveau_confort", errors, { array: true, enum: NIVEAUX_CONFORT });
  validateField(value, "hebergement.plan_repas", errors, { enum: PLANS_REPAS });
  validateField(value, "hebergement.localisation", errors, { string: true });
  validateField(value, "hebergement.preference_plage", errors, { string: true });
  validateField(value, "hebergement.preference_piscine", errors, { string: true });

  if (value.croisiere !== null) {
    validateField(value, "croisiere.zone_navigation", errors, { string: true });
    validateField(value, "croisiere.ligne", errors, { string: true });
    validateField(value, "croisiere.type_cabine", errors, { array: true });
    validateField(value, "croisiere.duree_croisiere", errors, { string: true });
    validateField(value, "croisiere.port_embarquement", errors, { string: true });
  }

  validateField(value, "motivation.motivations", errors, { array: true, enum: MOTIVATIONS });
  validateField(value, "motivation.ambiance", errors, { enum: AMBIANCES });
  validateField(value, "motivation.occasion", errors, { enum: OCCASIONS });
  validateField(value, "motivation.occasion_details", errors, { string: true });

  validateField(value, "budget.total", errors, { number: true });
  validateField(value, "budget.par_personne", errors, { number: true });
  if (getPath(value, "budget.devise") !== "CAD") errors.push("budget.devise doit être CAD.");

  validateField(value, "services.services_importants", errors, { array: true });
  validateField(value, "services.excursions", errors, { string: true });
  validateField(value, "services.elements_importants", errors, { array: true });
  validateField(value, "services.elements_a_eviter", errors, { array: true });

  validateField(value, "contraintes.mobilite_sante", errors, { string: true });
  validateField(value, "contraintes.restrictions_alimentaires", errors, { string: true });
  validateField(value, "assurance.statut_assurance", errors, { enum: ASSURANCES });
  validateField(value, "decision.raison_hesitation", errors, { array: true, enum: RAISONS_HESITATION });
  validateField(value, "decision.notes_blocage", errors, { string: true });
  validateField(value, "notes_agent", errors, { string: true });

  return { ok: errors.length === 0, errors };
}

export function assertTripBrief(value: unknown): TripBrief {
  const validation = validateTripBrief(value);
  if (!validation.ok) {
    throw new Error(`TripBrief invalide: ${validation.errors.join("; ")}`);
  }

  return value as TripBrief;
}
