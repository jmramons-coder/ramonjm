import { z } from "zod";
import { researchIdentity } from "../discovery/research.ts";
import { publicHttpsUrl, safeProductMetadata } from "./offer-metadata.ts";
import type { DailyFeedItem, DiscoveryFeedSnapshot, EditorialSearchScope } from "./feed-types.ts";
import type { ProductSearchItem } from "./types.ts";

export const DISCOVERY_FEED_MAX_ITEMS = 48;
export const DISCOVERY_FEED_MAX_SCOPES = 8;
export const DISCOVERY_FEED_RETENTION_DAYS = 7;
export const emptyDiscoveryFeed = (): DiscoveryFeedSnapshot => ({ items: [], editorialScopes: [], refreshedAt: null, day: null });

const timestamp = z.string().datetime({ offset: true });
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const item = z.object({
  id: z.string().max(8192), offerKey: z.string().max(4096).optional(), kind: z.enum(["flight", "hotel"]),
  title: z.string().min(1).max(180), detail: z.string().max(800).optional(),
  destination: z.string().max(160), origin: z.string().max(100).optional(), countryCode: z.string().regex(/^[A-Z]{2}$/).optional(),
  departureDate: date, returnDate: date, adults: z.number().int().min(1).max(9),
  childrenAges: z.array(z.number().int().min(0).max(17)).max(8), infantSeating: z.enum(["lap", "seat"]).optional(),
  price: z.object({ amount: z.number().finite().positive(), currency: z.literal("CAD"), unit: z.enum(["round-trip", "night", "stay"]) }).optional(),
  rating: z.number().min(0).max(5).optional(), url: z.string().max(2000).optional(),
  // Optional supplier metadata is sanitized per field. A malformed photo or
  // leg cannot erase otherwise valid saved offers or their earlier evidence.
  image: z.unknown().optional(), images: z.unknown().optional(), hotelClass: z.unknown().optional(),
  amenities: z.unknown().optional(), segments: z.unknown().optional(),
  source: z.enum(["Google Flights via SerpAPI", "Google Hotels via SerpAPI"]), retrievedAt: timestamp,
  editorialScopeId: z.string().max(160),
});
const scope = z.object({
  id: z.string().max(160), origin: z.string().regex(/^[A-Z]{3}$/), originLabel: z.string().max(100),
  destination: z.string().regex(/^[A-Z]{3}$/), destinationLabel: z.string().max(100), countryCode: z.string().regex(/^[A-Z]{2}$/),
  departureDate: date, returnDate: date, adults: z.union([z.literal(1), z.literal(2)]), childrenAges: z.tuple([]), basis: z.literal("editorial-example"), retrievedAt: timestamp,
});
const snapshot = z.object({ items: z.array(item).max(DISCOVERY_FEED_MAX_ITEMS), editorialScopes: z.array(scope).max(DISCOVERY_FEED_MAX_SCOPES), refreshedAt: timestamp.nullable(), day: date.nullable() });

/** A broken persisted payload never becomes an invented or unsafe offer. */
export function readDiscoveryFeedSnapshot(value: unknown): DiscoveryFeedSnapshot {
  const parsed = snapshot.safeParse(value);
  if (!parsed.success) return emptyDiscoveryFeed();
  const scopes = new Map(parsed.data.editorialScopes.map((entry) => [entry.id, entry]));
  return {
    ...parsed.data,
    items: parsed.data.items.filter((entry) => {
      const origin = scopes.get(entry.editorialScopeId);
      return origin && entry.destination === origin.destination && entry.departureDate === origin.departureDate
        && entry.returnDate === origin.returnDate && entry.adults === origin.adults && entry.childrenAges.length === 0
        && (entry.kind === "hotel" || entry.origin === origin.origin);
    }).map(({ image, images, hotelClass, amenities, segments, ...entry }) => ({
      ...entry, ...safeProductMetadata({ kind: entry.kind, image, images, hotelClass, amenities, segments }),
      url: publicHttpsUrl(entry.url),
    })),
  };
}

export function validDiscoveryFeedBatch(value: unknown): boolean {
  const parsed = snapshot.safeParse(value);
  if (!parsed.success || !parsed.data.refreshedAt || parsed.data.editorialScopes.length !== 1) return false;
  const safe = readDiscoveryFeedSnapshot(value);
  return safe.items.length === parsed.data.items.length && safe.day === safe.refreshedAt?.slice(0, 10);
}

export function pruneDiscoveryFeed(value: DiscoveryFeedSnapshot, now = new Date()): DiscoveryFeedSnapshot {
  const cutoff = now.getTime() - DISCOVERY_FEED_RETENTION_DAYS * 86_400_000;
  const editorialScopes = value.editorialScopes.filter((entry) => Date.parse(entry.retrievedAt) >= cutoff);
  const scopes = new Set(editorialScopes.map((entry) => entry.id));
  return { ...value, editorialScopes, items: value.items.filter((entry) => scopes.has(entry.editorialScopeId) && Date.parse(entry.retrievedAt) >= cutoff) };
}

/** Refresh updates matching evidence; older real offers retain their own time. */
export function mergeDiscoveryFeed(previous: DiscoveryFeedSnapshot, incoming: ProductSearchItem[], editorialScope: EditorialSearchScope, retrievedAt: string): DiscoveryFeedSnapshot {
  const cutoff = Date.parse(retrievedAt) - DISCOVERY_FEED_RETENTION_DAYS * 86_400_000;
  const offers = new Map<string, DailyFeedItem>();
  for (const entry of previous.items) {
    if (Date.parse(entry.retrievedAt) >= cutoff) offers.set(researchIdentity(entry), entry);
  }
  for (const entry of incoming) {
    const identity = researchIdentity(entry);
    const previousEntry = offers.get(identity);
    if (Date.parse(entry.retrievedAt) < cutoff || (previousEntry && Date.parse(entry.retrievedAt) < Date.parse(previousEntry.retrievedAt))) continue;
    offers.set(identity, {
      ...entry, id: `daily:${identity}`, editorialScopeId: editorialScope.id,
      // This identifies the explicitly named search country, not an inferred
      // client preference or a claim about the hotel's verified street address.
      countryCode: entry.countryCode ?? (entry.kind === "hotel" ? editorialScope.countryCode : undefined),
    });
  }
  const scopeMap = new Map(previous.editorialScopes.filter((entry) => Date.parse(entry.retrievedAt) >= cutoff).map((entry) => [entry.id, entry]));
  const previousScope = scopeMap.get(editorialScope.id);
  if (!previousScope || Date.parse(previousScope.retrievedAt) <= Date.parse(retrievedAt)) scopeMap.set(editorialScope.id, { ...editorialScope, retrievedAt });
  const editorialScopes = [...scopeMap.values()].sort((a, b) => Date.parse(b.retrievedAt) - Date.parse(a.retrievedAt)).slice(0, DISCOVERY_FEED_MAX_SCOPES);
  const retainedScopes = new Set(editorialScopes.map((entry) => entry.id));
  const items = [...offers.values()].filter((entry) => retainedScopes.has(entry.editorialScopeId))
    .sort((a, b) => Date.parse(b.retrievedAt) - Date.parse(a.retrievedAt)).slice(0, DISCOVERY_FEED_MAX_ITEMS);
  const refreshedAt = previous.refreshedAt && Date.parse(previous.refreshedAt) > Date.parse(retrievedAt) ? previous.refreshedAt : retrievedAt;
  return { items, editorialScopes, refreshedAt, day: refreshedAt.slice(0, 10) };
}
