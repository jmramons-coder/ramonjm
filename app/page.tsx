import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowRight02Icon,
  ArrowUp01Icon,
  ArrowUpRight01Icon,
  GithubIcon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { ClientMarquee } from "./client-marquee";
import { AbeamVideo } from "./abeam/abeam-video";

const featuredApplications = [
  { name: "PushedWorld", slug: "world" },
  { name: "Tracer", slug: "tracer" },
  { name: "aBeam", slug: "abeam" },
  { name: "CryptoCroc", slug: "crypto-inheritance" },
  { name: "Equisoft Labs", slug: "equisoft-labs" },
] as const;

const placeholderApplications = [
  { name: "Lounge", slug: "lounge" },
  { name: "Maxing", slug: "maxing" },
  { name: "Push", slug: "push" },
  { name: "Add", slug: "add" },
] as const;

const workflowSteps = [
  {
    title: "Discovery",
    description:
      "Start with the idea, the problem it should solve, and the simplest useful shape for the product.",
  },
  {
    title: "Creation",
    description:
      "Turn that direction into a clear interface system, then build the interactions that make it feel complete.",
  },
  {
    title: "Delivery",
    description:
      "Refine the responsive experience, check the essential paths, and prepare the product to ship.",
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
        Skip to selected work
      </a>

      <header className="site-header" id="top">
        <a className="wordmark" href="#top" aria-label="Ramon JM, home">
          Ramon JM
        </a>
        <a
          className="header-action header-contact"
          href="mailto:jmanuelr.99@gmail.com"
          aria-label="Email Ramon JM at jmanuelr.99@gmail.com"
        >
          <span>Contact</span>
          <span className="header-contact-plane" aria-hidden="true">
            <HugeiconsIcon icon={SentIcon} size={16} strokeWidth={1.8} />
          </span>
        </a>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="status-pill">
              <span aria-hidden="true" />
              Ramon JM · App portfolio
            </p>
            <h1 id="page-title">
              <span>Apps, made with a</span>
              <span>clear point of view.</span>
            </h1>
            <p className="hero-description">
              A focused collection of digital products by Ramon JM, gathered
              in one place.
            </p>
            <a className="primary-action" href="#applications">
              <span className="action-dot" aria-hidden="true" />
              Explore the apps
              <span className="link-icon" aria-hidden="true">
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={16}
                  strokeWidth={1.8}
                />
              </span>
            </a>
          </div>

          <nav className="app-strip" aria-label="Featured applications">
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
                            sizes="62px"
                          />
                        ) : application.slug === "tracer" ? (
                          <Image
                            className="app-icon-image app-icon-image--tracer"
                            src="/tracer/app-icon.png"
                            alt=""
                            width={192}
                            height={192}
                            sizes="62px"
                          />
                        ) : application.slug === "abeam" ? (
                          <AbeamVideo
                            className="app-icon-video--abeam"
                            sizes="70px"
                          />
                        ) : application.slug === "crypto-inheritance" ? (
                          <Image
                            className="app-icon-image app-icon-image--crypto"
                            src="/crypto-inheritance/logo.png"
                            alt=""
                            width={1024}
                            height={1024}
                            sizes="62px"
                          />
                        ) : (
                          <Image
                            className="app-icon-image app-icon-image--equisoft-labs"
                            src="/equisoft-labs/icon.png"
                            alt=""
                            width={105}
                            height={105}
                            sizes="62px"
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
            <p className="section-pill">Selected work · 09</p>
            <h2 id="applications-title">
              <span>Nine applications.</span>
              <span>One evolving body of work.</span>
            </h2>
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
                      <p>04 / iPhone app</p>
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
                    <p>06 / Research security</p>
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
                    <p>08 / Crypto legacy planner</p>
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
                    <p>09 / Decision ROI</p>
                    <h3 id="equisoft-labs-title">Equisoft Labs</h3>
                    <span>Decision intelligence for insurance.</span>
                  </div>
                  <Image
                    className="equisoft-labs-card-persona"
                    src="/equisoft-labs/persona.png"
                    alt=""
                    width={700}
                    height={700}
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

            <div className="application-placeholder-list">
              {placeholderApplications.map((application) => {
                const titleId = `${application.slug}-title`;

                return (
                  <article
                    className="application-card application-card--placeholder"
                    id={application.slug}
                    key={application.slug}
                    aria-labelledby={titleId}
                  >
                    <h3
                      className="application-placeholder-title"
                      id={titleId}
                    >
                      {application.name}
                    </h3>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className="workflow-section"
          aria-labelledby="workflow-title"
        >
          <div className="workflow-intro">
            <p className="section-pill">Our workflow</p>
            <h2 id="workflow-title">
              <span>No guesswork, just a clear path from ideas</span>
              <span className="workflow-result">
                <span className="workflow-arrow" aria-hidden="true">
                  <HugeiconsIcon
                    icon={ArrowRight02Icon}
                    size="1em"
                    strokeWidth={1.5}
                  />
                </span>
                working apps.
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

        <section className="about-section" aria-labelledby="about-title">
          <p className="section-pill">About</p>
          <div className="about-content">
            <h2 id="about-title">
              <span>Clear products.</span>
              Considered interfaces.
            </h2>
            <p>
              I build digital products with an emphasis on clarity, utility,
              and considered interfaces. This portfolio is a simple record of
              that work.
            </p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-top">
          <p>Ramon JM · Digital product portfolio</p>
          <a className="back-to-top" href="#top">
            <span>Back to top</span>
            <span className="link-icon" aria-hidden="true">
              <HugeiconsIcon
                icon={ArrowUp01Icon}
                size={15}
                strokeWidth={1.8}
              />
            </span>
          </a>
        </div>
        <div className="footer-main">
          <h2>Keep exploring the work behind the apps.</h2>
          <ExternalLink
            className="footer-action"
            href="https://github.com/jmramons-coder"
          >
            <span className="link-icon" aria-hidden="true">
              <HugeiconsIcon icon={GithubIcon} size={18} strokeWidth={1.7} />
            </span>
            <span>Continue on GitHub</span>
          </ExternalLink>
        </div>
        <p className="copyright">© {new Date().getFullYear()} Ramon JM</p>
      </footer>
    </>
  );
}
