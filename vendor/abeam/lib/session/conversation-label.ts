const CONVERSATION_LABEL = { fr: "Conversation", en: "Conversation" } as const;

type ConversationIdentity = { id: string; createdAt?: string | null };
export type ConversationSequence = ReadonlyMap<string, number>;

/**
 * Build from the account's COMPLETE loaded sessions, including filed rows,
 * before filters or recent-list truncation. This display order is deterministic
 * for the same identities/dates; it is not a persisted conversation identifier.
 * Deletion, older backfilled rows or corrected dates can change these numbers.
 */
export function buildConversationSequence(sessions: readonly ConversationIdentity[]): ConversationSequence {
  const timestamps = new Map<string, number>();
  for (const session of sessions) {
    if (!session.id) continue;
    const parsed = session.createdAt ? Date.parse(session.createdAt) : Number.NaN;
    const timestamp = Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
    // Duplicate projections of the same immutable identity count once. Prefer
    // its earliest valid date, independent of input/database response order.
    timestamps.set(session.id, Math.min(timestamps.get(session.id) ?? Number.POSITIVE_INFINITY, timestamp));
  }
  const ordered = [...timestamps].sort(([aId, aTime], [bId, bTime]) => {
    if (aTime !== bTime) return aTime < bTime ? -1 : 1;
    // Equal/unknown dates use exact IDs, without locale-sensitive comparison,
    // case folding or guessing timestamps from legacy identity formats.
    return aId < bId ? -1 : aId > bId ? 1 : 0;
  });
  return new Map(ordered.map(([id], index) => [id, index + 1]));
}

/** Compact display alias only; retain the full immutable ID for API/copy use. */
export function conversationLabel(id: string, language: "fr" | "en", sequence?: ConversationSequence): string {
  const number = sequence?.get(id);
  return typeof number === "number" && Number.isSafeInteger(number) && number > 0
    ? `${CONVERSATION_LABEL[language]} ${String(number).padStart(3, "0")}`
    : CONVERSATION_LABEL[language];
}
