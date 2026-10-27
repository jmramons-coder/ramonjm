export const STATUTS = ["capte", "incertain", "manquant", "contradiction"] as const;
export type Statut = (typeof STATUTS)[number];

/**
 * ANCRE TEMPORELLE (loi 5 « provenance obligatoire », défaut D2, transposition T1).
 *
 * `ancre_ms` = position, en millisecondes depuis le début de l'enregistrement, du
 * tour de parole où la chose a été dite. Elle n'est JAMAIS produite par le LLM :
 * elle est *dérivée* en retrouvant le `verbatim` dans les utterances horodatées
 * (voir `lib/extraction/anchor.ts`). Une ancre absente ou `null` = « on n'a pas
 * réussi à situer cette valeur », ce qui est préférable à un faux timecode.
 *
 * `ancre_session_id` = la session (l'enregistrement) dans laquelle `ancre_ms` a un
 * sens. Un timecode sans son enregistrement ne veut rien dire au niveau d'un
 * dossier qui fusionne N conversations : les deux voyagent donc ensemble.
 *
 * Les deux clés sont OPTIONNELLES : les briefs déjà en base ne les ont pas et
 * doivent continuer de valider et de s'afficher.
 */
export type Anchor = {
  ancre_ms?: number | null;
  ancre_session_id?: string | null;
};

export type Field<T> = Anchor & {
  verbatim: string | null;
  valeur: T | null;
  confiance: number;
  statut: Statut;
};

export type Region =
  | "afrique_subsaharienne"
  | "amerique_nord"
  | "amerique_sud_centrale"
  | "asie"
  | "destination_soleil"
  | "europe"
  | "maghreb_moyen_orient"
  | "oceanie_pacifique_sud";
export type TypeVoyage =
  | "forfait_soleil"
  | "croisiere"
  | "forfait_circuit_europe"
  | "long_sejour"
  | "hotel_seulement"
  | "a_la_carte"
  | "groupe_agence"
  | "vol_seul"
  | "luxe_haut_de_gamme"
  | "disney"
  | "indecis"
  | "autre";
export type Composante = "vol" | "hotel" | "location_auto" | "transferts" | "excursions" | "croisiere" | "autres";
export type Encadrement = "organise" | "equilibre" | "en_liberte" | "cent_pourcent_libre";
export type ClasseVol = "economique" | "economique_premium" | "affaires" | "premiere" | "flexible" | "plus_espace" | "peu_importe";
export type Bagages = "aucun" | "un" | "deux" | "trois_plus";
export type Correspondances = "direct_seulement" | "une_max" | "peu_importe";
export type TypeHebergement =
  | "tout_inclus"
  | "petit_hotel_intime"
  | "grand_complexe"
  | "adultes_18plus"
  | "familial"
  | "luxe"
  | "bon_rapport_qualite_prix"
  | "local_authentique"
  | "activites_plus"
  | "appart_hotel"
  | "petit_navire"
  | "moyen_navire"
  | "grand_navire";
export type NiveauConfort = "trois_etoiles" | "quatre_etoiles" | "cinq_etoiles" | "grand_luxe";
export type PlanRepas = "tous_inclus" | "demi_pension" | "petit_dejeuner" | "sans_repas" | "cuisinette";
export type MotivationEnum =
  | "safari"
  | "ski"
  | "golf"
  | "plongee"
  | "spectacles_nature"
  | "aventure_plein_air"
  | "expedition_polaire"
  | "culture_patrimoine"
  | "gastronomie_vins"
  | "bien_etre_spa"
  | "festif_vie_nocturne"
  | "immersif_hors_sentiers"
  | "repos_deconnexion"
  | "romance_lune_de_miel"
  | "voyage_famille";
