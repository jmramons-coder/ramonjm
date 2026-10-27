import type { SuggestionCard } from "../suggestions/engine.ts";
import { formatTravelPeriod, parseDateOnly } from "../ui/date-field.ts";
import { uiLocale, type UILanguage } from "../ui/language.ts";

export type BookmarkFlightSummary = { route: string; dates: string | null; travelers: string | null; badge: string | null };
type Coverage = { adults?: number; children?: number; people?: number };
type PassengerSummary = { label: string; indices: readonly number[] };

const ADULT = "(?:adulte(?:\\(s\\)|s)?|adult(?:\\(s\\)|s)?)";
const CHILD = "(?:enfant(?:\\(s\\)|s)?|child|children)";
const GROUP = new RegExp(`^(\\d+) ${ADULT}(?: (?:et|and) (\\d+) ${CHILD})?$`);
const ADULT_ONLY = new RegExp(`^(\\d+) ${ADULT}$`);
const CHILD_ONLY = new RegExp(`^(\\d+) ${CHILD}$`);
const MONTH = "(?:janvier|janv\\.?|january|jan\\.?|février|fevrier|févr\\.?|fevr\\.?|february|feb\\.?|mars|march|mar\\.?|avril|avr\\.?|april|apr\\.?|mai|may|juin|june|jun\\.?|juillet|juil\\.?|july|jul\\.?|août|aout|august|aug\\.?|septembre|september|sept?\\.?|octobre|october|oct\\.?|novembre|november|nov\\.?|décembre|decembre|déc\\.?|december|dec\\.?)";
const MONTH_TOKENS = [
  ["janvier", "janv", "january", "jan"], ["février", "fevrier", "févr", "fevr", "february", "feb"],
  ["mars", "march", "mar"], ["avril", "avr", "april", "apr"], ["mai", "may"], ["juin", "june", "jun"],
  ["juillet", "juil", "july", "jul"], ["août", "aout", "august", "aug"], ["septembre", "september", "sep", "sept"],
  ["octobre", "october", "oct"], ["novembre", "november", "nov"], ["décembre", "decembre", "déc", "december", "dec"],
];
// Recognized legacy periods translate only recorded calendar words and keep
// their existing day range and optional year, without completing missing facts.
const HUMAN_PERIOD = new RegExp(`^(?:(en|in|le|du|on|from) )?(?:([0-9]{1,2})(?:([–-])([0-9]{1,2}))? )?(${MONTH})(?: ([0-9]{4}))?$`, "iu");
const ASSUMED_ORIGIN = /^(?:départ présumé Montréal|assumed departure from Montréal)$/iu;
const AIRPORT_CONTEXT = /^(?:aéroport le plus pratique pour|most practical airport for) (.+)$/u;

const text = (value: unknown): string | null => typeof value === "string" ? value.trim() || null : null;

function routeLabel(value: unknown, language: UILanguage): string {
  const title = text(value);
  if (!title) return language === "fr" ? "Vol" : "Flight";
  const route = /^(?:Vols|Flights) (.+) → (.+)$/.exec(title);
  return route && route[1].trim() && route[2].trim() && !route[1].includes("→") && !route[2].includes("→") ? `${route[1].trim()} → ${route[2].trim()}` : title;
}

