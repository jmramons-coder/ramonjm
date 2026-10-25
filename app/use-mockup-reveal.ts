"use client";
import { useEffect, useRef } from "react";

export function useMockupReveal(paused: boolean) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || paused || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    element.dataset.revealed = "false";
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { element.dataset.revealed = "true"; observer.disconnect(); }
    }, { threshold: .18 });
    observer.observe(element);
    return () => { observer.disconnect(); delete element.dataset.revealed; };
  }, [paused]);
  return ref;
}
