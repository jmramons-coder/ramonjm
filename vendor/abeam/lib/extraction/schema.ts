import { z } from "zod";

import type { TripBrief } from "@/lib/extraction/trip-brief";

const statutSchema = z.enum(["capte", "incertain", "manquant", "contradiction"]);

function fieldSchema<T extends z.ZodType>(valueSchema: T) {
  return z.object({
    verbatim: z.string().nullable(),
    valeur: valueSchema.nullable(),
    confiance: z.number().min(0).max(1),
    statut: statutSchema,
  });
}

const dateFloueSchema = z.object({
  verbatim: z.string().nullable(),
  valeur: z.string().nullable(),
  precision: z.enum(["jour", "mois", "saison"]).nullable(),
  confiance: z.number().min(0).max(1),
  statut: statutSchema,
});

const segmentSchema = z.object({
  origine: z.string(),
  destination: z.string(),
  date: z.string().nullable(),
});

const regionSchema = z.enum(["afrique_subsaharienne", "amerique_nord", "amerique_sud_centrale", "asie", "destination_soleil", "europe", "maghreb_moyen_orient", "oceanie_pacifique_sud"]);
const typeVoyageSchema = z.enum(["forfait_soleil", "croisiere", "forfait_circuit_europe", "long_sejour", "hotel_seulement", "a_la_carte", "groupe_agence", "vol_seul", "luxe_haut_de_gamme", "disney", "indecis", "autre"]);
const composanteSchema = z.enum(["vol", "hotel", "location_auto", "transferts", "excursions", "croisiere", "autres"]);
const encadrementSchema = z.enum(["organise", "equilibre", "en_liberte", "cent_pourcent_libre"]);
const classeVolSchema = z.enum(["economique", "economique_premium", "affaires", "premiere", "flexible", "plus_espace", "peu_importe"]);
const bagagesSchema = z.enum(["aucun", "un", "deux", "trois_plus"]);
const correspondancesSchema = z.enum(["direct_seulement", "une_max", "peu_importe"]);
const typeHebergementSchema = z.enum(["tout_inclus", "petit_hotel_intime", "grand_complexe", "adultes_18plus", "familial", "luxe", "bon_rapport_qualite_prix", "local_authentique", "activites_plus", "appart_hotel", "petit_navire", "moyen_navire", "grand_navire"]);
const niveauConfortSchema = z.enum(["trois_etoiles", "quatre_etoiles", "cinq_etoiles", "grand_luxe"]);
const planRepasSchema = z.enum(["tous_inclus", "demi_pension", "petit_dejeuner", "sans_repas", "cuisinette"]);
const motivationSchema = z.enum(["safari", "ski", "golf", "plongee", "spectacles_nature", "aventure_plein_air", "expedition_polaire", "culture_patrimoine", "gastronomie_vins", "bien_etre_spa", "festif_vie_nocturne", "immersif_hors_sentiers", "repos_deconnexion", "romance_lune_de_miel", "voyage_famille"]);
const ambianceSchema = z.enum(["animee_dynamique", "calme_intime", "familiale", "festive_party", "style_club_med", "equilibre"]);
const occasionSchema = z.enum(["lune_de_miel", "anniversaire_couple", "anniversaire_age", "retraite", "celebration_diverse", "graduation"]);
const assuranceSchema = z.enum(["a_valider", "a_faire_complete", "a_faire_medicale", "a_faire_annulation", "a_faire_interruption", "a_faire_rappel_predepart", "client_assure_carte_credit", "client_assure_collective", "client_assure_autre", "fait"]);
const raisonHesitationSchema = z.enum(["prix", "dates", "attend_co_voyageur", "compare", "budget_indispo", "pas_pret"]);
const dureeSchema = z.enum(["moins_7j", "sept_j", "dix_j", "quatorze_j", "plus_14j"]);
const flexDatesSchema = z.enum(["dates_fixes", "plus_moins_3j", "plus_moins_1sem", "tres_flexible", "non_flexible"]);
const sourceDemandeSchema = z.enum(["courriel", "telephone", "site_web", "feuille_demande", "walk_in", "reference_client", "salon_evenement", "client_repeat"]);

