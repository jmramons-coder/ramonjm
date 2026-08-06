"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function AbeamVideo({
  className = "",
  priority = false,
  sizes = "320px",
}: {
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
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
      const shouldPlay =
        !motionPreference.matches &&
        isVisible &&
        document.visibilityState === "visible";

      if (shouldPlay) {
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
      video.pause();
    };
  }, []);

  return (
    <span
      className={`abeam-video${isReady ? " is-ready" : ""}${className ? ` ${className}` : ""}`}
      ref={containerRef}
      aria-hidden="true"
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
        onLoadedData={() => setIsReady(true)}
        onError={() => setIsReady(false)}
      >
        <source
          src="/abeam/loop-alpha.mov"
          type={'video/quicktime; codecs="hvc1"'}
        />
        <source src="/abeam/loop.webm" type='video/webm; codecs="vp9"' />
      </video>
    </span>
  );
}
