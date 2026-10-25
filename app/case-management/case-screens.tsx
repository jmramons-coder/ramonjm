"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useId, useState } from "react";
import type { StudioAsset } from "../studio-gallery";
import styles from "./case-screens.module.css";

const StudioGallery = dynamic(() =>
  import("../studio-gallery").then((module) => module.StudioGallery),
);
const screens = [
  {
    label: "The task",
    file: "workspace",
    title: "The unit of work.",
    caption:
      "The task queue stays visible while the selected task exposes its actions, status, assignment and case link.",
    alt: "Actual Case Management task queue with the selected financial-review task open beside it.",
  },
  {
    label: "The case",
    file: "case-overview",
    title: "The unit of context.",
    caption:
      "The related case holds the workflow stages, general information, requirements, documents and activity.",
    alt: "Case Management Platform’s William H. Tower demonstration case with its workflow stages and related tabs.",
  },
  {
    label: "Requirements",
    file: "requirements",
    title: "See the state of the evidence.",
    caption:
      "Requirements bring ordering sources, statuses, dates and review findings into the case workspace.",
    alt: "Actual requirements table for the application’s authored William Tower demonstration case.",
  },
  {
    label: "Galia",
    file: "assistant",
    title: "Keep the question in context.",
    caption:
      "The assistant sits alongside the active work. Case and requirement context can travel into the conversation.",
    alt: "Actual contextual assistant interface beside the Case Management demonstration case.",
  },
  {
    label: "Overview",
    file: "operations-overview",
    title: "From personal work to oversight.",
    caption:
      "The supervisor’s Underwriting Operations dashboard brings team workload, priority work and case progress into a broader operational view.",
    alt: "Actual Case Management Underwriting Operations dashboard, using the application’s demonstration data.",
  },
] as const;

export function CaseScreens() {
  const id = useId();
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const screen = screens[index];
  const assets: StudioAsset[] = [
    screens[index],
    ...screens.filter((_, i) => i !== index),
  ].map((item) => ({
    src: `/case-management-platform/${item.file}.webp`,
    alt: item.alt,
    width: 1600,
    height: 1000,
    caption: `${item.caption} Application capture using demonstration data.`,
  }));
  return (
    <>
      <div className={styles.viewer}>
        <div className={styles.toolbar}>
          <div
            className={styles.choices}
            role="group"
            aria-label="Explore Case Management application screens"
          >
            {screens.map((item, i) => (
              <button
                key={item.file}
                type="button"
                aria-pressed={index === i}
                aria-controls={`${id}-screen`}
                onClick={() => setIndex(i)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            className={styles.inspect}
            type="button"
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
          >
            Inspect screen <span aria-hidden="true">↗</span>
          </button>
        </div>
        <div id={`${id}-screen`} className={styles.screen}>
          <Image
            key={screen.file}
            src={`/case-management-platform/${screen.file}.webp`}
            alt={screen.alt}
            width={1600}
            height={1000}
            sizes="(max-width: 700px) 94vw, 1400px"
            unoptimized
          />
        </div>
        <div className={styles.caption} role="status">
          <div>
            <h3>{screen.title}</h3>
            <p>{screen.caption}</p>
          </div>
          <span>Application capture · Demo data</span>
        </div>
      </div>
      {open && (
        <StudioGallery
          title="Amplify / Inside the workspace"
          description="Captured from the Case Management Platform application. Names, cases and values belong to its authored demonstration data."
          assets={assets}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
