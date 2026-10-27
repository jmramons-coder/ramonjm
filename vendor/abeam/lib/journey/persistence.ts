import { createHash } from "node:crypto";
import { FolderJourneyError } from "./errors.ts";
import { buildJourneyGenerationContext } from "./context.ts";
import { selectLatestJourneySnapshot } from "./snapshots.ts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { conversationBookmarksFromPasses } from "../conversation/bookmarks.ts";
import { loadFolderAgentContext, type FolderAgentContext } from "../review/folder-agent-context.ts";
import { FOLDER_JOURNEY_KEY, MAX_JOURNEY_ENTRIES, journeyIdentifier, journeyRecord, journeySemanticKey, parseJourneyEntry,
  type FolderJourney, type FolderJourneyResponse, type JourneyEntry, type JourneyMutation } from "./types.ts";

type Store = Pick<SupabaseClient, "from">;
type Scope = { ownerId: string; sessionId: string; clientId: string; tripId: string | null };
type Member = { id: string; owner_id: string; client_id: string; trip_id: string | null; created_at: string; passes: unknown };
export type FolderJourneyState = { scope: Scope; members: Member[]; context: FolderAgentContext; response: FolderJourneyResponse };
const PAGE_SIZE = 100;
const MAX_MEMBERS = 1000;

export { FolderJourneyError } from "./errors.ts";
const assertCurrent = (isCurrent: () => boolean) => { if (!isCurrent()) throw new FolderJourneyError(409, "Le compte ou le dossier a changé. Rechargez le parcours."); };
function matches(row: Record<string, unknown> | null, scope: Scope): boolean {
  return Boolean(row && journeyIdentifier(row.id) && row.owner_id === scope.ownerId && row.client_id === scope.clientId && row.trip_id === scope.tripId);
}
function map(value: unknown): Record<string, unknown> | null {
  if (value === null) return null;
  const object = journeyRecord(value);
  if (!object) throw new FolderJourneyError(500, "Les livrables enregistrés sont invalides. Aucun résultat n’a été remplacé.");
  return object;
}

/** All saved snapshots are inspected; the model still sees at most 100 conversations/60k chars. */
export async function loadFolderJourneyState(client: Store, ownerId: string, sessionId: string, isCurrent = () => true): Promise<FolderJourneyState> {
  if (!journeyIdentifier(ownerId) || !journeyIdentifier(sessionId)) throw new FolderJourneyError(400, "Une conversation enregistrée du dossier est requise.");
  assertCurrent(isCurrent);
  const anchor = await client.from("sessions").select("id,owner_id,client_id,trip_id").eq("id", sessionId).eq("owner_id", ownerId).maybeSingle();
  assertCurrent(isCurrent);
  if (anchor.error) throw new FolderJourneyError(500, "Le dossier n’a pas pu être chargé.");
  const row = journeyRecord(anchor.data);
  if (!row || row.owner_id !== ownerId || row.id !== sessionId) throw new FolderJourneyError(404, "Cette conversation n’est plus disponible.");
  if (!journeyIdentifier(row.client_id) || (row.trip_id !== null && !journeyIdentifier(row.trip_id))) throw new FolderJourneyError(400, "Un dossier client est requis pour préparer le parcours.");
  const scope: Scope = { ownerId, sessionId, clientId: row.client_id, tripId: row.trip_id as string | null };
  const members: Member[] = [];
  let count: number | null = null;
  for (let offset = 0; offset < MAX_MEMBERS; offset += PAGE_SIZE) {
    const query = client.from("sessions").select("id,owner_id,client_id,trip_id,created_at,passes", { count: "exact" }).eq("owner_id", ownerId).eq("client_id", scope.clientId);
    const scoped = scope.tripId === null ? query.is("trip_id", null) : query.eq("trip_id", scope.tripId);
    const page = await scoped.order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);
    assertCurrent(isCurrent);
    if (page.error) throw new FolderJourneyError(500, "Les parcours enregistrés n’ont pas pu être chargés.");
    if (!Number.isSafeInteger(page.count) || page.count === null || page.count < 0 || !Array.isArray(page.data)) throw new FolderJourneyError(500, "Les conversations du dossier ne peuvent pas être vérifiées.");
    if (page.count > MAX_MEMBERS) throw new FolderJourneyError(413, "Ce dossier est trop volumineux pour modifier son parcours en une seule opération.");
    if (count !== null && count !== page.count) throw new FolderJourneyError(409, "Le dossier a changé. Rechargez le parcours.");
    count = page.count;
    for (const value of page.data) {
      const member = journeyRecord(value);
      if (!matches(member, scope) || members.some((saved) => saved.id === member!.id)) throw new FolderJourneyError(409, "La portée du dossier a changé.");
      members.push(member as Member);
    }
    if (members.length === count) break;
    if (page.data.length !== PAGE_SIZE) throw new FolderJourneyError(409, "Les conversations du dossier ont changé.");
  }
  if (!members.length || !members.some((member) => member.id === sessionId)) throw new FolderJourneyError(409, "La conversation a changé de dossier.");
  const context = await loadFolderAgentContext(client, ownerId, row);
  assertCurrent(isCurrent);
  if (context.conversationCount !== members.length) throw new FolderJourneyError(409, "Le dossier a changé. Rechargez le parcours.");
  const hash = createHash("sha256").update(JSON.stringify([ownerId, scope.clientId, scope.tripId, context.context]));
  let bookmarkCount = 0;
  for (const member of members) {
    for (const card of conversationBookmarksFromPasses(member.passes)) {
      hash.update(JSON.stringify([member.id, card])); bookmarkCount++;
    }
  }
  const signature = `fj1:${hash.digest("hex")}`;
  const saved = selectLatestJourneySnapshot(members, scope);
  const state: FolderJourneyState = { scope, members, context, response: { journey: saved?.journey ?? null, anchorSessionId: saved?.member.id ?? members[0].id,
    source: { signature, conversationCount: context.conversationCount, includedCount: context.includedCount, truncated: context.truncated || bookmarkCount > 12 } } };
  state.response.source.truncated = buildJourneyGenerationContext(state).truncated;
  return state;
}

