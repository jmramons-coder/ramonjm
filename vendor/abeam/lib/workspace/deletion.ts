import type { SupabaseClient } from "@supabase/supabase-js";
import { isSessionAudioRef } from "../session/audio-ref.ts";
import { REPRISE } from "../session/reprise.ts";

type DeletionClient = Pick<SupabaseClient, "from" | "storage">;
type CurrentScope = () => boolean;
export const MAX_WORKSPACE_DELETE_SESSIONS = 1000;
const SESSION_BATCH_SIZE = 100;
const AUDIO_PART_PAGE_SIZE = 100;
const MAX_AUDIO_PART_PAGES = 100;
const AUDIO_EXTENSIONS = ["webm", "m4a", "mp3", "ogg", "wav"] as const;

/** Deletion protects fresh work, but stale unfinished checkpoints can be removed. */
export function canDeleteWorkspaceSession(session: { status?: unknown; updatedAt?: unknown }, nowMs: number): boolean {
  const { status, updatedAt } = session;
  if (status === undefined || status === null || status === "prete" || status === "interrompue") return true;
  if (status !== "traitement" && status !== "transcrit") return false;
  if (updatedAt === undefined || updatedAt === null) return true;
  if (typeof updatedAt !== "string" || !Number.isFinite(nowMs)) return false;
  const heartbeat = Date.parse(updatedAt);
  return Number.isFinite(heartbeat) && nowMs - heartbeat > REPRISE.TRAITEMENT_FRAIS_MS;
}

function processingCheckpoint(status: unknown): boolean {
  return status === "traitement" || status === "transcrit";
}

export type SessionAssignmentAnchor = {
  sessionId: string;
  clientId: string | null;
  tripId: string | null;
};

/** Captured before journey relocation; never refreshed by the deletion read. */
export type SessionPassSnapshot = { sessionId: string; passes: unknown };

export type WorkspaceDeletionResult = {
  deletedSessionIds: string[];
  missingSessionIds: string[];
  skippedSessionIds: string[];
  audioCleanupFailures: { sessionId: string; message: string }[];
  detachedSessionIds: string[];
  deletedTripId: string | null;
  deletedClientId: string | null;
};

/** A failed later step never conceals a deletion/detachment already committed. */
export class WorkspaceDeletionError extends Error {
  readonly result: WorkspaceDeletionResult;
  constructor(message: string, result: WorkspaceDeletionResult) {
    super(message);
    this.name = "WorkspaceDeletionError";
    this.result = structuredClone(result);
  }
}

const emptyResult = (): WorkspaceDeletionResult => ({
  deletedSessionIds: [], missingSessionIds: [], skippedSessionIds: [],
  audioCleanupFailures: [], detachedSessionIds: [], deletedTripId: null, deletedClientId: null,
});

function identifier(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,180}$/.test(value);
}

