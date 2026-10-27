"use client";

import { AlertCircle, Check, Info, LoaderCircle, MessageCircle, Sparkles, TriangleAlert, X } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState, type FocusEvent, type Ref } from "react";

import type { UILanguage } from "@/lib/ui/language";
import { toastAnnouncement, toastDuration, type ToastMessage, type ToastVariant } from "@/lib/ui/toast";

import "./toast.css";

const VARIANT_ICONS = {
  success: Check,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
  discovery: Sparkles,
  neutral: MessageCircle,
} satisfies Record<ToastVariant, typeof Check>;

export type ToastProps = {
  toast: ToastMessage | null;
  language: UILanguage;
  onDismiss: (id: ToastMessage["id"]) => void;
  placement?: "workspace" | "page";
  contentRef?: Ref<HTMLDivElement>;
};

function ActiveToast({ toast, language, onDismiss, placement, contentRef }: Omit<ToastProps, "toast"> & { toast: ToastMessage }) {
  const [paused, setPaused] = useState(false);
  const interaction = useRef({ hovered: false, focused: false });
  const duration = toastDuration(toast);
  const Icon = toast.pending ? LoaderCircle : VARIANT_ICONS[toast.variant];
  const fr = language === "fr";

  const expire = useEffectEvent((id: ToastMessage["id"], message: string, variant: ToastVariant) => {
    if (interaction.current.hovered || interaction.current.focused || toast.pending) return;
    if (toast.id === id && toast.message === message && toast.variant === variant) onDismiss(id);
  });

  useEffect(() => {
    if (duration === null || paused) return;
    let active = true;
    const timer = window.setTimeout(() => { if (active) expire(toast.id, toast.message, toast.variant); }, duration);
    return () => { active = false; window.clearTimeout(timer); };
  }, [duration, paused, toast.id, toast.message, toast.variant]);

  const pause = (kind: "hovered" | "focused", value: boolean) => {
    interaction.current[kind] = value;
    setPaused(interaction.current.hovered || interaction.current.focused);
  };
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) pause("focused", false);
  };

  return (
    <aside className="abeam-toast-region" lang={language} data-placement={placement} aria-label="Notifications">
      <div
        className="abeam-toast"
        ref={contentRef}
        data-variant={toast.variant}
        data-pending={toast.pending || undefined}
        onMouseEnter={() => pause("hovered", true)}
        onMouseLeave={() => pause("hovered", false)}
        onFocusCapture={() => pause("focused", true)}
        onBlurCapture={onBlur}
      >
        <span className="abeam-toast-icon" aria-hidden="true"><Icon size={18} /></span>
        <div className="abeam-toast-copy">
          <p role={toastAnnouncement(toast.variant)} aria-atomic="true" tabIndex={0}>{toast.message}</p>
          {toast.action ? (
            <button className="abeam-toast-action" type="button" disabled={toast.action.disabled} onClick={toast.action.onClick}>
              {toast.action.label}
            </button>
          ) : null}
        </div>
        {toast.dismissible !== false ? (
          <button className="abeam-toast-close" type="button" onClick={() => onDismiss(toast.id)} aria-label={fr ? "Fermer le message" : "Dismiss message"}>
            <X size={18} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </aside>
  );
}

/** A shared notification surface. Reusing an ID replaces an in-progress action in place. */
export default function Toast({ toast, language, onDismiss, placement = "workspace", contentRef }: ToastProps) {
  return toast ? <ActiveToast key={toast.id} toast={toast} language={language} onDismiss={onDismiss} placement={placement} contentRef={contentRef} /> : null;
}
