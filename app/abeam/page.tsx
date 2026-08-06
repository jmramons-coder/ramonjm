import type { Metadata } from "next";
import Image from "next/image";
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
      <div className={styles.ambient} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

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
            <span className={styles.mark} aria-hidden="true">
              <Image
                src="/abeam/mark.png"
                alt=""
                fill
                sizes="64px"
                priority
              />
            </span>
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
          <span className={styles.halo} aria-hidden="true" />
          <AbeamVideo
            className={styles.motion}
            priority
            showControl
            sizes="(max-width: 800px) 82vw, 46vw"
          />
          <span className={styles.shadow} aria-hidden="true" />
        </div>
      </section>
    </main>
  );
}
