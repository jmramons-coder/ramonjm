import type { DateFloue, Statut } from "@/lib/extraction/trip-brief";
import type { TranscriptLine } from "@/lib/transcription/types";

/**
 * BANC D'ESSAI D'EXTRACTION — écrit par l'équipe (jugement domaine), pas généré.
 *
 * Chaque cas est inspiré de VRAIES fiches du HubSpot de La Forfaiterie et vise
 * un point dur du schéma (multi-destinations, multi-segments, contradiction,
 * croisière, indécis, groupe, gating info). Sert à mesurer la QUALITÉ de
 * l'extraction, pas juste « ça tourne ».
 *
 * POUR CODEX (mécanique) : une fois l'appel LLM réel branché dans /api/extract,
 * écris un runner qui, pour chaque cas : POST { transcript } → récupère le TripBrief
 * → vérifie chaque Expectation. Sémantique d'une Expectation, résolue par `path` :
 *   - si la cible est un Field { verbatim, valeur, confiance, statut } → vérifie
 *     `statut`, `valeurEquals` (=== valeur), `valeurIncludes` (valeur[] contient),
 *     `minLength` (valeur[].length >=).
 *   - si la cible est une DateFloue → vérifie `statut` et `precision`.
 *   - si la cible est une valeur brute (ex. meta.nature_conversation, temps.itineraire)
 *     → `valeurEquals` (=== valeur), `minLength` (array length >=), `present` (!== null).
 * Tolérance : on n'exige PAS un TripBrief exact — seulement les champs listés (le
 * reste peut varier). Vise un taux de réussite élevé sur ces assertions-clés.
 */

export type Expectation = {
  /** Chemin dans le brief. `""` = le brief ENTIER (pour ce qui doit être absent partout). */
  path: string;
  statut?: Statut;
  precision?: DateFloue["precision"];
  valeurEquals?: unknown;
  valeurIncludes?: unknown;
  minLength?: number;
  /**
   * `present: false` accepte aussi bien `null` qu'une clé absente : « rien ici »
   * est une réponse valide, et les briefs historiques n'ont pas les clés récentes.
   */
  present?: boolean;
  /**
   * Plancher sur une valeur numérique (ex. `lieu.resolution.confiance` ≥ 0.7).
   * Une confiance est un jugement : on exige un niveau, jamais un chiffre exact.
   */
  minValeur?: number;
  /**
   * Motif (regex, SENSIBLE À LA CASSE) qui ne doit apparaître NULLE PART dans le
   * JSON de la cible. Sert aux interdits de forme — le premier étant les codes
   * d'aéroport : le modèle situe en français, la traduction en code est
   * déterministe et appartient au Payload. Un code halluciné par le modèle
   * enverrait un vrai client au mauvais endroit.
   */
  motifInterdit?: string;
  note: string;
};

export type EvalCase = {
  name: string;
  description: string;
  transcript: TranscriptLine[];
  expect: Expectation[];
};

function line(id: number, speaker: TranscriptLine["speaker"], text: string, time: number): TranscriptLine {
  return { id: `t${id}`, speaker, text, time };
}

