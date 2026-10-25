"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
  type RefObject,
} from "react";
import styles from "./grok-safe-showcase.module.css";

export type GrokScenarioHandle = {
  getTime: () => number;
  seek: (position: number) => void;
};

export type PhoneScenarioMedia = {
  name: string;
  src: string;
  poster: string;
  description: string;
  icon?: string;
  loop?: boolean;
  film?: boolean;
};

const grokMedia: PhoneScenarioMedia = {
  name: "Grok Safe",
  icon: "/showcase/grok-safe/mark.svg",
  src: "/showcase/grok-safe/scenario.mp4",
  poster: "/showcase/grok-safe/scenario-poster.webp",
  description: "A complete recording of the independent native concept, from the original conversation through the shield scan, safety review, link evidence and automatic-protection replay. All analysis is simulated. No X/xAI affiliation.",
};

function clock(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function GrokSafeScenario({
  paused = false,
  expanded = false,
  initialTime = 0,
  playbackRef,
  onInspect,
  inspectRef,
  phoneRef,
  media = grokMedia,
  hideControls = false,
}: {
  paused?: boolean;
  expanded?: boolean;
  initialTime?: number;
  playbackRef?: Ref<GrokScenarioHandle>;
  onInspect?: (position: number) => void;
  inspectRef?: RefObject<HTMLButtonElement | null>;
  phoneRef?: RefObject<HTMLDivElement | null>;
  media?: PhoneScenarioMedia;
  hideControls?: boolean;
}) {
  const id = useId();
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  useImperativeHandle(
    playbackRef,
    () => ({
      getTime: () =>
        video.current && video.current.readyState >= 1
          ? video.current.currentTime
          : initialTime,
      seek: (position) => {
        if (video.current) video.current.currentTime = position;
      },
    }),
    [initialTime],
  );
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [choice, setChoice] = useState<"play" | "pause" | null>(
    expanded ? "play" : null,
  );
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

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
    if (stage.current) observer.observe(stage.current);
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
    !ended &&
    !failed &&
    (choice === "play" || (!reducedMotion && choice !== "pause"));

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (shouldPlay) void element.play().catch(() => setPlaying(false));
    else element.pause();
    return () => element.pause();
  }, [shouldPlay]);

  function restart() {
    const element = video.current;
    if (!element) return;
    element.currentTime = 0;
    setTime(0);
    setEnded(false);
    setChoice("play");
    if (!paused && visible && pageVisible)
      void element.play().catch(() => setPlaying(false));
  }

  function togglePlayback() {
    if (playing) setChoice("pause");
    else if (ended) restart();
    else {
      setChoice("play");
      if (!paused && visible && pageVisible)
        void video.current?.play().catch(() => setPlaying(false));
    }
  }

  return (
    <div className={styles.scenario} data-expanded={expanded} data-film={media.film}>
      <div className={styles.preview} ref={stage}>
        <div className={styles.phone} ref={phoneRef}>
          <video
            ref={video}
            src={media.src}
            poster={media.poster}
            preload={visible || expanded ? "metadata" : "none"}
            muted
            playsInline
            loop={media.loop}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => {
              setPlaying(false);
              setEnded(true);
            }}
            onError={() => {
              setFailed(true);
              setPlaying(false);
            }}
            onLoadedMetadata={(event) => {
              const length = event.currentTarget.duration;
              if (Number.isFinite(length)) {
                setDuration(length);
                if (initialTime > 0) {
                  const position = Math.min(initialTime, length);
                  event.currentTarget.currentTime = position;
                  setTime(position);
                }
              }
            }}
            onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
            onSeeked={(event) => {
              setTime(event.currentTarget.currentTime);
              setEnded(event.currentTarget.ended);
            }}
            aria-label={`${media.name} native app walkthrough`}
            aria-describedby={`${id}-description`}
          />
        {onInspect && (
          <button
            ref={inspectRef}
            className={styles.inspectTrigger}
            type="button"
            aria-label={`Expand ${media.name} scenario`}
            aria-haspopup="dialog"
            onClick={() => onInspect(video.current?.currentTime ?? 0)}
          >
          </button>
        )}
        </div>
      </div>
      {!hideControls && <div className={styles.scenarioControls}>
        <div className={styles.controlRow}>
          <button
            className={styles.playback}
            type="button"
            onClick={togglePlayback}
            disabled={paused || failed}
            aria-label={`${playing ? "Pause" : "Play"} ${media.name} scenario`}
            title={paused ? "Resume page motion to play" : undefined}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                d={playing ? "M6 5h3v10H6zm5 0h3v10h-3z" : "m7 4 9 6-9 6V4Z"}
              />
            </svg>
          </button>
          <button
            className={styles.restart}
            type="button"
            onClick={restart}
            disabled={paused || failed}
            title={paused ? "Resume page motion to restart" : undefined}
            aria-label={media.name === "Grok Safe" ? "Restart scenario" : `Restart ${media.name} scenario`}
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 8a6.2 6.2 0 1 1 .3 4M4 3v5h5" />
            </svg>
          </button>
          <span className={styles.time} aria-hidden="true">
            {clock(time)} / {duration ? clock(duration) : "—:—"}
          </span>
        </div>
        <label className={styles.srOnly} htmlFor={`${id}-timeline`}>
          Seek {media.name} scenario
        </label>
        <input
          id={`${id}-timeline`}
          className={styles.timeline}
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={Math.min(time, duration || 1)}
          disabled={!duration || failed}
          aria-valuetext={`${clock(time)} of ${clock(duration)}`}
          onChange={(event) => {
            const position = Number(event.target.value);
            if (video.current) video.current.currentTime = position;
            setTime(position);
            setEnded(position >= duration);
          }}
        />
        {failed && (
          <p className={styles.mediaError} role="status">
            The scenario could not load. Refresh to try again.
          </p>
        )}
      </div>}
      <p id={`${id}-description`} className={styles.srOnly}>{media.description}</p>
    </div>
  );
}

