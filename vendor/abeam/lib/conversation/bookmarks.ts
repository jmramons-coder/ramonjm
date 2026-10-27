import type { SupabaseClient } from "@supabase/supabase-js";
import { cardIdentity, type LiveFeedCard } from "../live/feed.ts";
import { publicHttpsUrl, safeFlightSegments } from "../product-search/offer-metadata.ts";
import { conversationFlightSearchUrl } from "./offer-link.ts";
import type { SuggestionCard, SuggestionItem } from "../suggestions/engine.ts";

export const CONVERSATION_BOOKMARKS_KEY = "conversation_bookmarks_v1";
export const MAX_CONVERSATION_BOOKMARKS = 24;
const MAX_ITEMS = 8;
const MAX_IMAGES = 6;
const MAX_ATTEMPTS = 3;
type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null ? value as UnknownRecord : null;
}

function text(value: unknown, limit: number): string | undefined {
  return typeof value === "string" ? value.trim().slice(0, limit) || undefined : undefined;
}

function normalizeItem(value: unknown, type: "vols" | "hotels"): SuggestionItem | null {
  const item = record(value);
  if (!item) return null;
  const titre = text(item.titre, 240);
  if (!titre) return null;
  const images = Array.isArray(item.images)
    ? [...new Set(item.images.slice(0, 24).map(publicHttpsUrl).filter((url): url is string => Boolean(url)))].slice(0, MAX_IMAGES)
    : [];
  const detail = text(item.detail, 1200);
  const prix = text(item.prix, 120);
  const note = text(item.note, 240);
  const image = publicHttpsUrl(item.image);
  const lien = publicHttpsUrl(item.lien);
  const lienRecherche = conversationFlightSearchUrl(item.lienRecherche);
  const segments = type === "vols" ? safeFlightSegments(item.segments) : [];
  return { titre, ...(detail ? { detail } : {}), ...(prix ? { prix } : {}), ...(note ? { note } : {}),
    ...(image ? { image } : {}), ...(images.length ? { images } : {}), ...(lien ? { lien } : {}), ...(lienRecherche ? { lienRecherche } : {}), ...(segments.length ? { segments } : {}) };
}

/** Stored JSON and browser drafts are untrusted: keep a bounded public offer snapshot. */
export function normalizeConversationBookmarks(value: unknown): SuggestionCard[] {
  if (!Array.isArray(value)) return [];
  const cards: LiveFeedCard[] = [];
  const seen = new Set<string>();
  for (const raw of value.slice(0, 96)) {
    const card = record(raw);
    if (!card || (card.type !== "vols" && card.type !== "hotels")
      || (card.audience !== undefined && card.audience !== "client")) continue;
    const id = text(card.id, 180);
    const titre = text(card.titre, 240);
    if (!id || !titre || !Array.isArray(card.items)) continue;
    const type = card.type;
    const items = card.items.slice(0, 32).map((item) => normalizeItem(item, type)).filter((item): item is SuggestionItem => Boolean(item)).slice(0, MAX_ITEMS);
    if (!items.length) continue;
    const sousTitre = text(card.sousTitre, 480);
    const badge = text(card.badge, 120);
    const source = text(card.source, 160) ?? "";
    const priorite = typeof card.priorite === "number" && Number.isFinite(card.priorite)
      && card.priorite >= 0 && card.priorite <= 10 ? card.priorite : 2;
    const majAt = typeof card.majAt === "string" && card.majAt.length <= 40 && Number.isFinite(Date.parse(card.majAt)) ? card.majAt : undefined;
    const majCount = typeof card.majCount === "number" && Number.isSafeInteger(card.majCount) && card.majCount >= 0 ? card.majCount : undefined;
    const normalized: LiveFeedCard = { id, type: card.type, ...(card.audience === "client" ? { audience: "client" as const } : {}),
      priorite, titre, ...(sousTitre ? { sousTitre } : {}), ...(badge ? { badge } : {}), items, source,
      ...(majAt ? { majAt } : {}), ...(majCount !== undefined ? { majCount } : {}) };
    const identity = cardIdentity(normalized);
    if (seen.has(identity)) continue;
    seen.add(identity);
    cards.push(normalized);
    if (cards.length === MAX_CONVERSATION_BOOKMARKS) break;
  }
  return cards;
}

export function conversationBookmarksFromPasses(value: unknown): SuggestionCard[] {
  const passes = record(value);
  return normalizeConversationBookmarks(passes && Object.hasOwn(passes, CONVERSATION_BOOKMARKS_KEY) ? passes[CONVERSATION_BOOKMARKS_KEY] : undefined);
}

