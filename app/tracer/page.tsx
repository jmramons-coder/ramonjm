import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";
import { SiteHeader } from "../site-header";
import styles from "./tracer.module.css";

export const metadata: Metadata = {
  title: "Tracer Research Security — Ramon JM",
  description:
    "Tracer screens researchers and institutions across hundreds of millions of records, turning risk signals into cited, decision-ready briefs.",
  alternates: { canonical: "/tracer" },
};

const screeningModes = [
  {
    title: "Screen individuals",
    description:
      "Review affiliations, co-author networks, funding, sanctions, foreign ties, legal records, and adverse media in one sourced file.",
    image: "/tracer/screen-individuals.jpg",
    alt: "Tracer visual representing individual researcher screening",
  },
  {
    title: "Screen organizations",
    description:
      "Trace governance, sanctions exposure, partner networks, export controls, legal records, and adverse media with the same evidence standard.",
    image: "/tracer/screen-organizations.jpg",
    alt: "Tracer visual representing institutional screening",
  },
] as const;

function VisitTracerLink({ className }: { className: string }) {
  return (
    <a
      className={className}
      href="https://tracersecurity.ca/"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>Visit Tracer</span>
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

export default function TracerProjectPage() {
  return (
    <>
      <SiteHeader tone="dark" />
      <main className={styles.page}>
        <div className="project-page-top">
        <Link className={styles.backLink} href="/#applications">
          <HugeiconsIcon
            icon={ArrowLeft02Icon}
            size={17}
            strokeWidth={1.8}
          />
          <span>Selected work</span>
        </Link>
        </div>

      <section className={styles.hero} aria-labelledby="tracer-title">
        <Image
          className={styles.heroImage}
          src="/tracer/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
        />
        <span className={styles.heroShade} aria-hidden="true" />

        <div className={styles.heroCopy}>
          <div className={styles.brand}>
            <Image
              src="/tracer/logo-light.png"
              alt=""
              width={363}
              height={318}
              sizes="52px"
              priority
            />
            <span>
              <strong>Tracer</strong>
              <small>Research security</small>
            </span>
          </div>
          <p className={styles.eyebrow}>Clear the path to great science</p>
          <h1 id="tracer-title">Screen research partners in minutes.</h1>
          <p className={styles.summary}>
            Tracer cross-references 400M+ records across 320+ sources and
            turns affiliations, networks, and risk signals into an auditable,
            decision-ready brief.
          </p>
          <VisitTracerLink className={styles.heroLink} />
        </div>

        <article className={styles.brief} aria-label="Example Tracer brief">
          <div className={styles.briefHeader}>
            <div>
              <p>Research Security Brief</p>
              <h2>Partnership review</h2>
            </div>
            <span>Decision-ready</span>
          </div>
          <ul>
            <li>
              <span>Institutional affiliation</span>
              <strong>Review</strong>
            </li>
            <li>
              <span>Sanctions &amp; designations</span>
              <strong className={styles.clear}>Clear</strong>
            </li>
            <li>
              <span>Academic network</span>
              <strong>Review</strong>
            </li>
          </ul>
          <div className={styles.briefFooter}>
            <span>320+ sources</span>
            <span>Full citation trail</span>
          </div>
        </article>
      </section>

      <section className={styles.overview} aria-labelledby="tracer-overview">
        <div className={styles.overviewCopy}>
          <p>Research security intelligence</p>
          <h2 id="tracer-overview">
            Two screening pipelines. One evidence standard.
          </h2>
          <span>
            Built for institutions making high-stakes research partnership
            decisions, Tracer brings individual and organization screening
            into one consistent, reviewable workflow.
          </span>
        </div>

        <dl className={styles.metrics}>
          <div>
            <dt>Records cross-referenced</dt>
            <dd>400M+</dd>
          </div>
          <div>
            <dt>Sources searched</dt>
            <dd>320+</dd>
          </div>
          <div>
            <dt>Time to a brief</dt>
            <dd>Minutes</dd>
          </div>
        </dl>
      </section>

      <section className={styles.screeningGrid} aria-label="Tracer workflows">
        {screeningModes.map((mode) => (
          <article className={styles.screeningCard} key={mode.title}>
            <div className={styles.screeningVisual}>
              <Image
                src={mode.image}
                alt={mode.alt}
                fill
                sizes="(max-width: 800px) 100vw, 50vw"
              />
            </div>
            <div className={styles.screeningCopy}>
              <h2>{mode.title}</h2>
              <p>{mode.description}</p>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.closing} aria-labelledby="tracer-output">
        <Image
          className={styles.glassLogo}
          src="/tracer/logo-glass.png"
          alt=""
          width={523}
          height={478}
          sizes="(max-width: 700px) 52vw, 320px"
        />
        <div className={styles.closingCopy}>
          <p>The output</p>
          <h2 id="tracer-output">A brief your leadership trusts.</h2>
          <span>
            Structured findings, full citations, and clear risk signals—built
            around Canadian research-security requirements and hosted in
            Canada.
          </span>
          <VisitTracerLink className={styles.closingLink} />
        </div>
      </section>
      </main>
    </>
  );
}
