"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./featured-preview.module.css";

const ProductDemo = dynamic(
  () => import("./abeam/product-demo").then((module) => module.ProductDemo),
  { loading: () => <p className={styles.loading}>Opening the walkthrough…</p> },
);

export type PreviewKind = "abeam" | "nudge" | "world" | "tracer";

const previews = {
  abeam: {
    title: "Inside aBeam",
    caption:
      "Explore a conversation, client context and follow-up. Demo with fictional clients.",
  },
  nudge: {
    title: "Nudge in motion",
    caption: "A short recording of the household app in use.",
  },
  world: {
    title: "PushedWorld / The early prototype",
    caption:
      "A real early app capture with camera input, pose tracking and a rep counter. The current product has evolved from this prototype.",
  },
  tracer: {
    title: "The many sides of Tracer",
    caption: "A connected product, identity and campaign.",
  },
};

const tracerImages = [
  {
    label: "Campaign",
    src: "/tracer/brand-campaign.webp",
    width: 2400,
    height: 1600,
  },
  {
    label: "Product",
    src: "/tracer/app-workspace.webp",
    width: 1921,
    height: 858,
  },
  {
    label: "Identity",
    src: "/tracer/brand-architecture.webp",
    width: 2400,
    height: 1260,
  },
];

export function FeaturedPreview({
  kind,
  onClose,
  paused = false,
}: {
  kind: PreviewKind;
  onClose: () => void;
  paused?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const id = useId();
  const [imageIndex, setImageIndex] = useState(0);
  const preview = previews[kind];

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stopWhenNeeded = () => {
      if (paused || reduced.matches || document.hidden) element.pause();
    };
    if (!paused && !reduced.matches && !document.hidden)
      void element.play().catch(() => undefined);
    reduced.addEventListener("change", stopWhenNeeded);
    document.addEventListener("visibilitychange", stopWhenNeeded);
    return () => {
      element.pause();
      reduced.removeEventListener("change", stopWhenNeeded);
      document.removeEventListener("visibilitychange", stopWhenNeeded);
    };
  }, [kind, paused]);

  function close() {
    dialog.current?.close();
    onClose();
  }

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-caption`}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          close();
      }}
    >
      <div className={styles.header}>
        <div>
          <h2 id={`${id}-title`}>{preview.title}</h2>
          <p id={`${id}-caption`}>{preview.caption}</p>
        </div>
        <button
          type="button"
          className={styles.close}
          onClick={close}
          aria-label="Close preview"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      {kind === "abeam" ? (
        <div className={styles.walkthrough}>
          <ProductDemo />
        </div>
      ) : kind === "tracer" ? (
        <div className={styles.gallery}>
          <div
            className={styles.galleryTabs}
            role="group"
            aria-label="Tracer artwork"
          >
            {tracerImages.map((item, index) => (
              <button
                key={item.label}
                type="button"
                aria-pressed={imageIndex === index}
                onClick={() => setImageIndex(index)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Image
            src={tracerImages[imageIndex].src}
            alt={`Tracer ${tracerImages[imageIndex].label.toLowerCase()} artwork`}
            width={tracerImages[imageIndex].width}
            height={tracerImages[imageIndex].height}
            unoptimized
          />
        </div>
      ) : (
        <div className={styles.videoStage}>
          <video
            ref={video}
            src={
              kind === "nudge"
                ? "/nudge/demo.mp4"
                : "/showcase/world/prototype-loop.mp4"
            }
            poster={
              kind === "nudge"
                ? "/nudge/home.webp"
                : "/showcase/world/prototype-poster.webp"
            }
            aria-label={
              kind === "nudge"
                ? "Nudge native app demonstration recording"
                : "Real capture of an early PushedWorld prototype"
            }
            controls
            onPlay={(event) => {
              if (paused || document.hidden) event.currentTarget.pause();
            }}
            muted
            playsInline
            preload="metadata"
          />
        </div>
      )}
    </dialog>
  );
}
