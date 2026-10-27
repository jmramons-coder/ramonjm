import type { SupabaseClient } from "@supabase/supabase-js";
import { FolderJourneyError } from "./errors.ts";
import { FOLDER_JOURNEY_KEY, journeyIdentifier, journeyRecord, type FolderJourney } from "./types.ts";
import { scopedJourneySnapshot, selectLatestJourneySnapshot } from "./snapshots.ts";

type Member = { id: string; owner_id: string; client_id: string; trip_id: string | null; passes: unknown };
type Scope = { ownerId: string; clientId: string; tripId: string | null };
type Store = Pick<SupabaseClient, "from">;
const PAGE_SIZE = 100;
const MAX_MEMBERS = 1000;
export type FolderJourneyDeletionPassSnapshot = { sessionId: string; passes: unknown };
const guard = (isCurrent: () => boolean) => { if (!isCurrent()) throw new FolderJourneyError(409, "Le compte ou le dossier a changé. Rechargez avant de supprimer la conversation."); };
async function readScope(client: Store, scope: Scope, isCurrent: () => boolean) {
  const members: Member[] = [];
  let count: number | null = null;
  for (let offset = 0; offset < MAX_MEMBERS; offset += PAGE_SIZE) {
    guard(isCurrent);
    const query = client.from("sessions").select("id,owner_id,client_id,trip_id,passes", { count: "exact" }).eq("owner_id", scope.ownerId).eq("client_id", scope.clientId);
    const scoped = scope.tripId === null ? query.is("trip_id", null) : query.eq("trip_id", scope.tripId);
    const page = await scoped.order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);
    guard(isCurrent);
    if (page.error || !Array.isArray(page.data) || !Number.isSafeInteger(page.count) || page.count === null || page.count < 0) throw new FolderJourneyError(500, "Le parcours n’a pas pu être vérifié avant la suppression.");
    if (page.count > MAX_MEMBERS) throw new FolderJourneyError(413, "Ce dossier est trop volumineux pour déplacer son parcours en une seule opération.");
    if (count !== null && count !== page.count) throw new FolderJourneyError(409, "Le dossier a changé. Réessayez avant de supprimer.");
    count = page.count;
    for (const value of page.data) {
      const row = journeyRecord(value);
      if (!row || !journeyIdentifier(row.id) || row.owner_id !== scope.ownerId || row.client_id !== scope.clientId || row.trip_id !== scope.tripId || members.some((member) => member.id === row.id)) throw new FolderJourneyError(409, "La portée du dossier a changé.");
      members.push(row as Member);
    }
    if (members.length === count) return members;
    if (page.data.length !== PAGE_SIZE) throw new FolderJourneyError(409, "Le dossier a changé. Réessayez avant de supprimer.");
  }
  return members;
}

