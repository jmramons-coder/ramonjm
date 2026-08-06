import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowRight02Icon,
  ArrowUp01Icon,
  ArrowUpRight01Icon,
  ChartIncreaseIcon,
  GithubIcon,
  Route01Icon,
  RocketIcon,
  Sofa01Icon,
} from "@hugeicons/core-free-icons";
import { ClientMarquee } from "./client-marquee";
import { AbeamVideo } from "./abeam/abeam-video";

const applications = [
  { name: "Lounge", slug: "lounge", icon: Sofa01Icon },
  {
    name: "Maxing",
    slug: "maxing",
    icon: ChartIncreaseIcon,
  },
  { name: "Push", slug: "push", icon: RocketIcon },
  { name: "PushedWorld", slug: "world", icon: null },
  { name: "Add", slug: "add", icon: Add01Icon },
  { name: "Tracer", slug: "tracer", icon: Route01Icon },
  { name: "aBeam", slug: "abeam", icon: null },
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
        <ExternalLink
          className="header-action"
          href="https://github.com/jmramons-coder"
        >
          <span className="link-icon" aria-hidden="true">
            <HugeiconsIcon icon={GithubIcon} size={17} strokeWidth={1.7} />
          </span>
          <span>GitHub</span>
        </ExternalLink>
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

          <p className="sr-only" id="app-strip-help">
            Swipe or scroll horizontally, or use Tab, to browse the app links.
          </p>
          <nav
            className="app-strip"
            aria-label="Jump to an application"
            aria-describedby="app-strip-help"
            tabIndex={0}
          >
            <ul>
              {applications.map((application) => (
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
                        ) : application.slug === "abeam" ? (
                          <AbeamVideo
                            className="app-icon-video--abeam"
                            sizes="70px"
                          />
                        ) : (
                          <HugeiconsIcon
                            icon={application.icon}
                            size={27}
                            strokeWidth={1.8}
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
            <p className="section-pill">Selected work · 07</p>
            <h2 id="applications-title">
              <span>Seven applications.</span>
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
                <div
                  className="app-canvas app-canvas--world"
                  aria-hidden="true"
                >
                  <Image
                    className="world-card-human"
                    src="/world/hero-human.jpg"
                    alt=""
                    fill
                    sizes="(max-width: 759px) 100vw, 50vw"
                  />
                  <span className="world-card-shade" />
                  <span className="world-card-live">
                    <i />
                    <span>Live</span>
                    <small>Tracking</small>
                  </span>
                  <span className="world-card-reps">
                    <small>Session reps</small>
                    <span>
                      <strong>31</strong> reps
                    </span>
                    <i>
                      <b />
                    </i>
                  </span>
                  <span className="world-card-level">
                    <small>Level 26</small>
                    <strong>Black Iron</strong>
                    <span>30 reps to Level 27</span>
                  </span>
                </div>
                <div className="application-label application-label--project">
                  <Image
                    className="application-project-icon"
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
                  <span
                    className="application-project-arrow"
                    aria-hidden="true"
                  >
                    <HugeiconsIcon
                      icon={ArrowRight02Icon}
                      size={18}
                      strokeWidth={1.8}
                    />
                  </span>
                </div>
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
                    sizes="(max-width: 759px) 92vw, 46vw"
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

            <div className="application-placeholder-list">
              {applications
                .filter(
                  (application) =>
                    application.slug !== "world" &&
                    application.slug !== "abeam",
                )
                .map((application) => {
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
