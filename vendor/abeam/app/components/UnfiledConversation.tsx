"use client";

import type { UILanguage } from "@/lib/ui/language";
import { ArrowLeft, ChevronRight, MessagesSquare, Trash2 } from "lucide-react";
import { useId, type ReactNode } from "react";

import "./unfiled-conversation.css";

export type UnfiledConversationProps = {
  language: UILanguage;
  /** A caller-owned display label, shared with the dashboard and inbox. */
  label: string;
  identifier?: string;
  date: string;
  duration: string;
  status?: ReactNode;
  onBack: () => void;
  onFile: () => void;
  transcript: ReactNode;
  audio?: ReactNode;
  feedback?: ReactNode;
  id?: string;
  onDelete?: (id: string) => void;
  deleting?: boolean;
  deletionBusy?: boolean;
  deleteDisabled?: boolean;
};

const DELETE_COPY = {
  fr: { delete: "Supprimer la conversation", deleting: "Suppression…", all: "Supprimer tout", allLabel: "Supprimer toutes les conversations à classer", folders: "Dossiers", pending: "Une suppression est déjà en cours.", unavailable: "Disponible après l’enregistrement ou le traitement." },
  en: { delete: "Delete conversation", deleting: "Deleting…", all: "Delete all", allLabel: "Delete all unfiled conversations", folders: "Folders", pending: "A deletion is already in progress.", unavailable: "Available after recording or processing has finished." },
} as const;

function UnfiledDeleteAction({ id, label, language, deleting, disabled, reason, onDelete }: {
  id: string;
  label: string;
  language: UILanguage;
  deleting: boolean;
  disabled: boolean;
  reason?: string;
  onDelete: (id: string) => void;
}) {
  const copy = DELETE_COPY[language];
  const actionLabel = `${deleting ? copy.deleting : copy.delete} : ${label}`;
  return <button type="button" className="unfiled-delete-action" disabled={disabled} aria-label={actionLabel} aria-busy={deleting || undefined} title={reason || actionLabel} onClick={() => { if (!disabled) onDelete(id); }}><Trash2 size={17} strokeWidth={1.7} aria-hidden="true" /></button>;
}

export default function UnfiledConversation({ language, label, identifier, date, duration, status, onBack, onFile, transcript, audio, feedback, id, onDelete, deleting = false, deletionBusy = false, deleteDisabled = false }: UnfiledConversationProps) {
  const fr = language === "fr";
  const titleId = useId();
  return (
    <section className="unfiled-conversation-page" aria-labelledby={titleId}>
      <header className="unfiled-conversation-header">
        <a className="unfiled-back-link" href="#unfiled-conversations" onClick={(event) => { event.preventDefault(); onBack(); }}>{fr ? "Conversations à classer" : "Unfiled conversations"}</a>
        <div className="unfiled-heading-row">
          <div className="unfiled-heading-copy">
            <h1 id={titleId}>{label}</h1>
            <div className="unfiled-conversation-meta"><time>{date}</time><span className="unfiled-duration"><span className="sr-only">{fr ? "Durée : " : "Duration: "}</span>{duration}</span>{status}</div>
            {identifier ? <details className="unfiled-reference"><summary>{fr ? "Référence" : "Reference"}</summary><code className="unfiled-identifier">{identifier}</code></details> : null}
          </div>
          <div className="unfiled-heading-actions"><button className="unfiled-file-action" type="button" onClick={onFile} disabled={deleting || deletionBusy} aria-label={fr ? "Classer dans un dossier" : "File into a folder"}><span className="unfiled-file-label">{fr ? "Classer dans un dossier" : "File into a folder"}</span><span className="unfiled-file-label-compact" aria-hidden="true">{fr ? "Classer" : "File"}</span></button>{onDelete && id ? <UnfiledDeleteAction id={id} label={label} language={language} deleting={deleting} disabled={deleting || deletionBusy || deleteDisabled} reason={deleting || deletionBusy ? DELETE_COPY[language].pending : deleteDisabled ? DELETE_COPY[language].unavailable : undefined} onDelete={onDelete} /> : null}</div>
        </div>
        {audio ? <div className="unfiled-audio-slot">{audio}</div> : null}
      </header>
      <div className="unfiled-transcript-slot" role="region" aria-label={fr ? "Transcription de la conversation" : "Conversation transcript"} tabIndex={0}>{feedback ? <div className="unfiled-feedback">{feedback}</div> : null}{transcript}</div>
    </section>
  );
}

