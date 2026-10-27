import {
  createEmptyTripBrief,
  field,
  type TripBrief,
} from "../lib/extraction/trip-brief.ts";
import type { NotesAgent } from "../lib/notes-agent/types.ts";
import type {
  ProductSearchItem,
  ProductSearchRequest,
} from "../lib/product-search/types.ts";
import type { DiscoveryFeedResult } from "../lib/product-search/feed-types.ts";
import type { FolderJourney } from "../lib/journey/types.ts";
import type { SessionRow } from "../app/workspace/types.ts";
import type { SuggestionCard } from "../lib/suggestions/engine.ts";

export const DEMO_IDS = {
  user: "00000000-0000-4000-8000-000000000001",
  agency: "00000000-0000-4000-8000-000000000002",
  client: "10000000-0000-4000-8000-000000000001",
  trip: "20000000-0000-4000-8000-000000000001",
  session: "30000000-0000-4000-8000-000000000001",
  followUp: "30000000-0000-4000-8000-000000000002",
  otherClient: "10000000-0000-4000-8000-000000000002",
  otherTrip: "20000000-0000-4000-8000-000000000002",
  otherSession: "30000000-0000-4000-8000-000000000003",
} as const;
export const DEMO_NOTICE =
  "Portfolio demo: fictional records and illustrative prices. No live travel provider or AI service is connected.";
export const SAMPLE_PHOTO = "/embed/abeam/auth-coast.webp";
export const demoDate = (offset: number, now = new Date()) =>
  new Date(now.getTime() + offset * 86_400_000).toISOString().slice(0, 10);
export function demoSourceSignature(
  sessions: readonly { id?: unknown; transcript?: unknown; brief?: unknown }[],
): string {
  const text = JSON.stringify(
    sessions.map((row) => [row.id, row.transcript, row.brief]),
  );
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `portfolio-${(hash >>> 0).toString(16)}`;
}
const captured = <T>(value: T, quote: string) =>
  field({ valeur: value, verbatim: quote, confiance: 1, statut: "capte" });

export function demoBrief(destination = "Greece", now = new Date()): TripBrief {
  const brief = createEmptyTripBrief();
  brief.meta.langue = "en";
  brief.voyageurs.adultes = captured(2, "It will be the two of us.");
  brief.voyageurs.enfants_ages = captured([], "Two adults, no children.");
  brief.voyageurs.type_groupe = captured("couple", "The two of us.");
  brief.voyageurs.composition = captured(
    "Two adults",
    "It will be the two of us.",
  );
  brief.voyageurs.nombre_chambres = captured(1, "One room, please.");
  brief.lieu.origine = captured("Montréal", "We will leave from Montréal.");
  brief.lieu.destinations = captured(
    [destination],
    `We are thinking about ${destination}.`,
  );
  brief.lieu.region = captured(
    "europe",
    `We are thinking about ${destination}.`,
  );
  brief.vols.aeroport_depart = captured("YUL", "We will leave from Montréal.");
  brief.temps.depart = {
    valeur: demoDate(120, now),
    verbatim: "We can leave in about four months.",
    precision: "jour",
    confiance: 1,
    statut: "capte",
  };
  brief.temps.retour = {
    valeur: demoDate(130, now),
    verbatim: "We have ten nights.",
    precision: "jour",
    confiance: 1,
    statut: "capte",
  };
  brief.temps.duree = captured("dix_j", "We have ten nights.");
  brief.temps.flexibilite = captured(
    "plus_moins_3j",
    "A few days either way would work.",
  );
  brief.type_voyage.type = captured(
    "a_la_carte",
    "A small hotel and time to explore.",
  );
  brief.type_voyage.composantes = captured(
    ["vol", "hotel"],
    "We need flights and a small hotel.",
  );
  brief.hebergement.type_hebergement = captured(
    "petit_hotel_intime",
    "A small hotel, not a big resort.",
  );
  brief.hebergement.localisation = captured(
    "Near the sea",
    "We would love to stay near the sea.",
  );
  brief.motivation.occasion = captured(
    "anniversaire_couple",
    "It is our anniversary.",
  );
  brief.motivation.motivations = captured(
    ["gastronomie_vins", "repos_deconnexion"],
    "Local food and time to slow down.",
  );
  brief.motivation.ambiance = captured(
    "calme_intime",
    "A relaxed pace, please.",
  );
  brief.budget.total = captured(
    8000,
    "About eight thousand Canadian for both of us.",
  );
  brief.services.elements_importants = captured(
    ["Local food", "Sea views", "A relaxed pace"],
    "Local food, sea views and time to slow down.",
  );
  return brief;
}

