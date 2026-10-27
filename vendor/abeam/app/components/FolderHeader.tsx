"use client";

import { ArrowLeft, Mic, Trash2, UserRound } from "lucide-react";
import type { Ref } from "react";
import type { UILanguage } from "@/lib/ui/language";
import "./folder-header.css";

export type FolderHeaderProps = {
  folderTitle: string;
  clientName?: string;
  language: UILanguage;
  overview: boolean;
  headingRef: Ref<HTMLHeadingElement>;
  headerRef?: Ref<HTMLElement>;
  onBack: () => void;
  onStart: () => void;
  onDelete: () => void;
  deleting: boolean;
};

const COPY = {
  fr: { folder: "Dossier", client: "Client principal", unnamedClient: "Client à confirmer", back: "Retour aux dossiers", start: "Démarrer une conversation", delete: "Supprimer le dossier" },
  en: { folder: "Folder", client: "Primary client", unnamedClient: "Client to confirm", back: "Back to folders", start: "Start conversation", delete: "Delete folder" },
} as const;

/** Folder identity and its actions share one row across folder views. */
export default function FolderHeader({ folderTitle, clientName, language, overview, headingRef, headerRef, onBack, onStart, onDelete, deleting }: FolderHeaderProps) {
  const copy = COPY[language];
  const title = folderTitle.trim() || copy.folder;
  const client = clientName?.trim() || copy.unnamedClient;
  const back = <button className="conversation-detail-back review-back-action folder-header-back" type="button" onClick={onBack} aria-label={copy.back} title={copy.back}><ArrowLeft size={16} aria-hidden="true" /><span>{copy.back}</span></button>;

  return <section ref={headerRef} className={`review-header folder-header ${overview ? "review-header--overview" : "review-header--compact"}`}>
    <div className="folder-header-layout" data-overview={overview || undefined}>
      {back}
      <div className="folder-header-client" role="group" aria-label={`${copy.client}: ${client}`}><UserRound size={14} aria-hidden="true" /><span title={client}>{client}</span></div>
      <div className="review-header-copy">
        <div className="review-title-copy"><h1 ref={headingRef} tabIndex={-1} title={title}>{title}</h1></div>
      </div>
      <div className="review-header-actions">
        <button className="primary-button review-start-button mobile-icon-action folder-header-start" type="button" aria-label={copy.start} title={copy.start} onClick={onStart} data-testid="folder-start-session"><span className="button-asset-icon"><Mic className="workspace-icon" size={19} strokeWidth={1.7} aria-hidden="true" /></span><span className="folder-header-action-label">{copy.start}</span></button>
        <button className="folder-header-delete" type="button" onClick={() => { if (!deleting) onDelete(); }} disabled={deleting} aria-busy={deleting || undefined} aria-label={copy.delete}><Trash2 size={17} strokeWidth={1.7} aria-hidden="true" /></button>
      </div>
    </div>
  </section>;
}
