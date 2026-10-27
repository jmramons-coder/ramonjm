import { publicHttpsUrl } from "../product-search/offer-metadata.ts";
import type { SuggestionCard, SuggestionItem } from "../suggestions/engine.ts";

/** An executed provider search is distinct from an individual offer URL. */
export function conversationFlightSearchUrl(value: unknown): string | undefined {
  const safe = publicHttpsUrl(value);
  if (!safe) return undefined;
  const url = new URL(safe);
  return (url.hostname === "google.com" || url.hostname.endsWith(".google.com"))
    && /^\/travel\/flights(?:\/|$)/.test(url.pathname) ? safe : undefined;
}

export function conversationOfferLink(type: SuggestionCard["type"], item: SuggestionItem): { href: string; kind: "offer" | "flight-search" } | null {
  const href = publicHttpsUrl(item.lien);
  if (href) return { href, kind: "offer" };
  const search = type === "vols" ? conversationFlightSearchUrl(item.lienRecherche) : undefined;
  return search ? { href: search, kind: "flight-search" } : null;
}
