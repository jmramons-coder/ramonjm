"use client";

import Image from "next/image";
import { CircleAlert, Clock3, ExternalLink, Hotel, ListChecks, LoaderCircle, MapPin, Mic, Pencil, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { useId, useState } from "react";

import { conversationOfferLink } from "@/lib/conversation/offer-link";
import type { FolderJourney, FolderJourneySource, JourneyEntry } from "@/lib/journey/types";
import { googleHotelImages } from "@/lib/product-search/offer-metadata";
import type { UILanguage } from "@/lib/ui/language";
import { FlightOfferVisual } from "./FlightOfferRow";

import "./trip-journey.css";

export type TripJourneyPanelProps = {
  language: UILanguage;
  journey: FolderJourney | null;
  source?: FolderJourneySource | null;
  loading: boolean;
  generating: boolean;
  saving?: boolean;
  stale: boolean;
  error?: string;
  busyEntryId?: string | null;
  disabled?: boolean;
  onRetry?: () => void;
  onStartConversation?: () => void;
  onEdit: (entry: JourneyEntry) => void;
  onToggle: (entry: JourneyEntry, done: boolean) => void;
  onRemove: (entry: JourneyEntry) => void;
};

const PHASES: JourneyEntry["phase"][] = ["before", "during", "after"];
const COPY = {
  fr: {
    title: "Parcours du voyage",
    phases: { before: "Avant le départ", during: "Pendant le voyage", after: "Au retour" },
    empty: "Aucune étape enregistrée.",
    emptyContext: "Démarrez une conversation pour préciser le projet de voyage.",
    emptyWithContext: "Ajoutez un vol ou un hôtel depuis les signets du dossier pour organiser le parcours.",
    start: "Démarrer une conversation",
    failure: "Le parcours n’a pas pu être chargé ou mis à jour.",
    failureHint: "Réessayez dans un instant pour retrouver le parcours.",
    signIn: "Reconnectez-vous pour ouvrir le parcours de ce dossier.",
    edit: "Modifier",
    remove: "Retirer",
    complete: "Marquer comme fait",
    reopen: "Marquer comme à faire",
    draft: "Propositions issues des conversations · à valider",
    stale: "Contexte modifié · parcours à vérifier.",
    partial: (included: number, total: number) => included < total ? `${included} conversations sur ${total} prises en compte.` : "Certains extraits ont été abrégés pour préparer les propositions.",
    loading: "Chargement du parcours…",
    generating: "Préparation des propositions…",
    saving: "Enregistrement…",
    retry: "Réessayer",
    origins: { ai: "Proposition", bookmark: "Depuis un signet", manual: "Ajout manuel" },
    stop: "Étape",
    day: "Jour",
    confirmDate: "À confirmer",
    openOffer: "Ouvrir l’offre dans un nouvel onglet",
    openSearch: "Ouvrir la recherche de vols dans un nouvel onglet",
  },
  en: {
    title: "Trip journey",
    phases: { before: "Before departure", during: "During the trip", after: "After the trip" },
    empty: "No saved steps yet.",
    emptyContext: "Start a conversation to clarify this trip.",
    emptyWithContext: "Add a flight or hotel from the folder’s bookmarks to organize the journey.",
    start: "Start a conversation",
    failure: "The journey could not be loaded or updated.",
    failureHint: "Try again shortly to load the journey.",
    signIn: "Sign in again to open this folder’s journey.",
    edit: "Edit",
    remove: "Remove",
    complete: "Mark as done",
    reopen: "Mark as to do",
    draft: "Suggestions from the conversations · for review",
    stale: "Context changed · review the journey.",
    partial: (included: number, total: number) => included < total ? `${included} of ${total} conversations included.` : "Some excerpts were shortened to prepare the suggestions.",
    loading: "Loading the trip journey…",
    generating: "Preparing suggestions…",
    saving: "Saving…",
    retry: "Retry",
    origins: { ai: "Suggestion", bookmark: "From a bookmark", manual: "Added manually" },
    stop: "Stop",
    day: "Day",
    confirmDate: "To confirm",
    openOffer: "Open the offer in a new tab",
    openSearch: "Open the flight search in a new tab",
  },
} as const;

function HotelVisual({ image, images }: { image?: string; images?: string[] }) {
  const [failed, setFailed] = useState<string[]>([]);
  const safe = googleHotelImages([image, ...(images ?? [])]).find((photo) => !failed.includes(photo));
  return <span className="trip-journey-visual" data-hotel aria-hidden="true">{safe
    ? <Image src={safe} alt="" width={34} height={34} unoptimized loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed((previous) => previous.includes(safe) ? previous : [...previous, safe])} />
    : <Hotel size={20} strokeWidth={1.6} />}</span>;
}

