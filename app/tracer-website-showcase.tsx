/* eslint-disable @next/next/no-img-element -- Full-page captures keep their natural proportions. */
"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MutableRefObject,
} from "react";
import styles from "./tracer-website-showcase.module.css";

type Theme = "light" | "dark";
type Page = "landing" | "labs";
type ScrollPositions = MutableRefObject<Record<Page, number>>;

const pages: { id: Page; label: string; description: string }[] = [
  { id: "landing", label: "Landing page", description: "Tracer landing page" },
  { id: "labs", label: "Labs", description: "Tracer Labs website" },
];

function capture(page: Page, theme: Theme) {
  return `/showcase/tracer-website/${page}-${theme}.webp`;
}

function ScrollPreview({
  paused,
  theme,
}: {
  paused: boolean;
  theme: Theme;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const animation = useRef<Animation | null>(null);
  const canPlay = useRef(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduced, setReduced] = useState(true);
  const running = !paused && visible && pageVisible && !reduced;

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduced(preference.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    observer.observe(element);
    updatePreference();
    updateVisibility();
    preference.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    const element = viewport.current;
    const screenshot = image.current;
    if (!element || !screenshot) return;
    let frame = 0;
    let measuredOverflow = -1;

    function measure() {
      if (!element || !screenshot || !screenshot.naturalHeight) return;
      const overflow = Math.max(0, screenshot.clientHeight - element.clientHeight);
      if (Math.abs(overflow - measuredOverflow) < 1) return;
      measuredOverflow = overflow;
      const previous = animation.current;
      const duration = Number(previous?.effect?.getTiming().duration) || 1;
      const progress = Number(previous?.currentTime ?? 0) / duration;
      previous?.cancel();
      animation.current = null;
      if (!overflow) return;
      const top = "translate3d(0, 0, 0)";
      const bottom = `translate3d(0, ${-overflow}px, 0)`;
      const next = screenshot.animate(
        [
          { transform: top, offset: 0 },
          { transform: top, offset: 0.01 },
          { transform: bottom, offset: 0.48 },
          { transform: bottom, offset: 0.54 },
          { transform: top, offset: 0.98 },
          { transform: top, offset: 1 },
        ],
        {
          duration: Math.max(60000, (overflow * 2 * 1000) / 20),
          iterations: Infinity,
          easing: "linear",
        },
      );
      animation.current = next;
      next.currentTime = progress * Number(next.effect?.getTiming().duration);
      if (!canPlay.current) next.pause();
    }

    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(element);
    observer.observe(screenshot);
    screenshot.addEventListener("load", scheduleMeasure);
    scheduleMeasure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      screenshot.removeEventListener("load", scheduleMeasure);
      animation.current?.cancel();
      animation.current = null;
    };
  }, []);

  useEffect(() => {
    canPlay.current = running;
    if (reduced) {
      animation.current?.pause();
      if (animation.current) animation.current.currentTime = 0;
    } else if (running) animation.current?.play();
    else animation.current?.pause();
  }, [reduced, running]);

  return (
    <div ref={viewport} className={styles.preview}>
      <img
        ref={image}
        src={capture("landing", theme)}
        alt=""
        width={1440}
        height={6093}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </div>
  );
}

function WebsiteGallery({
  theme,
  page,
  onPage,
  positions,
  onClose,
}: {
  theme: Theme;
  page: Page;
  onPage: (page: Page) => void;
  positions: ScrollPositions;
  onClose: () => void;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const panes = useRef<Partial<Record<Page, HTMLDivElement>>>({});

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    for (const item of pages) {
      const pane = panes.current[item.id];
      if (pane && !pane.hidden) pane.scrollTop = positions.current[item.id];
    }
    element.querySelector<HTMLButtonElement>(`[data-close]`)?.focus({ preventScroll: true });
    return () => {
      element.close();
      document.body.style.overflow = overflow;
    };
  }, [positions]);

  useLayoutEffect(() => {
    const pane = panes.current[page];
    if (pane) pane.scrollTop = positions.current[page];
  }, [page, positions]);

  function navigateTabs(event: KeyboardEvent<HTMLDivElement>) {
    let next: Page;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      next = page === "landing" ? "labs" : "landing";
    } else if (event.key === "Home") next = "landing";
    else if (event.key === "End") next = "labs";
    else return;
    event.preventDefault();
    onPage(next);
    dialog.current
      ?.querySelector<HTMLButtonElement>(`[data-page="${next}"]`)
      ?.focus({ preventScroll: true });
  }

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      data-theme={theme}
      aria-label="Tracer website gallery"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <a
        className={styles.brand}
        href="https://tracersecurity.ca/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Visit the Tracer website"
      >
        <img src="/tracer/app-icon.png" alt="" width={28} height={28} />
        <span>Tracer</span>
      </a>
      <div className={styles.controls}>
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Tracer website pages"
          onKeyDown={navigateTabs}
        >
          {pages.map((item) => (
            <button
              key={item.id}
              id={`${id}-${item.id}-tab`}
              type="button"
              role="tab"
              aria-selected={page === item.id}
              aria-controls={`${id}-${item.id}-panel`}
              tabIndex={page === item.id ? 0 : -1}
              data-page={item.id}
              onClick={() => onPage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <a
          className={styles.visit}
          href={`https://tracersecurity.ca/${page === "labs" ? "labs" : ""}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit Tracer ${page === "labs" ? "Labs" : "website"} (opens in a new tab)`}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18-3-3.5-3-14.5 0-18Z" />
          </svg>
          Visit website
        </a>
      </div>
      <div className={styles.panel}>
        {pages.map((item) => (
          <div
            key={item.id}
            ref={(element) => {
              if (element) panes.current[item.id] = element;
              else delete panes.current[item.id];
            }}
            id={`${id}-${item.id}-panel`}
            role="tabpanel"
            aria-labelledby={`${id}-${item.id}-tab`}
            className={styles.page}
            tabIndex={0}
            hidden={page !== item.id}
            onScroll={(event) => {
              if (page === item.id) positions.current[item.id] = event.currentTarget.scrollTop;
            }}
          >
            <img
              src={capture(item.id, theme)}
              alt={`Full ${item.description} in ${theme} mode`}
              width={1440}
              height={item.id === "landing" ? 6093 : 4399}
              decoding="async"
              draggable={false}
              onLoad={() => {
                const pane = panes.current[item.id];
                if (pane && page === item.id) pane.scrollTop = positions.current[item.id];
              }}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        className={styles.close}
        data-close
        aria-label="Close Tracer website gallery"
        title="Close gallery"
        onClick={onClose}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </dialog>
  );
}

export function TracerWebsiteShowcase({
  paused,
  theme,
}: {
  paused: boolean;
  theme: Theme;
}) {
  const opener = useRef<HTMLButtonElement>(null);
  const positions = useRef<Record<Page, number>>({ landing: 0, labs: 0 });
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<Page>("landing");
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  function close() {
    setOpen(false);
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
  }

  return (
    <>
      <article className={styles.card} data-theme={theme} aria-label="Tracer website">
        <button
          ref={opener}
          type="button"
          className={styles.tile}
          aria-label="Explore the Tracer landing page and Labs"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") setHovered(true);
          }}
          onPointerLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          <ScrollPreview paused={paused || open || hovered || focused} theme={theme} />
          <span className={styles.expand} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4" />
            </svg>
          </span>
        </button>
      </article>
      {open && (
        <WebsiteGallery
          theme={theme}
          page={page}
          onPage={setPage}
          positions={positions}
          onClose={close}
        />
      )}
    </>
  );
}
