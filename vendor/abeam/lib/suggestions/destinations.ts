/**
 * Résolveur de destinations — seed v1 (voir resolveur-destinations.md).
 * Transforme une destination « telle que dite » en candidats requêtables :
 * IATA pour Google Flights, texte pour Google Hotels.
 *
 * ARTEFACT DE JUGEMENT bâti sur la distribution réelle des dossiers de
 * l'agence (top ~50 ≈ 90 % du volume). Imports relatifs volontaires
 * (module utilisable par les scripts Node de vérification).
 */

export type DestinationType = "soleil" | "ville" | "famille" | "domestique" | "nature";

export type ResolvedDestination = {
  label: string;        // libellé propre à afficher
  iata: string | null;  // arrival_id Google Flights (null => vols impossibles)
  hotelsQ: string;      // q Google Hotels / TripAdvisor
  type: DestinationType;
  confiance: number;    // 0..1
  /**
   * CANDIDAT PAR DÉFAUT : le lieu retenu N'EST PAS celui qui a été nommé, c'est
   * un choix fait à sa place — règle pays (« Floride » → Fort Lauderdale) ou
   * suite de 3 lettres prise pour un code d'aéroport (« sud » → SUD). Il ne se
   * MONTRE pas, il se PROPOSE, sous forme de question (§1 : « sinon → nudge,
   * jamais de devinette » ; docs/resolveur-destinations.md §1 « multi-candidats,
   * jamais une devinette unique » et §3 « région seule → pas de carte vol »).
   * À NE PAS confondre avec `confiance`, qui gradue la certitude d'une traduction
   * dont le libellé, lui, reste celui qui a été prononcé.
   */
  aConfirmer?: boolean;
  /**
   * kgmid de LIEU (`/m/…`, `/g/…`) rendu par le repli autocomplete. Google Flights
   * l'accepte comme `arrival_id` et résout lui-même l'aéroport pratique — vérifié :
   * Miches (village SANS aéroport) → itinéraires YUL→YYZ→PUJ. C'est ce qui débloque
   * le gate vols pour tout ce qui n'est pas dans la table locale.
   */
  kgmid?: string | null;
};

/**
 * Normalisation partagée : minuscules, SANS ACCENTS (le piège vérifié de §11 —
 * « Michès » rend 0 résultat, « Miches » rend la fiche), ponctuation → espaces.
 * Exportée parce que tout ce qui interroge SerpAPI par du texte doit passer par
 * elle : une seule règle d'accents dans le projet, pas deux.
 */
export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// ── Table directe (fréquence réelle des dossiers) ────────────────────────────
type Entry = { label: string; iata: string | null; hotelsQ: string; type: DestinationType; alias?: string[] };

