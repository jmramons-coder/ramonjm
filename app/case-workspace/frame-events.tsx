"use client";

import { useEffect } from "react";

export function useCaseFrameEvents(onPause?: (paused: boolean) => void) {
  useEffect(() => {
    if (window.parent === window) return;
    function message(event: MessageEvent) {
      if (event.source !== window.parent || event.origin !== window.location.origin) return;
      if (event.data?.type === "case-study:visibility" && typeof event.data.paused === "boolean") onPause?.(event.data.paused);
    }
    function key(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented || document.querySelector("dialog[open], :popover-open")) return;
      event.preventDefault();
      window.parent.postMessage({ type: "case-study:close" }, window.location.origin);
    }
    window.addEventListener("message", message);
    window.addEventListener("keydown", key);
    window.parent.postMessage({ type: "case-study:ready" }, window.location.origin);
    return () => {
      window.removeEventListener("message", message);
      window.removeEventListener("keydown", key);
    };
  }, [onPause]);
}

export function CaseFrameEvents() {
  useCaseFrameEvents();
  return null;
}
