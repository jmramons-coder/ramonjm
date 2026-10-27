import { MAX_WORKSPACE_DELETE_SESSIONS, WorkspaceDeletionError, type FolderDeletionCode, type WorkspaceDeletionResult } from "./deletion.ts";

export type FolderDeleteClientOptions = {
  ownerId: string;
  clientId: string;
  tripId: string | null;
  sessionIds: readonly string[];
  language: "fr" | "en";
  getAccessSession: () => Promise<{ ownerId: string; accessToken: string } | null>;
  isCurrent?: () => boolean;
};
export type FolderDeleteClientCode = FolderDeletionCode | "unauthenticated" | "invalid_response";

/** The caller can apply acknowledged progress even when a later step failed. */
export class FolderDeleteClientError extends WorkspaceDeletionError {
  readonly code: FolderDeleteClientCode;
  constructor(message: string, result: WorkspaceDeletionResult, code: FolderDeleteClientCode) {
    super(message, result);
    this.name = "FolderDeleteClientError";
    this.code = code;
  }
}

const SERVER_CODES = new Set<FolderDeleteClientCode>(["invalid_request", "not_found", "shared_folder", "scope_changed", "busy", "too_large", "audio_cleanup", "deletion_failed", "unauthenticated"]);
const emptyResult = (): WorkspaceDeletionResult => ({ deletedSessionIds: [], missingSessionIds: [], skippedSessionIds: [], audioCleanupFailures: [], detachedSessionIds: [], deletedTripId: null, deletedClientId: null });
const identifier = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9_-]{1,180}$/.test(value);
const record = (value: unknown): Record<string, unknown> | null => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

/** Messages are plain bounded UI copy, never HTML or transport diagnostics. */
function safeMessage(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 600 || /[<>\u0000-\u001f\u007f]|https?:\/\//i.test(value)) return null;
  return value.trim() || null;
}

function parseResult(value: unknown, requested: ReadonlySet<string>, tripId: string | null, audioMessage: string): WorkspaceDeletionResult | null {
  const raw = record(value);
  if (!raw || !Array.isArray(raw.detachedSessionIds) || raw.detachedSessionIds.length
    || raw.deletedClientId !== null
    || (raw.deletedTripId !== null && (tripId === null || raw.deletedTripId !== tripId))) return null;
  const progress = new Set<string>();
  const ids = (value: unknown): string[] | null => {
    if (!Array.isArray(value) || value.length > requested.size) return null;
    const result: string[] = [];
    for (const id of value) {
      if (!identifier(id) || !requested.has(id) || progress.has(id)) return null;
      progress.add(id); result.push(id);
    }
    return result;
  };
  const deletedSessionIds = ids(raw.deletedSessionIds);
  const missingSessionIds = ids(raw.missingSessionIds);
  const skippedSessionIds = ids(raw.skippedSessionIds);
  if (!deletedSessionIds || !missingSessionIds || !skippedSessionIds || !Array.isArray(raw.audioCleanupFailures) || raw.audioCleanupFailures.length > requested.size) return null;
  const cleaned = new Set([...deletedSessionIds, ...missingSessionIds]);
  const failed = new Set<string>();
  const audioCleanupFailures: WorkspaceDeletionResult["audioCleanupFailures"] = [];
  for (const value of raw.audioCleanupFailures) {
    const failure = record(value);
    if (!failure || !identifier(failure.sessionId) || !requested.has(failure.sessionId) || !cleaned.has(failure.sessionId)
      || failed.has(failure.sessionId) || typeof failure.message !== "string") return null;
    failed.add(failure.sessionId);
    audioCleanupFailures.push({ sessionId: failure.sessionId, message: safeMessage(failure.message) ?? audioMessage });
  }
  return { deletedSessionIds, missingSessionIds, skippedSessionIds, audioCleanupFailures, detachedSessionIds: [],
    deletedClientId: null, deletedTripId: raw.deletedTripId as string | null };
}