function JourneyRow({ entry, language, disabled, onEdit, onToggle, onRemove }: Pick<TripJourneyPanelProps, "language" | "onEdit" | "onToggle" | "onRemove"> & { entry: JourneyEntry; disabled: boolean }) {
  const copy = COPY[language];
  const link = entry.offer ? conversationOfferLink(entry.offer.type, entry.offer.item) : null;
  const ordinal = entry.placement && entry.ordinal ? `${entry.placement === "day" ? copy.day : copy.stop} ${entry.ordinal}` : undefined;
  const labels = [...new Set([ordinal, entry.dayLabel, entry.dateLabel].filter((value): value is string => Boolean(value)))];
  const linkLabel = link?.kind === "flight-search" ? copy.openSearch : copy.openOffer;

  return <li className="trip-journey-entry" data-done={entry.done || undefined} data-kind={entry.kind}>
    <div className="trip-journey-marker">
      {entry.kind === "task" ? <label className="trip-journey-checkbox"><input type="checkbox" checked={entry.done} disabled={disabled} aria-label={`${entry.done ? copy.reopen : copy.complete} : ${entry.title}`} onChange={(event) => onToggle(entry, event.target.checked)} /></label>
        : entry.offer?.type === "vols" ? <FlightOfferVisual image={entry.offer.item.image} className="trip-journey-visual" />
          : entry.offer?.type === "hotels" ? <HotelVisual image={entry.offer.item.image} images={entry.offer.item.images} />
            : entry.kind === "stay" ? <Hotel size={20} strokeWidth={1.6} aria-hidden="true" />
              : entry.kind === "flight" ? <FlightOfferVisual className="trip-journey-visual" />
                : <MapPin size={20} strokeWidth={1.6} aria-hidden="true" />}
    </div>
    <div className="trip-journey-entry-copy">
      <button className="trip-journey-entry-title" type="button" disabled={disabled} onClick={() => onEdit(entry)} aria-label={`${copy.edit} : ${entry.title}`}>{entry.title}</button>
      {entry.detail ? <p className="trip-journey-entry-detail">{entry.detail}</p> : null}
      {labels.length ? <p className="trip-journey-entry-labels">{labels.map((label) => <span className="trip-journey-date-label" key={label}>{label}{entry.origin === "ai" && label === entry.dateLabel ? <small className="trip-journey-date-certainty"><CircleAlert size={12} aria-hidden="true" />{copy.confirmDate}</small> : null}</span>)}</p> : null}
      <div className="trip-journey-entry-bottom">
        <span className="trip-journey-origin">{copy.origins[entry.origin]}</span>
        <div className="trip-journey-entry-actions">
          {entry.kind !== "task" ? <label className="trip-journey-checkbox" title={entry.done ? copy.reopen : copy.complete}><input type="checkbox" checked={entry.done} disabled={disabled} aria-label={`${entry.done ? copy.reopen : copy.complete} : ${entry.title}`} onChange={(event) => onToggle(entry, event.target.checked)} /></label> : null}
          {link ? <a className="trip-journey-offer-link" href={link.href} target="_blank" rel="noopener noreferrer" aria-label={`${linkLabel} : ${entry.offer?.item.titre ?? entry.title}`} title={linkLabel}><ExternalLink size={15} aria-hidden="true" /></a> : null}
          <button className="trip-journey-icon-action" type="button" disabled={disabled} onClick={() => onEdit(entry)} aria-label={`${copy.edit} : ${entry.title}`} title={copy.edit}><Pencil size={15} aria-hidden="true" /></button>
          <button className="trip-journey-icon-action" type="button" disabled={disabled} onClick={() => onRemove(entry)} aria-label={`${copy.remove} : ${entry.title}`} title={copy.remove}><Trash2 size={15} aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  </li>;
}

