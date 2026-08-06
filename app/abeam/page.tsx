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
        <span className={styles.signature}>Ramon JM</span>
      </header>

      <section className={styles.hero} aria-labelledby="abeam-title">
        <div className={styles.copy}>
          <p className={styles.status}>
            <span aria-hidden="true" />
            Coming soon
          </p>

          <div className={styles.identity}>
            <AbeamVideo className={styles.mark} sizes="88px" />
            <span>
              <strong>aBeam</strong>
              <small>AI copilot for travel advisors</small>
            </span>
          </div>

          <h1 id="abeam-title">
            <span>Every conversation.</span>
            <span>Already organized.</span>
          </h1>

          <p className={styles.description}>
            aBeam listens as each trip takes shape—quietly turning live client
            conversations into structured briefs, timely travel context, and a
            clear follow-up.
          </p>
        </div>

        <div className={styles.visual}>
          <AbeamVideo
            className={styles.motion}
            priority
            sizes="(max-width: 900px) 94vw, 51vw"
          />
        </div>
      </section>
    </main>
  );
}
