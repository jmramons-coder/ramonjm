import type { SuggestionItem } from "../suggestions/engine.ts";
import { normalizeConversationBookmarks } from "../conversation/bookmarks.ts";

export const FOLDER_JOURNEY_KEY = "folder_journey_v1";
export const MAX_JOURNEY_ENTRIES = 60;
export type JourneyEntry = {
  id: string;
  phase: "before" | "during" | "after";
  kind: "task" | "flight" | "stay" | "moment";
  title: string;
  detail?: string;
  dayLabel?: string;
  dateLabel?: string;
  done: boolean;
  origin: "ai" | "bookmark" | "manual";
  sourceSessionIds: string[];
  placement?: "stop" | "day";
  ordinal?: number;
  offer?: { type: "vols" | "hotels"; item: SuggestionItem };
};
export type FolderJourney = {
  version: 1;
  clientId: string;
  tripId: string | null;
  entries: JourneyEntry[];
  generatedSourceSignature: string;
  updatedAt: string;
  revision: number;
};
export type JourneyMutation = { type: "upsert"; entry: JourneyEntry } | { type: "toggle"; id: string; done: boolean } | { type: "remove"; id: string };
export type FolderJourneySource = { signature: string; conversationCount: number; includedCount: number; truncated: boolean };
export type FolderJourneyResponse = { journey: FolderJourney | null; source: FolderJourneySource; anchorSessionId: string };

/** Evidence/citations are excluded so added sources do not reset completion. */
export function journeySemanticKey(entry: Pick<JourneyEntry, "phase" | "kind" | "title">): string {
  return JSON.stringify([entry.phase, entry.kind, entry.title.normalize("NFKC").toLocaleLowerCase("en").trim()]);
}

export function journeyIdentifier(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,180}$/.test(value);
}
export function journeyRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function string(value: unknown, max: number, optional = false): string | undefined {
  if (optional && value === undefined) return undefined;
  return typeof value === "string" && value.trim().length > 0 && value.length <= max ? value.trim() : undefined;
}

export function parseJourneyEntry(value: unknown): JourneyEntry | null {
  const raw = journeyRecord(value);
  if (!raw || !journeyIdentifier(raw.id) || typeof raw.phase !== "string" || !["before", "during", "after"].includes(raw.phase)
    || typeof raw.kind !== "string" || !["task", "flight", "stay", "moment"].includes(raw.kind)
    || typeof raw.origin !== "string" || !["ai", "bookmark", "manual"].includes(raw.origin)
    || typeof raw.done !== "boolean" || !Array.isArray(raw.sourceSessionIds) || raw.sourceSessionIds.length > 100
    || raw.sourceSessionIds.some((id) => !journeyIdentifier(id))) return null;
  const title = string(raw.title, 160);
  if (!title) return null;
  const fields: Record<string, string> = {};
  for (const [key, limit] of [["detail", 1200], ["dayLabel", 80], ["dateLabel", 160]] as const) {
    if (raw[key] === undefined || raw[key] === "") continue;
    const text = string(raw[key], limit, true);
    if (!text) return null;
    fields[key] = text;
  }
  if (raw.placement !== undefined && raw.placement !== "stop" && raw.placement !== "day") return null;
  if (raw.ordinal !== undefined && (!Number.isSafeInteger(raw.ordinal) || Number(raw.ordinal) < 1 || Number(raw.ordinal) > 99)) return null;
  const offer = journeyRecord(raw.offer);
  let safeOffer: JourneyEntry["offer"];
  if (raw.offer !== undefined) {
    if (!offer || (offer.type !== "vols" && offer.type !== "hotels")) return null;
    const item = normalizeConversationBookmarks([{ id: "journey-offer", type: offer.type, titre: title, items: [offer.item], source: "" }])[0]?.items[0];
    if (!item) return null;
    safeOffer = { type: offer.type, item };
  }
  return { id: raw.id, phase: raw.phase as JourneyEntry["phase"], kind: raw.kind as JourneyEntry["kind"], title, ...fields,
    done: raw.done, origin: raw.origin as JourneyEntry["origin"], sourceSessionIds: [...new Set(raw.sourceSessionIds)] as string[],
    ...(raw.placement ? { placement: raw.placement as JourneyEntry["placement"] } : {}),
    ...(raw.ordinal !== undefined ? { ordinal: Number(raw.ordinal) } : {}), ...(safeOffer ? { offer: safeOffer } : {}) };
}

export function parseFolderJourney(value: unknown): FolderJourney | null {
  const raw = journeyRecord(value);
  if (!raw || raw.version !== 1 || !journeyIdentifier(raw.clientId) || (raw.tripId !== null && !journeyIdentifier(raw.tripId))
    || !Array.isArray(raw.entries) || raw.entries.length > MAX_JOURNEY_ENTRIES || !Number.isSafeInteger(raw.revision) || Number(raw.revision) < 1
    || typeof raw.generatedSourceSignature !== "string" || raw.generatedSourceSignature.length > 128
    || typeof raw.updatedAt !== "string" || raw.updatedAt.length > 40 || !Number.isFinite(Date.parse(raw.updatedAt))) return null;
  const entries = raw.entries.map(parseJourneyEntry);
  if (entries.some((entry) => !entry) || new Set(entries.map((entry) => entry!.id)).size !== entries.length) return null;
  return { version: 1, clientId: raw.clientId, tripId: raw.tripId as string | null, entries: entries as JourneyEntry[],
    generatedSourceSignature: raw.generatedSourceSignature, updatedAt: raw.updatedAt, revision: Number(raw.revision) };
}

export function parseFolderJourneyResponse(value: unknown): FolderJourneyResponse | null {
  const raw = journeyRecord(value);
  const source = journeyRecord(raw?.source);
  if (!raw || !source || !journeyIdentifier(raw.anchorSessionId) || typeof source.signature !== "string" || !source.signature || source.signature.length > 128
    || !Number.isSafeInteger(source.conversationCount) || !Number.isSafeInteger(source.includedCount)
    || Number(source.includedCount) < 0 || Number(source.conversationCount) < Number(source.includedCount) || typeof source.truncated !== "boolean") return null;
  const journey = raw.journey === null ? null : parseFolderJourney(raw.journey);
  if (raw.journey !== null && !journey) return null;
  return { journey, source: { signature: source.signature, conversationCount: Number(source.conversationCount), includedCount: Number(source.includedCount), truncated: source.truncated }, anchorSessionId: raw.anchorSessionId };
}
