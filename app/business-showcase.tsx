"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./business-showcase.module.css";

type ShowcaseProps = { paused: boolean };

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 15 15 5M5 5h10v10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProjectLink({ href, children }: { href: string; children: string }) {
  return (
    <Link className={styles.projectLink} href={href}>
      {children}
      <Arrow />
    </Link>
  );
}

export { DecisionShowcase } from "./decision-art-showcase";

type PlaybackChoice = "auto" | "play" | "pause";

function RewardsLoop({
  paused,
  playback,
  onPlayingChange,
}: ShowcaseProps & {
  playback: PlaybackChoice;
  onPlayingChange: (playing: boolean) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    const sync = () => {
      if (
        inView &&
        !paused &&
        !document.hidden &&
        playback !== "pause" &&
        (playback === "play" || !reduced.matches)
      )
        void element.play().catch(() => undefined);
      else element.pause();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.2 },
    );
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    sync();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      element.pause();
    };
  }, [paused, playback]);
  return (
    <video
      ref={video}
      muted
      loop
      playsInline
      preload="none"
      poster="/showcase/shakepay/rewards.webp"
      aria-label="Silent recording of the fictional native Rewards prototype"
      onPlay={() => onPlayingChange(true)}
      onPause={() => onPlayingChange(false)}
    >
      <source src="/showcase/shakepay/rewards-loop.mp4" type="video/mp4" />
    </video>
  );
}

const shakeScreens = [
  {
    name: "Rewards",
    src: "/showcase/shakepay/rewards.webp",
  },
  {
    name: "Potential",
    src: "/showcase/shakepay/potential.webp",
  },
  {
    name: "Profile",
    src: "/showcase/shakepay/profile.webp",
  },
] as const;

export function ShakepayShowcase({ paused }: ShowcaseProps) {
  const id = useId();
  const [active, setActive] = useState(0);
  const [playback, setPlayback] = useState<PlaybackChoice>("auto");
  const [playing, setPlaying] = useState(false);
  const screen = shakeScreens[active];
  return (
    <article
      className={`${styles.card} ${styles.shakepay}`}
      data-paused={paused}
      aria-labelledby={`${id}-title`}
    >
      <header className={`${styles.heading} ${styles.shakeHeading}`}>
        <div className={styles.shakeIdentity}>
          <Image
            src="/shakepay-icon.png"
            alt=""
            width={36}
            height={36}
            unoptimized
          />
          <h2 id={`${id}-title`}>
            <Link href="/shakepay">Shakepay</Link>
          </h2>
        </div>
        {active === 0 && (
          <button
            type="button"
            className={styles.shakePlayback}
            disabled={paused}
            aria-label={
              paused
                ? "Rewards recording paused with page motion"
                : playing
                  ? "Pause Rewards recording"
                  : "Play Rewards recording"
            }
            title={paused ? "Page motion is paused" : undefined}
            onClick={() => setPlayback(playing ? "pause" : "play")}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              {playing && !paused ? (
                <path d="M5 4h4v12H5zm6 0h4v12h-4z" />
              ) : (
                <path d="m6 3 10 7-10 7V3Z" />
              )}
            </svg>
          </button>
        )}
      </header>
      <div
        className={styles.choices}
        role="group"
        aria-label="Shakepay prototype screens"
      >
        {shakeScreens.map((item, index) => (
          <button
            key={item.name}
            type="button"
            aria-pressed={active === index}
            aria-controls={`${id}-screen`}
            onClick={() => setActive(index)}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className={styles.shakeStage} id={`${id}-screen`}>
        <div className={styles.shakePhone}>
          {active === 0 ? (
            <RewardsLoop
              paused={paused}
              playback={playback}
              onPlayingChange={setPlaying}
            />
          ) : (
            <Image
              src={screen.src}
              alt={`Original fictional ${screen.name.toLowerCase()} screen from the working SwiftUI study`}
              width={600}
              height={1304}
              unoptimized
            />
          )}
        </div>
      </div>
      <p className={styles.shakeDisclosure}>
        Independent study · Fictional data.
        <br />
        Not affiliated with Shakepay.
      </p>
    </article>
  );
}

const cryptoSteps = [
  {
    name: "Holdings",
    src: "/showcase/crypto/holdings.webp",
    alt: "Actual CryptoCroc Holdings screen with its original mascot and empty wallet organizer",
  },
  {
    name: "People",
    src: "/showcase/crypto/beneficiaries.webp",
    alt: "Actual CryptoCroc beneficiary screen with empty name, relationship and experience fields",
  },
  {
    name: "Practice",
    src: "/showcase/crypto/practice.webp",
    alt: "Actual CryptoCroc practice workflow with an illustrated guide and a rehearsal checklist",
  },
] as const;

export function CryptoShowcase({ paused }: ShowcaseProps) {
  const id = useId();
  const [planner, setPlanner] = useState(false);
  const [step, setStep] = useState(0);
  return (
    <article
      className={`${styles.card} ${styles.crypto}`}
      data-paused={paused}
      aria-labelledby={`${id}-title`}
    >
      <header className={styles.heading}>
        <div>
          <p>A digital legacy, made tangible</p>
          <h2 id={`${id}-title`}>CryptoCroc</h2>
        </div>
        <Image
          src="/crypto-inheritance/logo.png"
          alt=""
          width={48}
          height={48}
          unoptimized
        />
      </header>
      <div
        className={styles.choices}
        role="group"
        aria-label="CryptoCroc views"
      >
        <button
          type="button"
          aria-pressed={!planner}
          aria-controls={`${id}-stage`}
          onClick={() => setPlanner(false)}
        >
          The character
        </button>
        <button
          type="button"
          aria-pressed={planner}
          aria-controls={`${id}-stage`}
          onClick={() => setPlanner(true)}
        >
          Inside the planner
        </button>
      </div>
      <div
        className={`${styles.cryptoStage} ${planner ? styles.plannerStage : ""}`}
        id={`${id}-stage`}
      >
        {planner ? (
          <div className={styles.cryptoBrowser}>
            <div className={styles.browserBar} aria-hidden="true">
              <i />
              <i />
              <i />
              <span>CryptoCroc / {cryptoSteps[step].name}</span>
            </div>
            <Image
              src={cryptoSteps[step].src}
              alt={cryptoSteps[step].alt}
              width={1100}
              height={820}
              unoptimized
            />
          </div>
        ) : (
          <Image
            className={styles.treasure}
            src="/showcase/crypto/treasure.webp"
            alt="Original CryptoCroc character with a locked treasure chest and a Bitcoin coin"
            width={800}
            height={800}
            unoptimized
          />
        )}
      </div>
      {planner ? (
        <div
          className={styles.stepPicker}
          role="group"
          aria-label="Original planner workflow"
        >
          {cryptoSteps.map((item, index) => (
            <button
              key={item.name}
              type="button"
              aria-pressed={step === index}
              aria-controls={`${id}-stage`}
              onClick={() => setStep(index)}
            >
              <span>0{index + 1}</span>
              {item.name}
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.cryptoStatement}>
          <p>
            Prepare the people.
            <br />
            <strong>Keep the secrets offline.</strong>
          </p>
          <Image
            src="/crypto-inheritance/skull.png"
            alt=""
            width={52}
            height={52}
            unoptimized
          />
        </div>
      )}
      <p className={styles.disclosure}>
        {planner
          ? "Actual app captures · Empty example flow."
          : "Original character system & working micro-app."}
        <br />
        The preview does not collect wallet data.
      </p>
      <ProjectLink href="/crypto-inheritance">Explore CryptoCroc</ProjectLink>
    </article>
  );
}