function nullableIdentifier(value: unknown): value is string | null {
  return value === null || identifier(value);
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function encodePassSnapshot(value: unknown): string {
  const ancestors = new Set<object>();
  const safe = (item: unknown, depth: number): boolean => {
    if (item === null || typeof item === "string" || typeof item === "boolean") return true;
    if (typeof item === "number") return Number.isFinite(item);
    if (typeof item !== "object" || depth > 100 || ancestors.has(item)) return false;
    const array = Array.isArray(item);
    if (!array && Object.getPrototypeOf(item) !== Object.prototype && Object.getPrototypeOf(item) !== null) return false;
    const descriptors = Object.getOwnPropertyDescriptors(item);
    const keys = Reflect.ownKeys(item);
    if (array && keys.length !== item.length + 1) return false;
    ancestors.add(item);
    for (const key of keys) {
      if (array && key === "length") continue;
      if (typeof key !== "string" || (array && (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= item.length))) return false;
      const descriptor = descriptors[key];
      if (!descriptor?.enumerable || !("value" in descriptor) || !safe(descriptor.value, depth + 1)) return false;
    }
    ancestors.delete(item);
    return true;
  };
  if (!safe(value, 0)) throw new Error("Les livrables capturés pour la suppression sont invalides.");
  return JSON.stringify(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : record(error)?.message as string || "La suppression a échoué.";
}

function guardCurrent(isCurrent: CurrentScope, result: WorkspaceDeletionResult) {
  if (!isCurrent()) throw new WorkspaceDeletionError("Le compte a changé pendant la suppression.", result);
}

type OwnedSession = {
  id: string; owner_id: string; client_id: string | null; trip_id: string | null;
  status: unknown; updated_at?: unknown; audio_ref: unknown;
};

function ownedSession(value: unknown, ownerId: string, requested: ReadonlySet<string>): OwnedSession | null {
  const row = record(value);
  if (!row || !identifier(row.id) || !requested.has(row.id) || row.owner_id !== ownerId
    || !nullableIdentifier(row.client_id) || !nullableIdentifier(row.trip_id)) return null;
  return row as OwnedSession;
}

/** Only deterministic paths belonging to this exact owner/session are removed. */
async function cleanupAudio(
  client: DeletionClient, ownerId: string, sessionId: string, audioRef: unknown,
  isCurrent: CurrentScope, result: WorkspaceDeletionResult,
) {
  const bucket = client.storage.from("session-audio");
  const fullPaths = AUDIO_EXTENSIONS.map((extension) => `${ownerId}/${sessionId}.${extension}`);
  if (typeof audioRef === "string" && isSessionAudioRef(audioRef, ownerId, sessionId)
    && !fullPaths.includes(audioRef)) fullPaths.push(audioRef);
  const failures: string[] = [];
  guardCurrent(isCurrent, result);
  try {
    const removed = await bucket.remove(fullPaths);
    guardCurrent(isCurrent, result);
    if (removed.error) failures.push(removed.error.message);
  } catch (error) {
    guardCurrent(isCurrent, result);
    failures.push(errorMessage(error));
  }
  const prefix = `${ownerId}/${sessionId}/parts`;
  try {
    for (let page = 0; page < MAX_AUDIO_PART_PAGES; page++) {
      guardCurrent(isCurrent, result);
      // Delete the first page before rereading it: increasing offsets after
      // removal would silently skip objects as subsequent pages shift left.
      const listed = await bucket.list(prefix, {
        limit: AUDIO_PART_PAGE_SIZE, offset: 0, sortBy: { column: "name", order: "asc" },
      });
      guardCurrent(isCurrent, result);
      if (listed.error) throw listed.error;
      if (!Array.isArray(listed.data)) throw new Error("Les segments audio ne peuvent pas être vérifiés.");
      if (!listed.data.length) break;
      const names = listed.data.map((item) => record(item)?.name);
      if (names.some((name) => typeof name !== "string" || !/^\d{4,20}$/.test(name))) {
        throw new Error("Un chemin de segment audio inattendu a été conservé.");
      }
      const removed = await bucket.remove(names.map((name) => `${prefix}/${name}`));
      guardCurrent(isCurrent, result);
      if (removed.error) throw removed.error;
      if (page === MAX_AUDIO_PART_PAGES - 1) throw new Error("Le nettoyage des segments audio doit être repris.");
    }
  } catch (error) {
    guardCurrent(isCurrent, result);
    failures.push(errorMessage(error));
  }
  if (failures.length) result.audioCleanupFailures.push({ sessionId, message: failures.join(" ") });
}

/**
 * Call only after the caller blocks/drains its writers for these identities.
 * Row deletion and Storage are separate transactions; audio failures are
 * returned for an explicit retry, without pretending the recording survived.
 * Search accounting ledgers and client records are deliberately untouched.
 */
export async function deleteOwnedSessions(
  client: DeletionClient,
  request: { ownerId: string; sessionIds: readonly string[]; expectedAssignments?: readonly SessionAssignmentAnchor[]; expectedPassSnapshots?: readonly SessionPassSnapshot[] },
  isCurrent: CurrentScope = () => true,
): Promise<WorkspaceDeletionResult> {
  const result = emptyResult();
  try {
    if (!identifier(request.ownerId) || !Array.isArray(request.sessionIds)
      || request.sessionIds.length > MAX_WORKSPACE_DELETE_SESSIONS || request.sessionIds.some((id) => !identifier(id))
      || new Set(request.sessionIds).size !== request.sessionIds.length) {
      throw new Error("La sélection des conversations est invalide.");
    }
    const ownerId = request.ownerId;
    const ids = [...new Set(request.sessionIds)];
    const capturedPasses = new Map<string, string | null>();
    const requirePassSnapshot = request.expectedPassSnapshots !== undefined;
    if (requirePassSnapshot) {
      if (!Array.isArray(request.expectedPassSnapshots) || request.expectedPassSnapshots.length > ids.length) {
        throw new Error("Les livrables des conversations doivent être vérifiés avant la suppression.");
      }
      for (const raw of request.expectedPassSnapshots) {
        const snapshot = record(raw);
        if (!snapshot || !identifier(snapshot.sessionId) || !ids.includes(snapshot.sessionId)
          || capturedPasses.has(snapshot.sessionId) || !Object.hasOwn(snapshot, "passes")) {
          throw new Error("Les livrables capturés pour la suppression sont invalides.");
        }
        // Serialize synchronously: a later caller mutation cannot authorize DELETE.
        const encoded = encodePassSnapshot(snapshot.passes);
        capturedPasses.set(snapshot.sessionId, snapshot.passes === null ? null : encoded);
      }
    }
    const anchors = new Map<string, SessionAssignmentAnchor>();
    if (request.expectedAssignments !== undefined) {
      if (!Array.isArray(request.expectedAssignments) || request.expectedAssignments.length !== ids.length) {
        throw new Error("Le classement des conversations doit être vérifié avant la suppression.");
      }
      for (const raw of request.expectedAssignments) {
        const anchor = record(raw);
        if (!anchor || !identifier(anchor.sessionId) || !ids.includes(anchor.sessionId)
          || !nullableIdentifier(anchor.clientId) || !nullableIdentifier(anchor.tripId) || anchors.has(anchor.sessionId)) {
          throw new Error("Le classement des conversations est invalide.");
        }
        anchors.set(anchor.sessionId, { sessionId: anchor.sessionId, clientId: anchor.clientId, tripId: anchor.tripId });
      }
    }
    for (let offset = 0; offset < ids.length; offset += SESSION_BATCH_SIZE) {
      guardCurrent(isCurrent, result);
      const batch = ids.slice(offset, offset + SESSION_BATCH_SIZE);
      let selected = await client.from("sessions").select("id,owner_id,client_id,trip_id,status,updated_at,audio_ref")
        .eq("owner_id", ownerId).in("id", batch);
      guardCurrent(isCurrent, result);
      // The original supported schema predates lifecycle. Keep ordinary reads
      // minimal, but do not make that additive migration a deletion prerequisite.
      if (selected.error?.code === "42703" && /\bstatus\b/.test(selected.error.message)) {
        selected = await client.from("sessions").select("*").eq("owner_id", ownerId).in("id", batch);
        guardCurrent(isCurrent, result);
      }
      if (selected.error) throw selected.error;
      if (!Array.isArray(selected.data)) throw new Error("La sélection enregistrée est invalide.");
      const rows = new Map<string, OwnedSession>();
      for (const value of selected.data) {
        const row = ownedSession(value, ownerId, new Set(batch));
        if (!row || rows.has(row.id)) throw new Error("La sélection des conversations a changé.");
        rows.set(row.id, row);
      }
      for (const id of batch) {
        guardCurrent(isCurrent, result);
        const row = rows.get(id);
        if (!row) {
          // Idempotent retry also cleans an orphaned deterministic audio file
          // when the earlier row DELETE succeeded but its response was lost.
          result.missingSessionIds.push(id);
          await cleanupAudio(client, ownerId, id, null, isCurrent, result);
          continue;
        }
        const anchor = anchors.get(id) ?? { sessionId: id, clientId: row.client_id, tripId: row.trip_id };
        if ((requirePassSnapshot && !capturedPasses.has(id))
          || !canDeleteWorkspaceSession({ status: row.status, updatedAt: row.updated_at }, Date.now())
          || row.client_id !== anchor.clientId || row.trip_id !== anchor.tripId) {
          result.skippedSessionIds.push(id);
          continue;
        }
        // The assignment and lifecycle gates are also SQL predicates: a move,
        // resumed recording or processing transition after SELECT stays safe.
        let query = client.from("sessions").delete().eq("id", id).eq("owner_id", ownerId);
        if (row.status === null) query = query.is("status", null);
        else if (row.status !== undefined) query = query.eq("status", row.status);
        if (processingCheckpoint(row.status)) {
          query = row.updated_at === undefined || row.updated_at === null ? query.is("updated_at", null)
            : query.eq("updated_at", row.updated_at).lt("updated_at", new Date(Date.now() - REPRISE.TRAITEMENT_FRAIS_MS).toISOString());
        }
        query = anchor.clientId === null ? query.is("client_id", null) : query.eq("client_id", anchor.clientId);
        query = anchor.tripId === null ? query.is("trip_id", null) : query.eq("trip_id", anchor.tripId);
        if (requirePassSnapshot) {
          const captured = capturedPasses.get(id)!;
          // A save after relocation must keep its recording and audio, even if
          // the SELECT above has already observed that new journey revision.
          query = captured === null ? query.is("passes", null) : query.eq("passes", captured);
        }
        const deleted = await query.select("id,owner_id,audio_ref");
        if (deleted.error) throw deleted.error;
        if (!Array.isArray(deleted.data)) throw new Error("La suppression ne peut pas être vérifiée.");
        if (!deleted.data.length) result.skippedSessionIds.push(id);
        else {
          const committed = record(deleted.data[0]);
          if (deleted.data.length !== 1 || !committed || committed.id !== id || committed.owner_id !== ownerId) {
            throw new Error("La suppression renvoie une conversation inattendue.");
          }
          result.deletedSessionIds.push(id);
          guardCurrent(isCurrent, result);
          await cleanupAudio(client, ownerId, id, committed.audio_ref, isCurrent, result);
        }
        guardCurrent(isCurrent, result);
      }
    }
    return result;
  } catch (error) {
    if (error instanceof WorkspaceDeletionError) throw error;
    throw new WorkspaceDeletionError(errorMessage(error), result);
  }
}

export type FolderDeletionCode = "invalid_request" | "not_found" | "shared_folder" | "scope_changed" | "busy" | "too_large" | "audio_cleanup" | "deletion_failed";

export class FolderDeletionError extends WorkspaceDeletionError {
  readonly code: FolderDeletionCode;
  readonly status: number;
  constructor(code: FolderDeletionCode, result: WorkspaceDeletionResult, status = 409) {
    super(code, result);
    this.name = "FolderDeletionError";
    this.code = code;
    this.status = status;
  }
}

export type FolderDeletionRequest = {
  ownerId: string;
  agencyId: string;
  clientId: string;
  tripId?: string | null;
  /** The confirmation covers these identities, never a later attached recording. */
  expectedSessionIds: readonly string[];
};

/**
 * Server-only use with an admin client: owner-only RLS cannot reveal another
 * advisor's recording in an agency-shared folder. No foreign row is deleted or
 * intentionally detached. REST and Storage cannot form one transaction, so a
 * narrow new-session-FK-attachment race remains between the last read and trip
 * DELETE. An atomic locking RPC is needed to remove that platform limitation.
 * The principal client is agency-level and never belongs solely to this folder.
 */
export async function deleteFolderWithSessions(
  client: DeletionClient,
  request: FolderDeletionRequest,
  isCurrent: CurrentScope = () => true,
): Promise<WorkspaceDeletionResult> {
  const result = emptyResult();
  const stop: (code: FolderDeletionCode, status?: number) => never = (code, status = 409) => { throw new FolderDeletionError(code, result, status); };
  const merge = (committed: WorkspaceDeletionResult) => {
    for (const key of ["deletedSessionIds", "missingSessionIds", "skippedSessionIds", "detachedSessionIds"] as const) {
      result[key] = [...new Set([...result[key], ...committed[key]])];
    }
    result.audioCleanupFailures.push(...committed.audioCleanupFailures);
  };
  try {
    const { ownerId, agencyId, clientId } = request;
    const capturedIds = request.expectedSessionIds;
    const tripId = request.tripId ?? null;
    if (![ownerId, agencyId, clientId].every(identifier) || !nullableIdentifier(tripId)
      || !Array.isArray(capturedIds) || capturedIds.length > MAX_WORKSPACE_DELETE_SESSIONS
      || capturedIds.some((id) => !identifier(id)) || new Set(capturedIds).size !== capturedIds.length) stop("invalid_request", 400);
    const expectedSessionIds = [...capturedIds];
    const expected = new Set(expectedSessionIds);
    guardCurrent(isCurrent, result);
    const foundClient = await client.from("clients").select("id,agency_id").eq("id", clientId).maybeSingle();
    guardCurrent(isCurrent, result);
    if (foundClient.error) throw foundClient.error;
    const clientRow = record(foundClient.data);
    if (foundClient.data !== null && !clientRow) stop("not_found", 404);
    if (clientRow && (clientRow.id !== clientId || clientRow.agency_id !== agencyId)) stop("not_found", 404);
    let tripRow: Record<string, unknown> | null = null;
    if (tripId) {
      const foundTrip = await client.from("trips").select("id,client_id,updated_at").eq("id", tripId).maybeSingle();
      guardCurrent(isCurrent, result);
      if (foundTrip.error) throw foundTrip.error;
      tripRow = record(foundTrip.data);
      if (foundTrip.data !== null && !tripRow) stop("scope_changed");
      if (tripRow && (tripRow.id !== tripId || tripRow.client_id !== clientId || !clientRow)) stop("scope_changed");
    }
    const readScope = async (): Promise<(OwnedSession & { passes: unknown })[]> => {
      guardCurrent(isCurrent, result);
      // Inspect all owners here, and validate every row below. Mutations remain
      // owner-scoped. A trip FK may exist independently of its client FK.
      const queryScope = (columns: string) => {
        let query = client.from("sessions").select(columns, { count: "exact" });
        query = tripId === null ? query.eq("client_id", clientId).is("trip_id", null) : query.eq("trip_id", tripId);
        return query.order("id", { ascending: true }).limit(MAX_WORKSPACE_DELETE_SESSIONS + 1);
      };
      let selected = await queryScope("id,owner_id,client_id,trip_id,status,updated_at,audio_ref,passes");
      if (selected.error?.code === "42703" && /\b(?:status|updated_at|passes)\b/.test(selected.error.message)) {
        selected = await queryScope("*");
      }
      guardCurrent(isCurrent, result);
      if (selected.error) throw selected.error;
      if (!Array.isArray(selected.data) || selected.count === null || selected.count !== selected.data.length) stop("too_large", 413);
      if (selected.data.length > MAX_WORKSPACE_DELETE_SESSIONS) stop("too_large", 413);
      const seen = new Set<string>();
      const rows: (OwnedSession & { passes: unknown })[] = [];
      for (const value of selected.data) {
        const row = record(value);
        if (!row || !identifier(row.id) || seen.has(row.id)) stop("scope_changed");
        if (row.owner_id !== ownerId) stop("shared_folder");
        if (row.client_id !== clientId || row.trip_id !== tripId) stop("scope_changed");
        if (!canDeleteWorkspaceSession({ status: row.status, updatedAt: row.updated_at }, Date.now())) stop("busy");
        if (!expected.has(row.id)) stop("scope_changed");
        // Original pre-passes schemas can still delete ordinary recordings.
        if (row.passes !== undefined) encodePassSnapshot(row.passes);
        seen.add(row.id);
        rows.push(row as OwnedSession & { passes: unknown });
      }
      return rows;
    };
    const scoped = await readScope();
    if (!clientRow && scoped.length) stop("not_found", 404);
    // Reject an already moved captured recording before deleting any sibling.
    for (let offset = 0; offset < expectedSessionIds.length; offset += SESSION_BATCH_SIZE) {
      const batch = expectedSessionIds.slice(offset, offset + SESSION_BATCH_SIZE);
      const selected = await client.from("sessions").select("id,owner_id,client_id,trip_id")
        .eq("owner_id", ownerId).in("id", batch);
      guardCurrent(isCurrent, result);
      if (selected.error) throw selected.error;
      if (!Array.isArray(selected.data)) stop("scope_changed");
      for (const value of selected.data) {
        const row = ownedSession(value, ownerId, new Set(batch));
        if (!row || row.client_id !== clientId || row.trip_id !== tripId) stop("scope_changed");
      }
    }
    const hasPasses = scoped.every((row) => row.passes !== undefined);
    try {
      merge(await deleteOwnedSessions(client, {
        ownerId, sessionIds: expectedSessionIds,
        expectedAssignments: expectedSessionIds.map((sessionId) => ({ sessionId, clientId, tripId })),
        ...(hasPasses ? { expectedPassSnapshots: scoped.map((row) => ({ sessionId: row.id, passes: row.passes })) } : {}),
      }, isCurrent));
    } catch (caught) {
      if (caught instanceof WorkspaceDeletionError) merge(caught.result);
      throw caught;
    }
    if (result.skippedSessionIds.length) stop("scope_changed");
    if (result.audioCleanupFailures.length) stop("audio_cleanup", 502);
    // A newly attached, resumed, shared or changed member stops the folder
    // DELETE. It is never implicitly converted into an unassigned recording.
    if ((await readScope()).length) stop("scope_changed");
    if (tripId) {
      guardCurrent(isCurrent, result);
      let deletion = client.from("trips").delete().eq("id", tripId).eq("client_id", clientId);
      if (typeof tripRow?.updated_at === "string") deletion = deletion.eq("updated_at", tripRow.updated_at);
      const deleted = await deletion.select("id,client_id");
      if (deleted.error) throw deleted.error;
      if (!Array.isArray(deleted.data) || deleted.data.some((value) => value.id !== tripId || value.client_id !== clientId)) stop("scope_changed");
      if (tripRow && !deleted.data.length) stop("scope_changed");
      result.deletedTripId = tripId;
      guardCurrent(isCurrent, result);
    }
    // Keep the agency-level principal client. A REST emptiness check cannot
    // safely prevent a new unrelated trip from attaching before client DELETE.
    return result;
  } catch (caught) {
    if (caught instanceof FolderDeletionError) throw caught;
    throw new FolderDeletionError("deletion_failed", result, 500);
  }
}
