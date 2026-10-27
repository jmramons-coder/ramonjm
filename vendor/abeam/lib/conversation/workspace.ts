import { cardIdentity } from "../live/feed.ts";
import type { DisambiguationProposal } from "../suggestions/disambiguation.ts";
import type { SuggestionCard } from "../suggestions/engine.ts";

export type NudgeThreadItem = {
  id: string;
  from: "agent" | "nudge";
  text: string;
  extraits?: string[];
  kind?: "vigie" | "nudge" | "desamb";
  /** For `kind: "desamb"`, the proposal already contains the exact question. */
  proposition?: DisambiguationProposal;
};

/** Dismissal hides automatic guidance only; the original thread stays intact. */
export function splitConversationMessages(thread: readonly NudgeThreadItem[], dismissedIds: readonly string[] = []): { suggestions: NudgeThreadItem[]; messages: NudgeThreadItem[] } {
  const dismissed = new Set(dismissedIds);
  const suggestions: NudgeThreadItem[] = [];
  const messages: NudgeThreadItem[] = [];
  for (const item of thread) {
    const automatic = item.from === "nudge" && (item.kind === "nudge" || item.kind === "vigie" || item.kind === "desamb");
    if (automatic) {
      if (!dismissed.has(item.id)) suggestions.push(item);
    } else messages.push(item);
  }
  return { suggestions, messages };
}

export function canBookmarkConversationCard(card: SuggestionCard): boolean {
  return (card.type === "vols" || card.type === "hotels") && card.audience !== "agent" && card.items.length > 0;
}

function uniqueOfferCards(cards: readonly SuggestionCard[]): SuggestionCard[] {
  const seen = new Set<string>();
  return cards.filter((card) => {
    if (!canBookmarkConversationCard(card)) return false;
    const identity = cardIdentity(card);
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

/** Bookmark/unbookmark an offer without changing the source conversation feed. */
export function toggleBookmarkedConversationCard(previous: readonly SuggestionCard[], card: SuggestionCard): SuggestionCard[] {
  const bookmarked = uniqueOfferCards(previous);
  if (!canBookmarkConversationCard(card)) return bookmarked;
  const identity = cardIdentity(card);
  return bookmarked.some((candidate) => cardIdentity(candidate) === identity)
    ? bookmarked.filter((candidate) => cardIdentity(candidate) !== identity)
    : [...bookmarked, card];
}

/** Use the current offer snapshot; bookmarks survive eviction from the live feed. */
export function refreshBookmarkedConversationCards(bookmarked: readonly SuggestionCard[], latest: readonly SuggestionCard[]): SuggestionCard[] {
  const current = new Map(uniqueOfferCards(latest).map((card) => [cardIdentity(card), card]));
  return uniqueOfferCards(bookmarked).map((card) => current.get(cardIdentity(card)) ?? card);
}
