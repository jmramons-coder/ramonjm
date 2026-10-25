"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlayIcon,
  PauseIcon,
  VolumeHighIcon,
  VolumeOffIcon,
} from "@hugeicons/core-free-icons";
import styles from "./study.module.css";

export function IntroFilm({
  paused = false,
  startMuted = false,
}: {
  paused?: boolean;
  startMuted?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const manualPause = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(startMuted);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let active = true;
    function syncPlayback() {
      if (
        visible &&
        !paused &&
        !document.hidden &&
        !motion.matches &&
        !manualPause.current
      ) {
        void video!.play().catch(() => {
          if (
            !active ||
            !visible ||
            paused ||
            document.hidden ||
            motion.matches
          )
            return;
          video!.muted = true;
          setMuted(true);
          void video!.play().catch(() => {});
        });
      } else {
        video!.pause();
      }
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        syncPlayback();
      },
      { threshold: 0.35 },
    );
    observer.observe(video);
    document.addEventListener("visibilitychange", syncPlayback);
    motion.addEventListener("change", syncPlayback);
    return () => {
      active = false;
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      motion.removeEventListener("change", syncPlayback);
      video.pause();
    };
  }, [paused]);

  function toggle() {
    const video = ref.current;
    if (!video || paused) return;
    if (video.paused) {
      manualPause.current = false;
      void video.play().catch(() => {});
    } else {
      manualPause.current = true;
      video.pause();
    }
  }

  const playbackLabel = playing ? "Pause film" : "Play film";
  return (
    <div className={styles.filmPlayer}>
      <video
        ref={ref}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        poster="/shakepay/media/poster"
        aria-label="Shakepay rewards concept film"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source src="/shakepay/media/film" type="video/mp4" />
      </video>
      <div className={styles.filmControls}>
        <button
          onClick={toggle}
          aria-label={playbackLabel}
          title={paused ? "Resume portfolio motion to play" : playbackLabel}
          disabled={paused}
        >
          <HugeiconsIcon
            icon={playing ? PauseIcon : PlayIcon}
            size={22}
            strokeWidth={1.8}
            aria-hidden="true"
          />
          {playing ? "Pause" : "Play"}
        </button>
        <button
          className={styles.soundButton}
          title={muted ? "Turn sound on" : "Mute sound"}
          onClick={() => setMuted(!muted)}
          aria-label={muted ? "Turn film sound on" : "Mute film"}
          aria-pressed={!muted}
        >
          <HugeiconsIcon
            icon={muted ? VolumeOffIcon : VolumeHighIcon}
            size={22}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}
