"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import styles from "./abeam-mobile-showcase.module.css";
import { DesktopProjectCard } from "./desktop-project-card";

// Native app captures. Keep their original aspect ratio and decoded pixels.
type Capture = {
  name: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};
const mobileScreens: Capture[] = [
  {
    width: 780,
    height: 1687,
    name: "Voice session",
    src: "/showcase/abeam/mobile-voice-session.webp",
    alt: "aBeam’s current mobile voice-session interface with an illustrative travel discussion and private assistant response.",
  },
  {
    width: 390,
    height: 844,
    name: "Explorer",
    src: "/showcase/abeam/mobile-explorer.webp",
    alt: "Actual aBeam mobile Explorer showing its search context and flight and hotel options.",
  },
  {
    width: 390,
    height: 844,
    name: "Flight details",
    src: "/showcase/abeam/mobile-flight.webp",
    alt: "Actual aBeam mobile flight detail showing the carrier, captured fare, dates and itinerary.",
  },
  {
    width: 390,
    height: 844,
    name: "Hotel details",
    src: "/showcase/abeam/mobile-hotel.webp",
    alt: "Actual aBeam mobile hotel detail showing the property, photography and captured nightly fare.",
  },
];

const desktopScreens: Capture[] = [
  {
    name: "Explorer",
    src: "/showcase/abeam/desktop-explorer.webp",
    width: 1440,
    height: 960,
    alt: "Actual aBeam desktop Explorer with search criteria and flight options for Montréal to Barcelona.",
  },
  {
    name: "Search",
    src: "/showcase/abeam/desktop-search.webp",
    width: 1440,
    height: 960,
    alt: "Actual aBeam desktop search with the date picker open and flight options visible.",
  },
  {
    name: "Flight details",
    src: "/showcase/abeam/desktop-flight.webp",
    width: 1440,
    height: 960,
    alt: "Actual aBeam desktop flight detail drawer showing TAP Air Portugal, travel dates, captured fare and itinerary.",
  },
  {
    name: "Hotel details",
    src: "/showcase/abeam/desktop-hotel.webp",
    width: 1440,
    height: 1000,
    alt: "Actual aBeam desktop hotel detail drawer with property photography and captured room information.",
  },
  {
    name: "Brief",
    src: "/showcase/abeam/desktop-brief.webp",
    width: 1440,
    height: 1000,
    alt: "Actual aBeam desktop client brief with the illustrative Maya and Alex trip context and preferences.",
  },
  {
    name: "Follow-up",
    src: "/showcase/abeam/desktop-follow-up.webp",
    width: 1440,
    height: 1000,
    alt: "Actual aBeam desktop follow-up editor with an illustrative client email and travel summary.",
  },
];

function ScreenImage({
  screen,
  eager = false,
}: {
  screen: Capture;
  eager?: boolean;
}) {
  return (
    <Image
      src={screen.src}
      alt={screen.alt}
      width={screen.width}
      height={screen.height}
      unoptimized
      loading={eager ? "eager" : "lazy"}
      draggable={false}
    />
  );
}

