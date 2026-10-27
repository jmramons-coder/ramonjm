"use client";

import Image from "next/image";
import { ArrowRight, Bookmark, BookmarkMinus, CalendarDays, ChevronDown, CircleAlert, Clock3, ExternalLink, Hotel, MoreHorizontal, Plane, Route, Star, UsersRound } from "lucide-react";
import { useId, useState } from "react";
import { Button as AriaButton, Menu, MenuItem, MenuTrigger, Popover } from "react-aria-components";
import { bookmarkFlightContext, summarizeBookmarkFlight } from "@/lib/conversation/bookmark-summary";
import { conversationOfferLink } from "@/lib/conversation/offer-link";
import { conversationCardSourceLink, keyedConversationOffers } from "@/lib/conversation/offer-presentation";
import { cardIdentity } from "@/lib/live/feed";
import { googleHotelImages, safeFlightSegments } from "@/lib/product-search/offer-metadata";
import type { ProductSearchFlightSegment } from "@/lib/product-search/types";
import type { SuggestionCard, SuggestionItem } from "@/lib/suggestions/engine";
import type { UILanguage } from "@/lib/ui/language";
import { FlightOfferVisual } from "./FlightOfferRow";
import { displayConversationCardBadge, displayConversationCardSubtitle, displayConversationCardTitle, displayConversationFlightDetail, displayOfferDate } from "./offer-format";
import "./offer-bookmarks.css";

function HotelThumbnail({ image }: { image?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  return <span className="offer-bookmark-item-visual is-hotel" aria-hidden="true">{image && image !== failed ? <Image src={image} alt="" width={40} height={40} unoptimized loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(image)} /> : <Hotel size={20} strokeWidth={1.6} />}</span>;
}

function HotelGallery({ images, title }: { images: string[]; title: string }) {
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const visible = images.filter((image) => !failed.has(image)).slice(0, 4);
  if (!visible.length) return null;
  return <div className="offer-bookmark-gallery" data-count={visible.length}>
    {visible.map((image, index) => <Image key={image} src={image} alt={`${title} — photo ${index + 1}`} width={240} height={150} unoptimized loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed((previous) => new Set([...previous, image]))} />)}
  </div>;
}

function OfferSourceLink({ link, title, language }: {
  link: NonNullable<ReturnType<typeof conversationOfferLink>>;
  title: string;
  language: UILanguage;
}) {
  const fr = language === "fr";
  const label = link.kind === "flight-search"
    ? `${fr ? "Voir la recherche de vols" : "Open flight search"} : ${title}`
    : `${fr ? "Ouvrir l’offre dans un nouvel onglet" : "Open offer in a new tab"} : ${title}`;
  return <a className="offer-bookmark-link" href={link.href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}><ExternalLink size={17} aria-hidden="true" /></a>;
}

function RemoveBookmark({ title, language, onRemove }: { title: string; language: UILanguage; onRemove: () => void }) {
  const label = `${language === "fr" ? "Retirer le signet" : "Remove bookmark"} : ${title}`;
  return <button type="button" className="offer-bookmark-remove" aria-label={label} title={label} onClick={onRemove}><BookmarkMinus size={17} aria-hidden="true" /></button>;
}

function JourneyOfferMenu({ title, language, onAdd, disabled }: { title: string; language: UILanguage; onAdd: () => void; disabled?: boolean }) {
  const label = language === "fr" ? "Ajouter au voyage" : "Add to journey";
  return <MenuTrigger>
    <AriaButton className="offer-bookmark-menu-button" isDisabled={disabled} aria-label={`${language === "fr" ? "Options : " : "Options: "}${title}`}><MoreHorizontal size={17} aria-hidden="true" /></AriaButton>
    <Popover className="offer-bookmark-menu-popover" placement="bottom end">
      <Menu className="offer-bookmark-menu" aria-label={title}>
        <MenuItem id="journey" textValue={label} onAction={onAdd}><Route size={16} aria-hidden="true" /><span>{label}</span></MenuItem>
      </Menu>
    </Popover>
  </MenuTrigger>;
}

