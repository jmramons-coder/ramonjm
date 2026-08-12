import type { Metadata } from "next";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";
import { InteractivePreview } from "../interactive-preview";
import { SiteHeader } from "../site-header";
import styles from "./equisoft-labs.module.css";

export const metadata: Metadata = {
  title: "Equisoft Lab Decision ROI — Ramon JM",
  description:
    "An insurance-focused Decision ROI Calculator prototype that makes the hidden cost of slow, data-poor decisions easier to understand.",
  alternates: { canonical: "/equisoft-labs" },
};

const decisionInputs = [
  {
    number: "01",
    label: "Annual salary",
    description: "Establishes the value of the time involved in each decision.",
  },
  {
    number: "02",
    label: "Weekly work hours",
    description: "Converts compensation into a practical hourly baseline.",
  },
  {
    number: "03",
    label: "Team size",
    description: "Accounts for the ripple effect across collaborators.",
  },
  {
    number: "04",
    label: "Critical decisions",
    description: "Captures how often consequential choices are made.",
  },
  {
    number: "05",
    label: "Missing-data delays",
    description: "Surfaces how incomplete information slows the work.",
  },
] as const;

const visionPillars = [
  {
    number: "01",
    title: "Research & Development",
    description:
      "Explore how emerging technology and human behaviour can improve decision-making in insurance.",
  },
  {
    number: "02",
    title: "Data Accessibility",
    description:
      "Bring useful information closer to the moment a person needs to act on it.",
  },
  {
    number: "03",
    title: "Industry Innovation",
    description:
      "Turn early concepts into tangible experiments that invite better questions and clearer choices.",
  },
] as const;

function VisitProjectLink({ className }: { className: string }) {
  return (
    <a
      className={className}
      href="https://www.equisoftlabs.com/"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>Explore the prototype</span>
      <HugeiconsIcon
        icon={ArrowUpRight01Icon}
        size={17}
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default function EquisoftLabsProjectPage() {
  return (
    <>
      <SiteHeader backHref="/#applications" />
      <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="equisoft-labs-title">
        <span className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Image
              className={styles.logo}
              src="/equisoft-labs/wordmark.png"
              alt="Equisoft Lab — Decision ROI"
              width={459}
              height={105}
              sizes="(max-width: 700px) 260px, 360px"
              priority
            />
            <p className={styles.eyebrow}>Insurance decision intelligence</p>
            <h1 id="equisoft-labs-title">
              <span>Make the cost of</span>
              <span>indecision visible.</span>
            </h1>
            <p className={styles.summary}>
              Decision ROI is an interactive prototype that models how time,
              team scale, critical choices, and missing information can turn
              decision friction into a measurable business conversation.
            </p>
            <VisitProjectLink className={styles.heroLink} />
          </div>

          <div className={styles.tabletStage}>
            <span className={styles.tabletGlow} aria-hidden="true" />
            <div className={styles.tabletFrame}>
              <span className={styles.tabletCamera} aria-hidden="true" />
              <div className={styles.tabletScreen}>
                <Image
                  className={styles.tabletScreenshot}
                  src="/equisoft-labs/app-screenshot.jpg"
                  alt="Decision ROI app showing a Senior Executive scenario and decision impact calculator"
                  width={1200}
                  height={833}
                  sizes="(max-width: 1060px) 92vw, 50vw"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.livePreview} aria-labelledby="live-preview-title">
        <div className={styles.livePreviewIntro}>
          <p>Try the working prototype</p>
          <h2 id="live-preview-title">Make the cost of delay tangible.</h2>
          <span>
            Interact with the Decision ROI flow as it was designed: start with
            a role, tune the inputs, and see how the story changes.
          </span>
        </div>
        <InteractivePreview
          className={styles.livePreviewFrame}
          src="https://www.equisoftlabs.com/"
          title="Interactive Equisoft Labs Decision ROI prototype"
          hostname="equisoftlabs.com"
        />
      </section>

      <section className={styles.inputsSection} aria-labelledby="inputs-title">
        <div className={styles.sectionIntro}>
          <p>The model</p>
          <h2 id="inputs-title">Five inputs. One clear business case.</h2>
          <span>
            A short guided flow reframes an abstract operational problem in
            terms that an insurance team can discuss, test, and refine.
          </span>
        </div>

        <div className={styles.inputsLayout}>
          <ol className={styles.inputList}>
            {decisionInputs.map((input) => (
              <li key={input.number}>
                <span>{input.number}</span>
                <div>
                  <h3>{input.label}</h3>
                  <p>{input.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className={styles.startVisual}>
            <span className={styles.startGlow} aria-hidden="true" />
            <Image
              src="/equisoft-labs/start.png"
              alt=""
              width={700}
              height={700}
              sizes="(max-width: 900px) 92vw, 42vw"
            />
            <div className={styles.startCaption}>
              <span>Guided by role</span>
              <strong>From assumptions to a shared starting point.</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.vision} aria-labelledby="vision-title">
        <div className={styles.visionInner}>
          <div className={styles.visionCopy}>
            <p>Equisoft Labs vision</p>
            <h2 id="vision-title">R&amp;D for better decisions.</h2>
            <span>
              A mobile-first concept for making intelligence more accessible,
              useful, and human at the point of decision.
            </span>

            <div className={styles.deviceVisual}>
              <span aria-hidden="true" />
              <Image
                src="/equisoft-labs/mobile-vision.png"
                alt="Equisoft Labs mobile-first product vision"
                width={248}
                height={459}
                sizes="(max-width: 700px) 52vw, 248px"
              />
            </div>
          </div>

          <ol className={styles.pillarList}>
            {visionPillars.map((pillar) => (
              <li key={pillar.number}>
                <span>{pillar.number}</span>
                <div>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.closing} aria-labelledby="closing-title">
        <Image
          className={styles.closingLogo}
          src="/equisoft-labs/wordmark.png"
          alt="Equisoft Lab — Decision ROI"
          width={459}
          height={105}
          sizes="(max-width: 700px) 240px, 340px"
        />
        <div className={styles.closingCopy}>
          <p>Interactive prototype</p>
          <h2 id="closing-title">Put a number on what slows decisions down.</h2>
          <VisitProjectLink className={styles.closingLink} />
        </div>
      </section>
      </main>
    </>
  );
}
