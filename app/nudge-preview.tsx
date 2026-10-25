"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./nudge-preview.module.css";

export function NudgePreview({ paused }: { paused: boolean }) {
  const id = useId();
  const [completed, setCompleted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const celebrationTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (celebrationTimer.current !== null)
        window.clearTimeout(celebrationTimer.current);
    },
    [],
  );

  function updateCompletion(next: boolean) {
    setCompleted(next);
    if (celebrationTimer.current !== null)
      window.clearTimeout(celebrationTimer.current);
    setCelebrating(next && !paused);
    if (next && !paused) {
      celebrationTimer.current = window.setTimeout(
        () => setCelebrating(false),
        500,
      );
    }
  }

  return (
    <article
      className={styles.card}
      data-paused={paused ? "true" : "false"}
      aria-labelledby={`${id}-title`}
    >
      <div className={styles.heading}>
        <Image
          src="/nudge/mark.webp"
          alt=""
          width={42}
          height={42}
          unoptimized
          className={styles.mark}
        />
        <div>
          <h2 id={`${id}-title`}>Nudge</h2>
          <p>Shared to-dos.</p>
        </div>
      </div>

      <div className={styles.scene}>
        <span className={styles.halo} aria-hidden="true" />
        <Image
          src="/nudge/medal.webp"
          alt=""
          width={110}
          height={110}
          unoptimized
          className={styles.medal}
        />
        <div
          className={styles.phone}
          role="img"
          aria-label="Nudge app preview showing shared household to-dos"
        >
          <Image
            src="/playground/nudge-home.webp"
            alt=""
            width={384}
            height={835}
            unoptimized
            loading="eager"
            draggable={false}
          />
        </div>

        <div
          className={styles.demo}
          data-completed={completed ? "true" : "false"}
        >
          <p className={styles.demoLabel}>A little interactive win</p>
          <div className={styles.taskRow}>
            <span className={styles.taskIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M4 9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z" />
                <path d="M4 12a19 19 0 0 0 16 0m-10 1v3h4v-3" />
              </svg>
            </span>
            <div className={styles.taskCopy}>
              <span className={styles.taskTitle}>Pack your school bag</span>
              <span className={styles.taskMeta}>Today · Demo task</span>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={completed}
                onChange={(event) => updateCompletion(event.target.checked)}
                aria-label="Complete the demo task: Pack your school bag"
              />
              <span className={styles.check} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="m6 12 4 4 8-9" pathLength="1" />
                </svg>
              </span>
              {celebrating && (
                <span className={styles.celebration} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              )}
            </label>
          </div>
          <div className={styles.feedback}>
            <p role="status">
              {completed
                ? "One less thing to remember."
                : "Try checking it off."}
            </p>
            <div className={styles.progressGroup}>
              <progress
                className={styles.progress}
                value={completed ? 1 : 0}
                max={1}
                aria-label="Demo task completion"
              />
              <span aria-hidden="true">{completed ? "1" : "0"} / 1</span>
            </div>
          </div>
        </div>
      </div>

      <Link href="/nudge" className={styles.projectLink}>
        Explore Nudge
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M5 10h10m-5-5 5 5-5 5" />
        </svg>
      </Link>
    </article>
  );
}
