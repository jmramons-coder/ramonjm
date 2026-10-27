"use client";

import { useCallback, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export const DEFAULT_BOOKMARK_RAIL_WIDTH = 330;
const MIN_RAIL_WIDTH = 304;
const MIN_CHAT_WIDTH = 420;
const RAIL_WIDTH_PROPERTY = "--conversation-bookmark-width";

export type BookmarkRailGeometry = { width: number; minWidth: number; maxWidth: number };
export type BookmarkRailMetrics = BookmarkRailGeometry & { preferredWidth: number; resizing: boolean };

/** Use available conversation width, including when a desktop sidebar is expanded. */
export function bookmarkRailGeometry(bodyWidth: number, preferredWidth = DEFAULT_BOOKMARK_RAIL_WIDTH): BookmarkRailGeometry {
  const available = Number.isFinite(bodyWidth) ? Math.max(0, bodyWidth) : 0;
  const maxWidth = Math.floor(Math.max(0, Math.min(available * .45, available - MIN_CHAT_WIDTH)));
  const minWidth = Math.min(MIN_RAIL_WIDTH, maxWidth);
  const preferred = Number.isFinite(preferredWidth) ? preferredWidth : DEFAULT_BOOKMARK_RAIL_WIDTH;
  return { width: Math.round(Math.min(maxWidth, Math.max(minWidth, preferred))), minWidth, maxWidth };
}

type CaptureHandle = Pick<HTMLDivElement, "focus" | "setPointerCapture" | "hasPointerCapture" | "releasePointerCapture">;
type RailNode = Pick<HTMLElement, "closest">;
type ResizeHost = Pick<Window, "requestAnimationFrame" | "cancelAnimationFrame" | "addEventListener" | "removeEventListener" | "document"> & {
  ResizeObserver?: new (callback: () => void) => Pick<ResizeObserver, "observe" | "disconnect">;
};
type Ownership = { token: object; previous: { value: string; priority: string } };
const ownership = new WeakMap<HTMLElement, Ownership>();
type DragStyleOwnership = { token: object; previous: { cursor: string; userSelect: string } };
const dragStyleOwnership = new WeakMap<HTMLElement, DragStyleOwnership>();

export type BookmarkRailResizeController = {
  start: (pointerId: number, clientX: number, handle: CaptureHandle) => void;
  move: (pointerId: number, clientX: number) => void;
  end: (pointerId: number, clientX: number) => void;
  cancel: (pointerId?: number) => void;
  key: (key: string) => boolean;
  dispose: () => void;
};

/** Pointer capture and one owned frame; no document or per-drag window listeners. */
export function attachConversationBookmarkResize(
  rail: RailNode,
  onMetrics: (metrics: BookmarkRailMetrics) => void,
  preferredWidth = DEFAULT_BOOKMARK_RAIL_WIDTH,
  host: ResizeHost = window,
): BookmarkRailResizeController {
  const body = rail.closest(".conversation-body") as HTMLElement | null;
  if (!body) return { start() {}, move() {}, end() {}, cancel() {}, key: () => false, dispose() {} };
  const inherited = ownership.get(body);
  const owned = { token: {}, previous: inherited?.previous ?? { value: body.style.getPropertyValue(RAIL_WIDTH_PROPERTY), priority: body.style.getPropertyPriority(RAIL_WIDTH_PROPERTY) } };
  ownership.set(body, owned);
  let preferred = Number.isFinite(preferredWidth) ? preferredWidth : DEFAULT_BOOKMARK_RAIL_WIDTH;
  let disposed = false;
  let frame: number | null = null;
  let written = "";
  let lastBodyWidth = 0;
  let geometry: BookmarkRailGeometry = { width: DEFAULT_BOOKMARK_RAIL_WIDTH, minWidth: MIN_RAIL_WIDTH, maxWidth: DEFAULT_BOOKMARK_RAIL_WIDTH };
  let drag: { pointerId: number; startX: number; startWidth: number; nextX: number; handle: CaptureHandle; styles: DragStyleOwnership } | null = null;
  const current = () => !disposed && ownership.get(body)?.token === owned.token;
  const publish = () => {
    if (!current()) return;
    const value = `${geometry.width}px`;
    if (written !== value) { body.style.setProperty(RAIL_WIDTH_PROPERTY, value); written = value; }
    onMetrics({ ...geometry, preferredWidth: preferred, resizing: Boolean(drag) });
  };
  const stop = (releaseCapture = true) => {
    const active = drag;
    drag = null;
    if (frame !== null) { host.cancelAnimationFrame(frame); frame = null; }
    if (!active) return;
    if (releaseCapture && active.handle.hasPointerCapture(active.pointerId)) active.handle.releasePointerCapture(active.pointerId);
    const documentBody = host.document.body;
    if (dragStyleOwnership.get(documentBody)?.token === active.styles.token) {
      dragStyleOwnership.delete(documentBody);
      if (documentBody.style.cursor === "col-resize") documentBody.style.cursor = active.styles.previous.cursor;
      if (documentBody.style.userSelect === "none") documentBody.style.userSelect = active.styles.previous.userSelect;
    }
    publish();
  };
  const measure = () => {
    if (!current()) return;
    const bodyWidth = body.getBoundingClientRect().width;
    if (!Number.isFinite(bodyWidth) || bodyWidth <= 0) return;
    if (drag && lastBodyWidth !== bodyWidth) stop();
    lastBodyWidth = bodyWidth;
    if (drag) preferred = drag.startWidth + drag.nextX - drag.startX;
    geometry = bookmarkRailGeometry(bodyWidth, preferred);
    // User choices stay within the current bounds; a viewport remeasure alone
    // preserves the choice so widening the window restores it.
    if (drag) preferred = geometry.width;
    publish();
  };
  const schedule = () => { if (current() && frame === null) frame = host.requestAnimationFrame(() => { frame = null; measure(); }); };
  const onResize = () => { stop(); schedule(); };
  const onBlur = () => stop();
  const observer = host.ResizeObserver ? new host.ResizeObserver(schedule) : null;
  observer?.observe(body, { box: "border-box" });
  host.addEventListener("resize", onResize, { passive: true });
  host.addEventListener("blur", onBlur);
  measure();

  return {
    start(pointerId, clientX, handle) {
      if (!current() || !Number.isFinite(clientX)) return;
      stop();
      measure();
      if (geometry.maxWidth <= geometry.minWidth) return;
      handle.focus({ preventScroll: true });
      handle.setPointerCapture(pointerId);
      const documentBody = host.document.body;
      const styles = { token: {}, previous: dragStyleOwnership.get(documentBody)?.previous ?? { cursor: documentBody.style.cursor, userSelect: documentBody.style.userSelect } };
      dragStyleOwnership.set(documentBody, styles);
      drag = { pointerId, startX: clientX, nextX: clientX, startWidth: geometry.width, handle,
        styles };
      documentBody.style.cursor = "col-resize";
      documentBody.style.userSelect = "none";
      publish();
    },
    move(pointerId, clientX) {
      if (!current() || !drag || drag.pointerId !== pointerId || !Number.isFinite(clientX)) return;
      drag.nextX = clientX;
      schedule();
    },
    end(pointerId, clientX) {
      if (!current() || !drag || drag.pointerId !== pointerId) return;
      if (Number.isFinite(clientX)) drag.nextX = clientX;
      if (frame !== null) { host.cancelAnimationFrame(frame); frame = null; }
      measure();
      // Native pointerup releases capture after the click stays on the edge.
      stop(false);
    },
    cancel(pointerId) { if (pointerId === undefined || drag?.pointerId === pointerId) stop(); },
    key(key) {
      if (!current()) return false;
      measure();
      const next = key === "ArrowLeft" ? geometry.width - 24 : key === "ArrowRight" ? geometry.width + 24 : key === "Home" ? geometry.minWidth : key === "End" ? geometry.maxWidth : null;
      if (next === null) return false;
      stop();
      preferred = bookmarkRailGeometry(lastBodyWidth, next).width;
      geometry = bookmarkRailGeometry(lastBodyWidth, preferred);
      publish();
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      observer?.disconnect();
      host.removeEventListener("resize", onResize);
      host.removeEventListener("blur", onBlur);
      if (ownership.get(body)?.token !== owned.token) return;
      ownership.delete(body);
      if (body.style.getPropertyValue(RAIL_WIDTH_PROPERTY) !== written) return;
      if (owned.previous.value) body.style.setProperty(RAIL_WIDTH_PROPERTY, owned.previous.value, owned.previous.priority);
      else body.style.removeProperty(RAIL_WIDTH_PROPERTY);
    },
  };
}

export function useConversationBookmarkResize(enabled: boolean, scopeKey?: string | number) {
  const [metrics, setMetrics] = useState<BookmarkRailMetrics>({ width: DEFAULT_BOOKMARK_RAIL_WIDTH, minWidth: MIN_RAIL_WIDTH, maxWidth: DEFAULT_BOOKMARK_RAIL_WIDTH, preferredWidth: DEFAULT_BOOKMARK_RAIL_WIDTH, resizing: false });
  const controllerRef = useRef<BookmarkRailResizeController | null>(null);
  const preferredRef = useRef(DEFAULT_BOOKMARK_RAIL_WIDTH);
  const scopeRef = useRef(scopeKey);
  useLayoutEffect(() => () => { controllerRef.current?.dispose(); controllerRef.current = null; }, []);
  // Callback ref ownership resets at an account/entry boundary, while a compact
  // viewport temporarily detaches observation without forgetting the width.
  const railRef = useCallback((element: HTMLElement | null) => {
    controllerRef.current?.dispose();
    controllerRef.current = null;
    if (scopeRef.current !== scopeKey) { scopeRef.current = scopeKey; preferredRef.current = DEFAULT_BOOKMARK_RAIL_WIDTH; }
    if (!element || !enabled) return;
    controllerRef.current = attachConversationBookmarkResize(element, (next) => {
      preferredRef.current = next.preferredWidth;
      setMetrics((previous) => previous.width === next.width && previous.minWidth === next.minWidth && previous.maxWidth === next.maxWidth && previous.resizing === next.resizing && previous.preferredWidth === next.preferredWidth ? previous : next);
    }, preferredRef.current);
  }, [enabled, scopeKey]);
  const onPointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    controllerRef.current?.start(event.pointerId, event.clientX, event.currentTarget);
  }, []);
  const onPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => controllerRef.current?.move(event.pointerId, event.clientX), []);
  const onPointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => controllerRef.current?.end(event.pointerId, event.clientX), []);
  const onPointerCancel = useCallback((event: PointerEvent<HTMLDivElement>) => controllerRef.current?.cancel(event.pointerId), []);
  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => { if (controllerRef.current?.key(event.key)) event.preventDefault(); }, []);
  return { ...metrics, railRef, handleProps: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture: onPointerCancel, onKeyDown } };
}
