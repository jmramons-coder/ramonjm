"use client";

import type { UILanguage } from "@/lib/ui/language";
import { ChevronRight, Folder, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import "./conversation-filing.css";

type Fields = { folderTitle: string; clientName: string; email: string; phone: string };
type Props = {
  language: UILanguage;
  context: string;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  search: string;
  onSearchChange: (value: string) => void;
  fields: Fields;
  onFieldChange: (field: keyof Fields, value: string) => void;
  folders: { key: string; title: string; clientName: string }[];
  onSelectFolder: (key: string) => void;
  onCreate: () => void;
  onDismiss: () => void;
};
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export default function ConversationFilingDialog({ language, context, createOpen, onCreateOpenChange, search, onSearchChange, fields, onFieldChange, folders, onSelectFolder, onCreate, onDismiss }: Props) {
  const fr = language === "fr";
  const id = useId();
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const initialCreateOpen = useRef(createOpen);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!hydrated || !dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => (initialCreateOpen.current ? nameRef.current : searchRef.current)?.focus());
    return () => {
      cancelAnimationFrame(frame);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus();
    };
  }, [hydrated]);

  if (!hydrated) return null;
  return createPortal(
    <dialog ref={dialogRef} className="filing-dialog" lang={language} aria-labelledby={`${id}-title`} aria-describedby={`${id}-context`} onCancel={(event) => { event.preventDefault(); onDismiss(); }} onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onDismiss();
    }}>
      <button className="filing-close" type="button" onClick={onDismiss} aria-label={fr ? "Fermer" : "Close"}><X size={19} aria-hidden="true" /></button>
      <header className="filing-heading"><h2 id={`${id}-title`}>{fr ? "Classer la conversation" : "File the conversation"}</h2><p id={`${id}-context`}>{context}</p></header>
      <div className="filing-tabs" role="tablist" aria-label={fr ? "Destination de la conversation" : "Conversation destination"}>
        {[fr ? "Dossier existant" : "Existing folder", fr ? "Nouveau dossier" : "New folder"].map((label, index) => <button key={index} ref={(element) => { tabsRef.current[index] = element; }} id={`${id}-tab-${index}`} type="button" role="tab" aria-selected={createOpen === Boolean(index)} aria-controls={`${id}-panel-${index}`} tabIndex={createOpen === Boolean(index) ? 0 : -1} onClick={() => onCreateOpenChange(Boolean(index))} onKeyDown={(event) => {
          const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : ["ArrowLeft", "ArrowRight"].includes(event.key) ? 1 - index : null;
          if (next === null) return;
          event.preventDefault(); onCreateOpenChange(Boolean(next)); tabsRef.current[next]?.focus();
        }}>{label}</button>)}
      </div>
      <div id={`${id}-panel-0`} role="tabpanel" aria-labelledby={`${id}-tab-0`} className="filing-choice-panel" hidden={createOpen}>
        <label className="filing-search"><Search size={16} aria-hidden="true" /><span className="sr-only">{fr ? "Rechercher un dossier ou un client" : "Search folders or clients"}</span><input ref={searchRef} type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder={fr ? "Rechercher un dossier ou un client" : "Search folders or clients"} /></label>
        <ul className="filing-folders" aria-label={fr ? "Dossiers existants" : "Existing folders"}>
          {folders.map((folder) => <li key={folder.key}><button className="filing-folder" type="button" onClick={() => onSelectFolder(folder.key)}><Folder size={18} className="filing-folder-icon" aria-hidden="true" /><span><strong>{folder.title}</strong><small>{folder.clientName}</small></span><ChevronRight size={15} aria-hidden="true" /></button></li>)}
        </ul>
        {!folders.length ? <p className="filing-empty">{fr ? "Aucun dossier trouvé. Essayez un autre nom ou créez un dossier." : "No folders found. Try another name or create a folder."}</p> : null}
      </div>
      <form id={`${id}-panel-1`} role="tabpanel" aria-labelledby={`${id}-tab-1`} className="filing-choice-panel filing-form" hidden={!createOpen} onSubmit={(event) => { event.preventDefault(); onCreate(); }}>
        <label className="filing-field"><span>{fr ? "Nom du dossier" : "Folder name"}<b aria-hidden="true">*</b></span><input ref={nameRef} required maxLength={240} value={fields.folderTitle} onChange={(event) => onFieldChange("folderTitle", event.target.value)} placeholder={fr ? "Ex. Anniversaire à Paris" : "e.g. Paris anniversary trip"} /></label>
        <label className="filing-field"><span>{fr ? "Nom du client" : "Client name"}<b aria-hidden="true">*</b></span><input required maxLength={240} autoComplete="name" value={fields.clientName} onChange={(event) => onFieldChange("clientName", event.target.value)} placeholder={fr ? "Ex. Marion Dupont" : "e.g. Marion Dupont"} /></label>
        <div className="filing-field-pair">
          <label className="filing-field"><span>{fr ? "Courriel" : "Email"}</span><input type="email" autoComplete="email" value={fields.email} onChange={(event) => onFieldChange("email", event.target.value)} placeholder="client@example.com" /></label>
          <label className="filing-field"><span>{fr ? "Téléphone" : "Phone"}</span><input type="tel" autoComplete="tel" value={fields.phone} onChange={(event) => onFieldChange("phone", event.target.value)} placeholder="+1 514 555 0123" /></label>
        </div>
      </form>
      <footer className="filing-footer">{createOpen ? <button className="filing-save" type="submit" form={`${id}-panel-1`} disabled={!fields.folderTitle.trim() || !fields.clientName.trim()}>{fr ? "Créer et classer" : "Create and file"}</button> : null}<button className="filing-later" type="button" onClick={onDismiss}>{fr ? "Classer plus tard" : "Organize later"}</button></footer>
    </dialog>, document.body,
  );
}
