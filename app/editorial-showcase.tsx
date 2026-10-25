"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import ShaderOrb from "./abeam/shader-orb";
import { LungsShowcase } from "./lungs-showcase";
import { StudioGallery, type StudioAsset } from "./studio-gallery";
import { TracerGlassShowcase } from "./tracer-glass-showcase";
import { WorldStoreShowcase } from "./world-store-showcase";
import styles from "./editorial-showcase.module.css";
import { NextPlayerShowcase } from "./next-player-showcase";

const editorial = "/showcase/editorial/";
const art = (
  name: string,
  alt: string,
  width: number,
  height: number,
  caption: string,
): StudioAsset => ({
  src: `${editorial}${name}.webp`,
  alt,
  width,
  height,
  caption,
});
const nudgeStudio: StudioAsset[] = [
  {
    src: "/showcase/nudge/ipad-scene.webp",
    alt: "Nudge’s dimensional everyday objects and tablet campaign scene",
    width: 1200,
    height: 900,
    caption:
      "Original campaign artwork. An illustrated scene, rather than an app capture.",
  },
  art(
    "nudge-voice-campaign",
    "Nudge voice capture campaign panel",
    660,
    1434,
    "Original App Store campaign: turning a thought into a task.",
  ),
  art(
    "nudge-upcoming-campaign",
    "Nudge upcoming tasks campaign panel",
    660,
    1434,
    "Original App Store campaign: the shared household view.",
  ),
];
const cryptoBrand: StudioAsset[] = [
  {
    src: "/showcase/crypto/hang-glider.webp",
    alt: "CryptoCroc’s gliding crocodile brand illustration",
    width: 800,
    height: 1200,
    caption:
      "Original CryptoCroc character artwork recovered from the product source.",
  },
  {
    src: "/showcase/crypto/treasure.webp",
    alt: "CryptoCroc’s treasure illustration",
    width: 800,
    height: 800,
    caption: "Original illustration from the same brand library.",
  },
  {
    src: "/showcase/crypto/brand-poster.webp",
    alt: "CryptoCroc original brand poster",
    width: 1200,
    height: 630,
    caption: "The source product’s brand poster.",
  },
];

/** Ambient layers pause when they are not being seen. User controls remain available. */
function useAmbient(paused: boolean) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const update = () =>
      node.style.setProperty(
        "--ambient-state",
        visible && !paused && !motion.matches && !document.hidden
          ? "running"
          : "paused",
      );
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(node);
    motion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [paused]);
  return ref;
}

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 15 15 5M5 5h10v10" />
    </svg>
  );
}

function ArtCard({
  name,
  detail,
  label,
  kind,
  height,
  assets,
  href,
  paused,
  children,
}: {
  name: string;
  detail: string;
  label: string;
  kind: string;
  height: number;
  assets: readonly StudioAsset[];
  href?: string;
  paused: boolean;
  children: ReactNode;
}) {
  const id = useId();
  const ref = useAmbient(paused);
  const [open, setOpen] = useState(false);
  return (
    <>
      <article
        ref={ref}
        className={`${styles.card} ${styles[kind]}`}
        style={{ "--art-height": `${height}px` } as CSSProperties}
        aria-labelledby={`${id}-title`}
        data-paused={paused}
      >
        <button
          type="button"
          className={styles.artButton}
          onClick={() => setOpen(true)}
          aria-label={`Explore ${name}: ${detail}`}
          aria-haspopup="dialog"
          onPointerMove={(event) => {
            if (
              event.pointerType !== "mouse" ||
              paused ||
              window.matchMedia("(prefers-reduced-motion: reduce)").matches
            )
              return;
            const r = event.currentTarget.getBoundingClientRect();
            event.currentTarget.style.setProperty(
              "--light-x",
              `${((event.clientX - r.left) / r.width) * 100}%`,
            );
            event.currentTarget.style.setProperty(
              "--light-y",
              `${((event.clientY - r.top) / r.height) * 100}%`,
            );
          }}
        >
          {children}
          <span className={styles.light} aria-hidden="true" />
          <span className={styles.openHint} aria-hidden="true">
            View gallery <Arrow />
          </span>
        </button>
        <span className={styles.topLabel}>{label}</span>
        <div className={styles.caption}>
          <div>
            <h2 id={`${id}-title`}>{name}</h2>
            <p>{detail}</p>
          </div>
          <Arrow />
        </div>
      </article>
      {open && (
        <StudioGallery
          title={`${name} / ${detail}`}
          description={label}
          assets={assets}
          href={href}
          paused={paused}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

export function TracerBrandCard({ paused }: { paused: boolean }) {
  return <TracerGlassShowcase paused={paused} />;
}


export function NudgeStudioCard({ paused }: { paused: boolean }) {
  return (
    <ArtCard
      name="Nudge"
      detail="Made for everyday life"
      label="Art direction & campaign"
      kind="nudgeStudio"
      height={420}
      assets={nudgeStudio}
      href="/nudge"
      paused={paused}
    >
      <span className={styles.studioTitle}>
        Little things.
        <br />
        Lighter days.
      </span>
      <Image
        className={styles.ipadScene}
        src="/showcase/nudge/ipad-scene.webp"
        alt=""
        width={1200}
        height={900}
        unoptimized
        loading="lazy"
      />
      <span className={styles.studioRing} aria-hidden="true" />
    </ArtCard>
  );
}

export function WorldCrewCard({ paused }: { paused: boolean }) {
  return <WorldStoreShowcase paused={paused} />;
}

export function CryptoAdventureCard({ paused }: { paused: boolean }) {
  return (
    <ArtCard
      name="CryptoCroc"
      detail="A friend for a serious subject"
      label="Character & visual identity"
      kind="cryptoAdventure"
      height={480}
      assets={cryptoBrand}
      href="/crypto-inheritance"
      paused={paused}
    >
      <span className={styles.adventureSun} aria-hidden="true" />
      <span className={styles.adventureCloud} aria-hidden="true" />
      <Image
        className={styles.glider}
        src="/showcase/crypto/hang-glider.webp"
        alt=""
        width={800}
        height={1200}
        unoptimized
        loading="lazy"
      />
    </ArtCard>
  );
}

export function NextPlayerCard({ paused }: { paused: boolean }) {
  return <NextPlayerShowcase paused={paused} />;
}

export function LungsArchiveCard({ paused }: { paused: boolean }) {
  return <LungsShowcase paused={paused} />;
}

export function BeamIdentityCard({ paused }: { paused: boolean }) {
  const id = useId();
  const ref = useAmbient(paused);
  return (
    <article
      ref={ref}
      className={`${styles.card} ${styles.beamIdentity}`}
      style={{ "--art-height": "350px" } as CSSProperties}
      aria-labelledby={`${id}-title`}
      data-paused={paused}
    >
      <div className={styles.identityLink}>
        <div className={styles.identityOrb} aria-hidden="true">
          <ShaderOrb tone="blue" animated={!paused} edge="smooth" />
        </div>
        <h2 id={`${id}-title`}>aBeam</h2>
      </div>
    </article>
  );
}