export function mergeGeneratedJourneyEntries(previous: readonly JourneyEntry[], generated: readonly JourneyEntry[]): JourneyEntry[] {
  const preserved = previous.filter((entry) => entry.origin !== "ai");
  const checked = new Map(previous.map((entry) => [entry.id, entry.done]));
  const ids = new Set(preserved.map((entry) => entry.id));
  const semantics = new Set(preserved.map(journeySemanticKey));
  const entries = [...preserved];
  for (const entry of generated) {
    if (ids.has(entry.id) || semantics.has(journeySemanticKey(entry))) continue;
    entries.push({ ...entry, done: checked.get(entry.id) ?? false }); ids.add(entry.id);
  }
  if (entries.length > MAX_JOURNEY_ENTRIES) throw new FolderJourneyError(400, "Le parcours contient trop d’étapes. Retirez une étape avant de le régénérer.");
  const phase = { before: 0, during: 1, after: 2 };
  return entries.map((entry) => structuredClone(entry)).sort((a, b) => phase[a.phase] - phase[b.phase]);
}

/** Validate actual saved bookmark evidence; arbitrary client offer snapshots are rejected. */
function validateOffer(entry: JourneyEntry, previous: JourneyEntry | undefined, state: FolderJourneyState): JourneyEntry {
  if (!entry.offer) {
    if (entry.origin === "bookmark") throw new FolderJourneyError(400, "L’offre du signet est requise.");
    return entry;
  }
  const offerKey = JSON.stringify(entry.offer);
  if (previous?.offer && JSON.stringify(previous.offer) === offerKey) return entry;
  const matching = state.members.filter((member) => conversationBookmarksFromPasses(member.passes).some((card) => card.type === entry.offer!.type && card.items.some((item) => JSON.stringify(item) === JSON.stringify(entry.offer!.item))));
  if (entry.origin !== "bookmark" || !matching.length) throw new FolderJourneyError(400, "Cette offre ne correspond pas à un signet enregistré de ce dossier.");
  if (entry.sourceSessionIds.length && entry.sourceSessionIds.some((id) => !matching.some((member) => member.id === id))) throw new FolderJourneyError(400, "La source du signet ne correspond pas à cette offre.");
  return { ...entry, sourceSessionIds: matching.filter((member) => !entry.sourceSessionIds.length || entry.sourceSessionIds.includes(member.id)).map((member) => member.id).slice(0, 100) };
}

