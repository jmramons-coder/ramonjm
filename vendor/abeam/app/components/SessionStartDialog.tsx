"use client";

import { Mic } from "lucide-react";
import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import type { UILanguage } from "@/lib/ui/language";
import ShaderOrb from "./ShaderOrb";
import styles from "./SessionStartDialog.module.css";

export interface SessionStartDialogProps {
  language: UILanguage;
  consent: boolean;
  onConsentChange: (consent: boolean) => void;
  onStart: () => void;
  onDismiss: () => void;
  context?: string;
}

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
const COPY = {
  fr: {
    title: "Démarrer la conversation",
    consent: "Le client a donné son accord",
    description: "En démarrant, vous confirmez son accord et activez le microphone.",
    start: "Démarrer",
    back: "Retour",
  },
  en: {
    title: "Start the conversation",
    consent: "The client has agreed",
    description: "Starting confirms their agreement and turns on the microphone.",
    start: "Start",
    back: "Back",
  },
} as const;

/** Mounted only while the agent confirms the start; never requests microphone access itself. */
export default function SessionStartDialog({
  language, consent, onConsentChange, onStart, onDismiss, context,
}: SessionStartDialogProps) {
  const copy = COPY[language];
  const id = useId();
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const initialConsent = useRef(consent);
  const folderContext = context?.trim();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!hydrated || !dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    (initialConsent.current ? startRef.current : consentRef.current)?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [hydrated]);

  if (!hydrated) return null;
  return createPortal(
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      lang={language}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => { event.preventDefault(); onDismiss(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onDismiss();
      }}
    >
      <header className={styles.heading}>
        <ShaderOrb className={styles.orb} tone="blue" edge="smooth" animated />
        <h2 id={`${id}-title`}>{copy.title}</h2>
        {folderContext ? <p className={styles.context} title={folderContext}>{folderContext}</p> : null}
      </header>
      <label className={styles.consent}>
        <span>{copy.consent}</span>
        <input
          ref={consentRef}
          className={styles.switch}
          type="checkbox"
          role="switch"
          checked={consent}
          onChange={(event) => onConsentChange(event.target.checked)}
        />
      </label>
      <p className={styles.description} id={`${id}-description`}>{copy.description}</p>
      <footer className={styles.actions}>
        <button className={styles.back} type="button" onClick={onDismiss}>{copy.back}</button>
        <button
          ref={startRef}
          className={styles.start}
          type="button"
          disabled={!consent}
          onClick={() => { if (consent) onStart(); }}
        >
          <Mic size={17} aria-hidden="true" />
          <span>{copy.start}</span>
        </button>
      </footer>
    </dialog>,
    document.body,
  );
}
