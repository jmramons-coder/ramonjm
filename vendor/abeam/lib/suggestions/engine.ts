/**
 * Moteur de suggestions — la chaîne du PDF d'architecture, à sens unique :
 *
 *   TripBrief (= sortie du Master Context Agent ; en live, le Raw Context
 *   Agent se branchera EN AMONT sans rien changer ici)
 *     → PAYLOAD AGENT  : les gates — pas d'inputs, rien ne part (§1 règles)
 *     → CLUSTER        : Flight / Hotel / TripAdvisor+Vigie (SerpAPI, one-way)
 *     → NUDGE GATEWAY  : la seule porte vers l'écran — curation des cartes
 *                        + nudges d'info manquante (jamais l'un sans besoin)
 *
 * Le cluster ne répond jamais au Payload : il livre au Nudge. La « boucle »
 * se referme par la conversation elle-même (le nudge fait poser la question,
 * la réponse revient par le micro). Imports relatifs volontaires (scripts Node).
 */

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

import type { TripBrief, Field, LieuResolution } from "../extraction/trip-brief";
import {
  nameOverlap,
  norm,
  resolveDestination,
  resolveDestinationRemote,
  resolvePropertyRemote,
  type ResolvedDestination,
  type ResolvedProperty,
} from "./destinations.ts";
import { SerpApiClient } from "./serpapi.ts";
import { PROMPT_VERSIONS } from "../ai/prompt-registry.ts";
import { safeFlightSegments } from "../product-search/offer-metadata.ts";
import type { ProductSearchFlightSegment } from "../product-search/types.ts";
import { conversationFlightSearchUrl } from "../conversation/offer-link.ts";

export const VIGIE_PROMPT_VERSION = PROMPT_VERSIONS.vigie;

// Réponses SerpAPI non typées — accès défensif uniquement.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

// ── Modèle de carte ──────────────────────────────────────────────────────────
export type SuggestionItem = {
  titre: string;
  detail?: string;
  prix?: string;
  note?: string;
  image?: string;        // héros pleine résolution
  images?: string[];     // galerie (vignettes)
  lien?: string;
  /** Executed provider search URL, never an individual booking link. */
  lienRecherche?: string;
  /** Returned flight legs, with supplied local times; no inferred return itinerary. */
  segments?: ProductSearchFlightSegment[];
};

export type SuggestionCard = {
  id: string;
  type: "vigie" | "vols" | "hotels" | "avis" | "info"; // "info" = réponse promue au feed par l'agent
  /** Audience gate for live cards; unmarked cards stay on the agent side. */
  audience?: "agent" | "client";
  priorite: number; // 0 = vigie (toujours en tête)
  titre: string;
  sousTitre?: string;
  badge?: string;
  extraits?: string[]; // vigie : citations d'avis
  items: SuggestionItem[];
  source: string;
};

export type NudgeItem = {
  champ: string;   // l'élément manquant (ex. "dates", "destination")
  message: string; // formulation discrète pour l'agent
  debloque: string; // ce que ça débloquerait (ex. "vols", "hôtels")
};

export type SuggestionsResult = {
  cards: SuggestionCard[];
  nudges: NudgeItem[];
  searchesUsed: number;
  warnings: string[];
  promptVersions?: { vigie: string };
};

/**
 * NUDGE GATEWAY — la seule porte vers l'écran (PDF : « gateway to the worker interface »).
 *
 * C'est aussi le seul endroit où « rien à afficher » se décide — donc le seul
 * endroit honnête pour dire « j'ai cherché et je n'ai pas trouvé ». Nos lois
 * disent « rien à dire → rien affiché » ; elles ne disent pas « j'ai échoué →
 * rien affiché ». Si des recherches sont parties et que la porte ne laisse
 * passer NI carte NI nudge, on ne referme pas dans le silence : un message,
 * un seul, en français d'agente.
 */
function nudgeGateway(cards: SuggestionCard[], nudges: NudgeItem[], searchesUsed: number, warnings: string[]): SuggestionsResult {
  const sorted = [...cards].sort((a, b) => a.priorite - b.priorite);
  const vigies = sorted.filter((c) => c.type === "vigie");
  const autres = sorted.filter((c) => c.type !== "vigie").slice(0, 6); // budget d'attention (§3) ; la vigie en est exemptée
  /**
   * L'ÉCHEC D'UNE RECHERCHE PARTIE PASSE DEVANT UN RAPPEL GÉNÉRIQUE.
   *
   * Le plafond de deux nudges est un budget d'attention (§3) et il ne bouge pas.
   * Mais il coupait dans l'ordre où le moteur pousse, qui est l'ordre du CODE et
   * non celui de l'utilité. Cas démontré : « on veut aller à Cuba, à l'hôtel
   * Bellevue je pense », sans date. Trois messages partent — `destination`,
   * `dates`, `hotel_introuvable` — et c'est le troisième qui tombe. Deux
   * recherches ont été payées, Google n'a pas reconnu l'hôtel, et l'agente
   * n'apprend JAMAIS un mot sur l'établissement que son client vient de nommer :
   * elle en conclut que la machine ne l'a pas entendu. C'est la loi 4 (« l'échec
   * se dit ») évincée par un rappel de dates — que l'agente, elle, sait déjà.
   *
   * La règle de priorité est celle que le produit énonce déjà pour justifier ses
   * évictions : CE QU'AUCUNE CARTE NE DIT passe en premier. Un échec de
   * recherche est une information que rien d'autre à l'écran ne porte ; un
   * rappel « il faudrait des dates » est une évidence de métier.
   *
   * Tri STABLE : à priorité égale, l'ordre du moteur est conservé — on ne
   * réordonne que ce qui doit l'être.
   */
  const PRIORITE_NUDGE: Record<string, number> = {
    hotel_introuvable: 0,
    recherche_infructueuse: 0,
    lieu_contradictoire: 1,
    destination: 2,
  };
  const rangNudge = (champ: string) => PRIORITE_NUDGE[champ] ?? 3;
  const dedupNudges = [...new Map(nudges.map((n) => [n.champ, n])).values()]
    .map((n, index) => ({ n, index }))
    .sort((a, b) => rangNudge(a.n.champ) - rangNudge(b.n.champ) || a.index - b.index)
    .map((x) => x.n)
    .slice(0, 2);
  if (searchesUsed > 0 && vigies.length + autres.length === 0 && dedupNudges.length === 0) {
    dedupNudges.push({
      champ: "recherche_infructueuse",
      message: "J'ai cherché de mon côté, sans rien trouver d'assez solide à montrer pour l'instant.",
      debloque: "une piste de plus (un nom, une ville, une période) et je réessaie",
    });
  }
  return {
    cards: [...vigies, ...autres],
    nudges: dedupNudges,
    searchesUsed,
    warnings,
    promptVersions: { vigie: VIGIE_PROMPT_VERSION },
  };
}

// ── Helpers brief ────────────────────────────────────────────────────────────
const val = <T,>(f: Field<T> | undefined | null): T | null => (f && f.valeur !== null && f.valeur !== undefined ? f.valeur : null);

/**
 * SEUIL DE RÉSOLUTION — sous lui, une résolution n'est PAS une résolution.
 *
 * `lieu.resolution.confiance` est le doute que le Master Context déclare sur SA
 * propre localisation (prompt règle 18 : « 0.9+ si tu sais où c'est ; 0.5-0.7 si
 * tu hésites entre deux endroits du même nom »). En dessous de 0,6, l'hésitation
 * porte sur l'endroit lui-même — et chercher des vols vers un endroit dont on
 * hésite, c'est précisément la devinette que la loi §1 interdit : « sinon →
 * nudge, pas de devinette ». On demande donc au client, ce qui coûte une phrase
 * à l'agente et rapporte la bonne réponse, au lieu de coûter des crédits et de
 * rapporter la mauvaise.
 *
 * Pourquoi 0,6 exactement : c'est la frontière que le prompt lui-même dessine —
 * il place l'hésitation entre deux homonymes à 0,5-0,7, donc le milieu de cette
 * bande est le seul endroit non arbitraire où couper. Un seuil plus haut (0,8)
 * jetterait des résolutions justes et rendrait l'agente muette sur du captable ;
 * un seuil plus bas (0,4) ferait tirer sur des « je ne suis pas sûr » explicites.
 * Ce seuil est un artefact de jugement : à revoir avec des mesures réelles, pas
 * en silence.
 */