export function applyJourneyMutation(state: FolderJourneyState, mutation: JourneyMutation): JourneyEntry[] {
  const previous = state.response.journey?.entries ?? [];
  if (mutation.type === "toggle" || mutation.type === "remove") {
    if (!journeyIdentifier(mutation.id) || !previous.some((entry) => entry.id === mutation.id) || (mutation.type === "toggle" && typeof mutation.done !== "boolean")) throw new FolderJourneyError(400, "Cette étape n’est plus disponible.");
    return mutation.type === "remove" ? previous.filter((entry) => entry.id !== mutation.id)
      : previous.map((entry) => entry.id === mutation.id ? { ...entry, done: mutation.done } : entry);
  }
  if (mutation.type !== "upsert") throw new FolderJourneyError(400, "Modification du parcours invalide.");
  let entry = parseJourneyEntry(mutation.entry);
  if (!entry) throw new FolderJourneyError(400, "L’étape ou sa source est invalide.");
  const existing = previous.find((saved) => saved.id === entry!.id);
  const currentIds = new Set(state.members.map((member) => member.id));
  if (entry.sourceSessionIds.some((id) => !currentIds.has(id) && !existing?.sourceSessionIds.includes(id))) throw new FolderJourneyError(400, "L’étape ou sa source est invalide.");
  // Saved entries may still cite an intentionally deleted conversation. Keep
  // them editable, but never accept a new foreign/historical citation.
  entry = { ...entry, sourceSessionIds: entry.sourceSessionIds.filter((id) => currentIds.has(id)) };
  if (entry.origin === "ai" && existing?.origin !== "ai") throw new FolderJourneyError(400, "Les propositions automatiques doivent être générées depuis le dossier.");
  entry = validateOffer(entry, existing, state);
  if (existing?.origin === "ai") entry = { ...entry, origin: "manual" };
  let entries = previous.filter((saved) => saved.id !== entry!.id);
  if (entry.placement && entry.ordinal !== undefined && (!existing || existing.ordinal !== entry.ordinal || existing.placement !== entry.placement || existing.phase !== entry.phase)) {
    const inserted = entry;
    entries = entries.map((saved) => {
      if (saved.phase !== inserted.phase || saved.placement !== inserted.placement || saved.ordinal === undefined || saved.ordinal < inserted.ordinal!) return saved;
      if (saved.ordinal >= 99) throw new FolderJourneyError(400, "Cet ordre dépasse la limite du parcours.");
      return { ...saved, ordinal: saved.ordinal + 1 };
    });
  }
  const phase = { before: 0, during: 1, after: 2 };
  let index = entries.findIndex((saved) => phase[saved.phase] > phase[entry!.phase]
    || (saved.phase === entry!.phase && saved.placement === entry!.placement && entry!.ordinal !== undefined && saved.ordinal !== undefined && saved.ordinal >= entry!.ordinal));
  if (index < 0) index = entries.length;
  entries.splice(index, 0, entry);
  if (entries.length > MAX_JOURNEY_ENTRIES) throw new FolderJourneyError(400, "Le parcours contient déjà le maximum d’étapes.");
  return entries.map((saved) => structuredClone(saved));
}

type Change = { mutation: JourneyMutation } | { generated: JourneyEntry[] };
export async function persistFolderJourney(client: Store, state: FolderJourneyState, expectedRevision: number | null, change: Change, isCurrent = () => true): Promise<FolderJourneyResponse> {
  if (expectedRevision !== null && (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1)) throw new FolderJourneyError(400, "La révision du parcours est requise.");
  const captured = structuredClone(change);
  for (let attempt = 0; attempt < 3; attempt++) {
    assertCurrent(isCurrent);
    const current = await loadFolderJourneyState(client, state.scope.ownerId, state.scope.sessionId, isCurrent);
    if (current.scope.clientId !== state.scope.clientId || current.scope.tripId !== state.scope.tripId || current.response.source.signature !== state.response.source.signature) throw new FolderJourneyError(409, "Les conversations du dossier ont changé. Rechargez le parcours.");
    const existing = current.response.journey;
    if ((existing?.revision ?? null) !== expectedRevision) throw new FolderJourneyError(409, "Le parcours a été modifié ailleurs. Rechargez avant de réessayer.", "revision_conflict");
    if (existing?.revision === Number.MAX_SAFE_INTEGER) throw new FolderJourneyError(409, "La révision du parcours ne peut plus être incrémentée.", "revision_conflict");
    const entries = "generated" in captured ? mergeGeneratedJourneyEntries(existing?.entries ?? [], captured.generated) : applyJourneyMutation(current, captured.mutation);
    const journey: FolderJourney = { version: 1, clientId: current.scope.clientId, tripId: current.scope.tripId, entries,
      generatedSourceSignature: "generated" in captured ? current.response.source.signature : existing?.generatedSourceSignature ?? "",
      updatedAt: new Date().toISOString(), revision: (existing?.revision ?? 0) + 1 };
    const target = current.members.find((member) => member.id === current.response.anchorSessionId)!;
    const previous = map(target.passes);
    const passes = { ...previous, [FOLDER_JOURNEY_KEY]: journey };
    assertCurrent(isCurrent);
    let update = client.from("sessions").update({ passes }).eq("id", target.id).eq("owner_id", current.scope.ownerId).eq("client_id", current.scope.clientId);
    update = current.scope.tripId === null ? update.is("trip_id", null) : update.eq("trip_id", current.scope.tripId);
    const compared = target.passes === null ? update.is("passes", null) : update.eq("passes", JSON.stringify(target.passes));
    const committed = await compared.select("id").maybeSingle();
    assertCurrent(isCurrent);
    if (committed.error) throw new FolderJourneyError(500, "Le parcours n’a pas pu être enregistré.");
    if (committed.data?.id === target.id) return { ...current.response, journey };
  }
  throw new FolderJourneyError(409, "Les livrables ont changé pendant l’enregistrement. Réessayez.");
}
