"use client";

import { useState, type ComponentType } from "react";
import { NudgeShowcase } from "./mobile-showcase";
import { AbeamShowcase } from "./desktop-showcase";
import {
  DecisionShowcase,
} from "./business-showcase";
import {
  BeamIdentityCard,
  LungsArchiveCard,
  NextPlayerCard,
  TracerBrandCard,
  WorldCrewCard,
} from "./editorial-showcase";
import styles from "./project-playground.module.css";
import { GrokSafeShowcase } from "./grok-safe-showcase";

import { NudgeStickers } from "./nudge-stickers";
import { CryptoDesktopShowcase, CryptoArtworkShowcase } from "./crypto-clean-showcase";
import { MidjourneyShowcase } from "./midjourney-showcase";

import { ArceraLoadingShowcase } from "./arcera-loading-showcase";

import { ShakepayCleanShowcase } from "./shakepay-clean-showcase";
import { ShakepayLaunchShowcase } from "./shakepay-launch-showcase";

import { DecisionArtworkShowcase } from "./decision-art-showcase";
import { BusterShowcase } from "./buster-showcase";

import { CaseWorkspaceShowcase } from "./case-workspace-showcase";

type Filter = "all" | "products" | "studio" | "archive";
const pieces: {
  id: string;
  category: Exclude<Filter, "all">;
  component: ComponentType<{ paused: boolean }>;
}[] = [
  { id: "abeam", category: "products", component: AbeamShowcase },
  { id: "nudge-stickers", category: "studio", component: NudgeStickers },
  { id: "nudge", category: "products", component: NudgeShowcase },
  { id: "case-workspace", category: "products", component: CaseWorkspaceShowcase },
  { id: "cryptocroc", category: "products", component: CryptoDesktopShowcase },
  { id: "tracer-brand", category: "studio", component: TracerBrandCard },
  { id: "shakepay", category: "products", component: ShakepayCleanShowcase },
  { id: "decision-art", category: "studio", component: DecisionArtworkShowcase },
  { id: "world", category: "products", component: BusterShowcase },
  { id: "world-crew", category: "studio", component: WorldCrewCard },
  { id: "crypto-brand", category: "studio", component: CryptoArtworkShowcase },
  { id: "decision", category: "products", component: DecisionShowcase },
  { id: "grok-safe", category: "products", component: GrokSafeShowcase },
  { id: "abeam-identity", category: "studio", component: BeamIdentityCard },
  { id: "arcera", category: "products", component: ArceraLoadingShowcase },
  { id: "midjourney", category: "studio", component: MidjourneyShowcase },
  { id: "shakepay-launch", category: "studio", component: ShakepayLaunchShowcase },
  { id: "next-player", category: "archive", component: NextPlayerCard },
  { id: "lungsmaxing", category: "archive", component: LungsArchiveCard },
];
const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All work" },
  { id: "products", label: "Products" },
  { id: "studio", label: "Identity & art" },
  { id: "archive", label: "Archive" },
];

export function ProjectPlayground({ paused }: { paused: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible =
    filter === "all"
      ? pieces
      : pieces.filter((piece) => piece.category === filter);
  return (
    <div className={styles.gallery}>
      <div className={styles.toolbar}>
        <div
          className={styles.filters}
          role="group"
          aria-label="Filter portfolio work"
        >
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              aria-controls="project-playground"
              onClick={() => setFilter(item.id)}
            >
              {item.label}
              <span>
                {item.id === "all"
                  ? pieces.length
                  : pieces.filter((piece) => piece.category === item.id).length}
              </span>
            </button>
          ))}
        </div>
        <span className={styles.srOnly} role="status">
          Showing {visible.length}{" "}
          {filter === "all"
            ? "pieces"
            : filters.find((item) => item.id === filter)?.label.toLowerCase()}
          .
        </span>
      </div>
      <div
        id="project-playground"
        className={styles.playground}
        role="list"
        aria-label="Selected projects and design studies"
      >
        {visible.map(({ id, component: Card }) => (
          <div key={id} data-piece={id} data-filter={filter} className={styles.masonryItem} role="listitem">
            <Card paused={paused} />
          </div>
        ))}
      </div>
    </div>
  );
}
