"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ProcessGallery } from "./tracer-process-showcase";
import styles from "./tracer-glass-showcase.module.css";

type Bounds = { left: number; top: number; width: number; height: number };

function Artwork() {
  return (
    <div className={styles.artwork}>
      <Image src="/showcase/editorial/tracer-landscape.webp" alt="" fill unoptimized sizes="(max-width: 640px) 100vw, 900px" className={styles.landscape} />
      <Image src="/showcase/editorial/tracer-glass.webp" alt="" width={523} height={478} unoptimized className={styles.mark} />
    </div>
  );
}

export function TracerGlassShowcase({ paused }: { paused: boolean }) {
  const opener = useRef<HTMLButtonElement>(null);
  const [origin, setOrigin] = useState<Bounds | null>(null);
  return (
    <>
      <article className={styles.card} aria-label="Tracer glass identity artwork" data-paused={paused}>
        <button ref={opener} type="button" className={styles.tile} aria-label="Expand Tracer glass artwork" aria-haspopup="dialog" data-open={!!origin} onClick={(event) => {
          const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
          setOrigin({ left, top, width, height });
        }}><Artwork /></button>
      </article>
      {origin && <ProcessGallery paused={paused} onClose={() => { setOrigin(null); requestAnimationFrame(() => opener.current?.focus({ preventScroll: true })); }} />}
    </>
  );
}
