"use client";

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import styles from "./midjourney-showcase.module.css";

type Bounds = { left: number; top: number; width: number; height: number };

function Artwork({ paused, expanded = false, videoRef, position }: { paused: boolean; expanded?: boolean; videoRef: RefObject<HTMLVideoElement | null>; position: number }) {
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .1 });
    observer.observe(video);
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    const visibility = () => setPageVisible(!document.hidden);
    update(); visibility();
    preference.addEventListener("change", update);
    document.addEventListener("visibilitychange", visibility);
    return () => { observer.disconnect(); preference.removeEventListener("change", update); document.removeEventListener("visibilitychange", visibility); };
  }, [videoRef]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!paused && visible && pageVisible && (expanded || !reduced)) void video.play().catch(() => {});
    else video.pause();
  }, [paused, visible, pageVisible, reduced, expanded, videoRef]);
  return <video ref={videoRef} className={styles.artwork} src="/showcase/midjourney/june-19-2025.mp4" poster="/showcase/midjourney/poster.webp" muted loop playsInline preload="metadata" aria-label="Midjourney animated artwork" onLoadedMetadata={(event) => { event.currentTarget.currentTime = position; }} />;
}

function VideoPreview({ origin, opener, paused, position, onClose }: {
  origin: Bounds;
  opener: RefObject<HTMLButtonElement | null>;
  paused: boolean;
  position: number;
  onClose: (time: number) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const animation = useRef<Animation | null>(null);

  useEffect(() => {
    const element = dialog.current;
    const image = panel.current;
    if (!element || !image) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    if (!paused && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const target = image.getBoundingClientRect();
      animation.current = image.animate([
        { transform: `translate(${origin.left - target.left}px, ${origin.top - target.top}px) scale(${origin.width / target.width}, ${origin.height / target.height})` },
        { transform: "translate(0, 0) scale(1)" },
      ], { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" });
    }
    return () => {
      animation.current?.cancel();
      element.close();
      document.body.style.overflow = overflow;
    };
  }, [origin, paused]);

  async function close() {
    if (closing.current) return;
    closing.current = true;
    const image = panel.current;
    const destination = opener.current?.getBoundingClientRect();
    if (image && destination && !paused && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animation.current?.cancel();
      const source = image.getBoundingClientRect();
      animation.current = image.animate([
        { transform: "translate(0, 0) scale(1)" },
        { transform: `translate(${destination.left - source.left}px, ${destination.top - source.top}px) scale(${destination.width / source.width}, ${destination.height / source.height})` },
      ], { duration: 320, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
      await animation.current.finished.catch(() => {});
    }
    onClose(video.current?.currentTime ?? position);
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
  }

  return (
    <dialog ref={dialog} className={styles.dialog} aria-label="Midjourney artwork" onCancel={(event) => { event.preventDefault(); void close(); }} onClick={(event) => { if (event.target === event.currentTarget) void close(); }}>
      <div ref={panel} className={styles.panel} style={{ "--art-ratio": origin.width / origin.height } as CSSProperties}>
        <Artwork paused={paused} expanded videoRef={video} position={position} />
        <div className={styles.label}>Midjourney <span>·</span> June 19 2025</div>
      </div>
        <button type="button" className={styles.close} aria-label="Close Midjourney artwork" onClick={() => void close()}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
    </dialog>
  );
}

export function MidjourneyShowcase({ paused }: { paused: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [position, setPosition] = useState(0);
  const opener = useRef<HTMLButtonElement>(null);
  const [origin, setOrigin] = useState<Bounds | null>(null);
  return (
    <>
      <article className={styles.card} aria-label="Midjourney video artwork" data-paused={paused}>
        <button ref={opener} type="button" className={styles.tile} aria-label="Expand Midjourney artwork" aria-haspopup="dialog" data-open={!!origin} onClick={(event) => {
          const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
          setPosition(video.current?.currentTime ?? 0);
          setOrigin({ left, top, width, height });
        }}><Artwork paused={paused || !!origin} videoRef={video} position={position} /></button>
      </article>
      {origin && <VideoPreview origin={origin} opener={opener} paused={paused} position={position} onClose={(time) => { setPosition(time); if (video.current) video.current.currentTime = time; setOrigin(null); }} />}
    </>
  );
}
