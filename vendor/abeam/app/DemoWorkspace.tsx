"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { installDemoServices, resetDemoWorkspace } from "@/demo/services";
import { TravelWorkspace } from "./travel-workspace";
import "./demo.css";

/** The original workspace, with the public portfolio's isolated service adapter. */
export default function DemoWorkspace() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    installDemoServices();
    setMounted(true);
    window.parent.postMessage({ type: "abeam-demo:ready" }, window.location.origin);
    function receive(event: MessageEvent) {
      if (event.source !== window.parent || event.origin !== window.location.origin) return;
      if (event.data?.type === "abeam-demo:visibility") {
        document.body.dataset.demoPaused = String(Boolean(event.data.paused));
      }
      if (event.data?.type === "abeam-demo:reset") {
        // Unmount native writers before replacing the visitor's local records.
        flushSync(() => setMounted(false));
        resetDemoWorkspace();
        setMounted(true);
      }
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const popover = Array.from(document.querySelectorAll('dialog[open], [role="dialog"], [role="listbox"]'))
        .some((node) => node.getBoundingClientRect().height > 0);
      if (popover) return;
      window.parent.postMessage({ type: "abeam-demo:close" }, window.location.origin);
    }
    window.addEventListener("message", receive);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("message", receive);
      window.removeEventListener("keydown", escape);
    };
  }, []);

  return mounted ? <TravelWorkspace /> : <div className="demo-loading" role="status">Opening aBeam…</div>;
}
