import type { Metadata } from "next";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";
import { SiteHeader } from "../site-header";
import styles from "./equisoft.module.css";

export const metadata: Metadata = {
  title: "Equisoft — Confidential enterprise practice — Ramon JM",
  description:
    "A public, sanitized view of José Manuel Ramon's product design practice across complex insurance and financial software at Equisoft.",
  alternates: { canonical: "/equisoft" },
};

const domains = [
  {
    label: "Systems",
    title: "Policy administration",
    description:
      "Making dense insurance operations easier to understand, configure, and move through.",
  },
  {
    label: "Workflows",
    title: "Back office + agent tools",
    description:
      "Connecting the workbench, CRM, and agent-tech moments where decisions become action.",
  },
  {
    label: "Intelligence",
    title: "Data + AI layers",
    description:
      "Turning scattered context into useful signals that help people act with confidence.",
  },
] as const;

const steps = [
  ["01", "Frame", "Find the real decision underneath the request."],
  ["02", "Model", "Make the system, constraints, and opportunity visible."],
  ["03", "Prototype", "Build enough of the behavior to test the direction."],
  ["04", "Align", "Give product and engineering a shared path to ship."],
] as const;

export default function EquisoftPracticePage() {
  return (
    <>
      <SiteHeader backHref="/#applications" backLabel="Back to independent builds" />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="equisoft-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Confidential enterprise practice</p>
            <h1 id="equisoft-title">
              <span>Designing clarity</span>
              <span>inside complex systems.</span>
            </h1>
            <p className={styles.summary}>
              For the last six years at Equisoft, I have worked at the
              intersection of product strategy, UX, AI, and build—helping turn
              complex insurance and financial software into clearer tools for
              the people who depend on it.
            </p>
            <div className={styles.heroLinks}>
              <a className={styles.primaryLink} href="mailto:jmanuelr.99@gmail.com">
                <span>Discuss the work privately</span>
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={17} strokeWidth={1.8} />
              </a>
              <Link className={styles.quietLink} href="/#applications">
                <span>See independent builds</span>
                <HugeiconsIcon icon={ArrowRight02Icon} size={16} strokeWidth={1.8} />
              </Link>
            </div>
          </div>

          <div className={styles.systemVisual} aria-label="Abstract map of an enterprise product system">
            <div className={styles.systemTopline}>
              <span>Enterprise product system</span>
              <span>Sanitized view</span>
            </div>
            <div className={styles.systemMap} aria-hidden="true">
              <span className={`${styles.node} ${styles.nodeSource}`}>Context</span>
              <span className={`${styles.node} ${styles.nodeCore}`}>Decision</span>
              <span className={`${styles.node} ${styles.nodeAction}`}>Action</span>
              <span className={`${styles.line} ${styles.lineOne}`} />
              <span className={`${styles.line} ${styles.lineTwo}`} />
              <span className={`${styles.line} ${styles.lineThree}`} />
              <span className={`${styles.pulse} ${styles.pulseOne}`} />
              <span className={`${styles.pulse} ${styles.pulseTwo}`} />
            </div>
            <p className={styles.systemCaption}>
              The work is often about making the right context arrive at the
              right moment.
            </p>
          </div>
        </section>

        <section className={styles.domainSection} aria-labelledby="domain-title">
          <div className={styles.sectionLead}>
            <p>Where I work</p>
            <h2 id="domain-title">The shape of the problem changes. The practice stays clear.</h2>
          </div>
          <div className={styles.domainGrid}>
            {domains.map((domain) => (
              <article className={styles.domainCard} key={domain.title}>
                <p>{domain.label}</p>
                <h3>{domain.title}</h3>
                <span>{domain.description}</span>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.methodSection} aria-labelledby="method-title">
          <div className={styles.methodLead}>
            <p>How I contribute</p>
            <h2 id="method-title">From an ambiguous ask to a direction people can use.</h2>
            <span>
              I work across the full 0→1 loop: clarifying the question,
              shaping the interaction, building the prototype, and bringing
              the right people into the decision early.
            </span>
          </div>
          <ol className={styles.steps}>
            {steps.map(([number, title, description]) => (
              <li key={number}>
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.boundarySection} aria-labelledby="boundary-title">
          <div>
            <p className={styles.eyebrow}>A note on the work</p>
            <h2 id="boundary-title">The products are real. The details stay protected.</h2>
          </div>
          <p>
            Most of the enterprise work I have done at Equisoft is covered by
            confidentiality commitments. This page intentionally avoids
            product names, customer data, and production screens. It shares
            the domains, decisions, and way of working instead. I can walk
            through the deeper context in a private conversation.
          </p>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title">
          <p>Looking for the next useful thing</p>
          <h2 id="closing-title">Let&apos;s talk about the problem behind the product.</h2>
          <a className={styles.primaryLink} href="mailto:jmanuelr.99@gmail.com">
            <span>Start a conversation</span>
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={17} strokeWidth={1.8} />
          </a>
        </section>
      </main>
    </>
  );
}
