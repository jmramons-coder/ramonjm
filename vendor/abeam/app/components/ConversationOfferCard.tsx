"use client";

import Image from "next/image";
import { Bookmark, ExternalLink, Hotel, Star } from "lucide-react";
import { useState, type ReactNode } from "react";
import { conversationOfferLink } from "@/lib/conversation/offer-link";
import { conversationCardSourceLink, conversationOfferSourceLabel, keyedConversationOffers } from "@/lib/conversation/offer-presentation";
import { canBookmarkConversationCard } from "@/lib/conversation/workspace";
import { cardIdentity, type LiveFeedCard } from "@/lib/live/feed";
import { googleHotelImages } from "@/lib/product-search/offer-metadata";
import type { SuggestionItem } from "@/lib/suggestions/engine";
import type { UILanguage } from "@/lib/ui/language";
import FlightOfferRow, { FlightOfferVisual } from "./FlightOfferRow";
import { displayConversationCardBadge, displayConversationCardSubtitle, displayConversationCardTitle, displayConversationFlightDetail } from "./offer-format";
import "./conversation-offer-cards.css";

type Props = {
  card: LiveFeedCard;
  language: UILanguage;
  bookmarked?: boolean;
  onToggleBookmark?: (card: LiveFeedCard, restoreFocus?: boolean) => void;
  updatedBadge?: ReactNode;
};

function OfferSource({ link, title, language }: { link: NonNullable<ReturnType<typeof conversationOfferLink>>; title: string; language: UILanguage }) {
  const label = link.kind === "flight-search"
    ? (language === "fr" ? "Ouvrir la recherche de vols dans un nouvel onglet" : "Open flight search in a new tab")
    : (language === "fr" ? "Ouvrir l’offre dans un nouvel onglet" : "Open offer in a new tab");
  return <a className="conversation-offer-link" href={link.href} target="_blank" rel="noopener noreferrer" aria-label={`${label} : ${title}`} title={label}><ExternalLink size={17} aria-hidden="true" /></a>;
}

function HotelOffer({ item, source, language }: { item: SuggestionItem; source?: ReturnType<typeof conversationOfferLink>; language: UILanguage }) {
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const photos = googleHotelImages([item.image, ...(item.images ?? [])]).filter((photo) => !failed.has(photo));
  const failPhoto = (photo: string) => setFailed((current) => new Set([...current, photo]));
  return <div className="sg-hotel conversation-hotel-option">
    <div className="sg-hotel-hero">
      {photos[0] ? <Image src={photos[0]} alt={item.titre} width={640} height={400} unoptimized loading="lazy" referrerPolicy="no-referrer" onError={() => failPhoto(photos[0])} /> : <div className="conversation-hotel-placeholder" aria-hidden="true"><Hotel size={28} strokeWidth={1.6} /></div>}
    </div>
    <div className="conversation-hotel-heading"><strong>{item.titre}</strong>{source ? <OfferSource link={source} title={item.titre} language={language} /> : null}</div>
    {item.note ? <span className="conversation-hotel-rating"><Star size={14} aria-hidden="true" /><span>{item.note}</span></span> : null}
    {item.detail ? <p className="conversation-hotel-detail">{item.detail}</p> : null}
    {photos.length > 1 ? <div className="sg-hotel-strip">{photos.slice(1, 5).map((photo, index) => <Image key={photo} src={photo} alt={`${item.titre} — photo ${index + 2}`} width={160} height={120} unoptimized loading="lazy" referrerPolicy="no-referrer" onError={() => failPhoto(photo)} />)}</div> : null}
  </div>;
}

/** Public offers only: actual provider details and deliberate external actions. */
export default function ConversationOfferCard({ card, language, bookmarked = false, onToggleBookmark, updatedBadge }: Props) {
  if (card.type !== "vols" && card.type !== "hotels") return null;
  const fr = language === "fr";
  const headerSource = conversationCardSourceLink(card);
  const canBookmark = Boolean(onToggleBookmark && canBookmarkConversationCard(card));
  const bookmarkLabel = fr ? (bookmarked ? "Retirer le signet" : "Ajouter un signet") : (bookmarked ? "Remove bookmark" : "Bookmark offer");
  const sourceLabel = conversationOfferSourceLabel(card.source);
  const title = displayConversationCardTitle(card, language);
  const subtitle = displayConversationCardSubtitle(card, language);
  const badge = displayConversationCardBadge(card.badge, language);
  return <article className={`sg-card conversation-offer-card sg-card-${card.type}${card.majAt ? " is-maj" : ""}`}>
    <header className="conversation-offer-card-header">
      <h4>{title}</h4>
      {headerSource || canBookmark ? <div className="conversation-offer-actions">
        {headerSource ? <OfferSource link={headerSource} title={card.items.length === 1 ? card.items[0].titre : title} language={language} /> : null}
        {canBookmark ? <button type="button" className="conversation-offer-pin" data-conversation-bookmark={cardIdentity(card)} aria-pressed={bookmarked} aria-label={`${bookmarkLabel} : ${title}`} title={bookmarkLabel} onClick={(event) => onToggleBookmark?.(card, bookmarked && Boolean(event.currentTarget.closest(".conversation-pins")))}><Bookmark size={17} fill={bookmarked ? "currentColor" : "none"} aria-hidden="true" /></button> : null}
      </div> : null}
    </header>
    {subtitle ? <p className="sg-subtitle">{subtitle}</p> : null}
    {badge || card.majAt ? <div className="conversation-offer-state">{updatedBadge}{badge ? <span className="sg-badge">{badge}</span> : null}</div> : null}
    {card.type === "hotels" ? <div className="sg-hotels">{keyedConversationOffers(card).map(({ item, key }) => <HotelOffer key={key} item={item} source={headerSource ? null : conversationOfferLink(card.type, item)} language={language} />)}</div>
      : <ul className="sg-flights">{keyedConversationOffers(card).map(({ item, key }) => {
        const source = headerSource ? null : conversationOfferLink(card.type, item);
        return <li key={key} className="conversation-flight-option" data-has-source={Boolean(source) || undefined}>
          {source ? <>
            <div className="conversation-flight-heading"><FlightOfferVisual image={item.image} /><strong>{item.titre}</strong><OfferSource link={source} title={item.titre} language={language} /></div>
            {item.detail || item.prix ? <div className="conversation-flight-details">{item.detail ? <p>{displayConversationFlightDetail(item.detail, language)}</p> : null}{item.prix ? <strong>{item.prix}</strong> : null}</div> : null}
          </> : <FlightOfferRow title={item.titre} detail={item.detail} price={item.prix} image={item.image} language={language} />}
          {item.note ? <p className="conversation-flight-note">{item.note}</p> : null}
        </li>;
      })}</ul>}
    {sourceLabel ? <span className="conversation-offer-provider">{sourceLabel}</span> : null}
  </article>;
}