export const SEUIL_RESOLUTION = 0.6;

/**
 * UN CANDIDAT PAR DÉFAUT N'EST PAS UNE RÉSOLUTION.
 *
 * `destinations.ts` pose `aConfirmer` quand le lieu rendu n'est PAS celui qui a
 * été prononcé : règle pays (« Floride » → Fort Lauderdale, premier candidat de
 * la table) ou suite de 3 lettres prise pour un code d'aéroport (« sud » → SUD).
 * Personne n'a dit ces villes-là. La loi §1 (« on ne cherche que ce qui a été
 * nommé ; sinon → nudge, jamais de devinette ») leur interdit donc de faire
 * autorité — ni sur les vols, ni sur une requête hôtel, ni sur un titre de carte.
 *
 * Vérifié par exécution : `resolveDestination("Floride")` rend
 * [Fort Lauderdale 0.7 aConfirmer, Orlando 0.6 aConfirmer, Miami 0.5 aConfirmer] ;
 * `resolveDestination("Punta Cana")` rend [Punta Cana 0.95, aConfirmer faux].
 *
 * C'est un BOOLÉEN, pas un seuil, et c'est volontaire : la question est « le
 * libellé a-t-il été prononcé ? », pas « à quel point y crois-je ? ». `confiance`
 * répond à la seconde et ORDONNE les candidats ; elle n'autorise rien (elle dérive
 * d'ailleurs en virgule flottante — « Cuba » rend 0.49999999999999994 en 3ᵉ
 * position, un `>=` y serait faux d'un candidat pour toujours).
 */
export const estCandidatParDefaut = (r: { aConfirmer?: boolean } | null | undefined): boolean => r?.aConfirmer === true;

/**
 * LA PORTE : le premier candidat qui n'est PAS un choix fait à la place du client.
 * Tout ce qui écrit dans `resolved` passe par ici, sans exception — c'est ce qui
 * permet à `contexteLieu`, au gate vols, à la condition d'appel de la fiche et au
 * retour anticipé d'hériter de la bonne décision sans un caractère de diff.
 */
export const premierFerme = (candidats: ResolvedDestination[]): ResolvedDestination | null =>
  candidats.find((c) => !estCandidatParDefaut(c)) ?? null;

type ResolvedSaidDestination = {
  dit: string;
  resolution: ResolvedDestination;
};

function memeDestination(a: string, b: string): boolean {
  const gauche = cleLieu(a);
  const droite = cleLieu(b);
  return Boolean(gauche && droite && (gauche === droite || gauche.includes(droite) || droite.includes(gauche)));
}

function dedupeResolvedDestinations(items: ResolvedSaidDestination[]): ResolvedSaidDestination[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.resolution.iata ?? item.resolution.kgmid ?? cleLieu(item.resolution.label);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * FAUT-IL PAYER LA FICHE DE L'ÉTABLISSEMENT ? — la condition d'appel, sortie du
 * corps de `buildSuggestions` pour être rejouable hors ligne, table de vérité
 * comprise. Aucune ligne de comportement ne change ici : c'est exactement
 * `hotelNomme && (!resolved || (villeHorsCache && checkIn !== null))`, avec un nom
 * pour chacune de ses cinq issues.
 *
 * Pourquoi il n'y a PAS de raison « ancre devinée » : elle serait inatteignable.
 * `premierFerme` garantit en amont que `resolved` est soit nul, soit un lieu
 * NOMMÉ — un candidat par défaut ne peut plus arriver jusqu'ici pour bloquer la
 * fiche. C'est la porte, pas cette fonction, qui a réglé ce défaut.
 */
export type DecisionFiche = {
  fiche: boolean;
  raison: "pas-d-hotel" | "aucune-ancre" | "ancre-nommee-et-connue" | "sans-dates" | "ville-hors-cache";
};

export function decideFicheEtablissement(a: {
  hotelNomme: string | null;
  resolved: ResolvedDestination | null;
  villeHorsCache: boolean;
  checkIn: string | null;
}): DecisionFiche {
  if (!a.hotelNomme) return { fiche: false, raison: "pas-d-hotel" };
  // Sans ancre, la fiche est le seul moyen de savoir où chercher : on la paie
  // même sans dates (elle rouvre le cache local, donc le gate vols).
  if (!a.resolved) return { fiche: true, raison: "aucune-ancre" };
  // Le cas courant : le lieu est nommé ET le cache l'indexe — la requête texte
  // « hôtel + ville » suffit, la fiche ne vaut pas son crédit.
  if (!a.villeHorsCache) return { fiche: false, raison: "ancre-nommee-et-connue" };
  // Une ancre existe déjà : la fiche ne sert plus qu'à la carte hôtel, et cette
  // carte ne partira pas sans dates. Le crédit ne servirait à rien.
  if (a.checkIn === null) return { fiche: false, raison: "sans-dates" };
  return { fiche: true, raison: "ville-hors-cache" };
}

/**
 * QUAND LA FICHE EST DÉJÀ PAYÉE, ON LA LIT — mais elle ne décide pas à la place
 * du client. Trois issues, et il n'y en a pas de quatrième :
 *  · `conserver`  — rien à apprendre (pas de lieu sur la fiche, lieu hors cache,
 *                   ou le MÊME endroit sous un autre nom) ;
 *  · `adopter`    — on n'avait aucune ancre, la fiche en donne une (c'est
 *                   l'ancienne ligne « le lieu rendu par la fiche rouvre le cache ») ;
 *  · `questionner`— deux lieux NOMMÉS se contredisent. On ne tranche pas : on
 *                   pose la question et on laisse les vols sur ce que le client a
 *                   dit (loi §1 ; loi 4 : l'échec — ici le doute — se dit).
 *
 * L'égalité de lieux est EXACTE, jamais floue : même libellé désaccentué, ou même
 * IATA. Un `nameOverlap` sur des noms de villes serait un artefact de jugement à
 * calibrer, alors que deux entrées du cache sont des objets identifiés. Le cas
 * réel que l'égalité par IATA évite : `resolveDestination("Playa del Carmen")`
 * rend Riviera Maya/CUN et `resolveDestination("Cancun")` rend Cancún/CUN — même
 * aéroport, aucune question à poser.
 *
 * Hors du cache, on ne conclut pas à une contradiction : « la fiche situe l'hôtel
 * quelque part que je ne sais pas nommer » n'est pas « la fiche contredit le
 * client ». Pas de preuve, pas de question.
 */
export type ArbitrageAncre =
  | { action: "conserver" }
  | { action: "adopter"; ancre: ResolvedDestination }
  | { action: "questionner"; lieuFiche: string; lieuDit: string };

export function arbitrerAncre(resolved: ResolvedDestination | null, lieuFiche: string | null): ArbitrageAncre {
  const lieu = lieuFiche && lieuFiche.trim() ? lieuFiche.trim() : null;
  if (!lieu) return { action: "conserver" };
  const hit = premierFerme(resolveDestination(lieu));
  if (!resolved) return hit ? { action: "adopter", ancre: hit } : { action: "conserver" };
  if (hit === null) return { action: "conserver" };
  const memeEndroit = norm(hit.label) === norm(resolved.label) || (Boolean(hit.iata) && hit.iata === resolved.iata);
  return memeEndroit ? { action: "conserver" } : { action: "questionner", lieuFiche: hit.label, lieuDit: resolved.label };
}

/** « Michès, Punta Cana, République dominicaine » — pour l'affichage et les messages. */
function labelResolution(r: LieuResolution): string {
  const zone = r.region_touristique && r.region_touristique !== r.ville ? r.region_touristique : null;
  return [r.ville, zone, r.pays].filter((part): part is string => Boolean(part && part.trim())).join(", ");
}

/**
 * Les noms de lieu qu'une résolution offre au cache local, du plus précis au plus
 * large. La région touristique vient AVANT le pays parce que c'est elle qui porte
 * l'aéroport quand la ville est un village (Michès → « Punta Cana » → PUJ) ; le
 * pays, lui, retombe sur les règles pays de la table (candidats « à confirmer »).
 */
function indicesDeResolution(r: LieuResolution | null): string[] {
  if (!r) return [];
  return [r.ville, r.region_touristique, r.pays].filter((part): part is string => Boolean(part && part.trim()));
}

const cleLieu = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

const MONTHS: Record<string, number> = {
  janvier: 1, fevrier: 2, février: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, aout: 8, août: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12, décembre: 12,
};
const SEASONS: Record<string, number> = { hiver: 1, printemps: 4, ete: 7, été: 7, automne: 10, relache: 3, relâche: 3 };

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Date représentative depuis une DateFloue (règles §2.4). */
function representativeDate(brief: TripBrief, now: Date): { date: string; aConfirmer: boolean } | null {
  const dep = brief.temps.depart;
  if (dep.valeur) return { date: dep.valeur, aConfirmer: dep.statut !== "capte" };
  const verb = (dep.verbatim ?? "").toLowerCase();
  let month: number | null = null;
  for (const [name, m] of Object.entries(MONTHS)) if (verb.includes(name)) { month = m; break; }
  if (month === null) for (const [name, m] of Object.entries(SEASONS)) if (verb.includes(name)) { month = m; break; }
  if (month === null) return null;
  let year = now.getFullYear();
  const candidate = new Date(Date.UTC(year, month - 1, 15));
  if (candidate.getTime() < now.getTime() + 14 * 86_400_000) year += 1;
  return { date: iso(new Date(Date.UTC(year, month - 1, 15))), aConfirmer: true };
}

const NIGHTS: Record<string, number> = { moins_7j: 5, sept_j: 7, dix_j: 10, quatorze_j: 14, plus_14j: 16 };

function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return iso(d);
}