const TABLE: Entry[] = [
  { label: "Punta Cana", iata: "PUJ", hotelsQ: "Punta Cana, République dominicaine", type: "soleil" },
  { label: "Cancún", iata: "CUN", hotelsQ: "Cancún, Mexique", type: "soleil", alias: ["cancun"] },
  { label: "Varadero", iata: "VRA", hotelsQ: "Varadero, Cuba", type: "soleil" },
  { label: "Paris", iata: "CDG", hotelsQ: "Paris, France", type: "ville" },
  { label: "Puerto Plata", iata: "POP", hotelsQ: "Puerto Plata, République dominicaine", type: "soleil" },
  { label: "Cayo Coco", iata: "CCC", hotelsQ: "Cayo Coco, Cuba", type: "soleil" },
  { label: "Fort Lauderdale", iata: "FLL", hotelsQ: "Fort Lauderdale, Floride", type: "ville" },
  { label: "Cayo Santa María", iata: "SNU", hotelsQ: "Cayo Santa María, Cuba", type: "soleil", alias: ["santa clara", "cayo santa maria"] },
  { label: "Barcelone", iata: "BCN", hotelsQ: "Barcelone, Espagne", type: "ville", alias: ["barcelona"] },
  { label: "Puerto Vallarta", iata: "PVR", hotelsQ: "Puerto Vallarta, Mexique", type: "soleil" },
  { label: "Málaga", iata: "AGP", hotelsQ: "Málaga, Costa del Sol", type: "ville", alias: ["malaga"] },
  { label: "Rome", iata: "FCO", hotelsQ: "Rome, Italie", type: "ville" },
  { label: "Montego Bay", iata: "MBJ", hotelsQ: "Montego Bay, Jamaïque", type: "soleil" },
  { label: "Holguín", iata: "HOG", hotelsQ: "Holguín, Cuba", type: "soleil", alias: ["holguin"] },
  { label: "Athènes", iata: "ATH", hotelsQ: "Athènes, Grèce", type: "ville", alias: ["athenes"] },
  { label: "Orlando", iata: "MCO", hotelsQ: "Orlando, Floride", type: "famille", alias: ["disney", "walt disney world"] },
  { label: "Tulum", iata: "TQO", hotelsQ: "Tulum, Mexique", type: "soleil", alias: ["tqo"] },
  { label: "Samaná", iata: "AZS", hotelsQ: "Samaná, République dominicaine", type: "soleil", alias: ["samana"] },
  { label: "Berlin", iata: "BER", hotelsQ: "Berlin, Allemagne", type: "ville" },
  { label: "Lisbonne", iata: "LIS", hotelsQ: "Lisbonne, Portugal", type: "ville" },
  { label: "Toronto", iata: "YYZ", hotelsQ: "Toronto", type: "ville" },
  { label: "Venise", iata: "VCE", hotelsQ: "Venise, Italie", type: "ville" },
  { label: "Las Vegas", iata: "LAS", hotelsQ: "Las Vegas", type: "ville" },
  { label: "Tunis", iata: "TUN", hotelsQ: "Tunis, Tunisie", type: "ville" },
  { label: "Martinique", iata: "FDF", hotelsQ: "Martinique", type: "soleil", alias: ["fort de france"] },
  { label: "New York", iata: "JFK", hotelsQ: "New York, Manhattan", type: "ville" },
  { label: "Guanacaste", iata: "LIR", hotelsQ: "Guanacaste, Costa Rica", type: "soleil", alias: ["liberia"] },
  { label: "Londres", iata: "LHR", hotelsQ: "Londres", type: "ville", alias: ["london"] },
  { label: "Vancouver", iata: "YVR", hotelsQ: "Vancouver", type: "ville" },
  { label: "Ljubljana", iata: "LJU", hotelsQ: "Ljubljana, Slovénie", type: "ville" },
  { label: "Lyon", iata: "LYS", hotelsQ: "Lyon, France", type: "ville" },
  { label: "Buenos Aires", iata: "EZE", hotelsQ: "Buenos Aires", type: "ville" },
  { label: "Miami", iata: "MIA", hotelsQ: "Miami Beach", type: "ville" },
  { label: "Bâle", iata: "BSL", hotelsQ: "Bâle, Suisse", type: "ville", alias: ["bale", "basel"] },
  { label: "Le Caire", iata: "CAI", hotelsQ: "Le Caire, Égypte", type: "ville", alias: ["caire"] },
  { label: "Nice", iata: "NCE", hotelsQ: "Nice, Côte d'Azur", type: "ville" },
  { label: "Guadeloupe", iata: "PTP", hotelsQ: "Guadeloupe", type: "soleil", alias: ["pointe a pitre"] },
  { label: "Tokyo", iata: "NRT", hotelsQ: "Tokyo", type: "ville" },
  { label: "Carthagène", iata: "CTG", hotelsQ: "Carthagène, Colombie", type: "ville", alias: ["carthagene", "cartagena"] },
  { label: "Casablanca", iata: "CMN", hotelsQ: "Casablanca, Maroc", type: "ville" },
  { label: "Marrakech", iata: "RAK", hotelsQ: "Marrakech, Maroc", type: "ville" },
  { label: "Providenciales", iata: "PLS", hotelsQ: "Turks-et-Caïcos", type: "soleil", alias: ["turks", "turks et caicos"] },
  { label: "Reykjavik", iata: "KEF", hotelsQ: "Reykjavik, Islande", type: "nature" },
  { label: "Curaçao", iata: "CUR", hotelsQ: "Curaçao", type: "soleil", alias: ["curacao"] },
  { label: "Saint-Martin", iata: "SXM", hotelsQ: "Saint-Martin", type: "soleil", alias: ["saint martin", "st martin"] },
  { label: "Roatán", iata: "RTB", hotelsQ: "Roatán, Honduras", type: "soleil", alias: ["roatan"] },
  { label: "Nassau", iata: "NAS", hotelsQ: "Nassau, Bahamas", type: "soleil", alias: ["bahamas"] },
  { label: "Cozumel", iata: "CZM", hotelsQ: "Cozumel, Mexique", type: "soleil" },
  { label: "Cayo Largo", iata: "CYO", hotelsQ: "Cayo Largo, Cuba", type: "soleil" },
  { label: "Honolulu", iata: "HNL", hotelsQ: "Honolulu, Hawaï", type: "soleil", alias: ["hawai", "hawaii"] },
  { label: "Porto", iata: "OPO", hotelsQ: "Porto, Portugal", type: "ville" },
  { label: "Madrid", iata: "MAD", hotelsQ: "Madrid, Espagne", type: "ville" },
  { label: "Amsterdam", iata: "AMS", hotelsQ: "Amsterdam", type: "ville" },
  { label: "Dublin", iata: "DUB", hotelsQ: "Dublin, Irlande", type: "ville" },
  { label: "Los Cabos", iata: "SJD", hotelsQ: "Los Cabos, Mexique", type: "soleil", alias: ["cabo"] },
  { label: "Riviera Maya", iata: "CUN", hotelsQ: "Riviera Maya, Mexique", type: "soleil", alias: ["playa del carmen"] },
  { label: "Charlevoix", iata: null, hotelsQ: "Charlevoix, Québec", type: "domestique", alias: ["club med charlevoix"] },
  { label: "Tremblant", iata: null, hotelsQ: "Mont-Tremblant, Québec", type: "domestique", alias: ["mont tremblant"] },
];

