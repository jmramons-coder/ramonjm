import { flightOfferImage } from "../discovery/flight-image.ts";
import type { ProductSearchFlightSegment, ProductSearchItem } from "./types.ts";

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
const text = (value: unknown, max = 180) => typeof value === "string" ? value.trim().slice(0, max) : "";

/** Provider links are evidence, not HTML or privileged SerpAPI endpoints. */
export function publicHttpsUrl(value: unknown): string | undefined {
  if (value === "/embed/abeam/auth-coast.webp") return value;
  if (typeof value !== "string" || value.length > 2000) return undefined;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password || url.port
      || hostname === "localhost" || !hostname.includes(".") || hostname.endsWith(".local")
      || /^[\d.]+$/.test(hostname) || hostname.includes(":")
      || hostname === "serpapi.com" || hostname.endsWith(".serpapi.com")
      || [...url.searchParams.keys()].some((key) => /^(api[_-]?key|access[_-]?token)$/i.test(key))) return undefined;
    return url.href;
  } catch { return undefined; }
}

/** Reuse returned Google hotel photos; never fetch a separate photo engine. */
export function googleHotelImage(value: unknown): string | undefined {
  // Bundled destination art for the isolated portfolio's fictional offers.
  if (value === "/embed/abeam/auth-coast.webp") return value;
  const safe = publicHttpsUrl(value);
  if (!safe) return undefined;
  const hostname = new URL(safe).hostname.toLowerCase();
  return hostname === "googleusercontent.com" || hostname.endsWith(".googleusercontent.com") ? safe : undefined;
}

/** Different Google size directives are views of one photo, not gallery entries. */
function hotelPhotoIdentity(value: string): string {
  if (value === "/embed/abeam/auth-coast.webp") return value;
  const url = new URL(value);
  url.hostname = url.hostname.replace(/^lh\d+\./, "lh.");
  url.pathname = url.pathname.replace(/=(?:s\d+|w\d+(?:-h\d+)?|h\d+(?:-w\d+)?)(?:-[a-z\d]+)*$/i, "");
  for (const key of ["w", "h", "width", "height", "s", "sz"]) url.searchParams.delete(key);
  url.hash = "";
  return url.href;
}

export function googleHotelImages(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const photos: string[] = [];
  const seen = new Set<string>();
  for (const value of values.slice(0, 100)) {
    const photo = googleHotelImage(value);
    if (!photo) continue;
    const identity = hotelPhotoIdentity(photo);
    if (seen.has(identity)) continue;
    seen.add(identity);
    photos.push(photo);
    if (photos.length === 6) break;
  }
  return photos;
}

function returnedStrings(value: unknown, limit: number, length: number): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of value.slice(0, 100)) {
    const entry = text(raw, length);
    const key = entry.normalize("NFKC").toLowerCase();
    if (!entry || seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
    if (result.length === limit) break;
  }
  return result;
}

function returnedFlightTime(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 40) return undefined;
  const time = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:[01]\d|2[0-3]):?[0-5]\d)?$/.exec(time);
  if (!match) return undefined;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? time : undefined;
}

/** Shared by provider mapping, persisted-cache reads and browser-feed projection. */
export function safeFlightSegments(value: unknown): ProductSearchFlightSegment[] {
  if (!Array.isArray(value)) return [];
  const segments: ProductSearchFlightSegment[] = [];
  for (const raw of value.slice(0, 32)) {
    const leg = record(raw);
    const airport = (code: unknown) => typeof code === "string" && /^[A-Z]{3}$/.test(code.trim().toUpperCase()) ? code.trim().toUpperCase() : undefined;
    const segment: ProductSearchFlightSegment = {
      airline: text(leg.airline, 100) || undefined,
      flightNumber: text(leg.flightNumber, 40) || undefined,
      from: airport(leg.from), to: airport(leg.to),
      departureTime: returnedFlightTime(leg.departureTime), arrivalTime: returnedFlightTime(leg.arrivalTime),
      durationMinutes: typeof leg.durationMinutes === "number" && Number.isFinite(leg.durationMinutes)
        && leg.durationMinutes >= 0 && leg.durationMinutes <= 2880 ? leg.durationMinutes : undefined,
    };
    if (!Object.values(segment).some((field) => field !== undefined)) continue;
    segments.push(segment);
    if (segments.length === 8) break;
  }
  return segments;
}

export function safeHotelAmenities(value: unknown): string[] {
  return returnedStrings(value, 8, 100);
}

export function safeProductMetadata(value: unknown): Pick<ProductSearchItem, "image" | "images" | "hotelClass" | "amenities" | "segments"> {
  const item = record(value);
  if (item.kind === "hotel") {
    const legacyPhoto = googleHotelImage(item.image);
    const images = googleHotelImages([legacyPhoto, ...(Array.isArray(item.images) ? item.images : [])]);
    const amenities = safeHotelAmenities(item.amenities);
    const hotelClass = text(item.hotelClass, 80) || undefined;
    return { image: legacyPhoto ?? images[0], ...(images.length ? { images } : {}),
      ...(hotelClass ? { hotelClass } : {}), ...(amenities.length ? { amenities } : {}) };
  }
  if (item.kind === "flight") {
    const segments = safeFlightSegments(item.segments);
    return { image: flightOfferImage(item.image), ...(segments.length ? { segments } : {}) };
  }
  return {};
}
