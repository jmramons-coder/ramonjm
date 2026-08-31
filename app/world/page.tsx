import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
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
    kicker: "Count",
    title: "Move. We count.",
    description:
      "Once your full body is in frame, start moving. PushedWorld follows each supported rep hands-free and confirms it live.",
    video: "/world/guides/count-rep.mp4",
    poster: "/world/guides/count-poster.jpg",
    label: "An athlete performing push-ups with an iPhone tracking the movement",
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

      <SiteHeader backHref="/#applications" />

      <main className={styles.page} id="project-content" tabIndex={-1}>
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
              Front-camera tracking follows supported push-up movement
              hands-free. The live view keeps count, movement cues, and Today
              and Path targets in sight.
            </p>
          </div>

          <div className={styles.sessionDemo}>
            <div className={styles.sessionIntro}>
              <span>Current live session</span>
              <strong>Camera to count.</strong>
              <p>Front-camera movement tracking. No watch. No taps.</p>
            </div>

            <div className={styles.sessionPhone}>
              <Image
                className={styles.videoFallback}
                src="/world/session-poster.jpg"
                alt=""
                fill
                sizes="(max-width: 759px) 88vw, 31vw"
              />
              <WorldVideo
                className={styles.sessionVideo}
                src="/world/session-live.mp4"
                poster="/world/session-poster.jpg"
                label="Current PushedWorld live session counting push-ups and updating Today and Path targets"
              />
            </div>

            <dl className={styles.sessionSignals}>
              <div>
                <dt>Movement</dt>
                <dd>Live cues</dd>
              </div>
              <div>
                <dt>Goals</dt>
                <dd>Today + Path</dd>
              </div>
              <div>
                <dt>Milestone</dt>
                <dd>Target crushed</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className={styles.pathSection} aria-labelledby="path-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className="section-pill">Progress with a destination</p>
              <h2 id="path-title">
                See what every rep <span>unlocks.</span>
              </h2>
            </div>
            <p>
              Every saved push-up moves a 100-level route through ten worlds.
              Checkpoints turn progress into frame rewards, so the next goal
              and what it earns stay visible.
            </p>
          </div>

          <div className={styles.pathShowcase}>
            <div className={`${styles.pathCallout} ${styles.pathCalloutStart}`}>
              <span>01 / Progress</span>
              <strong>Your position stays visible.</strong>
            </div>

            <figure className={`${styles.pathDevice} ${styles.pathDeviceMap}`}>
              <Image
                src="/world/path-current.jpg"
                alt="Current PushedWorld Path showing Level 26 on the Black Iron route"
                fill
                sizes="(max-width: 759px) 62vw, 27vw"
              />
            </figure>

            <figure className={`${styles.pathDevice} ${styles.pathDeviceUnlock}`}>
              <Image
                src="/world/frame-unlock.jpg"
                alt="Current session recap showing the Stone Crown profile frame unlocked"
                fill
                sizes="(max-width: 759px) 58vw, 27vw"
              />
            </figure>

            <div className={`${styles.pathCallout} ${styles.pathCalloutEnd}`}>
              <span>02 / Reward</span>
              <strong>Milestones become earned frames.</strong>
            </div>

            <p className={styles.pathMeta}>100 levels · 10 worlds · Frame rewards</p>
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
              Game Center stays opt-in. Connect when you want lifetime reps to
              enter the global League, reveal the podium, and show your real
              rank.
            </p>
          </div>
          <div className={styles.leagueVisual}>
            <Image
              src="/world/league-current.jpg"
              alt="Current PushedWorld League screen prompting the athlete to connect Game Center and reveal global standings"
              fill
              sizes="(max-width: 759px) 100vw, 39vw"
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
