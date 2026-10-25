"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState } from "react";
import type { StudioAsset } from "./studio-gallery";
import styles from "./case-management-showcase.module.css";

const StudioGallery = dynamic(() =>
  import("./studio-gallery").then((module) => module.StudioGallery),
);

const views = [
  {
    label: "The task",
    src: "/showcase/case-management-platform/task-detail.webp",
    alt: "Application task panel with its status, assigned work, actions and linked case",
    caption: "Understand the next action.",
    galleryIndex: 0,
  },
  {
    label: "The requirement",
    src: "/showcase/case-management-platform/requirement-detail.webp",
    alt: "Application requirement drawer with status, source, received evidence and review findings",
    caption: "Keep the context close.",
    galleryIndex: 2,
  },
  {
    label: "Galia",
    src: "/showcase/case-management-platform/assistant-detail.webp",
    alt: "The contextual assistant interface beside the active demonstration case",
    caption: "Ask within the current context.",
    galleryIndex: 3,
  },
] as const;

const fullViews: readonly StudioAsset[] = [
  {
    src: "/case-management-platform/workspace.webp",
    alt: "Actual Case Management task queue with its selected task open in a contextual panel",
    width: 1600,
    height: 1000,
    caption: "Task workspace · Application capture with demonstration data.",
  },
  {
    src: "/case-management-platform/case-overview.webp",
    alt: "Actual Case Management case overview, including workflow, insured and policy context",
    width: 1600,
    height: 1000,
    caption: "Case overview · Application capture with demonstration data.",
  },
  {
    src: "/case-management-platform/requirements.webp",
    alt: "Actual Case Management requirements workspace with linked evidence and statuses",
    width: 1600,
    height: 1000,
    caption: "Requirements · Application capture with demonstration data.",
  },
  {
    src: "/case-management-platform/assistant.webp",
    alt: "Actual Case Management contextual assistant interface",
    width: 1600,
    height: 1000,
    caption:
      "Contextual assistant · Application capture with demonstration data.",
  },
];

/** Ambient decoration follows visibility; intentional inspection stays available. */
function useConnections(paused: boolean) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    const sync = () =>
      element.style.setProperty(
        "--connection-motion",
        inView && !paused && !document.hidden && !reduced.matches
          ? "running"
          : "paused",
      );
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    sync();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
    };
  }, [paused]);

  return ref;
}

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 15 15 5M5 5h10v10" />
    </svg>
  );
}

export function CaseManagementShowcase({ paused }: { paused: boolean }) {
  const id = useId();
  const opener = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState(0);
  const [inspecting, setInspecting] = useState(false);
  const ref = useConnections(paused || inspecting);
  const view = views[active];
  const galleryViews = [
    fullViews[view.galleryIndex],
    ...fullViews.filter((_, index) => index !== view.galleryIndex),
  ];

  function closeGallery() {
    setInspecting(false);
    requestAnimationFrame(() => opener.current?.focus());
  }

  return (
    <>
      <article
        ref={ref}
        className={styles.card}
        aria-labelledby={`${id}-title`}
        data-paused={paused}
      >
        <header className={styles.heading}>
          <div>
            <p>Life & annuity operations</p>
            <h2 id={`${id}-title`}>Case Management</h2>
          </div>
          <span className={styles.mark}>
            <Image
              src="/equisoft-symbol.svg"
              alt="Equisoft"
              width={32}
              height={36}
              unoptimized
            />
          </span>
        </header>

        <p className={styles.intro}>
          Task in focus.
          <br />
          Case in context.
        </p>

        <div
          className={styles.views}
          role="group"
          aria-label="Captured Case Management views"
        >
          {views.map((item, index) => (
            <button
              key={item.label}
              type="button"
              aria-pressed={active === index}
              aria-controls={`${id}-capture`}
              onClick={() => setActive(index)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={styles.stage} id={`${id}-capture`}>
          <svg
            className={styles.connections}
            viewBox="0 0 360 350"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M9 44v74q0 16 16 16h35M351 137v71q0 16-16 16h-35M9 253v40q0 16 16 16h35" />
            <circle cx="9" cy="44" r="3.5" />
            <circle cx="351" cy="137" r="3.5" />
            <circle cx="9" cy="253" r="3.5" />
          </svg>
          <div className={styles.captureWindow}>
            <div className={styles.captureBar} aria-hidden="true">
              <span />
              <span>{view.label}</span>
              <span className={styles.captureTag}>Actual application</span>
            </div>
            <div className={styles.capture}>
              <Image
                src={view.src}
                alt={view.alt}
                fill
                sizes="(max-width: 640px) 90vw, (max-width: 1100px) 45vw, 430px"
                unoptimized
                className={styles.captureImage}
              />
            </div>
          </div>
        </div>

        <div className={styles.detail}>
          <p role="status">{view.caption}</p>
          <div className={styles.inspectionRow}>
            <p>Application capture · Demo data</p>
            <button
              ref={opener}
              type="button"
              onClick={() => setInspecting(true)}
              aria-haspopup="dialog"
              aria-label="Inspect the Case Management application captures"
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M7 3H3v4m10-4h4v4M3 13v4h4m10-4v4h-4" />
              </svg>
              Inspect
            </button>
          </div>
        </div>

        <Link className={styles.projectLink} href="/case-management">
          Explore Case Management
          <Arrow />
        </Link>
      </article>

      {inspecting && (
        <StudioGallery
          title="Case Management / Inside the workspace"
          description="Captured from the Case Management Platform application using its demonstration data."
          assets={galleryViews}
          href="/case-management"
          paused={paused}
          onClose={closeGallery}
        />
      )}
    </>
  );
}
