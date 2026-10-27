import {
  demoDatabase,
  notifyDemoReset,
  type DemoDatabase,
  type DemoRow,
} from "./database.ts";
import {
  DEMO_NOTICE,
  demoNotes,
  demoSourceSignature,
  sampleFeed,
  sampleJourney,
  sampleOffers,
} from "./fixtures.ts";
import {
  parseFolderJourney,
  parseJourneyEntry,
  type FolderJourney,
} from "../lib/journey/types.ts";
import {
  parseProductSearchRequest,
  productSearchClarifications,
} from "../lib/product-search/validate.ts";

const record = (value: unknown): value is DemoRow =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Portfolio-Demo": "visitor-local",
    },
  });
const failure = (message: string, status = 400, code = "demo_unavailable") =>
  json({ error: message, code, demo: true }, status);
const unavailable = () =>
  failure(
    "This action is unavailable in the portfolio demo. Recording, live AI/provider searches and email delivery are not connected.",
    501,
  );
const assertActive = (request: Request) => {
  if (request.signal.aborted)
    throw new DOMException("Request cancelled", "AbortError");
};
function sessionScope(db: DemoDatabase, sessionId: unknown) {
  const session = db.rows("sessions").find((row) => row.id === sessionId);
  if (!session) return null;
  const sessions = db
    .rows("sessions")
    .filter((row) =>
      session.client_id
        ? row.client_id === session.client_id &&
          (row.trip_id ?? null) === (session.trip_id ?? null)
        : row.id === session.id,
    )
    .sort(
      (a, b) =>
        String(b.created_at).localeCompare(String(a.created_at)) ||
        String(b.id).localeCompare(String(a.id)),
    );
  return {
    session,
    sessions,
    anchor: sessions[0],
    ids: sessions.map((row) => String(row.id)),
  };
}
function notesFor(sessions: DemoRow[]) {
  const latest = sessions[0];
  const notes = record(latest?.notes_agent)
    ? structuredClone(latest.notes_agent)
    : demoNotes("the selected destination");
  return {
    ...notes,
    cadre: "Fictional portfolio sample · prepared locally, without AI",
    ...(sessions.length > 1
      ? {
          titre: "The trip so far",
          resume: [
            {
              texte: `${sessions.length} fictional consultations in this folder. Review the individual briefs and transcripts for each conversation’s details.`,
              champs: [],
            },
          ],
        }
      : {}),
  };
}
async function journey(
  request: Request,
  body: DemoRow,
  db: DemoDatabase,
): Promise<Response> {
  const scope = sessionScope(db, body.sessionId);
  if (!scope || !scope.anchor || typeof scope.session.client_id !== "string")
    return failure("This sample folder is unavailable.", 404, "not_found");
  const signature = demoSourceSignature(scope.sessions);
  const passes = record(scope.anchor.passes) ? scope.anchor.passes : {};
  let saved = parseFolderJourney(passes.folder_journey_v1);
  const source = {
    signature,
    conversationCount: scope.ids.length,
    includedCount: scope.ids.length,
    truncated: false,
  };
  if (body.action === "load")
    return json({ journey: saved, source, anchorSessionId: scope.anchor.id });
  if (body.action !== "save" && body.action !== "generate")
    return failure("Choose a supported journey action.");
  if (body.expectedRevision !== (saved?.revision ?? null))
    return failure(
      "The journey changed. Reload before saving again.",
      409,
      "scope_changed",
    );
  if (body.action === "generate") {
    // This is an explicitly authored planning template, not an AI-generated itinerary.
    const template = sampleJourney(
      String(scope.session.client_id),
      typeof scope.session.trip_id === "string" ? scope.session.trip_id : null,
      scope.ids,
    );
    template.entries = template.entries.map((entry) => ({
      ...entry,
      ...(entry.detail
        ? { detail: `${entry.detail} (Portfolio planning template.)` }
        : {}),
    }));
    saved = {
      ...template,
      revision: (saved?.revision ?? 0) + 1,
      generatedSourceSignature: signature,
    };
  } else {
    if (!saved || !record(body.mutation))
      return failure("Open a journey before editing it.");
    const mutation = body.mutation;
    let entries = saved.entries;
    if (mutation.type === "upsert") {
      const entry = parseJourneyEntry(mutation.entry);
      if (
        !entry ||
        entry.sourceSessionIds.some((id) => !scope.ids.includes(id))
      )
        return failure("Check the step and its conversation scope.");
      entries = entries.some((candidate) => candidate.id === entry.id)
        ? entries.map((candidate) =>
            candidate.id === entry.id ? entry : candidate,
          )
        : [...entries, entry];
      if (entries.length > 60)
        return failure("The sample journey can contain at most 60 steps.");
    } else if (
      (mutation.type === "toggle" || mutation.type === "remove") &&
      typeof mutation.id === "string"
    ) {
      if (!entries.some((entry) => entry.id === mutation.id))
        return failure("This step no longer exists.", 404, "not_found");
      if (mutation.type === "toggle") {
        if (typeof mutation.done !== "boolean")
          return failure("Choose the step’s completion state.");
        entries = entries.map((entry) =>
          entry.id === mutation.id
            ? { ...entry, done: mutation.done as boolean }
            : entry,
        );
      } else entries = entries.filter((entry) => entry.id !== mutation.id);
    } else return failure("This journey edit is unavailable.");
    saved = {
      ...saved,
      entries,
      revision: saved.revision + 1,
      updatedAt: new Date().toISOString(),
    };
  }
  assertActive(request);
  const next: FolderJourney = saved;
  db.transaction((tables) => {
    const anchor = tables.sessions.find((row) => row.id === scope.anchor.id);
    if (!anchor) throw new Error("The folder changed before saving.");
    anchor.passes = {
      ...(record(anchor.passes) ? anchor.passes : {}),
      folder_journey_v1: next,
    };
  });
  return json({
    journey: next,
    source,
    anchorSessionId: scope.anchor.id,
    demo: true,
  });
}
function folderDelete(
  request: Request,
  body: DemoRow,
  db: DemoDatabase,
): Response {
  if (
    body.confirmed !== true ||
    typeof body.clientId !== "string" ||
    (body.tripId !== null && typeof body.tripId !== "string") ||
    !Array.isArray(body.expectedSessionIds) ||
    body.expectedSessionIds.some((id) => typeof id !== "string") ||
    new Set(body.expectedSessionIds).size !== body.expectedSessionIds.length
  )
    return failure(
      "Confirm a valid sample folder before deleting it.",
      400,
      "invalid_request",
    );
  const ids = body.expectedSessionIds as string[];
  const matching = db
    .rows("sessions")
    .filter(
      (row) =>
        row.client_id === body.clientId &&
        (row.trip_id ?? null) === body.tripId,
    );
  const matchingIds = matching.map((row) => String(row.id));
  if (
    matchingIds.some((id) => !ids.includes(id)) ||
    db
      .rows("sessions")
      .some(
        (row) =>
          ids.includes(String(row.id)) && !matchingIds.includes(String(row.id)),
      )
  )
    return failure(
      "The folder changed. Reload it before deleting.",
      409,
      "scope_changed",
    );
  if (
    !db.rows("clients").some((row) => row.id === body.clientId) ||
    (body.tripId &&
      !db
        .rows("trips")
        .some(
          (row) => row.id === body.tripId && row.client_id === body.clientId,
        ))
  )
    return failure("This sample folder is unavailable.", 404, "not_found");
  assertActive(request);
  db.transaction((tables) => {
    tables.sessions = tables.sessions.filter(
      (row) => !matchingIds.includes(String(row.id)),
    );
    if (body.tripId)
      tables.trips = tables.trips.filter((row) => row.id !== body.tripId);
    tables.session_events = tables.session_events.filter(
      (row) => !matchingIds.includes(String(row.session_id)),
    );
  });
  return json({
    result: {
      deletedSessionIds: matchingIds,
      missingSessionIds: ids.filter((id) => !matchingIds.includes(id)),
      skippedSessionIds: [],
      audioCleanupFailures: [],
      detachedSessionIds: [],
      deletedTripId: body.tripId,
      deletedClientId: null,
    },
  });
}

