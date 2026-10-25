"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import ShaderOrb from "./abeam/shader-orb";
import styles from "./featured-presentation.module.css";

function subscribeReducedMotion(onChange: () => void) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  preference.addEventListener("change", onChange);
  return () => preference.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function getDocumentVisible() {
  return !document.hidden;
}

export function FeaturedPresentation({ paused }: { paused: boolean }) {
  const presentation = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true);
  const documentVisible = useSyncExternalStore(subscribeVisibility, getDocumentVisible, () => true);
  const motionAllowed = inView && documentVisible && !paused && !reducedMotion;
  useEffect(() => {
    const element = presentation.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: .1 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <section ref={presentation} className={styles.presentation} aria-label="Featured project: aBeam" data-motion={motionAllowed}>
    <header className={styles.identity}>
      <ShaderOrb tone="blue" edge="smooth" animated={motionAllowed} className={styles.identityOrb} />
      <div><h2>aBeam</h2><p>The travel copilot</p></div>
    </header>
    <figure className={styles.beamVisual}>
      <Image className={styles.beamInterface} src="/abeam/explore.webp" alt="A sneak peek into aBeam Explorer: navigation, travel search and flight details." width={1440} height={960} sizes="(max-width: 760px) 90vw, 1100px" unoptimized loading="eager" draggable={false} />
    </figure>
  </section>;
}
