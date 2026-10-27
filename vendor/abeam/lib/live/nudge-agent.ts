/**
 * NUDGE AGENT conversationnel (tranche 2.5) — la porte vers l'écran devient un
 * dialogue : l'agent de voyage lui écrit, il va chercher dans l'écosystème
 * (avis TripAdvisor, hôtels, vols) et répond court, factuel, sourcé.
 *
 * Il connaît le brief en cours (ce qui est capté / ce qui manque) et les
 * contraintes persistantes du client (Concierge). Il ne réserve rien, ne
 * conseille pas à la place de l'agent : il informe.
 *
 * Prompt = ARTEFACT DE JUGEMENT (équipe).
 */

import { generateText, stepCountIs, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import { budgetValide, type TripBrief } from "../extraction/trip-brief";
import { resolveDestination } from "../suggestions/destinations";
import { SerpApiClient } from "../suggestions/serpapi";

export const NUDGE_AGENT_PROMPT_VERSION = "nudge-agent-v1";
const MODEL_ID = "gpt-4.1-mini";

export type NudgeMessage = { role: "user" | "assistant"; content: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

const SYSTEM = `Tu es le Nudge Agent d'aBeam : le copilote discret d'un agent de voyage québécois, EN PLEINE RENCONTRE avec son client.
L'agent t'écrit pendant la conversation. Tu réponds pour l'aider à décider et à parler juste — jamais pour prendre sa place.

RÈGLES :
1. COURT. 1 à 3 phrases. L'agent lit ça du coin de l'œil pendant qu'il parle à un client. Pas de listes à puces interminables, pas de préambule.
2. FACTUEL ET SOURCÉ. Utilise tes outils pour aller chercher l'information réelle (avis, hôtels, vols). Cite la source en fin de réponse (« — avis TripAdvisor », « — Google Hotels »). N'INVENTE JAMAIS un prix, un avis, une disponibilité ou un nom d'hôtel.
3. SI TU NE SAIS PAS, DIS-LE. « Je n'ai rien trouvé là-dessus » vaut mieux qu'une supposition. Si une information manque dans le brief pour chercher (destination, dates), dis précisément ce qui manque.
4. LES CONTRAINTES DU CLIENT PASSENT AVANT. Si la question touche un lieu et que le client a une contrainte (mobilité, allergie, aversion), vérifie-la dans les avis et mentionne ce que tu trouves, même si on ne t'a pas posé la question là-dessus.
5. FRANÇAIS québécois professionnel, tutoiement de l'agent (c'est ton collègue). Pas d'emoji.
6. Tu ne réserves rien, tu ne rédiges pas de courriel, tu n'inventes pas de politique d'agence.`;

function briefDigest(brief: TripBrief | null): string {
  if (!brief) return "Aucun brief encore : la conversation vient de commencer.";
  const v = <T,>(f: { valeur: T | null; statut: string } | undefined) =>
    f && f.valeur !== null && f.statut !== "manquant" ? f.valeur : null;
  const parts: string[] = [];
  const dest = v(brief.lieu.destinations) as string[] | null;
  if (dest?.length) parts.push(`destination(s) : ${dest.join(", ")}`);
  const hotel = v(brief.lieu.hotel_nomme);
  if (hotel) parts.push(`hôtel nommé : ${hotel}`);
  const origine = v(brief.lieu.origine);
  if (origine) parts.push(`départ de : ${origine}`);
  const aeroport = v(brief.vols.aeroport_depart);
  if (aeroport) parts.push(`aéroport cité : ${aeroport}`);
  if (brief.temps.depart.verbatim) parts.push(`période : ${brief.temps.depart.verbatim}`);
  const duree = v(brief.temps.duree);
  if (duree) parts.push(`durée : ${String(duree).replace(/_/g, " ")}`);
  const adultes = v(brief.voyageurs.adultes);
  const enfants = (v(brief.voyageurs.enfants_ages) as number[] | null) ?? [];
  if (adultes) parts.push(`voyageurs : ${adultes} adulte(s)${enfants.length ? ` + enfants (${enfants.join(", ")} ans)` : ""}`);
  const budget = budgetValide(brief.budget.total) ?? budgetValide(brief.budget.par_personne);
  if (budget !== null) parts.push(`budget : ${budget} $ CAD`);
  const contrainte = v(brief.contraintes.mobilite_sante);
  if (contrainte) parts.push(`CONTRAINTE : ${contrainte}`);
  const resto = v(brief.contraintes.restrictions_alimentaires);
  if (resto) parts.push(`restriction alimentaire : ${resto}`);
  return parts.length ? parts.join(" · ") : "Brief encore vide.";
}

export async function askNudgeAgent(input: {
  messages: NudgeMessage[];
  brief: TripBrief | null;
  profileConstraints: string[];
  serpApiKey: string;
}): Promise<{ reply: string; searchesUsed: number }> {
  const serp = new SerpApiClient(input.serpApiKey, 4); // budget serré : c'est une question, pas un balayage
  const constraints = [
    ...input.profileConstraints,
    ...(input.brief?.contraintes.mobilite_sante.valeur ? [String(input.brief.contraintes.mobilite_sante.valeur)] : []),
  ];

  const tools = {
    chercher_avis: tool({
      description: "Cherche un lieu ou un hôtel sur TripAdvisor et lit ses avis récents. À utiliser pour vérifier une inquiétude concrète (accessibilité, plage, propreté, bruit, nourriture).",
      inputSchema: z.object({
        lieu: z.string().describe("Nom de l'hôtel, de la ville ou de l'attraction"),
        preoccupation: z.string().nullable().describe("Ce qu'on cherche à vérifier, ex. « plage accessible sans roches »"),
      }),
      execute: async ({ lieu, preoccupation }) => {
        try {
          const search = (await serp.tripadvisorSearch(lieu)) as { places?: Raw[] };
          const top = (search.places ?? []).find((p) => p.place_id);
          if (!top) return { trouve: false, note: "Aucun lieu correspondant sur TripAdvisor." };
          const reviewsRes = (await serp.tripadvisorReviews(top.place_id, { limit: 20 })) as { reviews?: Raw[] };
          const avis = (reviewsRes.reviews ?? []).slice(0, 20).map((r) => ({
            note: r.rating ?? null,
            date: r.trip_date ?? null,
            texte: String(r.snippet ?? r.text ?? "").slice(0, 400),
          }));
          return {
            trouve: true,
            lieu: top.title ?? lieu,
            note_globale: top.rating ?? null,
            nombre_avis: top.reviews ?? null,
            preoccupation_recherchee: preoccupation,
            avis,
          };
        } catch (error) {
          return { trouve: false, erreur: error instanceof Error ? error.message : "recherche impossible" };
        }
      },
    }),
    chercher_hotels: tool({
      description: "Cherche des hôtels réels avec prix pour une destination et des dates précises.",
      inputSchema: z.object({
        destination: z.string(),
        arrivee: z.string().describe("Date d'arrivée AAAA-MM-JJ"),
        depart: z.string().describe("Date de départ AAAA-MM-JJ"),
        adultes: z.number().nullable(),
        etoiles: z.string().nullable().describe("Ex. « 4 » ou « 4,5 »"),
      }),
      execute: async ({ destination, arrivee, depart, adultes, etoiles }) => {
        try {
          const resolved = resolveDestination(destination)[0];
          const res = (await serp.googleHotels({
            q: resolved?.hotelsQ ?? destination,
            check_in_date: arrivee,
            check_out_date: depart,
            adults: adultes ?? 2,
            hotel_class: etoiles ?? undefined,
          })) as { properties?: Raw[] };
          return {
            hotels: (res.properties ?? []).slice(0, 4).map((p) => ({
              nom: p.name,
              prix_par_nuit: p.rate_per_night?.lowest ?? null,
              note: p.overall_rating ?? null,
              avis: p.reviews ?? null,
            })),
          };
        } catch (error) {
          return { erreur: error instanceof Error ? error.message : "recherche impossible" };
        }
      },
    }),
    chercher_vols: tool({
      description: "Cherche des vols réels avec prix. Nécessite une date de départ précise.",
      inputSchema: z.object({
        origine: z.string().describe("Ville ou code IATA de départ"),
        destination: z.string(),
        date_aller: z.string().describe("AAAA-MM-JJ"),
        date_retour: z.string().nullable().describe("AAAA-MM-JJ ou null"),
        adultes: z.number().nullable(),
      }),
      execute: async ({ origine, destination, date_aller, date_retour, adultes }) => {
        try {
          const from = /^[A-Za-z]{3}$/.test(origine.trim())
            ? origine.trim().toUpperCase()
            : /qu[eé]bec/i.test(origine) ? "YQB" : "YUL";
          const to = resolveDestination(destination)[0]?.iata;
          if (!to) return { erreur: `Destination « ${destination} » non résolue en aéroport.` };
          const res = (await serp.googleFlights({
            departure_id: from,
            arrival_id: to,
            outbound_date: date_aller,
            return_date: date_retour ?? undefined,
            type: date_retour ? 1 : 2,
            adults: adultes ?? 2,
          })) as Raw;
          const vols = [...(res.best_flights ?? []), ...(res.other_flights ?? [])].slice(0, 4);
          return {
            vols: vols.map((f: Raw) => ({
              compagnies: [...new Set((f.flights ?? []).map((l: Raw) => l.airline))].join(" + "),
              prix: f.price ?? null,
              duree_minutes: f.total_duration ?? null,
              escales: Math.max(0, (f.flights ?? []).length - 1),
            })),
            prix_typique: res.price_insights?.typical_price_range ?? null,
          };
        } catch (error) {
          return { erreur: error instanceof Error ? error.message : "recherche impossible" };
        }
      },
    }),
  };

  const context = [
    `BRIEF EN COURS : ${briefDigest(input.brief)}`,
    constraints.length ? `CONTRAINTES CONNUES DU CLIENT (à honorer en priorité) : ${[...new Set(constraints)].join(" ; ")}` : null,
    `Date du jour : ${new Date().toISOString().slice(0, 10)}`,
  ].filter(Boolean).join("\n");

  const result = await generateText({
    model: openai(MODEL_ID),
    temperature: 0.2,
    system: `${SYSTEM}\n\n${context}`,
    messages: input.messages.slice(-10),
    tools,
    stopWhen: stepCountIs(5),
  });

  const reply = result.text.trim() || "Je n'ai rien trouvé de fiable là-dessus.";
  return { reply, searchesUsed: serp.searchesUsed };
}
