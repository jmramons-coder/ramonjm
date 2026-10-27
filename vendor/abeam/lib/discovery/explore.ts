import type { DailyFeedItem, EditorialSearchScope } from "../product-search/feed-types.ts";
import type { ProductSearchItem, ProductSearchKind, ProductSearchRequest } from "../product-search/types.ts";

/** One actual inspiration query, never a label pasted across unrelated fares. */
export function latestExploreIdea(items: DailyFeedItem[], scopes: EditorialSearchScope[], kind: ProductSearchKind) {
  const ordered = [...scopes].sort((a, b) => Date.parse(b.retrievedAt) - Date.parse(a.retrievedAt));
  for (const scope of ordered) {
    const matching = items.filter((item) => item.editorialScopeId === scope.id
      && item.departureDate === scope.departureDate && item.returnDate === scope.returnDate
      && item.adults === scope.adults && item.childrenAges.length === 0
      && item.destination === scope.destination && (item.kind === "hotel" || item.origin === scope.origin)
      && (kind === "trips" || item.kind === (kind === "hotels" ? "hotel" : "flight")));
    if (matching.length) return { scope, items: matching };
  }
  return { scope: ordered[0] ?? null, items: [] as ProductSearchItem[] };
}

/** Copy an idea into the form; callers still submit the search explicitly. */
export function exploreIdeaRequest(scope: EditorialSearchScope, kind: ProductSearchKind, language: "fr" | "en"): ProductSearchRequest {
  return {
    kind, language, destination: kind === "hotels" ? scope.destinationLabel : scope.destination,
    ...(kind !== "hotels" ? { origin: scope.origin } : {}),
    departureDate: scope.departureDate, returnDate: scope.returnDate,
    adults: scope.adults, childrenAges: [],
  };
}

/** Combined searches have separate lists; switching type cannot mix products. */
export function groupExploreItems(items: ProductSearchItem[], kind: ProductSearchKind) {
  const kinds: ("flight" | "hotel")[] = kind === "trips" ? ["flight", "hotel"] : [kind === "hotels" ? "hotel" : "flight"];
  return kinds.map((type) => ({ kind: type, items: items.filter((item) => item.kind === type) }));
}
