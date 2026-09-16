"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function AiAvatar() {
  const ref = useRef<HTMLButtonElement>(null);
  const [playing, setPlaying] = useState(false);
  const [requested, setRequested] = useState<boolean | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      if ((requested ?? !motion.matches) && visible && !document.hidden) {
        setPlaying(true);
      } else setPlaying(false);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(video);
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);

    };
  }, [requested]);

  return (
    <button ref={ref} className="ai-avatar" type="button"
      aria-label={playing ? "Pause AI avatar animation" : "Play AI avatar animation"}
      onClick={() => setRequested(!playing)}>
      <Image src={playing ? "/equisoft-ai-avatar.webp" : "/equisoft-ai-avatar.png"} alt="" width={28} height={28} unoptimized />
    </button>
  );
}
