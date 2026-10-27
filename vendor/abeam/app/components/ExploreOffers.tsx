"use client";

import type { UILanguage } from "@/lib/ui/language";
import { ArrowRight, ArrowUpRight, CalendarDays, CarFront, Check, CheckCircle2, ChevronRight, Clock3, Coffee, Copy, Dumbbell, Hotel, MapPin, MessageCircle, Plane, Snowflake, Sparkles, Star, Umbrella, UsersRound, Utensils, Waves, Wifi, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";

import type { DiscoveryEntry } from "@/lib/discovery/entries";
import type { ProductSearchFlightSegment, ProductSearchItem } from "@/lib/product-search/types";
import { publicHttpsUrl } from "@/lib/product-search/offer-metadata";
import OfferThumbnail, { safeOfferPhoto } from "./OfferThumbnail";
import { FlightOfferVisual } from "./FlightOfferRow";
import { useDrawerResize } from "./useDrawerResize";
import { displayDiscoveryOfferDates, displayDiscoveryOfferDetail, displayOfferDate } from "./offer-format";
import "./explore-details.css";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function sourceLabel(value?: string) { return value?.replace(/\s+via SerpAPI$/, ""); }

function OfferVisual({ entry, large = false }: { entry: DiscoveryEntry; large?: boolean }) {
  const className = `explore-list-visual${large ? " is-large" : ""}`;
  return entry.kind === "hotel"
    ? <OfferThumbnail image={entry.image} className={className} width={36} height={36} />
    : <FlightOfferVisual image={entry.image} className={className} />;
}

export function ExploreOfferRow({ entry, language, selected, onSelect }: {
  entry: DiscoveryEntry;
  language: UILanguage;
  selected: boolean;
  onSelect: () => void;
}) {
  const fr = language === "fr";
  const price = entry.price || (fr ? "Prix indisponible" : "Price unavailable");
  const detail = displayDiscoveryOfferDetail(entry, language);
  const dates = displayDiscoveryOfferDates(entry, language);
  return <li>
    <button type="button" className={`explore-list-row${selected ? " is-selected" : ""}`} aria-haspopup="dialog" aria-label={[entry.title, detail, dates, price].filter(Boolean).join(", ")} onClick={onSelect}>
      <OfferVisual entry={entry} />
      <span className="explore-list-copy"><strong>{entry.title}</strong><span>{detail || dates || (entry.kind === "hotel" ? (fr ? "Hôtel" : "Hotel") : (fr ? "Vol" : "Flight"))}</span></span>
      <span className={`explore-list-price${entry.price ? "" : " is-unavailable"}`}>{price}</span>
      <ChevronRight className="explore-list-chevron" size={15} aria-hidden="true" />
    </button>
  </li>;
}

function HotelGallery({ images, title, language }: { images: string[]; title: string; language: UILanguage }) {
  const [selected, setSelected] = useState<string>();
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  // Normalizing size directives also prevents the same returned photo appearing twice.
  const photos = [...new Set(images.map((image) => safeOfferPhoto(image, 1280, 800)).filter((image): image is string => Boolean(image)))].slice(0, 6).filter((image) => !failed.has(image));
  const current = photos.find((image) => image === selected) ?? photos[0];
  if (!current) return null;
  const index = photos.indexOf(current);
  const removeFailed = (image: string) => setFailed((previous) => new Set(previous).add(image));
  return <div className="explore-detail-gallery">
    {/* These are already returned hotel photos; selecting one never invokes a search. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img key={current} className="explore-detail-photo" src={current} alt={`${title} — photo ${index + 1}`} loading="lazy" referrerPolicy="no-referrer" onError={() => removeFailed(current)} />
    {photos.length > 1 ? <div className="explore-detail-gallery-nav" aria-label={language === "fr" ? "Photos de l’hôtel" : "Hotel photos"}>
      {photos.map((image, photoIndex) => <button key={image} type="button" className="explore-detail-thumbnail" aria-pressed={current === image} aria-label={`${language === "fr" ? "Afficher la photo" : "Show photo"} ${photoIndex + 1} ${language === "fr" ? "sur" : "of"} ${photos.length}`} onClick={() => setSelected(image)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={safeOfferPhoto(image, 160, 112)} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => removeFailed(image)} />
      </button>)}
      <span>{index + 1} / {photos.length}</span>
    </div> : null}
  </div>;
}

function hotelStars(value?: string) {
  if (!value) return null;
  const match = value.trim().match(/^([1-5])(?:\.0)?(?:\s*(?:-?\s*stars?(?:\s+hotel)?|étoiles?|[★☆]))?$/i);
  return match ? Number(match[1]) : null;
}

function HotelClassification({ hotelClass, rating, language }: { hotelClass?: string; rating?: number; language: UILanguage }) {
  const stars = hotelStars(hotelClass);
  const validRating = typeof rating === "number" && Number.isFinite(rating) && rating >= 0 && rating <= 5;
  if (!hotelClass && !validRating) return null;
  return <div className="explore-detail-hotel-quality">
    {hotelClass ? <span className="explore-detail-hotel-class">
      {stars ? <span className="explore-detail-stars" aria-hidden="true">{Array.from({ length: stars }, (_, index) => <Star key={index} size={13} />)}</span> : null}
      <span>{stars ? `${stars} ${language === "fr" ? (stars === 1 ? "étoile" : "étoiles") : (stars === 1 ? "star" : "stars")}` : hotelClass}</span>
    </span> : null}
    {validRating ? <span className="explore-detail-review"><MessageCircle size={14} aria-hidden="true" /><strong>{new Intl.NumberFormat(language === "fr" ? "fr-CA" : "en-CA", { maximumFractionDigits: 1 }).format(rating)}</strong><span>/ 5 · {language === "fr" ? "avis voyageurs" : "guest reviews"}</span></span> : null}
  </div>;
}

function amenityIcon(value: string) {
  const label = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/wi-?fi|internet/.test(label)) return Wifi;
  if (/pool|piscine/.test(label)) return Waves;
  if (/parking|stationnement/.test(label)) return CarFront;
  if (/fitness|gym|sport/.test(label)) return Dumbbell;
  if (/restaurant|dining/.test(label)) return Utensils;
  if (/breakfast|dejeuner/.test(label)) return Coffee;
  if (/beach|plage/.test(label)) return Umbrella;
  if (/air condition|climatis/.test(label)) return Snowflake;
  if (/spa|wellness/.test(label)) return Sparkles;
  return CheckCircle2;
}

function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = Math.round(minutes % 60);
  return [hours ? `${hours} h` : "", remainder ? `${remainder} min` : ""].filter(Boolean).join(" ");
}

function providerTime(value?: string) {
  if (!value) return "";
  const clock = value.match(/(?:^|[ T])(\d{2}):(\d{2})(?::\d{2})?(?:$|[ Z+-])/);
  return clock && Number(clock[1]) < 24 && Number(clock[2]) < 60 ? `${clock[1]}:${clock[2]}` : value;
}

function providerDay(value: string | undefined, language: UILanguage) {
  const day = value?.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  return day ? displayOfferDate(day, language) : "";
}

function FlightSegments({ segments, language }: { segments: ProductSearchFlightSegment[]; language: UILanguage }) {
  const fr = language === "fr";
  return <section className="explore-detail-itinerary" aria-label={fr ? "Itinéraire affiché" : "Shown itinerary"}>
    <h3><Plane size={15} aria-hidden="true" />{fr ? "Itinéraire affiché" : "Shown itinerary"}</h3>
    <ol>{segments.map((segment, index) => <li key={index} className="explore-detail-flight-leg">
      <div className="explore-detail-leg-label"><span>{fr ? "Vol" : "Flight"} {index + 1}</span><strong>{[segment.airline, segment.flightNumber].filter(Boolean).join(" · ")}</strong></div>
      <div className="explore-detail-flight-route">
        <div><span>{fr ? "Départ" : "Departure"}</span>{segment.departureTime ? <strong>{providerTime(segment.departureTime)}</strong> : null}{segment.from ? <p>{segment.from}</p> : null}{providerDay(segment.departureTime, language) ? <small>{providerDay(segment.departureTime, language)}</small> : null}</div>
        <ArrowRight size={18} aria-hidden="true" />
        <div><span>{fr ? "Arrivée" : "Arrival"}</span>{segment.arrivalTime ? <strong>{providerTime(segment.arrivalTime)}</strong> : null}{segment.to ? <p>{segment.to}</p> : null}{providerDay(segment.arrivalTime, language) ? <small>{providerDay(segment.arrivalTime, language)}</small> : null}</div>
      </div>
      {typeof segment.durationMinutes === "number" && Number.isFinite(segment.durationMinutes) && segment.durationMinutes > 0 ? <p className="explore-detail-leg-duration"><Clock3 size={13} aria-hidden="true" />{durationLabel(segment.durationMinutes)}</p> : null}
    </li>)}</ol>
  </section>;
}

/** One modal drawer for cached offers and manual results; opening is read-only. */
export function ExploreOfferDetails({ entry, item, destinationLabel, language, width, onWidthChange, fallbackFocusRef, onClose }: {
  entry: DiscoveryEntry;
  item?: ProductSearchItem;
  /** Human label from a matching editorial scope; never inferred from an airport. */
  destinationLabel?: string;
  language: UILanguage;
  width: number;
  onWidthChange: (width: number) => void;
  fallbackFocusRef: RefObject<HTMLHeadingElement | null>;
  onClose: () => void;
}) {
  const fr = language === "fr";
  const id = useId();
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const activeRef = useRef(true);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "copied" | "failed">("idle");
  const resize = useDrawerResize(width, onWidthChange);
  const url = publicHttpsUrl(item?.url) ?? publicHttpsUrl(entry.url);
  const retrievedAt = item?.retrievedAt ?? entry.observedAt;
  const retrieval = displayOfferDate(retrievedAt, language, true);
  const Icon = entry.kind === "hotel" ? Hotel : Plane;
  const photos = [item?.image, entry.image, ...(item?.images ?? entry.images ?? [])].filter((photo): photo is string => Boolean(photo));
  const segments = item?.segments ?? entry.segments ?? [];
  const amenities = item?.amenities ?? entry.amenities ?? [];
  const hotelClass = item?.hotelClass ?? entry.hotelClass;
  const rating = item?.rating ?? entry.rating;
  const detail = displayDiscoveryOfferDetail(entry, language);
  const dates = displayDiscoveryOfferDates(entry, language);
  const copyLabel = copyStatus === "copied" ? (fr ? "Lien copié" : "Link copied") : copyStatus === "copying" ? (fr ? "Copie…" : "Copying…") : (fr ? "Copier le lien" : "Copy link");

  const copyLink = async () => {
    if (!url || copyStatus === "copying" || closingRef.current) return;
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    setCopyStatus("copying");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      if (!activeRef.current || closingRef.current) return;
      setCopyStatus("copied");
      copyTimerRef.current = window.setTimeout(() => setCopyStatus("idle"), 3000);
    } catch {
      if (activeRef.current && !closingRef.current) setCopyStatus("failed");
    }
  };

  const requestClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    resize.stopResize();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { onClose(); return; }
    setClosing(true);
    // Keep focus and the backdrop until the exit finishes; a fallback handles
    // interrupted animations, including a motion preference changed mid-close.
    closeTimerRef.current = window.setTimeout(onClose, 350);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!hydrated || !dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const fallbackFocus = fallbackFocusRef.current;
    const previousOverflow = document.body.style.overflow;
    activeRef.current = true;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      activeRef.current = false;
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      else if (fallbackFocus?.isConnected) fallbackFocus.focus({ preventScroll: true });
    };
  }, [hydrated, fallbackFocusRef]);

  if (!hydrated) return null;
  return createPortal(<dialog ref={dialogRef} lang={language} className={`explore-detail-drawer${closing ? " is-closing" : ""}${resize.resizing ? " is-resizing" : ""}`} style={{ "--explore-detail-width": `${resize.width}px` } as CSSProperties} aria-labelledby={`${id}-title`} onCancel={(event) => { event.preventDefault(); requestClose(); }} onAnimationEnd={(event) => {
    if (event.target === event.currentTarget && event.animationName === "explore-drawer-out") onClose();
  }} onKeyDown={(event) => {
    if (event.key !== "Tab") return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button, a[href], [tabindex="0"]')].filter((control) => control.getClientRects().length > 0 && !control.hasAttribute("disabled"));
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }} onClick={(event) => {
    if (event.target !== event.currentTarget || resize.ignoreBackdropClick()) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) requestClose();
  }}>
    <div className="explore-detail-resizer" role="separator" aria-orientation="vertical" tabIndex={closing ? -1 : 0} aria-label={fr ? "Redimensionner les détails" : "Resize details"} title={fr ? "Glisser pour redimensionner · flèches gauche et droite" : "Drag to resize · left and right arrow keys"} aria-controls={`${id}-content`} aria-valuemin={resize.minWidth} aria-valuemax={resize.maxWidth} aria-valuenow={resize.width} aria-valuetext={`${resize.width} ${fr ? "pixels de large" : "pixels wide"}`} {...resize.handleProps} />
    <header className="explore-detail-header"><span><Icon size={16} aria-hidden="true" />{entry.kind === "hotel" ? (fr ? "Détails de l’hôtel" : "Hotel details") : (fr ? "Détails du vol" : "Flight details")}</span><button ref={closeRef} type="button" className="explore-detail-close" onClick={requestClose} aria-label={fr ? "Fermer les détails" : "Close details"}><X size={20} aria-hidden="true" /></button></header>
    <div className="explore-detail-content" id={`${id}-content`}>
      <div className="explore-detail-inner">
        {entry.kind === "hotel" ? <HotelGallery images={photos} title={entry.title} language={language} /> : null}
        <div className={`explore-detail-title${entry.kind === "hotel" ? " is-hotel" : ""}`}>
          {entry.kind === "flight" ? <OfferVisual entry={entry} large /> : null}
          <h2 id={`${id}-title`}>{entry.title}</h2>
        </div>
        {entry.kind === "hotel" ? <HotelClassification hotelClass={hotelClass} rating={rating} language={language} /> : null}
        {entry.kind === "hotel" && item?.destination ? <p className="explore-detail-location"><MapPin size={14} aria-hidden="true" />{destinationLabel || item.destination}</p> : null}
        {detail && (entry.kind === "hotel" ? !hotelClass && amenities.length === 0 : segments.length === 0) ? <p className="explore-detail-description">{detail}</p> : null}
        <div className="explore-detail-price"><strong>{entry.price || (fr ? "Prix indisponible" : "Price unavailable")}</strong>{item?.price?.unit === "round-trip" ? <span>{fr ? "Aller-retour" : "Round trip"}</span> : null}</div>
        {item ? <dl className="explore-detail-facts">
          {item.kind === "flight" ? <div><dt><Plane size={14} aria-hidden="true" />{fr ? "Trajet" : "Route"}</dt><dd>{[item.origin, item.destination].filter(Boolean).join(" → ")}</dd></div> : null}
          <div><dt><CalendarDays size={14} aria-hidden="true" />{item.kind === "hotel" ? (fr ? "Séjour" : "Stay") : (fr ? "Dates du voyage" : "Travel dates")}</dt><dd>{displayOfferDate(item.departureDate, language)} <span aria-hidden="true">→</span> {displayOfferDate(item.returnDate, language)}</dd></div>
          <div><dt><UsersRound size={14} aria-hidden="true" />{fr ? "Voyageurs" : "Travelers"}</dt><dd>{item.adults} {fr ? (item.adults === 1 ? "adulte" : "adultes") : (item.adults === 1 ? "adult" : "adults")}{item.childrenAges.length ? ` · ${item.childrenAges.length} ${fr ? (item.childrenAges.length === 1 ? "enfant" : "enfants") : (item.childrenAges.length === 1 ? "child" : "children")} (${item.childrenAges.join(", ")} ${fr ? "ans" : "years"})` : ""}</dd></div>
          {item.kind === "flight" && item.infantSeating ? <div><dt><CheckCircle2 size={14} aria-hidden="true" />{fr ? "Bébé" : "Infant"}</dt><dd>{item.infantSeating === "lap" ? (fr ? "Sur les genoux" : "On lap") : (fr ? "Siège individuel" : "Individual seat")}</dd></div> : null}
        </dl> : dates ? <div className="explore-detail-scope"><span><CalendarDays size={14} aria-hidden="true" />{fr ? "Dates et voyageurs" : "Dates and travelers"}</span><p>{dates}</p></div> : null}
        {entry.kind === "flight" && segments.length ? <FlightSegments segments={segments} language={language} /> : null}
        {entry.kind === "hotel" && amenities.length ? <section className="explore-detail-amenities" aria-label={fr ? "Services et équipements" : "Amenities"}>
          <h3>{fr ? "Services et équipements" : "Amenities"}</h3>
          <ul>{amenities.map((amenity, index) => { const AmenityIcon = amenityIcon(amenity); return <li key={`${index}:${amenity}`}><AmenityIcon size={16} aria-hidden="true" /><span>{amenity}</span></li>; })}</ul>
        </section> : null}
        <div className="explore-detail-provenance"><span>{sourceLabel(item?.source ?? entry.source) || (fr ? "Option enregistrée" : "Saved option")}</span>{retrieval ? <span>{fr ? "Consulté le" : "Retrieved"} <time dateTime={retrievedAt}>{retrieval}</time></span> : <span>{fr ? "Date de consultation inconnue" : "Retrieval date unknown"}</span>}</div>
      </div>
    </div>
    <footer className="explore-detail-footer">
      <div className="explore-detail-footer-inner">
        <p>{fr ? "Prix indicatif · à vérifier selon disponibilité." : "Indicative price · check current availability."}</p>
        {url ? <div className="explore-detail-actions">
          <a href={url} target="_blank" rel="noopener noreferrer">{fr ? "Voir l’offre" : "View offer"}<ArrowUpRight size={17} aria-hidden="true" /></a>
          <button type="button" className="explore-detail-copy" onClick={copyLink} disabled={copyStatus === "copying"} aria-label={copyLabel}>{copyStatus === "copied" ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}<span>{copyLabel}</span></button>
        </div> : <span>{fr ? "Aucun lien source enregistré." : "No source link saved."}</span>}
        {copyStatus === "copied" || copyStatus === "failed" ? <p className={`explore-detail-copy-feedback${copyStatus === "failed" ? " is-failed" : ""}`} role="status">{copyStatus === "copied" ? (fr ? "Lien copié dans le presse-papiers." : "Link copied to the clipboard.") : (fr ? "Copie indisponible. Ouvrez l’offre pour récupérer son lien." : "Copy unavailable. Open the offer to get its link.")}</p> : null}
      </div>
    </footer>
  </dialog>, document.body);
}
