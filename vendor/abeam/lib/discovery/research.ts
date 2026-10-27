import type { ProductSearchItem } from "../product-search/types";
import type { DiscoveryEntry } from "./entries";
import { publicHttpsUrl, safeProductMetadata } from "../product-search/offer-metadata.ts";

const normalized = (value: string) => value.normalize("NFKC").trim().toLowerCase();
const retrievedTime = (item: ProductSearchItem) => Date.parse(item.retrievedAt) || 0;

function hotelPropertyToken(item: ProductSearchItem): string | null {
  if (item.kind !== "hotel" || !item.offerKey) return null;
  try {
    const key: unknown = JSON.parse(item.offerKey);
    return Array.isArray(key) && key.length === 2 && key[0] === "hotel-token"
      && typeof key[1] === "string" && key[1].trim().length > 0 && key[1].length <= 512 ? key[1].trim() : null;
  } catch { return null; }
}

/** Price, links, ordering and retrieval time cannot create a different offer. */
export function researchIdentity(item: ProductSearchItem): string {
  const propertyToken = hotelPropertyToken(item);
  const legacyIdentity = item.kind === "flight"
    ? [normalized(item.title), normalized(item.detail ?? "")]
    : [normalized(item.title)];
  return JSON.stringify([
    item.kind, propertyToken ? ["hotel-token", propertyToken] : item.offerKey || legacyIdentity, item.source,
    // The actual provider property is the same across airport/city queries.
    // Name-only and legacy evidence still need their original search geography.
    ...(propertyToken ? [] : [normalized(item.origin ?? ""), normalized(item.destination)]),
    item.departureDate, item.returnDate, item.adults,
    [...item.childrenAges].sort((a, b) => a - b),
    item.kind === "flight" ? item.infantSeating ?? "" : "",
  ]);
}

/** Refresh replaces the same offer; different itineraries remain distinct. */
export function mergeResearchHistory(previous: ProductSearchItem[], incoming: ProductSearchItem[], limit = 20): ProductSearchItem[] {
  const offers = new Map<string, ProductSearchItem>();
  for (const item of [...previous, ...incoming]) {
    const identity = researchIdentity(item);
    const existing = offers.get(identity);
    if (!existing) offers.set(identity, item);
    else if (retrievedTime(item) >= retrievedTime(existing)) {
      offers.set(identity, !item.countryCode && existing.countryCode ? { ...item, countryCode: existing.countryCode } : item);
    } else if (!existing.countryCode && item.countryCode) {
      offers.set(identity, { ...existing, countryCode: item.countryCode });
    }
  }
  return [...offers.values()].sort((a, b) => retrievedTime(b) - retrievedTime(a)).slice(0, Math.max(1, Math.min(64, Math.floor(limit))));
}

export function manualResearchEntries(items: ProductSearchItem[], language: "fr" | "en"): DiscoveryEntry[] {
  const fr = language === "fr";
  const dates = new Intl.DateTimeFormat(fr ? "fr-CA" : "en-CA", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const formatDate = (value: string) => {
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(date.getTime()) ? dates.format(date) : value;
  };
  return items.map((item) => {
    const amount = item.price ? new Intl.NumberFormat(fr ? "fr-CA" : "en-CA", { style: "currency", currency: item.price.currency, currencyDisplay: "code", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(item.price.amount) : undefined;
    const unit = item.price?.unit === "night" ? (fr ? " / nuit" : " / night") : item.price?.unit === "stay" ? (fr ? " · séjour" : " · stay") : "";
    const adults = `${item.adults} ${fr ? (item.adults === 1 ? "adulte" : "adultes") : (item.adults === 1 ? "adult" : "adults")}`;
    const children = item.childrenAges.length ? ` · ${item.childrenAges.length} ${fr ? "enfant(s)" : "child(ren)"}` : "";
    const infantSeat = item.kind !== "flight" ? "" : item.infantSeating === "lap" ? (fr ? " · bébé sur les genoux" : " · infant on lap")
      : item.infantSeating === "seat" ? (fr ? " · siège enfant" : " · infant seat") : "";
    return {
      id: `manual:${researchIdentity(item)}`, kind: item.kind, title: item.title,
      detail: item.detail || [item.origin, item.destination].filter(Boolean).join(" → "),
      price: amount ? `${amount}${unit}` : undefined,
      dateLabel: `${formatDate(item.departureDate)} → ${formatDate(item.returnDate)} · ${adults}${children}${infantSeat}${item.kind === "flight" ? (fr ? " · aller-retour" : " · round trip") : ""}`,
      observedAt: item.retrievedAt, countryCode: item.countryCode, url: publicHttpsUrl(item.url), source: item.source,
      ...safeProductMetadata(item),
      ...(typeof item.rating === "number" && Number.isFinite(item.rating) && item.rating >= 0 && item.rating <= 5 ? { rating: item.rating } : {}),
    };
  });
}
