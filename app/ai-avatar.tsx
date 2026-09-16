"use client";

import { useEffect, useRef, useState } from "react";

export function AiAvatar() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [requested, setRequested] = useState<boolean | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      if ((requested ?? !motion.matches) && visible && !document.hidden) {
        void video.play().catch(() => setPlaying(false));
      } else video.pause();
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
      video.pause();
    };
  }, [requested]);

  return (
    <button className="ai-avatar" type="button"
      aria-label={playing ? "Pause AI avatar animation" : "Play AI avatar animation"}
      onClick={() => setRequested(!playing)}>
      <video ref={ref} width={48} height={48} muted loop playsInline
        preload="none" poster="/equisoft-ai-avatar.png" aria-hidden="true"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}>
        <source src="/equisoft-ai-avatar.mp4" type="video/mp4" />
      </video>
    </button>
  );
}
