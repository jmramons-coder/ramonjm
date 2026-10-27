import assert from "node:assert/strict";
import { test } from "node:test";
import { DemoDatabase, STORAGE_KEY } from "./database.ts";
import { DEMO_IDS, demoDate, sampleConversationCards } from "./fixtures.ts";
import { cardIdentity } from "../lib/live/feed.ts";
import { createDemoFetch, handleDemoRequest } from "./services.ts";
import { parseFolderJourneyResponse } from "../lib/journey/types.ts";
import { notesSourceCoversScope } from "../lib/review/notes-scope.ts";
import {
  persistConversationBookmarks,
  conversationBookmarksFromPasses,
} from "../lib/conversation/bookmarks.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

const database = () => new DemoDatabase(() => undefined);
function memoryStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
  };
}
const request = (path: string, body: unknown, signal?: AbortSignal) =>
  new Request(`https://portfolio.test/api/${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    signal,
  });
const post = (db: DemoDatabase, path: string, body: unknown) =>
  handleDemoRequest(request(path, body), db);

test("sample resource cards have unique native bookmark identities and correct destinations", () => {
  for (const destination of ["Greece", "Portugal", "Barcelona"]) {
    const cards = sampleConversationCards(new Date(), destination);
    assert.equal(cards.length, 4);
    assert.equal(new Set(cards.map(cardIdentity)).size, cards.length);
    assert.ok(
      cards.every(
        (card) =>
          card.audience === "client" && card.source === "Portfolio sample",
      ),
    );
  }
  assert.deepEqual(sampleConversationCards(new Date(), "Japan"), []);
});

test("local records persist in a dedicated namespace and reset preserves other portfolio state", async () => {
  const storage = memoryStorage();
  storage.setItem("other-project", "keep");
  const db = new DemoDatabase(() => storage);
  assert.equal(db.rows("sessions").length, 3);
  const result = await db
    .from("clients")
    .update({ name: "Visitor edit" })
    .eq("id", DEMO_IDS.client)
    .select("id,name")
    .single();
  assert.equal(result.error, null);
  assert.deepEqual(result.data, { id: DEMO_IDS.client, name: "Visitor edit" });
  const reloaded = new DemoDatabase(() => storage);
  assert.equal(
    reloaded.rows("clients").find((row) => row.id === DEMO_IDS.client)?.name,
    "Visitor edit",
  );
  reloaded.reset();
  assert.equal(reloaded.rows("clients")[0].name, "Maya & Alex");
  assert.equal(storage.getItem("other-project"), "keep");
  assert.ok(storage.getItem(STORAGE_KEY));
});

test("queries enforce native single semantics, ordering/count, and return isolated snapshots", async () => {
  const db = database();
  const all = await db
    .from("sessions")
    .select("id", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(1);
  assert.equal(all.count, 3);
  assert.deepEqual(all.data, [{ id: DEMO_IDS.followUp }]);
  assert.equal(
    (await db.from("sessions").select().eq("id", "missing").single()).error
      ?.code,
    "PGRST116",
  );
  assert.equal(
    (await db.from("sessions").select().eq("id", "missing").maybeSingle()).data,
    null,
  );
  assert.equal(
    (await db.from("sessions").select().maybeSingle()).error?.code,
    "PGRST116",
  );
  const rows = db.rows("clients");
  rows[0].name = "Mutated snapshot";
  assert.equal(db.rows("clients")[0].name, "Maya & Alex");
  const operation = db.from("clients").insert({ id: "one", name: "One" });
  await operation;
  await operation;
  assert.equal(db.rows("clients").filter((row) => row.id === "one").length, 1);
});

test("CAS passes filters preserve unrelated namespaces and reject stale overwrites", async () => {
  const db = database();
  const previous = db
    .rows("sessions")
    .find((row) => row.id === DEMO_IDS.session)!.passes;
  const changed = { ...(previous as object), visitor_test: { saved: true } };
  const first = await db
    .from("sessions")
    .update({ passes: changed })
    .eq("id", DEMO_IDS.session)
    .eq("passes", JSON.stringify(previous))
    .select("id")
    .maybeSingle();
  assert.equal((first.data as { id: string }).id, DEMO_IDS.session);
  const stale = await db
    .from("sessions")
    .update({ passes: { lost: true } })
    .eq("id", DEMO_IDS.session)
    .eq("passes", JSON.stringify(previous))
    .select("id")
    .maybeSingle();
  assert.equal(stale.data, null);
  assert.deepEqual(
    db.rows("sessions").find((row) => row.id === DEMO_IDS.session)?.passes,
    changed,
  );
  const client = { from: (table: string) => db.from(table) } as unknown as Pick<
    SupabaseClient,
    "from"
  >;
  const saved = await persistConversationBookmarks(
    client,
    DEMO_IDS.session,
    DEMO_IDS.user,
    { type: "replace", cards: [] },
  );
  assert.equal(saved.length, 0);
  const passes = db.rows("sessions").find((row) => row.id === DEMO_IDS.session)
    ?.passes as Record<string, unknown>;
  assert.deepEqual(passes.visitor_test, { saved: true });
  assert.equal(conversationBookmarksFromPasses(passes).length, 0);
});

test("storage failure falls back to useful editable memory records", async () => {
  const db = new DemoDatabase(() => {
    throw new Error("Storage denied");
  });
  assert.equal(db.rows("clients").length, 2);
  await db
    .from("clients")
    .update({ name: "Memory edit" })
    .eq("id", DEMO_IDS.client);
  assert.equal(db.rows("clients")[0].name, "Memory edit");
});

test("a quota failure cannot reload stale records over the visitor’s in-memory edit", async () => {
  const storage = memoryStorage();
  const db = new DemoDatabase(() => storage);
  db.rows("clients");
  storage.setItem = () => {
    throw new Error("Quota exceeded");
  };
  await db
    .from("clients")
    .update({ name: "Latest edit" })
    .eq("id", DEMO_IDS.client);
  assert.equal(db.rows("clients")[0].name, "Latest edit");
});

test("Explorer validates scope then returns explicitly fictional destination-aligned results", async () => {
  const db = database();
  const invalid = await post(db, "product-search", {
    kind: "flights",
    adults: -1,
  });
  assert.equal(invalid.status, 400);
  const incomplete = await post(db, "product-search", {
    kind: "flights",
    language: "en",
  });
  const missing = await incomplete.json();
  assert.equal(missing.status, "needs-details");
  assert.deepEqual(missing.items, []);
  assert.ok(missing.clarifications.length > 0);
  const input = {
    kind: "flights",
    language: "en",
    origin: "YVR",
    destination: "LIS",
    departureDate: demoDate(30),
    returnDate: demoDate(37),
    adults: 3,
    childrenAges: [],
  };
  const result = await (await post(db, "product-search", input)).json();
  assert.equal(result.status, "ready");
  assert.equal(result.searchesUsed, 0);
  assert.equal(result.items.length, 2);
  for (const offer of result.items) {
    assert.equal(offer.origin, "YVR");
    assert.equal(offer.destination, "LIS");
    assert.equal(offer.adults, 3);
    assert.equal(offer.departureDate, input.departureDate);
    assert.equal(offer.source, "Portfolio demo · sample offers");
    assert.equal(offer.url, undefined);
  }
  assert.match(result.warnings[0], /fictional/i);
});

test("native journey parser accepts saved state and stale revision never overwrites edits", async () => {
  const db = database();
  const loaded = parseFolderJourneyResponse(
    await (
      await post(db, "folder-journey", {
        action: "load",
        sessionId: DEMO_IDS.session,
      })
    ).json(),
  );
  assert.ok(loaded?.journey);
  assert.equal(
    loaded.journey.generatedSourceSignature,
    loaded.source.signature,
  );
  assert.equal(loaded.source.conversationCount, 2);
  const id = loaded.journey.entries[0].id;
  const savedResponse = await post(db, "folder-journey", {
    action: "save",
    sessionId: DEMO_IDS.session,
    expectedRevision: loaded.journey.revision,
    mutation: { type: "toggle", id, done: true },
  });
  const saved = parseFolderJourneyResponse(await savedResponse.json());
  assert.equal(saved?.journey?.entries[0].done, true);
  assert.equal(saved?.journey?.revision, loaded.journey.revision + 1);
  const stale = await post(db, "folder-journey", {
    action: "save",
    sessionId: DEMO_IDS.followUp,
    expectedRevision: loaded.journey.revision,
    mutation: { type: "toggle", id, done: false },
  });
  assert.equal(stale.status, 409);
  const reloaded = parseFolderJourneyResponse(
    await (
      await post(db, "folder-journey", {
        action: "load",
        sessionId: DEMO_IDS.followUp,
      })
    ).json(),
  );
  assert.equal(reloaded?.journey?.entries[0].done, true);
  const anchor = db
    .rows("sessions")
    .find((row) => row.id === DEMO_IDS.followUp)!;
  assert.ok(
    (anchor.passes as Record<string, unknown>).conversation_bookmarks_v1,
  );
});

test("folder notes report exact native scope metadata", async () => {
  const db = database();
  const result = await (
    await post(db, "notes", {
      folderKey: `${DEMO_IDS.client}::${DEMO_IDS.trip}`,
    })
  ).json();
  assert.ok(
    notesSourceCoversScope(
      result.source,
      [DEMO_IDS.session, DEMO_IDS.followUp],
      "dossier",
    ),
  );
  const single = await (
    await post(db, "notes", { sessionId: DEMO_IDS.otherSession })
  ).json();
  assert.ok(
    notesSourceCoversScope(single.source, [DEMO_IDS.otherSession], "session"),
  );
  assert.match(single.notes.cadre, /without AI/);
});

test("folder deletion requires exact current scope and preserves other clients and trips", async () => {
  const db = database();
  const input = {
    confirmed: true,
    clientId: DEMO_IDS.client,
    tripId: DEMO_IDS.trip,
    expectedSessionIds: [DEMO_IDS.session],
  };
  assert.equal((await post(db, "folder-delete", input)).status, 409);
  assert.equal(db.rows("sessions").length, 3);
  const result = await (
    await post(db, "folder-delete", {
      ...input,
      expectedSessionIds: [DEMO_IDS.session, DEMO_IDS.followUp],
    })
  ).json();
  assert.equal(result.result.deletedSessionIds.length, 2);
  assert.equal(result.result.deletedClientId, null);
  assert.deepEqual(
    db.rows("sessions").map((row) => row.id),
    [DEMO_IDS.otherSession],
  );
  assert.equal(db.rows("clients").length, 2);
  assert.deepEqual(
    db.rows("trips").map((row) => row.id),
    [DEMO_IDS.otherTrip],
  );
});

test("iframe fetch blocks external traffic and unsupported expensive actions", async () => {
  const db = database();
  let calls = 0;
  const fallback: typeof fetch = async () => {
    calls++;
    return new Response("asset");
  };
  const fetch = createDemoFetch(fallback, "https://portfolio.test", db);
  const external = await fetch("https://production.example/api/travel");
  assert.equal(external.status, 403);
  const backend = await fetch("/api/send-recap", {
    method: "POST",
    body: "{}",
  });
  assert.equal(backend.status, 501);
  const mic = await fetch("/api/live-token", { method: "POST", body: "{}" });
  assert.equal(mic.status, 501);
  const unknown = await fetch("/api/unknown", { method: "POST", body: "{}" });
  assert.equal(unknown.status, 501);
  const portfolioRoute = await fetch("/api/case-management");
  assert.equal(portfolioRoute.status, 405);
  assert.equal(calls, 0);
  assert.equal((await fetch("/embed/abeam/auth-coast.webp")).status, 200);
  assert.equal(calls, 1);
});

test("aborted requests cannot change local data", async () => {
  const db = database();
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    () =>
      handleDemoRequest(
        request(
          "folder-delete",
          {
            confirmed: true,
            clientId: DEMO_IDS.client,
            tripId: DEMO_IDS.trip,
            expectedSessionIds: [DEMO_IDS.session, DEMO_IDS.followUp],
          },
          controller.signal,
        ),
        db,
      ),
    { name: "AbortError" },
  );
  assert.equal(db.rows("sessions").length, 3);
  const result = await db
    .from("clients")
    .update({ name: "Cancelled" })
    .eq("id", DEMO_IDS.client)
    .abortSignal(controller.signal);
  assert.equal(result.error?.code, "ABORTED");
  assert.equal(db.rows("clients")[0].name, "Maya & Alex");
});
