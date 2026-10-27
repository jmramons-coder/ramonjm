"use client";

import { Check, ClipboardCopy, Languages, LoaderCircle, Mail, RefreshCw, SlidersHorizontal, UserRound, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import type { UILanguage } from "@/lib/ui/language";
import "./settings-dialog.css";

export type SettingsSection = "profile" | "settings";
export type SettingsDialogProps = {
  language: UILanguage;
  section: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  onClose: () => void;
  onLanguageChange: (language: UILanguage) => void;
  languageError?: string;
  onRetryLanguage?: () => void;
  profile: { name: string; email: string };
  profileBusy: boolean;
  profileError?: string;
  onSaveProfile: (name: string) => void;
};

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
const COMPACT = "(max-width: 640px)";
function subscribeCompact(listener: () => void) {
  const media = window.matchMedia(COMPACT);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
const compactSnapshot = () => window.matchMedia(COMPACT).matches;
const NAME_LIMIT = 160;
const COPY = {
  fr: {
    account: "Compte", navigation: "Profil et paramètres", profile: "Profil", settings: "Paramètres", close: "Fermer",
    profileDescription: "Votre nom apparaît dans votre espace de travail.", settingsDescription: "Adaptez votre espace à vos préférences.",
    name: "Nom complet", invalidName: "Indiquez un nom entre 1 et 160 caractères.", email: "Adresse courriel",
    emailHint: "Adresse utilisée pour vous connecter. Vous pouvez la sélectionner ou la copier.", copyEmail: "Copier l’adresse courriel",
    copied: "Adresse courriel copiée.", copyUnavailable: "Sélectionnez l’adresse courriel pour la copier.",
    save: "Enregistrer", cancel: "Annuler", saving: "Enregistrement…", saved: "Modifications enregistrées.", unsaved: "Modifications non enregistrées",
    language: "Langue de l’application", autoSave: "Le changement est immédiat. Votre préférence est enregistrée automatiquement.", retry: "Réessayer",
  },
  en: {
    account: "Account", navigation: "Profile and settings", profile: "Profile", settings: "Settings", close: "Close",
    profileDescription: "Your name appears throughout your workspace.", settingsDescription: "Adjust your workspace to your preferences.",
    name: "Full name", invalidName: "Enter a name between 1 and 160 characters.", email: "Email address",
    emailHint: "The address you use to sign in. You can select it or copy it.", copyEmail: "Copy email address",
    copied: "Email address copied.", copyUnavailable: "Select the email address to copy it.",
    save: "Save", cancel: "Cancel", saving: "Saving…", saved: "Changes saved.", unsaved: "Unsaved changes",
    language: "Application language", autoSave: "Changes apply immediately. Your preference is saved automatically.", retry: "Retry",
  },
} as const;

function restoreFocus(opener: HTMLElement | null) {
  const focus = (element: HTMLElement | null) => {
    if (!element?.isConnected || element.matches(":disabled") || element.closest("[inert]") || !element.getClientRects().length) return false;
    element.focus({ preventScroll: true });
    return document.activeElement === element;
  };
  if (focus(opener)) return;
  for (const element of [document.querySelector<HTMLElement>(".product-shell main h1, main h1"), document.querySelector<HTMLElement>(".product-shell main, main"), document.body]) {
    if (!element) continue;
    const hadTabIndex = element.hasAttribute("tabindex");
    if (!hadTabIndex) element.setAttribute("tabindex", "-1");
    const focused = focus(element);
    if (!hadTabIndex) element.removeAttribute("tabindex");
    if (focused) return;
  }
}

/** One owner-scoped mount; section/locale changes never discard an edited name. */
export default function SettingsDialog({ language, section, onSectionChange, onClose, onLanguageChange, languageError, onRetryLanguage, profile, profileBusy, profileError, onSaveProfile }: SettingsDialogProps) {
  const copy = COPY[language];
  const id = useId();
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const compact = useSyncExternalStore(subscribeCompact, compactSnapshot, serverSnapshot);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const navRefs = useRef<Partial<Record<SettingsSection, HTMLButtonElement>>>({});
  const initialSection = useRef(section);
  const copyOperation = useRef({ revision: 0 });
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const [emailCopy, setEmailCopy] = useState<{ email: string; copied: boolean } | null>(null);
  const name = nameDraft ?? profile.name;
  const trimmedName = name.trim();
  const valid = trimmedName.length > 0 && trimmedName.length <= NAME_LIMIT;
  const dirty = trimmedName !== profile.name.trim();
  const failure = profileError?.trim();
  const languageFailure = languageError?.trim();
  const nameError = nameTouched && !valid ? copy.invalidName : undefined;
  const canSave = valid && (dirty || Boolean(failure));
  const saved = submittedName !== null && !profileBusy && !failure && submittedName === profile.name.trim() && trimmedName === submittedName;
  const copyResult = emailCopy?.email === profile.email ? emailCopy : null;
  const emailHint = copyResult ? (copyResult.copied ? copy.copied : copy.copyUnavailable) : copy.emailHint;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!hydrated || !dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const copyController = copyOperation.current;
    const previousOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
    navRefs.current[initialSection.current]?.focus({ preventScroll: true });
    return () => {
      copyController.revision++;
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      restoreFocus(opener);
    };
  }, [hydrated]);

  const switchSection = (event: KeyboardEvent<HTMLButtonElement>) => {
    let next: SettingsSection;
    if (event.key === "Home") next = "profile";
    else if (event.key === "End") next = "settings";
    else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) next = section === "profile" ? "settings" : "profile";
    else return;
    event.preventDefault(); onSectionChange(next); navRefs.current[next]?.focus({ preventScroll: true });
  };
  const copyAddress = async () => {
    const email = profile.email;
    if (!email) return;
    const controller = copyOperation.current;
    const operation = ++controller.revision;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(email);
      if (controller.revision === operation) setEmailCopy({ email, copied: true });
    } catch {
      if (controller.revision === operation) setEmailCopy({ email, copied: false });
    }
  };

  if (!hydrated) return null;
  return createPortal(<dialog ref={dialogRef} className="settings-dialog" lang={language} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
    onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
    <button className="settings-dialog-close" type="button" aria-label={copy.close} onClick={onClose}><X size={18} aria-hidden="true" /></button>
    <aside className="settings-dialog-sidebar">
      <p className="settings-dialog-account">{copy.account}</p>
      <div className="settings-dialog-nav" role="tablist" aria-label={copy.navigation} aria-orientation={compact ? "horizontal" : "vertical"}>
        {(["profile", "settings"] as const).map((key) => {
          const Icon = key === "profile" ? UserRound : SlidersHorizontal;
          return <button ref={(element) => { navRefs.current[key] = element ?? undefined; }} key={key} type="button" role="tab" id={`${id}-${key}-tab`} aria-controls={`${id}-${key}-panel`} aria-selected={section === key} tabIndex={section === key ? 0 : -1} onClick={() => onSectionChange(key)} onKeyDown={switchSection}><Icon size={17} aria-hidden="true" /><span>{copy[key]}</span></button>;
        })}
      </div>
    </aside>
    <div className="settings-dialog-main">
      <header className="settings-dialog-heading"><h2 id={`${id}-title`}>{copy[section]}</h2><p id={`${id}-description`}>{section === "profile" ? copy.profileDescription : copy.settingsDescription}</p></header>
      <section id={`${id}-profile-panel`} className="settings-dialog-panel" role="tabpanel" aria-labelledby={`${id}-profile-tab`} hidden={section !== "profile"}>
        {section === "profile" ? <form className="settings-profile-form" aria-busy={profileBusy || undefined} onSubmit={(event) => {
          event.preventDefault();
          if (profileBusy) return;
          if (!valid) { setNameTouched(true); return; }
          if (!canSave) return;
          setSubmittedName(trimmedName); onSaveProfile(trimmedName);
        }}>
          <div className="settings-dialog-body">
            <div className="settings-dialog-field"><label htmlFor={`${id}-name`}>{copy.name}<span className="settings-dialog-required" aria-hidden="true">*</span></label><input id={`${id}-name`} name="profile-name" type="text" autoComplete="name" required maxLength={NAME_LIMIT} value={name} disabled={profileBusy} aria-invalid={Boolean(nameError) || undefined} aria-describedby={nameError ? `${id}-name-error` : undefined} onChange={(event) => setNameDraft(event.target.value)} onBlur={() => setNameTouched(true)} />{nameError ? <p className="settings-dialog-error" id={`${id}-name-error`}>{nameError}</p> : null}</div>
            <div className="settings-dialog-field"><label htmlFor={`${id}-email`}>{copy.email}</label><div className="settings-dialog-email-row"><div className="settings-dialog-email-input"><Mail size={17} aria-hidden="true" /><input id={`${id}-email`} name="account-email" type="text" inputMode="email" autoComplete="off" value={profile.email} readOnly aria-describedby={`${id}-email-hint`} /></div><button className="settings-dialog-copy" type="button" onClick={() => { void copyAddress(); }} disabled={!profile.email} aria-label={copy.copyEmail} title={copy.copyEmail}>{copyResult?.copied ? <Check size={17} aria-hidden="true" /> : <ClipboardCopy size={17} aria-hidden="true" />}</button></div><p className="settings-dialog-hint" id={`${id}-email-hint`} role={copyResult ? "status" : undefined}>{emailHint}</p></div>
            {failure ? <p className="settings-dialog-error" role="alert">{failure}</p> : null}
          </div>
          <footer className="settings-profile-actions"><p className="settings-profile-feedback" role="status">{profileBusy ? copy.saving : saved ? copy.saved : dirty ? copy.unsaved : ""}</p><button className="settings-dialog-secondary" type="button" onClick={onClose}>{copy.cancel}</button><button className="settings-dialog-primary" type="submit" disabled={profileBusy || !canSave}>{profileBusy ? <LoaderCircle className="settings-dialog-spinning" size={15} aria-hidden="true" /> : null}{copy.save}</button></footer>
        </form> : null}
      </section>
      <section id={`${id}-settings-panel`} className="settings-dialog-panel" role="tabpanel" aria-labelledby={`${id}-settings-tab`} hidden={section !== "settings"}>
        {section === "settings" ? <div className="settings-dialog-body"><fieldset className="settings-dialog-language"><legend><Languages size={17} aria-hidden="true" />{copy.language}</legend>{([{ value: "fr", label: "Français" }, { value: "en", label: "English" }] as const).map((option) => <label key={option.value} className="settings-dialog-language-option" data-selected={language === option.value || undefined}><input type="radio" name="workspace-language" value={option.value} checked={language === option.value} onChange={(event) => { if (event.target.checked && option.value !== language) onLanguageChange(option.value); }} /><span lang={option.value}>{option.label}</span></label>)}</fieldset><p className="settings-dialog-auto-save"><Check size={15} aria-hidden="true" /><span>{copy.autoSave}</span></p>{languageFailure ? <div className="settings-dialog-language-error" role="alert"><p>{languageFailure}</p>{onRetryLanguage ? <button className="settings-dialog-secondary" type="button" onClick={onRetryLanguage}><RefreshCw size={15} aria-hidden="true" />{copy.retry}</button> : null}</div> : null}</div> : null}
      </section>
    </div>
  </dialog>, document.body);
}