/** Pure request boundary, testable without a browser or service credentials. */
export async function handleDemoRequest(
  request: Request,
  db: DemoDatabase = demoDatabase,
): Promise<Response> {
  assertActive(request);
  const path = new URL(request.url).pathname.replace(/^\/embed\/abeam/, "");
  if (path === "/auth/v1/settings")
    return json({ external: { google: false }, disable_signup: true });
  if (
    path === "/api/discovery-feed" &&
    ["GET", "POST"].includes(request.method)
  )
    return json(sampleFeed());
  if (request.method !== "POST")
    return failure("This demo endpoint only accepts POST requests.", 405);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure("The request must contain valid JSON.");
  }
  assertActive(request);
  if (!record(body)) return failure("The request must contain an object.");
  if (path === "/api/product-search") {
    const parsed = parseProductSearchRequest(body);
    if (!parsed.ok) return failure(parsed.error);
    const clarifications = productSearchClarifications(parsed.request);
    return json({
      status: clarifications.length ? "needs-details" : "ready",
      items: clarifications.length ? [] : sampleOffers(parsed.request),
      clarifications,
      warnings: [DEMO_NOTICE],
      generatedAt: new Date().toISOString(),
      searchesUsed: 0,
      demo: true,
    });
  }
  if (path === "/api/folder-journey") return journey(request, body, db);
  if (path === "/api/folder-delete") return folderDelete(request, body, db);
  if (path === "/api/notes") {
    let sessions: DemoRow[] = [];
    const scope = typeof body.sessionId === "string" ? "session" : "dossier";
    if (scope === "session")
      sessions = db.rows("sessions").filter((row) => row.id === body.sessionId);
    else if (typeof body.folderKey === "string") {
      const [clientId, tripId] = body.folderKey.split("::");
      sessions = db
        .rows("sessions")
        .filter(
          (row) =>
            row.client_id === clientId && (row.trip_id ?? "general") === tripId,
        )
        .sort((a, b) =>
          String(b.created_at).localeCompare(String(a.created_at)),
        );
    }
    if (!sessions.length)
      return failure(
        "No sample conversations are available in this scope.",
        404,
        "not_found",
      );
    return json({
      notes: notesFor(sessions),
      source: {
        portee: scope,
        sessions: sessions.map((row) => row.id),
        conversations: sessions.length,
      },
      demo: true,
    });
  }
  if (path === "/api/recap") {
    const session = db
      .rows("sessions")
      .find((row) => row.id === body.sessionId);
    if (!session)
      return failure(
        "This sample conversation is unavailable.",
        404,
        "not_found",
      );
    return json({
      subject: session.client_subject || "Your travel ideas · sample draft",
      body:
        session.client_summary ||
        "Portfolio sample draft. Review the conversation and add your personal follow-up here. No email will be sent.",
      demo: true,
    });
  }
  if (path === "/api/nudge-chat") {
    if (!Array.isArray(body.messages) || body.messages.length > 20)
      return failure("Enter a question for the sample assistant.");
    const last = body.messages
      .filter(record)
      .filter((message) => message.role === "user")
      .at(-1)?.content;
    if (typeof last !== "string" || !last.trim() || last.length > 8000)
      return failure("Enter a short question for the sample assistant.");
    const session = db
      .rows("sessions")
      .find((row) => row.id === body.session_id);
    const brief = record(session?.brief)
      ? session.brief
      : record(body.brief)
        ? body.brief
        : null;
    const field = (group: string, key: string) => {
      const section = brief && record(brief[group]) ? brief[group] : null;
      const value =
        section && record(section[key]) ? section[key].valeur : undefined;
      return Array.isArray(value)
        ? value.join(", ")
        : typeof value === "string" || typeof value === "number"
          ? String(value)
          : "not yet confirmed";
    };
    const question = last.toLocaleLowerCase();
    let reply =
      "This is a local sample assistant, without live AI or web access. You can review the transcript, edit the client details, compare the illustrative Explorer offers and save a planning step.";
    if (/budget|cost|prix|coût/.test(question))
      reply = `The selected sample brief records a planning budget of CAD $${field("budget", "total")}. Confirm what it covers with the client before comparing individual fares.`;
    else if (/date|when|quand/.test(question))
      reply = `The selected sample brief records ${field("temps", "depart")} to ${field("temps", "retour")}. These are fictional planning dates; no availability has been checked.`;
    else if (/next|question|clarif|suivant|missing|manqu/.test(question))
      reply =
        "Confirm the exact travel dates, the preferred neighbourhood or island, and the accommodation priorities. Then review the illustrative shortlist together; all offers in this preview are fictional.";
    else if (/summari|summary|résum|resume|destination|where|où/.test(question))
      reply = `The sample destination is ${field("lieu", "destinations")}, departing from ${field("lieu", "origine")}, for ${field("voyageurs", "adultes")} adults. Read the saved brief and transcript for the recorded preferences.`;
    return json({
      reply: `Portfolio demo · ${reply}`,
      searchesUsed: 0,
      demo: true,
    });
  }
  return unavailable();
}

