import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUp01Icon,
  ArrowUpRight01Icon,
  Linkedin01Icon,
} from "@hugeicons/core-free-icons";
import { ClientMarquee } from "./client-marquee";
import { AbeamVideo } from "./abeam/abeam-video";
import { SiteHeader } from "./site-header";
import { ProjectCarousel } from "./project-carousel";
import { AiAvatar } from "./ai-avatar";

const featuredApplications = [
  { name: "Nudge", slug: "nudge" },
  { name: "PushedWorld", slug: "world" },
  { name: "Tracer", slug: "tracer" },
  { name: "aBeam", slug: "abeam" },
  { name: "CryptoCroc", slug: "crypto-inheritance" },
  { name: "Decision ROI", slug: "equisoft-labs" },
] as const;

const equisoftProducts = [
  {
    label: "CRM",
    description: "Customer relationship and distribution workbenches",
  },
  {
    label: "PAS",
    description:
      "Policy administration, product configuration, and audit layers",
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
        <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} strokeWidth={1.8} />
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
              Senior Product Designer at Equisoft in Quebec City. I turn complex
              business problems into clear products, services, and
              experiences—using strategy, UX, AI, and code to move from a fuzzy
              question to something useful a team can ship.
            </p>
            <p className="hero-fit">
              Open to product design, AI innovation, and 0-to-1 roles where
              strategy, design, and build meet.
            </p>
          </div>

        </section>

        <ProjectCarousel />

        <section className="clients-section clients-section--above-apps" aria-labelledby="clients-title">
          <div className="clients-intro">
            <p className="section-pill">Selected clients · 04</p>
            <h2 id="clients-title">
              <span>Clients I&apos;ve</span>
              <span>worked with.</span>
            </h2>
          </div>

          <ClientMarquee />
        </section>

        <div className="home-app-navigation">
          <nav
            className="app-strip"
            id="applications"
            aria-label="Featured product design projects"
          >
            <ul>
              {featuredApplications.map((application) => (
                <li key={application.slug} id={application.slug}>
                  <Link href={`/${application.slug}`} title={`View ${application.name}`}>
                    <span
                      className={`app-icon app-icon--${application.slug}`}
                      aria-hidden="true"
                    >
                      <span className="app-icon-glyph">
                        {application.slug === "nudge" ? (
                          <Image
                            className="app-icon-image"
                            src="/nudge/mark.webp"
                            alt=""
                            width={512}
                            height={512}
                            sizes="(min-width: 760px) 76px, 58px"
                          />
                        ) : application.slug === "world" ? (
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
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <section
          className="professional-section"
          aria-labelledby="professional-title"
        >
          <div className="professional-intro">
            <div className="professional-brand">
              <Image className="professional-logo" src="/equisoft-pyramid-glass.svg" alt="" width={160} height={160} sizes="(max-width: 759px) 64px, 120px" />
              <h2 id="professional-title">
              <span>Equisoft</span>
              <span>Fintech &amp; insurance.</span>
              </h2>
            </div>
            <p>
              Designing complex insurance products, from discovery to delivery.
              I partner with product and engineering, and have led an AI committee
              exploring AI-assisted workflows.
            </p>
          </div>
          <ul
            className="professional-domain-list"
            aria-label="Equisoft product domains"
          >
            {equisoftProducts.map((product) => (
              <li className="professional-domain" key={product.label}>
                <span className="professional-domain-mark">
                  {product.label}
                  {product.label === "AI" ? <AiAvatar /> : null}
                </span>
                <span className="professional-domain-description">
                  {product.description}
                </span>
              </li>
            ))}
          </ul>
        </section>


      </main>

      <footer className="site-footer">
        <a
          className="back-to-top-fab"
          href="#main-content"
          aria-label="Back to top"
        >
          <HugeiconsIcon icon={ArrowUp01Icon} size={18} strokeWidth={1.8} />
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
