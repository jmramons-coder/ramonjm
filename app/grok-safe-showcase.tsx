"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  GrokSafeScenario,
  GrokSafeScenarioDialog,
  type GrokScenarioHandle,
} from "./grok-safe-scenario";
import listStyles from "./home.module.css";
import styles from "./grok-safe-showcase.module.css";

export function GrokSafeShowcase({ paused }: { paused: boolean }) {
  const [open, setOpen] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const video = useRef<GrokScenarioHandle>(null);
  const opener = useRef<HTMLButtonElement>(null);
  function closeScenario(position: number) {
    video.current?.seek(position);
    setOpen(false);
    requestAnimationFrame(() => opener.current?.focus());
  }
  return (
    <>
      <article className={styles.card} aria-label="Grok Safe" data-open={open}>
        <GrokSafeScenario
          hideControls
          paused={paused || open}
          playbackRef={video}
          inspectRef={opener}
          onInspect={(position) => {
            setStartTime(position);
            setOpen(true);
          }}
        />
        <p className={styles.srOnly}>
          Independent concept · Simulated analysis.
          <br />
          Not affiliated with X or xAI.
        </p>
      </article>
      {open && (
        <GrokSafeScenarioDialog
          paused={paused}
          initialTime={startTime}
          opener={opener}
          onClose={closeScenario}
        />
      )}
    </>
  );
}

export function GrokSafeListEntry() {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  function closeScenario() {
    setOpen(false);
    requestAnimationFrame(() => opener.current?.focus());
  }
  return (
    <>
      <button
        ref={opener}
        className={`${listStyles.project} ${styles.listEntry}`}
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Image
          className={`${listStyles.projectIcon} ${styles.listMark}`}
          src="/showcase/grok-safe/mark.svg"
          alt=""
          width={44}
          height={44}
          unoptimized
        />
        <span className={listStyles.projectBody}>
          <span className={listStyles.projectHeading}>
            <span className={styles.listTitle}>
              Grok Safe · Anti-scam exploration
            </span>
            <span className={listStyles.collaboration}>
              Independent concept
            </span>
          </span>
          <span className={styles.listDescription}>
            Contextual warnings, evidence and next steps inside a conversation.
            <br />
            <span className={listStyles.studyDisclosure}>
              Simulated analysis · Not affiliated with X or xAI
            </span>
          </span>
        </span>
        <span className={listStyles.view} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4" />
          </svg>
        </span>
      </button>
      {open && <GrokSafeScenarioDialog onClose={closeScenario} />}
    </>
  );
}