export function demoNotes(destination = "Greece"): NotesAgent {
  return {
    version: "portfolio-demo-v1",
    titre: `An anniversary by the sea in ${destination}`,
    cadre: "Fictional sample consultation",
    resume: [
      {
        texte: `Two adults are planning ten nights in ${destination}, departing from Montréal.`,
        champs: [
          "voyageurs.adultes",
          "lieu.destinations",
          "temps.duree",
          "lieu.origine",
        ],
      },
      {
        texte:
          "Their total planning budget is CAD $8,000, with a little flexibility on dates.",
        champs: ["budget.total", "temps.flexibilite"],
      },
    ],
    ce_qui_compte: [
      {
        texte: "A small hotel near the sea, local food and a relaxed pace.",
        champs: [
          "hebergement.type_hebergement",
          "hebergement.localisation",
          "motivation.motivations",
        ],
      },
      {
        texte: "Make the anniversary feel personal, with room to explore.",
        champs: ["motivation.occasion", "motivation.ambiance"],
      },
    ],
    contraintes: [],
    a_clarifier: [
      "Confirm the exact departure dates.",
      "Check the preferred island or neighbourhood.",
      "Discuss travel insurance before booking.",
    ],
    prochaines_etapes: [
      "Prepare two accommodation ideas for review.",
      "Compare the flight options before sending a proposal.",
    ],
  };
}

export function sampleJourney(
  clientId: string,
  tripId: string | null,
  sessionIds: string[],
  now = new Date(),
): FolderJourney {
  return {
    version: 1,
    clientId,
    tripId,
    revision: 1,
    updatedAt: now.toISOString(),
    generatedSourceSignature: "portfolio-demo-v1",
    entries: [
      {
        id: "confirm-dates",
        phase: "before",
        kind: "task",
        title: "Confirm the travel dates",
        detail:
          "Review the preferred dates together before researching availability.",
        done: false,
        origin: "manual",
        sourceSessionIds: sessionIds,
      },
      {
        id: "review-shortlist",
        phase: "before",
        kind: "task",
        title: "Review the shortlist",
        detail: "Compare two small hotels and the separate flight options.",
        done: false,
        origin: "manual",
        sourceSessionIds: sessionIds,
      },
      {
        id: "coastal-arrival",
        phase: "during",
        kind: "moment",
        title: "A slow first afternoon",
        detail: "Leave time to settle in and explore the waterfront.",
        dayLabel: "Day 1",
        done: false,
        origin: "manual",
        sourceSessionIds: sessionIds,
      },
      {
        id: "local-table",
        phase: "during",
        kind: "moment",
        title: "Make room for local food",
        detail: "Ask the hotel for a neighbourhood recommendation.",
        dayLabel: "Day 3",
        done: false,
        origin: "manual",
        sourceSessionIds: sessionIds,
      },
      {
        id: "welcome-home",
        phase: "after",
        kind: "task",
        title: "Welcome them home",
        detail:
          "Ask what they loved and save the useful preferences for next time.",
        done: false,
        origin: "manual",
        sourceSessionIds: sessionIds,
      },
    ],
  };
}

