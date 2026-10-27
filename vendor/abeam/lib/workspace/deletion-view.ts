/** Apply committed deletions to the current screen, never the screen captured when the request started. */
export type DeletionViewSelection = {
  view: string;
  folderKey: string;
  sessionId: string;
  detailSessionId: string;
  assignmentSessionId: string;
  audioSessionId: string;
};

export function deletionViewEffects(current: DeletionViewSelection, removed: ReadonlySet<string>, deletedFolderKey: string | null) {
  const leaveFolder = Boolean(deletedFolderKey && current.view === "review" && current.folderKey === deletedFolderKey);
  return {
    leaveFolder,
    clearSession: leaveFolder || removed.has(current.sessionId),
    clearDetail: leaveFolder || removed.has(current.detailSessionId),
    clearAssignment: removed.has(current.assignmentSessionId),
    clearAudio: leaveFolder || removed.has(current.audioSessionId),
  };
}
