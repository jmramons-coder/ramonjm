"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Image from "next/image";

const clients = [
  {
    name: "Equisoft",
    slug: "equisoft",
    logo: "/client-equisoft.svg",
    width: 160,
    height: 40,
  },
  {
    name: "FolksHR",
    slug: "folks",
    logo: "/client-folks.svg",
    width: 77,
    height: 24,
  },
  {
    name: "PetalMD",
    slug: "petalmd",
    logo: "/client-petalmd.svg",
    width: 163,
    height: 72,
  },
  {
    name: "Peak Media",
    slug: "peak-media",
    logo: "/client-peak-media.svg",
    width: 462,
    height: 253,
  },
] as const;

const marqueeCopies = [0, 1, 2, 3, 4, 5] as const;
const autoScrollSpeed = 48;

type DragState = {
  pointerId: number;
  startScrollLeft: number;
  startX: number;
};

function normalizeScrollPosition(
  scroller: HTMLDivElement,
  groupWidth: number,
) {
  if (groupWidth <= 0) return;

  if (scroller.scrollLeft >= groupWidth * 2) {
    scroller.scrollLeft -= groupWidth;
  } else if (scroller.scrollLeft <= groupWidth * 0.25) {
    scroller.scrollLeft += groupWidth;
  }
}

export function ClientMarquee() {
  const [isDragging, setIsDragging] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const groupWidthRef = useRef(0);
  const dragStateRef = useRef<DragState | null>(null);
  const isHoveringRef = useRef(false);
  const isFocusedRef = useRef(false);
  const isInteractingRef = useRef(false);
  const resumeAfterRef = useRef(0);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const firstGroup = scroller.querySelector<HTMLElement>(
      ".client-logo-group",
    );
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let reducedMotion = motionPreference.matches;
    let initialized = false;
    let frame = 0;
    let previousTime = 0;

    const measure = () => {
      const nextWidth = firstGroup?.offsetWidth ?? 0;
      if (nextWidth <= 0) return;

      const previousWidth = groupWidthRef.current;
      groupWidthRef.current = nextWidth;

      if (!initialized) {
        scroller.scrollLeft = reducedMotion ? 0 : nextWidth;
        initialized = true;
      } else if (
        !reducedMotion &&
        previousWidth > 0 &&
        Math.abs(nextWidth - previousWidth) > 1
      ) {
        scroller.scrollLeft =
          (scroller.scrollLeft / previousWidth) * nextWidth;
      }
    };

    const updateMotionPreference = () => {
      reducedMotion = motionPreference.matches;
      scroller.scrollLeft = reducedMotion ? 0 : groupWidthRef.current;
    };

    const advance = (time: number) => {
      if (previousTime === 0) previousTime = time;
      const elapsed = Math.min(time - previousTime, 48);
      previousTime = time;

      if (
        !reducedMotion &&
        !isHoveringRef.current &&
        !isFocusedRef.current &&
        !isInteractingRef.current &&
        time >= resumeAfterRef.current
      ) {
        scroller.scrollLeft += (autoScrollSpeed * elapsed) / 1000;
        normalizeScrollPosition(scroller, groupWidthRef.current);
      }

      frame = window.requestAnimationFrame(advance);
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(scroller);
    if (firstGroup) resizeObserver.observe(firstGroup);
    motionPreference.addEventListener("change", updateMotionPreference);
    measure();
    frame = window.requestAnimationFrame(advance);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      motionPreference.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch" && event.button !== 0) return;

    isInteractingRef.current = true;
    resumeAfterRef.current = Number.POSITIVE_INFINITY;

    if (event.pointerType === "touch") return;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startScrollLeft: event.currentTarget.scrollLeft,
      startX: event.clientX,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const distance = event.clientX - dragState.startX;
    if (Math.abs(distance) > 3) event.preventDefault();
    event.currentTarget.scrollLeft = dragState.startScrollLeft - distance;
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;

    if (
      dragState?.pointerId === event.pointerId &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current = null;
    isInteractingRef.current = false;
    resumeAfterRef.current = performance.now() + 1400;
    setIsDragging(false);
    normalizeScrollPosition(event.currentTarget, groupWidthRef.current);
    event.currentTarget.blur();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const distance = Math.max(160, event.currentTarget.clientWidth * 0.55);
    event.currentTarget.scrollBy({
      behavior: "smooth",
      left: direction * distance,
    });
  };

  return (
    <>
      <ul className="sr-only" aria-label="Client logos">
        {clients.map((client) => (
          <li key={client.slug}>{client.name}</li>
        ))}
      </ul>

      <p className="sr-only" id="client-marquee-help">
        Client logos move automatically when motion is enabled. Drag, swipe, or
        use the left and right arrow keys to browse.
      </p>

      <div className="clients-marquee-shell">
        <div
          className={`clients-marquee${isDragging ? " is-dragging" : ""}`}
          ref={scrollerRef}
          role="region"
          aria-label="Client logo carousel"
          aria-describedby="client-marquee-help"
          tabIndex={0}
          onBlur={() => {
            isFocusedRef.current = false;
            resumeAfterRef.current = performance.now() + 300;
          }}
          onFocus={() => {
            isFocusedRef.current = true;
          }}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => {
            isHoveringRef.current = true;
          }}
          onMouseLeave={() => {
            isHoveringRef.current = false;
            resumeAfterRef.current = performance.now() + 300;
          }}
          onPointerCancel={handlePointerEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
        >
          <div className="clients-track" aria-hidden="true">
            {marqueeCopies.map((copy) => (
              <ul className="client-logo-group" key={copy}>
                {clients.map((client) => (
                  <li className="client-logo-item" key={client.slug}>
                    {client.slug === "peak-media" ? (
                      <span
                        className="client-wordmark client-wordmark--peak-media"
                        aria-hidden="true"
                      >
                        <strong>Peak</strong>
                        <span>Media</span>
                      </span>
                    ) : (
                      <Image
                        className={`client-logo client-logo--${client.slug}`}
                        src={client.logo}
                        alt=""
                        width={client.width}
                        height={client.height}
                        unoptimized
                        draggable={false}
                      />
                    )}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