/** Every offer is authored sample data; its geography always follows the submitted scope. */
export function sampleOffers(
  request: ProductSearchRequest,
  now = new Date(),
): ProductSearchItem[] {
  const departureDate = request.departureDate ?? demoDate(45, now);
  const returnDate = request.returnDate ?? demoDate(55, now);
  const destination = request.destination ?? "BCN";
  const origin = request.origin ?? "YUL";
  const common = {
    destination,
    origin,
    departureDate,
    returnDate,
    adults: request.adults ?? 2,
    childrenAges: request.childrenAges ?? [],
    ...(request.infantSeating ? { infantSeating: request.infantSeating } : {}),
    retrievedAt: now.toISOString(),
    source: "Portfolio demo · sample offers" as const,
  };
  const flights: ProductSearchItem[] = [
    {
      ...common,
      id: `demo-flight-${origin}-${destination}-1`,
      kind: "flight",
      title: "Sample Air · Direct",
      detail: "Illustrative return fare · not bookable",
      price: { amount: 985, currency: "CAD", unit: "round-trip" },
      segments: [
        {
          airline: "Sample Air",
          flightNumber: "DEMO 101",
          from: origin,
          to: destination,
          departureTime: `${departureDate} 19:30`,
          arrivalTime: `${demoDate(1, new Date(departureDate))} 08:45`,
          durationMinutes: 435,
        },
      ],
    },
    {
      ...common,
      id: `demo-flight-${origin}-${destination}-2`,
      kind: "flight",
      title: "Sample Air · One stop",
      detail: "Illustrative return fare · not bookable",
      price: { amount: 845, currency: "CAD", unit: "round-trip" },
      segments: [
        {
          airline: "Sample Air",
          flightNumber: "DEMO 202",
          from: origin,
          to: destination,
          departureTime: `${departureDate} 17:10`,
          arrivalTime: `${demoDate(1, new Date(departureDate))} 09:30`,
          durationMinutes: 620,
        },
      ],
    },
  ];
  const hotels: ProductSearchItem[] = [
    {
      ...common,
      id: `demo-hotel-${destination}-1`,
      kind: "hotel",
      title: `${request.query || "Coastal House"} · Sample stay`,
      detail: "Fictional property · illustrative destination photo",
      price: { amount: 245, currency: "CAD", unit: "night" },
      image: SAMPLE_PHOTO,
      images: [SAMPLE_PHOTO],
      hotelClass: "4-star sample",
      amenities: ["Wi-Fi", "Breakfast", "Sea view"],
    },
    {
      ...common,
      id: `demo-hotel-${destination}-2`,
      kind: "hotel",
      title: "Garden Studio · Sample stay",
      detail: "Fictional property · illustrative destination photo",
      price: { amount: 190, currency: "CAD", unit: "night" },
      image: SAMPLE_PHOTO,
      images: [SAMPLE_PHOTO],
      amenities: ["Wi-Fi", "Kitchenette", "Terrace"],
    },
  ];
  return (
    request.kind === "flights"
      ? flights
      : request.kind === "hotels"
        ? hotels
        : [...flights, ...hotels]
  ).filter(
    (item) =>
      !request.maxPrice || !item.price || item.price.amount <= request.maxPrice,
  );
}

export function sampleFeed(now = new Date()): DiscoveryFeedResult {
  const request: ProductSearchRequest = {
    kind: "trips",
    language: "en",
    origin: "YUL",
    destination: "BCN",
    adults: 2,
    childrenAges: [],
    departureDate: demoDate(45, now),
    returnDate: demoDate(55, now),
  };
  return {
    status: "ready",
    stale: false,
    automaticAttemptedToday: true,
    day: now.toISOString().slice(0, 10),
    refreshedAt: now.toISOString(),
    warnings: [DEMO_NOTICE],
    searchesUsed: 0,
    editorialScopes: [
      {
        id: "demo-barcelona",
        origin: "YUL",
        originLabel: "Montréal",
        destination: "BCN",
        destinationLabel: "Barcelona",
        countryCode: "ES",
        departureDate: request.departureDate!,
        returnDate: request.returnDate!,
        adults: 2,
        childrenAges: [],
        basis: "editorial-example",
        retrievedAt: now.toISOString(),
      },
    ],
    items: sampleOffers(request, now).map((item) => ({
      ...item,
      countryCode: "ES",
      editorialScopeId: "demo-barcelona",
    })),
  };
}

