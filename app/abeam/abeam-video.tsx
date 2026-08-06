"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";

type PlaybackPreference = "auto" | "paused" | "playing";

export function AbeamVideo({
  className = "",
  priority = false,
  showControl = false,
  sizes = "320px",
}: {
  className?: string;
  priority?: boolean;
  showControl?: boolean;
  sizes?: string;
}) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackPreferenceRef = useRef<PlaybackPreference>("auto");
  const syncPlaybackRef = useRef<() => void>(() => undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let isVisible = false;

    const syncPlayback = () => {
      const preference = playbackPreferenceRef.current;
      const motionAllowed =
        preference === "playing" ||
        (preference === "auto" && !motionPreference.matches);
      const shouldPlay =
        motionAllowed && isVisible && document.visibilityState === "visible";

      if (shouldPlay) {
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    };
    syncPlaybackRef.current = syncPlayback;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        syncPlayback();
      },
      { rootMargin: "120px" },
    );

    const handleVisibilityChange = () => syncPlayback();
    const handleMotionChange = () => syncPlayback();

    observer.observe(container);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    motionPreference.addEventListener("change", handleMotionChange);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      motionPreference.removeEventListener("change", handleMotionChange);
      syncPlaybackRef.current = () => undefined;
      video.pause();
    };
  }, []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    playbackPreferenceRef.current = video.paused ? "playing" : "paused";
    syncPlaybackRef.current();
  };

  return (
    <span
      className={`abeam-video${isReady ? " is-ready" : ""}${className ? ` ${className}` : ""}`}
      ref={containerRef}
      aria-hidden={showControl ? undefined : true}
    >
      <Image
        className="abeam-video-fallback"
        src="/abeam/mark.png"
        alt=""
        fill
        sizes={sizes}
        priority={priority}
      />
      <video
        className="abeam-video-media"
        ref={videoRef}
        muted
        loop
        playsInline
        preload={priority ? "auto" : "metadata"}
        onCanPlay={() => setIsReady(true)}
        onError={() => setIsReady(false)}
        onPause={() => setIsPlaying(false)}
        onPlaying={() => setIsPlaying(true)}
      >
        <source
          src="/abeam/loop-alpha.mov"
          type={'video/quicktime; codecs="hvc1"'}
        />
        <source src="/abeam/loop.webm" type='video/webm; codecs="vp9"' />
      </video>
      {showControl ? (
        <button
          className="abeam-video-control"
          type="button"
          onClick={togglePlayback}
          aria-label={isPlaying ? "Pause aBeam motion" : "Play aBeam motion"}
          title={isPlaying ? "Pause motion" : "Play motion"}
        >
          <HugeiconsIcon
            icon={isPlaying ? PauseIcon : PlayIcon}
            size={17}
            strokeWidth={1.8}
          />
        </button>
      ) : null}
    </span>
  );
}
