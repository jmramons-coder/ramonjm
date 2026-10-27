/**
 * TRIGGER-SCAN — le mini-agent de la VOIE RAPIDE (règles §2.1) : lit la
 * fenêtre récente du transcript live (bruité) et n'en sort QUE les
 * déclencheurs. Rapide (~1-2 s), pas de nettoyage préalable : le prompt
 * tolère les erreurs STT. Prompt = ARTEFACT DE JUGEMENT (équipe).
 */

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

import type { TranscriptLine } from "../transcription/types";
import type { DestinationDite, IntentionDestination, LiveTriggers } from "./live-brief.ts";
import { PROMPT_VERSIONS } from "../ai/prompt-registry.ts";

/**
 * Modèle de la voie rapide. §2 demande « modèle rapide, prompt minuscule ».
 * Le choix est MESURÉ, pas supposé : `pnpm check:triggers` compare les
 * candidats sur des fenêtres réelles (qualité ET latence) — un scan rapide qui
 * rate le nom d'hôtel ne sert à rien, la règle du produit nommé (§1) repose
 * entièrement sur ce champ.
 */
export const TRIGGER_SCAN_MODEL = "gpt-4.1-mini";
export const TRIGGER_SCAN_PROMPT_VERSION = PROMPT_VERSIONS.triggerScan;

const SCAN_PROMPT = `Tu es le détecteur de déclencheurs d'un copilote pour agents de voyage au Québec.
On te donne la FENÊTRE RÉCENTE d'une conversation en cours (français québécois, parfois anglais, avec des erreurs de captation possibles — interprète-les sans te laisser piéger).

Extrais UNIQUEMENT ce qui a été dit dans cette fenêtre :
- destinations_dites : TOUS les lieux nommés, écartés compris, dans l'ordre dit : [{"nom":"Floride","intention":"rejetee"}]. intention = "rejetee" sur un refus DIT (« c'est pas la Floride qui nous intéresse », « on aimerait plutôt les Caraïbes ») ; "evoquee" sur un lieu raconté sans projet d'y aller (souvenir, famille, comparaison) ; "souhaitee" sinon
- destinations : les lieux que le client VEUT. Un lieu "rejetee" ou "evoquee" n'y entre PAS. Plusieurs envies explicites restent toutes dans la liste, dans l'ordre où elles ont été dites ; cet ordre sert à stabiliser le sujet et le rendu, jamais à choisir une destination. Dans le doute, le lieu est voulu
- hotel : un hôtel, un resort ou une CHAÎNE hôtelière nommée (« Club Med », « Riu Palace Macao », « Iberostar Selection »). C'est le déclencheur le plus important : une simple catégorie (« un 4 étoiles », « un tout-inclus ») N'EST PAS un nom → null. En revanche un nom APPROXIMATIF, écorché ou incomplet RESTE un nom : recopie ce qui a été dit (« les Roches quelque chose », « le Bellevue je pense ») et signale-le dans hotel_nom_incertain — ne mets jamais null parce que le nom a l'air incertain
- origine : ville de départ si dite (sinon null)
- aeroport_depart : aéroport ou code explicitement cité (« YQB », « Montréal-Trudeau »), sinon null ; ne le déduis pas de la ville
- date_verbatim : les mots exacts sur le moment du voyage (« en mars », « semaine de relâche », « le 10 mars 2027ish ») — sinon null
- duree : moins_7j | sept_j | dix_j | quatorze_j | plus_14j si une durée claire est dite, sinon null
- adultes : nombre d'adultes si dit, sinon null
- enfants_ages : âges des enfants mentionnés, sinon []
- contraintes : santé/mobilité/allergies/choses à éviter dites (courtes phrases FR), sinon []
- hesitation : la raison d'hésitation du CLIENT SUR SON PROJET si exprimée — prix, dates, il attend un co-voyageur, il compare (courte phrase) ; sinon null
- hotel_nom_incertain : true UNIQUEMENT si la personne montre qu'elle n'est pas sûre du NOM de l'établissement (elle le cherche, l'approxime, dit qu'elle l'a oublié : « les Roches quelque chose », « je sais plus le nom exact », « ça s'appelait comment déjà »). Une hésitation sur le prix, les dates ou la décision de partir n'est PAS ça → false. Défaut : false

RÈGLES : n'invente RIEN (absent → null/[]/false) ; ignore le small talk ; ne déduis pas au-delà de la fenêtre.
SORTIE : uniquement le JSON {"destinations_dites":[],"destinations":[],"hotel":null,"origine":null,"aeroport_depart":null,"date_verbatim":null,"duree":null,"adultes":null,"enfants_ages":[],"contraintes":[],"hesitation":null,"hotel_nom_incertain":false} rempli. Aucun texte hors du JSON.`;

const DUREES = new Set(["moins_7j", "sept_j", "dix_j", "quatorze_j", "plus_14j"]);

const INTENTIONS = new Set(["souhaitee", "evoquee", "rejetee"]);

/**
 * La MÊME normalisation que `cle` dans `cadence.ts` (NFD, diacritiques retirés,
 * minuscules, espaces compactés). Les deux doivent rester d'accord : c'est elle
 * qui décide si le « Floride » écarté et le « floride » de la liste filtrée sont
 * le même mot. Le banc le prouve de bout en bout plutôt que d'exporter `cle`.
 */
