/**
 * PROMPT DU RÉCAP INTERNE — ARTEFACT DE JUGEMENT (équipe). Ne pas régénérer.
 *
 * Écrit après le verdict de François du 2026-08-06 sur le brief à base de
 * champs : « pour l'humain, ça ne sert absolument à rien ». Voir §6.1bis du
 * design sheet. Le but de ce prompt est de produire ce qu'une agente de voyage
 * lit entre deux clients : ce qui s'est dit, en français, en dix secondes.
 */

import type { TripBrief } from "../extraction/trip-brief.ts";

export const NOTES_AGENT_PROMPT_VERSION = "notes-agent-v1-fr";

export const NOTES_AGENT_SYSTEM = `Tu rédiges les NOTES INTERNES d'une agente de voyage québécoise après une conversation avec un client. Ces notes s'affichent sur son écran de travail : elle les lit en dix secondes, entre deux rendez-vous, pour se rappeler où en est le dossier.

QUI LIT : l'agente et ses collègues de l'agence. JAMAIS le client. Donc pas de salutation, pas de formule de politesse, pas d'argumentaire de vente, pas de « nous serions ravis ». Tu écris comme une collègue qui résume, pas comme une brochure.

CE QUE TU ÉCRIS
1. UN TITRE qui situe le projet en une phrase courte — « Voyage de noces dans le Sud, en janvier », « Famille de 4 vers Punta Cana, semaine de relâche ». Jamais un slogan.
2. LE RÉSUMÉ : 2 à 4 affirmations, une phrase chacune, dans l'ordre où ça compte pour préparer le voyage. C'est le cœur : ce qui s'est dit.
3. CE QUI COMPTE POUR EUX : leurs préférences, leur motivation, l'ambiance recherchée. 0 à 4 lignes.
4. CONTRAINTES : santé, mobilité, restrictions alimentaires, ce qu'ils veulent éviter, dates immuables. 0 à 4 lignes.
5. À CLARIFIER : 0 à 5 phrases, formulées comme des choses à régler avec le client — « Confirmer les dates exactes de départ », « Valider l'âge des enfants pour la configuration des chambres ».
6. PROCHAINES ÉTAPES : 0 à 4 actions concrètes pour l'agente.

RÈGLES DURES

· N'ÉCRIS QUE CE QUI A ÉTÉ CAPTÉ. Jamais un prix, une disponibilité, un nom d'hôtel, un transporteur, une exigence d'entrée ou une politique d'agence qui ne soit pas dans le brief. Si tu ne sais pas, tu n'écris pas.

· CHAQUE AFFIRMATION CITE SES CHAMPS. Pour le titre tu ne cites rien ; pour le résumé, ce qui compte et les contraintes, chaque ligne déclare les chemins de champs dont elle est tirée. C'est ce qui permet à l'agente de cliquer et d'entendre le passage. Une ligne dont tu ne peux citer aucun champ, tu ne l'écris pas.

· UNE SECTION VIDE RESTE VIDE. Tableau vide, point. N'écris jamais « rien à signaler », « aucune contrainte connue » ni un tiret de remplissage. Rien à dire, rien d'affiché.

· LE CADRE AVANT LE CONTENU. Si la conversation n'est pas une planification — une simple demande de prix, une première prise de contact où presque rien n'est établi — dis-le dans le cadre (« Première prise de contact », « Demande de prix, projet non défini ») et garde le reste court. Ne dramatise JAMAIS l'absence d'information : sur un premier contact, il est normal de ne rien savoir. Tu n'écris pas un constat d'échec, tu écris où on en est.

· À CLARIFIER : DES PHRASES, PAS DES CHAMPS. Jamais « adultes », « composition », « statut manquant », ni aucun nom technique.

· À CLARIFIER : LE TEST À S'APPLIQUER. Avant d'écrire une ligne, demande-toi : « une agente de voyage d'expérience a-t-elle besoin qu'on le lui souffle ? » Si la réponse est non, tu ne l'écris pas. Une agente sait déjà qu'il faut demander les dates, le nombre de voyageurs, le budget, les préférences d'hébergement ou de repas — ce sont les questions de base de son métier, et le lui rappeler la prend pour une débutante. N'écris donc JAMAIS de ligne de la forme « préciser les préférences de X », « demander s'il y a d'autres contraintes », « confirmer le budget », « valider les dates » quand rien de particulier ne s'est dit là-dessus : c'est du remplissage déguisé en checklist.

  Ce qui MÉRITE une ligne, et c'est peu de choses :
  – ce que le CLIENT a laissé en suspens de lui-même (« il doit valider avec sa sœur avant de confirmer les dates ») ;
  – une CONTRADICTION à trancher (deux budgets, deux périodes) ;
  – une information dont dépend une vérification concrète qu'on ne peut pas faire sans elle (la ville de départ pour chiffrer un vol, l'âge des enfants pour la configuration des chambres, la citoyenneté pour une formalité d'entrée) ;
  – un point de RISQUE qu'une contrainte rend nécessaire (mobilité + plage : vérifier l'accès réel).

  **Zéro ligne est une réponse parfaitement valable**, et c'est même le cas le plus fréquent sur une première rencontre. Un tableau vide vaut mieux qu'une ligne polie. Tu ne remplis pas jusqu'à cinq : cinq est un plafond, pas une cible.

· CE QUI BLOQUE PASSE EN PREMIER. Si le client hésite pour une raison identifiée — il attend un co-voyageur, le prix l'inquiète, les dates ne sont pas arrêtées — cette raison est la ligne la plus importante de tout le récap : elle va dans le résumé, pas en bas de page.

· UNE CONTRADICTION SE NOMME. Si le brief porte deux valeurs incompatibles (un budget qui change, deux périodes différentes), écris-le comme une chose à trancher, sans choisir à la place de l'agente.

· LES CONTRAINTES DE SANTÉ ET DE MOBILITÉ NE S'ADOUCISSENT PAS. Tu les transcris telles quelles. C'est ce qui protège le voyage.

· FRANÇAIS D'ABORD, HUMAIN TOUJOURS. Aucune clé technique, aucun mot d'énumération brut dans le texte : « destination_soleil » s'écrit « une destination soleil », « tout_inclus » s'écrit « un tout-inclus », « mobilite_sante » ne s'écrit pas du tout — tu écris ce que la contrainte est. Français québécois professionnel. Pas d'emoji. Pas de gras, pas de puces dans le texte des lignes.

· LONGUEURS. Titre : 90 caractères maximum. Chaque ligne : une seule phrase, 200 caractères maximum. Tu préfères toujours couper que remplir.

Tu ne réserves rien, tu n'envoies rien, tu ne rédiges pas de courriel client.`;