export type Ambiance = "animee_dynamique" | "calme_intime" | "familiale" | "festive_party" | "style_club_med" | "equilibre";
export type Occasion = "lune_de_miel" | "anniversaire_couple" | "anniversaire_age" | "retraite" | "celebration_diverse" | "graduation";
export type Assurance_ =
  | "a_valider"
  | "a_faire_complete"
  | "a_faire_medicale"
  | "a_faire_annulation"
  | "a_faire_interruption"
  | "a_faire_rappel_predepart"
  | "client_assure_carte_credit"
  | "client_assure_collective"
  | "client_assure_autre"
  | "fait";
export type RaisonHesitation = "prix" | "dates" | "attend_co_voyageur" | "compare" | "budget_indispo" | "pas_pret";
export type Duree = "moins_7j" | "sept_j" | "dix_j" | "quatorze_j" | "plus_14j";
export type FlexDates = "dates_fixes" | "plus_moins_3j" | "plus_moins_1sem" | "tres_flexible" | "non_flexible";
export type SourceDemande =
  | "courriel"
  | "telephone"
  | "site_web"
  | "feuille_demande"
  | "walk_in"
  | "reference_client"
  | "salon_evenement"
  | "client_repeat";

export type SessionMeta = {
  nature_conversation: "planification" | "info" | "hors_sujet";
  langue: "fr" | "en";
  source_demande: Field<SourceDemande>;
};

export type Voyageurs = {
  adultes: Field<number>;
  enfants_ages: Field<number[]>;
  nombre_chambres: Field<number>;
  type_groupe: Field<"solo" | "couple" | "famille" | "groupe">;
  composition: Field<string>;
};

/**
 * RÉSOLUTION DE LIEU (règle 18 du prompt, station 3 de l'architecture).
 *
 * Où se trouve, DANS LE MONDE, ce dont le client parle. Produite par la seule
 * station qui appelle un LLM — la seule, donc, qui porte du savoir sur le monde.
 * Le Payload en aval est du code déterministe : mettre de la géographie dans du
 * code, c'est comment on a obtenu une table de ~55 villes qui ignorait Michès.
 *
 * Trois propriétés non négociables :
 *
 * 1. **Elle s'ajoute À CÔTÉ de la couche « dit », jamais à sa place.**
 *    `destinations`, `hotel_nomme`, les verbatims et les ancres restent
 *    exactement ce qui a été prononcé (« Club Med Michès » reste dans
 *    `destinations`, même si c'est un resort et non une ville). `resolution`
 *    est une INTERPRÉTATION ; la provenance doit rester lisible à côté d'elle.
 * 2. **Aucun code.** Ni IATA, ni code pays, ni identifiant : le modèle situe en
 *    français (« Michès, République dominicaine »). La traduction en aéroport
 *    est déterministe et reste chez le Payload (`lib/suggestions/*`). Un code
 *    halluciné enverrait un vrai client au mauvais endroit.
 * 3. **`confiance` est le doute du modèle, et il est utile.** Sous le seuil du
 *    Payload (`SEUIL_RESOLUTION`), la résolution ne vaut pas une recherche : on
 *    demande au client (loi §1 « sinon → nudge, pas de devinette »).
 *
 * `base_sur` cite ce sur quoi la résolution repose (« Club Med Michès ») : c'est
 * ce qui permet, à la fusion de dossier, de savoir si deux résolutions répondent
 * à la MÊME question ou à deux sujets différents (voir `mergeSessionBriefs`).
 */
export type LieuResolution = {
  ville: string | null;
  pays: string | null;
  region_touristique: string | null;
  /** 0..1 — le doute du modèle sur SA propre localisation. */
  confiance: number;
  /** Ce qui a été dit et qui a servi à situer (jamais réécrit ailleurs). */
  base_sur: string | null;
};

export type Lieu = {
  origine: Field<string>;
  /**
   * ORDONNÉE : l'ordre conserve la séquence des options explicitement dites.
   * Il sert à stabiliser le rendu et la pertinence du sujet courant, mais ne
   * signifie jamais « destination choisie » et ne donne aucune priorité de
   * confiance à `valeur[0]`. « Espagne ou Portugal » reste deux alternatives
   * au même statut jusqu'à une décision humaine explicite.
   */
  destinations: Field<string[]>;
  region: Field<Region>;
  hotel_nomme: Field<string>;
  /**
   * OPTIONNELLE et NULLABLE, comme les clés d'ancre : les briefs déjà en base
   * n'en ont pas et doivent continuer de valider et de s'afficher. `null` = « rien
   * de géographique n'a été dit », ce qui est une réponse, pas une panne.
   */
  resolution?: LieuResolution | null;
};

