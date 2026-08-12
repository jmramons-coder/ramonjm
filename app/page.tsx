import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02Icon,
  ArrowUp01Icon,
  ArrowUpRight01Icon,
  Linkedin01Icon,
} from "@hugeicons/core-free-icons";
import { ClientMarquee } from "./client-marquee";
import { AbeamVideo } from "./abeam/abeam-video";
import { SiteHeader } from "./site-header";

const featuredApplications = [
  { name: "PushedWorld", slug: "world" },
  { name: "Tracer", slug: "tracer" },
  { name: "aBeam", slug: "abeam" },
  { name: "CryptoCroc", slug: "crypto-inheritance" },
  { name: "Decision ROI", slug: "equisoft-labs" },
] as const;

const workflowSteps = [
  {
    title: "Frame the problem",
    description:
      "Turn ambiguity into clear product logic: the user, the tension, the opportunity, and the decision the team needs to make.",
  },
  {
    title: "Prototype at speed",
    description:
      "Use AI, interaction design, and code to make the important behavior tangible early—before a team overbuilds the wrong thing.",
  },
  {
    title: "Shape what ships",
    description:
      "Work with product and engineering to test the signal, refine the experience, and turn a promising prototype into a clear direction for delivery.",
  },
] as const;

const equisoftProducts = [
  {
    label: "CRM",
    description: "Customer relationship and distribution workbenches",
  },
  {
    label: "PAS",
    description: "Policy administration, product configuration, and audit layers",
  },
  {
    label: "AI",
    description: "Embedded intelligence and agentic workflows",
  },
  {
    label: "DIT",
    description: "Digital insurance tools for agents and customers",
  },
  {
    label: "CM",
    description: "Case management for complex claims and requests",
  },
] as const;

