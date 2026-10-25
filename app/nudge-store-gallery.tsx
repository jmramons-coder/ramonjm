"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import styles from "./nudge-store-gallery.module.css";

const screens = [
  ['video','Nudge task creation walkthrough'],
  ['01-voice','Capture tasks with your voice'],
  ['02-completion','Celebrate getting things done'],
  ['03-ownership','Give every task an owner'],
  ['04-routine','Build shared routines'],
  ['05-focus','Focus on what matters'],
  ['06-upcoming','See what is coming next'],
  ['07-collection','Collect your household wins'],
];
type Bounds = { left: number; top: number; width: number; height: number };
export function NudgeStoreGallery({ origin, opener, paused, initialTime, onClose }: { initialTime: number; origin: Bounds; opener: RefObject<HTMLButtonElement | null>; paused: boolean; onClose: (time: number) => void }) {
  const initial = 0;
  const video = useRef<HTMLVideoElement>(null);
  const [time, setTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const active = useRef(initial);
  const closing = useRef(false);
  const animation = useRef<Animation | null>(null);
  const [selected, setSelected] = useState(initial);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => { if (selected === 0 && !paused && !document.hidden && !preference.matches) void element.play().catch(() => {}); else element.pause(); };
    sync(); document.addEventListener('visibilitychange',sync); preference.addEventListener('change',sync);
    return () => { element.pause(); document.removeEventListener('visibilitychange',sync); preference.removeEventListener('change',sync); };
  }, [selected, paused]);
  const motion = useCallback(() => !paused && !matchMedia("(prefers-reduced-motion: reduce)").matches, [paused]);
  const measure = useCallback(() => {
    const rail = track.current;
    if (!rail) return;
    const center = rail.getBoundingClientRect().left + rail.clientWidth / 2;
    let nearest = 0, distance = Infinity;
    Array.from(rail.children).forEach((element, index) => {
      const child = element as HTMLElement;
      const rect = child.getBoundingClientRect();
      const delta = Math.abs(rect.left + rect.width / 2 - center);
      child.style.setProperty("--scale", String(1 - .18 * Math.min(delta / (rect.width + 24), 1)));
      child.style.setProperty("--fade", String(1 - .35 * Math.min(delta / (rect.width + 24), 1)));
      if (delta < distance) { nearest = index; distance = delta; }
    });
    active.current = nearest;
    setSelected(nearest);
  }, []);
  const go = useCallback((index: number, smooth = true) => {
    const rail = track.current;
    const child = rail?.children[Math.max(0, Math.min(screens.length - 1, index))] as HTMLElement | undefined;
    if (rail && child) rail.scrollTo({ left: child.offsetLeft + child.offsetWidth / 2 - rail.clientWidth / 2, behavior: smooth && motion() ? "smooth" : "instant" });
  }, [motion]);
  useLayoutEffect(() => {
    const modal = dialog.current;
    const rail = track.current;
    if (!modal || !rail) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modal.showModal();
    go(initial, false); measure();
    const image = rail.children[initial].firstElementChild as HTMLElement;
    if (motion()) {
      const target = image.getBoundingClientRect();
      animation.current = image.animate([{ transformOrigin: "top left", transform: `translate(${origin.left-target.left}px, ${origin.top-target.top}px) scale(${origin.width/target.width}, ${origin.height/target.height})` }, { transformOrigin: "top left", transform: "none" }], { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" });
    }
    const wheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) { event.preventDefault(); rail.scrollLeft += event.deltaY; }
    };
    const resize = new ResizeObserver(() => { go(active.current, false); measure(); });
    resize.observe(rail);
    rail.addEventListener("wheel", wheel, { passive: false });
    return () => { animation.current?.cancel(); resize.disconnect(); rail.removeEventListener("wheel", wheel); modal.close(); document.body.style.overflow = overflow; };
  }, [go, initial, measure, motion, origin]);
  async function close() {
    if (closing.current) return;
    closing.current = true;
    const image = track.current?.children[active.current]?.firstElementChild as HTMLElement | undefined;
    const destination = opener.current?.getBoundingClientRect();
    if (image && destination && motion()) {
      animation.current?.cancel();
      const source = image.getBoundingClientRect();
      animation.current = image.animate([{ transformOrigin: "top left", transform: "none" }, { transformOrigin: "top left", transform: `translate(${destination.left-source.left}px, ${destination.top-source.top}px) scale(${destination.width/source.width}, ${destination.height/source.height})` }], { duration: 320, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
      await animation.current.finished.catch(() => {});
    }
    onClose(video.current?.currentTime ?? initialTime);
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
  }
  return <dialog ref={dialog} className={styles.dialog} aria-label="Nudge app and App Store gallery" onCancel={(event) => { event.preventDefault(); void close(); }} onClick={(event) => { if (event.target === event.currentTarget) void close(); }}>
    <div className={styles.brand}><Image src="/nudge/mark.webp" alt="" width={36} height={36} unoptimized />Nudge</div>
    <button className={styles.close} aria-label="Close Nudge gallery" onClick={() => void close()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
    <div ref={track} className={styles.track} onScroll={measure} onClick={(event) => { if (event.target === event.currentTarget) void close(); }} onKeyDown={(event) => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); go(active.current + (event.key === "ArrowRight" ? 1 : -1)); } }} aria-label="Scroll through App Store screens" tabIndex={0}>
      {screens.map(([file, label], index) => <button key={file} type="button" className={styles.slide} aria-label={`Center Nudge screen ${index+1}: ${label}`} aria-current={selected === index ? "true" : undefined} onClick={() => go(index)}><div className={styles.image}>{index === 0 ? <video ref={video} src="/showcase/nudge/native-flow.mp4" poster="/showcase/nudge/native-poster.webp" muted loop playsInline preload="metadata" aria-label="Nudge task creation walkthrough" onLoadedMetadata={(event) => { event.currentTarget.currentTime = initialTime; setDuration(event.currentTarget.duration); if (selected === 0 && !paused && !matchMedia('(prefers-reduced-motion: reduce)').matches) void event.currentTarget.play().catch(() => {}); }} onTimeUpdate={event => setTime(event.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} /> : <Image src={`/nudge/store-${file}.webp`} alt={label} width={990} height={2151} unoptimized draggable={false} sizes="(max-width:600px) 72vw, 380px" />}</div></button>)}
    </div>
    {selected === 0 && <div className={styles.mediaBar}>
      <button aria-label={playing ? 'Pause Nudge video' : 'Play Nudge video'} disabled={paused} onClick={() => { if (video.current) { if (playing) video.current.pause(); else void video.current.play().catch(() => {}); } }}><svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d={playing ? "M6 5h3v10H6zm5 0h3v10h-3z" : "m7 4 9 6-9 6V4Z"} /></svg></button>
      <button aria-label="Restart Nudge video" disabled={paused} onClick={() => { if (video.current) { video.current.currentTime = 0; void video.current.play().catch(() => {}); } }}><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 8a6.2 6.2 0 1 1 .3 4M4 3v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
      <input type="range" min={0} max={duration || 1} step={.1} value={Math.min(time,duration || 1)} aria-label="Seek Nudge video" onChange={event => { if (video.current) { video.current.currentTime = Number(event.target.value); setTime(Number(event.target.value)); } }} />
      <span>{Math.floor(time)} / {Math.round(duration)}s</span>
    </div>}
    <a className={styles.storeBadge} href="https://apps.apple.com/app/id6804271028" target="_blank" rel="noopener noreferrer" aria-label="Download Nudge on the App Store (opens in a new tab)"><Image src="/world/app-store-badge.svg" alt="Download on the App Store" width={126} height={42} unoptimized /><span><i aria-hidden="true" />Live on the App Store</span></a>
    <div className={styles.footer}><span aria-live="polite">{selected + 1} / {screens.length}</span><div className={styles.dots}>{screens.map(([file, label], index) => <button key={file} aria-label={`Show ${label}`} aria-pressed={selected === index} onClick={() => go(index)}><span /></button>)}</div><span>Scroll to explore</span></div>
  </dialog>;
}