/** These clocks remain the provider's local times; no timezone or return leg is inferred. */
function SegmentEndpoint({ airport, value, label, language }: { airport?: string; value?: string; label: string; language: UILanguage }) {
  if (!airport && !value) return <span className="offer-bookmark-leg-endpoint" aria-hidden="true" />;
  return <span className="offer-bookmark-leg-endpoint"><small>{label}</small>{airport ? <strong>{airport}</strong> : null}{value ? <><time dateTime={value}>{value.slice(11, 16)}</time><small>{displayOfferDate(value.slice(0, 10), language)}</small></> : null}</span>;
}

function FlightLegs({ segments, language }: { segments: ProductSearchFlightSegment[]; language: UILanguage }) {
  const fr = language === "fr";
  return <section className="offer-bookmark-legs" aria-label={fr ? "Segments de vol" : "Flight legs"}>
    <h4><Plane size={13} aria-hidden="true" />{fr ? "Segments de vol" : "Flight legs"}</h4>
    <ol>{segments.map((segment, index) => <li key={`${JSON.stringify(segment)}:${index}`}>
      {segment.airline || segment.flightNumber ? <p className="offer-bookmark-leg-airline">{[segment.airline, segment.flightNumber].filter(Boolean).join(" · ")}</p> : null}
      {segment.from || segment.to || segment.departureTime || segment.arrivalTime ? <div className="offer-bookmark-leg-route"><SegmentEndpoint airport={segment.from} value={segment.departureTime} label={fr ? "Départ" : "Departure"} language={language} /><ArrowRight size={14} aria-hidden="true" /><SegmentEndpoint airport={segment.to} value={segment.arrivalTime} label={fr ? "Arrivée" : "Arrival"} language={language} /></div> : null}
      {typeof segment.durationMinutes === "number" && segment.durationMinutes > 0 ? <p className="offer-bookmark-leg-duration"><Clock3 size={12} aria-hidden="true" />{segment.durationMinutes >= 60 ? `${Math.floor(segment.durationMinutes / 60)} h${segment.durationMinutes % 60 ? ` ${segment.durationMinutes % 60} min` : ""}` : `${segment.durationMinutes} min`}</p> : null}
    </li>)}</ol>
  </section>;
}