export type ConversationBookmarkMutation =
  | { type: "set"; card: SuggestionCard }
  | { type: "remove"; identity: string }
  | { type: "replace"; cards: readonly SuggestionCard[] }
  | { type: "sync"; previous: readonly SuggestionCard[]; cards: readonly SuggestionCard[] };

export function applyConversationBookmarkMutation(previous: unknown, mutation: ConversationBookmarkMutation): SuggestionCard[] {
  const cards = normalizeConversationBookmarks(previous);
  if (mutation.type === "replace") return normalizeConversationBookmarks(mutation.cards);
  if (mutation.type === "sync") {
    const baseline = new Map(normalizeConversationBookmarks(mutation.previous).map((card) => [cardIdentity(card), card]));
    const next = new Map(normalizeConversationBookmarks(mutation.cards).map((card) => [cardIdentity(card), card]));
    const removed = new Set([...baseline.keys()].filter((identity) => !next.has(identity)));
    let merged = cards.filter((card) => !removed.has(cardIdentity(card)));
    for (const [identity, card] of next) {
      if (JSON.stringify(baseline.get(identity)) === JSON.stringify(card)) continue;
      merged = applyConversationBookmarkMutation(merged, { type: "set", card });
    }
    return merged;
  }
  if (mutation.type === "remove") return cards.filter((card) => cardIdentity(card) !== mutation.identity);
  const card = normalizeConversationBookmarks([mutation.card])[0];
  if (!card) throw new Error("Cette offre ne peut pas être ajoutée aux signets.");
  const identity = cardIdentity(card);
  const index = cards.findIndex((candidate) => cardIdentity(candidate) === identity);
  if (index >= 0) return cards.map((candidate, position) => position === index ? card : candidate);
  if (cards.length >= MAX_CONVERSATION_BOOKMARKS) throw new Error(`Cette conversation contient déjà ${MAX_CONVERSATION_BOOKMARKS} signets.`);
  return [...cards, card];
}

/** Merge only our namespace; unrelated pass results and lifecycle fields are never written. */
export async function persistConversationBookmarks(
  client: Pick<SupabaseClient, "from">,
  sessionId: string,
  ownerId: string,
  mutation: ConversationBookmarkMutation,
  isCurrent: () => boolean = () => true,
): Promise<SuggestionCard[]> {
  if (!sessionId || !ownerId) throw new Error("Cette conversation n’est plus disponible.");
  // Capture owned snapshots before the first await. A caller's later edits
  // cannot silently change the operation while a CAS attempt is pending.
  const captured: ConversationBookmarkMutation = mutation.type === "set"
    ? { type: "set", card: normalizeConversationBookmarks([mutation.card])[0] ?? mutation.card }
    : mutation.type === "remove" ? { ...mutation }
    : mutation.type === "replace" ? { type: "replace", cards: normalizeConversationBookmarks(mutation.cards) }
    : { type: "sync", previous: normalizeConversationBookmarks(mutation.previous), cards: normalizeConversationBookmarks(mutation.cards) };
  if (captured.type === "set" && !normalizeConversationBookmarks([captured.card]).length) throw new Error("Cette offre ne peut pas être ajoutée aux signets.");
  const assertCurrent = () => { if (!isCurrent()) throw new Error("La conversation a changé pendant la sauvegarde des signets."); };
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    assertCurrent();
    const existing = await client.from("sessions").select("id, passes")
      .eq("id", sessionId).eq("owner_id", ownerId).maybeSingle();
    assertCurrent();
    if (existing.error) throw new Error(existing.error.message);
    if (!existing.data) throw new Error("Cette conversation n’est plus disponible.");
    const previous: unknown = existing.data.passes;
    if (previous !== null && !record(previous)) throw new Error("Les résultats enregistrés sont invalides. Les signets n’ont pas été modifiés.");
    const cards = applyConversationBookmarkMutation(conversationBookmarksFromPasses(previous), captured);
    const passes = { ...record(previous), [CONVERSATION_BOOKMARKS_KEY]: cards };
    assertCurrent();
    const update = client.from("sessions").update({ passes }).eq("id", sessionId).eq("owner_id", ownerId);
    const compare = previous === null ? update.is("passes", null) : update.eq("passes", JSON.stringify(previous));
    const committed = await compare.select("id").maybeSingle();
    assertCurrent();
    if (committed.error) throw new Error(committed.error.message);
    if (committed.data?.id === sessionId) return cards;
  }
  throw new Error("Les signets ont changé pendant la sauvegarde. Réessayez dans un instant.");
}