const ORIGIN_MAP: Array<{ match: RegExp; iata: string }> = [
  { match: /qu[ée]bec|yqb|jean.?lesage/i, iata: "YQB" },
  { match: /montr[ée]al|yul|trudeau/i, iata: "YUL" },
];

const AIRLINE_MAP: Array<{ match: RegExp; code: string }> = [
  { match: /air canada/i, code: "AC" },
  { match: /transat/i, code: "TS" },
  { match: /sunwing/i, code: "WG" },
  { match: /westjet/i, code: "WS" },
  { match: /porter/i, code: "PD" },
  { match: /air france/i, code: "AF" },
];

const CLASS_MAP: Record<string, 1 | 2 | 3 | 4> = {
  economique: 1, economique_premium: 2, affaires: 3, premiere: 4,
};
const STOPS_MAP: Record<string, 0 | 1 | 2> = { direct_seulement: 1, une_max: 2, peu_importe: 0 };

const fmtPrice = (n: unknown) => (typeof n === "number" ? `${Math.round(n)} $ CAD` : undefined);

/**
 * QUI LE PRIX COUVRE — la phrase, pas le champ (loi 9).
 *
 * Le défaut du 2026-08-07 : personne n'avait dit combien ils étaient, le moteur
 * a présumé un adulte, et la carte a affiché « 812 $ » devant le client sans
 * dire que c'était le prix d'UN siège. Le nombre était juste (à `adults=1`,
 * Google Flights rend bien un prix par personne — vérifié le 2026-08-06 :
 * passer à quatre voyageurs a fait revenir « les prix pour quatre », donc le
 * `price` rendu est un TOTAL pour le groupe interrogé). Ce qui manquait, c'était
 * la LÉGENDE. On ne transforme donc aucun montant : on dit toujours qui il
 * couvre.
 *
 * Elle énumère EXACTEMENT les passagers envoyés à Google Flights, donc elle est
 * vraie que le pax ait été entendu ou présumé : c'est ce qui permet de
 * l'afficher TOUJOURS, sans qu'elle se transforme en voyant d'alarme le jour où
 * on ne sait pas. Une mention qui n'apparaîtrait qu'en cas de doute serait lue
 * comme une panne ; présente à chaque fois, c'est une convention de lecture.
 *
 * Les deux bornes (`Math.max`) ne corrigent aucun chemin réel — `adults` vaut
 * déjà 1 au minimum et `trigger-scan.ts` filtre `adultes > 0` en amont. Elles
 * existent pour qu'aucune extraction dégénérée ne puisse jamais écrire
 * « 0 adultes » sur un écran montré au client.
 */
export function couverturePax(adultes: number, enfants: number): string {
  const a = Math.max(1, Math.round(adultes));
  const e = Math.max(0, Math.round(enfants));
  if (e === 0) return a === 1 ? "une personne" : `${a} adultes`;
  return `${a === 1 ? "1 adulte" : `${a} adultes`} et ${e === 1 ? "1 enfant" : `${e} enfants`}`;
}

/**
 * Images : on n'utilise QUE les URL googleusercontent. Les `original_image`
 * pointent souvent vers les CDN des fournisseurs (hotelbeds, giatamedia) qui
 * bloquent le hotlinking → images brisées dans le navigateur. Les vignettes
 * Google, elles, sont fiables ET agrandissables en réécrivant la directive de
 * taille — celle qui suit le DERNIER `=` de l'URL.
 *
 * ⚠️ Corrigé le 2026-08-06, vérifié en HTTP réel : la version précédente ne
 * reconnaissait que la forme `=w287-h192` et APPENDAIT sa directive aux autres.
 * Or Google sert aussi des vignettes en `=s287-w287-h192-n-k-no-v1` (forme
 * rendue par la fiche « Hôtel Les Roches Blanches ») : la concaténation des deux
 * directives rend **HTTP 400**, donc une image brisée dans le feed. On remplace
 * désormais le suffixe au lieu de l'empiler.
 */
export function googlePhoto(img: { thumbnail?: string; original_image?: string } | undefined, width: number, height: number): string | undefined {
  const candidates = [img?.thumbnail, img?.original_image].filter((url): url is string => Boolean(url));
  const url = candidates.find((candidate) => /googleusercontent\.com/.test(candidate));
  if (!url) return undefined;
  // Pas de découpe sur une URL à query string : le `=` y appartient au paramètre.
  const base = url.includes("?") ? url : url.replace(/=[^/=]*$/, "");
  return `${base}=w${width}-h${height}-k-no`;
}

