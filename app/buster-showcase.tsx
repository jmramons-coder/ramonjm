"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./buster-showcase.module.css";
export function BusterShowcase({ paused }: { paused: boolean }) {
  const [pose, setPose] = useState(0);
  const [reps, setReps] = useState(0);
  const [moving, setMoving] = useState(false);
  const busy = useRef(false);
  const [loaded, setLoaded] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  function pushup() {
    if (busy.current || loaded < 3) return;
    if (paused || matchMedia('(prefers-reduced-motion: reduce)').matches) { setReps(value => value + 1); return; }
    busy.current = true; setMoving(true); setPose(1);
    [[160,2],[360,1],[520,0]].forEach(([time,frame]) => timers.current.push(setTimeout(() => setPose(frame),time)));
    timers.current.push(setTimeout(() => { setReps(value => value + 1); setMoving(false); busy.current = false; timers.current = []; },600));
  }
  return <article className={styles.card} aria-label="PushedWorld interactive Buster" data-paused={paused}>
    <div className={styles.counter} role="status"><strong>{reps}</strong><span>Rep</span></div>
    <div className={styles.floor} aria-hidden="true" />
    <div className={styles.scene}>
      <div className={styles.scan} aria-hidden="true" />
      <Image className={styles.device} src="/showcase/world/hero-phone.webp" alt="The iPhone camera facing Buster, from the PushedWorld website" width={1200} height={968} unoptimized draggable={false} />
      <div className={styles.buster}>{['top','middle','bottom'].map((name,index) => <Image key={name} src={`/world/buster-${name}.webp`} alt={index === pose ? 'Buster demonstrating a push-up' : ''} aria-hidden={index !== pose} width={600} height={396} unoptimized loading="eager" onLoad={() => setLoaded(value => value + 1)} draggable={false} style={{visibility: index === pose ? "visible" : "hidden"}} />)}</div>
    </div>
    <button type="button" className={styles.hitArea} onClick={pushup} aria-label="Make Buster do a push-up" aria-disabled={moving || loaded < 3} aria-describedby="buster-rep-tooltip" />
    <span className={styles.repPrompt} id="buster-rep-tooltip"><span className={styles.repType}>Click to rep</span><svg className={styles.repCursor} viewBox="0 0 28 34" fill="none" aria-hidden="true"><path d="M4 2v24l6-6 5 11 5-2-5-10 9-1L4 2Z" fill="currentColor" stroke="#74321a" strokeWidth="1.5" strokeLinejoin="round" /><path d="m22 3 2-2m1 8h3M18 1v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></span>
  </article>;
}