function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <span className="link-icon" aria-hidden="true">
        <HugeiconsIcon
          icon={ArrowUpRight01Icon}
          size={16}
          strokeWidth={1.8}
        />
      </span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to independent builds
      </a>

      <SiteHeader home />

      <main id="main-content" tabIndex={-1}>
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="status-pill">
              <span aria-hidden="true" />
              Senior product designer · AI-native builder
            </p>
            <h1 id="page-title">
              <span>I design and build</span>
              <span>products, services,</span>
              <span>and experiences.</span>
            </h1>
            <p className="hero-description">
              Senior Product Designer at Equisoft in Quebec City. I turn
              complex business problems into clear products, services, and
              experiences—using strategy, UX, AI, and code to move from a
              fuzzy question to something useful a team can ship.
            </p>
            <p className="hero-fit">
              Open to product design, AI innovation, and 0-to-1 roles where
              strategy, design, and build meet.
            </p>
          </div>

          <nav
            className="app-strip"
            aria-label="Featured product design projects"
          >
            <ul>
              {featuredApplications.map((application) => (
                <li key={application.slug}>
                  <a href={`#${application.slug}`}>
                    <span
                      className={`app-icon app-icon--${application.slug}`}
                      aria-hidden="true"
                    >
                      <span className="app-icon-glyph">
                        {application.slug === "world" ? (
                          <Image
                            className="app-icon-image"
                            src="/world/app-icon.png"
                            alt=""
                            width={256}
                            height={256}
                            sizes="(min-width: 760px) 62px, 46px"
                          />
                        ) : application.slug === "tracer" ? (
                          <Image
                            className="app-icon-image app-icon-image--tracer-glass"
                            src="/tracer/logo-glass.png"
                            alt=""
                            width={523}
                            height={478}
                            sizes="(min-width: 760px) 62px, 46px"
                          />
                        ) : application.slug === "abeam" ? (
                          <AbeamVideo
                            className="app-icon-video--abeam"
                            sizes="70px"
                          />
                        ) : application.slug === "crypto-inheritance" ? (
                          <Image
                            className="app-icon-image app-icon-image--crypto-skull"
                            src="/crypto-inheritance/skull.png"
                            alt=""
                            width={760}
                            height={760}
                            sizes="(min-width: 760px) 62px, 46px"
                          />
                        ) : (
                          <Image
                            className="app-icon-image app-icon-image--roi-calculator"
                            src="/equisoft-labs/roi-calculator-rail.png"
                            alt=""
                            width={1254}
                            height={1254}
                            sizes="(min-width: 760px) 62px, 46px"
                          />
                        )}
                      </span>
                    </span>
                    <span className="sr-only">Go to {application.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </section>

        <section
          className="work-section"
          id="applications"
          aria-labelledby="applications-title"
        >
          <div className="work-intro">
            <p className="section-pill">Independent builds · 05</p>
            <h2 id="applications-title">
              <span>Products built</span>
              <span>around clarity.</span>
            </h2>
            <p className="work-summary">
              Independent products across AI, security, insurance, crypto, and
              fitness—built to make the thinking tangible.
            </p>
          </div>

          <div className="gallery-grid">
            <article
              className="application-card application-card--project"
              id="world"
              aria-labelledby="world-title"
            >
              <Link className="application-card-link" href="/world">
                <div className="app-canvas app-canvas--world">
                  <video
                    aria-hidden="true"
                    autoPlay
                    className="world-card-video"
                    disablePictureInPicture
                    disableRemotePlayback
                    muted
                    playsInline
                    preload="metadata"
                    tabIndex={-1}
                  >
                    <source
                      src="/world/pushedworld-card.mp4"
                      type="video/mp4"
                    />
                  </video>
                  <span className="world-card-shade" aria-hidden="true" />
                  <div className="world-card-brand">
                    <Image
                      className="world-card-icon"
                      src="/world/app-icon.png"
                      alt=""
                      width={256}
                      height={256}
                      sizes="44px"
                    />
                    <div>
                      <p>01 / Product design + build</p>
                      <h3 id="world-title">PushedWorld</h3>
                    </div>
                  </div>
                </div>
                <span
                  className="application-project-arrow world-card-arrow"
                  aria-hidden="true"
                >
                  <HugeiconsIcon
                    icon={ArrowRight02Icon}
                    size={24}
                    strokeWidth={1.8}
                  />
                </span>
              </Link>
            </article>

            <article
              className="application-card application-card--project application-card--tracer"
              id="tracer"
              aria-labelledby="tracer-title"
            >
              <Link className="application-card-link" href="/tracer">
                <div className="app-canvas app-canvas--tracer">
                  <Image
                    className="tracer-card-image"
                    src="/tracer/screen-organizations.jpg"
                    alt=""
                    fill
                    sizes="(max-width: 759px) 100vw, (max-width: 1099px) 50vw, (max-width: 1199px) 25vw, 20vw"
                  />
                  <span className="tracer-card-shade" aria-hidden="true" />
                  <div className="tracer-card-copy">
                    <Image
                      className="tracer-card-logo"
                      src="/tracer/logo-light.png"
                      alt=""
                      width={363}
                      height={318}
                      sizes="64px"
                    />
                    <p>02 / Security intelligence</p>
                    <h3 id="tracer-title">Tracer</h3>
                    <span>Screen research partners in minutes.</span>
                  </div>
                </div>
                <span
                  className="application-project-arrow tracer-card-arrow"
                  aria-hidden="true"
                >
                  <HugeiconsIcon
                    icon={ArrowRight02Icon}
                    size={24}
                    strokeWidth={1.8}
                  />
                </span>
              </Link>
            </article>

            <article
              className="application-card application-card--project application-card--abeam"
              id="abeam"
              aria-label="aBeam"
            >
              <Link
                className="application-card-link"
                href="/abeam"
                aria-label="View aBeam project"
              >
                <div
                  className="app-canvas app-canvas--abeam-project"
                  aria-hidden="true"
                >
                  <AbeamVideo
                    alwaysPlay
                    className="abeam-card-motion"
                    sizes="(max-width: 759px) 92vw, (max-width: 1099px) 46vw, (max-width: 1199px) 24vw, 19vw"
                  />
                </div>
                <span
                  className="application-project-arrow abeam-card-arrow"
                  aria-hidden="true"
                >
                  <HugeiconsIcon
                    icon={ArrowRight02Icon}
                    size={24}
                    strokeWidth={1.8}
                  />
                </span>
              </Link>
            </article>

            <article
              className="application-card application-card--project application-card--crypto"
              id="crypto-inheritance"
              aria-labelledby="crypto-inheritance-title"
            >
              <Link
                className="application-card-link"
                href="/crypto-inheritance"
              >
                <div className="app-canvas app-canvas--crypto">
                  <div className="crypto-card-copy">
                    <p>04 / Crypto legacy planner</p>
                    <h3 id="crypto-inheritance-title">CryptoCroc</h3>
                    <span>Plan the handoff.</span>
                  </div>
                  <Image
                    className="crypto-card-skull"
                    src="/crypto-inheritance/skull.png"
                    alt=""
                    width={760}
                    height={760}
                    sizes="(max-width: 759px) 92vw, (max-width: 1099px) 46vw, (max-width: 1199px) 24vw, 19vw"
                  />
                </div>
                <span
                  className="application-project-arrow crypto-card-arrow"
                  aria-hidden="true"
                >
                  <HugeiconsIcon
                    icon={ArrowRight02Icon}
                    size={24}
                    strokeWidth={1.8}
                  />
                </span>
              </Link>
            </article>

            <article
              className="application-card application-card--project application-card--equisoft-labs"
              id="equisoft-labs"
              aria-labelledby="equisoft-labs-title"
            >
              <Link
                className="application-card-link"
                href="/equisoft-labs"
              >
                <div className="app-canvas app-canvas--equisoft-labs">
                  <span
                    className="equisoft-labs-card-glow"
                    aria-hidden="true"
                  />
                  <div className="equisoft-labs-card-copy">
                    <p>05 / Insurance R&amp;D</p>
                    <h3 id="equisoft-labs-title">Equisoft Labs</h3>
                    <span>Decision intelligence for insurance.</span>
                  </div>
                  <Image
                    className="equisoft-labs-card-calculator"
                    src="/equisoft-labs/roi-calculator-hq.png"
                    alt=""
                    width={1254}
                    height={1254}
                    sizes="(max-width: 759px) 66vw, (max-width: 1099px) 40vw, (max-width: 1199px) 19vw, 15vw"
                  />
                </div>
                <span
                  className="application-project-arrow equisoft-labs-card-arrow"
                  aria-hidden="true"
                >
                  <HugeiconsIcon
                    icon={ArrowRight02Icon}
                    size={24}
                    strokeWidth={1.8}
                  />
                </span>
              </Link>
            </article>

          </div>
        </section>

        <section className="professional-section" aria-labelledby="professional-title">
          <div className="professional-intro">
            <h2 id="professional-title">
              <span>Equisoft</span>
              <span>Fintech &amp; insurance.</span>
            </h2>
            <p>
              I work across fintech and insurance products from discovery
              through delivery, shaping complex, data-heavy systems with deep
              UI: configuration interfaces, management workbenches, complex
              forms, and multi-stage processes. I have led an AI committee and
              partnered with multiple teams to integrate AI and agentic
              capabilities into insurance software and finance operations.
            </p>
          </div>
          <div className="professional-domain-list" aria-label="Equisoft product domains">
            {equisoftProducts.map((product) => (
              <div className="professional-domain" key={product.label}>
                <span className="professional-domain-mark" aria-hidden="true">
                  {product.label}
                </span>
                <span className="professional-domain-description">{product.description}</span>
              </div>
            ))}
          </div>
        </section>

        <section
          className="workflow-section"
          aria-labelledby="workflow-title"
        >
          <div className="workflow-intro">
            <p className="section-pill">Design approach</p>
            <h2 id="workflow-title">
              <span>From ambiguity to</span>
              <span className="workflow-result">
                <span className="workflow-arrow" aria-hidden="true">
                  <HugeiconsIcon
                    icon={ArrowRight02Icon}
                    size="1em"
                    strokeWidth={1.5}
                  />
                </span>
                signal that ships.
              </span>
            </h2>
          </div>

          <ol className="workflow-list">
            {workflowSteps.map((step, index) => (
              <li className="workflow-step" key={step.title}>
                <div className="workflow-number-card">
                  <p>{String(index + 1).padStart(2, "0")}</p>
                  <div className="workflow-progress" aria-hidden="true">
                    {[0, 1, 2].map((dot) => (
                      <span
                        className={dot <= index ? "is-active" : undefined}
                        key={dot}
                      />
                    ))}
                  </div>
                </div>
                <div className="workflow-copy-card">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="clients-section" aria-labelledby="clients-title">
          <div className="clients-intro">
            <p className="section-pill">Selected clients · 04</p>
            <h2 id="clients-title">
              <span>Clients I&apos;ve</span>
              <span>worked with.</span>
            </h2>
          </div>

          <ClientMarquee />
        </section>

      </main>

      <footer className="site-footer">
        <a
          className="back-to-top-fab"
          href="#main-content"
          aria-label="Back to top"
        >
          <HugeiconsIcon
            icon={ArrowUp01Icon}
            size={18}
            strokeWidth={1.8}
          />
        </a>
        <div className="footer-top">
          <p>Ramon JM · Product design, AI &amp; innovation</p>
        </div>
        <div className="footer-main">
          <h2>Make the next useful thing.</h2>
          <div className="footer-links">
            <ExternalLink
              className="footer-action"
              href="https://www.linkedin.com/in/jmanuelr"
            >
              <span className="link-icon" aria-hidden="true">
                <HugeiconsIcon
                  icon={Linkedin01Icon}
                  size={18}
                  strokeWidth={1.7}
                />
              </span>
              <span>Connect on LinkedIn</span>
            </ExternalLink>
          </div>
        </div>
        <p className="copyright">© {new Date().getFullYear()} Ramon JM</p>
      </footer>
    </>
  );
}
