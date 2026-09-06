"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./nudge.module.css";

export function NudgeDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [manualPlayback, setManualPlayback] = useState<boolean | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const syncPlayback = () => {
      const requested = manualPlayback ?? !motion.matches;
      if (requested && visible && !document.hidden) {
        void video.play().catch(() => setPlaying(false));
      } else {
        video.pause();
      }
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        syncPlayback();
      },
      { threshold: 0.15 },
    );
    observer.observe(video);
    motion.addEventListener("change", syncPlayback);
    document.addEventListener("visibilitychange", syncPlayback);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", syncPlayback);
      document.removeEventListener("visibilitychange", syncPlayback);
      video.pause();
    };
  }, [manualPlayback]);

  return (
    <figure className={styles.heroDemo}>
      <div className={styles.phone}>
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="metadata"
          poster="/nudge/home.webp"
          width={496}
          height={1080}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          aria-label="Looping Nudge app demo: capture a task, assign it to Alex, and mark it complete"
        >
          <source src="/nudge/demo.mp4" type="video/mp4" />
        </video>
      </div>
      <figcaption>
        <span>Capture. Assign. Done.</span>
        <button
          type="button"
          onClick={() => setManualPlayback(!playing)}
          aria-label={playing ? "Pause Nudge demo" : "Play Nudge demo"}
        >
          {playing ? "Pause" : "Play"}
        </button>
      </figcaption>
    </figure>
  );
}
