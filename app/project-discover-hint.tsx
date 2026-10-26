"use client";

import { useEffect, useId, type RefObject } from "react";
import styles from "./project-discover-hint.module.css";

export function ProjectDiscoverHint({
  elementRef,
  visible,
  paused,
}: {
  elementRef: RefObject<HTMLDivElement | null>;
  visible: boolean;
  paused: boolean;
}) {
  const id = useId();

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !element.isConnected || !element.showPopover) return;

    if (visible) {
      if (!element.matches(":popover-open")) element.showPopover();
    } else if (element.matches(":popover-open")) {
      element.hidePopover();
    }

    return () => {
      if (element.matches(":popover-open")) element.hidePopover();
    };
  }, [elementRef, visible]);

  return (
    <div
      ref={elementRef}
      className={styles.hint}
      popover="manual"
      aria-hidden="true"
      data-paused={paused}
    >
      <div className={styles.art}>
        <span className={styles.caption}>
          <span>Click to</span>
          <span>discover</span>
        </span>
        <svg
          className={styles.loupe}
          viewBox="0 0 56 64"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id={`${id}-rim`}
              x1="8"
              y1="3"
              x2="42"
              y2="44"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#ffe1a2" />
              <stop offset=".4" stopColor="#ffad52" />
              <stop offset="1" stopColor="#e87730" />
            </linearGradient>
            <linearGradient
              id={`${id}-glass`}
              x1="14"
              y1="10"
              x2="32"
              y2="31"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#f1feff" />
              <stop offset="1" stopColor="#91cef0" />
            </linearGradient>
          </defs>
          <path
            d="m35 39 13 15"
            stroke="#763718"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <circle
            cx="23"
            cy="25"
            r="18"
            fill="#aa4d22"
            stroke="#703718"
            strokeWidth="2"
          />
          <path
            d="m35 34 13 15"
            stroke="#f6a346"
            strokeWidth="11"
            strokeLinecap="round"
          />
          <path
            d="m37 35 12 14"
            stroke="#ffd78d"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle
            cx="23"
            cy="21"
            r="18"
            fill={`url(#${id}-rim)`}
            stroke="#873f1d"
            strokeWidth="1.5"
          />
          <circle
            cx="23"
            cy="21"
            r="11"
            fill={`url(#${id}-glass)`}
            stroke="#be662d"
            strokeWidth="1.5"
          />
          <path
            d="M11 15a14 14 0 0 1 18-6"
            stroke="#fff1c7"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M16 18a8 8 0 0 1 5-5"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            opacity=".85"
          />
          <path
            d="M23 16v10m-5-5h10"
            stroke="#ce712f"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
