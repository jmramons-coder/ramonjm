import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";
import { InteractivePreview } from "../interactive-preview";
import styles from "./patternviewer.module.css";

export const metadata: Metadata = {
  title: "PatternViewer — Ramon JM",
  description:
    "PatternViewer turns large volumes of digital communication into objective timelines, patterns, and clear summary reports.",
  alternates: { canonical: "/patternviewer" },
};

const productSignals = [
  {
    label: "Organize",
    description: "Bring fragmented messages and files into one chronological view.",
  },
  {
    label: "Index",
    description: "Make a large communication history searchable and easier to review.",
  },
  {
    label: "Analyze",
    description: "Surface repeated language, events, and patterns without the noise.",
  },
  {
    label: "Visualize",
    description: "Turn the evidence into timelines and reports people can understand.",
  },
] as const;

export default function PatternViewerProjectPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.backLink} href="/#applications">
          <HugeiconsIcon
            icon={ArrowLeft02Icon}
            size={17}
            strokeWidth={1.8}
          />
          <span>Selected work</span>
        </Link>
        <a
          className={styles.headerLink}
          href="https://patternviewer.ai/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Visit PatternViewer</span>
          <HugeiconsIcon
            icon={ArrowUpRight01Icon}
            size={17}
            strokeWidth={1.8}
          />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </header>

      <section className={styles.hero} aria-labelledby="patternviewer-title">
        <div className={styles.copy}>
          <Image
            className={styles.logo}
            src="/patternviewer/icon.jpg"
            alt="PatternViewer"
            width={192}
            height={192}
            sizes="88px"
            priority
          />
          <p className={styles.eyebrow}>Communication intelligence</p>
          <h1 id="patternviewer-title">
            <span>Make a long story</span>
            <span>legible.</span>
          </h1>
          <p className={styles.summary}>
            PatternViewer turns years of digital communication into objective
            timelines, patterns, and reports—helping people move from a pile
            of messages to a clearer conversation about what happened.
          </p>
          <a
            className={styles.primaryLink}
            href="https://patternviewer.ai/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Visit the product site</span>
            <HugeiconsIcon
              icon={ArrowUpRight01Icon}
              size={17}
              strokeWidth={1.8}
            />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>

        <div className={styles.previewStage}>
          <InteractivePreview
            className={styles.preview}
            src="https://patternviewer.ai/"
            title="Interactive PatternViewer product website preview"
            hostname="patternviewer.ai"
          />
        </div>
      </section>

      <section className={styles.overview} aria-labelledby="patternviewer-overview">
        <div className={styles.overviewCopy}>
          <p>Why it matters</p>
          <h2 id="patternviewer-overview">
            When opinions conflict, the pattern gives people something to work
            from.
          </h2>
        </div>
        <ol className={styles.signalList}>
          {productSignals.map((signal, index) => (
            <li key={signal.label}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{signal.label}</h3>
                <p>{signal.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