function BookmarkOffer({ card, item, language, sharedSource = false, contentOnly = false, onAddToJourney, journeyDisabled }: {
  card: SuggestionCard;
  item: SuggestionItem;
  language: UILanguage;
  sharedSource?: boolean;
  contentOnly?: boolean;
  onAddToJourney?: () => void;
  journeyDisabled?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const fr = language === "fr";
  const hotel = card.type === "hotels";
  const itemTitle = !hotel && (item.titre === "Itinéraire" || item.titre === "Flight itinerary") ? (fr ? "Itinéraire" : "Flight itinerary") : item.titre;
  const photos = hotel ? googleHotelImages([item.image, ...(item.images ?? [])]) : [];
  const link = sharedSource ? null : conversationOfferLink(card.type, item);
  const detail = item.detail?.trim();
  const note = item.note?.trim();
  const preview = hotel ? detail : displayConversationFlightDetail(detail, language);
  const additionalNote = note && note !== detail && note !== item.titre.trim() ? note : undefined;
  const segments = !hotel ? safeFlightSegments(item.segments).filter((segment) => Boolean(segment.flightNumber || segment.from || segment.to || segment.departureTime || segment.arrivalTime)) : [];
  const hasDetails = hotel ? Boolean(detail || additionalNote || photos.length) : Boolean(additionalNote || segments.length);
  const disclosureLabel = `${fr ? "Détails de l’offre" : "Offer details"} : ${itemTitle}`;
  const summary = <>{hotel ? <HotelThumbnail image={photos[0]} /> : <FlightOfferVisual image={item.image} className="offer-bookmark-item-visual" />}<span className="offer-bookmark-item-copy"><strong title={itemTitle}>{itemTitle}</strong>{!hotel && item.prix ? <span className="offer-bookmark-item-price">{item.prix}</span> : null}{preview ? <span className="offer-bookmark-item-preview" title={preview}>{preview}</span> : null}{hotel && additionalNote ? <span className="offer-bookmark-rating" title={additionalNote}><Star size={12} aria-hidden="true" /><span>{additionalNote}</span></span> : null}</span>{hasDetails ? <ChevronDown className="offer-bookmark-item-chevron" size={14} aria-hidden="true" /> : null}</>;

  return <article className="offer-bookmark-item" data-expanded={expanded || undefined} data-content-only={contentOnly || undefined}>
    {!contentOnly ? <div className="offer-bookmark-item-header">
      {hasDetails ? <button type="button" className="offer-bookmark-item-toggle" aria-label={disclosureLabel} aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpanded((previous) => !previous)}>{summary}</button> : <div className="offer-bookmark-item-summary">{summary}</div>}
      {link || onAddToJourney ? <div className="offer-bookmark-item-actions">{link ? <OfferSourceLink link={link} title={link.kind === "flight-search" ? displayConversationCardTitle(card, language) : itemTitle} language={language} /> : null}{onAddToJourney ? <JourneyOfferMenu title={itemTitle} language={language} onAdd={onAddToJourney} disabled={journeyDisabled} /> : null}</div> : null}
    </div> : null}
    <div className="offer-bookmark-item-content" id={panelId} hidden={!contentOnly && !expanded}>
      {contentOnly || expanded ? <>
        {hotel && detail ? <p className="offer-bookmark-item-detail">{detail}</p> : null}
        {additionalNote ? <p className="offer-bookmark-item-note">{hotel ? <Star size={13} aria-hidden="true" /> : null}<span>{additionalNote}</span></p> : null}
        {segments.length ? <FlightLegs segments={segments} language={language} /> : null}
        {photos.length ? <HotelGallery images={photos} title={item.titre} /> : null}
        {contentOnly && (link || onAddToJourney) ? <div className="offer-bookmark-content-actions">{link ? <OfferSourceLink link={link} title={item.titre} language={language} /> : null}{onAddToJourney ? <JourneyOfferMenu title={item.titre} language={language} onAdd={onAddToJourney} disabled={journeyDisabled} /> : null}</div> : null}
      </> : null}
    </div>
  </article>;
}

