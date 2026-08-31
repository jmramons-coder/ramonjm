"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./world.module.css";

const variations = [
  {
    key: "standard",
    tab: "Standard",
    kicker: "Foundation",
    title: "Standard push-up",
    description:
      "Hands near shoulder width. Keep your body long and lower with control.",
    cues: ["Shoulders over wrists", "Elbows travel back", "Move as one line"],
  },
  {
    key: "wide",
    tab: "Wide",
    kicker: "Chest focus",
    title: "Wide push-up",
    description:
      "Place your hands wider than your shoulders while keeping your trunk controlled.",
    cues: [
      "Hands outside shoulders",
      "Keep palms planted",
      "Avoid dropping the hips",
    ],
  },
  {
    key: "close-grip",
    tab: "Close-grip",
    kicker: "Control",
    title: "Close-grip push-up",
    description:
      "Bring your hands in and keep the elbows travelling close to your sides.",
    cues: [
      "Hands inside shoulder width",
      "Elbows stay close",
      "Press evenly through both palms",
    ],
  },
  {
    key: "diamond",
    tab: "Diamond",
    kicker: "Advanced control",
    title: "Diamond push-up",
    description:
      "Bring the hands together beneath your chest and move through a range you control.",
    cues: [
      "Hands form a diamond",
      "Brace before descending",
      "Use a comfortable depth",
    ],
  },
] as const;

const poses = [
  { key: "top", label: "Top", detail: "Strong plank" },
  { key: "middle", label: "Middle", detail: "Control" },
  { key: "bottom", label: "Bottom", detail: "Own the depth" },
] as const;

type VariationKey = (typeof variations)[number]["key"];
type PoseKey = (typeof poses)[number]["key"];

export function FormGuide() {
  const tabPrefix = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [variation, setVariation] = useState<VariationKey>("standard");
  const [pose, setPose] = useState<PoseKey>("top");
  const [poseLocked, setPoseLocked] = useState(false);
  const current =
    variations.find((item) => item.key === variation) ?? variations[0];

  useEffect(() => {
    const root = rootRef.current;
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    if (poseLocked || motionPreference.matches) {
      return;
    }

    const order: PoseKey[] = ["top", "middle", "bottom"];
    let isVisible = true;
    const tick = () => {
      if (!isVisible || document.hidden) {
        return;
      }
      setPose((currentPose) => {
        const index = order.indexOf(currentPose);
        return order[(index + 1) % order.length];
      });
    };
    const timer = window.setInterval(tick, 1600);
    const observer = root
      ? new IntersectionObserver(
          ([entry]) => {
            isVisible = entry.isIntersecting;
          },
          { threshold: 0.2 },
        )
      : null;
    if (root && observer) {
      observer.observe(root);
    }

    return () => {
      window.clearInterval(timer);
      observer?.disconnect();
    };
  }, [poseLocked]);

  return (
    <div className={styles.formGuide} ref={rootRef}>
      <div className={styles.formTabs} role="tablist" aria-label="Push-up variation">
        {variations.map((item) => {
          const selected = item.key === variation;
          return (
            <button
              id={`${tabPrefix}-${item.key}`}
              key={item.key}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${tabPrefix}-panel`}
              tabIndex={selected ? 0 : -1}
              className={selected ? styles.formTabActive : undefined}
              onClick={() => setVariation(item.key)}
            >
              {item.tab}
            </button>
          );
        })}
      </div>

      <div
        id={`${tabPrefix}-panel`}
        className={styles.formPanel}
        role="tabpanel"
        aria-labelledby={`${tabPrefix}-${current.key}`}
      >
        <div
          className={styles.formStage}
          data-grip={current.key}
          data-pose={pose}
          aria-hidden="true"
        >
          <span className={styles.formSky} />
          <span className={styles.formFloor} />
          <span className={styles.formHead} />
          <span className={styles.formBody} />
          <span className={`${styles.formHand} ${styles.formHandLeft}`} />
          <span className={`${styles.formHand} ${styles.formHandRight}`} />
          <span className={styles.formPoseChip}>
            {poses.find((item) => item.key === pose)?.detail}
          </span>
        </div>

        <div className={styles.formCopy}>
          <span>{current.kicker}</span>
          <h3>{current.title}</h3>
          <p>{current.description}</p>
          <ul>
            {current.cues.map((cue) => (
              <li key={cue}>{cue}</li>
            ))}
          </ul>
          <div className={styles.formPoses} role="group" aria-label="Form positions">
            {poses.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-pressed={item.key === pose}
                onClick={() => {
                  setPose(item.key);
                  setPoseLocked(true);
                }}
              >
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className={styles.formNote}>
        Move with control. Stop if you feel sharp pain. Guidance is instructional,
        not medical advice.
      </p>
    </div>
  );
}
