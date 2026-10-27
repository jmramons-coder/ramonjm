/** Advisor-initiated research: inputs are explicit, never encounter facts. */
export type ProductSearchKind = "flights" | "hotels" | "trips";

export type ProductSearchRequest = {
  kind: ProductSearchKind;
  language: "fr" | "en";
  /** Hotel name or keywords. Not a natural-language itinerary parser. */
  query?: string;
  /** Explicit IATA airport code for flights/trips. */
  origin?: string;
  /** IATA airport code for flights/trips; city/region for hotels. */
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  adults?: number;
  childrenAges?: number[];
  /** Required only for flight searches including a child younger than two. */
  infantSeating?: "lap" | "seat";
  /** Single-kind searches: provider fare filter CAD, or CAD/night for hotels. */
  maxPrice?: number;
};

export type ProductSearchField = keyof ProductSearchRequest;
export type ProductSearchClarification = { field: ProductSearchField; message: string };

/** A returned flight leg; missing supplier fields stay missing. Times keep their supplied local/offset form. */
export type ProductSearchFlightSegment = {
  airline?: string;
  flightNumber?: string;
  from?: string;
  to?: string;
  departureTime?: string;
  arrivalTime?: string;
  durationMinutes?: number;
};

export type ProductSearchItem = {
  id: string;
  /** Stable provider evidence identity; excludes prices, ordering and display language. */
  offerKey?: string;
  kind: "flight" | "hotel";
  title: string;
  detail?: string;
  destination: string;
  /** Arrival-airport evidence, or explicit daily editorial search geography. */
  countryCode?: string;
  origin?: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  childrenAges: number[];
  /** Flight fare scope; lodging occupancy does not depend on flight seating. */
  infantSeating?: "lap" | "seat";
  price?: {
    amount: number;
    currency: "CAD";
    unit: "round-trip" | "night" | "stay";
  };
  rating?: number;
  /** Actual hotel photo or airline logo, restricted to approved HTTPS Google hosts/paths. */
  image?: string;
  /** Up to six distinct hotel photos from the same returned property, never a separate photo search. */
  images?: string[];
  hotelClass?: string;
  /** Up to eight actual returned amenities. */
  amenities?: string[];
  /** Up to eight actual returned flight legs; no synthesized return itinerary. */
  segments?: ProductSearchFlightSegment[];
  url?: string;
  source: "Google Flights via SerpAPI" | "Google Hotels via SerpAPI" | "Portfolio demo · sample offers";
  retrievedAt: string;
};

export type ProductSearchResult = {
  status: "ready" | "needs-details";
  items: ProductSearchItem[];
  clarifications: ProductSearchClarification[];
  warnings: string[];
  generatedAt: string;
  searchesUsed: number;
  searchesRemaining?: number;
};

export type ProductSearchError = {
  error: string;
  code?: "INVALID_SEARCH" | "SEARCH_UNAVAILABLE" | "SEARCH_BUDGET_UNAVAILABLE" | "SEARCH_BUSY" | "SEARCH_COOLDOWN" | "SEARCH_LIMIT";
  retryAfterSeconds?: number;
};
