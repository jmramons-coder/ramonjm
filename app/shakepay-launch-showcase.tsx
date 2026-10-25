"use client";

import { useRef, useState } from "react";
import {
  GrokSafeScenario as PhoneScenario,
  GrokSafeScenarioDialog as PhoneScenarioDialog,
  type GrokScenarioHandle,
  type PhoneScenarioMedia,
} from "./grok-safe-scenario";
import styles from "./grok-safe-showcase.module.css";

const launchMedia: PhoneScenarioMedia = {
  name: "Shakepay launch",
  src: "/showcase/shakepay/launch.mp4",
  poster: "/showcase/shakepay/launch-poster.webp",
  icon: "/shakepay-icon.png",
  loop: true,
  film: true,
  description: "The complete signed Shakepay launch film for the independent fictional prototype.",
};

export function ShakepayLaunchShowcase({ paused }: { paused: boolean }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(0);
  const playback = useRef<GrokScenarioHandle>(null);
  const opener = useRef<HTMLButtonElement>(null);

  function close(time: number) {
    playback.current?.seek(time);
    setOpen(false);
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
  }

  return (
    <>
      <article className={styles.card} aria-label="Shakepay launch video" data-open={open}>
        <PhoneScenario
          media={launchMedia}
          paused={paused || open}
          hideControls
          playbackRef={playback}
          inspectRef={opener}
          onInspect={(time) => { setPosition(time); setOpen(true); }}
        />
      </article>
      {open && <PhoneScenarioDialog media={launchMedia} paused={paused} initialTime={position} opener={opener} onClose={close} />}
    </>
  );
}
