"use client";

import { ArrowLeft, ChevronRight, FileText, MessagesSquare, Mic, RotateCw, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from "react";
import type { UILanguage } from "@/lib/ui/language";
import EmptyState from "./EmptyState";
import "./folder-conversations.css";

export type FolderConversationRow = {
  id: string;
  label: string;
  date: string;
  dateTime: string;
  duration: string;
  status: ReactNode;
  processing: boolean;
  canResume: boolean;
  resuming: boolean;
  deleteDisabled?: boolean;
};

export type FolderConversationsProps = {
  rows: FolderConversationRow[];
  activeId: string;
  detailOpen: boolean;
  language: UILanguage;
  onSelect: (id: string) => void;
  onBack: () => void;
  onResume: (id: string) => void;
  onStartConversation: () => void;
  transcript: ReactNode;
  player: ReactNode;
  activeReference?: string;
  onDelete?: (id: string) => void;
  deletingIds?: ReadonlySet<string>;
  deletionBusy?: boolean;
};

const COMPACT_CONVERSATIONS = "(max-width: 800px)";
function subscribe(listener: () => void) {
  const media = window.matchMedia(COMPACT_CONVERSATIONS);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
const compactSnapshot = () => window.matchMedia(COMPACT_CONVERSATIONS).matches;
const serverSnapshot = () => true;

const COPY = {
  fr: {
    conversations: "Conversations", back: "Retour aux conversations", recordings: "Conversations enregistrées", transcript: "Transcription",
    empty: "Aucune conversation", emptyHint: "Commencez une conversation pour conserver l’audio et la transcription dans ce dossier.",
    start: "Démarrer une conversation", select: "Choisissez une conversation", selectHint: "Sélectionnez un enregistrement pour relire la transcription et écouter l’audio.",
    resume: "Reprendre", resuming: "Reprise…", resumeProcessing: "Reprendre le traitement", reference: "Référence de la conversation",
    delete: "Supprimer la conversation", deleting: "Suppression…", deletionPending: "Une suppression est déjà en cours.", deleteUnavailable: "Disponible après l’enregistrement ou le traitement.",
  },
  en: {
    conversations: "Conversations", back: "Back to conversations", recordings: "Recorded conversations", transcript: "Transcript",
    empty: "No conversations", emptyHint: "Start a conversation to keep its audio and transcript in this folder.",
    start: "Start a conversation", select: "Choose a conversation", selectHint: "Select a recording to read its transcript and listen to its audio.",
    resume: "Resume", resuming: "Resuming…", resumeProcessing: "Resume processing", reference: "Conversation reference",
    delete: "Delete conversation", deleting: "Deleting…", deletionPending: "A deletion is already in progress.", deleteUnavailable: "Available after recording or processing has finished.",
  },
} as const;

function DeleteConversationButton({ id, label, language, deleting, disabled, reason, onDelete }: {
  id: string;
  label: string;
  language: UILanguage;
  deleting: boolean;
  disabled: boolean;
  reason?: string;
  onDelete: (id: string) => void;
}) {
  const copy = COPY[language];
  const actionLabel = `${deleting ? copy.deleting : copy.delete} : ${label}`;
  return <button type="button" className="fc-delete" disabled={disabled} aria-label={actionLabel} aria-busy={deleting || undefined} title={reason || actionLabel} onClick={() => { if (!disabled) onDelete(id); }}><Trash2 size={17} strokeWidth={1.7} aria-hidden="true" /></button>;
}

/** A flat recording list and its selected transcript; playback stays explicit. */
export default function FolderConversations({ rows, activeId, detailOpen, language, onSelect, onBack, onResume, onStartConversation, transcript, player, activeReference, onDelete, deletingIds, deletionBusy = false }: FolderConversationsProps) {
  const compact = useSyncExternalStore(subscribe, compactSnapshot, serverSnapshot);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());
  const focusIntent = useRef<{ target: "detail" | "list"; id: string } | null>(null);
  const previousView = useRef<{ compact: boolean; detailId: string | null }>({ compact: false, detailId: null });
  const headingId = useId();
  const detailId = useId();
  const referenceId = useId();
  const copy = COPY[language];
  const active = rows.find((row) => row.id === activeId);
  const mobileDetailOpen = compact && detailOpen && Boolean(active);
  const showDetail = !compact || mobileDetailOpen;
  const resumeBusy = rows.some((row) => row.resuming);
  const deleteBusy = deletionBusy || Boolean(deletingIds?.size);

  useEffect(() => {
    const previous = previousView.current;
    previousView.current = { compact, detailId: mobileDetailOpen ? activeId : null };
    if (!compact) {
      focusIntent.current = null;
      return;
    }
    if (!focusIntent.current && mobileDetailOpen && (!previous.compact || previous.detailId !== activeId)) focusIntent.current = { target: "detail", id: activeId };
    if (!mobileDetailOpen && previous.detailId && focusIntent.current?.target !== "list") focusIntent.current = { target: "list", id: previous.detailId };
    const intent = focusIntent.current;
    if (!intent || (intent.target === "detail" && (!mobileDetailOpen || activeId !== intent.id)) || (intent.target === "list" && mobileDetailOpen)) return;
    const frame = window.requestAnimationFrame(() => {
      if (focusIntent.current !== intent || previousView.current.detailId !== (intent.target === "detail" ? intent.id : null)) return;
      const canFocus = (element: HTMLElement | null | undefined): element is HTMLElement => Boolean(element?.isConnected && !element.matches(":disabled") && !element.closest("[hidden], [inert]") && element.getClientRects().length);
      const row = rowRefs.current.get(intent.id);
      const target = intent.target === "detail" ? (canFocus(headingRef.current) ? headingRef.current : null) : (canFocus(row) ? row : canFocus(listRef.current) ? listRef.current : null);
      // Back returns to the selected row after the mobile document lock is
      // released. Reveal only that owned row, without moving transcript focus.
      if (intent.target === "list" && target && target === row) target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
      target?.focus({ preventScroll: true });
      if (focusIntent.current === intent) focusIntent.current = null;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeId, compact, mobileDetailOpen]);

  function selectRecording(id: string) {
    if (compact) focusIntent.current = { target: "detail", id };
    onSelect(id);
  }

  function backToRecordings() {
    focusIntent.current = { target: "list", id: activeId };
    onBack();
  }

  if (!rows.length) return <section className="folder-conversations fc-empty">
    <EmptyState language={language} headingLevel={2} icon={MessagesSquare} title={copy.empty} description={copy.emptyHint} action={{ label: copy.start, onClick: onStartConversation, icon: Mic }} />
  </section>;

  return <section className="folder-conversations" data-detail-open={mobileDetailOpen || undefined}>
    <div className="fc-recordings" aria-label={copy.recordings} hidden={mobileDetailOpen}>
      <ul className="fc-recording-list ab-scroll-y" ref={listRef} tabIndex={-1} aria-label={copy.recordings}>
        {rows.map((row) => <li className="fc-recording" key={row.id} data-active={row.id === activeId || undefined} data-processing={row.processing || undefined}>
          <button type="button" className="fc-recording-select" ref={(element) => { if (element) rowRefs.current.set(row.id, element); else rowRefs.current.delete(row.id); }} disabled={deletionBusy || deletingIds?.has(row.id)} aria-current={row.id === activeId ? "true" : undefined} aria-controls={showDetail ? detailId : undefined} title={`${row.label} · ${row.id}`} onClick={() => selectRecording(row.id)}>
            <Mic className="fc-recording-icon" size={17} strokeWidth={1.7} aria-hidden="true" />
            <span className="fc-recording-copy">
              <span className="fc-recording-title"><strong>{row.label}</strong>{row.status}</span>
              <span className="fc-recording-meta"><time dateTime={row.dateTime} title={row.date}>{row.date}</time><span>{row.duration}</span></span>
            </span>
            <ChevronRight className="fc-recording-chevron" size={16} aria-hidden="true" />
          </button>
          {row.canResume ? <button type="button" className="fc-recording-resume" disabled={resumeBusy || row.processing || deleteBusy} aria-label={`${row.resuming ? copy.resuming : copy.resumeProcessing} : ${row.label}`} title={row.resuming ? copy.resuming : copy.resumeProcessing} onClick={() => onResume(row.id)}><RotateCw size={16} aria-hidden="true" /><span className="ab-sr-only">{row.resuming ? copy.resuming : copy.resume}</span></button> : null}
          {onDelete ? <DeleteConversationButton id={row.id} label={row.label} language={language} deleting={Boolean(deletingIds?.has(row.id))} disabled={deleteBusy || resumeBusy || row.processing || Boolean(row.deleteDisabled)} reason={deleteBusy ? copy.deletionPending : row.deleteDisabled || row.processing || resumeBusy ? copy.deleteUnavailable : undefined} onDelete={onDelete} /> : null}
        </li>)}
      </ul>
    </div>
    {showDetail ? <section className="fc-detail" id={detailId} aria-labelledby={active ? headingId : undefined} aria-label={active ? undefined : copy.transcript}>
      {active ? <>
        <header className="fc-detail-header">
          {compact ? <button type="button" className="fc-back" onClick={backToRecordings} aria-label={copy.back} title={copy.back}><ArrowLeft size={17} aria-hidden="true" /><span>{copy.conversations}</span></button> : null}
          <div className="fc-detail-heading-copy"><h2 id={headingId} ref={headingRef} tabIndex={-1} title={activeReference || active.id} aria-describedby={referenceId}>{active.label}</h2><time dateTime={active.dateTime} title={active.date}>{active.date}</time><span className="ab-sr-only" id={referenceId}>{copy.reference} : {activeReference || active.id}</span></div>
          {onDelete ? <DeleteConversationButton id={active.id} label={active.label} language={language} deleting={Boolean(deletingIds?.has(active.id))} disabled={deleteBusy || resumeBusy || active.processing || Boolean(active.deleteDisabled)} reason={deleteBusy ? copy.deletionPending : active.deleteDisabled || active.processing || resumeBusy ? copy.deleteUnavailable : undefined} onDelete={onDelete} /> : null}
        </header>
        <div className="fc-transcript">{transcript}</div>
        {player ? <footer className="fc-player">{player}</footer> : null}
      </> : <div className="fc-detail-empty"><EmptyState compact language={language} icon={FileText} title={copy.select} description={copy.selectHint} /></div>}
    </section> : null}
  </section>;
}
