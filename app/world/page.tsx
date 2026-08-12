import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";
import { SiteHeader } from "../site-header";
import { WorldVideo } from "./world-video";
import styles from "./world.module.css";

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

const setupClips = [
  {
    number: "01",
    kicker: "Place",
    title: "Place it low.",
    description:
      "Stand the iPhone upright at floor level with the front camera facing the workout space.",
    video: "/world/guides/place-phone.mp4",
    poster: "/world/guides/place-poster.jpg",
    label: "A person placing an iPhone upright at floor level",
  },
  {
    number: "02",
    kicker: "Frame",
    title: "Fit your whole body.",
    description:
      "Move back until hands, hips, knees, and feet stay inside the camera view.",
    video: "/world/guides/fit-frame.mp4",
    poster: "/world/guides/frame-poster.jpg",
    label: "An athlete moving into a full-body plank in front of an iPhone",
  },
] as const;

function ProductSiteLink({ className }: { className: string }) {
  return (
    <a
      className={className}
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
  );
}

export default function WorldProjectPage() {
  return (
    <>
      <a className="skip-link" href="#project-content">
        Skip to project
      </a>

      <SiteHeader />

      <main className={styles.page} id="project-content" tabIndex={-1}>
        <div className="project-page-top">
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
        </div>
        <section className={styles.hero} aria-labelledby="project-title">
          <div className={styles.heroCopy}>
            <p className="section-pill">PushedWorld · iPhone app</p>
            <div className={styles.identity}>
              <Image
                className={styles.appIcon}
                src="/world/app-icon.png"
                alt="PushedWorld app icon"
                width={256}
                height={256}
                sizes="(max-width: 759px) 72px, 92px"
                priority
              />
              <div>
                <span>Native fitness game</span>
                <strong>PushedWorld</strong>
              </div>
            </div>
            <h1 id="project-title">
              <span>Push up.</span>
              <span>Count up.</span>
              <span>Get stronger.</span>
            </h1>
            <p className={styles.heroIntro}>
              PushedWorld counts supported push-up movement hands-free when
              your body is in frame, turning every saved rep into progress you
              can see.
            </p>
            <ProductSiteLink className={styles.primaryLink} />
          </div>

          <figure className={styles.heroStage}>
            <Image
              className={styles.heroImage}
              src="/world/hero-human.jpg"
              alt="Athlete doing a push-up outdoors with an iPhone positioned to track the session"
              fill
              sizes="(max-width: 759px) 100vw, 94vw"
              priority
            />
            <span className={styles.heroShade} aria-hidden="true" />
            <div className={`${styles.floatingCard} ${styles.liveCard}`} aria-hidden="true">
              <i />
              <span>Live</span>
              <small>Tracking</small>
            </div>
            <div className={`${styles.floatingCard} ${styles.repCard}`} aria-hidden="true">
              <small>Session reps</small>
              <div>
                <strong>31</strong>
                <span>reps</span>
              </div>
              <i>
                <b />
              </i>
            </div>
            <div className={`${styles.floatingCard} ${styles.levelCard}`} aria-hidden="true">
              <small>Level 26 / 100</small>
              <strong>Black Iron</strong>
              <span>30 reps to Level 27</span>
            </div>
          </figure>

          <dl className={styles.facts}>
            {projectFacts.map(([term, detail]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.sessionSection} aria-labelledby="session-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className="section-pill">See it work</p>
              <h2 id="session-title">
                You move. <span>It counts.</span>
              </h2>
            </div>
            <p>
              Set the phone down, wait for tracking, and move naturally. The
              live counter follows the set without manual taps.
            </p>
          </div>

          <div className={styles.sessionDemo}>
            <Image
              className={styles.videoFallback}
              src="/world/guides/count-poster.jpg"
              alt=""
              fill
              sizes="(max-width: 759px) 100vw, 58vw"
            />
            <WorldVideo
              className={styles.sessionVideo}
              src="/world/guides/count-rep.mp4"
              poster="/world/guides/count-poster.jpg"
              label="In-app guidance video of an athlete performing push-ups in front of an iPhone"
            />
            <div className={styles.sessionTop} aria-hidden="true">
              <span>
                <i /> Live
              </span>
              <strong>02:06</strong>
            </div>
            <div className={styles.sessionCounter} aria-hidden="true">
              <strong>31</strong>
              <span>Session reps</span>
            </div>
            <div className={styles.sessionFeedback} aria-hidden="true">
              <strong>Incredible. 31!</strong>
              <span>33 left today</span>
            </div>
          </div>
        </section>

        <section className={styles.pathSection} aria-labelledby="path-title">
          <div className={styles.pathCopy}>
            <p className="section-pill">Progress with a destination</p>
            <h2 id="path-title">
              See what every rep <span>unlocks.</span>
            </h2>
            <p>
              Every saved push-up advances one of 100 levels across ten
              evolving worlds. The current level, next target, and distance to
              go always stay clear.
            </p>

            <div className={styles.progressCard}>
              <div>
                <Image
                  src="/world/app-icon.png"
                  alt=""
                  width={34}
                  height={34}
                />
                <span>Level 26 / 100 · Black Iron</span>
              </div>
              <strong>30</strong>
              <p>reps to Level 27</p>
              <i>
                <b />
              </i>
            </div>
          </div>

          <div className={styles.pathVisual}>
            <Image
              className={styles.pathBackground}
              src="/world/path-stone-gate.jpg"
              alt="Floating stone Path climbing through clouds"
              fill
              sizes="(max-width: 759px) 100vw, 48vw"
            />
            <span className={`${styles.pathNode} ${styles.pathNodeNext}`}>27</span>
            <span className={`${styles.pathNode} ${styles.pathNodeActive}`}>
              26 <small>You</small>
            </span>
            <span className={`${styles.pathNode} ${styles.pathNodeDone}`}>25</span>
            <Image
              className={styles.pathScreen}
              src="/world/path.png"
              alt="PushedWorld Path screen"
              width={240}
              height={522}
              sizes="(max-width: 759px) 45vw, 20vw"
            />
          </div>
        </section>

        <section className={styles.guideSection} aria-labelledby="guide-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className="section-pill">In-app guidance</p>
              <h2 id="guide-title">
                From phone placement <span>to a counted rep.</span>
              </h2>
            </div>
            <p>
              The same short motion guides used inside PushedWorld make the
              camera setup easy to understand before a session begins.
            </p>
          </div>

          <div className={styles.guideGrid}>
            {setupClips.map((clip) => (
              <figure className={styles.guideCard} key={clip.number}>
                <div className={styles.guideMedia}>
                  <Image
                    className={styles.videoFallback}
                    src={clip.poster}
                    alt=""
                    fill
                    sizes="(max-width: 759px) 86vw, 41vw"
                  />
                  <WorldVideo
                    src={clip.video}
                    poster={clip.poster}
                    label={clip.label}
                  />
                  <span aria-hidden="true">
                    {clip.number} / {clip.kicker}
                  </span>
                </div>
                <figcaption>
                  <h3>{clip.title}</h3>
                  <p>{clip.description}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className={styles.guideNote}>
            Camera guidance is instructional. Move with control and stop if you
            feel sharp pain.
          </p>
        </section>

        <section className={styles.privacySection} aria-labelledby="privacy-title">
          <div className={styles.privacyMark} aria-hidden="true">
            <span />
          </div>
          <div className={styles.privacyCopy}>
            <p className="section-pill">Private by design</p>
            <h2 id="privacy-title">
              Your camera video is <span>never recorded.</span>
            </h2>
            <p>
              Frames are analyzed live on the iPhone only while a session is
              open. They are never saved or uploaded.
            </p>
          </div>
          <ul className={styles.privacyFacts}>
            <li>
              <strong>On device</strong>
              <span>Pose analysis stays local</span>
            </li>
            <li>
              <strong>On demand</strong>
              <span>Camera opens for sessions only</span>
            </li>
            <li>
              <strong>In your control</strong>
              <span>Pose points and reminders are optional</span>
            </li>
          </ul>
        </section>

        <section className={styles.leagueSection} aria-labelledby="league-title">
          <div className={styles.leagueCopy}>
            <p className="section-pill">Friendly competition</p>
            <h2 id="league-title">
              Every rep <span>moves your rank.</span>
            </h2>
            <p>
              Optional Game Center standings turn consistency into momentum
              without making competition a requirement.
            </p>
          </div>
          <div className={styles.leagueVisual}>
            <Image
              src="/world/league.png"
              alt="PushedWorld League showing all-time athlete standings"
              width={240}
              height={522}
              sizes="(max-width: 759px) 68vw, 24vw"
            />
          </div>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title">
          <p>Full product story</p>
          <h2 id="closing-title">See the complete PushedWorld experience.</h2>
          <div>
            <ProductSiteLink className={styles.closingLink} />
            <Link className={styles.closingLink} href="/#world">
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
