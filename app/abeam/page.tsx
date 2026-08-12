import type { Metadata } from "next";
import { SiteHeader } from "../site-header";
import { AbeamVideo } from "./abeam-video";
import styles from "./abeam.module.css";

export const metadata: Metadata = {
  title: "aBeam — Ramon JM",
  description:
    "aBeam is an AI conversation copilot for travel advisors that turns client conversations into organized context, preferences, and next steps.",
  alternates: { canonical: "/abeam" },
};

export default function AbeamProjectPage() {
  return (
    <>
      <SiteHeader backHref="/#applications" />
      <main className={styles.page}>
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
          <p className={styles.eyebrow}>AI copilot for travel advisors</p>
          <h1 id="abeam-title">
            <span>Every conversation.</span>
            <span>Already organized.</span>
          </h1>
          <p className={styles.summary}>
            aBeam turns messy client conversations into a clear working memory
            of preferences, context, and next steps—so advisors can spend more
            time shaping the journey and less time reconstructing it.
          </p>
        </div>
        </section>
      </main>
    </>
  );
}
