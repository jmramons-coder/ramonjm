/**
 * PROMPTS DES PASSES (T5) — artefacts de jugement, versionnés.
 *
 * Une « passe » est un extracteur supplémentaire qu'une agente lance À LA
 * DEMANDE sur une conversation déjà sauvegardée (transposition des « AI Skills »
 * de Fireflies, design sheet v2 §4 T5). Le brief structuré reste le livrable par
 * défaut ; une passe produit un livrable métier EN PLUS.
 *
 * Ce fichier ne contient QUE du texte et des fonctions pures : aucune clé, aucun
 * appel réseau, aucune dépendance serveur. Il est donc importable par le banc
 * `scripts/check-passes.ts` (hors-ligne) comme par le registre.
 *
 * Versionnage : `passe-<id>-v1`, comme `recap-prompt.ts`. Toute évolution du
 * texte qui change le comportement produit doit incrémenter la version.
 */

import type { TripBrief } from "../extraction/trip-brief";

export const FICHE_SOUMISSION_PROMPT_VERSION = "passe-fiche-soumission-v1";
export const CHECKLIST_DOCUMENTS_PROMPT_VERSION = "passe-checklist-documents-v1";
export const RELANCE_J7_PROMPT_VERSION = "passe-relance-j7-v1";

export type PasseContexte = {
  /** Nom de l'agente (signature du brouillon). */
  agentName?: string;
  /** Nom de l'agence (signature du brouillon). */
  agencyName?: string;
  /** Nom du client tel qu'enregistré sur la session. */
  clientName?: string;
  /** ISO — date de la conversation. Fournie par l'appelant, jamais devinée. */
  conversationDate?: string;
  /** ISO — aujourd'hui. Fournie par l'appelant, jamais devinée par le modèle. */
  aujourdHui?: string;
};

