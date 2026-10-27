import { z } from "zod";
import { resolveDestination } from "../suggestions/destinations.ts";
import { PRODUCT_SEARCH_LIMITS as limits } from "./constraints.ts";
import type { ProductSearchClarification, ProductSearchRequest } from "./types.ts";

const text = (max: number) => z.string().trim().max(max).transform((value) => value || undefined).optional();
const schema = z.object({
  kind: z.enum(["flights", "hotels", "trips"]),
  language: z.enum(["fr", "en"]).default("fr"),
  query: text(limits.queryLength),
  origin: text(limits.originLength),
  destination: text(limits.destinationLength),
  departureDate: text(limits.dateLength),
  returnDate: text(limits.dateLength),
  adults: z.number().int().min(limits.minAdults).max(limits.maxAdults).optional(),
  childrenAges: z.array(z.number().int().min(limits.minChildAge).max(limits.maxChildAge)).max(limits.maxChildren).optional(),
  infantSeating: z.enum(["lap", "seat"]).optional(),
  maxPrice: z.number().finite().positive().max(limits.maxPrice).optional(),
}).strict();

export function parseProductSearchRequest(input: unknown):
  | { ok: true; request: ProductSearchRequest }
  | { ok: false; error: string } {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const en = input && typeof input === "object" && "language" in input && input.language === "en";
    return { ok: false, error: en ? "Check the search fields, traveller ages and amounts." : "Vérifiez les champs, les âges des voyageurs et les montants." };
  }
  return { ok: true, request: parsed.data };
}

function calendarDate(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const ms = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value ? ms : null;
}

/** No provider calls until the advisor supplies a complete, explicit scope. */
export function productSearchClarifications(request: ProductSearchRequest, now = new Date()): ProductSearchClarification[] {
  const en = request.language === "en";
  const missing: ProductSearchClarification[] = [];
  const add = (field: ProductSearchClarification["field"], fr: string, english: string) => missing.push({ field, message: en ? english : fr });
  const flights = request.kind !== "hotels";
  if (flights) {
    if (!request.origin || !/^[A-Z]{3}$/i.test(request.origin)) add("origin", "Choisissez l’aéroport de départ avec son code à trois lettres (ex. YUL).", "Choose the departure airport using its three-letter code (e.g. YUL).");
    if (!request.destination || !/^[A-Z]{3}$/i.test(request.destination)) add("destination", "Choisissez l’aéroport d’arrivée avec son code à trois lettres (ex. CUN).", "Choose the arrival airport using its three-letter code (e.g. CUN).");
    if (request.origin && request.destination && request.origin.toUpperCase() === request.destination.toUpperCase()) add("destination", "L’arrivée doit être différente du départ.", "Arrival must differ from departure.");
  } else if (!request.destination) {
    add("destination", "Précisez la ville ou la région où chercher l’hébergement.", "Enter the city or region for the stay.");
  }
  if (request.kind === "trips" && request.destination && /^[A-Z]{3}$/i.test(request.destination) && !request.query
    && !resolveDestination(request.destination).some((place) => place.iata === request.destination!.toUpperCase() && !place.aConfirmer)) {
    add("query", "Précisez aussi la ville ou l’hébergement : ce code d’aéroport n’a pas de lieu hôtelier confirmé.", "Also enter the city or hotel: this airport code has no confirmed hotel area.");
  }
  if (request.kind === "trips" && request.maxPrice !== undefined) add("maxPrice", "Un plafond de forfait ne peut pas filtrer des offres séparées. Recherchez les vols ou hôtels avec leur propre plafond.", "A package maximum cannot filter separate offers. Search flights or hotels with their own limit.");

  const today = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  const departure = request.departureDate ? calendarDate(request.departureDate) : null;
  const returning = request.returnDate ? calendarDate(request.returnDate) : null;
  for (const [field, value] of [["departureDate", departure], ["returnDate", returning]] as const) {
    if (value === null) add(field, "Précisez une date complète et valide (année, mois, jour).", "Enter a complete valid date (year, month and day).");
    else if (value < today || value > today + limits.maxFutureDays * 86_400_000) add(field, "Choisissez une date à venir dans les deux prochaines années.", "Choose an upcoming date within the next two years.");
  }
  if (departure !== null && returning !== null && returning <= departure) add("returnDate", "Le retour doit être après le départ.", "Return must be after departure.");
  if (request.adults === undefined) add("adults", "Précisez le nombre d’adultes pour comparer les bons tarifs.", "Enter the adult count to compare the right fares.");
  if (flights && request.adults !== undefined && request.adults + (request.childrenAges?.length ?? 0) > limits.maxFlightTravellers) add("adults", "La recherche de vols accepte jusqu’à neuf voyageurs à la fois.", "Flight searches support up to nine travellers at a time.");
  const infants = (request.childrenAges ?? []).filter((age) => age < 2).length;
  if (flights && infants && !request.infantSeating) add("infantSeating", "Précisez si les bébés voyagent sur les genoux ou dans un siège.", "Specify whether infants travel on a lap or in a seat.");
  if (flights && request.infantSeating === "lap" && request.adults !== undefined && infants > request.adults) add("infantSeating", "Un adulte doit accompagner chaque bébé sur les genoux.", "Each lap infant needs an accompanying adult.");
  return missing;
}

export const productSearchCost = (request: ProductSearchRequest) => request.kind === "trips" ? 2 : 1;
