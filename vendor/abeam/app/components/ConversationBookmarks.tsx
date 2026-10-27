"use client";

import { Bookmark, ChevronDown } from "lucide-react";
import { useId, useSyncExternalStore, type RefObject } from "react";
import type { LiveFeedCard } from "@/lib/live/feed";
import type { UILanguage } from "@/lib/ui/language";
import { useConversationBookmarkResize } from "@/app/hooks/useConversationBookmarkResize";
import OfferBookmarks from "./OfferBookmarks";

import "./conversation-bookmark-rail.css";

const COMPACT_BOOKMARKS = "(max-width: 1000px)";
function subscribe(listener: () => void) {
  const media = window.matchMedia(COMPACT_BOOKMARKS);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
const compactSnapshot = () => window.matchMedia(COMPACT_BOOKMARKS).matches;
const serverSnapshot = () => true;

export default function ConversationBookmarks({ cards, language, expanded, onExpandedChange, headingRef, onRemove, scopeKey }: {
  cards: LiveFeedCard[];
  language: UILanguage;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  headingRef: RefObject<HTMLElement | null>;
  onRemove?: (card: LiveFeedCard) => void;
  /** Changing account or conversation entry resets the preferred width and drag. */
  scopeKey?: string | number;
}) {
  const compact = useSyncExternalStore(subscribe, compactSnapshot, serverSnapshot);
  const { railRef, width, minWidth, maxWidth, resizing, handleProps } = useConversationBookmarkResize(!compact, scopeKey);
  const listId = useId();
  const label = language === "fr" ? "Signets" : "Bookmarks";
  return <aside ref={railRef} className="conversation-pins conversation-bookmark-rail" aria-label={label} data-resizing={resizing || undefined}>
    {!compact ? <div className="conversation-bookmark-resizer" role="separator" aria-orientation="vertical" tabIndex={0}
      aria-label={language === "fr" ? "Redimensionner les signets" : "Resize bookmarks"}
      title={language === "fr" ? "Glisser pour redimensionner · flèches gauche et droite" : "Drag to resize · left and right arrow keys"}
      aria-controls={listId} aria-valuemin={minWidth} aria-valuemax={maxWidth} aria-valuenow={width}
      aria-valuetext={language === "fr" ? `${width} pixels de large` : `${width} pixels wide`} {...handleProps} /> : null}
    <header className="conversation-pins-header">
      {compact ? <button ref={(element) => { headingRef.current = element; }} type="button" className="conversation-pins-toggle" aria-expanded={expanded} aria-controls={listId} onClick={() => onExpandedChange(!expanded)}>
        <Bookmark size={16} aria-hidden="true" /><span>{label}</span><span className="conversation-pins-count">{cards.length}</span><ChevronDown size={16} aria-hidden="true" />
      </button> : <><h2 className="conversation-pins-heading" ref={(element) => { headingRef.current = element; }} tabIndex={-1}><Bookmark size={16} aria-hidden="true" />{label}</h2><span className="conversation-pins-count">{cards.length}</span></>}
    </header>
    <div id={listId} className="conversation-pins-list" hidden={compact && !expanded}>
      <OfferBookmarks cards={cards} language={language} onRemove={onRemove} />
    </div>
  </aside>;
}