export type DateFloue = Anchor & {
  verbatim: string | null;
  valeur: string | null;
  precision: "jour" | "mois" | "saison" | null;
  confiance: number;
  statut: Statut;
};

export type Segment = { origine: string; destination: string; date: string | null };

export type Temps = {
  depart: DateFloue;
  retour: DateFloue;
  duree: Field<Duree>;
  flexibilite: Field<FlexDates>;
  type_trajet: Field<"aller_retour" | "aller_simple" | "multi_villes">;
  itineraire: Segment[] | null;
};

export type TypeVoyageBloc = {
  type: Field<TypeVoyage>;
  composantes: Field<Composante[]>;
  encadrement: Field<Encadrement>;
};

export type Vols = {
  /** Aéroport explicitement cité (« YQB », « Québec Jean-Lesage »). */
  aeroport_depart?: Field<string>;
  classe: Field<ClasseVol>;
  bagages_soute: Field<Bagages>;
  correspondances: Field<Correspondances>;
  escales_a_eviter: Field<string[]>;
  compagnie_preferee: Field<string>;
};

export type Hebergement = {
  type_hebergement: Field<TypeHebergement>;
  niveau_confort: Field<NiveauConfort[]>;
  plan_repas: Field<PlanRepas>;
  localisation: Field<string>;
  preference_plage: Field<string>;
  preference_piscine: Field<string>;
};

export type Croisiere = {
  zone_navigation: Field<string>;
  ligne: Field<string>;
  type_cabine: Field<string[]>;
  duree_croisiere: Field<string>;
  port_embarquement: Field<string>;
};

export type Motivation = {
  motivations: Field<MotivationEnum[]>;
  ambiance: Field<Ambiance>;
  occasion: Field<Occasion>;
  occasion_details: Field<string>;
};

export type Budget = {
  total: Field<number>;
  par_personne: Field<number>;
  devise: "CAD";
};

/** Valeur utilisable à l'écran; les sentinelles de formulaires restent inconnues. */
export function budgetValide(fieldValue: Field<number> | undefined | null): number | null {
  const value = fieldValue?.valeur;
  if (fieldValue?.statut === "manquant" || typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value <= 0 || value === 12345) return null;
  return value;
}

export type Services = {
  services_importants: Field<string[]>;
  excursions: Field<string>;
  elements_importants: Field<string[]>;
  elements_a_eviter: Field<string[]>;
};

export type Contraintes = {
  mobilite_sante: Field<string>;
  restrictions_alimentaires: Field<string>;
};

export type Assurance = {
  statut_assurance: Field<Assurance_>;
};

export type EtatDecision = {
  raison_hesitation: Field<RaisonHesitation[]>;
  notes_blocage: Field<string>;
};

export type TripBrief = {
  meta: SessionMeta;
  voyageurs: Voyageurs;
  lieu: Lieu;
  temps: Temps;
  type_voyage: TypeVoyageBloc;
  vols: Vols;
  hebergement: Hebergement;
  croisiere: Croisiere | null;
  motivation: Motivation;
  budget: Budget;
  services: Services;
  contraintes: Contraintes;
  assurance: Assurance;
  decision: EtatDecision;
  notes_agent: Field<string>;
};

export function field<T>(value: Omit<Field<T>, "confiance"> & { confiance?: number }): Field<T> {
  const next: Field<T> = {
    verbatim: value.verbatim,
    valeur: value.valeur,
    confiance: value.confiance ?? (value.statut === "manquant" ? 0 : 0.75),
    statut: value.statut,
  };

  // Les clés d'ancre restent absentes quand l'appelant n'en fournit pas : un brief
  // sans ancre garde exactement la forme historique.
  if (value.ancre_ms !== undefined) next.ancre_ms = value.ancre_ms;
  if (value.ancre_session_id !== undefined) next.ancre_session_id = value.ancre_session_id;

  return next;
}

