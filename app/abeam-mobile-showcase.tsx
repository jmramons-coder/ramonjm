"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { DesktopProjectCard } from "./desktop-project-card";
import styles from "./abeam-mobile-showcase.module.css";

function WorkspaceDialog({ open, close }: { open: boolean; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"mobile" | "desktop">(() =>
    typeof window !== "undefined" && matchMedia("(max-width: 600px)").matches ? "mobile" : "desktop",
  );

  useEffect(() => {
    const node = dialog.current;
    if (!node || !open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    node.showModal();
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      node.close();
      document.body.style.overflow = overflow;
    };
  }, [open]);

  useEffect(() => {
    function syncVisibility() {
      frame.current?.contentWindow?.postMessage(
        { type: "abeam-demo:visibility", paused: !open },
        window.location.origin,
      );
    }
    function receive(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === "abeam-demo:ready") {
        setReady(true);
        syncVisibility();
      }
      if (event.data?.type === "abeam-demo:close" && open) close();
    }
    window.addEventListener("message", receive);
    syncVisibility();
    return () => window.removeEventListener("message", receive);
  }, [open, close]);

  return (
    <dialog ref={dialog} className={styles.dialog} data-mode={mode}
      aria-label="Interactive aBeam app" aria-describedby="abeam-demo-note"
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <header className={styles.brand}>
        <Image src="/abeam/icon.svg" alt="" width={32} height={32} unoptimized />
        <h2>aBeam</h2>
      </header>
      <div className={styles.modeToggle} role="group" aria-label="aBeam screen format">
        <button type="button" aria-pressed={mode === "mobile"} onClick={() => setMode("mobile")}>Mobile</button>
        <button type="button" aria-pressed={mode === "desktop"} onClick={() => setMode("desktop")}>Desktop</button>
      </div>
      <button ref={closeButton} className={styles.close} type="button"
        aria-label="Close aBeam app" title="Close aBeam app" onClick={close}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
      <div className={styles.viewport}>
        <div className={styles.panel} data-ready={ready}>
          {!ready && <span className={styles.loading} role="status">Opening aBeam…</span>}
          <iframe ref={frame} src="/embed/abeam/" title="Interactive aBeam workspace"
            className={styles.frame} allow="microphone 'none'; camera 'none'; geolocation 'none'"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
        </div>
      </div>
      <footer className={styles.footer}>
        <p id="abeam-demo-note">Interactive demo · Sample trips · Saved in your browser</p>
        <button type="button" className={styles.reset} aria-label="Reset aBeam demo" title="Reset sample trips"
          disabled={!ready} onClick={() => frame.current?.contentWindow?.postMessage(
            { type: "abeam-demo:reset" }, window.location.origin,
          )}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2.6 8M3 4v6h6" /></svg>
        </button>
      </footer>
    </dialog>
  );
}

export function AbeamMobileShowcase({ paused }: { paused: boolean }) {
  const opener = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [visited, setVisited] = useState(false);
  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
  }, []);
  return (
    <>
      <DesktopProjectCard name="aBeam"
        title={<>From conversation<br /><em>to travel plans.</em></>}
        detail="The travel copilot · Desktop & mobile" tone="abeam"
        label="aBeam desktop and mobile app" openLabel="Explore the interactive aBeam app"
        opener={opener} paused={paused} opened={open}
        onOpen={() => { setVisited(true); setOpen(true); }}
        companion={<Image src="/showcase/abeam/mobile-voice-session.webp"
          alt="aBeam’s mobile voice-session interface." width={780} height={1687} unoptimized draggable={false} />}>
        <Image src="/showcase/abeam/desktop-explorer.webp"
          alt="aBeam’s desktop travel workspace. Open to explore the working app."
          width={1440} height={960} unoptimized draggable={false} />
      </DesktopProjectCard>
      {visited && <WorkspaceDialog open={open} close={close} />}
    </>
  );
}
