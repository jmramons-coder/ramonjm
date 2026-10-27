"use client";

import { LoaderCircle, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import type { UILanguage } from "@/lib/ui/language";

import "./workspace-deletion.css";

export type WorkspaceDeletionDialogProps = {
  language: UILanguage;
  type: "conversation" | "conversations" | "folder";
  /** Captured by the caller when the confirmation is opened. */
  count: number;
  title?: string;
  busy: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
};

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
const COPY = {
  fr: {
    conversationTitle: "Supprimer cette conversation ?",
    conversationsTitle: (count: string, single: boolean) => `Supprimer ${count} ${single ? "conversation" : "conversations"} ?`,
    folderTitle: "Supprimer ce dossier ?",
    conversationDescription: "Cette action supprime définitivement la conversation, sa transcription et son enregistrement audio. Le parcours du voyage est également supprimé si c’est la dernière conversation du dossier.",
    conversationsDescription: (count: string) => `Ces ${count} conversations seront supprimées définitivement, avec leurs transcriptions et leurs enregistrements audio. Un parcours sans conversation restante sera également supprimé.`,
    folderDescription: "Cette action supprime définitivement le dossier et toutes les conversations qui lui sont rattachées, avec leurs transcriptions, enregistrements audio, signets et le parcours du voyage.",
    folderAcknowledgement: "Je confirme la suppression définitive de ce dossier et de toutes ses conversations.",
    cancel: "Annuler",
    close: "Fermer",
    confirm: "Supprimer",
    retry: "Réessayer",
    deleting: "Suppression en cours…",
  },
  en: {
    conversationTitle: "Delete this conversation?",
    conversationsTitle: (count: string, single: boolean) => `Delete ${count} ${single ? "conversation" : "conversations"}?`,
    folderTitle: "Delete this folder?",
    conversationDescription: "This permanently deletes the conversation, its transcript, and its audio recording. Its saved trip journey is also removed if this is the folder’s last conversation.",
    conversationsDescription: (count: string) => `These ${count} conversations will be permanently deleted, including their transcripts and audio recordings. A journey with no remaining conversation is also removed.`,
    folderDescription: "This permanently deletes the folder and every conversation attached to it, including their transcripts, audio recordings, bookmarks and saved trip journey.",
    folderAcknowledgement: "I confirm permanent deletion of this folder and all its conversations.",
    cancel: "Cancel",
    close: "Close",
    confirm: "Delete",
    retry: "Retry",
    deleting: "Deleting…",
  },
} as const;

function focusConnected(element: HTMLElement | null): boolean {
  if (!element?.isConnected || element.matches(":disabled") || element.closest("[inert]") || element.getClientRects().length === 0) return false;
  element.focus({ preventScroll: true });
  return document.activeElement === element;
}

function restoreWorkspaceFocus(opener: HTMLElement | null) {
  if (focusConnected(opener)) return;
  // A removed row cannot receive focus after deletion; return to the current page.
  const candidates = [...document.querySelectorAll<HTMLElement>(".product-shell main h1, main h1"), document.querySelector<HTMLElement>(".product-shell main, main"), document.body];
  for (const candidate of candidates) {
    if (!candidate?.isConnected) continue;
    const hadTabIndex = candidate.hasAttribute("tabindex");
    if (!hadTabIndex) candidate.setAttribute("tabindex", "-1");
    const focused = focusConnected(candidate);
    if (!hadTabIndex) candidate.removeAttribute("tabindex");
    if (focused) return;
  }
}

/** Confirmation only. The caller owns the deletion snapshot, request and outcome. */
export default function WorkspaceDeletionDialog({ language, type, count, title, busy, error, onClose, onConfirm }: WorkspaceDeletionDialogProps) {
  const copy = COPY[language];
  const id = useId();
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const validCount = Number.isSafeInteger(count) && count >= (type === "folder" ? 0 : 1) && (type !== "conversation" || count === 1);
  const single = type === "conversation" || (type === "conversations" && count === 1);
  const countLabel = validCount ? new Intl.NumberFormat(language === "fr" ? "fr-CA" : "en-CA").format(count) : "";
  const heading = type === "folder" ? copy.folderTitle : type === "conversation" ? copy.conversationTitle : copy.conversationsTitle(countLabel, single);
  const description = type === "folder" ? copy.folderDescription : single ? copy.conversationDescription : copy.conversationsDescription(countLabel);
  const context = title?.trim();
  const failure = error?.trim();
  const confirmationScope = JSON.stringify([type, context ?? "", count]);
  const [confirmedScope, setConfirmedScope] = useState<string | null>(null);
  const folderConfirmed = confirmedScope === confirmationScope;
  const canConfirm = validCount && (type !== "folder" || folderConfirmed);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!hydrated || !dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus({ preventScroll: true });
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      restoreWorkspaceFocus(opener);
    };
  }, [hydrated]);

  if (!hydrated) return null;
  return createPortal(
    <dialog
      ref={dialogRef}
      className="workspace-deletion-dialog"
      role="alertdialog"
      lang={language}
      aria-labelledby={`${id}-title`}
      aria-describedby={[`${id}-description`, context ? `${id}-context` : "", failure ? `${id}-error` : ""].filter(Boolean).join(" ")}
      aria-busy={busy || undefined}
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
      onClick={(event) => {
        if (busy || event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}
    >
      <header className="workspace-deletion-header">
        <span className="workspace-deletion-mark" aria-hidden="true"><Trash2 size={22} /></span>
        <h2 id={`${id}-title`}>{heading}</h2>
        <button className="workspace-deletion-close" type="button" aria-label={copy.close} disabled={busy} onClick={() => { if (!busy) onClose(); }}><X size={18} aria-hidden="true" /></button>
      </header>
      <div className="workspace-deletion-content">
        {context ? <p className="workspace-deletion-context" id={`${id}-context`}>{context}</p> : null}
        <p className="workspace-deletion-description" id={`${id}-description`}>{description}</p>
        {type === "folder" ? <label className="workspace-deletion-acknowledgement">
          <input type="checkbox" name="confirm-folder-deletion" checked={folderConfirmed} disabled={busy} onChange={(event) => { if (!busy) setConfirmedScope(event.target.checked ? confirmationScope : null); }} />
          <span>{copy.folderAcknowledgement}</span>
        </label> : null}
        {failure ? <p className="workspace-deletion-error" id={`${id}-error`} role="alert">{failure}</p> : null}
        {busy ? <p className="workspace-deletion-status" role="status"><LoaderCircle size={14} aria-hidden="true" />{copy.deleting}</p> : null}
      </div>
      <footer className="workspace-deletion-actions">
        <button className="workspace-deletion-confirm" type="button" disabled={busy || !canConfirm} onClick={() => { if (!busy && canConfirm) onConfirm(); }}>{failure ? copy.retry : copy.confirm}</button>
        <button ref={cancelRef} className="workspace-deletion-cancel" type="button" disabled={busy} onClick={() => { if (!busy) onClose(); }}>{copy.cancel}</button>
      </footer>
    </dialog>,
    document.body,
  );
}
