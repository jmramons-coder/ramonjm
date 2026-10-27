"use client";

import { useCallback, useRef, type RefCallback } from "react";

type ViewportHost = Pick<Window, "innerWidth" | "innerHeight" | "scrollY" | "visualViewport" | "matchMedia" | "getComputedStyle" | "requestAnimationFrame" | "cancelAnimationFrame" | "addEventListener" | "removeEventListener"> & { ResizeObserver?: typeof ResizeObserver };
const PAGE_HEIGHT = "--folder-conversation-page-height";
const MOBILE_QUERY = "(max-width: 800px)";
const observers = new WeakMap<HTMLElement, () => void>();

/**
 * Bound the mobile conversation page to the actual visible viewport. The
 * property belongs to this element, never the document; CSS keeps a dvh
 * fallback. Normal document scrolling cannot make the page grow indefinitely.
 */
export function observeFolderConversationViewport(element: HTMLElement, host: ViewportHost = window): () => void {
  observers.get(element)?.();
  const viewport = host.visualViewport;
  const media = host.matchMedia(MOBILE_QUERY);
  const surface = element.closest(".product-shell") ?? element.ownerDocument;
  const nav = surface.querySelector<HTMLElement>(".mobile-bottom-nav");
  const header = surface.querySelector<HTMLElement>(".mobile-product-header");
  let frame: number | null = null;
  let disposed = false;
  let previousValue = element.style.getPropertyValue(PAGE_HEIGHT);
  let previousPriority = element.style.getPropertyPriority(PAGE_HEIGHT);
  let lastWritten: string | null = null;

  const releaseHeight = () => {
    if (lastWritten !== null && element.style.getPropertyValue(PAGE_HEIGHT) === lastWritten && !element.style.getPropertyPriority(PAGE_HEIGHT)) {
      if (previousValue) element.style.setProperty(PAGE_HEIGHT, previousValue, previousPriority);
      else element.style.removeProperty(PAGE_HEIGHT);
    }
    lastWritten = null;
  };

  const update = () => {
    frame = null;
    if (disposed || observers.get(element) !== stop || element.isConnected === false) return;
    if (!media.matches) { releaseHeight(); return; }
    // Resizing to a magnified viewport would fight native pinch zoom. Keep the
    // last normal layout and resume measuring when the scale returns to one.
    if (viewport && (!Number.isFinite(viewport.scale) || Math.abs(viewport.scale - 1) > 0.01)) return;
    const visibleHeight = viewport && Number.isFinite(viewport.height) && viewport.height > 0 ? viewport.height : host.innerHeight;
    const visibleWidth = viewport && Number.isFinite(viewport.width) && viewport.width > 0 ? viewport.width : host.innerWidth;
    const visibleTop = viewport && Number.isFinite(viewport.offsetTop) ? viewport.offsetTop : 0;
    const visibleLeft = viewport && Number.isFinite(viewport.offsetLeft) ? viewport.offsetLeft : 0;
    const visibleBottom = visibleTop + visibleHeight;
    const mainTop = element.getBoundingClientRect().top + (Number.isFinite(host.scrollY) ? host.scrollY : 0);
    if (!Number.isFinite(visibleBottom) || visibleHeight <= 0 || !Number.isFinite(mainTop)) return;
    let reservedNav = 0;
    if (nav) {
      const bounds = nav.getBoundingClientRect();
      const style = host.getComputedStyle(nav);
      const visible = style.display !== "none" && style.visibility !== "hidden" && style.visibility !== "collapse" && style.opacity !== "0";
      if (visible && [bounds.top, bounds.bottom, bounds.left, bounds.right, bounds.width, bounds.height].every(Number.isFinite)
        && bounds.width > 0 && bounds.height > 0 && bounds.right > visibleLeft && bounds.left < visibleLeft + visibleWidth) {
        reservedNav = Math.max(0, Math.min(bounds.bottom, visibleBottom) - Math.max(bounds.top, visibleTop));
      }
    }
    const value = `${Math.max(0, Math.floor(visibleBottom - Math.max(0, mainTop) - reservedNav))}px`;
    const currentValue = element.style.getPropertyValue(PAGE_HEIGHT);
    const currentPriority = element.style.getPropertyPriority(PAGE_HEIGHT);
    if (lastWritten === null || currentValue !== lastWritten || currentPriority) {
      // If another owner supplied an inline value, preserve it on cleanup.
      previousValue = currentValue;
      previousPriority = currentPriority;
    }
    if (currentValue !== value || currentPriority) element.style.setProperty(PAGE_HEIGHT, value);
    lastWritten = value;
  };
  const schedule = () => {
    if (!disposed && frame === null) frame = host.requestAnimationFrame(update);
  };
  const resizeObserver = host.ResizeObserver ? new host.ResizeObserver(schedule) : null;
  if (nav) resizeObserver?.observe(nav);
  if (header) resizeObserver?.observe(header);

  const stop = () => {
    if (disposed) return;
    disposed = true;
    if (frame !== null) host.cancelAnimationFrame(frame);
    frame = null;
    viewport?.removeEventListener("resize", schedule);
    viewport?.removeEventListener("scroll", schedule);
    media.removeEventListener("change", schedule);
    host.removeEventListener("resize", schedule);
    host.removeEventListener("scroll", schedule);
    resizeObserver?.disconnect();
    if (observers.get(element) === stop) {
      releaseHeight();
      observers.delete(element);
    }
  };
  observers.set(element, stop);
  viewport?.addEventListener("resize", schedule, { passive: true });
  viewport?.addEventListener("scroll", schedule, { passive: true });
  media.addEventListener("change", schedule);
  host.addEventListener("resize", schedule, { passive: true });
  host.addEventListener("scroll", schedule, { passive: true });
  update();
  return stop;
}

/** Stable callback ref also cleans up a replaced page before observing its successor. */
export function useFolderConversationViewport(): RefCallback<HTMLElement> {
  const cleanupRef = useRef<(() => void) | null>(null);
  return useCallback((element: HTMLElement | null) => {
    cleanupRef.current?.();
    cleanupRef.current = element ? observeFolderConversationViewport(element) : null;
  }, []);
}
