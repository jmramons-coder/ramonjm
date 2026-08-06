"use client";

import { useEffect, useRef } from "react";

type WorldVideoProps = {
  className?: string;
  label: string;
  poster: string;
  src: string;
};

export function WorldVideo({
  className,
  label,
  poster,
  src,
}: WorldVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let isVisible = false;

    const syncPlayback = () => {
      if (isVisible && !motionPreference.matches && !document.hidden) {
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
  }, []);

  return (
    <video
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
  );
}
