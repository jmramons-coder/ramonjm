export type FolderJourneyErrorCode = "invalid_request" | "not_found" | "scope_changed" | "revision_conflict" | "snapshot_conflict" | "invalid_snapshot" | "journey_removal_confirmation" | "storage_unavailable" | "generation_failed" | "too_large";
export class FolderJourneyError extends Error {
  readonly status: 400 | 404 | 409 | 413 | 500 | 502;
  readonly code: FolderJourneyErrorCode;
  constructor(status: FolderJourneyError["status"], message: string, code?: FolderJourneyErrorCode) {
    super(message); this.name = "FolderJourneyError"; this.status = status;
    this.code = code ?? ({ 400: "invalid_request", 404: "not_found", 409: "scope_changed", 413: "too_large", 500: "storage_unavailable", 502: "generation_failed" } as const)[status];
  }
}