function cleDite(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Plafond à 8 et non 5 : `destinations` est plafonné à 5 depuis toujours, et
 * `destinations_dites` doit pouvoir porter ces 5 PLUS les écartés et les
 * évoqués. Tronquer la liste détaillée avant la liste filtrée perdrait un refus.
 * Les fenêtres réelles mesurées portent 2 à 3 lieux.
 */
function lireDites(raw: unknown): DestinationDite[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((d) => (d && typeof d === "object" ? (d as Record<string, unknown>) : {}))
    .map((d) => ({
      nom: typeof d.nom === "string" ? d.nom.trim() : "",
      // Une intention inconnue ou absente n'efface JAMAIS un nom : elle le rend
      // simplement cherchable. Le défaut du parseur est le défaut du prompt
      // (« dans le doute, le lieu est voulu »), pour que le repli et la consigne
      // ne se contredisent pas — la pire régression de ce chantier serait un
      // feed éteint en silence, où même la loi 4 resterait muette.
      intention: (typeof d.intention === "string" && INTENTIONS.has(d.intention) ? d.intention : "souhaitee") as IntentionDestination,
    }))
    .filter((d) => d.nom)
    .slice(0, 8);
}

/**
 * LE DEUX-EN-UN DU LIEU : ce qu'on va CHERCHER, et tout ce qui a été DIT.
 *
 * Exportée, et c'est délibéré : la pire régression de ce point est l'extinction
 * silencieuse du feed (plus rien ne s'affiche, aucune recherche ne part, donc
 * même la loi 4 reste muette et l'agente conclut à une panne). Ce risque ne
 * vivait que dans un banc PAYANT ; en sortant la lecture du JSON du corps
 * asynchrone, `pnpm check:livebrief` l'éprouve gratuitement sur les formes
 * dégénérées que le modèle peut rendre — et sur le VRAI code, pas sur une copie.
 */
export function lireDestinations(raw: Record<string, unknown>): Pick<LiveTriggers, "destinations" | "destinations_dites"> {
  const dites = lireDites(raw.destinations_dites);
  const brutes = Array.isArray(raw.destinations) ? raw.destinations.map(String).filter(Boolean).slice(0, 5) : [];
  // Le champ historique fait foi sur CE QU'ON CHERCHE — mais jamais contre un
  // refus dit. Quand `destinations_dites` est absent, `refuses` est vide et on
  // rend exactement ce qu'on rendait hier.
  const refuses = new Set(dites.filter((d) => d.intention !== "souhaitee").map((d) => cleDite(d.nom)));
  let destinations = brutes.filter((d) => !refuses.has(cleDite(d)));
  // RÉPARATION : le modèle a tout mis dans le détail et rien dans la réponse.
  // Reprendre ses "souhaitee" n'invente rien — c'est lui qui les a écrites ; les
  // jeter éteindrait le feed sur une simple maladresse de format. On ne répare
  // QUE le silence : si le modèle a rempli `destinations` et que tout a été
  // écarté, c'est lui qui a parlé, on ne le contredit pas.
  if (destinations.length === 0 && brutes.length === 0) {
    destinations = dites.filter((d) => d.intention === "souhaitee").map((d) => d.nom).slice(0, 5);
  }
  return {
    destinations,
    // Jamais absent en sortie de scan : un modèle qui n'a pas produit le détail
    // laisse quand même une piste d'audit cohérente avec ce qu'on va chercher.
    destinations_dites: dites.length ? dites : destinations.map((nom) => ({ nom, intention: "souhaitee" as const })),
  };
}

export async function runTriggerScan(
  lines: TranscriptLine[],
  options: { model?: string } = {},
): Promise<LiveTriggers> {
  const windowText = lines.map((l) => `${l.speaker}: ${l.text}`).join("\n");
  const result = await generateText({
    model: openai(options.model ?? TRIGGER_SCAN_MODEL),
    temperature: 0,
    prompt: `${SCAN_PROMPT}\n\nFENÊTRE:\n${windowText}`,
  });

  const empty: LiveTriggers = { destinations: [], destinations_dites: [], hotel: null, origine: null, aeroport_depart: null, date_verbatim: null, duree: null, adultes: null, enfants_ages: [], contraintes: [], hesitation: null, hotel_nom_incertain: false };
  const match = result.text.match(/\{[\s\S]*\}/);
  if (!match) return empty;

  try {
    const raw = JSON.parse(match[0]) as Record<string, unknown>;
    return {
      ...lireDestinations(raw),
      hotel: typeof raw.hotel === "string" && raw.hotel.trim() ? raw.hotel.trim() : null,
      origine: typeof raw.origine === "string" && raw.origine.trim() ? raw.origine.trim() : null,
      aeroport_depart: typeof raw.aeroport_depart === "string" && raw.aeroport_depart.trim() ? raw.aeroport_depart.trim() : null,
      date_verbatim: typeof raw.date_verbatim === "string" && raw.date_verbatim.trim() ? raw.date_verbatim.trim() : null,
      duree: typeof raw.duree === "string" && DUREES.has(raw.duree) ? (raw.duree as LiveTriggers["duree"]) : null,
      adultes: typeof raw.adultes === "number" && raw.adultes > 0 && raw.adultes < 100 ? Math.round(raw.adultes) : null,
      enfants_ages: Array.isArray(raw.enfants_ages) ? raw.enfants_ages.filter((a): a is number => typeof a === "number" && a >= 0 && a < 18).slice(0, 10) : [],
      contraintes: Array.isArray(raw.contraintes) ? raw.contraintes.map(String).filter(Boolean).slice(0, 5) : [],
      hesitation: typeof raw.hesitation === "string" && raw.hesitation.trim() ? raw.hesitation.trim() : null,
      // `=== true` et pas de coercition : un modèle qui rend "true", 1 ou une
      // phrase ne doit PAS armer une recherche. Le défaut est false, et le
      // détecteur lexical de repli reste là pour ces cas-là.
      hotel_nom_incertain: raw.hotel_nom_incertain === true,
    };
  } catch {
    return empty;
  }
}
