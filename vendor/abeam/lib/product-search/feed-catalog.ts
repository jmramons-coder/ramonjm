import type { EditorialSearchScope } from "./feed-types.ts";
import type { ProductSearchRequest } from "./types.ts";

// A small, published inspiration rotation. These are search examples, not
// destinations or dates attributed to any customer or inferred from a folder.
const CATALOG = [
  { id: "cancun", destination: "CUN", destinationLabel: "Cancún", countryCode: "MX" },
  { id: "lisbon", destination: "LIS", destinationLabel: "Lisbonne", countryCode: "PT" },
  { id: "paris", destination: "CDG", destinationLabel: "Paris", countryCode: "FR" },
  { id: "punta-cana", destination: "PUJ", destinationLabel: "Punta Cana", countryCode: "DO" },
  { id: "rome", destination: "FCO", destinationLabel: "Rome", countryCode: "IT" },
  { id: "barcelona", destination: "BCN", destinationLabel: "Barcelone", countryCode: "ES" },
] as const;

export function editorialSearchScope(sequence: number, now = new Date()): EditorialSearchScope {
  const day = now.toISOString().slice(0, 10);
  const today = Date.parse(`${day}T00:00:00Z`);
  const entry = CATALOG[Math.max(0, Math.floor(sequence)) % CATALOG.length];
  const departureDate = new Date(today + 35 * 86_400_000).toISOString().slice(0, 10);
  const returnDate = new Date(today + 49 * 86_400_000).toISOString().slice(0, 10);
  return {
    ...entry, id: `${entry.id}:${departureDate}:${returnDate}`, origin: "YUL", originLabel: "Montréal",
    departureDate, returnDate, adults: 2, childrenAges: [], basis: "editorial-example", retrievedAt: now.toISOString(),
  };
}

export function editorialSearchRequest(scope: EditorialSearchScope, language: "fr" | "en"): ProductSearchRequest {
  return {
    kind: "trips", language, origin: scope.origin, destination: scope.destination,
    departureDate: scope.departureDate, returnDate: scope.returnDate, adults: scope.adults, childrenAges: [],
  };
}
