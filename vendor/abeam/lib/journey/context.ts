import { conversationBookmarksFromPasses } from "../conversation/bookmarks.ts";
import { MAX_FOLDER_AGENT_CONTEXT_CHARACTERS } from "../review/folder-agent-context.ts";
import { FolderJourneyError } from "./errors.ts";
import type { FolderJourneyState } from "./persistence.ts";

/** Bounded excerpts from every included conversation plus actual saved bookmark metadata. */
export function buildJourneyGenerationContext(state: FolderJourneyState): { text: string; evidence: Map<string, string[]>; truncated: boolean } {
  const document = JSON.parse(state.context.context) as { conversations: Array<{ session_id: string; transcript_excerpt: string; excerpt_truncated: boolean }>; merged_brief?: unknown; merged_brief_excerpt?: unknown; merged_brief_truncated?: boolean; bookmarks?: unknown[]; bookmark_evidence_truncated?: boolean };
  const bookmarks: Array<{ session_id: string; type: string; title: string; subtitle?: string; badge?: string; items: Array<{ title: string; detail?: string; note?: string }> }> = [];
  let count = 0;
  let shortenedBookmarks = false;
  for (const member of state.members) for (const card of conversationBookmarksFromPasses(member.passes)) {
    count++;
    if (bookmarks.length >= 12) continue;
    shortenedBookmarks ||= card.titre.length > 160 || (card.sousTitre?.length ?? 0) > 240 || (card.badge?.length ?? 0) > 120 || card.items.length > 3
      || card.items.slice(0, 3).some((item) => item.titre.length > 160 || (item.detail?.length ?? 0) > 240 || (item.note?.length ?? 0) > 120);
    bookmarks.push({ session_id: member.id, type: card.type, title: card.titre.slice(0, 160), subtitle: card.sousTitre?.slice(0, 240), badge: card.badge?.slice(0, 120),
      items: card.items.slice(0, 3).map((item) => ({ title: item.titre.slice(0, 160), detail: item.detail?.slice(0, 240), note: item.note?.slice(0, 120) })) });
  }
  document.bookmarks = bookmarks; document.bookmark_evidence_truncated = count > bookmarks.length || shortenedBookmarks;
  const serialize = () => JSON.stringify(document).replace(/[<>&]/g, (character) => ({ "<": "\\u003c", ">": "\\u003e", "&": "\\u0026" })[character]!);
  let truncated = state.context.truncated || count > bookmarks.length;
  if (serialize().length > MAX_FOLDER_AGENT_CONTEXT_CHARACTERS) {
    truncated = true;
    document.conversations.forEach((conversation) => {
      if (conversation.transcript_excerpt.length > 256) {
        conversation.transcript_excerpt = `${conversation.transcript_excerpt.slice(0, 128)}\n[…]\n${conversation.transcript_excerpt.slice(-128)}`;
        conversation.excerpt_truncated = true;
      }
    });
  }
  if (serialize().length > MAX_FOLDER_AGENT_CONTEXT_CHARACTERS) {
    const brief = JSON.stringify(document.merged_brief ?? document.merged_brief_excerpt ?? null);
    document.merged_brief = null; document.merged_brief_excerpt = brief.slice(0, 8000); document.merged_brief_truncated = true;
  }
  while (serialize().length > MAX_FOLDER_AGENT_CONTEXT_CHARACTERS && bookmarks.length) { bookmarks.pop(); document.bookmark_evidence_truncated = true; }
  const text = serialize();
  if (text.length > MAX_FOLDER_AGENT_CONTEXT_CHARACTERS) throw new FolderJourneyError(413, "Le contexte du parcours est trop volumineux.");
  const evidence = new Map(document.conversations.map((conversation) => [conversation.session_id, [conversation.transcript_excerpt]]));
  for (const bookmark of bookmarks) evidence.set(bookmark.session_id, [...(evidence.get(bookmark.session_id) ?? []), bookmark.title, bookmark.subtitle ?? "", bookmark.badge ?? "", ...bookmark.items.map((item) => [item.title, item.detail, item.note].filter(Boolean).join("\n"))]);
  return { text, evidence, truncated: truncated || Boolean(document.bookmark_evidence_truncated) || Boolean(document.merged_brief_truncated) };
}
