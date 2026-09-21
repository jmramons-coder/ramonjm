"use client";

import { useEffect } from "react";

/** Keep the browser canvas stable instead of recoloring it at scroll thresholds. */
export function ScrollBackground() {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousRoot = root.style.background;
    const previousBody = body.style.background;
    root.style.background = "#fff";
    body.style.background = "#fff";
    return () => {
      root.style.background = previousRoot;
      body.style.background = previousBody;
    };
  }, []);
  return null;
}