export function missingField<T>(): Field<T> {
  return field<T>({ verbatim: null, valeur: null, statut: "manquant", confiance: 0 });
}

export function missingDate(): DateFloue {
  return { verbatim: null, valeur: null, precision: null, confiance: 0, statut: "manquant" };
}

export function createEmptyTripBrief(): TripBrief {
  return {
    meta: {
      nature_conversation: "planification",
      langue: "fr",
      source_demande: missingField<SourceDemande>(),
    },
    voyageurs: {
      adultes: missingField<number>(),
      enfants_ages: field<number[]>({ verbatim: null, valeur: [], statut: "manquant", confiance: 0 }),
      nombre_chambres: missingField<number>(),
      type_groupe: missingField<"solo" | "couple" | "famille" | "groupe">(),
      composition: missingField<string>(),
    },
    lieu: {
      origine: missingField<string>(),
      destinations: field<string[]>({ verbatim: null, valeur: [], statut: "manquant", confiance: 0 }),
      region: missingField<Region>(),
      hotel_nomme: missingField<string>(),
      // Rien n'a été dit → rien n'est situé. `null` est la réponse, pas un trou.
      resolution: null,
    },
    temps: {
      depart: missingDate(),
      retour: missingDate(),
      duree: missingField<Duree>(),
      flexibilite: missingField<FlexDates>(),
      type_trajet: missingField<"aller_retour" | "aller_simple" | "multi_villes">(),
      itineraire: null,
    },
    type_voyage: {
      type: missingField<TypeVoyage>(),
      composantes: field<Composante[]>({ verbatim: null, valeur: [], statut: "manquant", confiance: 0 }),
      encadrement: missingField<Encadrement>(),
    },
    vols: {
      aeroport_depart: missingField<string>(),
      classe: missingField<ClasseVol>(),
      bagages_soute: missingField<Bagages>(),
      correspondances: missingField<Correspondances>(),
      escales_a_eviter: field<string[]>({ verbatim: null, valeur: [], statut: "manquant", confiance: 0 }),
      compagnie_preferee: missingField<string>(),
    },
    hebergement: {
      type_hebergement: missingField<TypeHebergement>(),
      niveau_confort: field<NiveauConfort[]>({ verbatim: null, valeur: [], statut: "manquant", confiance: 0 }),
      plan_repas: missingField<PlanRepas>(),
      localisation: missingField<string>(),
      preference_plage: missingField<string>(),
      preference_piscine: missingField<string>(),
    },
    croisiere: null,
    motivation: {
      motivations: field<MotivationEnum[]>({ verbatim: null, valeur: [], statut: "manquant", confiance: 0 }),
      ambiance: missingField<Ambiance>(),
      occasion: missingField<Occasion>(),
      occasion_details: missingField<string>(),
    },
    budget: {
      total: missingField<number>(),
      par_personne: missingField<number>(),
      devise: "CAD",
    },
    services: {
      services_importants: field<string[]>({ verbatim: null, valeur: [], statut: "manquant", confiance: 0 }),
      excursions: missingField<string>(),
      elements_importants: field<string[]>({ verbatim: null, valeur: [], statut: "manquant", confiance: 0 }),
      elements_a_eviter: field<string[]>({ verbatim: null, valeur: [], statut: "manquant", confiance: 0 }),
    },
    contraintes: {
      mobilite_sante: missingField<string>(),
      restrictions_alimentaires: missingField<string>(),
    },
    assurance: {
      statut_assurance: missingField<Assurance_>(),
    },
    decision: {
      raison_hesitation: field<RaisonHesitation[]>({ verbatim: null, valeur: [], statut: "manquant", confiance: 0 }),
      notes_blocage: missingField<string>(),
    },
    notes_agent: missingField<string>(),
  };
}
