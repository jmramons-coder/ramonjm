"use client";

import { useEffect, useRef, useState } from "react";
import { DesktopProjectCard } from "./desktop-project-card";
import { CaseStudyPreview } from "./case-study-preview";
import { MicrosoftBrand } from "./microsoft-brand";
import styles from "./case-study-showcase.module.css";

function WorkspaceDialog({ open, paused, onClose }: {
  open: boolean;
  paused: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = dialog.current;
    if (!node || !open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    node.showModal();
    close.current?.focus({ preventScroll: true });
    return () => {
      node.close();
      document.body.style.overflow = overflow;
    };
  }, [open]);

  useEffect(() => {
    function syncVisibility() {
      frame.current?.contentWindow?.postMessage(
        { type: "case-study:visibility", paused: paused || !open },
        window.location.origin,
      );
    }
    function message(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === "case-study:close" && open) onClose();
      if (event.data?.type === "case-study:ready") syncVisibility();
    }
    syncVisibility();
    window.addEventListener("message", message);
    return () => window.removeEventListener("message", message);
  }, [open, paused, onClose]);

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label="Microsoft case management"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <header className={styles.brand}><MicrosoftBrand /></header>
      <button ref={close} type="button" className={styles.close}
        aria-label="Close Microsoft case management" title="Close workspace" onClick={onClose}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
      <div className={styles.panel} data-ready={ready}>
        {!ready && <span className={styles.loading} role="status">Loading project…</span>}
        <iframe ref={frame} src="/case-workspace" title="Microsoft case management project"
          className={styles.frame} onLoad={() => setReady(true)} />
      </div>
    </dialog>
  );
}

export function CaseWorkspaceShowcase({ paused }: { paused: boolean }) {
  const [open, setOpen] = useState(false);
  const [visited, setVisited] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  return (
    <>
      <DesktopProjectCard
        name="Case management"
        brand={<MicrosoftBrand />}
        title={<>Agent-first.<br /><em>Data in context.</em></>}
        detail="Case management · People + AI specialists"
        tone="case"
        label="Microsoft case management workspace"
        openLabel="Explore Microsoft case management"
        opener={opener}
        paused={paused}
        opened={open}
        onOpen={() => { setVisited(true); setOpen(true); }}
      >
        <CaseStudyPreview cover />
      </DesktopProjectCard>
      {visited && <WorkspaceDialog open={open} paused={paused} onClose={() => {
        setOpen(false);
        requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
      }} />}
    </>
  );
}