/** Authored, unbookable examples inside the original conversation resource cards. */
export function sampleConversationCards(
  now = new Date(),
  destination = "Greece",
): SuggestionCard[] {
  if (!/greece|athens|portugal|lisbon|barcelona|spain/i.test(destination))
    return [];
  const airport = /portugal|lisbon/i.test(destination)
    ? "LIS"
    : /barcelona|spain/i.test(destination)
      ? "BCN"
      : "ATH";
  const city =
    airport === "LIS" ? "Lisbon" : airport === "BCN" ? "Barcelona" : "Athens";
  return sampleOffers(
    {
      kind: "trips",
      language: "en",
      origin: "YUL",
      destination: airport,
      adults: 2,
      departureDate: demoDate(120, now),
      returnDate: demoDate(130, now),
    },
    now,
  ).map((offer) => ({
    id: `conversation-${offer.id}`,
    type: offer.kind === "flight" ? "vols" : "hotels",
    audience: "client",
    priorite: 2,
    titre:
      offer.kind === "flight"
        ? `Montréal → ${city} · ${offer.title.replace("Sample Air · ", "")}`
        : `${offer.title} · ${destination}`,
    sousTitre: "Fictional sample · not bookable",
    badge: "Portfolio sample",
    source: "Portfolio sample",
    items: [
      {
        titre: offer.title,
        detail: offer.detail,
        prix: `CAD $${offer.price?.amount} / ${offer.price?.unit === "night" ? "night" : "return"}`,
        ...(offer.image ? { image: offer.image, images: offer.images } : {}),
        ...(offer.segments ? { segments: offer.segments } : {}),
      },
    ],
  }));
}