function Gallery({ paused, close }: { paused: boolean; close: () => void }) {
  const uid = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const gallery = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<"mobile" | "desktop">("desktop");
  const screens = mode === "desktop" ? desktopScreens : mobileScreens;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    closeButton.current?.focus({ preventScroll: true });
    if (
      panel.current &&
      !paused &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      animation.current = panel.current.animate(
        [
          { opacity: 0, transform: "translateY(16px) scale(.98)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 320, easing: "cubic-bezier(.22,1,.36,1)" },
      );
    }
    return () => {
      animation.current?.cancel();
      element.close();
      document.body.style.overflow = overflow;
    };
  }, [paused]);

  function select(next: number) {
    const element = gallery.current;
    if (!element) return;
    const target = element.children[next] as HTMLElement | undefined;
    if (!target) return;
    element.scrollTo({
      left: target.offsetLeft - (element.clientWidth - target.offsetWidth) / 2,
      behavior: "instant",
    });
    setIndex(next);
  }

  function switchMode(next: "mobile" | "desktop") {
    if (next === mode) return;
    setIndex(0);
    setMode(next);
  }

  function syncSelected() {
    const element = gallery.current;
    if (!element) return;
    const center = element.scrollLeft + element.clientWidth / 2;
    let nearest = 0;
    let distance = Infinity;
    Array.from(element.children).forEach((child, i) => {
      const slide = child as HTMLElement;
      const current = Math.abs(
        slide.offsetLeft + slide.offsetWidth / 2 - center,
      );
      if (current < distance) {
        distance = current;
        nearest = i;
      }
    });
    setIndex(nearest);
  }

  async function dismiss() {
    if (closing.current) return;
    closing.current = true;
    if (
      panel.current &&
      !paused &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      animation.current?.cancel();
      animation.current = panel.current.animate(
        [
          { opacity: 1, transform: "none" },
          { opacity: 0, transform: "translateY(12px) scale(.98)" },
        ],
        { duration: 200, easing: "ease-in", fill: "forwards" },
      );
      await animation.current.finished.catch(() => {});
    }
    close();
  }

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      data-paused={paused}
      data-mode={mode}
      style={
        {
          "--desktop-aspect": Math.min(
            ...desktopScreens.map((screen) => screen.width / screen.height),
          ),
        } as CSSProperties
      }
      aria-label="aBeam app screens"
      aria-describedby={`${uid}-capture-note`}
      onCancel={(event) => {
        event.preventDefault();
        void dismiss();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) void dismiss();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          select(
            Math.max(
              0,
              Math.min(
                screens.length - 1,
                index + (event.key === "ArrowRight" ? 1 : -1),
              ),
            ),
          );
        }
      }}
    >
      <div className={styles.brand}>
        <Image
          src="/abeam/icon.svg"
          alt=""
          width={34}
          height={34}
          unoptimized
        />
        <h2>aBeam</h2>
      </div>
      <div
        className={styles.modeToggle}
        role="group"
        aria-label="aBeam screen format"
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          event.stopPropagation();
          const buttons = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
          );
          const current = Math.max(
            0,
            buttons.findIndex((button) =>
              button.contains(event.target as Node),
            ),
          );
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? 1
                : (current + 1) % 2;
          switchMode(next === 0 ? "mobile" : "desktop");
          buttons[next]?.focus({ preventScroll: true });
        }}
      >
        <button
          type="button"
          aria-pressed={mode === "mobile"}
          onClick={() => switchMode("mobile")}
        >
          Mobile
        </button>
        <button
          type="button"
          aria-pressed={mode === "desktop"}
          onClick={() => switchMode("desktop")}
        >
          Desktop
        </button>
      </div>
      <button
        ref={closeButton}
        type="button"
        className={styles.close}
        aria-label="Close aBeam app screens"
        title="Close preview"
        onClick={() => void dismiss()}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
      <div className={styles.expanded} ref={panel}>
        <div
          className={styles.gallery}
          key={mode}
          ref={gallery}
          onScroll={syncSelected}
          onClick={(event) => {
            if (event.target === event.currentTarget) void dismiss();
          }}
          aria-label={`Actual aBeam ${mode} screens`}
          role="region"
          tabIndex={0}
        >
          {screens.map((screen, i) => (
            <div
              className={styles.slide}
              key={screen.src}
              role="group"
              aria-label={`${i + 1} of ${screens.length}: ${screen.name}`}
            >
              <div
                className={
                  mode === "desktop" ? styles.desktopFrame : styles.phone
                }
              >
                <ScreenImage screen={screen} eager={i === 0} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.controls}>
        <div
          className={styles.navigation}
          role="group"
          aria-label="Choose an aBeam screen"
        >
          {screens.map((screen, i) => (
            <button
              key={screen.name}
              type="button"
              aria-label={`Show aBeam ${mode} ${screen.name}`}
              aria-pressed={index === i}
              title={screen.name}
              onClick={() => select(i)}
            >
              {screen.name}
            </button>
          ))}
        </div>
        <p id={`${uid}-capture-note`}>
          {mode === "mobile" && index === 0
            ? "Actual app UI · Demonstration conversation"
            : "Actual app screens · Captured October 2026"}
        </p>
      </div>
    </dialog>
  );
}

export function AbeamMobileShowcase({ paused }: { paused: boolean }) {
  const opener = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const hasOpened = useRef(false);
  useEffect(() => {
    if (open) {
      hasOpened.current = true;
    } else if (hasOpened.current) {
      hasOpened.current = false;
      opener.current?.focus({ preventScroll: true });
    }
  }, [open]);
  return (
    <>
      <DesktopProjectCard
        name="aBeam"
        title={
          <>
            From conversation
            <br />
            <em>to travel plans.</em>
          </>
        }
        detail="The travel copilot · Desktop & mobile"
        tone="abeam"
        label="aBeam desktop and mobile app"
        openLabel="Expand aBeam app screens"
        opener={opener}
        paused={paused}
        opened={open}
        onOpen={() => setOpen(true)}
        companion={<ScreenImage screen={mobileScreens[0]} eager />}
      >
        <ScreenImage screen={desktopScreens[0]} eager />
      </DesktopProjectCard>
      {open && <Gallery paused={paused} close={() => setOpen(false)} />}
    </>
  );
}
