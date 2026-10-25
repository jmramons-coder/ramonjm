"use client";

import Image from "next/image";
import { useRef } from "react";
import styles from "./nudge-stickers.module.css";

export function NudgeStickers({ paused }: { paused: boolean }) {
  const animations = useRef(new Map<HTMLButtonElement, Animation>());
  return <article className={styles.card} aria-label="Nudge original reward stickers" data-paused={paused} onPointerMove={(event) => {
    if (paused || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--x", `${((event.clientX-box.left)/box.width-.5)*12}px`);
    event.currentTarget.style.setProperty("--y", `${((event.clientY-box.top)/box.height-.5)*12}px`);
  }} onPointerLeave={(event) => { event.currentTarget.style.setProperty("--x", "0px"); event.currentTarget.style.setProperty("--y", "0px"); }}>
    <div className={styles.glow} aria-hidden="true" />
    {([['medal', 'Nudge medal'], ['rocket', 'Nudge rocket']] as const).map(([file, label], index) => <button key={file} type="button" className={`${styles.sticker} ${index === 0 ? styles.medal : styles.check}`} aria-label={`Give the ${label} sticker a wiggle`} onClick={(event) => {
      if (paused || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const target = event.currentTarget;
      animations.current.get(target)?.cancel();
      const animation = target.animate([{ rotate: '0deg' }, { rotate: '-9deg', scale: '1.08' }, { rotate: '7deg' }, { rotate: '-3deg' }, { rotate: '0deg', scale: '1' }], { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)' });
      animations.current.set(target, animation);
      void animation.finished.then(() => animations.current.delete(target)).catch(() => {});
    }}><Image src={`/showcase/nudge/sticker-${file}.webp`} alt={label} width={510} height={750} unoptimized sizes="(max-width: 640px) 50vw, 240px" draggable={false} /></button>)}
  </article>;
}