/** A confirmed server cascade; no browser Supabase/Storage mutation or automatic retry. */
export async function deleteFolderFromApi(options: FolderDeleteClientOptions, request: typeof fetch = fetch): Promise<WorkspaceDeletionResult> {
  const fr = options.language === "fr";
  const message = (french: string, english: string) => fr ? french : english;
  const generic = message("La suppression n’a pas pu être terminée. Réessayez.", "Deletion could not be completed. Try again.");
  const invalid = message("La suppression reçue ne peut pas être vérifiée. Rechargez le dossier avant de réessayer.", "The returned deletion could not be verified. Reload the folder before retrying.");
  const current = options.isCurrent ?? (() => true);
  const checkCurrent = () => {
    if (!current()) throw new FolderDeleteClientError(message("Le compte a changé pendant la suppression.", "The account changed during deletion."), emptyResult(), "scope_changed");
  };
  checkCurrent();
  if (!identifier(options.ownerId) || !identifier(options.clientId) || (options.tripId !== null && !identifier(options.tripId))
    || !Array.isArray(options.sessionIds) || options.sessionIds.length > MAX_WORKSPACE_DELETE_SESSIONS
    || options.sessionIds.some((id) => !identifier(id)) || new Set(options.sessionIds).size !== options.sessionIds.length
    || (options.language !== "fr" && options.language !== "en")) {
    throw new FolderDeleteClientError(message("La sélection du dossier est invalide.", "The folder selection is invalid."), emptyResult(), "invalid_request");
  }
  const captured = Object.freeze({ ownerId: options.ownerId, clientId: options.clientId, tripId: options.tripId,
    sessionIds: Object.freeze([...options.sessionIds]), language: options.language });
  const getAccessSession = options.getAccessSession;
  const body = JSON.stringify({ clientId: captured.clientId, tripId: captured.tripId, expectedSessionIds: captured.sessionIds, confirmed: true, language: captured.language });
  let session: Awaited<ReturnType<FolderDeleteClientOptions["getAccessSession"]>>;
  try { session = await getAccessSession(); }
  catch { checkCurrent(); throw new FolderDeleteClientError(generic, emptyResult(), "unauthenticated"); }
  checkCurrent();
  if (!session || session.ownerId !== captured.ownerId || typeof session.accessToken !== "string" || !session.accessToken.trim() || /[\r\n]/.test(session.accessToken)) {
    throw new FolderDeleteClientError(message("Reconnectez-vous avant de supprimer ce dossier.", "Sign in again before deleting this folder."), emptyResult(), "unauthenticated");
  }
  let response: Response;
  checkCurrent();
  try {
    response = await request("/api/folder-delete", { method: "POST", cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${session.accessToken}` }, body });
  } catch {
    checkCurrent();
    throw new FolderDeleteClientError(generic, emptyResult(), "deletion_failed");
  }
  checkCurrent();
  let payload: unknown;
  try { payload = await response.json(); }
  catch { checkCurrent(); throw new FolderDeleteClientError(invalid, emptyResult(), "invalid_response"); }
  checkCurrent();
  const raw = record(payload);
  if (!raw) throw new FolderDeleteClientError(invalid, emptyResult(), "invalid_response");
  const result = Object.hasOwn(raw, "result") ? parseResult(raw.result, new Set(captured.sessionIds), captured.tripId,
    message("Le nettoyage audio doit être repris.", "Audio cleanup needs to be retried.")) : null;
  if (Object.hasOwn(raw, "result") && !result) throw new FolderDeleteClientError(invalid, emptyResult(), "invalid_response");
  if (!response.ok) {
    const code = typeof raw.code === "string" && SERVER_CODES.has(raw.code as FolderDeleteClientCode) ? raw.code as FolderDeleteClientCode : "deletion_failed";
    throw new FolderDeleteClientError(safeMessage(raw.error) ?? generic, result ?? emptyResult(), code);
  }
  if (!result || result.skippedSessionIds.length || result.audioCleanupFailures.length
    || result.deletedSessionIds.length + result.missingSessionIds.length !== captured.sessionIds.length
    || (captured.tripId !== null && result.deletedTripId !== captured.tripId)) throw new FolderDeleteClientError(invalid, result ?? emptyResult(), "invalid_response");
  return result;
}