export function GrokSafeScenarioDialog({
  onClose,
  paused = false,
  initialTime = 0,
  opener,
  media = grokMedia,
}: {
  onClose: (position: number) => void;
  paused?: boolean;
  initialTime?: number;
  opener?: RefObject<HTMLButtonElement | null>;
  media?: PhoneScenarioMedia;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<GrokScenarioHandle>(null);
  const phone = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const closing = useRef(false);
  const id = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const origin = opener?.current?.parentElement?.getBoundingClientRect();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    if (origin && phone.current && !paused && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const target = phone.current.getBoundingClientRect();
      animation.current = phone.current.animate([
        { transform: `translate(${origin.left - target.left}px, ${origin.top - target.top}px) scale(${origin.width / target.width}, ${origin.height / target.height})` },
        { transform: "none" },
      ], { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" });
    }
    return () => {
      animation.current?.cancel();
      element.close();
      document.body.style.overflow = overflow;
    };
  }, [opener, paused]);

  async function close() {
    if (closing.current) return;
    closing.current = true;
    const destination = opener?.current?.parentElement?.getBoundingClientRect();
    if (destination && phone.current && !paused && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animation.current?.cancel();
      const source = phone.current.getBoundingClientRect();
      animation.current = phone.current.animate([
        { transform: "none" },
        { transform: `translate(${destination.left - source.left}px, ${destination.top - source.top}px) scale(${destination.width / source.width}, ${destination.height / source.height})` },
      ], { duration: 320, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
      await animation.current.finished.catch(() => {});
    }
    dialog.current?.close();
    onClose(video.current?.getTime() ?? initialTime);
  }

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      data-grok-concept={media.name === "Grok Safe" || undefined}
      aria-label={`${media.name} scenario`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => {
        event.preventDefault();
        void close();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        void close();
      }}
    >
      <p className={styles.srOnly} id={`${id}-description`}>{media.description}</p>
      {media.icon && <div className={styles.floatingBrand}>
        <Image src={media.icon} alt="" width={34} height={34} unoptimized />
        <h2>{media.name}</h2>
      </div>}
      {media.name === "Grok Safe" && <aside className={styles.conceptBanner}>
        <span className={styles.conceptTag}>Independent concept · X / xAI</span>
        <p>Exploring Grok-powered protection against scams in messages from new contacts on X.</p>
      </aside>}
        <button
          className={styles.close}
          type="button"
          onClick={() => void close()}
          aria-label={`Close ${media.name} scenario`}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      <GrokSafeScenario
        expanded
        paused={paused}
        initialTime={initialTime}
        playbackRef={video}
        phoneRef={phone}
        media={media}
      />
    </dialog>
  );
}