function utcDate(value: string): Date | null {
  const parsed = parseDateOnly(value);
  if (!parsed) return null;
  const date = new Date(0);
  date.setUTCFullYear(parsed.year, parsed.month - 1, parsed.day);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function readableDates(value: string | undefined, language: UILanguage): string | null {
  if (!value) return null;
  const iso = /^(\d{4}-\d{2}-\d{2})(?: → (\d{4}-\d{2}-\d{2}))?$/.exec(value);
  if (iso) {
    const start = utcDate(iso[1]), end = iso[2] ? utcDate(iso[2]) : null;
    if (!start || (iso[2] && (!end || end < start))) return null;
    const formatter = new Intl.DateTimeFormat(uiLocale(language), { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
    return end ? formatter.formatRange(start, end) : formatter.format(start);
  }
  if (/^\d{4}-\d{2}$/.test(value)) return formatTravelPeriod(value, null, language);
  const human = HUMAN_PERIOD.exec(value);
  if (human) {
    const prefix = human[1]?.toLowerCase(), start = human[2], separator = human[3], end = human[4], year = human[6];
    const month = MONTH_TOKENS.findIndex((tokens) => tokens.includes(human[5].toLowerCase().replace(/\.$/u, ""))) + 1;
    if (!month || (year && Number(year) === 0)) return null;
    // An unspecified year may contain February 29. A leap-year validation
    // anchor rejects impossible days without adding that year to the label.
    const validDay = (day: string) => Boolean(parseDateOnly(`${year ?? "2000"}-${String(month).padStart(2, "0")}-${day.padStart(2, "0")}`));
    if ((start && !validDay(start)) || (end && (!validDay(end) || Number(end) < Number(start)))) return null;
    const date = new Date(0);
    date.setUTCFullYear(2000, month - 1, 1);
    const monthLabel = new Intl.DateTimeFormat(uiLocale(language), { month: "long", timeZone: "UTC" }).format(date);
    const prefixLabel = prefix ? language === "fr"
      ? prefix === "en" || prefix === "in" ? "en" : prefix === "le" || prefix === "on" ? "le" : "du"
      : prefix === "en" || prefix === "in" ? "in" : prefix === "le" || prefix === "on" ? "on" : "from" : null;
    return [prefixLabel, start ? `${start}${end ? `${separator}${end}` : ""}` : null, monthLabel, year].filter(Boolean).join(" ");
  }
  return null;
}

function count(value: string, allowZero = false): number | null {
  // Author templates contain integer counts, never ages, prices or decimal guesses.
  if (!/^(?:0|[1-9]\d*)$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && (allowZero ? number >= 0 : number > 0) ? number : null;
}

function completeCoverage(value: string): Coverage | null {
  if (value === "une personne" || value === "one person") return { people: 1 };
  const group = GROUP.exec(value);
  if (!group) return null;
  const adults = count(group[1]), children = group[2] === undefined ? undefined : count(group[2], true);
  return adults === null || children === null ? null : { adults, ...(children !== undefined ? { children } : {}) };
}

function passengerSummary(parts: readonly string[], language: UILanguage): PassengerSummary | null {
  const full: { coverage: Coverage; index: number; fareScoped: boolean }[] = [];
  const direct: { kind: "adults" | "children"; value: number; index: number }[] = [];
  for (const [index, part] of parts.entries()) {
    const prefix = /^(?:prix pour|price for) (.+)$/.exec(part);
    if (prefix) {
      const coverage = completeCoverage(prefix[1]);
      if (!coverage) return null;
      full.push({ coverage, index, fareScoped: true });
      continue;
    }
    const adult = ADULT_ONLY.exec(part), child = CHILD_ONLY.exec(part);
    if (adult || child) {
      const number = count((adult ?? child)![1], Boolean(child));
      if (number === null) return null;
      direct.push({ kind: adult ? "adults" : "children", value: number, index });
    } else if (GROUP.test(part)) {
      const coverage = completeCoverage(part);
      if (!coverage) return null;
      full.push({ coverage, index, fareScoped: false });
    }
  }
  if (full.length > 1 || (full.length && direct.length) || direct.length > 2) return null;
  let coverage = full[0]?.coverage;
  if (direct.length) {
    const adults = direct.find((part) => part.kind === "adults"), children = direct.find((part) => part.kind === "children");
    // Older authored cards used adjacent adult/child fragments. Repeated or
    // disconnected counts are ambiguous, never added together or picked at random.
    if (!adults || direct.filter((part) => part.kind === "adults").length !== 1
      || direct.filter((part) => part.kind === "children").length > 1
      || (children && children.index !== adults.index + 1)) return null;
    coverage = { adults: adults.value, ...(children ? { children: children.value } : {}) };
  }
  if (!coverage) return null;
  const indices = full.length ? [full[0].index] : direct.map((part) => part.index);
  const fr = language === "fr";
  const formatted = (value: number) => new Intl.NumberFormat(uiLocale(language)).format(value);
  const withScope = (label: string): PassengerSummary => ({ label: full[0]?.fareScoped ? `${fr ? "Prix pour" : "Price for"} ${label}` : label, indices });
  if (coverage.people !== undefined) return withScope(`${formatted(coverage.people)} ${fr ? "voyageur" : "traveller"}`);
  if (coverage.adults === undefined) return null;
  const adults = `${formatted(coverage.adults)} ${fr ? coverage.adults === 1 ? "adulte" : "adultes" : coverage.adults === 1 ? "adult" : "adults"}`;
  return withScope(coverage.children ? `${adults} · ${formatted(coverage.children)} ${fr ? coverage.children === 1 ? "enfant" : "enfants" : coverage.children === 1 ? "child" : "children"}` : adults);
}

function badgeLabel(value: unknown, parts: readonly string[], language: UILanguage): string | null {
  const fr = language === "fr", original = text(value);
  let badge = original;
  if (original && /^(?:Dates à confirmer|Dates to confirm)$/iu.test(original)) badge = fr ? "Dates à confirmer" : "Dates to confirm";
  if (original === "Bon moment : prix sous la normale" || original === "Good timing: price below the usual range") badge = fr ? "Bon moment : prix sous la normale" : "Good timing: price below the usual range";
  if (original && ASSUMED_ORIGIN.test(original)) badge = fr ? "Départ présumé Montréal" : "Assumed departure from Montréal";
  const assumedOrigin = parts.some((part) => ASSUMED_ORIGIN.test(part))
    ? fr ? "Départ présumé Montréal" : "Assumed departure from Montréal" : null;
  return [...new Set([badge, assumedOrigin].filter((part): part is string => Boolean(part)))].join(" · ") || null;
}

/**
 * Summarize existing authored flight-card metadata; no model, URL parsing,
 * current-year defaults, provider queries or inferred party/booking facts.
 */
export function summarizeBookmarkFlight(card: SuggestionCard, language: UILanguage): BookmarkFlightSummary {
  if (card?.type !== "vols") return { route: text(card?.titre) ?? (language === "fr" ? "Vol" : "Flight"), dates: null, travelers: null, badge: text(card?.badge) };
  const route = routeLabel(card.titre, language);
  const parts = text(card.sousTitre)?.split(" · ").map((part) => part.trim()) ?? [];
  return { route, dates: readableDates(parts[0], language), travelers: passengerSummary(parts, language)?.label ?? null, badge: badgeLabel(card.badge, parts, language) };
}

/** Preserve actual extra context in the expanded bookmark, without repeating
 * metadata already summarized in its header. Unrecognized source text stays
 * verbatim; only a known authored airport-context label is translated.
 */
export function bookmarkFlightContext(card: SuggestionCard, language: UILanguage): string[] {
  if (card?.type !== "vols") return [];
  const parts = text(card.sousTitre)?.split(" · ").map((part) => part.trim()) ?? [];
  const consumed = new Set(passengerSummary(parts, language)?.indices ?? []);
  if (readableDates(parts[0], language)) consumed.add(0);
  return parts.flatMap((part, index) => {
    if (!part || consumed.has(index) || ASSUMED_ORIGIN.test(part)) return [];
    const airport = AIRPORT_CONTEXT.exec(part);
    return [airport ? `${language === "fr" ? "Aéroport le plus pratique pour" : "Most practical airport for"} ${airport[1]}` : part];
  });
}
