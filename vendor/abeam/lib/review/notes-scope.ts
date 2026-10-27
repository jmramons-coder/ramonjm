function uniqueSessionIds(value: unknown): Set<string> | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const ids = new Set<string>();
  for (const id of value) {
    if (typeof id !== "string" || !id.trim() || id.trim() !== id || ids.has(id)) return null;
    ids.add(id);
  }
  return ids;
}

/** A note is current only when its actual source covers the exact requested scope. */
export function notesSourceCoversScope(
  source: unknown,
  expectedSessionIds: readonly string[],
  scope: "session" | "dossier",
): boolean {
  if ((scope !== "session" && scope !== "dossier") || !source || typeof source !== "object" || Array.isArray(source)) return false;
  const metadata = source as Record<string, unknown>;
  if (metadata.portee !== scope) return false;

  const expected = uniqueSessionIds(expectedSessionIds);
  const actual = uniqueSessionIds(metadata.sessions);
  if (!expected || !actual || actual.size !== expected.size) return false;
  if (scope === "session" && actual.size !== 1) return false;
  if (!Number.isInteger(metadata.conversations) || metadata.conversations !== actual.size) return false;
  return [...actual].every((id) => expected.has(id));
}
