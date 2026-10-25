"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./mobile-showcase.module.css";
import { NudgePhoneShowcase } from "./nudge-phone-showcase";

type ShowcaseProps = { paused: boolean };

/** A manual play choice may override reduced motion, but never the page pause. */
function useVisibleVideo(paused: boolean) {
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [playChoice, setPlayChoice] = useState<"play" | "pause" | null>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);

    const observer = new IntersectionObserver(
      ([entry]) =>
        setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.2),
      { threshold: [0, 0.2] },
    );
    if (stageRef.current) observer.observe(stageRef.current);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  const shouldPlay =
    visible &&
    pageVisible &&
    !paused &&
    (playChoice === "play" || (!reducedMotion && playChoice !== "pause"));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (shouldPlay) {
      void video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
    return () => video.pause();
  }, [shouldPlay]);

  return {
    stageRef,
    videoRef,
    visible,
    playing,
    failed,
    motionAllowed: !paused && !reducedMotion,
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onError: () => {
      setFailed(true);
      setPlaying(false);
    },
    toggle: () => setPlayChoice(playing ? "pause" : "play"),
  };
}

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 10h10m-5-5 5 5-5 5" />
    </svg>
  );
}

function PlaybackIcon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M6 5h3v10H6zm5 0h3v10h-3z" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="m7 4 9 6-9 6V4Z" />
    </svg>
  );
}

export function NudgeShowcase({ paused }: ShowcaseProps) {
  return <NudgePhoneShowcase paused={paused} />;
}

export function WorldShowcase({ paused }: ShowcaseProps) {
  const id = useId();
  const [reps, setReps] = useState(0);
  const {
    stageRef,
    videoRef,
    visible,
    playing,
    failed,
    motionAllowed,
    onPlay,
    onPause,
    onError,
    toggle,
  } = useVisibleVideo(paused);
  const complete = reps === 5;

  return (
    <article
      className={`${styles.card} ${styles.world}`}
      aria-labelledby={`${id}-title`}
      data-still={!motionAllowed ? "true" : "false"}
    >
      <header className={styles.heading}>
        <Image
          src="/world/app-icon.png"
          alt=""
          width={36}
          height={36}
          unoptimized
        />
        <div>
          <h2 id={`${id}-title`}>PushedWorld</h2>
          <p>Make your next rep an adventure.</p>
        </div>
      </header>

      <div className={styles.worldScene} ref={stageRef}>
        <Image
          src="/showcase/world/path.webp"
          alt=""
          width={960}
          height={1280}
          unoptimized
          loading="eager"
          className={styles.worldPath}
          draggable={false}
        />
        <span className={styles.worldKicker}>Built around movement.</span>
        <div className={styles.prototype}>
          <video
            ref={videoRef}
            poster="/showcase/world/prototype-poster.webp"
            src="/showcase/world/prototype-loop.mp4"
            preload={visible ? "metadata" : "none"}
            muted
            loop
            playsInline
            onPlay={onPlay}
            onPause={onPause}
            onError={onError}
            aria-label="Early PushedWorld prototype recording showing camera pose tracking and a rep counter"
          />
        </div>
        <Image
          src={
            reps % 2 === 1 && !complete
              ? "/showcase/world/buster-low.webp"
              : "/showcase/world/buster-top.webp"
          }
          alt=""
          width={600}
          height={396}
          unoptimized
          loading="eager"
          className={styles.buster}
          draggable={false}
        />
        <div className={`${styles.mediaCaption} ${styles.worldCaption}`}>
          <span>
            {failed
              ? "Early prototype preview"
              : "Early prototype · Real capture"}
          </span>
          <button
            type="button"
            className={styles.playback}
            onClick={toggle}
            disabled={paused || failed}
            aria-label={`${playing ? "Pause" : "Play"} PushedWorld prototype recording`}
            title={paused ? "Resume page motion to play" : undefined}
          >
            <PlaybackIcon playing={playing} />
          </button>
        </div>
      </div>

      <div className={styles.repDemo}>
        <div className={styles.repTop}>
          <div>
            <span className={styles.demoLabel}>Interactive demo</span>
            <p role="status">
              {complete
                ? "Demo complete. Nice work."
                : "Give Buster a little push."}
            </p>
          </div>
          <span className={styles.repCount} aria-hidden="true">
            {reps}
            <small> / 5</small>
          </span>
        </div>
        <progress
          value={reps}
          max={5}
          aria-label={`${reps} of 5 demo reps completed`}
        />
        <div className={styles.repActions}>
          <button
            type="button"
            onClick={() => setReps((value) => Math.min(value + 1, 5))}
            disabled={complete}
          >
            {complete ? "Five demo reps ✓" : "Try one rep"}
            {!complete && <span aria-hidden="true">＋</span>}
          </button>
          <button
            type="button"
            className={styles.reset}
            onClick={() => setReps(0)}
            disabled={reps === 0}
          >
            Reset
          </button>
        </div>
      </div>

      <Link className={styles.projectLink} href="/world">
        Explore PushedWorld <Arrow />
      </Link>
    </article>
  );
}
