"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./world.module.css";

type WorldVideoProps = {
  className?: string;
  label: string;
  poster: string;
  src: string;
};

export function WorldVideo({ className, label, poster, src }: WorldVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [playing, setPlaying] = useState(false);
  const [manual, setManual] = useState<boolean | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let isVisible = false;

    const syncPlayback = () => {
      if (
        isVisible &&
        (manual ?? !motionPreference.matches) &&
        !document.hidden
      ) {
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        syncPlayback();
      },
      { threshold: 0.2 },
    );

    observer.observe(video);
    motionPreference.addEventListener("change", syncPlayback);
    document.addEventListener("visibilitychange", syncPlayback);

    return () => {
      observer.disconnect();
      motionPreference.removeEventListener("change", syncPlayback);
      document.removeEventListener("visibilitychange", syncPlayback);
      video.pause();
    };
  }, [manual]);

  return (
    <>
      <video
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className={className}
        ref={videoRef}
        src={src}
        poster={poster}
        aria-label={label}
        loop
        muted
        playsInline
        preload="metadata"
      />
      <button
        className={styles.videoControl}
        type="button"
        onClick={() => setManual(!playing)}
        aria-label={`${playing ? "Pause" : "Play"}: ${label}`}
      >
        {playing ? "Pause" : "Play"}
      </button>
    </>
  );
}
