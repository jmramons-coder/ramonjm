"use client";

import { LoaderCircle, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import type { JourneyEntry } from "@/lib/journey/types";
import type { UILanguage } from "@/lib/ui/language";

import "./trip-journey.css";

export type TripJourneyEntryDialogProps = {
  language: UILanguage;
  entry?: JourneyEntry;
  offer?: JourneyEntry["offer"];
  offerContext?: { title: string; subtitle?: string; badge?: string };
  sourceSessionIds?: string[];
  busy: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (entry: JourneyEntry) => void;
};

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
const COPY = {
  fr: {
    add: "Ajouter au parcours",
    edit: "Modifier l’élément",
    description: "Organisez les étapes du voyage. Les dates et les jours restent ceux que vous indiquez.",
    title: "Titre",
    detail: "Détails",
    phase: "Moment du parcours",
    kind: "Type d’élément",
    phases: { before: "Avant le départ", during: "Pendant le voyage", after: "Au retour" },
    kinds: { task: "Tâche", flight: "Vol", stay: "Séjour", moment: "Moment du voyage" },
    day: "Jour ou étape (facultatif)",
    date: "Date ou période (facultatif)",
    dayExample: "Ex. Jour 2, deuxième étape",
    dateExample: "Ex. 14–25 mars, à confirmer",
    placement: "Ajouter comme",
    stop: "Étape",
    numberedDay: "Jour",
    ordinal: "Numéro",
    offer: "L’offre du signet est conservée. Son ajout ne confirme aucune réservation.",
    cancel: "Annuler",
    close: "Fermer",
    save: "Enregistrer",
    retry: "Réessayer",
    saving: "Enregistrement…",
  },
  en: {
    add: "Add to the trip journey",
    edit: "Edit item",
    description: "Organize the trip steps. Days and dates stay exactly as you provide them.",
    title: "Title",
    detail: "Details",
    phase: "Journey phase",
    kind: "Item type",
    phases: { before: "Before departure", during: "During the trip", after: "After the trip" },
    kinds: { task: "Task", flight: "Flight", stay: "Stay", moment: "Trip moment" },
    day: "Day or stop (optional)",
    date: "Date or period (optional)",
    dayExample: "e.g. Day 2, second stop",
    dateExample: "e.g. March 14–25, to confirm",
    placement: "Add as",
    stop: "Stop",
    numberedDay: "Day",
    ordinal: "Number",
    offer: "The bookmarked offer is preserved. Adding it does not confirm a booking.",
    cancel: "Cancel",
    close: "Close",
    save: "Save",
    retry: "Retry",
    saving: "Saving…",
  },
} as const;

function restoreFocus(opener: HTMLElement | null) {
  const focus = (element: HTMLElement | null) => {
    if (!element?.isConnected || element.matches(":disabled") || element.closest("[inert]") || !element.getClientRects().length) return false;
    element.focus({ preventScroll: true });
    return document.activeElement === element;
  };
  if (focus(opener)) return;
  for (const element of [document.querySelector<HTMLElement>("main h1"), document.querySelector<HTMLElement>("main"), document.body]) {
    if (!element) continue;
    const hadTabIndex = element.hasAttribute("tabindex");
    if (!hadTabIndex) element.setAttribute("tabindex", "-1");
    const focused = focus(element);
    if (!hadTabIndex) element.removeAttribute("tabindex");
    if (focused) return;
  }
}

/** Mount with a fresh key per entry/offer; asynchronous failures retain this draft. */
export default function TripJourneyEntryDialog({ language, entry, offer, offerContext, sourceSessionIds, busy, error, onClose, onSubmit }: TripJourneyEntryDialogProps) {
  const copy = COPY[language];
  const id = useId();
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const offered = entry?.offer ?? offer;
  const [title, setTitle] = useState(() => {
    if (entry) return entry.title;
    const route = offered?.type === "vols" && offerContext?.title && offerContext.title !== offered.item.titre ? offerContext.title : "";
    return (route ? `${route} · ${offered?.item.titre}` : offered?.item.titre ?? "").slice(0, 160);
  });
  const [detail, setDetail] = useState(() => {
    if (entry) return entry.detail ?? "";
    const parts = [offerContext?.subtitle, offerContext?.badge, offered?.item.detail].filter((value): value is string => Boolean(value?.trim()));
    return [...new Set(parts)].join("\n").slice(0, 1200);
  });
  const [phase, setPhase] = useState<JourneyEntry["phase"]>(() => entry?.phase ?? (offered ? "during" : "before"));
  const [kind, setKind] = useState<JourneyEntry["kind"]>(() => entry?.kind ?? (offered?.type === "vols" ? "flight" : offered ? "stay" : "task"));
  const [dayLabel, setDayLabel] = useState(() => entry?.dayLabel ?? "");
  const [dateLabel, setDateLabel] = useState(() => entry?.dateLabel ?? "");
  const [placement, setPlacement] = useState<NonNullable<JourneyEntry["placement"]>>(() => entry?.placement ?? "stop");
  const [ordinal, setOrdinal] = useState(() => String(entry?.ordinal ?? 1));
  const newId = useRef<string | null>(null);
  const failure = error?.trim();
  const validOrdinal = Number.isSafeInteger(Number(ordinal)) && Number(ordinal) >= 1 && Number(ordinal) <= 99;
  const valid = Boolean(title.trim()) && title.trim().length <= 160 && detail.trim().length <= 1200
    && dayLabel.trim().length <= 80 && dateLabel.trim().length <= 160 && (!offered || validOrdinal);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!hydrated || !dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
    titleRef.current?.focus({ preventScroll: true });
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      restoreFocus(opener);
    };
  }, [hydrated]);

  if (!hydrated) return null;
  return createPortal(<dialog ref={dialogRef} className="trip-journey-dialog" lang={language} aria-labelledby={`${id}-heading`} aria-describedby={`${id}-description`} aria-busy={busy || undefined} onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }} onClick={(event) => {
    if (busy || event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
  }}>
    <button className="trip-journey-close" type="button" disabled={busy} onClick={() => { if (!busy) onClose(); }} aria-label={copy.close}><X size={18} aria-hidden="true" /></button>
    <form className="trip-journey-form" onSubmit={(event) => {
      event.preventDefault();
      if (busy || !valid) return;
      newId.current ??= entry?.id ?? crypto.randomUUID();
      onSubmit({
        id: newId.current,
        phase, kind, title: title.trim(),
        ...(detail.trim() ? { detail: detail.trim() } : {}),
        ...(dayLabel.trim() ? { dayLabel: dayLabel.trim() } : {}),
        ...(dateLabel.trim() ? { dateLabel: dateLabel.trim() } : {}),
        done: entry?.done ?? false,
        origin: entry?.origin === "ai" ? "manual" : entry?.origin ?? (offered ? "bookmark" : "manual"),
        sourceSessionIds: [...(entry?.sourceSessionIds ?? sourceSessionIds ?? [])],
        ...(offered ? { offer: { type: offered.type, item: { ...offered.item, ...(offered.item.images ? { images: [...offered.item.images] } : {}) } }, placement, ordinal: Number(ordinal) }
          : { ...(entry?.placement ? { placement: entry.placement } : {}), ...(entry?.ordinal !== undefined ? { ordinal: entry.ordinal } : {}) }),
      });
    }}>
      <header className="trip-journey-dialog-heading"><h2 id={`${id}-heading`}>{entry ? copy.edit : copy.add}</h2><p id={`${id}-description`}>{copy.description}</p></header>
      <div className="trip-journey-fields">
        <label className="trip-journey-field"><span>{copy.title}<b aria-hidden="true">*</b></span><input ref={titleRef} type="text" name="journey-title" autoComplete="off" required maxLength={160} value={title} disabled={busy} onChange={(event) => setTitle(event.target.value)} /></label>
        <label className="trip-journey-field"><span>{copy.detail}</span><textarea name="journey-detail" maxLength={1200} rows={3} value={detail} disabled={busy} onChange={(event) => setDetail(event.target.value)} /></label>
        <div className="trip-journey-form-pair">
          <label className="trip-journey-field"><span>{copy.phase}</span><select name="journey-phase" value={phase} disabled={busy} onChange={(event) => setPhase(event.target.value as JourneyEntry["phase"])}>{Object.entries(copy.phases).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="trip-journey-field"><span>{copy.kind}</span><select name="journey-kind" value={kind} disabled={busy || Boolean(offered)} onChange={(event) => setKind(event.target.value as JourneyEntry["kind"])}>{Object.entries(copy.kinds).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>
        {offered ? <><p className="trip-journey-bookmark-context">{copy.offer}</p><div className="trip-journey-form-pair"><label className="trip-journey-field"><span>{copy.placement}</span><select name="journey-placement" value={placement} disabled={busy} onChange={(event) => setPlacement(event.target.value as NonNullable<JourneyEntry["placement"]>)}><option value="stop">{copy.stop}</option><option value="day">{copy.numberedDay}</option></select></label><label className="trip-journey-field"><span>{copy.ordinal}</span><input type="number" inputMode="numeric" name="journey-ordinal" min={1} max={99} step={1} required value={ordinal} disabled={busy} onChange={(event) => setOrdinal(event.target.value)} /></label></div></> : null}
        <label className="trip-journey-field"><span>{copy.day}</span><input type="text" name="journey-day" autoComplete="off" maxLength={80} value={dayLabel} placeholder={copy.dayExample} disabled={busy} onChange={(event) => setDayLabel(event.target.value)} /></label>
        <label className="trip-journey-field"><span>{copy.date}</span><input type="text" name="journey-date" autoComplete="off" maxLength={160} value={dateLabel} placeholder={copy.dateExample} disabled={busy} onChange={(event) => setDateLabel(event.target.value)} /></label>
        {failure ? <p className="trip-journey-dialog-error" role="alert">{failure}</p> : null}
      </div>
      <footer className="trip-journey-dialog-actions"><button className="trip-journey-cancel" type="button" disabled={busy} onClick={() => { if (!busy) onClose(); }}>{copy.cancel}</button><button className="trip-journey-save" type="submit" disabled={busy || !valid}>{busy ? <><LoaderCircle className="trip-journey-spinning" size={15} aria-hidden="true" /><span role="status">{copy.saving}</span></> : failure ? copy.retry : copy.save}</button></footer>
    </form>
  </dialog>, document.body);
}
