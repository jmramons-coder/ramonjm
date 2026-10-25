"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type RefObject } from "react";
import styles from "./shakepay-clean-showcase.module.css";

const ShakepayStudyContent = dynamic(() =>
  import("./shakepay/study-content").then(
    (module) => module.ShakepayStudyContent,
  ),
);

type Bounds = { left: number; top: number; width: number; height: number };
const screens = [
  { file: "rewards", label: "Rewards", description: "See what adds up." },
  {
    file: "potential",
    label: "Potential",
    description: "Explore a different routine.",
  },
  {
    file: "profile",
    label: "Profile",
    description: "Keep your benefits connected.",
  },
] as const;

function NativeInteraction({
  screen = screens[0],
  paused,
}: {
  screen?: (typeof screens)[number];
  paused: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let visible = false;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (visible && !paused && !document.hidden && !motion.matches) {
        void element.play().catch(() => {});
      } else element.pause();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.15 },
    );
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      element.pause();
    };
  }, [paused]);

  return (
    <video
      ref={video}
      className={styles.video}
      src={`/showcase/shakepay/${screen.file}-loop.mp4`}
      poster={`/showcase/shakepay/${screen.file}.webp`}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={`Shakepay ${screen.label} native interaction`}
      draggable={false}
    />
  );
}

function ShakepayExploration({
  origin,
  opener,
  paused,
  onClose,
}: {
  origin: Bounds;
  opener: RefObject<HTMLButtonElement | null>;
  paused: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const featuredPhone = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const animation = useRef<Animation | null>(null);
  // Opening and closing are deliberate transitions; changing the motion setting
  // while reading must not reopen the dialog or reset its scroll position.
  const initialPaused = useRef(paused);

  useEffect(() => {
    const element = dialog.current;
    const phone = featuredPhone.current;
    if (!element || !phone) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    closeButton.current?.focus({ preventScroll: true });
    if (
      !initialPaused.current &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const target = phone.getBoundingClientRect();
      animation.current = phone.animate(
        [
          {
            transform: `translate(${origin.left - target.left}px, ${origin.top - target.top}px) scale(${origin.width / target.width}, ${origin.height / target.height})`,
          },
          { transform: "none" },
        ],
        { duration: 460, easing: "cubic-bezier(.22,1,.36,1)" },
      );
    }
    return () => {
      animation.current?.cancel();
      element.close();
      document.body.style.overflow = overflow;
    };
  }, [origin]);

  async function close() {
    if (closing.current) return;
    closing.current = true;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const destination = opener.current?.getBoundingClientRect();
    const phone = featuredPhone.current;
    if (phone && destination && !paused && !reduced) {
      animation.current?.cancel();
      const source = phone.getBoundingClientRect();
      // Return to the grid from the opening composition. Deep in the study, a
      // short fade avoids dragging an offscreen phone across the whole page.
      const atOpening = (scroll.current?.scrollTop ?? 0) < 120;
      const target = atOpening
        ? {
            transform: `translate(${destination.left - source.left}px, ${destination.top - source.top}px) scale(${destination.width / source.width}, ${destination.height / source.height})`,
            opacity: 0,
          }
        : { transform: "translateY(12px)", opacity: 0 };
      animation.current = (atOpening ? phone : scroll.current!).animate(
        [{ transform: "none", opacity: 1 }, target],
        {
          duration: atOpening ? 300 : 180,
          easing: "cubic-bezier(.4,0,.2,1)",
          fill: "forwards",
        },
      );
      await animation.current.finished.catch(() => {});
    }
    onClose();
  }

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="shakepay-exploration-title"
      data-paused={paused}
      onCancel={(event) => {
        event.preventDefault();
        void close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) void close();
      }}
    >
      <div
        ref={scroll}
        className={styles.scroll}
        onClick={(event) => {
          if (event.target === event.currentTarget) void close();
        }}
      >
        <div
          className={styles.content}
          onClick={(event) => {
            if (event.target === event.currentTarget) void close();
          }}
        >
          <section
            className={styles.opening}
            aria-labelledby="shakepay-exploration-title"
          >
            <div className={styles.introduction}>
              <p className={styles.eyebrow}>Independent product exploration</p>
              <h1 id="shakepay-exploration-title">
                See your
                <br />
                rewards <em>add up.</em>
              </h1>
              <p className={styles.description}>
                Everyday actions. Small rewards. A clearer picture of what
                you’ve earned—and what a different routine could bring.
              </p>
              <div className={styles.studyMeta}>
                <span>Product design</span>
                <span>Native iOS prototype</span>
              </div>
              <small className={styles.disclosure}>
                Independent work. Not commissioned, endorsed by, or affiliated
                with Shakepay. I do not work for or represent the company. All
                amounts use fictional demo data.
              </small>
            </div>
            <div
              className={styles.interactions}
              role="region"
              aria-label="Rewards, Potential, and Profile interactions. Scroll horizontally on smaller screens."
              tabIndex={0}
            >
              {screens.map((screen, index) => (
                <figure key={screen.file} className={styles.interaction}>
                  <div
                    ref={index === 0 ? featuredPhone : undefined}
                    className={styles.phone}
                  >
                    <NativeInteraction screen={screen} paused={paused} />
                  </div>
                  <figcaption>
                    <span>{screen.label}</span>
                    <p>{screen.description}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
          <ShakepayStudyContent
            hideHero
            expanded
            paused={paused}
            idPrefix="shakepay-study-"
          />
        </div>
      </div>
      <header className={styles.brand}>
        <Image
          src="/shakepay-icon.png"
          alt=""
          width={36}
          height={36}
          unoptimized
        />
        <span>
          Shakepay <small>Rewards exploration</small>
        </span>
      </header>
      <button
        ref={closeButton}
        type="button"
        className={styles.close}
        aria-label="Close Shakepay exploration"
        data-tooltip="Close exploration"
        onClick={() => void close()}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </dialog>
  );
}

export function ShakepayCleanShowcase({ paused }: { paused: boolean }) {
  const opener = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const [origin, setOrigin] = useState<Bounds | null>(null);

  useEffect(() => {
    if (!origin && wasOpen.current)
      opener.current?.focus({ preventScroll: true });
    wasOpen.current = !!origin;
  }, [origin]);

  return (
    <>
      <article
        className={styles.card}
        aria-label="Shakepay rewards exploration"
        data-open={!!origin}
      >
        <button
          ref={opener}
          className={styles.tile}
          aria-label="Expand Shakepay rewards exploration"
          aria-haspopup="dialog"
          onClick={(event) => {
            const { left, top, width, height } =
              event.currentTarget.getBoundingClientRect();
            setOrigin({ left, top, width, height });
          }}
        >
          <NativeInteraction paused={paused || !!origin} />
        </button>
      </article>
      {origin && (
        <ShakepayExploration
          origin={origin}
          opener={opener}
          paused={paused}
          onClose={() => setOrigin(null)}
        />
      )}
    </>
  );
}
