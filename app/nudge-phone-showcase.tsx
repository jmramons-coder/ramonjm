"use client";

import { useRef, useState } from "react";
import {
  GrokSafeScenario as PhoneScenario,
  type GrokScenarioHandle,
  type PhoneScenarioMedia,
} from "./grok-safe-scenario";
import { NudgeStoreGallery } from "./nudge-store-gallery";
import { useProjectOpen, useProjectOrigin } from "./project-routes";
import styles from "./grok-safe-showcase.module.css";

const nudgeMedia: PhoneScenarioMedia = {
  name: "Nudge",
  src: "/showcase/nudge/native-flow.mp4",
  poster: "/showcase/nudge/native-poster.webp",
  icon: "/nudge/mark.webp",
  loop: true,
  description: "The native Nudge app showing a household task being created with demonstration household data.",
};

export function NudgePhoneShowcase({ paused }: { paused: boolean }) {
  const [open, setOpen] = useProjectOpen();
  const [position, setPosition] = useState(0);
  const playback = useRef<GrokScenarioHandle>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [origin, setOrigin] = useProjectOrigin(opener);

  function close(time: number) {
    playback.current?.seek(time);
    setOpen(false);
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
  }

  return (
    <>
      <article className={styles.card} aria-label="Nudge" data-open={open}>
        <PhoneScenario
          media={nudgeMedia}
          paused={paused || open}
          hideControls
          playbackRef={playback}
          inspectRef={opener}
          onInspect={(time) => { const rect = opener.current?.parentElement?.getBoundingClientRect(); if (rect) setOrigin({ left: rect.left, top: rect.top, width: rect.width, height: rect.height }); setPosition(time); setOpen(true); }}
        />
      </article>
      {open && origin && <NudgeStoreGallery origin={origin} paused={paused} initialTime={position} opener={opener} onClose={close} />}
    </>
  );
}
