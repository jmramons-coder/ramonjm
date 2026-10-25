"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import styles from "./decision-art-showcase.module.css";
import { DesktopProjectCard } from "./desktop-project-card";

type Bounds = { left: number; top: number; width: number; height: number };

type Piece = "tablet" | "art";
function Artwork({ piece }: { piece: Piece }) {
  return (
    <div className={styles.artwork} data-piece={piece}>
      <Image
        src={
          piece === "tablet"
            ? "/equisoft-labs/app-screenshot.jpg"
            : "/showcase/roi/calculator.webp"
        }
        alt={
          piece === "tablet"
            ? "Original Decision ROI desktop prototype"
            : "Decision ROI sculptural calculator artwork"
        }
        fill
        unoptimized
        sizes={
          piece === "tablet"
            ? "(max-width: 640px) 100vw, 1200px"
            : "(max-width: 640px) 100vw, 900px"
        }
        className={styles.image}
      />
    </div>
  );
}

function GlassPreview({
  origin,
  opener,
  paused,
  onClose,
  piece,
}: {
  piece: Piece;
  origin: Bounds;
  opener: RefObject<HTMLButtonElement | null>;
  paused: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const animation = useRef<Animation | null>(null);

  useEffect(() => {
    const element = dialog.current;
    const image = panel.current;
    if (!element || !image) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    if (
      !paused &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
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
      element.close();
      document.body.style.overflow = overflow;
    };
  }, [origin, paused]);

  async function close() {
    if (closing.current) return;
    closing.current = true;
    const image = panel.current;
    const destination = (
      opener.current?.closest("article")?.querySelector("[data-desktop-frame]") ??
      opener.current
    )?.getBoundingClientRect();
    if (
      image &&
      destination &&
      !paused &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
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
        { duration: 320, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" },
      );
      await animation.current.finished.catch(() => {});
    }
    onClose();
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
  }

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label={
        piece === "tablet"
          ? "Decision ROI desktop prototype"
          : "Decision ROI artwork"
      }
      onCancel={(event) => {
        event.preventDefault();
        void close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) void close();
      }}
    >
      <div
        ref={panel}
        className={styles.panel}
        style={
          {
            "--art-ratio":
              piece === "tablet" ? 1200 / 833 : origin.width / origin.height,
          } as CSSProperties
        }
      >
        <Artwork piece={piece} />
      </div>
      {piece === "tablet" && (
        <header className={styles.brand}>
          Decision ROI<small>Original prototype capture</small>
        </header>
      )}
      <button
        type="button"
        className={styles.close}
        aria-label="Close Decision ROI preview"
        onClick={() => void close()}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </dialog>
  );
}

function DecisionPiece({ paused, piece }: { paused: boolean; piece: Piece }) {
  const opener = useRef<HTMLButtonElement>(null);
  const [origin, setOrigin] = useState<Bounds | null>(null);
  return (
    <>
      {piece === "tablet" ? (
        <DesktopProjectCard
          name="Decision ROI"
          title={
            <>
              The cost of
              <br />
              <em>missing data.</em>
            </>
          }
          detail="The impact of delayed decisions"
          tone="decision"
          label="Decision ROI desktop prototype"
          openLabel="Expand Decision ROI desktop prototype"
          opener={opener}
          paused={paused}
          opened={!!origin}
          onOpen={setOrigin}
        >
          <Artwork piece="tablet" />
        </DesktopProjectCard>
      ) : (
        <article
          className={styles.card}
          data-kind={piece}
          aria-label="Decision ROI 3D artwork"
          data-paused={paused}
        >
          <button
            ref={opener}
            type="button"
            className={styles.tile}
            aria-label="Expand Decision ROI artwork"
            aria-haspopup="dialog"
            data-open={!!origin}
            onClick={(event) => {
              const { left, top, width, height } =
                event.currentTarget.getBoundingClientRect();
              setOrigin({ left, top, width, height });
            }}
          >
            <Artwork piece={piece} />
          </button>
        </article>
      )}
      {origin && (
        <GlassPreview
          piece={piece}
          origin={origin}
          opener={opener}
          paused={paused}
          onClose={() => setOrigin(null)}
        />
      )}
    </>
  );
}

export function DecisionShowcase({ paused }: { paused: boolean }) {
  return <DecisionPiece paused={paused} piece="tablet" />;
}
export function DecisionArtworkShowcase({ paused }: { paused: boolean }) {
  return <DecisionPiece paused={paused} piece="art" />;
}
