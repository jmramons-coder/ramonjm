"use client";

import { type ReactNode, type RefObject } from "react";
import styles from "./desktop-project-card.module.css";

export type DesktopCardBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function DesktopProjectCard({
  name,
  title,
  detail,
  tone,
  label,
  openLabel,
  opener,
  paused,
  opened = false,
  onOpen,
  children,
  companion,
  brand,
}: {
  name: string;
  title: ReactNode;
  detail: string;
  tone: "case" | "crypto" | "decision" | "abeam";
  label: string;
  openLabel: string;
  opener: RefObject<HTMLButtonElement | null>;
  paused: boolean;
  opened?: boolean;
  onOpen: (bounds: DesktopCardBounds) => void;
  children: ReactNode;
  companion?: ReactNode;
  brand?: ReactNode;
}) {
  return (
    <article
      className={styles.card}
      data-tone={tone}
      data-paused={paused}
      data-open={opened}
      aria-label={label}
      onPointerMove={(event) => {
        if (
          !companion ||
          paused ||
          event.pointerType !== "mouse" ||
          matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          return;
        const box = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty(
          "--preview-x",
          String(((event.clientX - box.left) / box.width) * 2 - 1),
        );
        event.currentTarget.style.setProperty(
          "--preview-y",
          String(((event.clientY - box.top) / box.height) * 2 - 1),
        );
      }}
      onPointerLeave={(event) => {
        if (!companion) return;
        event.currentTarget.style.removeProperty("--preview-x");
        event.currentTarget.style.removeProperty("--preview-y");
      }}
    >
      <header className={styles.copy}>
        <span className={styles.name}>{brand ?? name}</span>
        <h2>{title}</h2>
        <p>{detail}</p>
      </header>
      <div className={styles.stage} aria-hidden="true" inert>
        <div className={styles.window} data-desktop-frame>
          <div className={styles.chrome}>
            <span className={styles.windowLights}>
              <i />
              <i />
              <i />
            </span>
            <span>{name}</span>
          </div>
          <div className={styles.viewport}>{children}</div>
        </div>
        {companion && <div className={styles.companion}>{companion}</div>}
      </div>
      <button
        ref={opener}
        type="button"
        className={styles.open}
        aria-label={openLabel}
        aria-haspopup="dialog"
        onClick={(event) => {
          const card = event.currentTarget.closest("article");
          if (!card) return;
          const frame = card.querySelector("[data-desktop-frame]") ?? card;
          const { left, top, width, height } = frame.getBoundingClientRect();
          onOpen({ left, top, width, height });
        }}
      >
        <span className={styles.hint} data-discovery-hint>Click to explore</span>
      </button>
    </article>
  );
}
