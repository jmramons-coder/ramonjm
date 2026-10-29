"use client";

import { useLayoutEffect, useRef, useState, type ComponentType } from "react";
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
import { useProjectGridFocus } from "./use-project-grid-focus";
import { TracerWebsiteShowcase } from "./tracer-website-showcase";

type Filter = "all" | "products" | "studio" | "archive";
const pieces: {
  id: string;
  category: Exclude<Filter, "all">;
  component: ComponentType<{ paused: boolean; theme: "light" | "dark" }>;
}[] = [
  { id: "abeam", category: "products", component: AbeamShowcase },
  { id: "nudge-stickers", category: "studio", component: NudgeStickers },
  { id: "nudge", category: "products", component: NudgeShowcase },
  { id: "case-workspace", category: "products", component: CaseWorkspaceShowcase },
  { id: "cryptocroc", category: "products", component: CryptoDesktopShowcase },
  { id: "tracer-brand", category: "studio", component: TracerBrandCard },
  { id: "tracer-website", category: "studio", component: TracerWebsiteShowcase },
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

export function ProjectPlayground({ paused, theme }: { paused: boolean; theme: "light" | "dark" }) {
  const [filter, setFilter] = useState<Filter>("all");
  const playground = useRef<HTMLDivElement>(null);
  const { resetFocus } = useProjectGridFocus(playground);
  const visible =
    filter === "all"
      ? pieces
      : pieces.filter((piece) => piece.category === filter);

  useLayoutEffect(() => {
    const grid = playground.current;
    if (!grid) return;
    const items = Array.from(grid.children) as HTMLDivElement[];
    let frame = 0;

    function measure() {
      if (!grid) return;
      const computed = getComputedStyle(grid);
      const columns = Number(computed.getPropertyValue("--project-columns"));
      if (columns === 1) {
        if (grid.dataset.layout) delete grid.dataset.layout;
        return;
      }
      const gap = Number.parseFloat(computed.columnGap) || 0;
      if (grid.dataset.layout !== "masonry") grid.dataset.layout = "masonry";
      // Used track sizes can be fractional at browser zoom levels such as 90%.
      const rowHeight =
        Number.parseFloat(getComputedStyle(grid).gridTemplateRows) || 1;
      // Measure natural card heights, never the space reserved by grid spans.
      const spans = items.map((item) => {
        const height = Number.parseFloat(
          getComputedStyle(item.firstElementChild!).height,
        );
        return Math.max(1, Math.ceil((height + gap) / rowHeight));
      });
      items.forEach((item, index) => {
        const span = String(spans[index]);
        if (item.style.getPropertyValue("--masonry-span") !== span)
          item.style.setProperty("--masonry-span", span);
      });
    }

    measure();
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    observer.observe(grid);
    items.forEach((item) => observer.observe(item.firstElementChild!));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [filter]);

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
              onClick={() => {
                resetFocus();
                setFilter(item.id);
              }}
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
        ref={playground}
        id="project-playground"
        className={styles.playground}
        role="list"
        aria-label="Selected projects and design studies"
      >
        {visible.map(({ id, component: Card }) => (
          <div key={id} data-piece={id} data-filter={filter} className={styles.masonryItem} role="listitem">
            <div className={styles.tileContent}>
              <Card paused={paused} theme={theme} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
