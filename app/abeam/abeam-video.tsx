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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playbackPreferenceRef = useRef<PlaybackPreference>("auto");
  const syncPlaybackRef = useRef<() => void>(() => undefined);
  const usesCanvasRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [usesCanvas, setUsesCanvas] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!container || !video || !canvas) return;

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const isWebKit = /AppleWebKit/i.test(navigator.userAgent);
    const isChromium = /(Chrome|Chromium|Edg|OPR)/i.test(
      navigator.userAgent,
    );
    const isIOS =
      /iP(ad|hone|od)/i.test(navigator.userAgent) ||
      (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    const canvasContext =
      isWebKit && (isIOS || !isChromium)
        ? canvas.getContext("2d", { willReadFrequently: true })
        : null;
    const shouldUseCanvas = Boolean(canvasContext);
    usesCanvasRef.current = shouldUseCanvas;
    setUsesCanvas(shouldUseCanvas);

    let isVisible = false;
    let isRenderingCanvas = false;
    let canvasFrameId = 0;
    let previousCanvasFrame = 0;
    let hasRenderedCanvas = false;

    const renderCanvasFrame = (timestamp: number) => {
      if (!isRenderingCanvas || !canvasContext) return;

      if (
        timestamp - previousCanvasFrame >= 1000 / 24 &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        previousCanvasFrame = timestamp;
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);

        const frame = canvasContext.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );
        const pixels = frame.data;

        for (let index = 0; index < pixels.length; index += 4) {
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          const maximum = Math.max(red, green, blue);
          const minimum = Math.min(red, green, blue);
          const neutralBackground = maximum - minimum < 14 && maximum < 253;

          if (neutralBackground) pixels[index + 3] = 0;
        }

        canvasContext.putImageData(frame, 0, 0);

        if (!hasRenderedCanvas) {
          hasRenderedCanvas = true;
          setIsReady(true);
        }
      }

      canvasFrameId = window.requestAnimationFrame(renderCanvasFrame);
    };

    const startCanvasRendering = () => {
      if (!canvasContext || isRenderingCanvas) return;
      isRenderingCanvas = true;
      canvasFrameId = window.requestAnimationFrame(renderCanvasFrame);
    };

    const stopCanvasRendering = () => {
      isRenderingCanvas = false;
      window.cancelAnimationFrame(canvasFrameId);
    };

    const syncPlayback = () => {
      const preference = playbackPreferenceRef.current;
      const motionAllowed =
        preference === "playing" ||
        (preference === "auto" && !motionPreference.matches);
      const shouldPlay =
        motionAllowed && isVisible && document.visibilityState === "visible";

      if (shouldPlay) {
        startCanvasRendering();
        void video.play().catch(() => undefined);
      } else {
        stopCanvasRendering();
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
      stopCanvasRendering();
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
      className={`abeam-video${isReady ? " is-ready" : ""}${usesCanvas ? " uses-canvas" : ""}${className ? ` ${className}` : ""}`}
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
        src="/abeam/loop.webm"
        muted
        loop
        playsInline
        preload={priority ? "auto" : "metadata"}
        onCanPlay={() => {
          if (!usesCanvasRef.current) setIsReady(true);
        }}
        onError={() => setIsReady(false)}
        onPause={() => setIsPlaying(false)}
        onPlaying={() => setIsPlaying(true)}
      />
      <canvas
        className="abeam-video-canvas"
        ref={canvasRef}
        width={320}
        height={320}
        aria-hidden="true"
      />
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