function BookmarkEntry<T extends SuggestionCard>({ card, language, onRemove, onAddToJourney, journeyDisabled }: {
  card: T;
  language: UILanguage;
  onRemove?: (card: T) => void;
  onAddToJourney?: (card: T, item: SuggestionItem) => void;
  journeyDisabled?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const fr = language === "fr";
  const flight = card.type === "vols";
  const hotel = card.type === "hotels";
  const offers = keyedConversationOffers(card);
  const singleHotel = hotel && offers.length === 1 ? offers[0].item : undefined;
  const flightSummary = flight ? summarizeBookmarkFlight(card, language) : null;
  const flightContext = flight ? [...new Set(bookmarkFlightContext(card, language))] : [];
  const title = flightSummary?.route ?? singleHotel?.titre ?? displayConversationCardTitle(card, language);
  const context = flight ? null : displayConversationCardSubtitle(card, language)?.trim();
  const badge = flightSummary?.badge ?? displayConversationCardBadge(card.badge, language);
  const hotelPhotos = singleHotel ? googleHotelImages([singleHotel.image, ...(singleHotel.images ?? [])]) : [];
  const headerLink = conversationCardSourceLink(card);
  const actionCount = Number(Boolean(headerLink)) + Number(Boolean(onRemove));
  const disclosureLabel = `${fr ? "Offres enregistrées" : "Bookmarked offers"} : ${title}`;

  return <li className="offer-bookmark" data-kind={flight ? "flight" : "hotel"} data-expanded={expanded || undefined} data-action-count={actionCount}>
    <header className="offer-bookmark-header">
      <button type="button" className="offer-bookmark-toggle" aria-label={disclosureLabel} aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpanded((previous) => !previous)}>
        <span className="offer-bookmark-heading">{singleHotel ? <HotelThumbnail image={hotelPhotos[0]} /> : <span className="offer-bookmark-avatar" aria-hidden="true">{flight ? <Plane size={21} strokeWidth={1.6} /> : <Hotel size={21} strokeWidth={1.6} />}</span>}<span className="offer-bookmark-heading-copy"><strong className="offer-bookmark-context-title" title={title}>{title}</strong></span></span>
        {flightSummary?.dates || flightSummary?.travelers || context || badge || singleHotel?.detail || singleHotel?.note ? <span className="offer-bookmark-metadata">
          {singleHotel?.detail || singleHotel?.note ? <span className="offer-bookmark-hotel-preview">{singleHotel.detail ? <span className="offer-bookmark-item-preview" title={singleHotel.detail}>{singleHotel.detail}</span> : null}{singleHotel.note ? <span className="offer-bookmark-rating" title={singleHotel.note}><Star size={12} aria-hidden="true" /><span>{singleHotel.note}</span></span> : null}</span> : null}
          {flightSummary?.dates ? <span className="offer-bookmark-metadata-part"><CalendarDays size={12} aria-hidden="true" /><span>{flightSummary.dates}</span></span> : null}
          {flightSummary?.travelers ? <span className="offer-bookmark-metadata-part"><UsersRound size={12} aria-hidden="true" /><span>{flightSummary.travelers}</span></span> : null}
          {context && context !== singleHotel?.detail && context !== title ? <span className="offer-bookmark-context-subtitle">{context}</span> : null}
          {badge ? <span className="offer-bookmark-context-certainty"><CircleAlert size={12} aria-hidden="true" /><span>{badge}</span></span> : null}
        </span> : null}
        <ChevronDown className="offer-bookmark-chevron" size={16} aria-hidden="true" />
      </button>
      {actionCount ? <div className="offer-bookmark-actions">{headerLink ? <OfferSourceLink link={headerLink} title={title} language={language} /> : null}{onRemove ? <RemoveBookmark title={title} language={language} onRemove={() => onRemove(card)} /> : null}</div> : null}
    </header>
    <div className="offer-bookmark-content" id={panelId} hidden={!expanded}>
      {flightContext.length ? <div className="offer-bookmark-search-context">{flightContext.map((line, index) => <p key={`${line}:${index}`}>{line}</p>)}</div> : null}
      {offers.length ? <ul className="offer-bookmark-items" aria-label={fr ? "Offres enregistrées" : "Bookmarked offers"}>{offers.map(({ item, key }) => <li key={key}><BookmarkOffer card={card} item={item} language={language} sharedSource={Boolean(headerLink)} contentOnly={Boolean(singleHotel)} journeyDisabled={journeyDisabled} onAddToJourney={onAddToJourney ? () => onAddToJourney(card, item) : undefined} /></li>)}</ul> : <p className="offer-bookmark-unavailable">{fr ? "Aucune offre disponible dans ce signet." : "No offers are available in this bookmark."}</p>}
    </div>
  </li>;
}

/** Saved copies retain the actual offer identities and original conversation cards. */
export default function OfferBookmarks<T extends SuggestionCard>({ cards, language, onRemove, onAddToJourney, journeyDisabled, className = "" }: {
  cards: T[];
  language: UILanguage;
  onRemove?: (card: T) => void;
  onAddToJourney?: (card: T, item: SuggestionItem) => void;
  journeyDisabled?: boolean;
  className?: string;
}) {
  const fr = language === "fr";
  if (!cards.length) return <div className="offer-bookmarks-empty conversation-pin-empty"><Bookmark size={24} aria-hidden="true" /><h3>{fr ? "Vos signets, ici" : "Your bookmarks, here"}</h3><p>{fr ? "Ajoutez un vol ou un hôtel depuis la conversation pour le retrouver ici." : "Bookmark a flight or hotel in the conversation to keep it here."}</p></div>;
  return <ul className={`offer-bookmarks ${className}`.trim()} aria-label={fr ? "Signets" : "Bookmarks"}>{cards.map((card) => <BookmarkEntry key={cardIdentity(card)} card={card} language={language} onRemove={onRemove} onAddToJourney={onAddToJourney} journeyDisabled={journeyDisabled} />)}</ul>;
}