export const tripBriefSchema = z.object({
  meta: z.object({
    nature_conversation: z.enum(["planification", "info", "hors_sujet"]),
    langue: z.enum(["fr", "en"]),
    source_demande: fieldSchema(sourceDemandeSchema),
  }),
  voyageurs: z.object({
    adultes: fieldSchema(z.number()),
    enfants_ages: fieldSchema(z.array(z.number())),
    nombre_chambres: fieldSchema(z.number()),
    type_groupe: fieldSchema(z.enum(["solo", "couple", "famille", "groupe"])),
    composition: fieldSchema(z.string()),
  }),
  lieu: z.object({
    origine: fieldSchema(z.string()),
    destinations: fieldSchema(z.array(z.string())),
    region: fieldSchema(regionSchema),
    hotel_nomme: fieldSchema(z.string()),
    /**
     * RÉSOLUTION (règle 18) — clé REQUISE, valeur NULLABLE, volontairement.
     *
     * Côté modèle, « requise + nullable » vaut mieux que « optionnelle » : les
     * sorties structurées d'OpenAI exigent que chaque propriété soit requise, et
     * surtout un `null` explicite est une RÉPONSE (« rien de géographique n'a été
     * dit ») tandis qu'une clé absente est un silence qu'on ne sait pas lire.
     * La rétrocompatibilité, elle, vit dans `validate.ts` : ce schéma ne valide
     * que la sortie fraîche du modèle, jamais les briefs déjà en base.
     *
     * `confiance` est bornée 0..1 ici même : c'est ce nombre que le Payload
     * compare à son seuil, et un 1.5 halluciné ferait tirer une recherche que la
     * loi §1 voulait remplacer par une question.
     */
    resolution: z.object({
      ville: z.string().nullable(),
      pays: z.string().nullable(),
      region_touristique: z.string().nullable(),
      confiance: z.number().min(0).max(1),
      base_sur: z.string().nullable(),
    }).nullable(),
  }),
  temps: z.object({
    depart: dateFloueSchema,
    retour: dateFloueSchema,
    duree: fieldSchema(dureeSchema),
    flexibilite: fieldSchema(flexDatesSchema),
    type_trajet: fieldSchema(z.enum(["aller_retour", "aller_simple", "multi_villes"])),
    itineraire: z.array(segmentSchema).nullable(),
  }),
  type_voyage: z.object({
    type: fieldSchema(typeVoyageSchema),
    composantes: fieldSchema(z.array(composanteSchema)),
    encadrement: fieldSchema(encadrementSchema),
  }),
  vols: z.object({
    aeroport_depart: fieldSchema(z.string()).optional(),
    classe: fieldSchema(classeVolSchema),
    bagages_soute: fieldSchema(bagagesSchema),
    correspondances: fieldSchema(correspondancesSchema),
    escales_a_eviter: fieldSchema(z.array(z.string())),
    compagnie_preferee: fieldSchema(z.string()),
  }),
  hebergement: z.object({
    type_hebergement: fieldSchema(typeHebergementSchema),
    niveau_confort: fieldSchema(z.array(niveauConfortSchema)),
    plan_repas: fieldSchema(planRepasSchema),
    localisation: fieldSchema(z.string()),
    preference_plage: fieldSchema(z.string()),
    preference_piscine: fieldSchema(z.string()),
  }),
  croisiere: z.object({
    zone_navigation: fieldSchema(z.string()),
    ligne: fieldSchema(z.string()),
    type_cabine: fieldSchema(z.array(z.string())),
    duree_croisiere: fieldSchema(z.string()),
    port_embarquement: fieldSchema(z.string()),
  }).nullable(),
  motivation: z.object({
    motivations: fieldSchema(z.array(motivationSchema)),
    ambiance: fieldSchema(ambianceSchema),
    occasion: fieldSchema(occasionSchema),
    occasion_details: fieldSchema(z.string()),
  }),
  budget: z.object({
    total: fieldSchema(z.number()),
    par_personne: fieldSchema(z.number()),
    devise: z.literal("CAD"),
  }),
  services: z.object({
    services_importants: fieldSchema(z.array(z.string())),
    excursions: fieldSchema(z.string()),
    elements_importants: fieldSchema(z.array(z.string())),
    elements_a_eviter: fieldSchema(z.array(z.string())),
  }),
  contraintes: z.object({
    mobilite_sante: fieldSchema(z.string()),
    restrictions_alimentaires: fieldSchema(z.string()),
  }),
  assurance: z.object({
    statut_assurance: fieldSchema(assuranceSchema),
  }),
  decision: z.object({
    raison_hesitation: fieldSchema(z.array(raisonHesitationSchema)),
    notes_blocage: fieldSchema(z.string()),
  }),
  notes_agent: fieldSchema(z.string()),
}) satisfies z.ZodType<TripBrief>;