/** A proposed itinerary, never a claim that a flight or hotel has been booked. */
export default function TripJourneyPanel({ language, journey, source, loading, generating, saving = false, stale, error, busyEntryId, disabled = false, onRetry, onStartConversation, onEdit, onToggle, onRemove }: TripJourneyPanelProps) {
  const copy = COPY[language];
  const id = useId();
  const entries = journey?.entries ?? [];
  const pending = loading || generating || saving || Boolean(busyEntryId);
  const locked = disabled || pending;
  const failure = error?.trim();
  // The controller's authored authentication messages require a different next
  // step. Other transport/server failures never imply a lack of trip content.
  const needsSignIn = failure === "Non authentifié." || failure === "Reconnectez-vous pour ouvrir le parcours de ce dossier." || failure === "Sign in again to open this folder’s journey.";
  const failureMessage = needsSignIn ? copy.signIn : copy.failure;
  const hasSource = Boolean(source && source.includedCount > 0);
  const generated = entries.some((entry) => entry.origin === "ai");
  const partial = source?.truncated;

  return <section className="trip-journey" lang={language} aria-labelledby={`${id}-heading`} aria-busy={pending || undefined}>
    <header className="trip-journey-heading">
      <h2 id={`${id}-heading`}>{copy.title}</h2>
      {failure && onRetry ? <button className="trip-journey-retry" type="button" disabled={pending} onClick={onRetry}><RefreshCw size={14} aria-hidden="true" />{copy.retry}</button> : null}
    </header>
    <div className="trip-journey-body">
    {entries.length && stale ? <p className="trip-journey-cue" data-stale><Clock3 size={14} aria-hidden="true" /><span>{copy.stale}</span></p> : generated ? <p className="trip-journey-cue"><Sparkles size={14} aria-hidden="true" /><span>{copy.draft}</span></p> : null}
    {entries.length && partial ? <p className="trip-journey-cue"><CircleAlert size={14} aria-hidden="true" /><span>{copy.partial(source.includedCount, source.conversationCount)}</span></p> : null}
    {failure && entries.length ? <p className="trip-journey-error" role="alert"><CircleAlert size={14} aria-hidden="true" /><span>{failureMessage}</span></p> : null}
    {pending ? <p className="trip-journey-status" role="status"><LoaderCircle className="trip-journey-spinning" size={14} aria-hidden="true" /><span>{generating ? copy.generating : saving || busyEntryId ? copy.saving : copy.loading}</span></p> : null}
    {!entries.length && pending ? <div className="trip-journey-placeholders" aria-hidden="true" inert>{[0, 1, 2].map((index) => <div className="trip-journey-placeholder" key={index} />)}</div>
      : !entries.length ? <div className="trip-journey-empty" data-state={failure ? "error" : "empty"}>
          {failure ? <CircleAlert size={24} strokeWidth={1.5} aria-hidden="true" /> : <ListChecks size={24} strokeWidth={1.5} aria-hidden="true" />}
          <p className="trip-journey-empty-title" role={failure ? "alert" : undefined}>{failure ? failureMessage : copy.empty}</p>
          {!needsSignIn ? <p className="trip-journey-empty-hint">{failure ? copy.failureHint : hasSource ? copy.emptyWithContext : copy.emptyContext}</p> : null}
          {!failure && onStartConversation ? <button className="trip-journey-start" type="button" onClick={onStartConversation}><Mic size={16} aria-hidden="true" />{copy.start}</button> : null}
        </div>
        : <div className="trip-journey-groups">{PHASES.map((phase) => {
          const phaseEntries = entries.filter((entry) => entry.phase === phase);
          if (!phaseEntries.length) return null;
          return <section className="trip-journey-group" key={phase} aria-labelledby={`${id}-${phase}`}><h3 className="trip-journey-phase" id={`${id}-${phase}`}>{copy.phases[phase]}</h3><ol className="trip-journey-entries">{phaseEntries.map((entry) => <JourneyRow key={entry.id} entry={entry} language={language} disabled={locked} onEdit={onEdit} onToggle={onToggle} onRemove={onRemove} />)}</ol></section>;
        })}</div>}
    </div>
  </section>;
}
