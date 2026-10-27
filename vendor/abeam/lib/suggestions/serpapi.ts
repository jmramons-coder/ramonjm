/**
 * Client SerpAPI minimal — moteurs vérifiés (cartographie §10).
 * Compteur de requêtes intégré (plafond anti-emballement, règles de curation §5).
 * Imports relatifs volontaires (utilisable par les scripts Node).
 */

const BASE = "https://serpapi.com/search.json";

export class SerpApiClient {
  private used = 0;
  private apiKey: string;
  private maxSearches: number;

  constructor(apiKey: string, maxSearches = 15) {
    this.apiKey = apiKey;
    this.maxSearches = maxSearches;
  }

  get searchesUsed() {
    return this.used;
  }

  private async call(params: Record<string, string | number | boolean | undefined>) {
    if (this.used >= this.maxSearches) {
      throw new Error(`Plafond de recherches SerpAPI atteint (${this.maxSearches}).`);
    }
    this.used += 1;
    const url = new URL(BASE);
    url.searchParams.set("api_key", this.apiKey);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: string };
    if (json.error) throw new Error(`SerpAPI ${params.engine}: ${json.error}`);
    if (!res.ok) throw new Error(`SerpAPI ${params.engine}: HTTP ${res.status}`);
    return json;
  }

  googleFlights(p: {
    departure_id: string;
    arrival_id: string;
    outbound_date: string;
    return_date?: string;
    type?: 1 | 2 | 3;
    multi_city_json?: string;
    adults?: number;
    children?: number;
    infants_in_seat?: number;
    infants_on_lap?: number;
    travel_class?: 1 | 2 | 3 | 4;
    stops?: 0 | 1 | 2 | 3;
    max_price?: number;
    include_airlines?: string;
    exclude_conns?: string;
  }) {
    return this.call({ engine: "google_flights", currency: "CAD", hl: "fr", gl: "ca", ...p });
  }

  googleHotels(p: {
    q: string;               // requis même avec property_token (vérifié : sans q → erreur)
    property_token?: string; // fiche exacte d'un établissement (réponse À PLAT, pas properties[])
    check_in_date: string;
    check_out_date: string;
    adults?: number;
    children?: number;
    children_ages?: string;
    hotel_class?: string;
    min_price?: number;
    max_price?: number;
    vacation_rentals?: boolean;
  }) {
    return this.call({ engine: "google_hotels", currency: "CAD", hl: "fr", gl: "ca", ...p });
  }

  hotelPhotos(property_token: string) {
    return this.call({ engine: "google_hotels_photos", property_token });
  }

  /**
   * Repli de résolution — LIEUX & ÉTABLISSEMENTS (cartographie §11).
   * Passer une requête DÉSACCENTUÉE : « Club Med Michès » ne rend aucune entité,
   * « Club Med Miches » rend la fiche avec `property_token` (vérifié en live).
   */
  hotelsAutocomplete(q: string) {
    return this.call({ engine: "google_hotels_autocomplete", q, hl: "fr", gl: "ca" });
  }

  /** Repli de résolution — VILLES → IATA + kgmid de lieu (le vrai déblocage du gate vols). */
  flightsAutocomplete(q: string) {
    return this.call({ engine: "google_flights_autocomplete", q, hl: "fr", gl: "ca" });
  }

  tripadvisorSearch(q: string, ssrc?: "h" | "a" | "e" | "g") {
    return this.call({ engine: "tripadvisor", q, ...(ssrc ? { ssrc } : {}) });
  }

  tripadvisorReviews(place_id: string | number, p?: { sort_by?: string; limit?: number }) {
    return this.call({ engine: "tripadvisor_reviews", place_id, language: "fr", translate: true, ...p });
  }
}
