import { resolveDestination } from "../suggestions/destinations.ts";
import { flightOfferImage } from "../discovery/flight-image.ts";
import type { SerpApiClient } from "../suggestions/serpapi.ts";
import { googleHotelImage, googleHotelImages, publicHttpsUrl, safeFlightSegments, safeHotelAmenities } from "./offer-metadata.ts";
// Keep existing adapter/test imports compatible; client projections import the
// lightweight module directly and never include search execution or resolution.
export { googleHotelImage, publicHttpsUrl } from "./offer-metadata.ts";
import type { ProductSearchItem, ProductSearchRequest, ProductSearchResult } from "./types.ts";

type Provider = Pick<SerpApiClient, "googleFlights" | "googleHotels">;
type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
const records = (value: unknown) => Array.isArray(value) ? value.map(record) : [];
const text = (value: unknown, max = 180) => typeof value === "string" ? value.trim().slice(0, max) : "";
const amount = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;

function flightUrl(value: unknown): string | undefined {
  const safe = publicHttpsUrl(value);
  if (!safe) return undefined;
  const hostname = new URL(safe).hostname;
  return hostname === "google.com" || hostname.endsWith(".google.com") ? safe : undefined;
}

function scope(request: ProductSearchRequest, retrievedAt: string) {
  return {
    destination: request.destination!,
    departureDate: request.departureDate!,
    returnDate: request.returnDate!,
    adults: request.adults!,
    childrenAges: request.childrenAges ?? [],
    retrievedAt,
  };
}

export function flightItems(raw: unknown, request: ProductSearchRequest, retrievedAt: string): ProductSearchItem[] {
  const result = record(raw);
  const url = flightUrl(record(result.search_metadata).google_flights_url);
  const countries = [...new Set(records(result.airports).flatMap((airports) => records(airports.arrival))
    .filter((arrival) => text(record(arrival.airport).id).toUpperCase() === request.destination!.toUpperCase())
    .map((arrival) => text(arrival.country_code).toUpperCase()).filter((code) => /^[A-Z]{2}$/.test(code)))];
  const countryCode = countries.length === 1 ? countries[0] : undefined;
  const seen = new Set<string>();
  return [...records(result.best_flights), ...records(result.other_flights)].flatMap((flight, index) => {
    const legs = records(flight.flights);
    if (!legs.length) return [];
    const airlines = [...new Set(legs.map((leg) => text(leg.airline)).filter(Boolean))].join(" + ");
    const image = flightOfferImage(flight.airline_logo) ?? flightOfferImage(legs[0]?.airline_logo);
    const segments = safeFlightSegments(legs.map((leg) => ({
      airline: leg.airline, flightNumber: leg.flight_number,
      from: record(leg.departure_airport).id, to: record(leg.arrival_airport).id,
      departureTime: record(leg.departure_airport).time, arrivalTime: record(leg.arrival_airport).time,
      durationMinutes: leg.duration,
    })));
    const names = legs.map((leg) => text(leg.flight_number)).filter(Boolean).join(" / ");
    const price = amount(flight.price);
    const identity = JSON.stringify([names, legs.map((leg) => record(leg.departure_airport).time), airlines, price]);
    if (seen.has(identity)) return [];
    seen.add(identity);
    const duration = amount(flight.total_duration);
    const en = request.language === "en";
    const stops = legs.length - 1;
    const detail = [
      `${request.origin!.toUpperCase()} → ${request.destination!.toUpperCase()}`,
      duration ? `${Math.floor(duration / 60)} h ${Math.round(duration % 60)} min` : null,
      stops === 0 ? (en ? "Direct" : "Direct") : `${stops} ${en ? "stop(s)" : "escale(s)"}`,
      names || null,
    ].filter(Boolean).join(" · ");
    return [{
      ...scope(request, retrievedAt), destination: request.destination!.toUpperCase(), origin: request.origin!.toUpperCase(), countryCode,
      ...(request.infantSeating ? { infantSeating: request.infantSeating } : {}),
      id: `flight-${index}`, kind: "flight" as const,
      offerKey: JSON.stringify(["flight", legs.map((leg) => [
        text(leg.airline, 100), text(leg.flight_number, 40),
        text(record(leg.departure_airport).id, 20), text(record(leg.departure_airport).time, 40),
        text(record(leg.arrival_airport).id, 20), text(record(leg.arrival_airport).time, 40),
      ])]),
      title: airlines || (en ? "Flight itinerary" : "Itinéraire de vol"), detail,
      ...(price !== undefined ? { price: { amount: price, currency: "CAD" as const, unit: "round-trip" as const } } : {}),
      image, ...(segments.length ? { segments } : {}), url, source: "Google Flights via SerpAPI" as const,
    }];
  }).slice(0, 6);
}

