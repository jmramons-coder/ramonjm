/** Publish only processed fields: filing edits and newer sessions remain intact. */
export function applyBackgroundResult<T extends {
  id: string; transcript: unknown; summary: unknown; audioRef?: string | null; status?: string;
}>(sessions: readonly T[], sessionId: string, result: Pick<T, "transcript" | "summary" | "audioRef" | "status">): T[] {
  return sessions.map((session) => session.id === sessionId ? { ...session, ...result } : session);
}
