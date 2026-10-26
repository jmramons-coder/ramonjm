"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from "react";
import styles from "./lungs-showcase.module.css";
type Bounds = { left: number; top: number; width: number; height: number };
const currency = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

/** Keep the public website's continuous preview and baseline arithmetic. */
function durationLabel(days: number) {
  if (days < 14) return `${days} days`;
  if (days < 60) return `${Math.round(days / 7)} weeks`;
  if (days < 330) {
    const months = days / 30.4375;
    const rounded =
      months < 4 ? Math.round(months * 10) / 10 : Math.round(months);
    return `${rounded.toLocaleString("en-CA")} ${rounded === 1 ? "month" : "months"}`;
  }
  return days < 365 ? `${Math.round(days / 30.4375)} months` : "1 year";
}

function Outcome({ progress, onProgress, onExpand, opener }: { progress: number; onProgress: (value: number) => void; onExpand?: () => void; opener?: RefObject<HTMLButtonElement | null> }) {
  const id = useId();
  const scene = useRef<HTMLDivElement>(null);
  function drag(event: PointerEvent<HTMLDivElement>) {
    const box = scene.current?.getBoundingClientRect();
    if (box) onProgress(Math.max(0, Math.min(100, (event.clientX - box.left - 24) / (box.width - 48) * 100)));
  }
  const days = Math.round(7 + 358 * progress / 100);
  const money = Math.round(days / 7 * 50);
  const moments = Math.round(days / 7 * 5);
  const endpoint = progress === 0 ? "start" : progress === 100 ? "end" : undefined;

  return <div className={styles.outcome} data-endpoint={endpoint} style={{ "--outcome-ratio": progress / 100 } as CSSProperties}>
    <div ref={scene} className={styles.visual}>
      <div className={styles.darkScene} /><div className={styles.brightScene} />
      <div className={styles.normalCharacter}><div className={styles.artboard}><Image className={`${styles.ember} ${styles.skull}`} src="/showcase/lungsmaxing/ember-skull.png" alt="Ember wearing the brand’s skull mask" width={520} height={520} unoptimized draggable={false} /></div></div>
      <div className={styles.activeCharacter}><div className={styles.artboard}><Image className={styles.ember} src="/showcase/lungsmaxing/ember-vape.webp" alt="Ember revealing laser vision and a burning vape as the preview advances" width={720} height={720} unoptimized draggable={false} sizes="(max-width: 640px) 100vw, 700px" /></div></div>
      {onExpand && <button ref={opener} className={styles.expand} aria-label="Expand Lungsmaxing outcome preview" aria-haspopup="dialog" onClick={onExpand} />}
      {onExpand && <header className={styles.header}><Image src="/showcase/lungsmaxing/icon.webp" alt="" width={32} height={32} unoptimized /><h2>Lungsmaxing</h2></header>}
      <div className={styles.divider} aria-hidden="true" />
      <div className={styles.grip} role="slider" tabIndex={0} aria-label="Preview time after quitting, from one week to one year" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-describedby={`${id}-baseline`} aria-valuetext={`${durationLabel(days)}; estimated ${money} Canadian dollars saved; ${moments} use moments avoided`}
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); drag(event); }}
        onPointerMove={(event) => { if (event.buttons === 1 || event.currentTarget.hasPointerCapture(event.pointerId)) drag(event); }}
        onPointerUp={(event) => { drag(event); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
        onKeyDown={(event) => { let value = progress; if (event.key === 'ArrowRight' || event.key === 'ArrowUp') value += 1; else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') value -= 1; else if (event.key === 'PageUp') value += 10; else if (event.key === 'PageDown') value -= 10; else if (event.key === 'Home') value = 0; else if (event.key === 'End') value = 100; else return; event.preventDefault(); onProgress(Math.max(0,Math.min(100,value))); }}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m8 8-4 4 4 4m8-8 4 4-4 4M4 12h16" /></svg>
      </div>
    </div>
    <footer className={styles.controls}>
      <div className={styles.horizon}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
        <span>After</span><output aria-live="off">{durationLabel(days)}</output>
      </div>
      <dl className={styles.totals}>
        <div><dt>Estimated saved</dt><dd><output aria-live="off">{currency.format(money)}</output></dd></div>
        <div><dt>Use moments avoided</dt><dd><output aria-live="off">{moments}</output></dd></div>
      </dl>
      <span className={styles.srOnly} id={`${id}-baseline`}>Illustrative baseline: CAD $50 and 5 use moments per week. Estimates, not guaranteed outcomes.</span>
    </footer>
  </div>;
}
function LungsPreview({ origin, returnTarget, paused, progress, onProgress, onClose }: {
  origin: Bounds;
  returnTarget: RefObject<HTMLElement | null>;
  paused: boolean;
  progress: number;
  onProgress: (value: number) => void;
  onClose: () => void;
}) {
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
    const destination = returnTarget.current?.getBoundingClientRect();
    if (image && destination && !paused && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animation.current?.cancel();
      const source = image.getBoundingClientRect();
      animation.current = image.animate([
        { transform: "translate(0, 0) scale(1)" },
        { transform: `translate(${destination.left - source.left}px, ${destination.top - source.top}px) scale(${destination.width / source.width}, ${destination.height / source.height})` },
      ], { duration: 320, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
      await animation.current.finished.catch(() => {});
    }
    dialog.current?.close();
    onClose();
  }

  return (
    <dialog ref={dialog} className={styles.dialog} aria-label="Lungsmaxing outcome preview" onCancel={(event) => { event.preventDefault(); void close(); }} onClick={(event) => { if (event.target === event.currentTarget) void close(); }}>
      <div ref={panel} className={styles.panel} style={{ "--art-ratio": origin.width / origin.height } as CSSProperties}>
        <Outcome progress={progress} onProgress={onProgress} />
      </div>
      <header className={styles.modalBrand}><Image src="/showcase/lungsmaxing/icon.webp" alt="" width={32} height={32} unoptimized /><span>Lungsmaxing</span></header>
        <button type="button" className={styles.close} aria-label="Close Lungsmaxing preview" onClick={() => void close()}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
    </dialog>
  );
}

export function LungsShowcase({ paused }: { paused: boolean }) {
  const opener = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(50);
  const [origin, setOrigin] = useState<Bounds | null>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (origin) {
      wasOpen.current = true;
    } else if (wasOpen.current) {
      wasOpen.current = false;
      opener.current?.focus({ preventScroll: true });
    }
  }, [origin]);
  return <><article ref={card} className={styles.card} aria-label="Lungsmaxing" data-open={!!origin}>
    <Outcome opener={opener} progress={progress} onProgress={setProgress} onExpand={() => { const box = card.current?.getBoundingClientRect(); if (box) setOrigin({ left: box.left, top: box.top, width: box.width, height: box.height }); }} />

  </article>{origin && <LungsPreview origin={origin} returnTarget={card} paused={paused} progress={progress} onProgress={setProgress} onClose={() => setOrigin(null)} />}</>;
}
