import { displayConversationCardTitle, displayConversationCardSubtitle, displayConversationFlightDetail } from "../../app/components/offer-format.ts";
import type { TripBrief } from "../extraction/trip-brief";
import type { SuggestionsResult } from "../suggestions/engine";
import type { ProductSearchFlightSegment } from "../product-search/types";
import { publicHttpsUrl, safeProductMetadata } from "../product-search/offer-metadata.ts";

export type DiscoveryEntry = {
  id: string;
  kind: "flight" | "hotel" | "destination" | "conversation";
  title: string;
  detail?: string;
  price?: string;
  dateLabel?: string;
  observedAt?: string;
  countryCode?: string;
  sessionId?: string;
  url?: string;
  source?: string;
  image?: string;
  images?: string[];
  hotelClass?: string;
  amenities?: string[];
  segments?: ProductSearchFlightSegment[];
  rating?: number;
};

type DiscoverySession = {
  id: string;
  createdAt: string;
  tripTitle: string;
  summary: TripBrief | { headline: string };
  suggestions?: (SuggestionsResult & { generatedAt?: string }) | null;
};

// Flags identify explicitly named countries. A city or an ambiguous place is
// never assigned a country through a title, airport default, or guessed match.
const COUNTRY_CODES: Record<string, string> = {
  canada: "CA", portugal: "PT", france: "FR", espagne: "ES", spain: "ES",
  italie: "IT", italy: "IT", grece: "GR", greece: "GR", mexique: "MX", mexico: "MX",
  cuba: "CU", "republique dominicaine": "DO", "dominican republic": "DO",
  "costa rica": "CR", jamaique: "JM", jamaica: "JM", japon: "JP", japan: "JP",
  thailande: "TH", thailand: "TH", maroc: "MA", morocco: "MA", islande: "IS", iceland: "IS",
  "royaume uni": "GB", "united kingdom": "GB", "etats unis": "US", "united states": "US",
  allemagne: "DE", germany: "DE", suisse: "CH", switzerland: "CH", irlande: "IE", ireland: "IE",
  australie: "AU", australia: "AU", bresil: "BR", brazil: "BR", perou: "PE", peru: "PE",
};

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[-_]/g, " ").trim();
}

function validTimestamp(value?: string) {
  return value && Number.isFinite(new Date(value).getTime()) ? value : undefined;
}

/** A read-only projection of the advisor's loaded workspace, never a search. */
export function buildDiscoveryEntries(sessions: DiscoverySession[], language: "fr" | "en"): DiscoveryEntry[] {
  const entries: DiscoveryEntry[] = [];
  const destinationsSeen = new Set<string>();
  const sorted = [...sessions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  for (const session of sorted) {
    const field = "lieu" in session.summary ? session.summary.lieu.destinations : null;
    const destinations = field?.statut === "capte" && Array.isArray(field.valeur) ? field.valeur.filter((place) => typeof place === "string" && place.trim()) : [];
    const codes = new Set(destinations.map((place) => COUNTRY_CODES[normalized(place)]).filter(Boolean));
    const countryCode = destinations.length === 1 && codes.size === 1 ? [...codes][0] : undefined;
    const createdAt = validTimestamp(session.createdAt);
    const dateLabel = createdAt ? new Intl.DateTimeFormat(language === "fr" ? "fr-CA" : "en-CA", { month: "short", day: "numeric" }).format(new Date(createdAt)) : undefined;
    entries.push({ id: `conversation:${session.id}`, kind: "conversation", title: destinations.join(" · ") || session.tripTitle || (language === "fr" ? "Conversation enregistrée" : "Saved conversation"), detail: language === "fr" ? "Conversation" : "Conversation", dateLabel, observedAt: createdAt, countryCode, sessionId: session.id });
    for (const place of destinations) {
      const key = normalized(place);
      if (destinationsSeen.has(key)) continue;
      destinationsSeen.add(key);
      entries.push({ id: `destination:${key}`, kind: "destination", title: place, detail: language === "fr" ? "Destination évoquée" : "Discussed destination", dateLabel, observedAt: createdAt, countryCode: COUNTRY_CODES[key], sessionId: session.id });
    }
    const retrievedAt = validTimestamp(session.suggestions?.generatedAt);
    for (const card of session.suggestions?.cards ?? []) {
      if (card.type !== "vols" && card.type !== "hotels") continue;
      for (const [index, item] of card.items.slice(0, 3).entries()) {
        const kind = card.type === "vols" ? "flight" : "hotel";
        entries.push({ id: `${session.id}:${card.id}:${index}`, kind, title: item.titre, detail: [displayConversationCardTitle(card, language), card.type === "vols" ? displayConversationFlightDetail(item.detail, language) : item.detail].filter(Boolean).join(" · "), price: item.prix, dateLabel: displayConversationCardSubtitle(card, language), observedAt: retrievedAt, countryCode, sessionId: session.id, url: publicHttpsUrl(item.lien), source: card.source, ...safeProductMetadata({ kind, image: item.image, segments: item.segments }) });
      }
    }
  }
  const priority = { flight: 0, hotel: 1, destination: 2, conversation: 3 };
  return entries.sort((a, b) => (b.observedAt ? new Date(b.observedAt).getTime() : 0) - (a.observedAt ? new Date(a.observedAt).getTime() : 0) || priority[a.kind] - priority[b.kind]).slice(0, 36);
}