// ── Moteur ───────────────────────────────────────────────────────────────────
export async function buildSuggestions(
  brief: TripBrief,
  opts: {
    serpApiKey: string;
    openaiForVigie?: boolean;
    maxSearches?: number;
    now?: Date;
    profileConstraints?: string[];
    /** Snapshot cumulatif, dans l'ordre canonique, dès qu'une nouvelle carte est prête. */
    onProgress?: (result: SuggestionsResult) => void | Promise<void>;
  },
): Promise<SuggestionsResult> {
  const now = opts.now ?? new Date();
  const serp = new SerpApiClient(opts.serpApiKey, opts.maxSearches ?? 15);
  const cards: SuggestionCard[] = [];
  const nudges: NudgeItem[] = [];
  const warnings: string[] = [];

  if (brief.meta.nature_conversation !== "planification") {
    return {
      cards,
      nudges,
      searchesUsed: 0,
      warnings: ["nature_conversation ≠ planification — aucune suggestion."],
      promptVersions: { vigie: VIGIE_PROMPT_VERSION },
    };
  }

  // Dates représentatives (calculées avant la résolution : elles décident si un
  // appel de repli vaut son crédit — sans date, ni vols ni hôtels ne partiront).
  const rep = representativeDate(brief, now);
  const nights = NIGHTS[val(brief.temps.duree) ?? ""] ?? 7;
  const checkIn = rep?.date ?? null;
  const checkOut = checkIn ? addDays(checkIn, nights) : null;
  const datesAConfirmer = rep?.aConfirmer ?? false;
  const badgeDates = datesAConfirmer ? "Dates à confirmer" : undefined;

  /**
   * ── LE « OÙ » : LA RÉSOLUTION D'ABORD, LA TABLE ENSUITE ──────────────────
   *
   * Le savoir sur le monde appartient à la station 3 (Master Context), la seule
   * qui appelle un LLM. Ici, on est du code déterministe : on ne devine pas où se
   * trouve un resort, on TRADUIT en identifiants requêtables un lieu déjà situé.
   *
   * Ce que ça corrige (test en rencontre réelle, 2026-08-06) : l'extraction avait
   * écrit `destinations = ["Club Med Michès"]` — un nom de resort dans le champ
   * destination — et la table locale, qui ne connaît que ~55 villes, ne pouvait
   * évidemment rien en faire. La panne était à la station 3, pas à la gate.
   *
   * Ordre : ① résolution (si assez sûre) → ② cache local sur ses noms de lieu →
   * ③ cache local sur ce qui a été DIT → ④ chaîne autocomplete → ⑤ nudge.
   * La table n'est plus la source de vérité du « où » : elle est un CACHE qui
   * rend le cas courant gratuit (0 crédit) et instantané (0 ms).
   */
  const saidDestinations = val(brief.lieu.destinations) ?? [];
  const hotelNomme = val(brief.lieu.hotel_nomme);

  // ① Ce que le Master Context a situé — et son propre doute.
  const resolutionDite = brief.lieu.resolution ?? null;
  const resolution = resolutionDite && resolutionDite.confiance >= SEUIL_RESOLUTION ? resolutionDite : null;
  if (resolutionDite && !resolution) {
    warnings.push(
      `Résolution de lieu écartée — confiance ${resolutionDite.confiance} < ${SEUIL_RESOLUTION} `
      + `(${labelResolution(resolutionDite) || "lieu non situé"}) : on demande au lieu de deviner.`,
    );
  }

  /**
   * Chaque destination explicitement souhaitée garde sa propre résolution.
   * `destinations[0]` reste l'ordre de conversation, jamais un choix du client.
   * L'ancien moteur arrêtait la boucle au premier candidat ferme et transformait
   * donc « Barcelone ou Lisbonne » en trajet vers Barcelone sans le dire.
   */
  let resolvedDestinations: ResolvedSaidDestination[] = [];
  /**
   * Ce que le cache a PROPOSÉ sans que ce soit une résolution — matière à
   * question, rien d'autre. La clé est le terme tel qu'il a été dit ; c'est lui
   * que la question reprendra entre guillemets.
   */
  const parDefaut = new Map<string, ResolvedDestination[]>();
  const resolutionSaitCeLieu = (said: string) => {
    if (!resolution) return false;
    if (saidDestinations.length <= 1) return true;
    return Boolean(resolution.base_sur && memeDestination(resolution.base_sur, said));
  };

  // ② Le cache local, interrogé pour CHAQUE lieu explicitement souhaité (et non
  // seulement le premier). Une résolution singulière issue d'un resort ne sert
  // qu'au lieu que son `base_sur` cite ; elle ne peut pas situer silencieusement
  // une alternative voisine.
  const lieuxDits = saidDestinations.length ? saidDestinations : resolution ? [resolution.base_sur ?? ""] : [];
  for (const said of lieuxDits) {
    const indices = resolutionSaitCeLieu(said)
      ? [...indicesDeResolution(resolution), said]
      : [said];
    for (const indice of indices) {
      const candidats = resolveDestination(indice);
      const ferme = premierFerme(candidats);
      if (ferme) {
        resolvedDestinations.push({ dit: said || indice, resolution: ferme });
        break;
      }
      if (candidats.length) parDefaut.set(said || indice, candidats);
    }
  }
  resolvedDestinations = dedupeResolvedDestinations(resolvedDestinations);
  let resolved = resolvedDestinations[0]?.resolution ?? null;

  // ── ④ REPLI SERPAPI (règles §1 : cache → autocomplete → nudge) ────────────
  // Ne tire que sur ce que le gratuit n'a pas su faire. Deux questions distinctes
  // s'y jouent, et les confondre est ce qui rendait le cas fondateur silencieux :
  //   · OÙ est-ce ? → autocomplete VOLS, sur un nom de lieu (IATA + kgmid) ;
  //   · QUEL établissement ? → autocomplete HÔTELS, qui rend le `property_token`.
  let property: ResolvedProperty | null = null;
  // Chaque marche est isolée : un engin muet (il répond par une ERREUR quand il
  // ne trouve rien) ne doit pas annuler la marche suivante.
  const tenter = async <T,>(etape: string, run: () => Promise<T | null>): Promise<T | null> => {
    try {
      return await run();
    } catch (e) {
      warnings.push(`Résolution ${etape}: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }
  };

  // La FICHE de l'établissement. Elle reste indispensable même quand le lieu est
  // résolu : `google_hotels` en recherche texte rend 0 propriété sur « Club Med
  // Michès » (vérifié §11) — seul son `property_token` le retrouve. On la paie
  // donc dans deux cas seulement : le lieu n'est pas résolu du tout, ou l'hôtel se
  // trouve dans une ville que le cache n'indexe pas (donc le nom seul ne suffira
  // pas). Un hôtel dans une ville connue ET NOMMÉE garde le chemin gratuit.
  const resolutionUnique = saidDestinations.length <= 1 ? resolution : null;
  const villeResolue = resolutionUnique?.ville ?? null;
  const villeHorsCache = villeResolue !== null && resolveDestination(villeResolue).length === 0;
  // Le `hotelNomme &&` ne change rien à la décision (la branche « pas-d-hotel »
  // la rend déjà) : il ne fait que redire au compilateur ce que la fonction sait.
  const resolvedForHotel = resolvedDestinations.length === 1 ? resolved : null;
  if (hotelNomme && decideFicheEtablissement({ hotelNomme, resolved: resolvedForHotel, villeHorsCache, checkIn }).fiche) {
    property = await tenter("établissement", () => resolvePropertyRemote(hotelNomme, serp));
    // Le lieu rendu par la fiche rouvre le cache local — gratuit, 0 ms — mais il
    // ne renverse jamais un lieu que le client a nommé : là, on questionne.
    const arbitrages = resolvedDestinations.map((item) => ({ item, resultat: arbitrerAncre(item.resolution, property?.lieu ?? null) }));
    const correspondance = arbitrages.find(({ resultat }) => resultat.action === "conserver");
    const adoption = arbitrages.find(({ resultat }) => resultat.action === "adopter")?.resultat;
    const contradiction = arbitrages.find(({ resultat }) => resultat.action === "questionner")?.resultat;
    if (!correspondance && adoption?.action === "adopter") {
      resolvedDestinations.push({ dit: hotelNomme, resolution: adoption.ancre });
      resolvedDestinations = dedupeResolvedDestinations(resolvedDestinations);
      resolved = resolvedDestinations[0]?.resolution ?? null;
    }
    if (!correspondance && contradiction?.action === "questionner") {
      const lieuxDits = saidDestinations.length ? saidDestinations.join(" ou ") : contradiction.lieuDit;
      nudges.push({
        champ: "lieu_contradictoire",
        message: `${hotelNomme} se trouve à ${contradiction.lieuFiche}, mais on parlait de ${lieuxDits} — lequel correspond ?`,
        debloque: "les bons vols et le bon hôtel",
      });
    }
  }

  // Le LIEU, quand le cache reste muet : l'autocomplete vols porte l'IATA et le
  // kgmid de ville. On ne l'interroge QUE sur des noms de LIEU — il est muet sur un
  // nom de resort (vérifié) — et c'est exactement ce que la résolution fournit
  // quand le client n'a prononcé qu'un nom d'hôtel. Deux tentatives au maximum :
  // au-delà, ce n'est plus une résolution, c'est un ratissage.
  if (resolvedDestinations.length < saidDestinations.filter((said) => nameOverlap(said, hotelNomme ?? "") < 0.5).length && checkIn) {
    const dejaVu = new Set<string>();
    const lieuxATenter = [
      resolutionUnique?.ville,
      resolutionUnique?.region_touristique,
      property?.lieu,
      // Le nom de l'hôtel n'est pas un lieu (inchangé) — ET un terme que le cache
      // traite comme un PAYS/RÉGION ne vaut pas un crédit : l'autocomplete vols
      // refuse par construction les `type: "region"` (voir resolveDestinationRemote),
      // §11.3 le confirme sur appels réels. Sans ce filtre, la conversation la plus
      // courante de l'agence (« on veut aller à Cuba ») passerait de 0 à 1 crédit
      // perdu d'avance, puisque `resolved` est désormais null sur un pays seul.
      // Une suite de 3 lettres, elle, reste tentable : « Rio » peut rendre Rio de
      // Janeiro, « SJO » San José — c'est la FORME que resolveDestination teste
      // lui-même avant de deviner un code d'aéroport.
      // Quand un lieu est déjà résolu, les autres termes restent des pistes à
      // clarifier : on ne paie pas un ratissage opportuniste qui pourrait
      // transformer une mention ou un refus en destination. Quand rien n'est
      // résolu, on peut tenter le premier nom précis fourni par le client.
      ...(resolvedDestinations.length === 0 ? saidDestinations.filter((said) =>
        nameOverlap(said, hotelNomme ?? "") < 0.5
        && !(parDefaut.has(said) && !/^[a-z]{3}$/.test(cleLieu(said)))) : []),
    ]
      .filter((candidat): candidat is string => Boolean(candidat && candidat.trim()))
      .filter((candidat) => {
        const cle = cleLieu(candidat);
        if (!cle || dejaVu.has(cle)) return false;
        dejaVu.add(cle);
        return true;
      })
      .slice(0, 2);

    for (const candidat of lieuxATenter) {
      const remote = await tenter("lieu", () => resolveDestinationRemote(candidat, serp));
      if (remote) {
        resolvedDestinations.push({ dit: candidat, resolution: remote });
        resolvedDestinations = dedupeResolvedDestinations(resolvedDestinations);
        break;
      }
    }
    resolved = resolvedDestinations[0]?.resolution ?? null;
  }

  /**
   * LA QUESTION PRÉCISE, À LA PLACE DE LA DEVINETTE
   * ───────────────────────────────────────────────
   * Rencontre du 2026-08-07 : « la Floride, mais nous c'est les Caraïbes » → le
   * cache rendait Fort Lauderdale « à confirmer », le moteur prenait le premier
   * et affichait des prix YUL→FLL devant le client. La doctrine disait l'inverse
   * depuis le début (§1 ; docs/resolveur-destinations.md §1 et §3). On rend donc
   * la liste de candidats à ce qu'elle est : une QUESTION, pas une réponse.
   *
   * Le nudge SORT du garde `!hotelNomme` — un hôtel nommé n'excuse pas de rester
   * muet sur un lieu qu'on n'a pas su placer, c'est exactement le cas réel (Club
   * Med Michès + Floride + Caraïbes). Seul le RETOUR ANTICIPÉ reste sous ce garde :
   * un hôtel nommé a sa propre chaîne, elle doit continuer.
   *
   * Conséquence acceptée par le fondateur le 2026-08-07 : « Cuba », « Mexique »
   * ou « République dominicaine » dits SEULS ne produisent plus de carte de vols.
   * L'agente ne perd pas l'information, elle la reçoit comme une question nommant
   * les mêmes candidats — et dès que la ville est prononcée, la voie rapide re-tire
   * et la carte arrive. L'information est décalée d'une question, pas supprimée.
   */
  const listeFr = (labels: string[]) =>
    labels.length > 1 ? `${labels.slice(0, -1).join(", ")} ou ${labels[labels.length - 1]}` : labels[0];

  if (!resolvedDestinations.length) {
    // La question porte sur le PREMIER lieu dit, parce que `lieu.destinations`
    // est désormais ORDONNÉE : l'index 0 est la destination du projet tel qu'il
    // est MAINTENANT (voir `trip-brief.ts` et `LiveTriggers.destinations`). Le
    // détecteur de la voie rapide écarte les lieux refusés et met en tête celui
    // que le client veut ; « pas la Floride, les Caraïbes » n'arrive donc plus
    // ici comme `["Floride", "Caraïbes"]` mais comme `["Caraïbes"]`.
    //
    // Le moteur tire déjà sur l'index 0 en ②③ : prendre le DERNIER ici faisait
    // poser la question sur un autre lieu que celui qu'on cherchait — deux
    // règles pour un même produit. Il n'y en a plus qu'une.
    //
    // ⚠️ Angle mort assumé : la voie LENTE ne sait pas encore lire une négation
    // ni ordonner. Un brief venu de `/api/extract` peut encore rendre
    // `["Floride", "Caraïbes"]`, et la question portera alors sur la Floride.
    // La voie rapide corrige au tour suivant ; le vrai correctif est dans
    // `lib/extraction/prompt.ts`, qui n'est pas de ce chantier.
    //
    // Le nom de l'hôtel n'est pas un lieu — même filtre qu'en ④.
    const ditsNonPlaces = saidDestinations.filter((said) => nameOverlap(said, hotelNomme ?? "") < 0.5);
    const cible = ditsNonPlaces[0] ?? resolutionUnique?.pays ?? null;
    // On ne repropose jamais au client le mot qu'il vient de dire (« SJO » → « SJO »).
    // Au plus 3 noms : les règles pays en rendent 4 au maximum (Cuba) et la table
    // est ordonnée par la fréquence réelle des dossiers — couper à 3 jette la queue
    // de distribution, pas de l'information. C'est aussi la plus longue liste
    // qu'une agente pose d'une seule phrase à l'oral.
    /**
     * ⚠️ POURQUOI ON N'EMPRUNTE PAS LES NOMS D'UN AUTRE LIEU DIT.
     *
     * La tentation est forte, et elle a été essayée : quand la cible ne rend
     * aucun candidat (« Caraïbes » — une région de vingt pays n'est pas une
     * destination réservable), on aimerait emprunter les noms au lieu dit
     * suivant, pour ne pas jeter ce qu'on sait déjà nommer (« pour Cuba je peux
     * partir sur Varadero, Cayo Coco ou Cayo Santa María ? »).
     *
     * Le banc l'a refusé, et il a eu raison. Sur `["Caraïbes", "Floride"]` — la
     * rencontre réelle du 2026-08-07 — l'emprunt produisait : « pour Floride je
     * peux partir sur Fort Lauderdale, Orlando ou Miami ? ». C'est-à-dire le
     * bug d'origine ressuscité par la porte de secours censée aider : proposer
     * précisément l'endroit que le client venait d'écarter.
     *
     * La raison est structurelle, pas conjoncturelle. À CETTE couche, le moteur
     * ne peut pas distinguer « Cuba, aussi envisagée » de « Floride, écartée » :
     * les deux sont des chaînes dans la même liste. L'information manquante est
     * l'INTENTION par destination, et elle vit en amont, dans le détecteur
     * (`destinations_dites`). Tant qu'elle n'est pas consommée ici — ce serait
     * le lot B de la négation —, une question vague est le comportement SÛR :
     * elle fait parler l'agente, elle ne l'envoie pas au mauvais endroit.
     */
    const proposables = (parDefaut.get(cible ?? "") ?? [])
      .map((c) => c.label)
      .filter((label) => cleLieu(label) !== cleLieu(cible ?? ""))
      .slice(0, 3);
    // Une résolution écartée pour cause de doute n'est pas un silence : c'est une
    // question à poser, et l'agente peut la poser mieux que nous (loi §1).
    const situeMaisIncertain = resolutionDite && !resolution ? labelResolution(resolutionDite) : "";

    if (situeMaisIncertain) {
      nudges.push({
        champ: "destination",
        message: `Confirmer l'endroit — je situe ça du côté de ${situeMaisIncertain}, sans en être sûr.`,
        debloque: "hôtels, vols et avis",
      });
    } else if (cible && proposables.length) {
      nudges.push({
        champ: "destination",
        message: `« ${cible} », ça peut être plusieurs endroits — ${listeFr(proposables)} ? On part sur lequel ?`,
        debloque: "hôtels, vols et avis",
      });
    } else if (cible) {
      nudges.push({
        champ: "destination",
        message: `« ${cible} », je ne suis pas sûr de l'endroit visé — quelle ville ou quelle île vise-t-on ?`,
        debloque: "hôtels, vols et avis",
      });
    } else if (val(brief.lieu.region) || resolutionDite) {
      nudges.push({ champ: "destination", message: "Préciser la destination ouvrirait la recherche d'options.", debloque: "hôtels, vols et avis" });
    }
  }

  const unresolvedDits = saidDestinations.filter((said) =>
    nameOverlap(said, hotelNomme ?? "") < 0.5
    && !resolvedDestinations.some((item) => memeDestination(item.dit, said)),
  );
  if (resolvedDestinations.length && unresolvedDits.length && !hotelNomme) {
    nudges.push({
      champ: "destination",
      message: `${unresolvedDits.join(" et ")} sont notés aussi, mais il me faut une ville ou un aéroport pour les rechercher sans deviner.`,
      debloque: "les options de ces destinations",
    });
  }

  if (!resolvedDestinations.length && (saidDestinations.length > 0 || resolutionDite)) {
    const tentes = [resolutionDite ? labelResolution(resolutionDite) : null, ...saidDestinations].filter(Boolean);
    const ecartes = [...parDefaut.entries()].map(([dit, c]) => `${dit} → ${c.slice(0, 3).map((x) => x.label).join("/")}`);
    warnings.push(
      `Destination non résolue (résolution + cache local + repli autocomplete): ${tentes.join(" / ")}.`
      + (ecartes.length ? ` Candidats par défaut écartés — on ne montre pas une devinette : ${ecartes.join(" ; ")}.` : ""),
    );
  }

  if (!resolvedDestinations.length && !hotelNomme) {
    // PDF : il manque UN élément au payload → le Payload passe par le Nudge.
    return nudgeGateway(cards, nudges, serp.searchesUsed, warnings);
  }

  /**
   * Le lieu à afficher et à mettre dans une requête texte. L'ordre dit la
   * hiérarchie des sources : la fiche de l'établissement (vérifiée par Google) >
   * la ville située par le Master Context > l'étiquette du cache (qui peut être
   * la région, « Punta Cana » pour Michès) — du plus exact au plus large.
   */
  const contexteLieu = property?.lieu
    ?? (resolvedDestinations.length === 1 ? villeResolue ?? resolutionUnique?.region_touristique ?? resolved?.label ?? null : null);

  if ((resolvedDestinations.length > 0 || hotelNomme) && !checkIn) {
    nudges.push({ champ: "dates", message: "Un mois ou une période, même approximative, débloquerait les prix.", debloque: "vols et hôtels" });
  }
  if (resolvedDestinations.length > 0 && !hotelNomme) {
    nudges.push({ champ: "hotel", message: "Nommer un hôtel ou une chaîne ouvrirait ses photos et ses avis.", debloque: "photos et avis" });
  }

  /**
   * LE NOMBRE ENTENDU ET LE NOMBRE UTILISÉ, DANS DEUX VARIABLES.
   *
   * C'est la parade générale du 2026-08-07, appliquée ici littéralement : une
   * valeur de repli (`?? 1`, comme « départ présumé Montréal ») devient
   * indiscernable d'une valeur captée dès qu'elle a franchi une ligne de code.
   * L'ancien `?? 1` écrasait les deux en un seul nombre et plus rien en aval ne
   * pouvait dire lequel des deux il regardait.
   *
   * LA PRÉSOMPTION RESTE À 1 — ne pas la « corriger » en 2 parce que le couple
   * est le mode statistique des rencontres : 2 est un nombre que personne n'a
   * prononcé (doctrine 1), et il produirait un TOTAL faux présenté comme LE
   * prix. 1 n'est pas une hypothèse sur le groupe, c'est l'unité.
   *
   * La garde `> 0` n'est pas un seuil, c'est une borne de domaine : sur un
   * `adultes = 0` (que seule une extraction dégénérée produirait) l'ancien code
   * envoyait `adults=0` à Google Flights — requête invalide, warning, zéro
   * carte. On envoie 1 et on le dit.
   */
  const adultesDits = ((v) => (typeof v === "number" && v > 0 ? v : null))(val(brief.voyageurs.adultes));
  const adults = adultesDits ?? 1;
  const childAges = (val(brief.voyageurs.enfants_ages) ?? []).map((a) => Math.min(Math.max(a, 1), 17));

  // Les recherches n'ont plus de dépendance mutuelle après la résolution.
  // Chaque branche écrit dans ses propres tableaux : l'ordre visible reste
  // déterministe même si les fournisseurs répondent dans un autre ordre.
  const hotelCards: SuggestionCard[] = [];
  const hotelNudges: NudgeItem[] = [];
  const hotelWarnings: string[] = [];
  const flightCards: SuggestionCard[] = [];
  const flightNudges: NudgeItem[] = [];
  const flightWarnings: string[] = [];
  const vigieCards: SuggestionCard[] = [];
  const vigieWarnings: string[] = [];
  let lastProgressIds = "";
  let progressQueue = Promise.resolve();
  const emitProgress = () => {
    if (!opts.onProgress) return;
    const available = [...hotelCards, ...flightCards, ...vigieCards];
    const ids = available.map((card) => card.id).join("|");
    if (!ids || ids === lastProgressIds) return;
    lastProgressIds = ids;
    const snapshot = nudgeGateway(
      available,
      [...nudges, ...hotelNudges, ...flightNudges],
      serp.searchesUsed,
      [...warnings, ...hotelWarnings, ...flightWarnings, ...vigieWarnings],
    );
    progressQueue = progressQueue.then(() => opts.onProgress!(snapshot)).catch((error) => {
      warnings.push(`Progression: ${error instanceof Error ? error.message : String(error)}`);
    });
  };

  const hotelJob = (async () => {
    // ── HÔTELS (gate STRICT : un hôtel ou une CHAÎNE a été NOMMÉ + des dates) ──
    // « un 4 étoiles à Punta Cana » est un critère, pas une demande : l'agent
    // connaît déjà ces options. On ne cherche que ce qui a été nommé.
    if (hotelNomme && checkIn && checkOut) {
      try {
        // L'hôtel nommé EST la recherche : aucun filtre d'étoiles, sinon on
        // risque d'écarter précisément celui que le client vient de nommer.
        // Quand le repli a rendu une fiche, on interroge l'établissement PAR SON
        // TOKEN : c'est son identité, pas son nom — plus rien à départager, et
        // c'est ce qui sauve « Club Med Michès » (la recherche texte sur ce nom
        // rend 0 propriété, vérifié). `q` reste requis même avec le token, et
        // c'est là que le lieu rendu par le repli comble le contexte manquant.
        const res = (await serp.googleHotels({
          q: property ? (property.lieu ?? property.nom) : contexteLieu ? `${hotelNomme} ${contexteLieu}` : hotelNomme,
          property_token: property?.propertyToken,
          check_in_date: checkIn,
          check_out_date: checkOut,
          adults,
          children: childAges.length || undefined,
          children_ages: childAges.length ? childAges.join(",") : undefined,
        })) as { properties?: Array<Raw>; name?: string };
        // La réponse « fiche » est À PLAT (pas de `properties[]`) — vérifié en live.
        const trouves: Raw[] = Array.isArray(res.properties) ? res.properties : res.name ? [res as Raw] : [];
        // …et on ne montre QUE lui : l'agent a nommé un hôtel, pas une liste.
        // Sous le seuil de correspondance, on préfère ne rien montrer qu'un
        // hôtel qui n'est pas celui dont on parle. Le token, lui, dispense du seuil.
        const ranked = [...trouves].sort((a, b) => nameOverlap(String(b.name ?? ""), hotelNomme) - nameOverlap(String(a.name ?? ""), hotelNomme));
        const parToken = Boolean(property) && !Array.isArray(res.properties) && Boolean(res.name);
        const props = parToken
          ? ranked.slice(0, 1)
          : ranked.length && nameOverlap(String(ranked[0].name ?? ""), hotelNomme) >= 0.34 ? [ranked[0]] : [];
        if (props.length) {
          hotelCards.push({
            id: "hotels-1",
            type: "hotels",
            priorite: 1,
            titre: `${hotelNomme}${contexteLieu ? ` — ${contexteLieu}` : ""}`,
            sousTitre: `${checkIn} → ${checkOut} · ${adults} adulte(s)${childAges.length ? ` · ${childAges.length} enfant(s)` : ""}`,
            badge: badgeDates,
            items: props.map((p) => {
              const images = (p.images ?? []) as Array<{ thumbnail?: string; original_image?: string }>;
              return {
                titre: String(p.name ?? "Hôtel"),
                detail: [p.hotel_class, ...(p.amenities ?? []).slice(0, 2)].filter(Boolean).join(" · ") || undefined,
                // Pas de prix ici : le feed est tourné vers le client, et un prix
                // Google que l'agence ne facturera pas sème le doute. Le prix
                // part côté agent (nudge « repère de prix »).
                note: p.overall_rating ? `${p.overall_rating}★` : undefined,
                image: images.map((img) => googlePhoto(img, 1280, 800)).find(Boolean),
                images: images.map((img) => googlePhoto(img, 400, 400)).filter((url): url is string => Boolean(url)).slice(1, 5),
                lien: p.link,
              };
            }),
            source: "Google Hotels via SerpAPI",
          });

          // Repère de prix côté agent. La fiche interrogée par token ne porte pas
          // de tarif ferme (vérifié) mais donne la fourchette habituelle — mieux
          // qu'un silence quand on veut se comparer à son forfait.
          const ferme = fmtPrice(props[0].rate_per_night?.extracted_lowest) ?? fmtPrice(props[0].total_rate?.extracted_lowest);
          const habituel = fmtPrice(props[0].typical_price_range?.extracted_lowest);
          const repere = ferme ? `${ferme} la nuit` : habituel ? `autour de ${habituel} la nuit d'habitude` : null;
          if (repere) {
            hotelNudges.push({
              champ: "prix_hotel",
              message: `Repère de prix pour ${props[0].name} : ${repere} sur Google (non montré au client).`,
              debloque: "comparaison avec ton forfait",
            });
          }
        }
      } catch (e) {
        hotelWarnings.push(`Hôtels: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    /**
     * L'ÉCHEC SE DIT. Un hôtel a été nommé et rien n'en est sorti — soit le repli
     * n'a pas reconnu l'établissement, soit la recherche est revenue les mains
     * vides. Sans ça : deux recherches consommées, zéro carte, zéro nudge, et une
     * agente qui croit à une régression. On le formule comme un collègue le
     * dirait, avec le nom que le client a prononcé et rien de technique (loi 9).
     */
    const aCarteHotel = hotelCards.some((c) => c.type === "hotels");
    if (hotelNomme && !aCarteHotel && (checkIn !== null || (!property && !resolvedDestinations.length))) {
      hotelNudges.push({
        champ: "hotel_introuvable",
        message: `Je n'ai rien trouvé sur ${hotelNomme} — son nom complet ou la ville où il se trouve m'aiderait à le retrouver.`,
        debloque: "ses photos, ses avis et un repère de prix",
      });
    }

    emitProgress();
  })();

  const flightsJob = (async () => {
    // ── VOLS (gate : origine + destination requêtable + date) ─────────────────
    // `arrival_id` accepte l'IATA OU un kgmid de lieu (`/m/…`, `/g/…`). Toutes les
    // destinations fermes sont traitées : l'ordre stabilise les cartes, mais ne
    // choisit jamais une destination au nom du client.
    const flightDate = checkIn;
    if (flightDate) {
      const originSaid = val(brief.vols.aeroport_depart) ?? val(brief.lieu.origine) ?? "";
      const origin = ORIGIN_MAP.find((o) => o.match.test(originSaid))?.iata ?? "YUL";
      const originAssumed = !ORIGIN_MAP.some((o) => o.match.test(originSaid));
      const airline = AIRLINE_MAP.find((a) => a.match.test(val(brief.vols.compagnie_preferee) ?? ""))?.code;
      const infants = (val(brief.voyageurs.enfants_ages) ?? []).filter((a) => a < 2).length;
      const kids = (val(brief.voyageurs.enfants_ages) ?? []).filter((a) => a >= 2).length;

      const orderedCards: Array<SuggestionCard | undefined> = [];
      const orderedWarnings: Array<string | undefined> = [];
      await Promise.all(resolvedDestinations.map(async (item, index) => {
        const route = item.resolution;
        const arrivalId = route.iata ?? route.kgmid ?? null;
        if (!arrivalId) return;
        try {
          const res = (await serp.googleFlights({
            departure_id: origin,
            arrival_id: arrivalId,
            outbound_date: flightDate,
            return_date: checkOut ?? undefined,
            type: 1,
            adults,
            children: kids || undefined,
            infants_in_seat: infants || undefined,
            travel_class: CLASS_MAP[val(brief.vols.classe) ?? ""] ?? 1,
            stops: STOPS_MAP[val(brief.vols.correspondances) ?? ""] ?? 0,
            include_airlines: airline,
          })) as Raw;
          const flights = [...(res.best_flights ?? []), ...(res.other_flights ?? [])].slice(0, 3);
          const sourceSearch = conversationFlightSearchUrl(res.search_metadata?.google_flights_url);
          const insights = res.price_insights;
          const goodPrice = insights?.lowest_price && insights?.typical_price_range?.[0]
            && insights.lowest_price <= insights.typical_price_range[0];
          if (flights.length) {
            orderedCards[index] = {
              id: `vols-${index + 1}`,
              type: "vols",
              priorite: 1,
              titre: `Vols ${origin} → ${route.label}`,
              // Quand l'aéroport n'est pas celui de la ville dont on parle (Michès
              // est un village : on atterrit à Punta Cana), la carte le DIT.
              sousTitre: `${flightDate}${checkOut ? ` → ${checkOut}` : ""}`
                + `${resolutionUnique?.ville && cleLieu(resolutionUnique.ville) !== cleLieu(route.label) ? ` · aéroport le plus pratique pour ${resolutionUnique.ville}` : ""}`
                + `${originAssumed ? " · départ présumé Montréal" : ""}`
                + ` · prix pour ${couverturePax(adults, childAges.length)}`,
              badge: goodPrice ? "Bon moment : prix sous la normale" : badgeDates,
              items: flights.map((f: Raw) => {
                const legs = f.flights ?? [];
                const airlines = [...new Set(legs.map((l: Raw) => l.airline))].join(" + ");
                const stopsCount = Math.max(0, legs.length - 1);
                const segments = safeFlightSegments(legs.map((leg: Raw) => ({
                  airline: leg.airline, flightNumber: leg.flight_number,
                  from: leg.departure_airport?.id, to: leg.arrival_airport?.id,
                  departureTime: leg.departure_airport?.time, arrivalTime: leg.arrival_airport?.time,
                  durationMinutes: leg.duration,
                })));
                return {
                  titre: airlines || "Itinéraire",
                  detail: `${Math.round((f.total_duration ?? 0) / 60)} h · ${stopsCount === 0 ? "direct" : `${stopsCount} escale(s)`}`,
                  prix: fmtPrice(f.price),
                  image: legs[0]?.airline_logo,
                  ...(segments.length ? { segments } : {}),
                  ...(sourceSearch ? { lienRecherche: sourceSearch } : {}),
                };
              }),
              source: "Google Flights via SerpAPI",
            };
          }
        } catch (e) {
          orderedWarnings[index] = `Vols (${route.label}): ${e instanceof Error ? e.message : String(e)}`;
        }
      }));
      flightCards.push(...orderedCards.filter((card): card is SuggestionCard => Boolean(card)));
      flightWarnings.push(...orderedWarnings.filter((warning): warning is string => Boolean(warning)));
    }

    /**
     * LE PRIX DIT POUR QUI IL EST, MAIS PAS QU'ON L'A PRÉSUMÉ. La carte est
     * tournée vers le CLIENT (doctrine 3) : y écrire « on n'a pas entendu combien
     * vous êtes » serait un aveu de machine devant lui. Le doute, lui, appartient
     * à l'agente — donc au rail.
     *
     * Ce n'est PAS « demande combien ils sont » : une agente de voyage sait poser
     * cette question, et le corollaire de la loi 9 (voir `app/live/capte-manquant.ts`,
     * atomes budget et contrainte) nous interdit de le lui rappeler. C'est une
     * déclaration sur NOTRE sortie : le nombre affiché est celui d'un siège, pas
     * celui du voyage. C'est le registre du nudge `prix_hotel` — une note de
     * régie, pas une consigne.
     *
     * Deux gardes : rien à dire si le client a donné le nombre, et rien à dire
     * sur une recherche qui n'a rendu aucun prix (ce cas-là a déjà son message
     * d'échec dans `nudgeGateway`). Même forme que `prix_hotel`, qui ne part que
     * si une carte hôtel existe.
     *
     * Poussé EN DERNIER, donc premier évincé par le plafond de 2 de la porte
     * quand trois candidats se présentent (`lieu_contradictoire` + `prix_hotel` +
     * celui-ci : scénario G de `check:destination`). C'est le bon ordre, et c'est
     * précisément parce que le segment de la carte est INCONDITIONNEL : évincé,
     * ce message ne fait perdre aucune information — la carte dit déjà « prix
     * pour une personne » sous les yeux de l'agente. Les deux autres, eux,
     * portent chacun quelque chose qu'aucune carte ne dit.
     */
    const carteVols = flightCards.find((c) => c.type === "vols");
    /**
     * LA GARDE PORTE SUR L'ÉCART ENTRE LE GROUPE ENTENDU ET LE GROUPE FACTURÉ,
     * pas seulement sur « le nombre d'adultes n'a pas été dit ».
     *
     * Le cas manquant est le plus courant des familles : « on est deux avec nos
     * deux enfants ». Les ÂGES ne sont pas prononcés — et `enfants_ages` est le
     * seul porteur du nombre d'enfants (il n'existe aucun champ `enfants`), le
     * prompt ne demandant que « les âges des enfants mentionnés, sinon [] ».
     * `childAges` vaut donc `[]` : les deux enfants ne sont pas envoyés à Google
     * Flights, la carte annonce « prix pour 2 adultes » devant le client, et
     * l'ancienne garde (`adultesDits === null`) se taisait puisque le nombre
     * d'adultes, lui, avait bien été dit. Deux voyageurs disparaissaient du prix
     * sans que personne, ni le client ni l'agente, ne l'apprenne.
     *
     * `type_groupe = famille` (ou une composition qui parle d'enfants) alors que
     * `childAges` est vide, c'est exactement cet écart-là. On le dit dans le RAIL
     * et pas sur la carte : c'est le doute de l'agente, pas une information à
     * montrer au client (doctrine 3).
     */
    const groupeFamille = val(brief.voyageurs.type_groupe) === "famille"
      || /enfants?|kids?|petits?|ados?/i.test(String(val(brief.voyageurs.composition) ?? ""));
    const enfantsPerdus = groupeFamille && childAges.length === 0;
    if ((adultesDits === null || enfantsPerdus) && carteVols?.items.some((item) => item.prix)) {
      flightNudges.push({
        champ: "voyageurs",
        message: enfantsPerdus
          ? `Les prix de vols à l'écran sont pour ${couverturePax(adults, childAges.length)} — l'âge des enfants les ferait entrer dans le prix.`
          : `Les prix de vols à l'écran sont pour ${couverturePax(adults, childAges.length)} — savoir combien de personnes partent les ajusterait.`,
        debloque: "des prix pour tout le groupe",
      });
    }

    emitProgress();
  })();

  const vigieJob = (async () => {
    // ── VIGIE (hôtel nommé × contrainte × avis) ───────────────────────────────
    const vigieConstraints = [...new Set([
      val(brief.contraintes.mobilite_sante),
      val(brief.contraintes.restrictions_alimentaires),
      ...(val(brief.services.elements_a_eviter) ?? []),
      ...(opts.profileConstraints ?? []), // Concierge : contraintes connues, sans re-verbalisation
    ].filter((c): c is string => Boolean(c && String(c).trim())))];

    // Demande-driven (PDF/Payload Agent : pas d'inputs → pas d'expédition).
    // La vigie ne tire que sur un hôtel NOMMÉ et une contrainte réelle. Sans
    // contrainte, la recherche ne produit aucune carte ; les avis explicitement
    // demandés sont traités par le chat du Nudge Agent.
    const taTarget = hotelNomme;
    if (taTarget && vigieConstraints.length && opts.openaiForVigie !== false) {
      try {
        const search = (await serp.tripadvisorSearch(taTarget, "h")) as { places?: Array<Raw> };
        const results = (search.places ?? []) as Array<Raw>;
        const top = results.find((r) => r.place_id) ?? results[0];
        if (top) {
          // Aucune carte d'avis automatique : les avis ne s'affichent que s'ils
          // sont explicitement demandés (chat du Nudge Agent) ou s'ils touchent
          // une contrainte du client (vigie ci-dessous).
          // VIGIE — le croisement contrainte × avis (cas fondateur : plage inaccessible)
          if (top.place_id) {
            try {
              const reviewsRes = (await serp.tripadvisorReviews(top.place_id, { sort_by: "detailed_review" })) as { reviews?: Array<Raw> };
              const reviews = (reviewsRes.reviews ?? []).slice(0, 20)
                .map((r) => `- (${r.rating ?? "?"}★, ${r.trip_date ?? "?"}) ${r.title ?? ""} — ${r.snippet ?? r.text ?? ""}`)
                .join("\n");
              if (reviews) {
                const scan = await generateText({
                  model: openai("gpt-4.1-mini"),
                  temperature: 0,
                  prompt: `Tu es la vigie d'un agent de voyage. Le client a ces CONTRAINTES: ${vigieConstraints.join(" ; ")}.
Voici des avis TripAdvisor du lieu envisagé. Signale UNIQUEMENT si des avis mentionnent concrètement un problème lié à CES contraintes (accessibilité, marches, plage rocheuse, allergènes, etc.). N'invente rien, ne généralise pas.
Réponds en JSON strict: {"alerte": boolean, "resume": "1 phrase FR", "extraits": ["citation courte", ...max 3]}
AVIS:\n${reviews}`,
                });
                const jsonMatch = scan.text.match(/\{[\s\S]*\}/);
                const verdict = jsonMatch ? (JSON.parse(jsonMatch[0]) as { alerte?: boolean; resume?: string; extraits?: string[] }) : null;
                if (verdict?.alerte) {
                  vigieCards.push({
                    id: "vigie-1",
                    type: "vigie",
                    priorite: 0,
                    titre: "⚠️ À vérifier avant de proposer",
                    sousTitre: verdict.resume,
                    extraits: (verdict.extraits ?? []).slice(0, 3),
                    items: [],
                    source: `Avis TripAdvisor — ${top.title ?? taTarget}`,
                  });
                }
              }
            } catch (e) {
              vigieWarnings.push(`Vigie: ${e instanceof Error ? e.message : String(e)}`);
            }
          }
        }
      } catch (e) {
        vigieWarnings.push(`TripAdvisor: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    emitProgress();
  })();

  await Promise.all([hotelJob, flightsJob, vigieJob]);
  await progressQueue;
  cards.push(...hotelCards, ...flightCards, ...vigieCards);
  nudges.push(...hotelNudges, ...flightNudges);
  warnings.push(...hotelWarnings, ...flightWarnings, ...vigieWarnings);

  return nudgeGateway(cards, nudges, serp.searchesUsed, warnings);
}
