"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from "react";
import styles from "./case-panel-resize.module.css";

export type CasePanelResizeHandleProps = {
  panelRef: RefObject<HTMLElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
};

type Bounds = { min: number; max: number; mobile: boolean };
type Metrics = Bounds & { width: number };
type InlineStyleValue = { value: string; priority: string };
type DragSession = {
  pointerId: number;
  startX: number;
  startWidth: number;
  originalWidth: InlineStyleValue;
  handle: HTMLDivElement;
  panel: HTMLElement;
  body: HTMLElement;
  originalCursor: InlineStyleValue;
  originalUserSelect: InlineStyleValue;
};

const widthProperty = "--case-panel-width";

function readStyle(element: HTMLElement, name: string): InlineStyleValue {
  return {
    value: element.style.getPropertyValue(name),
    priority: element.style.getPropertyPriority(name),
  };
}

function restoreStyle(element: HTMLElement, name: string, original: InlineStyleValue) {
  if (original.value) element.style.setProperty(name, original.value, original.priority);
  else element.style.removeProperty(name);
}

function boundsFor(container: HTMLElement): Bounds {
  const containerWidth = Math.max(0, container.getBoundingClientRect().width);
  const min = Math.min(320, containerWidth);
  return {
    min,
    max: Math.max(min, Math.min(900, containerWidth - 220)),
    mobile: window.matchMedia("(max-width: 600px)").matches,
  };
}

function clampWidth(width: number, bounds: Bounds) {
  return Math.round(Math.max(bounds.min, Math.min(bounds.max, width)));
}

function releaseSession(session: DragSession, cancel: boolean) {
  if (cancel) restoreStyle(session.panel, widthProperty, session.originalWidth);
  restoreStyle(session.body, "cursor", session.originalCursor);
  restoreStyle(session.body, "user-select", session.originalUserSelect);
  try {
    if (session.handle.hasPointerCapture(session.pointerId)) {
      session.handle.releasePointerCapture(session.pointerId);
    }
  } catch {
    // Capture may already have been released when a panel unmounts.
  }
}

