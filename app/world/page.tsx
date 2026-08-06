import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";

export const metadata: Metadata = {
  title: "PushedWorld — Ramon JM",
  description:
    "A native iPhone fitness game that counts push-ups on-device and turns every saved rep into visible progress.",
  alternates: { canonical: "/world" },
  openGraph: {
    title: "PushedWorld — Ramon JM",
    description:
      "A hands-free push-up counter that turns every saved rep into progress across a 100-level journey.",
    type: "website",
    url: "/world",
    images: [
      {
        url: "/world/og-card.jpg",
        width: 1200,
        height: 630,
        alt: "PushedWorld mascot holding a push-up above a city skyline",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PushedWorld — Ramon JM",
    description:
      "A hands-free push-up counter that turns every saved rep into visible progress.",
    images: ["/world/og-card.jpg"],
  },
};

const projectFacts = [
  ["Role", "Product design & development"],
  ["Platform", "Native iPhone app"],
  ["Core", "SwiftUI · Vision"],
  ["Privacy", "On-device camera analysis"],
] as const;

const appViews = [
  {
    eyebrow: "01 / Progress",
    title: "A path built from every rep.",
    description:
      "Saved workouts move lifetime progress through 100 levels across ten worlds.",
    image: "/world/path.png",
    alt: "PushedWorld Path screen showing levels 25 and 26",
    className: "world-view--path",
  },
  {
    eyebrow: "02 / Count",
    title: "Move while the app counts.",
    description:
      "The front camera tracks supported movement live, with the counter always in view.",
    image: "/world/workout.png",
    alt: "PushedWorld live workout screen showing 31 reps",
    className: "world-view--workout",
  },
  {
    eyebrow: "03 / League",
    title: "A little competition, by choice.",
    description:
      "Optional Game Center standings turn total reps into a friendly all-time League.",
    image: "/world/league.png",
    alt: "PushedWorld League screen showing athlete standings",
    className: "world-view--league",
  },
] as const;

export default function WorldProjectPage() {
  return (
    <>
      <a className="skip-link" href="#project-content">
        Skip to project
      </a>

      <header className="project-header">
        <Link className="wordmark" href="/" aria-label="Ramon JM, portfolio">
          Ramon JM
        </Link>
        <Link className="project-back-link" href="/#world">
          <span className="link-icon" aria-hidden="true">
            <HugeiconsIcon
              icon={ArrowLeft02Icon}
              size={17}
              strokeWidth={1.8}
            />
          </span>
          Back to work
        </Link>
      </header>

      <main className="project-page" id="project-content" tabIndex={-1}>
        <section className="project-hero" aria-labelledby="project-title">
          <p className="section-pill">PushedWorld · iPhone app</p>

          <div className="project-hero-copy">
            <div className="project-identity">
              <Image
                className="project-app-icon"
                src="/world/app-icon.png"
                alt="PushedWorld app icon"
                width={256}
                height={256}
                sizes="(max-width: 759px) 72px, 92px"
                priority
              />
              <p>PushedWorld</p>
            </div>
            <h1 id="project-title">Every rep moves your world.</h1>
            <p className="project-intro">
              A native iPhone fitness game that counts push-ups on-device and
              turns every saved rep into progress across a 100-level journey.
            </p>
            <a
              className="project-primary-link"
              href="https://www.pushedworld.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit product site
              <span className="link-icon" aria-hidden="true">
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  size={17}
                  strokeWidth={1.8}
                />
              </span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>

          <div className="world-hero-visual" aria-hidden="true">
            <Image
              className="world-hero-background"
              src="/world/og-card.jpg"
              alt=""
              fill
              sizes="(max-width: 759px) 100vw, 94vw"
              priority
            />
            <span className="world-hero-wash" />
            <Image
              className="world-hero-phone"
              src="/world/path.png"
              alt=""
              width={240}
              height={522}
              sizes="(max-width: 759px) 47vw, 27vw"
              priority
            />
          </div>

          <dl className="project-facts">
            {projectFacts.map(([term, detail]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="project-overview" aria-labelledby="overview-title">
          <p className="section-pill">Overview</p>
          <div>
            <h2 id="overview-title">Push-ups become progress you can see.</h2>
            <p>
              PushedWorld uses on-device pose detection to count supported
              movement hands-free. Daily goals, streaks, lifetime totals, and
              the Path update after every saved session, while camera frames
              stay on the iPhone and are never saved or uploaded.
            </p>
          </div>
        </section>

        <section className="project-views" aria-labelledby="views-title">
          <div className="project-views-intro">
            <p className="section-pill">Inside the app</p>
            <h2 id="views-title">
              <span>Count. Progress.</span>
              <span>Keep moving.</span>
            </h2>
          </div>

          <div className="world-view-grid">
            {appViews.map((view) => (
              <figure className={`world-view ${view.className}`} key={view.title}>
                <div className="world-view-visual">
                  <Image
                    src={view.image}
                    alt={view.alt}
                    width={240}
                    height={522}
                    sizes="(max-width: 759px) 68vw, 21vw"
                  />
                </div>
                <figcaption>
                  <p>{view.eyebrow}</p>
                  <h3>{view.title}</h3>
                  <span>{view.description}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="project-closing" aria-labelledby="closing-title">
          <p>Full product story</p>
          <h2 id="closing-title">See the complete PushedWorld experience.</h2>
          <div className="project-closing-links">
            <a
              href="https://www.pushedworld.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit pushedworld.com
              <span className="link-icon" aria-hidden="true">
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  size={18}
                  strokeWidth={1.8}
                />
              </span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <Link href="/#world">
              Back to portfolio
              <span className="link-icon" aria-hidden="true">
                <HugeiconsIcon
                  icon={ArrowRight02Icon}
                  size={18}
                  strokeWidth={1.8}
                />
              </span>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