/** Iframe-local fetch replacement. External requests and unknown APIs never reach production. */
export function createDemoFetch(
  fallback: typeof fetch,
  origin: string,
  db = demoDatabase,
): typeof fetch {
  return async (input, init) => {
    const request =
      input instanceof Request
        ? new Request(input, init)
        : new Request(new URL(String(input), origin), init);
    assertActive(request);
    const url = new URL(request.url);
    if (url.origin !== origin)
      return failure(
        "External services are disabled in this portfolio demo.",
        403,
      );
    if (
      url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/embed/abeam/api/") ||
      url.pathname === "/auth/v1/settings"
    )
      return handleDemoRequest(request, db);
    if (
      (request.method === "GET" || request.method === "HEAD") &&
      url.pathname.startsWith("/embed/abeam/")
    )
      return fallback(request);
    return failure(
      "This request is outside the visitor-local aBeam preview.",
      403,
    );
  };
}
let installed = false;
export function installDemoServices(): void {
  if (typeof window === "undefined" || installed) return;
  installed = true;
  demoDatabase.rows("profiles");
  try {
    if (!window.localStorage.getItem("portfolio:abeam:language:v1"))
      window.localStorage.setItem("portfolio:abeam:language:v1", "en");
  } catch {
    /* Profile language is also English. */
  }
  window.fetch = createDemoFetch(
    window.fetch.bind(window),
    window.location.origin,
  );
}
export function resetDemoWorkspace(): void {
  demoDatabase.reset();
  try {
    if (typeof window !== "undefined")
      window.localStorage.setItem("portfolio:abeam:language:v1", "en");
  } catch {
    /* In-memory demo remains usable. */
  }
  notifyDemoReset();
}