export function CasePanelResizeHandle({
  panelRef,
  containerRef,
}: CasePanelResizeHandleProps) {
  const [metrics, setMetrics] = useState<Metrics>({
    width: 320,
    min: 320,
    max: 900,
    mobile: false,
  });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<DragSession | null>(null);
  const hintId = useId();

  const measure = useCallback(() => {
    const panel = panelRef.current;
    const container = containerRef.current;
    if (!panel || !container) return;
    const bounds = boundsFor(container);
    const customWidth = panel.style.getPropertyValue(widthProperty);

    if (bounds.mobile) {
      const session = dragRef.current;
      if (session) {
        dragRef.current = null;
        releaseSession(session, true);
        setDragging(false);
      }
      panel.style.removeProperty(widthProperty);
    } else if (customWidth) {
      const requestedWidth = Number.parseFloat(customWidth);
      if (Number.isFinite(requestedWidth)) {
        const nextWidth = clampWidth(requestedWidth, bounds);
        if (nextWidth !== requestedWidth) panel.style.setProperty(widthProperty, `${nextWidth}px`);
      }
    }

    const width = Math.round(panel.getBoundingClientRect().width);
    setMetrics((previous) => {
      if (
        previous.width === width &&
        previous.min === bounds.min &&
        previous.max === bounds.max &&
        previous.mobile === bounds.mobile
      ) return previous;
      return { ...bounds, width };
    });
  }, [containerRef, panelRef]);

  const finish = useCallback((cancel = false) => {
    const session = dragRef.current;
    if (!session) return;
    dragRef.current = null;
    releaseSession(session, cancel);
    setDragging(false);
    measure();
  }, [measure]);

  useEffect(() => {
    const panel = panelRef.current;
    const container = containerRef.current;
    if (!panel || !container) return;
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    observer.observe(container);
    const initialMeasure = requestAnimationFrame(measure);

    function cancelOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape" || !dragRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      finish(true);
    }

    window.addEventListener("keydown", cancelOnEscape, true);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(initialMeasure);
      observer.disconnect();
      window.removeEventListener("keydown", cancelOnEscape, true);
      window.removeEventListener("resize", measure);
      const session = dragRef.current;
      if (session) {
        dragRef.current = null;
        releaseSession(session, true);
      }
    };
  }, [containerRef, finish, measure, panelRef]);

  function begin(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !event.isPrimary || dragRef.current) return;
    const panel = panelRef.current;
    const container = containerRef.current;
    if (!panel || !container || boundsFor(container).mobile) return;
    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget;
    handle.focus({ preventScroll: true });
    const body = document.body;
    const session: DragSession = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: panel.getBoundingClientRect().width,
      originalWidth: readStyle(panel, widthProperty),
      handle,
      panel,
      body,
      originalCursor: readStyle(body, "cursor"),
      originalUserSelect: readStyle(body, "user-select"),
    };
    dragRef.current = session;
    try {
      handle.setPointerCapture(event.pointerId);
    } catch {
      dragRef.current = null;
      return;
    }
    body.style.setProperty("cursor", "col-resize", "important");
    body.style.setProperty("user-select", "none", "important");
    setDragging(true);
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const session = dragRef.current;
    const container = containerRef.current;
    if (!session || !container || session.pointerId !== event.pointerId) return;
    event.preventDefault();
    const bounds = boundsFor(container);
    if (bounds.mobile) {
      finish(true);
      session.panel.style.removeProperty(widthProperty);
      return;
    }
    const width = clampWidth(session.startWidth + session.startX - event.clientX, bounds);
    session.panel.style.setProperty(widthProperty, `${width}px`);
    setMetrics({ ...bounds, width });
  }

  function resizeWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const panel = panelRef.current;
    const container = containerRef.current;
    if (!panel || !container) return;
    const bounds = boundsFor(container);
    if (bounds.mobile) return;
    event.preventDefault();
    event.stopPropagation();
    finish(false);
    const currentWidth = panel.getBoundingClientRect().width;
    const requestedWidth = event.key === "Home"
      ? bounds.min
      : event.key === "End"
        ? bounds.max
        : currentWidth + (event.key === "ArrowLeft" ? 24 : -24);
    const width = clampWidth(requestedWidth, bounds);
    panel.style.setProperty(widthProperty, `${width}px`);
    setMetrics({ ...bounds, width });
  }

  function reset() {
    finish(false);
    panelRef.current?.style.removeProperty(widthProperty);
    measure();
  }

  return (
    <div
      className={styles.handle}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize side panel"
      aria-valuemin={metrics.min}
      aria-valuemax={metrics.max}
      aria-valuenow={Math.max(metrics.min, Math.min(metrics.max, metrics.width))}
      aria-valuetext={`${metrics.width} pixels wide`}
      aria-describedby={hintId}
      aria-hidden={metrics.mobile || undefined}
      tabIndex={metrics.mobile ? -1 : 0}
      title="Drag to resize"
      data-dragging={dragging}
      data-mobile={metrics.mobile}
      onPointerDown={begin}
      onPointerMove={move}
      onPointerUp={(event) => {
        if (event.pointerId === dragRef.current?.pointerId) finish(false);
      }}
      onPointerCancel={(event) => {
        if (event.pointerId === dragRef.current?.pointerId) finish(true);
      }}
      onLostPointerCapture={(event) => {
        if (event.pointerId === dragRef.current?.pointerId) finish(false);
      }}
      onKeyDown={resizeWithKeyboard}
      onDoubleClick={reset}
    >
      <span id={hintId} className={styles.srOnly}>
        Drag or use the left and right arrow keys to resize. Home sets the smallest width,
        End sets the largest width. Press Escape to cancel a drag. Double-click to reset.
      </span>
    </div>
  );
}