// ── Règles PAYS → candidats ordonnés (fréquence réelle) ──────────────────────
const COUNTRY_RULES: Array<{ match: string[]; candidates: string[] }> = [
  { match: ["republique dominicaine", "la republique", "republique", "rd", "dominican"], candidates: ["Punta Cana", "Puerto Plata", "Samaná"] },
  { match: ["cuba"], candidates: ["Varadero", "Cayo Coco", "Cayo Santa María", "Holguín"] },
  { match: ["mexique", "mexico"], candidates: ["Cancún", "Puerto Vallarta", "Los Cabos"] },
  { match: ["jamaique", "jamaica"], candidates: ["Montego Bay"] },
  { match: ["costa rica"], candidates: ["Guanacaste"] },
  { match: ["floride", "florida"], candidates: ["Fort Lauderdale", "Orlando", "Miami"] },
  { match: ["grece", "greece"], candidates: ["Athènes"] },
  { match: ["portugal"], candidates: ["Lisbonne", "Porto"] },
  { match: ["maroc", "morocco"], candidates: ["Casablanca", "Marrakech"] },
  { match: ["espagne", "spain"], candidates: ["Barcelone", "Málaga", "Madrid"] },
  { match: ["italie", "italy"], candidates: ["Rome", "Venise"] },
];

const byLabel = new Map(TABLE.map((e) => [norm(e.label), e]));
const byAlias = new Map<string, Entry>();
for (const e of TABLE) for (const a of e.alias ?? []) byAlias.set(norm(a), e);

function toResolved(e: Entry, confiance: number, aConfirmer = false): ResolvedDestination {
  return { label: e.label, iata: e.iata, hotelsQ: e.hotelsQ, type: e.type, confiance, aConfirmer };
}

/** Résout UNE destination dite → liste ordonnée de candidats. */
export function resolveDestination(said: string): ResolvedDestination[] {
  const n = norm(said);
  if (!n) return [];

  // IATA brut tapé/dit (ex. « PUJ »)
  if (/^[a-z]{3}$/.test(n)) {
    const hit = TABLE.find((e) => e.iata?.toLowerCase() === n);
    if (hit) return [toResolved(hit, 0.95)];
    return [{ label: said.toUpperCase(), iata: said.toUpperCase(), hotelsQ: said, type: "ville", confiance: 0.5, aConfirmer: true }];
  }

  const direct = byLabel.get(n) ?? byAlias.get(n);
  if (direct) return [toResolved(direct, 0.95)];

  // Correspondance partielle (« punta cana republique dominicaine »)
  for (const [key, e] of byLabel) if (n.includes(key) || key.includes(n)) return [toResolved(e, 0.85)];
  for (const [key, e] of byAlias) if (n.includes(key)) return [toResolved(e, 0.8)];

  // Règles pays → candidats ordonnés, marqués « à confirmer »
  for (const rule of COUNTRY_RULES) {
    if (rule.match.some((m) => n === m || n.includes(m))) {
      return rule.candidates
        .map((label) => byLabel.get(norm(label)))
        .filter((e): e is Entry => Boolean(e))
        .map((e, i) => toResolved(e, 0.7 - i * 0.1, true));
    }
  }

  return []; // inconnu → repli autocomplete (ci-dessous), sinon nudge
}

// ── Repli SerpAPI : la marche 2 des règles §1 ────────────────────────────────
// « 1) lookup local ; 2) fallback google_hotels_autocomplete ; 3) sinon → nudge,
// pas de devinette. » Le repli ne tire QUE si la table locale est muette, et une
// suggestion faible reste une NON-résolution (elle rend `null`, donc un nudge).

