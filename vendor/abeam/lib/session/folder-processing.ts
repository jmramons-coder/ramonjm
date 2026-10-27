import { decideReprise } from "./reprise.ts";

export type SessionProcessingStage = "saving" | "uploading" | "transcribing" | "analyzing" | "integrating" | "resuming" | "processing";
export type SessionProcessingCheckpoint = "recording" | "audio" | "transcript" | "overview";
export type SessionProcessingOperation = { stage: SessionProcessingStage; completed: SessionProcessingCheckpoint[] };
export type FolderProcessingState = SessionProcessingOperation & { count: number };

type ProcessingSession = { id: string; status?: string | null; updatedAt?: string };
type FolderProcessingInput = {
  sessions: readonly ProcessingSession[];
  operations: Readonly<Record<string, SessionProcessingOperation | undefined>>;
  processingIds: ReadonlySet<string>;
  resumingId: string;
  nowMs: number;
};

const STAGES: ReadonlySet<SessionProcessingStage> = new Set(["saving", "uploading", "transcribing", "analyzing", "integrating", "resuming", "processing"]);
const CHECKPOINTS: readonly SessionProcessingCheckpoint[] = ["recording", "audio", "transcript", "overview"];

/**
 * Present only the caller's currently selected, owner-scoped folder members.
 * An operation records explicit local evidence; its presence alone is not a
 * busy signal. After reload, fresh `traitement` is only a coarse waiting state,
 * not evidence that audio, transcription or overview has completed.
 */
export function folderProcessingState({ sessions, operations, processingIds, resumingId, nowMs }: FolderProcessingInput): FolderProcessingState | null {
  const active = new Map<string, { local: boolean; resuming: boolean }>();
  for (const session of sessions) {
    if (!session.id || active.has(session.id)) continue;
    const resuming = resumingId === session.id;
    const local = processingIds.has(session.id) || resuming;
    const remote = !local && Number.isFinite(nowMs) && decideReprise({
      statut: session.status,
      updatedAtMs: session.updatedAt ? Date.parse(session.updatedAt) : null,
    }, nowMs).etat === "en-traitement";
    if (local || remote) active.set(session.id, { local, resuming });
  }
  if (!active.size) return null;
  // Different conversations may be at unrelated stages. A shared row never
  // borrows one conversation's completed checkpoints for the others.
  if (active.size > 1) return { count: active.size, stage: "processing", completed: [] };
  const [[sessionId, signal]] = active;
  const operation = signal.local && Object.prototype.hasOwnProperty.call(operations, sessionId) ? operations[sessionId] : undefined;
  if (operation && STAGES.has(operation.stage)) {
    return {
      count: 1, stage: operation.stage,
      completed: Array.isArray(operation.completed) ? CHECKPOINTS.filter((checkpoint) => operation.completed.includes(checkpoint)) : [],
    };
  }
  return { count: 1, stage: signal.resuming ? "resuming" : "processing", completed: [] };
}
