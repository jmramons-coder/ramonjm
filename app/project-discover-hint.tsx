"use client";

import { useEffect, type RefObject } from "react";
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
      </div>
    </div>
  );
}
