"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { AbeamMobileShowcase } from "./abeam-mobile-showcase";
import styles from "./desktop-showcase.module.css";

const FeaturedPreview = dynamic(() =>
  import("./featured-preview").then((module) => module.FeaturedPreview),
);

type ShowcaseProps = { paused?: boolean };

function Arrow({ back = false }: { back?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d={back ? "M15 10H5m5-5-5 5 5 5" : "M5 10h10m-5-5 5 5-5 5"} />
    </svg>
  );
}

/** Only decorative motion follows visibility; intentional controls always work. */
function useMotion(paused: boolean) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    const update = () =>
      setActive(!paused && inView && !document.hidden && !media.matches);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    observer.observe(element);
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [paused]);

  return { ref, active };
}

export function AbeamShowcase({ paused = false }: ShowcaseProps) {
  return <AbeamMobileShowcase paused={paused} />;
}

export function TracerShowcase({ paused = false }: ShowcaseProps) {
  const id = useId();
  const { ref, active } = useMotion(paused);
  const [pan, setPan] = useState(80);
  const [preview, setPreview] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);

  function closePreview() {
    setPreview(false);
    requestAnimationFrame(() => opener.current?.focus());
  }

  return (
    <>
      <article
        ref={ref}
        className={`${styles.card} ${styles.tracer}`}
        data-still={!active}
        aria-labelledby={`${id}-title`}
      >
        <header className={styles.header}>
          <div className={styles.identity}>
            <Image
              src="/tracer/app-icon.png"
              className={styles.tracerIcon}
              alt=""
              width={44}
              height={44}
              unoptimized
            />
            <div>
              <h2 id={`${id}-title`}>Tracer</h2>
              <p>Research security</p>
            </div>
          </div>
          <Link
            className={styles.caseLink}
            href="/tracer"
            aria-label="Explore the Tracer project"
          >
            <Arrow />
          </Link>
        </header>

        <div className={styles.tracerIntro}>
          <span className={styles.eyebrow}>Inside the workspace</span>
          <p>Bring the evidence into view.</p>
        </div>

        <div className={styles.tracerFrame}>
          <div className={styles.tracerCaptureBar}>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 2.5h7l3 3v8H3zM10 2.5V6h3M5.5 8.5h5m-5 2h4" />
            </svg>
            <span>Case overview</span>
            <span className={styles.tracerLive}>Product capture</span>
          </div>
          <div
            className={styles.panorama}
            id={`${id}-workspace`}
            role="img"
            aria-label="Actual Tracer workspace: case navigation, entity context, linked research sources, investigation sections and report export controls. The signed-in account footer is cropped out."
          >
            <div
              className={styles.panoramaTrack}
              style={{ "--pan": pan / 100 } as CSSProperties}
            >
              <Image
                src="/showcase/tracer/workspace.webp"
                alt=""
                fill
                sizes="820px"
                unoptimized
                draggable={false}
              />
            </div>
          </div>
          <div className={styles.panControls}>
            <div className={styles.panLabels}>
              <button
                type="button"
                onClick={() => setPan(0)}
                aria-controls={`${id}-workspace`}
              >
                <Arrow back /> Workspace
              </button>
              <button
                type="button"
                onClick={() => setPan(100)}
                aria-controls={`${id}-workspace`}
              >
                Report <Arrow />
              </button>
            </div>
            <label className={styles.panSlider}>
              <span className={styles.srOnly}>
                Explore the Tracer interface
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={pan}
                onChange={(event) => setPan(Number(event.target.value))}
                aria-controls={`${id}-workspace`}
                aria-valuetext={`${pan}% toward the report; 0 shows workspace navigation, 100 shows report detail`}
              />
            </label>
          </div>
        </div>

        <footer className={styles.tracerFooter}>
          <p>One connected product and identity.</p>
          <button
            ref={opener}
            className={styles.tracerInspect}
            type="button"
            aria-haspopup="dialog"
            onClick={() => setPreview(true)}
          >
            See the full system <Arrow />
          </button>
        </footer>
      </article>
      {preview && <FeaturedPreview kind="tracer" onClose={closePreview} />}
    </>
  );
}
