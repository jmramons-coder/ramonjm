"use client";
import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type RefObject,
} from "react";
import { DesktopProjectCard } from "./desktop-project-card";
import styles from "./crypto-clean-showcase.module.css";
type Bounds = { left: number; top: number; width: number; height: number };
const planner = [
  ["holdings", "CryptoCroc desktop Holdings screen"],
  ["beneficiaries", "CryptoCroc desktop beneficiary workflow"],
  ["practice", "CryptoCroc desktop practice checklist"],
];
const illustrations = [
  ["/showcase/crypto/hang-glider.webp", "CryptoCroc hang-glider illustration"],
  ["/showcase/crypto/treasure.webp", "CryptoCroc treasure illustration"],
  ["/crypto-inheritance/mascot.png", "Original CryptoCroc mascot"],
];
function Visual({ artwork, index }: { artwork: boolean; index: number }) {
  const assets = artwork ? illustrations : planner;
  return (
    <div
      className={`${styles.visual} ${artwork ? styles.art : styles.desktop}`}
    >
      {assets.map(([src, alt], i) => (
        <Image
          key={src}
          src={artwork ? src : `/showcase/crypto/${src}.webp`}
          alt={alt}
          draggable={false}
          fill
          unoptimized
          sizes={
            artwork
              ? "(max-width:640px) 90vw, 650px"
              : "(max-width:640px) 100vw, 1100px"
          }
          aria-hidden={i !== index}
          className={i === index ? styles.active : styles.hidden}
        />
      ))}
    </div>
  );
}
function useSwipe(index: number, onIndex: (index: number) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  return {
    consumeSwipe: () => {
      const value = swiped.current;
      swiped.current = false;
      return value;
    },
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      start.current = { x: event.clientX, y: event.clientY };
      swiped.current = false;
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      if (!start.current) return;
      const dx = event.clientX - start.current.x;
      const dy = event.clientY - start.current.y;
      if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
        swiped.current = true;
        onIndex(Math.max(0, Math.min(2, index + (dx < 0 ? 1 : -1))));
      }
      start.current = null;
    },
  };
}
function CryptoPreview({
  origin,
  opener,
  paused,
  artwork,
  index,
  onIndex,
  onClose,
}: {
  origin: Bounds;
  opener: RefObject<HTMLButtonElement | null>;
  paused: boolean;
  artwork: boolean;
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const swipe = useSwipe(index, onIndex);
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
      data-artwork={artwork}
      aria-label={
        artwork
          ? "CryptoCroc artwork gallery"
          : "CryptoCroc desktop walkthrough"
      }
      onCancel={(event) => {
        event.preventDefault();
        void close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) void close();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          onIndex((index + (event.key === "ArrowRight" ? 1 : 2)) % 3);
        }
      }}
    >
      <div
        ref={panel}
        onPointerDown={swipe.onPointerDown}
        onPointerUp={swipe.onPointerUp}
        className={styles.panel}
        data-artwork={artwork}
        style={
          {
            "--art-ratio": artwork ? origin.width / origin.height : 1100 / 820,
          } as CSSProperties
        }
      >
        <Visual artwork={artwork} index={index} />
      </div>
      <header className={styles.brand}>
        <Image
          className={styles.skull}
          src="/crypto-inheritance/skull.png"
          alt=""
          width={40}
          height={40}
          unoptimized
        />
        <span>CryptoCroc</span>
        {!artwork && (
          <span className={styles.makeCredit}>
            <svg viewBox="0 0 18 27" aria-hidden="true">
              <path fill="#f24e1e" d="M4.5 0a4.5 4.5 0 0 0 0 9H9V0Z" />
              <path fill="#ff7262" d="M9 0h4.5a4.5 4.5 0 0 1 0 9H9Z" />
              <path fill="#a259ff" d="M4.5 9a4.5 4.5 0 0 0 0 9H9V9Z" />
              <circle cx="13.5" cy="13.5" r="4.5" fill="#1abcfe" />
              <path fill="#0acf83" d="M4.5 18a4.5 4.5 0 1 0 4.5 4.5V18Z" />
            </svg>
            Figma Make · 2025
          </span>
        )}
      </header>
      {artwork && (
        <nav className={styles.navigation} aria-label="CryptoCroc artwork">
          <button
            aria-label="Previous CryptoCroc artwork"
            onClick={() => onIndex((index + 2) % 3)}
          >
            ‹
          </button>
          <button
            aria-label="Next CryptoCroc artwork"
            onClick={() => onIndex((index + 1) % 3)}
          >
            ›
          </button>
        </nav>
      )}
      {!artwork && (
        <nav className={`${styles.plannerNavigation} ${styles.modalPlannerNavigation}`} aria-label="CryptoCroc screens">
          {["Holdings", "Beneficiaries", "Practice"].map((label, screen) => (
            <button key={label} type="button" aria-pressed={index === screen} onClick={() => onIndex(screen)}>
              {label}
            </button>
          ))}
        </nav>
      )}
      <button
        type="button"
        className={styles.close}
        aria-label="Close CryptoCroc preview"
        onClick={() => void close()}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </dialog>
  );
}

function CryptoClean({
  paused,
  artwork = false,
}: {
  paused: boolean;
  artwork?: boolean;
}) {
  const opener = useRef<HTMLButtonElement>(null);
  const [origin, setOrigin] = useState<Bounds | null>(null);
  const [index, setIndex] = useState(artwork ? 0 : 1);
  const swipe = useSwipe(index, setIndex);
  return (
    <>
      {artwork ? (
        <article
          className={`${styles.card} ${styles.artCard}`}
          aria-label="CryptoCroc original artwork"
          data-open={!!origin}
          data-paused={paused}
        >
          <button
            ref={opener}
            onPointerDown={swipe.onPointerDown}
            onPointerUp={swipe.onPointerUp}
            className={styles.tile}
            aria-label="Expand CryptoCroc artwork"
            aria-haspopup="dialog"
            onClick={(event) => {
              if (swipe.consumeSwipe()) return;
              const { left, top, width, height } =
                event.currentTarget.getBoundingClientRect();
              setOrigin({ left, top, width, height });
            }}
          >
            <Visual artwork index={index} />
          </button>
        </article>
      ) : (
        <DesktopProjectCard
          name="CryptoCroc"
          title={
            <>
              Don’t let your crypto
              <br />
              <em>die with you.</em>
            </>
          }
          detail="A digital inheritance planner"
          tone="crypto"
          label="CryptoCroc desktop application"
          openLabel="Expand CryptoCroc desktop walkthrough"
          opener={opener}
          paused={paused}
          opened={!!origin}
          onOpen={setOrigin}
        >
          <Image
            src="/showcase/crypto/beneficiaries.webp"
            alt="CryptoCroc desktop beneficiary planning screen"
            fill
            unoptimized
            sizes="(max-width: 640px) 115vw, (max-width: 1200px) 60vw, 36vw"
            draggable={false}
          />
        </DesktopProjectCard>
      )}
      {origin && (
        <CryptoPreview
          origin={origin}
          opener={opener}
          paused={paused}
          artwork={artwork}
          index={index}
          onIndex={setIndex}
          onClose={() => setOrigin(null)}
        />
      )}
    </>
  );
}
export function CryptoDesktopShowcase({ paused }: { paused: boolean }) {
  return <CryptoClean paused={paused} />;
}
export function CryptoArtworkShowcase({ paused }: { paused: boolean }) {
  return <CryptoClean paused={paused} artwork />;
}