export function hotelItems(raw: unknown, request: ProductSearchRequest, retrievedAt: string): ProductSearchItem[] {
  const result = record(raw);
  const properties = Array.isArray(result.properties) ? records(result.properties) : text(result.name) ? [result] : [];
  const seen = new Set<string>();
  return properties.flatMap((property, index) => {
    const name = text(property.name);
    if (!name || seen.has(name.toLowerCase())) return [];
    seen.add(name.toLowerCase());
    const nightly = amount(record(property.rate_per_night).extracted_lowest);
    const stay = amount(record(property.total_rate).extracted_lowest);
    const price = nightly ?? stay;
    const stars = text(property.hotel_class, 80);
    const amenities = safeHotelAmenities(property.amenities);
    const rating = typeof property.overall_rating === "number" && Number.isFinite(property.overall_rating) && property.overall_rating >= 0 && property.overall_rating <= 5 ? property.overall_rating : undefined;
    const images = googleHotelImages(records(property.images).map((photo) => googleHotelImage(photo.original_image) ?? googleHotelImage(photo.thumbnail)));
    const image = images[0];
    return [{
      ...scope(request, retrievedAt), id: `hotel-${index}`, kind: "hotel" as const, title: name,
      offerKey: JSON.stringify(text(property.property_token, 512)
        ? ["hotel-token", text(property.property_token, 512)]
        : ["hotel-name", name.normalize("NFKC").toLowerCase()]),
      detail: [stars, ...amenities.slice(0, 2)].filter(Boolean).join(" · ") || undefined,
      ...(price !== undefined ? { price: { amount: price, currency: "CAD" as const, unit: nightly !== undefined ? "night" as const : "stay" as const } } : {}),
      rating, image, ...(images.length ? { images } : {}), ...(stars ? { hotelClass: stars } : {}),
      ...(amenities.length ? { amenities } : {}), url: publicHttpsUrl(property.link), source: "Google Hotels via SerpAPI" as const,
    }];
  }).slice(0, 6);
}

/** Explicit advisor search; does not read, write or invent a TripBrief. */
export async function executeProductSearch(request: ProductSearchRequest, provider: Provider, now = new Date(), clock = () => new Date()): Promise<ProductSearchResult> {
  const generatedAt = now.toISOString();
  const en = request.language === "en";
  let searchesUsed = 0;
  let failedSearches = 0;
  const warnings: string[] = [];
  const jobs: Promise<ProductSearchItem[]>[] = [];
  if (request.kind !== "hotels") {
    const ages = request.childrenAges ?? [];
    const infants = ages.filter((age) => age < 2).length;
    jobs.push((async () => {
      searchesUsed++;
      try {
        const raw = await provider.googleFlights({
          departure_id: request.origin!.toUpperCase(), arrival_id: request.destination!.toUpperCase(),
          outbound_date: request.departureDate!, return_date: request.returnDate!, type: 1,
          adults: request.adults!, children: ages.filter((age) => age >= 2).length || undefined,
          infants_in_seat: request.infantSeating === "seat" ? infants || undefined : undefined,
          infants_on_lap: request.infantSeating === "lap" ? infants || undefined : undefined,
          max_price: request.kind === "flights" ? request.maxPrice : undefined,
        });
        return flightItems(raw, request, clock().toISOString());
      } catch {
        failedSearches++;
        warnings.push(en ? "Flight prices could not be retrieved. Try refreshing." : "Les tarifs de vol sont indisponibles. Réessayez avec Actualiser.");
        return [];
      }
    })());
  }
  if (request.kind !== "flights") {
    jobs.push((async () => {
      searchesUsed++;
      try {
        // A code supplied by the advisor is mapped to an existing known label;
        // no autocomplete, inferred airport, or extra paid resolution call.
        const local = request.kind === "trips" ? resolveDestination(request.destination!).find((place) => place.iata === request.destination!.toUpperCase()) : null;
        const place = local && !local.aConfirmer ? local.hotelsQ : request.kind === "trips" ? "" : request.destination!;
        const raw = await provider.googleHotels({
          q: [request.query, place].filter(Boolean).join(" "), check_in_date: request.departureDate!, check_out_date: request.returnDate!,
          adults: request.adults!, children: request.childrenAges?.length || undefined,
          // Google Hotels treats babies under one as age one; preserve the
          // advisor's actual ages in card scope, only adapt provider syntax.
          children_ages: request.childrenAges?.length ? request.childrenAges.map((age) => Math.max(1, age)).join(",") : undefined,
          max_price: request.kind === "hotels" ? request.maxPrice : undefined,
        });
        return hotelItems(raw, request, clock().toISOString());
      } catch {
        failedSearches++;
        warnings.push(en ? "Hotel prices could not be retrieved. Try refreshing." : "Les tarifs d’hébergement sont indisponibles. Réessayez avec Actualiser.");
        return [];
      }
    })());
  }
  const items = (await Promise.all(jobs)).flat();
  if (failedSearches === searchesUsed || (failedSearches > 0 && items.length === 0)) throw new Error("Product providers unavailable");
  if (request.kind === "trips") warnings.push(en ? "Flights and stays are separate price references, not a package quote." : "Vols et hébergements sont des repères séparés, pas un tarif forfaitaire.");
  if (items.some((item) => item.kind === "hotel" && item.price)) warnings.push(en ? "Hotel prices are references; taxes, room availability and final booking price need verification." : "Tarifs d’hôtel indicatifs : taxes, chambres disponibles et prix de réservation à vérifier.");
  return { status: "ready", items, clarifications: [], warnings, generatedAt, searchesUsed };
}
