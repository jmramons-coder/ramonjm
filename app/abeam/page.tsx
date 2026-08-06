import type { Metadata } from "next";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { AbeamVideo } from "./abeam-video";
import styles from "./abeam.module.css";

export const metadata: Metadata = {
  title: "aBeam — Ramon JM",
  description:
    "aBeam is an AI conversation copilot built specifically for travel advisors.",
  alternates: { canonical: "/abeam" },
};

export default function AbeamProjectPage() {
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
        <p className={styles.status}>
          <span aria-hidden="true" />
          Coming soon
        </p>
      </header>

      <section className={styles.hero} aria-labelledby="abeam-title">
        <div className={styles.visual}>
          <AbeamVideo
            alwaysPlay
            className={styles.motion}
            priority
            sizes="(max-width: 900px) 94vw, 58vw"
          />
        </div>

        <div className={styles.copy}>
          <h1 id="abeam-title">
            <span>Every conversation.</span>
            <span>Already organized.</span>
          </h1>
        </div>
      </section>
    </main>
  );
}
