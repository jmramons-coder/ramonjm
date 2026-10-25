"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import styles from "./world-store-showcase.module.css";

const screens = [
  ["01-count", "Push, we count — hands-free tracking"],
  ["02-mentor", "Stay motivated with Buster"],
  ["03-anywhere", "Train anywhere"],
  ["04-path", "Climb your 100-level path"],
  ["05-completion", "One rep at a time — completed set"],
  ["06-league", "Join the Hall of Fame"],
  ["07-rewards", "Unlock frames as you rise"],
];
type Bounds = { left: number; top: number; width: number; height: number };
function Screen({ index, eager = false }: { index: number; eager?: boolean }) {
  return <Image src={`/world/store-${screens[index][0]}.webp`} alt={screens[index][1]} width={990} height={2151} unoptimized loading={eager ? "eager" : "lazy"} sizes="(max-width: 600px) 72vw, 380px" draggable={false} />;
}
function StoreGallery({ initial, origin, opener, paused, onClose }: { initial: number; origin: Bounds; opener: RefObject<HTMLButtonElement | null>; paused: boolean; onClose: (index: number) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const active = useRef(initial);
  const closing = useRef(false);
  const animation = useRef<Animation | null>(null);
  const [selected, setSelected] = useState(initial);
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
    onClose(active.current);
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
  }
  return <dialog ref={dialog} className={styles.dialog} aria-label="PushedWorld App Store gallery" onCancel={(event) => { event.preventDefault(); void close(); }} onClick={(event) => { if (event.target === event.currentTarget) void close(); }}>
    <div className={styles.brand}><Image src="/world/app-icon.png" alt="" width={36} height={36} unoptimized />PushedWorld</div>
    <button className={styles.close} aria-label="Close PushedWorld gallery" onClick={() => void close()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
    <div ref={track} className={styles.track} onScroll={measure} onClick={(event) => { if (event.target === event.currentTarget) void close(); }} onKeyDown={(event) => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); go(active.current + (event.key === "ArrowRight" ? 1 : -1)); } }} aria-label="Scroll through App Store screens" tabIndex={0}>
      {screens.map(([file, label], index) => <button key={file} type="button" className={styles.slide} aria-label={`Center screen ${index+1}: ${label}`} aria-current={selected === index ? "true" : undefined} onClick={() => go(index)}><div className={styles.image}><Screen index={index} eager /></div></button>)}
    </div>
    <div className={styles.storeBadge}><Image src="/world/app-store-badge.svg" alt="App Store" width={126} height={42} unoptimized /><span>Coming soon</span></div>
    <div className={styles.footer}><span aria-live="polite">{selected + 1} / {screens.length}</span><div className={styles.dots}>{screens.map(([file, label], index) => <button key={file} aria-label={`Show ${label}`} aria-pressed={selected === index} onClick={() => go(index)}><span /></button>)}</div><span>Scroll to explore</span></div>
  </dialog>;
}
export function WorldStoreShowcase({ paused }: { paused: boolean }) {
  const opener = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState(4);
  const [origin, setOrigin] = useState<Bounds | null>(null);
  useEffect(() => {
    const element = opener.current;
    if (!element || origin) return;
    let visible = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => { clearInterval(timer); if (visible && !paused && !document.hidden && !preference.matches) timer = setInterval(() => setSelected(value => (value + 1) % screens.length), 4200); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .2 });
    observer.observe(element); document.addEventListener('visibilitychange',sync); preference.addEventListener('change',sync);
    return () => { clearInterval(timer); observer.disconnect(); document.removeEventListener('visibilitychange',sync); preference.removeEventListener('change',sync); };
  }, [paused, origin]);

  return <><article className={styles.card} aria-label="PushedWorld App Store artwork"><button ref={opener} className={styles.tile} aria-label="Expand PushedWorld App Store screens" aria-haspopup="dialog" data-open={!!origin} onClick={(event) => { const { left, top, width, height } = event.currentTarget.getBoundingClientRect(); setOrigin({ left, top, width, height }); }}><Screen index={selected} /></button></article>{origin && <StoreGallery initial={selected} origin={origin} opener={opener} paused={paused} onClose={(index) => { setSelected(index); setOrigin(null); }} />}</>;
}
