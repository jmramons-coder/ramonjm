import type { SuggestionCard } from "../suggestions/engine.ts";
import { safeFlightSegments } from "../product-search/offer-metadata.ts";
import { conversationOfferLink } from "./offer-link.ts";

/** Retain the returned provider name without exposing its transport integration. */
export function conversationOfferSourceLabel(source: string): string {
  return source.replace(/\s+via\s+SerpAPI\b/gi, "").trim();
}

/** Provider order may change while logos and individual disclosures are mounted. */
export function keyedConversationOffers(card: SuggestionCard) {
  const occurrences = new Map<string, number>();
  return card.items.map((item) => {
    const fields: unknown[] = [item.titre, conversationOfferLink(card.type, item)?.href ?? "", item.detail ?? ""];
    const legs = card.type === "vols" ? safeFlightSegments(item.segments) : [];
    if (legs.length) fields.push(legs.map((leg) => [leg.flightNumber, leg.from, leg.to, leg.departureTime, leg.arrivalTime]));
    const identity = JSON.stringify(fields);
    const occurrence = occurrences.get(identity) ?? 0;
    occurrences.set(identity, occurrence + 1);
    return { item, key: occurrence ? `${identity}::${occurrence}` : identity };
  });
}

/** A shared executed flight search belongs to the route header, not every airline. */
export function conversationCardSourceLink(card: SuggestionCard) {
  if (card.items.length === 1) return conversationOfferLink(card.type, card.items[0]);
  if (card.type !== "vols" || !card.items.length) return null;
  const links = card.items.map((item) => conversationOfferLink(card.type, item));
  const first = links[0];
  return first?.kind === "flight-search" && links.every((link) => link?.kind === "flight-search" && link.href === first.href) ? first : null;
}
