import type { UILanguage } from "@/lib/ui/language";
import type { SuggestionCard } from "@/lib/suggestions/engine";
import type { DiscoveryEntry } from "@/lib/discovery/entries";

function formatDate(date: Date, language: UILanguage, withTime: boolean) {
  return new Intl.DateTimeFormat(language === "fr" ? "fr-CA" : "en-CA", withTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/** Itinerary days stay date-only; retrieved timestamps retain their time. */
export function displayOfferDate(value: string | undefined, language: UILanguage, withTime = false): string {
  if (!value) return "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  return Number.isFinite(date.getTime()) ? formatDate(date, language, withTime) : "";
}

export function offerRetrievalDate(value: string | undefined, language: UILanguage) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  const date = new Date(value);
  return { label: formatDate(date, language, false), full: formatDate(date, language, true), value };
}

/** Only aBeam's route heading changes; the named destination stays literal. */
export function displayConversationCardTitle(card: Pick<SuggestionCard, "type" | "titre">, language: UILanguage): string {
  if (card.type !== "vols") return card.titre;
  return card.titre.replace(/^(?:Vols|Flights) (?=[A-Z]{3} → )/, language === "fr" ? "Vols " : "Flights ");
}

export function displayConversationCardBadge(value: string | undefined, language: UILanguage): string | undefined {
  const labels = [
    { fr: "Dates à confirmer", en: "Dates to confirm" },
    { fr: "Bon moment : prix sous la normale", en: "Good timing: price below the usual range" },
  ];
  return labels.find((label) => label.fr === value || label.en === value)?.[language] ?? value;
}

function passengerUnit(count: string, kind: "adult" | "child", language: UILanguage): string {
  const single = Number(count) === 1;
  const unit = kind === "adult" ? (language === "fr" ? (single ? "adulte" : "adultes") : (single ? "adult" : "adults"))
    : (language === "fr" ? (single ? "enfant" : "enfants") : (single ? "child" : "children"));
  return `${count} ${unit}`;
}

/** Recognize exact authored subtitle fragments; quotes/provider prose are not translated. */
export function displayConversationCardSubtitle(card: Pick<SuggestionCard, "type" | "sousTitre">, language: UILanguage): string | undefined {
  if (!card.sousTitre || (card.type !== "vols" && card.type !== "hotels")) return card.sousTitre;
  const fr = language === "fr";
  return card.sousTitre.split(" · ").map((part) => {
    if (/^\d{4}-\d{2}-\d{2}(?: → \d{4}-\d{2}-\d{2})?$/.test(part)) {
      return part.split(" → ").map((value) => {
        const date = new Date(`${value}T12:00:00`);
        const roundTrip = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
        return roundTrip === value ? displayOfferDate(value, language) : value;
      }).join(" → ");
    }
    const passenger = part.match(/^(\d+) (adulte\(s\)|adultes?|adults?|enfant\(s\)|enfants?|child|children)$/);
    if (passenger) return passengerUnit(passenger[1], /^adul/.test(passenger[2]) ? "adult" : "child", language);
    if (card.type !== "vols") return part;
    if (part === "prix pour une personne" || part === "price for one person") return fr ? "prix pour une personne" : "price for one person";
    const coverage = part.match(/^(?:prix pour|price for) (\d+) (?:adultes?|adults?)(?: (?:et|and) (\d+) (?:enfants?|child|children))?$/);
    if (coverage) return `${fr ? "prix pour" : "price for"} ${passengerUnit(coverage[1], "adult", language)}${coverage[2] ? ` ${fr ? "et" : "and"} ${passengerUnit(coverage[2], "child", language)}` : ""}`;
    const airport = part.match(/^(?:aéroport le plus pratique pour|most practical airport for) (.+)$/);
    if (airport) return `${fr ? "aéroport le plus pratique pour" : "most practical airport for"} ${airport[1]}`;
    if (part === "départ présumé Montréal" || part === "assumed departure from Montréal") return fr ? "départ présumé Montréal" : "assumed departure from Montréal";
    return part;
  }).join(" · ");
}

/** Duration/stops are aBeam labels; airline names and all other offer details stay literal. */
export function displayConversationFlightDetail(value: string | undefined, language: UILanguage): string | undefined {
  const match = value?.match(/^(\d+) h · (direct|nonstop|(\d+) (?:escale\(s\)|escales?|stops?))$/);
  if (!match) return value;
  const stops = match[3] ? `${match[3]} ${language === "fr" ? (Number(match[3]) === 1 ? "escale" : "escales") : (Number(match[3]) === 1 ? "stop" : "stops")}`
    : language === "fr" ? "direct" : "nonstop";
  return `${match[1]} h · ${stops}`;
}

/** Only conversation-derived discovery entries contain these authored card labels. */
export function displayDiscoveryOfferDetail(entry: Pick<DiscoveryEntry, "kind" | "detail" | "sessionId">, language: UILanguage): string | undefined {
  if (entry.kind !== "flight" || !entry.sessionId || !entry.detail) return entry.detail;
  const [title, ...parts] = entry.detail.split(" · ");
  return [displayConversationCardTitle({ type: "vols", titre: title }, language), displayConversationFlightDetail(parts.join(" · "), language)].filter(Boolean).join(" · ");
}

export function displayDiscoveryOfferDates(entry: Pick<DiscoveryEntry, "kind" | "dateLabel" | "sessionId">, language: UILanguage): string | undefined {
  return entry.sessionId && (entry.kind === "flight" || entry.kind === "hotel")
    ? displayConversationCardSubtitle({ type: entry.kind === "flight" ? "vols" : "hotels", sousTitre: entry.dateLabel }, language)
    : entry.dateLabel;
}
