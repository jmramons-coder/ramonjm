"use client";

import { useCallback, useRef } from "react";

type ViewportHost = Pick<Window, "innerWidth" | "innerHeight" | "visualViewport" | "requestAnimationFrame" | "cancelAnimationFrame" | "addEventListener" | "removeEventListener">;

/** Observe actual keyboard resize/pan; the backdrop keeps its full layout height. */
export function observeSearchViewport(element: Pick<HTMLElement, "style">, host: ViewportHost = window, onHeightShrink?: () => void) {
  const viewport = host.visualViewport;
  let frame: number | null = null;
  let previousHeight: number | null = null;
  const update = () => {
    frame = null;
    // Preserve CSS layout during pinch zoom instead of shrinking it to the magnified view.
    if (viewport && viewport.scale > 1) return;
    const dimensions = {
      top: viewport?.offsetTop ?? 0,
      left: viewport?.offsetLeft ?? 0,
      width: viewport?.width || host.innerWidth,
      height: viewport?.height || host.innerHeight,
    };
    for (const [key, value] of Object.entries(dimensions)) {
      if (Number.isFinite(value)) element.style.setProperty(`--search-viewport-${key}`, `${Math.max(0, value)}px`);
    }
    if (Number.isFinite(dimensions.height)) {
      if (previousHeight !== null && dimensions.height < previousHeight) onHeightShrink?.();
      previousHeight = dimensions.height;
    }
  };
  const schedule = () => { if (frame === null) frame = host.requestAnimationFrame(update); };
  update();
  viewport?.addEventListener("resize", schedule, { passive: true });
  viewport?.addEventListener("scroll", schedule, { passive: true });
  host.addEventListener("resize", schedule, { passive: true });
  return () => {
    if (frame !== null) host.cancelAnimationFrame(frame);
    viewport?.removeEventListener("resize", schedule);
    viewport?.removeEventListener("scroll", schedule);
    host.removeEventListener("resize", schedule);
  };
}

/** Keep the typing control above the footer when the keyboard accessory bar grows. */
function keepTypingControlVisible(element: HTMLDivElement) {
  const active = element.ownerDocument.activeElement;
  if (!(active instanceof HTMLElement) || !element.contains(active) || !active.matches("input[data-ui-input], textarea, [role='spinbutton']")) return;
  const body = active.closest<HTMLElement>(".esp-body");
  if (!body || !element.contains(body)) return;
  const control = active.closest<HTMLElement>(".ui-control") ?? active;
  const bounds = body.getBoundingClientRect();
  const target = control.getBoundingClientRect();
  const padding = getComputedStyle(body);
  const top = bounds.top + (Number.parseFloat(padding.scrollPaddingTop) || 0);
  const bottom = bounds.bottom - (Number.parseFloat(padding.scrollPaddingBottom) || 0);
  const delta = target.bottom > bottom ? target.bottom - bottom : target.top < top ? target.top - top : 0;
  if (delta) body.scrollTop = Math.min(Math.max(0, body.scrollTop + delta), Math.max(0, body.scrollHeight - body.clientHeight));
}

/** Callback refs also observe portals that mount after their parent's effects. */
export function useSearchViewport() {
  const cleanupRef = useRef<(() => void) | null>(null);
  return useCallback((element: HTMLDivElement | null) => {
    cleanupRef.current?.();
    cleanupRef.current = element ? observeSearchViewport(element, window, () => keepTypingControlVisible(element)) : null;
  }, []);
}
