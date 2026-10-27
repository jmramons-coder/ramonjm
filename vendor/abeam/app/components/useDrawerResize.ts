"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";

/** Zero keeps the initial drawer proportional until the advisor chooses a width. */
export const DEFAULT_DRAWER_WIDTH = 0;
const MIN_WIDTH = 360;
const viewportSnapshot = () => window.innerWidth;
const serverSnapshot = () => 0;

/** Pointer capture keeps dragging reliable without per-drag window listeners. */
export function useDrawerResize(preferredWidth: number, onWidthChange: (width: number) => void) {
  const [resizing, setResizing] = useState(false);
  const frameRef = useRef<number | null>(null);
  const ignoreBackdropUntilRef = useRef(0);
  const dragRef = useRef<{ pointerId: number; startX: number; startWidth: number; nextWidth: number; handle: HTMLDivElement; cursor: string; userSelect: string } | null>(null);

  const stopResize = useCallback((releaseCapture = true) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    // A release beyond a width limit can produce a click on the backdrop.
    ignoreBackdropUntilRef.current = performance.now() + 400;
    if (frameRef.current !== null) { cancelAnimationFrame(frameRef.current); frameRef.current = null; }
    if (releaseCapture && drag.handle.hasPointerCapture(drag.pointerId)) drag.handle.releasePointerCapture(drag.pointerId);
    document.body.style.cursor = drag.cursor;
    document.body.style.userSelect = drag.userSelect;
    setResizing(false);
  }, []);

  const subscribeViewport = useCallback((notify: () => void) => {
    const onResize = () => { stopResize(); notify(); };
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("blur", onResize);
    return () => { window.removeEventListener("resize", onResize); window.removeEventListener("blur", onResize); };
  }, [stopResize]);
  const viewportWidth = useSyncExternalStore(subscribeViewport, viewportSnapshot, serverSnapshot);
  const maxWidth = viewportWidth ? Math.max(MIN_WIDTH, viewportWidth - 160) : 960;
  const clamp = (value: number) => Math.round(Math.min(maxWidth, Math.max(MIN_WIDTH, value)));
  const width = clamp(Number.isFinite(preferredWidth) && preferredWidth > 0 ? preferredWidth : (viewportWidth || 1440) / 2);

  useEffect(() => stopResize, [stopResize]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0 || viewportWidth <= 800) return;
    stopResize();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startWidth: width, nextWidth: width, handle: event.currentTarget, cursor: document.body.style.cursor, userSelect: document.body.style.userSelect };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    setResizing(true);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.nextWidth = clamp(drag.startWidth + drag.startX - event.clientX);
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      if (dragRef.current === drag) onWidthChange(drag.nextWidth);
    });
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    onWidthChange(clamp(drag.startWidth + drag.startX - event.clientX));
    // Let the browser release capture after pointerup so its subsequent click
    // stays on the edge (manual release here can retarget it to the backdrop).
    stopResize(false);
  };
  const onPointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) stopResize();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = event.key === "ArrowLeft" ? width + 24 : event.key === "ArrowRight" ? width - 24 : event.key === "Home" ? MIN_WIDTH : event.key === "End" ? maxWidth : null;
    if (next === null) return;
    event.preventDefault();
    onWidthChange(clamp(next));
  };

  return {
    width, minWidth: MIN_WIDTH, maxWidth, resizing, stopResize,
    ignoreBackdropClick: () => Boolean(dragRef.current) || performance.now() < ignoreBackdropUntilRef.current,
    handleProps: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture: onPointerCancel, onKeyDown },
  };
}