/** Ce qu'un nom d'établissement prononcé permet de récupérer. */
export type ResolvedProperty = {
  nom: string;             // nom tel que Google le connaît (« Club Med Michès Playa Esmeralda… »)
  propertyToken: string;   // → fiche google_hotels exacte, photos et avis
  kgmid: string | null;    // kgmid de la PROPRIÉTÉ — inutilisable pour les vols (vérifié : 0 résultat)
  lieu: string | null;     // le contexte de lieu qui manquait à la requête hôtel (« Miches »)
};

/** Le minimum attendu du client SerpAPI (garde ce module testable sans réseau). */
export type ResolverClient = {
  hotelsAutocomplete(q: string): Promise<Record<string, unknown>>;
  flightsAutocomplete(q: string): Promise<Record<string, unknown>>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

const tokens = (value: string) => new Set(norm(value).split(" ").filter((t) => t.length > 2));

/** Proximité de nom : part des mots du nom PRONONCÉ retrouvés dans le candidat. */
export function nameOverlap(candidate: string, target: string): number {
  const wanted = tokens(target);
  if (wanted.size === 0) return 0;
  const found = tokens(candidate);
  let hits = 0;
  for (const token of wanted) if (found.has(token)) hits += 1;
  return hits / wanted.size;
}

/** Seuil d'acceptation du repli : en dessous, on ne résout pas (on ne devine pas). */
const SEUIL_REPLI = 0.5;

/**
 * Un NOM D'ÉTABLISSEMENT prononcé → sa fiche Google.
 * Piège vérifié en live : l'autocomplete mélange de vraies fiches (qui portent
 * `property_token` + `location`) et de simples complétions de requête (qui n'ont
 * ni l'un ni l'autre) — et la fiche n'est PAS en position 1. On balaie donc toutes
 * les suggestions à la recherche d'un `property_token`.
 */
export async function resolvePropertyRemote(said: string, serp: ResolverClient): Promise<ResolvedProperty | null> {
  const q = norm(said);
  if (!q) return null;
  const res = (await serp.hotelsAutocomplete(q)) as { suggestions?: Raw[] };
  for (const s of res.suggestions ?? []) {
    const token = typeof s.property_token === "string" ? s.property_token : null;
    if (!token) continue;
    const nom = String(s.value ?? "");
    if (nameOverlap(nom, said) < SEUIL_REPLI) continue;
    return {
      nom,
      propertyToken: token,
      kgmid: typeof s.kgmid === "string" ? s.kgmid : null,
      lieu: typeof s.location === "string" && s.location.trim() ? s.location : null,
    };
  }
  return null;
}

/**
 * Un NOM DE LIEU → ville requêtable (IATA et/ou kgmid).
 * Deux pièges vérifiés : (a) l'engin est muet sur les accents — « Michès » rend 0
 * résultat, « Miches » rend la ville et ses 3 aéroports ; (b) un `type: "region"`
 * (pays) reste une non-résolution : on ne choisit pas un aéroport à la place du
 * client, la table locale a des règles pays pour ça.
 */
export async function resolveDestinationRemote(said: string, serp: ResolverClient): Promise<ResolvedDestination | null> {
  const q = norm(said);
  if (!q) return null;
  const res = (await serp.flightsAutocomplete(q)) as { suggestions?: Raw[] };
  for (const s of res.suggestions ?? []) {
    if (s.type !== "city") continue;
    const nom = String(s.name ?? "");
    if (nameOverlap(nom, said) < SEUIL_REPLI) continue;
    const iata = (s.airports ?? []).map((a: Raw) => a?.id).find((id: unknown) => typeof id === "string" && /^[A-Z]{3}$/.test(id)) ?? null;
    const kgmid = typeof s.id === "string" && /^\/[mg]\//.test(s.id) ? s.id : null;
    if (!iata && !kgmid) continue;
    return {
      label: nom.split(",")[0].trim() || nom,
      iata,
      hotelsQ: nom,
      type: "ville",
      // Pas de `aConfirmer` ici : ce n'est pas un choix fait à la place du client.
      // Il a nommé CE lieu, l'engin a rendu une VILLE (`type: "city"`, les régions
      // sont refusées ci-dessus) dont au moins la moitié des mots prononcés se
      // retrouvent (SEUIL_REPLI). Le libellé reste le sien. Le doute qui demeure
      // — un homonyme dans un autre pays — est un doute de CONFIANCE : il vit dans
      // le 0,75, pas dans un drapeau qui interdit d'afficher.
      confiance: 0.75,
      kgmid,
    };
  }
  return null;
}