/**
 * Les chemins citables. Liste FERMÉE : le modèle ne peut pas inventer un champ,
 * et la résolution d'ancre ne peut donc jamais viser dans le vide.
 *
 * ⚠️ CORRIGÉE le 2026-08-06 : la première version de cette liste avait été
 * écrite de mémoire et un tiers de ses chemins n'existaient pas dans le
 * `TripBrief` (`voyageurs.chambres` au lieu de `nombre_chambres`,
 * `preferences.*` au lieu de `hebergement.*`/`motivation.*`/`services.*`,
 * `contraintes.dates_fixes` qui est en réalité une VALEUR de
 * `temps.flexibilite`…). Comme le brief est injecté en JSON dans le prompt, on
 * demandait au modèle de citer des chemins qu'il ne voyait pas dans les
 * données — soit il citait le vrai chemin et la validation le rejetait, soit il
 * citait le faux et l'ancre était approximée. Cette liste est maintenant
 * dérivée de `lib/extraction/trip-brief.ts` bloc par bloc.
 *
 * `meta.nature_conversation` et `meta.langue` n'y figurent PAS : ce sont des
 * valeurs nues, sans verbatim. Elles nourrissent le `cadre`, qui n'a pas à être
 * ancré.
 *
 * Deux chemins y figurent SANS être des `Field<>`, et c'est assumé :
 * `temps.itineraire` (une liste de `Segment`) et `budget.devise` (le littéral
 * « CAD »). Une phrase a le droit de dire d'où elle tire un itinéraire
 * multi-villes ou une devise ; elle s'affichera simplement **sans** ancre,
 * plutôt qu'avec celle d'un champ voisin. Voir `CHAMPS_SANS_PORTEUR` dans
 * `anchors.ts`, dont le banc vérifie qu'il est exactement cet ensemble.
 */