export const EVAL_CASES: EvalCase[] = [
  {
    name: "kais_multi_destination_luxe",
    description: "Luxe multi-destinations (Polynésie/Maldives/Seychelles) + blocage visa hors-enum.",
    transcript: [
      line(1, "Advisor", "Bonjour M. Chaouache, qu'est-ce qui vous ferait rêver comme voyage ?", 2),
      line(2, "Client", "Ma conjointe rêve de la Polynésie française. On regarde aussi les Maldives puis les Seychelles.", 9),
      line(3, "Advisor", "Magnifique. Vous partez de Montréal j'imagine ? Vous êtes combien ?", 16),
      line(4, "Client", "Oui, Montréal, juste nous deux. On veut du haut de gamme, du 4 ou 5 étoiles, tout-inclus si possible.", 24),
      line(5, "Advisor", "Quel budget on vise ?", 30),
      line(6, "Client", "Autour de 15 000 pour les deux. On veut vraiment se reposer, du spa, du bien-être.", 38),
      line(7, "Advisor", "Des dates en tête ?", 42),
      line(8, "Client", "Début octobre, retour vers le 22. Mais je dois vérifier si ma conjointe a besoin d'un visa avec son passeport tunisien avant qu'on réserve.", 54),
    ],
    expect: [
      { path: "lieu.destinations", statut: "capte", valeurIncludes: "Polynésie", note: "multi-destinations captées" },
      { path: "lieu.destinations", minLength: 2, note: "au moins Polynésie + Maldives/Seychelles" },
      { path: "lieu.origine", statut: "capte", note: "départ Montréal" },
      { path: "voyageurs.adultes", statut: "capte", valeurEquals: 2, note: "2 adultes" },
      { path: "type_voyage.type", statut: "capte", valeurEquals: "luxe_haut_de_gamme", note: "haut de gamme" },
      { path: "hebergement.type_hebergement", valeurEquals: "tout_inclus", note: "tout-inclus" },
      { path: "hebergement.niveau_confort", valeurIncludes: "cinq_etoiles", note: "4-5 étoiles" },
      { path: "budget.total", statut: "capte", valeurEquals: 15000, note: "budget total 15000" },
      { path: "motivation.motivations", valeurIncludes: "bien_etre_spa", note: "spa / bien-être" },
      { path: "decision.notes_blocage", note: "le blocage visa (hors-enum) doit atterrir dans notes_blocage, pas être perdu" },
    ],
  },
  {
    name: "mounira_multi_segments_vol_seul",
    description: "Vol seul multi-villes Québec→France→Tunisie→retour + compagnie préférée.",
    transcript: [
      line(1, "Advisor", "Bonjour Mme Torkhani, qu'est-ce que je peux organiser pour vous ?", 3),
      line(2, "Client", "J'ai besoin d'un billet d'avion seulement. Je pars de Québec vers la France, ensuite de la France vers la Tunisie, puis le retour vers Québec, avec des escales.", 15),
      line(3, "Advisor", "D'accord, donc un vol seul multi-villes. Vous voyagez seule ?", 21),
      line(4, "Client", "Oui, juste moi.", 24),
      line(5, "Advisor", "Des dates ?", 26),
      line(6, "Client", "Je pars le 6 août. Regardez les prix avec Air France si possible.", 33),
    ],
    expect: [
      { path: "type_voyage.type", statut: "capte", valeurEquals: "vol_seul", note: "vol seul" },
      { path: "type_voyage.composantes", valeurIncludes: "vol", note: "composante vol" },
      { path: "temps.type_trajet", statut: "capte", valeurEquals: "multi_villes", note: "multi-villes" },
      { path: "temps.itineraire", minLength: 2, note: "itinéraire multi-segments non vide (QC→France→Tunisie→QC)" },
      { path: "voyageurs.adultes", statut: "capte", valeurEquals: 1, note: "voyage seule" },
      { path: "vols.compagnie_preferee", statut: "capte", note: "Air France mentionnée (signal texte→champ)" },
    ],
  },
  {
    name: "paula_contradiction_soleil_sans_plage",
    description: "Contradiction (soleil mais n'aime pas la plage) + décomposition d'une réplique riche.",
    transcript: [
      line(1, "Advisor", "Bonjour Mme St-Pierre ! Vous cherchez quel genre de voyage ?", 3),
      line(2, "Client", "Un tout-inclus dans le Sud, mais honnêtement je n'aime pas trop la plage. On veut du luxe, un resort adultes seulement, 18 ans et plus.", 14),
      line(3, "Advisor", "Noté. Vous êtes combien ?", 17),
      line(4, "Client", "Nous deux. Budget autour de 12 000. On aime les petites soirées spectacle mais surtout pas de discothèque. Un casino ce serait un plus, sinon pas grave.", 30),
      line(5, "Advisor", "Des préférences pour la chambre ou l'avion ?", 34),
      line(6, "Client", "Chambre avec majordome. Puis on veut voyager avec Air Canada.", 40),
    ],
    expect: [
      { path: "lieu.region", valeurEquals: "destination_soleil", note: "région soleil captée (vouloir le Sud sans aimer la plage n'est PAS une contradiction ; l'aversion plage est captée ailleurs, statut capte OU contradiction acceptable)" },
      { path: "hebergement.type_hebergement", statut: "capte", valeurEquals: "adultes_18plus", note: "resort 18+" },
      { path: "voyageurs.adultes", valeurEquals: 2, note: "2 adultes" },
      { path: "budget.total", valeurEquals: 12000, note: "budget 12000" },
      { path: "services.elements_a_eviter", valeurIncludes: "discothèque", note: "décomposition : pas de discothèque → à éviter" },
      { path: "vols.compagnie_preferee", statut: "capte", note: "Air Canada" },
    ],
  },
  {
    name: "paul_croisiere_solo_veuf",
    description: "Croisière (bloc conditionnel), solo, budget inconnu, contrainte santé + contexte humain.",
    transcript: [
      line(1, "Advisor", "Bonjour M. Mongrain, qu'est-ce qui vous amène ?", 3),
      line(2, "Client", "J'aimerais essayer une croisière. J'ai perdu ma femme récemment... je veux commencer tranquillement. J'ai le mal de mer, donc une croisière courte pour commencer.", 16),
      line(3, "Advisor", "Je comprends. Vous pensez à quelle région ?", 20),
      line(4, "Client", "Les Caraïbes, sans île précise. Une cabine avec balcon. Juste moi.", 28),
      line(5, "Advisor", "Un budget en tête ?", 31),
      line(6, "Client", "Je ne sais pas encore côté budget, honnêtement.", 36),
    ],
    expect: [
      { path: "type_voyage.type", statut: "capte", valeurEquals: "croisiere", note: "croisière" },
      { path: "croisiere", present: true, note: "bloc croisière activé (non null)" },
      { path: "croisiere.type_cabine", valeurIncludes: "balcon", note: "cabine balcon" },
      { path: "voyageurs.type_groupe", valeurEquals: "solo", note: "voyage solo — on vérifie la valeur, pas le statut (capte si énoncé / incertain si déduit, règle 15)" },
      { path: "budget.total", statut: "incertain", note: "« ne sais pas encore » = budget évoqué mais non résolu → incertain (pas manquant), surtout PAS inventé" },
      { path: "contraintes.mobilite_sante", note: "mal de mer capté comme contrainte" },
      { path: "notes_agent", statut: "capte", note: "contexte humain (deuil, première croisière) préservé" },
    ],
  },
  {
    name: "indecis_soleil_date_floue",
    description: "Client indécis (aucune destination) + date floue (saison) + famille.",
    transcript: [
      line(1, "Advisor", "Bonjour ! Où est-ce que vous rêvez d'aller ?", 3),
      line(2, "Client", "Honnêtement on n'est pas encore décidés. Quelque part au soleil, pas trop cher, cet été.", 11),
      line(3, "Advisor", "Pas de souci. Vous êtes combien, avec quel budget ?", 16),
      line(4, "Client", "Deux adultes, un enfant de 6 ans. On pense environ 5 000 au total.", 24),
      line(5, "Advisor", "Une durée en tête ?", 27),
      line(6, "Client", "Une semaine, on est pas mal flexibles sur les dates.", 33),
    ],
    expect: [
      { path: "lieu.destinations", statut: "incertain", minLength: 0, note: "aucune destination précise → incertain, valeur []" },
      { path: "lieu.region", statut: "capte", valeurEquals: "destination_soleil", note: "au soleil" },
      { path: "type_voyage.type", statut: "capte", valeurEquals: "indecis", note: "indécis est un état normal" },
      { path: "voyageurs.adultes", valeurEquals: 2, note: "2 adultes" },
      { path: "voyageurs.enfants_ages", valeurIncludes: 6, note: "enfant de 6 ans" },
      { path: "voyageurs.type_groupe", valeurEquals: "famille", note: "famille" },
      { path: "budget.total", valeurEquals: 5000, note: "budget total 5000" },
      { path: "temps.duree", valeurEquals: "sept_j", note: "une semaine" },
      { path: "temps.flexibilite", valeurEquals: "tres_flexible", note: "flexibles" },
      { path: "temps.depart", precision: "saison", note: "« cet été » → précision saison (le statut peut être capte : la saison est claire, l'imprécision vit dans precision)" },
    ],
  },
  {
    name: "groupe_amis_mexique",
    description: "Voyage de groupe (nombres approximatifs) + budget PAR PERSONNE + ambiance festive.",
    transcript: [
      line(1, "Advisor", "Bonjour ! Parlez-moi de votre projet.", 3),
      line(2, "Client", "On organise un voyage de groupe, une gang d'amis, on est environ 12 à 14 personnes. On pense au Mexique, un tout-inclus.", 14),
      line(3, "Advisor", "Super. Des dates, un budget par personne ?", 18),
      line(4, "Client", "En février, environ 2 000 par personne. On veut de l'ambiance, festif, proche de la plage.", 27),
    ],
    expect: [
      { path: "voyageurs.type_groupe", statut: "capte", valeurEquals: "groupe", note: "voyage de groupe" },
      { path: "voyageurs.adultes", note: "nombre approximatif (~12-14) — capté mais confiance moindre, PAS un chiffre faussement précis" },
      { path: "lieu.destinations", valeurIncludes: "Mexique", note: "Mexique" },
      { path: "hebergement.type_hebergement", valeurEquals: "tout_inclus", note: "tout-inclus" },
      { path: "budget.par_personne", statut: "capte", valeurEquals: 2000, note: "budget PAR PERSONNE (pas total)" },
      { path: "motivation.ambiance", valeurEquals: "festive_party", note: "ambiance festive" },
      { path: "temps.depart", precision: "mois", note: "« en février » → précision mois" },
    ],
  },
  {
    name: "info_certificat_cadeau_gating",
    description: "Bruit : demande d'info sur un certificat cadeau (PAS une planification).",
    transcript: [
      line(1, "Client", "Bonjour, je voulais juste des informations sur vos certificats cadeaux. C'est pour offrir, je ne connais pas encore la destination ni rien.", 10),
      line(2, "Advisor", "Bien sûr, je peux vous expliquer comment fonctionnent nos certificats cadeaux.", 15),
    ],
    expect: [
      { path: "meta.nature_conversation", valeurEquals: "info", note: "gating : demande d'info, pas une planification" },
      { path: "lieu.destinations", statut: "manquant", note: "conversation = info (pas une planification) → champs voyage manquant (règle 11), même si la destination est évoquée en passant" },
      { path: "type_voyage.type", statut: "manquant", note: "rien à planifier" },
    ],
  },
  {
    name: "club_med_miches_resolution_de_lieu",
    description:
      "Le cas réel du 2026-08-06 : un RESORT nommé là où le schéma attend une ville. "
      + "La couche « dit » garde ce qui a été prononcé ; `lieu.resolution` le SITUE — et sans aucun code.",
    transcript: [
      line(1, "Advisor", "Bonjour ! Qu'est-ce que vous avez en tête comme voyage ?", 3),
      line(2, "Client", "ma famille et moi on veut aller au Club Med Michès la première semaine de mars", 12),
    ],
    expect: [
      // ── La couche « dit » n'est JAMAIS réécrite ────────────────────────────
      {
        path: "lieu.destinations",
        valeurIncludes: "Club Med Michès",
        note: "la couche « dit » garde le nom prononcé — même si c'est un resort et non une ville : c'est la provenance, et elle n'est pas négociable",
      },
      { path: "lieu.hotel_nomme", statut: "capte", valeurIncludes: "Club Med", note: "un resort nommé remplit aussi hotel_nomme (règle 16)" },
      { path: "meta.nature_conversation", valeurEquals: "planification", note: "vraie planification de voyage" },
      // ── …et la résolution s'ajoute À CÔTÉ ─────────────────────────────────
      { path: "lieu.resolution", present: true, note: "un lieu a été nommé → il doit être situé (règle 18)" },
      { path: "lieu.resolution.ville", valeurEquals: "Michès", note: "le resort n'est pas une ville : la ville, c'est Michès" },
      { path: "lieu.resolution.pays", valeurEquals: "République dominicaine", note: "pays en français, sans abréviation ni code" },
      {
        path: "lieu.resolution.confiance",
        minValeur: 0.7,
        note: "savoir où est Michès n'a rien d'incertain — sous 0.6 le Payload ne chercherait pas et poserait la question",
      },
      {
        path: "",
        motifInterdit: "\\b(PUJ|SDQ|LRM|POP|AZS|YUL|YQB|YYZ|CUN)\\b",
        note: "aucun code d'aéroport nulle part : le modèle situe en français, la traduction en aéroport est déterministe et appartient au Payload",
      },
    ],
  },
  {
    name: "ambiance_sans_lieu_pas_de_resolution",
    description: "Garde-fou de la règle 18 : une ambiance n'est pas un lieu. « du soleil quelque part » ne se situe pas.",
    transcript: [
      line(1, "Advisor", "Vous avez une destination en tête ?", 3),
      line(2, "Client", "Non, on veut juste du soleil quelque part.", 8),
    ],
    expect: [
      {
        path: "lieu.resolution",
        present: false,
        note: "rien de géographique n'a été dit → resolution null. Situer une envie, c'est inventer une destination que personne n'a nommée",
      },
      { path: "lieu.region", valeurEquals: "destination_soleil", note: "l'envie, elle, est bien captée — dans le champ qui est fait pour ça" },
      { path: "lieu.destinations", minLength: 0, note: "aucune destination précise" },
    ],
  },
];
