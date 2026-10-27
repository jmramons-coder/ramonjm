import type { TripBrief } from "@/lib/extraction/trip-brief";

export const RECAP_PROMPT_VERSION = "recap-v2-fr-resolution";

export type RecapContext = { agentName?: string; agencyName?: string };

// ─────────────────────────────────────────────────────────────────────────────
// Rôle
// ─────────────────────────────────────────────────────────────────────────────
const ROLE = `Tu rédiges le COURRIEL DE SUIVI qu'un agent de voyage québécois envoie à son client après une rencontre.
On te donne un "TripBrief" (ce que l'agent a compris du projet). Tu écris un courriel chaleureux, humain et professionnel, du point de vue de l'agent, adressé au client (VOUVOIEMENT).`;

// ─────────────────────────────────────────────────────────────────────────────
// Règles
// ─────────────────────────────────────────────────────────────────────────────
const REGLES = `RÈGLES :
1. N'utilise QUE les champs réellement captés (statut "capte", "incertain" ou "contradiction" avec une valeur). IGNORE les champs "manquant" ou null — ne les mentionne pas, n'invente RIEN (ni prix, ni hôtel, ni vol, ni date que le client n'a pas donnés).
2. Ce n'est PAS une soumission ni un devis. C'est un suivi qui (a) confirme que tu as bien compris le projet, et (b) annonce les prochaines étapes. Aucun prix, aucune offre précise.
3. Rends les valeurs en FRANÇAIS NATUREL, jamais les clés techniques : "tout_inclus" → « un tout-inclus » ; "destination_soleil" → « une destination soleil » ; "attend_co_voyageur" → « vous attendez de confirmer avec vos co-voyageurs ». N'écris jamais de nom de champ ni d'enum.
4. CONTEXTE HUMAIN : si le brief contient un contexte personnel sensible (deuil, séparation, première expérience, appréhension, occasion émotive), traite-le avec délicatesse et chaleur — jamais de façon commerciale ou maladroite. Un mot humain, sobre, suffit.
5. BLOCAGE : si une raison d'hésitation est captée, aborde-la avec tact comme une prochaine étape (« dès que vous aurez confirmé…, je finalise »), sans aucune pression.
6. DATES FLOUES : si la date est imprécise (précision mois/saison), reste vague de la même façon (« au printemps », « en mars ») — n'invente pas de date exacte.
7. Ton québécois professionnel et chaleureux, phrases courtes, paragraphes aérés. Pas de jargon, pas de superlatifs creux. 150–250 mots.

8. LES MOTS DU CLIENT PASSENT AVANT LES NÔTRES. Le brief peut contenir un bloc \`lieu.resolution\` : c'est NOTRE travail de situer le lieu, pas ce que le client a dit. Tu peux t'en servir pour écrire naturellement (« votre projet à Michès, en République dominicaine »), mais **nomme toujours l'endroit comme le client l'a nommé**. N'échange JAMAIS son mot contre le nôtre : un client qui a dit « Club Med Michès » et qui lit « votre voyage à Punta Cana » croira qu'on l'a mal compris — la région touristique est un repère d'industrie, pas son voyage. Et si la résolution est absente, nulle ou peu sûre, tu n'en parles pas du tout.`;

// ─────────────────────────────────────────────────────────────────────────────
// Structure + exemple
// ─────────────────────────────────────────────────────────────────────────────
const STRUCTURE = `STRUCTURE DU COURRIEL :
- Salutation (« Bonjour {prénom du client s'il est connu, sinon "Bonjour"}, »).
- Un remerciement pour l'échange.
- Un court paragraphe qui reformule le projet compris (destination ou intention, voyageurs, période, type/ambiance, éléments-clés) — seulement ce qui est capté.
- Les prochaines étapes concrètes : ce que TU (l'agent) vas faire, et ce dont tu as besoin du client (dont le blocage s'il y en a un).
- Clôture chaleureuse + signature fournie.

EXEMPLE DE TON (à adapter, ne pas copier) :
« Bonjour Marie,
Merci pour notre belle discussion aujourd'hui. Si je résume : vous planifiez une semaine dans le Sud en famille, autour de la relâche, dans un tout-inclus près de la plage, pour un budget d'environ 6 000 $.
Je vais vous préparer quelques options qui correspondent à ça. Dès que vous aurez confirmé si votre sœur et son conjoint se joignent à vous, je finalise le tout — ça peut changer le nombre de chambres.
Au plaisir de concrétiser ce voyage avec vous,
… »`;

const CONTRAT = `SORTIE : réponds UNIQUEMENT avec un JSON valide { "subject": string, "body": string }.
- subject : court et personnalisé (ex. « Votre projet de voyage à Punta Cana — prochaines étapes » ; si destination indécise : « Votre projet de voyage — suivi »).
- body : le courriel complet en français, avec sauts de ligne.
Aucun texte hors du JSON, aucun bloc Markdown.`;

export function buildRecapPrompt(brief: TripBrief, ctx: RecapContext = {}): string {
  const agent = ctx.agentName?.trim() || "Votre conseiller·ère";
  const agency = ctx.agencyName?.trim() || "La Forfaiterie";
  return [
    ROLE,
    REGLES,
    STRUCTURE,
    CONTRAT,
    `SIGNATURE À UTILISER (telle quelle, sur deux lignes) :\n${agent}\n${agency}`,
    "TRIP BRIEF (JSON — n'utilise QUE les champs captés) :",
    JSON.stringify(brief),
  ].join("\n\n");
}