export type PassePromptInput = {
  brief: TripBrief;
  contexte: PasseContexte;
  /** Libellés FR des champs réellement captés (calculés par le registre). */
  captes: string[];
  /** Libellés FR des champs absents — à nommer, jamais à inventer. */
  manquants: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Règles communes aux trois passes
// ─────────────────────────────────────────────────────────────────────────────

const LOI_SOURCE = `LOI DE SOURCE — non négociable :
1. Tu n'écris QUE ce que le TripBrief contient réellement (un champ de statut "capte", "incertain" ou "contradiction" ET porteur d'une valeur). Un champ "manquant" ou nul n'est PAS une information : tu ne le devines pas, tu ne le complètes pas « par expérience du métier ».
2. Tu n'inventes JAMAIS : aucun prix, aucun tarif, aucune disponibilité, aucun nom d'hôtel, de complexe, de compagnie aérienne ou de croisière, aucune exigence légale, aucune politique d'agence, aucun délai, aucun numéro de dossier, aucun lien Web.
3. Ce qui manque doit être NOMMÉ tel quel, dans la section prévue pour ça. Un trou nommé vaut mieux qu'un trou rempli.
4. Un champ "incertain" ou "contradiction" se rapporte comme À VALIDER, avec ce qui a été entendu — jamais comme un fait établi.
5. Une date imprécise reste imprécise (« au printemps », « en mars ») : tu n'inventes pas de date exacte, tu ne calcules pas de retour à partir d'une durée si elle n'est pas captée.
6. Tu ne réserves rien, tu ne confirmes rien, tu n'envoies rien, tu ne parles à personne d'autre qu'à l'agente. Tu produis un document de travail qu'elle relit, corrige et utilise.
7. Français québécois professionnel, phrases courtes, aucun superlatif creux. Jamais de clé technique, de nom de champ ni d'enum dans le texte rendu : "tout_inclus" → « un tout-inclus » ; "attend_co_voyageur" → « attend le mot de ses co-voyageurs » ; "destination_soleil" → « une destination soleil ».`;

const CONTRAT_JSON = `FORMAT DE SORTIE : réponds UNIQUEMENT avec un objet JSON valide — aucun texte autour, aucun bloc Markdown. Toutes les clés demandées sont obligatoires. Une liste sans contenu est un tableau vide []. Un champ texte sans information captée porte exactement « non capté ».`;

function joursEcoules(depuis?: string, jusqua?: string): number | null {
  if (!depuis || !jusqua) return null;
  const a = Date.parse(depuis);
  const b = Date.parse(jusqua);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

function blocContexte(ctx: PasseContexte): string {
  const lignes = [
    `Agente : ${ctx.agentName?.trim() || "non renseignée"}`,
    `Agence : ${ctx.agencyName?.trim() || "non renseignée"}`,
    `Client au dossier : ${ctx.clientName?.trim() || "non renseigné"}`,
  ];
  if (ctx.conversationDate) lignes.push(`Date de la conversation : ${ctx.conversationDate}`);
  if (ctx.aujourdHui) lignes.push(`Date du jour : ${ctx.aujourdHui}`);
  const jours = joursEcoules(ctx.conversationDate, ctx.aujourdHui);
  if (jours !== null) lignes.push(`Jours écoulés depuis la conversation : ${jours}`);
  return `CONTEXTE (fourni par l'application — n'en déduis rien de plus) :\n${lignes.join("\n")}`;
}

function blocCaptation(input: PassePromptInput): string {
  const captes = input.captes.length ? input.captes.join(", ") : "aucun";
  const manquants = input.manquants.length ? input.manquants.join(", ") : "aucun";
  return [
    "ÉTAT DE LA CAPTATION (calculé par l'application, fiable — ne le recalcule pas, ne le contredis pas) :",
    `- Champs captés : ${captes}`,
    `- Champs absents, à nommer comme absents : ${manquants}`,
  ].join("\n");
}

function blocBrief(brief: TripBrief): string {
  return `TRIP BRIEF (JSON — la seule source de vérité) :\n${JSON.stringify(brief)}`;
}

function assembler(parts: string[]): string {
  return parts.filter((part) => part.trim().length > 0).join("\n\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Passe 1 — fiche-soumission : la fiche de travail INTERNE
// ─────────────────────────────────────────────────────────────────────────────

const FICHE_ROLE = `Tu prépares la FICHE DE TRAVAIL INTERNE dont une agente de voyage québécoise se sert pour monter une soumission.
Lecteur : l'agente elle-même et ses collègues de l'agence. JAMAIS le client — aucune formule de politesse, aucune salutation, aucun argumentaire de vente.
Ton : télégraphique, factuel, dense. Ce n'est pas une soumission et ce n'est pas un devis : c'est la matière première pour en monter une.`;

const FICHE_STRUCTURE = `CE QUE LA FICHE DOIT PORTER :
- titre : une ligne d'identification du dossier à partir de ce qui est capté (ex. « Famille de 4 — Punta Cana — relâche 2027 »). Si la destination est indécise, dis-le (« destination à déterminer »).
- voyageurs : nombre d'adultes, âges des enfants, chambres, composition — uniquement ce qui est capté.
- periode : les dates telles que captées, AVEC leur niveau de précision (« mi-mars, précision : mois »), plus la durée et la flexibilité si captées.
- destinations : la liste captée (destinations, région, hôtel nommé). Liste vide si rien n'est capté.
- type_voyage : type, composantes à réserver, niveau d'encadrement — en français naturel.
- budget : montant total et/ou par personne avec la devise du brief. « non capté » si absent. Ne convertis rien, n'estime rien.
- contraintes : mobilité, santé, restrictions alimentaires, éléments à éviter. Une contrainte de mobilité ou de santé se transcrit intégralement, sans l'adoucir.
- preferences : vols, hébergement, ambiance, motivations, services, occasion.
- a_confirmer : LA section la plus utile. Chaque élément absent ou incertain qui bloque la soumission, formulé comme une action pour l'agente (« Confirmer le nombre de chambres », « Valider si la sœur se joint au groupe »). Reprends les champs absents listés plus haut.
- points_de_vigilance : les contradictions du brief, les contraintes qui vont peser sur le choix du produit, l'hésitation captée. Rien à signaler → tableau vide.`;

const FICHE_CONTRAT = `CLÉS JSON EXIGÉES :
{
  "titre": string,
  "voyageurs": string,
  "periode": string,
  "destinations": string[],
  "type_voyage": string,
  "budget": string,
  "contraintes": string[],
  "preferences": string[],
  "a_confirmer": string[],
  "points_de_vigilance": string[]
}`;

export function buildFicheSoumissionPrompt(input: PassePromptInput): string {
  return assembler([
    `PASSE : ${FICHE_SOUMISSION_PROMPT_VERSION}`,
    FICHE_ROLE,
    LOI_SOURCE,
    FICHE_STRUCTURE,
    CONTRAT_JSON,
    FICHE_CONTRAT,
    blocContexte(input.contexte),
    blocCaptation(input),
    blocBrief(input.brief),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Passe 2 — checklist-documents : signaler, jamais faire autorité
// ─────────────────────────────────────────────────────────────────────────────

const CHECKLIST_ROLE = `Tu dresses l'AIDE-MÉMOIRE DES DOCUMENTS À VÉRIFIER pour un projet de voyage, à l'usage interne d'une agente de voyage québécoise.
Objet : que rien ne passe entre les mailles (passeport, visa ou autorisation de voyage, assurance, documents propres au profil des voyageurs, documents de transport).`;

const CHECKLIST_PRUDENCE = `PRUDENCE OBLIGATOIRE — tu n'es PAS une autorité :
1. Tu ne fais AUCUNE autorité sur les exigences d'entrée d'un pays. Elles dépendent de la citoyenneté et du document de voyage de CHAQUE voyageur, de l'itinéraire (y compris les escales) et du motif du séjour, et elles changent sans préavis.
2. Chaque ligne de la liste est donc un POINT À VÉRIFIER par l'agente, formulé comme tel (« Vérifier si… », « Confirmer auprès de… ») — jamais une affirmation du genre « un visa est requis » ou « aucun visa n'est nécessaire ».
3. Tu ne donnes AUCUN chiffre que le brief ne contient pas : pas de durée de validité, pas de délai de traitement, pas de tarif, pas de numéro de formulaire, pas de nombre de pages libres du passeport.
4. Tu ne nommes aucune source hors de la liste autorisée ci-dessous et tu n'écris aucune adresse Web.
5. Le champ "avertissement" doit dire noir sur blanc, en une ou deux phrases, que cette liste est un aide-mémoire produit à partir de la conversation, qu'elle ne remplace pas les sources officielles, et que les exigences doivent être vérifiées pour chaque voyageur avant toute confirmation.
6. La citoyenneté des voyageurs et la validité réelle de leurs passeports sont presque toujours ABSENTES du brief : dans ce cas, ce sont les deux premiers éléments de "manque_pour_preciser".

SOURCES AUTORISÉES (les seules que tu peux nommer, telles quelles) :
- « Voyage.gc.ca — Conseils et avertissements du gouvernement du Canada »
- « l'ambassade ou le consulat du pays de destination »
- « le transporteur aérien »
- « la compagnie de croisière » (seulement si une croisière est captée)
- « l'assureur voyage »
- « le tour-opérateur du forfait »`;

const CHECKLIST_STRUCTURE = `CE QUE LA LISTE DOIT PORTER :
- contexte : une phrase qui rappelle ce sur quoi la liste est bâtie (destination ou région captée, profil des voyageurs capté). Si la destination est vague, dis-le : la liste est alors générique et tu le signales.
- items : de 4 à 10 points de vérification. Chacun porte :
  · document — ce dont on parle (« Passeport », « Visa ou autorisation de voyage », « Assurance voyage », « Consentement parental », « Documents d'embarquement »),
  · qui — les voyageurs concernés, d'après ce qui est capté (« les 2 adultes », « l'enfant de 8 ans », « tous les voyageurs »),
  · a_verifier — l'action de vérification précise, sans affirmation d'exigence,
  · source_a_consulter — une seule source, prise dans la liste autorisée.
  Adapte les items au profil capté : enfants, voyageur mineur, contrainte de santé ou de mobilité (médicaments, équipement, certificat), croisière, escales, occasion particulière. N'ajoute pas d'item pour un profil qui n'est pas capté.
- manque_pour_preciser : ce qu'il faut demander au client pour resserrer la liste (citoyenneté de chaque voyageur, validité du passeport, itinéraire et escales, statut de l'assurance…).
- avertissement : la mise en garde décrite au point 5 de la prudence.`;

const CHECKLIST_CONTRAT = `CLÉS JSON EXIGÉES :
{
  "contexte": string,
  "items": [ { "document": string, "qui": string, "a_verifier": string, "source_a_consulter": string } ],
  "manque_pour_preciser": string[],
  "avertissement": string
}`;

export function buildChecklistDocumentsPrompt(input: PassePromptInput): string {
  return assembler([
    `PASSE : ${CHECKLIST_DOCUMENTS_PROMPT_VERSION}`,
    CHECKLIST_ROLE,
    LOI_SOURCE,
    CHECKLIST_PRUDENCE,
    CHECKLIST_STRUCTURE,
    CONTRAT_JSON,
    CHECKLIST_CONTRAT,
    blocContexte(input.contexte),
    blocCaptation(input),
    blocBrief(input.brief),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Passe 3 — relance-j7 : un BROUILLON, jamais envoyé
// ─────────────────────────────────────────────────────────────────────────────

const RELANCE_ROLE = `Tu rédiges le BROUILLON du courriel de relance qu'une agente de voyage québécoise envoie à un client environ une semaine après une conversation restée sans suite.
Point de vue : l'agente. Destinataire : le client, au VOUVOIEMENT. Longueur : 90 à 150 mots.
Ce texte est un BROUILLON : il n'est JAMAIS envoyé automatiquement. L'agente le relit, l'édite, et c'est elle qui décide de l'envoyer. Écris donc un texte qu'elle peut corriger en trois secondes, pas un texte définitif.`;

const RELANCE_REGLES = `RÈGLES DE LA RELANCE :
1. AUCUNE PRESSION. Pas de rareté (« il ne reste que… »), pas d'urgence (« dernière chance », « les prix montent »), pas de date limite, pas de relance culpabilisante. Le client a le droit de ne pas répondre.
2. Aucun prix, aucune offre, aucune disponibilité, aucun nom de produit qui ne serait pas déjà dans le brief. Ce courriel rouvre la conversation, il ne vend rien.
3. Reformule le projet en une ou deux lignes, seulement avec ce qui est capté — c'est ce qui prouve au client qu'on l'a écouté.
4. HÉSITATION CAPTÉE : si une raison d'hésitation figure au brief, traite-la avec tact, comme une porte ouverte, jamais comme un reproche ni un diagnostic. Ne dis jamais au client qu'il « hésite », ne cite pas ses mots, n'expose pas une raison délicate. Angles admis :
   · prix ou budget → offrir de retravailler le projet dans son budget, sans chiffrer ;
   · dates → offrir de regarder d'autres périodes ;
   · attente d'un co-voyageur → « dès que vous aurez le mot des autres, je poursuis » ;
   · comparaison en cours → laisser du temps, rester disponible pour comparer ;
   · pas prêt → un mot léger, la porte reste ouverte, aucune insistance.
5. CONTEXTE HUMAIN : si le brief porte un contexte personnel sensible (deuil, séparation, appréhension, occasion émotive), reste sobre et délicat, ou n'en parle pas. Jamais de ton commercial là-dessus.
6. Une seule question ouverte à la fin, simple, qui n'exige pas de décision (« est-ce que ça vaut la peine que je vous prépare des options ? »).
7. Ne promets aucun délai ni aucune livraison que le brief ne contient pas.
8. points_a_valider : ce que l'agente doit vérifier ou ajuster avant d'envoyer (élément délicat effleuré, information absente qu'elle seule connaît, choix de ton). Toujours au moins un élément.`;

const RELANCE_STRUCTURE = `STRUCTURE DU BROUILLON :
- Salutation avec le prénom du client s'il est connu, sinon « Bonjour, ».
- Un rappel court et chaleureux de l'échange (sans date inventée : sers-toi du contexte fourni).
- Une ou deux lignes qui reformulent le projet capté.
- La porte ouverte, tenant compte de l'hésitation si elle est captée.
- La question ouverte finale.
- Clôture + signature fournie, telle quelle.`;

const RELANCE_CONTRAT = `CLÉS JSON EXIGÉES :
{
  "objet": string,
  "corps": string,
  "points_a_valider": string[]
}
- objet : court, concret, sans appât (ex. « Votre projet de voyage — on continue ? »).
- corps : le courriel complet en français, avec sauts de ligne, signature incluse.`;

export function buildRelanceJ7Prompt(input: PassePromptInput): string {
  const agent = input.contexte.agentName?.trim() || "Votre conseiller·ère";
  const agence = input.contexte.agencyName?.trim() || "La Forfaiterie";
  return assembler([
    `PASSE : ${RELANCE_J7_PROMPT_VERSION}`,
    RELANCE_ROLE,
    LOI_SOURCE,
    RELANCE_REGLES,
    RELANCE_STRUCTURE,
    CONTRAT_JSON,
    RELANCE_CONTRAT,
    `SIGNATURE À UTILISER (telle quelle, sur deux lignes) :\n${agent}\n${agence}`,
    blocContexte(input.contexte),
    blocCaptation(input),
    blocBrief(input.brief),
  ]);
}