export const CHAMPS_CITABLES = [
  // qui voyage
  "voyageurs.adultes",
  "voyageurs.enfants_ages",
  "voyageurs.nombre_chambres",
  "voyageurs.type_groupe",
  "voyageurs.composition",
  // où
  "lieu.origine",
  "lieu.destinations",
  "lieu.region",
  "lieu.hotel_nomme",
  // quand
  "temps.depart",
  "temps.retour",
  "temps.duree",
  "temps.flexibilite",
  "temps.type_trajet",
  "temps.itineraire",
  // quoi
  "type_voyage.type",
  "type_voyage.composantes",
  "type_voyage.encadrement",
  // vols
  "vols.classe",
  "vols.bagages_soute",
  "vols.correspondances",
  "vols.escales_a_eviter",
  "vols.compagnie_preferee",
  // hébergement
  "hebergement.type_hebergement",
  "hebergement.niveau_confort",
  "hebergement.plan_repas",
  "hebergement.localisation",
  "hebergement.preference_plage",
  "hebergement.preference_piscine",
  // croisière (bloc absent quand ce n'est pas une croisière)
  "croisiere.zone_navigation",
  "croisiere.ligne",
  "croisiere.type_cabine",
  "croisiere.duree_croisiere",
  "croisiere.port_embarquement",
  // pourquoi
  "motivation.motivations",
  "motivation.ambiance",
  "motivation.occasion",
  "motivation.occasion_details",
  // budget
  "budget.total",
  "budget.par_personne",
  "budget.devise",
  // services et aversions
  "services.services_importants",
  "services.excursions",
  "services.elements_importants",
  "services.elements_a_eviter",
  // contraintes
  "contraintes.mobilite_sante",
  "contraintes.restrictions_alimentaires",
  "assurance.statut_assurance",
  // décision
  "decision.raison_hesitation",
  "decision.notes_blocage",
  // divers
  "meta.source_demande",
  "notes_agent",
] as const;

export function buildNotesAgentPrompt(brief: TripBrief, options?: { conversations?: number }): string {
  const nbConversations = options?.conversations ?? 1;
  const contexte = nbConversations > 1
    ? `Ce brief est la mémoire FUSIONNÉE de ${nbConversations} conversations du même dossier. Écris au présent de l'état du dossier, pas comme un compte rendu d'une seule rencontre.`
    : `Ce brief vient d'UNE conversation.`;

  return `${contexte}

Champs citables (n'en invente aucun autre) :
${CHAMPS_CITABLES.join(", ")}

Un champ dont le statut est « manquant » n'a pas été dit : ne le cite pas, et ne prétends pas qu'il a une valeur. Un champ « incertain » a été évoqué sans être arrêté : tu peux l'écrire en le marquant comme à confirmer. Un champ « contradiction » porte deux valeurs : nomme-le comme une chose à trancher.

BRIEF :
${JSON.stringify(brief, null, 1)}

Rends UNIQUEMENT du JSON strict, sans texte autour, à cette forme :
{
  "titre": string,
  "cadre": string | null,
  "resume": [{ "texte": string, "champs": string[] }],
  "ce_qui_compte": [{ "texte": string, "champs": string[] }],
  "contraintes": [{ "texte": string, "champs": string[] }],
  "a_clarifier": string[],
  "prochaines_etapes": string[]
}`;
}
