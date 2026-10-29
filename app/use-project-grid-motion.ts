"use client";

import { useEffect, type RefObject } from "react";

type Spring = { position: number; velocity: number; stiffness: number; damping: number };
type Column = Spring & { gain: number };
type Tile = Spring & { element: HTMLElement; content: HTMLElement; column: Column; gain: number };
const modalSelector = 'dialog[open], [aria-modal="true"]:not([aria-hidden="true"])';
const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

function advance(spring: Spring, target: number, dt: number) {
  spring.velocity += ((target - spring.position) * spring.stiffness - spring.velocity * spring.damping) * dt;
  spring.position += spring.velocity * dt;
  return Math.abs(spring.position) > 0.025 || Math.abs(spring.velocity) > 0.15;
}

/** Scroll keeps its native behavior; only the visible previews absorb a little momentum. */
export function useProjectGridMotion(
  gridRef: RefObject<HTMLDivElement | null>,
  paused: boolean,
  resetKey: string,
) {
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || paused) return;

    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const items = Array.from(grid.children) as HTMLElement[];
    const visible = new Set<Element>();
    let columns: Column[] = [];
    let tiles: Tile[] = [];
    let frame = 0;
    let measureFrame = 0;
    let previousTime = 0;
    let previousY = window.scrollY;
    let scrollVelocity = 0;
    let maxScroll = 0;
    let mobile = false;

    function scrollPosition() {
      return Math.max(0, Math.min(maxScroll, window.scrollY));
    }

    function reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      scrollVelocity = 0;
      previousY = scrollPosition();
      grid!.removeAttribute("data-scroll-motion");
      for (const spring of [...columns, ...tiles]) {
        spring.position = 0;
        spring.velocity = 0;
      }
      for (const tile of tiles) tile.content.style.removeProperty("--scroll-offset");
    }

    function blocked() {
      return preference.matches || document.hidden || document.body.style.overflow === "hidden"
        || Boolean(document.querySelector(modalSelector));
    }

    function measure() {
      reset();
      mobile = window.innerWidth < 640;
      maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      previousY = scrollPosition();
      // Masonry auto-placement can move an item to a different track; measure its actual column.
      const tracks = [...new Set(items.map((item) => Math.round(item.offsetLeft)))].sort((a, b) => a - b);
      columns = tracks.map((_, index) => ({
        position: 0, velocity: 0,
        stiffness: (mobile ? 220 : 160) + index * 8,
        damping: mobile ? 22 : 16 + (index % 3),
        gain: [0.78, 1.06, 0.9, 1.16, 0.84][index % 5],
      }));
      tiles = items.map((element, index) => ({
        element,
        content: element.firstElementChild as HTMLElement,
        column: columns[tracks.indexOf(Math.round(element.offsetLeft))],
        position: 0, velocity: 0,
        stiffness: 220 + (index % 4) * 12,
        damping: mobile ? 24 : 17 + (index % 3),
        gain: mobile ? 0.06 : 0.08 + (index % 4) * 0.025,
      }));
    }

    function scheduleMeasure() {
      reset();
      cancelAnimationFrame(measureFrame);
      measureFrame = requestAnimationFrame(measure);
    }

    function tick(now: number) {
      frame = 0;
      if (blocked() || !visible.size) { reset(); return; }
      const dt = Math.max(1 / 120, Math.min((now - previousTime) / 1000, 1 / 30));
      previousTime = now;
      const y = scrollPosition();
      const delta = y - previousY;
      previousY = y;
      // Anchor jumps and history restoration should land immediately.
      if (Math.abs(delta) > window.innerHeight * 1.5) { reset(); return; }
      const velocity = clamp(delta / dt, 3000);
      scrollVelocity += (velocity - scrollVelocity) * (1 - Math.exp(-18 * dt));
      const target = clamp(scrollVelocity * (mobile ? 0.007 : 0.014), mobile ? 10 : 24);
      let moving = Math.abs(scrollVelocity) > 1;
      for (const column of columns) moving = advance(column, target * column.gain, dt) || moving;

      grid!.dataset.scrollMotion = "";
      for (const tile of tiles) {
        if (!visible.has(tile.element)) {
          tile.position = 0;
          tile.velocity = 0;
          continue;
        }
        moving = advance(tile, target * tile.gain, dt) || moving;
        const offset = clamp(tile.column.position + tile.position, mobile ? 12 : 30);
        tile.content.style.setProperty("--scroll-offset", `${offset.toFixed(2)}px`);
      }
      if (moving) frame = requestAnimationFrame(tick);
      else reset();
    }

    function scroll() {
      if (blocked() || !visible.size) { reset(); return; }
      if (!frame) {
        previousTime = performance.now() - 1000 / 60;
        frame = requestAnimationFrame(tick);
      }
    }

    function beforeOpen(event: MouseEvent) {
      const opener = event.target instanceof Element
        ? event.target.closest('button[aria-haspopup="dialog"]') : null;
      if (opener) reset();
    }

    const visibility = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visible.add(entry.target);
          (entry.target as HTMLElement).dataset.scrollVisible = "";
        } else {
          visible.delete(entry.target);
          entry.target.removeAttribute("data-scroll-visible");
        }
      }
      if (!visible.size) reset();
    }, { rootMargin: "160px 0px" });
    items.forEach((item) => visibility.observe(item));
    const resize = new ResizeObserver(scheduleMeasure);
    resize.observe(grid);
    measure();
    // Window scroll is intentionally not captured: nested project scroll panes stay independent.
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scheduleMeasure, { passive: true });
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", reset);
    grid.addEventListener("click", beforeOpen, true);
    preference.addEventListener("change", reset);

    return () => {
      reset();
      cancelAnimationFrame(measureFrame);
      visibility.disconnect();
      resize.disconnect();
      items.forEach((item) => item.removeAttribute("data-scroll-visible"));
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", reset);
      grid.removeEventListener("click", beforeOpen, true);
      preference.removeEventListener("change", reset);
    };
  }, [gridRef, paused, resetKey]);
}
