import type { ProductSearchItem } from "./types.ts";

/** Transparent inspiration query chosen by the product, never a client brief. */
export type EditorialSearchScope = {
  id: string;
  origin: string;
  originLabel: string;
  destination: string;
  destinationLabel: string;
  countryCode: string;
  departureDate: string;
  returnDate: string;
  /** Older cached examples retain their original one-adult occupancy. */
  adults: 1 | 2;
  childrenAges: [];
  basis: "editorial-example";
  retrievedAt: string;
};

export type DailyFeedItem = ProductSearchItem & { editorialScopeId: string };

export type DiscoveryFeedSnapshot = {
  items: DailyFeedItem[];
  editorialScopes: EditorialSearchScope[];
  refreshedAt: string | null;
  day: string | null;
};

export type DiscoveryFeedResult = DiscoveryFeedSnapshot & {
  status: "ready" | "refreshing";
  stale: boolean;
  automaticAttemptedToday: boolean;
  warnings: string[];
  nextRefreshAt?: string;
  retryAfterSeconds?: number;
  searchesRemaining?: number;
  searchesUsed?: number;
};

export type DiscoveryFeedRequest = { language: "fr" | "en"; refresh?: boolean };

export type DiscoveryFeedClaim = {
  claimId: string | null;
  state: "claimed" | "cached" | "busy" | "cooldown" | "limit" | "unavailable";
  sequence: number;
  snapshot: DiscoveryFeedSnapshot;
  automaticAttemptDay: string | null;
  manualRefreshAt?: string;
  retryAfterSeconds?: number;
  searchesRemaining?: number;
  lastError?: string;
};