/** Metadata-only, browser-safe protection called after the caller drains its writer. */
export async function relocateFolderJourneyBeforeSessionDeletion(client: Store, ownerId: string, sessionIds: readonly string[], isCurrent = () => true, allowJourneyRemoval = false): Promise<FolderJourneyDeletionPassSnapshot[]> {
  if (!journeyIdentifier(ownerId) || !Array.isArray(sessionIds) || sessionIds.length > MAX_MEMBERS || sessionIds.some((id) => !journeyIdentifier(id))) throw new FolderJourneyError(400, "La sélection des conversations est invalide.");
  const deleted = new Set(sessionIds);
  const scopes = new Map<string, Scope>();
  const snapshots: FolderJourneyDeletionPassSnapshot[] = [];
  const ids = [...deleted];
  for (let offset = 0; offset < ids.length; offset += PAGE_SIZE) {
    guard(isCurrent);
    const batch = ids.slice(offset, offset + PAGE_SIZE);
    const selected = await client.from("sessions").select("id,owner_id,client_id,trip_id,passes").eq("owner_id", ownerId).in("id", batch);
    guard(isCurrent);
    if (selected.error || !Array.isArray(selected.data)) throw new FolderJourneyError(500, "Le parcours n’a pas pu être protégé avant la suppression.");
    for (const value of selected.data) {
      const row = journeyRecord(value);
      if (!row || row.owner_id !== ownerId || !journeyIdentifier(row.id) || !batch.includes(row.id)) throw new FolderJourneyError(409, "La sélection des conversations a changé.");
      // The final DELETE compares this captured baseline. A pending remote
      // save to the old anchor must never be accepted by a fresh read.
      snapshots.push({ sessionId: row.id, passes: structuredClone(row.passes) });
      if (!journeyIdentifier(row.client_id) || (row.trip_id !== null && !journeyIdentifier(row.trip_id))) continue;
      const saved = scopedJourneySnapshot(row.passes, { clientId: row.client_id, tripId: row.trip_id as string | null });
      // If no requested row stores a valid journey, its actual storage anchor
      // is outside this deletion and does not need relocation.
      if (!saved || saved.clientId !== row.client_id || saved.tripId !== row.trip_id) continue;
      const scope: Scope = { ownerId, clientId: row.client_id, tripId: row.trip_id as string | null };
      scopes.set(JSON.stringify([scope.clientId, scope.tripId]), scope);
    }
  }
  for (const scope of scopes.values()) {
    const initial = await readScope(client, scope, isCurrent);
    const saved = selectLatestJourneySnapshot(initial, scope);
    if (!saved?.journey.entries.length || !deleted.has(saved.member.id)) continue;
    const survivor = initial.find((member) => !deleted.has(member.id));
    if (!survivor) {
      if (allowJourneyRemoval) continue;
      throw new FolderJourneyError(409, "La dernière conversation conserve aussi le parcours. Confirmez sa suppression complète ou conservez une conversation.", "journey_removal_confirmation");
    }
    let complete = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      const members = await readScope(client, scope, isCurrent);
      const current = selectLatestJourneySnapshot(members, scope);
      if (!current || JSON.stringify(current.journey) !== JSON.stringify(saved.journey)) throw new FolderJourneyError(409, "Le parcours a changé. Réessayez avant de supprimer.", "revision_conflict");
      if (saved.journey.revision === Number.MAX_SAFE_INTEGER) throw new FolderJourneyError(409, "La révision du parcours ne peut plus être incrémentée.", "revision_conflict");
      const target = members.find((member) => member.id === survivor.id);
      if (!target || deleted.has(target.id)) throw new FolderJourneyError(409, "La conversation qui conserve le parcours a changé.");
      const previous = target.passes === null ? null : journeyRecord(target.passes);
      if (target.passes !== null && !previous) throw new FolderJourneyError(500, "Les livrables enregistrés sont invalides. La conversation a été conservée.");
      const journey: FolderJourney = { ...saved.journey, revision: saved.journey.revision + 1, updatedAt: new Date().toISOString(),
        entries: saved.journey.entries.map((entry) => ({ ...entry, sourceSessionIds: entry.sourceSessionIds.filter((id) => !deleted.has(id)) })) };
      guard(isCurrent);
      let query = client.from("sessions").update({ passes: { ...previous, [FOLDER_JOURNEY_KEY]: journey } }).eq("id", target.id).eq("owner_id", ownerId).eq("client_id", scope.clientId);
      query = scope.tripId === null ? query.is("trip_id", null) : query.eq("trip_id", scope.tripId);
      const compared = target.passes === null ? query.is("passes", null) : query.eq("passes", JSON.stringify(target.passes));
      const committed = await compared.select("id").maybeSingle();
      guard(isCurrent);
      if (committed.error) throw new FolderJourneyError(500, "Le parcours n’a pas pu être déplacé. La conversation a été conservée.");
      if (committed.data?.id === target.id) { complete = true; break; }
    }
    if (!complete) throw new FolderJourneyError(409, "Les livrables ont changé. Réessayez avant de supprimer.");
  }
  return snapshots;
}
