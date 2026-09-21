"use client";

import { useEffect } from "react";

/** Match the browser's rubber-band canvas to the nearest end of this page. */
export function ScrollBackground({ hasFooter }: { hasFooter: boolean }) {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousRoot = root.style.background;
    const previousBody = body.style.background;
    let frame = 0;
    const update = () => {
      frame = 0;
      const nearBottom = window.scrollY > 0 && window.scrollY + window.innerHeight >= body.scrollHeight - window.innerHeight / 2;
      const color = hasFooter && nearBottom ? "#009fff" : "#fff";
      root.style.background = color;
      body.style.background = color;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      root.style.background = previousRoot;
      body.style.background = previousBody;
    };
  }, [hasFooter]);
  return null;
}