export type UnfiledConversationListProps = {
  language: UILanguage;
  items: { id: string; label: string; date: string; duration?: string; status?: ReactNode; deleteDisabled?: boolean }[];
  onOpen: (id: string) => void;
  emptyState?: ReactNode;
  onBack?: () => void;
  onDelete?: (id: string) => void;
  onDeleteAll?: () => void;
  deletingIds?: ReadonlySet<string>;
  deletingAll?: boolean;
  deletionBusy?: boolean;
};

export function UnfiledConversationList({ language, items, onOpen, emptyState, onBack, onDelete, onDeleteAll, deletingIds, deletingAll = false, deletionBusy = false }: UnfiledConversationListProps) {
  const fr = language === "fr";
  const titleId = useId();
  const copy = DELETE_COPY[language];
  const deleteBusy = deletionBusy || deletingAll || Boolean(deletingIds?.size);
  const deleteAllDisabled = deleteBusy || items.some((item) => item.deleteDisabled);
  return (
    <section className="unfiled-conversation-list-page" id="unfiled-conversations" aria-labelledby={titleId}>
      <header className="unfiled-list-heading">{onBack ? <button type="button" className="unfiled-list-back" onClick={onBack}><ArrowLeft size={16} aria-hidden="true" /><span>{copy.folders}</span></button> : null}<div className="unfiled-list-heading-row"><h1 id={titleId}>{fr ? "Conversations à classer" : "Unfiled conversations"}</h1>{onDeleteAll && items.length ? <button type="button" className="unfiled-delete-all" disabled={deleteAllDisabled} aria-label={deletingAll ? copy.deleting : copy.allLabel} aria-busy={deletingAll || undefined} title={deleteBusy ? copy.pending : deleteAllDisabled ? copy.unavailable : copy.allLabel} onClick={() => { if (!deleteAllDisabled) onDeleteAll(); }}><Trash2 size={16} aria-hidden="true" /><span>{deletingAll ? copy.deleting : copy.all}</span></button> : null}</div></header>
      {items.length ? <ul className="unfiled-conversation-list">
        {items.map((item) => <li key={item.id} data-has-delete={onDelete ? true : undefined}>
          <button className="unfiled-list-row" type="button" disabled={deletionBusy || deletingAll || deletingIds?.has(item.id)} onClick={() => onOpen(item.id)}>
            <span className="unfiled-list-icon" aria-hidden="true"><MessagesSquare size={18} strokeWidth={1.6} /></span>
            <span className="unfiled-list-copy">
              <span className="unfiled-list-title-row"><strong title={item.label}>{item.label}</strong></span>
              <span className="unfiled-list-meta"><time>{item.date}</time>{item.duration ? <span className="unfiled-duration"><span className="sr-only">{fr ? "Durée : " : "Duration: "}</span>{item.duration}</span> : null}</span>
            </span>
            <span className="unfiled-list-status">{item.status}</span>
            <ChevronRight className="unfiled-list-chevron" size={15} aria-hidden="true" />
          </button>
          {onDelete ? <UnfiledDeleteAction id={item.id} label={item.label} language={language} deleting={Boolean(deletingIds?.has(item.id)) || deletingAll} disabled={deleteBusy || Boolean(item.deleteDisabled)} reason={deleteBusy ? copy.pending : item.deleteDisabled ? copy.unavailable : undefined} onDelete={onDelete} /> : null}
        </li>)}
      </ul> : emptyState ?? <p className="unfiled-list-empty">{fr ? "Aucune conversation à classer." : "No conversations to file."}</p>}
    </section>
  );
}