export function createDemoSeed(
  now = new Date(),
): Record<string, Record<string, unknown>[]> {
  const recent = (days: number) =>
    new Date(now.getTime() - days * 86_400_000).toISOString();
  const session = (
    id: string,
    clientId: string,
    tripId: string,
    client: string,
    destination: string,
    daysAgo: number,
  ): SessionRow & { owner_id: string } => ({
    id,
    owner_id: DEMO_IDS.user,
    client_id: clientId,
    trip_id: tripId,
    client_name: client,
    client_email:
      clientId === DEMO_IDS.client
        ? "maya.alex@example.test"
        : "nora@example.test",
    trip_title: `Anniversary in ${destination}`,
    created_at: recent(daysAgo),
    updated_at: recent(daysAgo),
    duration: 462,
    capture_mode: "microphone",
    consent: true,
    status: "prete",
    audio_ref: null,
    nature_conversation: "planification",
    brief: demoBrief(destination, now),
    notes_agent: demoNotes(destination),
    client_subject: `Your ${destination} ideas`,
    client_summary: `Hi ${client},\n\nWe discussed ten nights in ${destination}, with local food, sea views and a relaxed pace. The planning budget is CAD $8,000 for two adults.\n\nPlease confirm your preferred dates and neighbourhood so we can review a shortlist together.\n\nWarmly,\nYour travel advisor\n\nPortfolio demo draft — no email is sent.`,
    transcript: [
      {
        id: `${id}-1`,
        speaker: "Client",
        time: 0,
        startMs: 0,
        text: `We are thinking about ${destination}. It is our anniversary.`,
      },
      {
        id: `${id}-2`,
        speaker: "Advisor",
        time: 24,
        startMs: 24000,
        text: "What would make the trip feel right for you?",
      },
      {
        id: `${id}-3`,
        speaker: "Client",
        time: 38,
        startMs: 38000,
        text: "Local food, sea views and time to slow down. We have ten nights.",
      },
      {
        id: `${id}-4`,
        speaker: "Client",
        time: 74,
        startMs: 74000,
        text: "About eight thousand Canadian for both of us. We will leave from Montréal.",
      },
      {
        id: `${id}-5`,
        speaker: "Advisor",
        time: 110,
        startMs: 110000,
        text: "I will prepare two accommodation ideas. We will confirm your dates before comparing flights.",
      },
    ],
    passes: {
      conversation_bookmarks_v1: sampleConversationCards(
        now,
        destination,
      ).slice(0, 2),
    },
    suggestions: {
      cards: sampleConversationCards(now, destination),
      nudges: [],
      searchesUsed: 0,
      warnings: [DEMO_NOTICE],
    },
  });
  const sessions = [
    session(
      DEMO_IDS.session,
      DEMO_IDS.client,
      DEMO_IDS.trip,
      "Maya & Alex",
      "Greece",
      2,
    ),
    session(
      DEMO_IDS.followUp,
      DEMO_IDS.client,
      DEMO_IDS.trip,
      "Maya & Alex",
      "Greece",
      1,
    ),
    session(
      DEMO_IDS.otherSession,
      DEMO_IDS.otherClient,
      DEMO_IDS.otherTrip,
      "Nora Patel",
      "Portugal",
      4,
    ),
  ];
  sessions[2].trip_title = "Anniversary in Portugal";
  sessions[1].transcript = [
    {
      id: "followup-1",
      speaker: "Client",
      time: 0,
      text: "The small hotel idea sounds lovely. Could we leave a few days later?",
    },
    {
      id: "followup-2",
      speaker: "Advisor",
      time: 35,
      text: "Yes. We will confirm the dates before we compare availability.",
    },
  ];
  sessions[1].passes = {
    ...(sessions[1].passes as object),
    folder_journey_v1: {
      ...sampleJourney(
        DEMO_IDS.client,
        DEMO_IDS.trip,
        [DEMO_IDS.session, DEMO_IDS.followUp],
        now,
      ),
      generatedSourceSignature: demoSourceSignature([sessions[1], sessions[0]]),
    },
  };
  return {
    profiles: [
      {
        id: DEMO_IDS.user,
        email: "advisor@example.test",
        display_name: "Alex Morgan",
        agency_id: DEMO_IDS.agency,
        language: "en",
      },
    ],
    agencies: [{ id: DEMO_IDS.agency, name: "Sample Travel Studio" }],
    clients: [
      {
        id: DEMO_IDS.client,
        agency_id: DEMO_IDS.agency,
        name: "Maya & Alex",
        email: "maya.alex@example.test",
        phone: null,
        notes:
          "Fictional portfolio clients. Local food, small hotels and an unhurried pace.",
        is_placeholder: false,
        created_at: recent(8),
        updated_at: recent(1),
      },
      {
        id: DEMO_IDS.otherClient,
        agency_id: DEMO_IDS.agency,
        name: "Nora Patel",
        email: "nora@example.test",
        phone: null,
        notes:
          "Fictional portfolio client. Architecture and neighbourhood walks.",
        is_placeholder: false,
        created_at: recent(12),
        updated_at: recent(4),
      },
    ],
    trips: [
      {
        id: DEMO_IDS.trip,
        client_id: DEMO_IDS.client,
        title: "Anniversary in Greece",
        status: "active",
        created_at: recent(8),
        updated_at: recent(1),
      },
      {
        id: DEMO_IDS.otherTrip,
        client_id: DEMO_IDS.otherClient,
        title: "Anniversary in Portugal",
        status: "active",
        created_at: recent(12),
        updated_at: recent(4),
      },
    ],
    sessions: sessions.map((row) => ({ ...row })),
    session_events: [],
  };
}
