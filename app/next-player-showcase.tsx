"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import styles from "./next-player-showcase.module.css";

const artwork = "/showcase/editorial/nextplayer-handoff.webp";
type Bounds = { left: number; top: number; width: number; height: number };

function NextPlayerPreview({
  origin,
  stage,
  paused,
  onClose,
}: {
  origin: Bounds;
  stage: RefObject<HTMLDivElement | null>;
  paused: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const animation = useRef<Animation | null>(null);
  const closing = useRef(false);

  useEffect(() => {
    const node = dialog.current;
    const image = panel.current;
    if (!node || !image) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    node.showModal();
    closeButton.current?.focus({ preventScroll: true });
    if (!paused && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const target = image.getBoundingClientRect();
      animation.current = image.animate(
        [
          {
            transform: `translate(${origin.left - target.left}px, ${origin.top - target.top}px) scale(${origin.width / target.width}, ${origin.height / target.height})`,
          },
          { transform: "translate(0, 0) scale(1)" },
        ],
        { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" },
      );
    }
    return () => {
      animation.current?.cancel();
      node.close();
      document.body.style.overflow = overflow;
    };
  }, [origin, paused]);

  async function close() {
    if (closing.current) return;
    closing.current = true;
    const image = panel.current;
    const destination = stage.current?.getBoundingClientRect();
    if (
      image &&
      destination &&
      !paused &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      animation.current?.cancel();
      const source = image.getBoundingClientRect();
      animation.current = image.animate(
        [
          { transform: "translate(0, 0) scale(1)" },
          {
            transform: `translate(${destination.left - source.left}px, ${destination.top - source.top}px) scale(${destination.width / source.width}, ${destination.height / source.height})`,
          },
        ],
        { duration: 300, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" },
      );
      await animation.current.finished.catch(() => {});
    }
    onClose();
  }

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label="Next Player artwork"
      onCancel={(event) => {
        event.preventDefault();
        void close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) void close();
      }}
    >
      <div ref={panel} className={styles.panel}>
        <Image
          src={artwork}
          alt="Next Player’s illustrated controller handoff"
          fill
          unoptimized
          sizes="(max-width: 640px) 94vw, 900px"
          className={styles.expandedArt}
        />
      </div>
      <button
        ref={closeButton}
        type="button"
        className={styles.close}
        aria-label="Close Next Player artwork"
        title="Close artwork"
        onClick={() => void close()}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </dialog>
  );
}

export function NextPlayerShowcase({ paused }: { paused: boolean }) {
  const opener = useRef<HTMLButtonElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState<Bounds | null>(null);
  const hasOpened = useRef(false);

  useEffect(() => {
    if (origin) {
      hasOpened.current = true;
    } else if (hasOpened.current) {
      hasOpened.current = false;
      opener.current?.focus({ preventScroll: true });
    }
  }, [origin]);

  return (
    <>
      <article
        className={styles.card}
        aria-label="Next Player"
        data-paused={paused}
        data-open={!!origin}
      >
        <header className={styles.copy}>
          <span>Next Player</span>
          <h2>
            Fair turns.
            <br />
            <em>Better game nights.</em>
          </h2>
        </header>
        <div ref={stage} className={styles.art}>
          <Image
            src={artwork}
            alt="Next Player’s illustrated controller handoff"
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 500px"
            draggable={false}
          />
        </div>
        <button
          ref={opener}
          type="button"
          className={styles.open}
          aria-label="Expand Next Player artwork"
          aria-haspopup="dialog"
          onClick={() => {
            const box = stage.current?.getBoundingClientRect();
            if (!box) return;
            const { left, top, width, height } = box;
            setOrigin({ left, top, width, height });
          }}
        >
          <span className={styles.hint} data-discovery-hint>View artwork</span>
        </button>
      </article>
      {origin && (
        <NextPlayerPreview
          origin={origin}
          stage={stage}
          paused={paused}
          onClose={() => setOrigin(null)}
        />
      )}
    </>
  );
}
