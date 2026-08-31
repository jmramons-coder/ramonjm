import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";
import { SiteHeader } from "../site-header";
import { FormGuide } from "./form-guide";
import { WorldVideo } from "./world-video";
import styles from "./world.module.css";

export const metadata: Metadata = {
  title: "PushedWorld — Ramon JM",
  description:
    "A native iPhone fitness game that counts push-ups on-device, never records camera video, and turns saved reps into Path progress, frames, and optional League standings.",
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

const pathWorlds = [
  "Base Camp",
  "Frostline",
  "Ember Core",
  "Riftwalk",
  "Skybound",
  "Onyx Orbit",
  "Astral Wilds",
  "Celest Forge",
  "Universe Engine",
  "Ultra",
] as const;

const widgetSurfaces = [
  {
    surface: "Home Screen",
    title: "Today stays on the grid.",
    detail: "Reps to do, progress, and completion without opening the app.",
  },
  {
    surface: "Lock Screen",
    title: "Glanceable at wake.",
    detail: "Today’s count and streak sit with the rest of the lock screen.",
  },
  {
    surface: "Dynamic Island",
    title: "Live, then gone.",
    detail: "A compact Live Activity for the session. Animation is optional.",
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
            <div className={styles.heroActions}>
              <ProductSiteLink className={styles.primaryLink} />
              <span className={styles.comingSoon}>Coming soon on iPhone</span>
            </div>
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
              Front-camera tracking estimates supported push-up movement
              hands-free. Pose analysis runs on the iPhone only while a session
              is open. The camera video is never recorded.
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
              go always stay clear—named places such as Stone Crown and Black
              Iron, not a blank counter.
            </p>

            <div className={styles.levelPair}>
              <div className={styles.progressCard}>
                <div>
                  <Image
                    src="/world/app-icon.png"
                    alt=""
                    width={34}
                    height={34}
                  />
                  <span>Level 05 / 100 · Stone Crown</span>
                </div>
                <strong>14</strong>
                <p>reps to Momentum</p>
                <i>
                  <b style={{ width: "44%" }} />
                </i>
              </div>
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
              alt="PushedWorld Path screen showing Black Iron as the active level"
              width={240}
              height={522}
              sizes="(max-width: 759px) 45vw, 20vw"
            />
          </div>
          <p className={styles.exampleNote}>
            Example Path states from the live product UI—not a personal
            record.
          </p>
        </section>

        <section className={styles.worldsSection} aria-labelledby="worlds-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className="section-pill">Ten worlds</p>
              <h2 id="worlds-title">
                One Path. <span>Ten places to climb.</span>
              </h2>
            </div>
            <p>
              Worlds shift as the count grows—from Base Camp stone to Ultra.
              The case study names them; the product keeps you on the current
              step.
            </p>
          </div>
          <ol className={styles.worldList}>
            {pathWorlds.map((world, index) => (
              <li key={world}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {world}
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.rewardSection} aria-labelledby="reward-title">
          <div className={styles.rewardCopy}>
            <p className="section-pill">Rewards earned by reps</p>
            <h2 id="reward-title">
              Frames you wear <span>because you showed up.</span>
            </h2>
            <p>
              Saved reps unlock frames you can equip on Buster. A named level
              such as Black Iron becomes a visible reward—progress you earned,
              not a catalog of things to buy.
            </p>
          </div>
          <div className={styles.rewardVisual} aria-hidden="true">
            <div className={styles.rewardFrame}>
              <Image
                src="/world/app-icon.png"
                alt=""
                width={256}
                height={256}
                sizes="160px"
              />
            </div>
            <div className={styles.rewardMeta}>
              <small>Reward earned</small>
              <strong>Black Iron unlocked</strong>
              <span>Level 26 · equipped</span>
            </div>
          </div>
        </section>

        <section className={styles.busterSection} aria-labelledby="buster-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className="section-pill">Mentor · Buster</p>
              <h2 id="buster-title">
                A coach for form. <span>A nudge to finish.</span>
              </h2>
            </div>
            <p>
              Buster is the in-app mentor: a form guide for four grips, and
              optional check-ins that stay on the device. The copy below is a
              product example—not a customer quote.
            </p>
          </div>

          <div className={styles.busterGrid}>
            <figure className={styles.busterPhone}>
              <Image
                src="/world/workout.png"
                alt="PushedWorld session screen with Buster holding a plank while the live rep count reads 31"
                width={240}
                height={522}
                sizes="(max-width: 759px) 68vw, 28vw"
              />
            </figure>
            <div className={styles.nudgeCard}>
              <div className={styles.nudgeHeader}>
                <Image
                  src="/world/app-icon.png"
                  alt=""
                  width={36}
                  height={36}
                />
                <div>
                  <strong>Buster</strong>
                  <span>Example check-in</span>
                </div>
              </div>
              <p>You showed up. Finish the set and keep that streak alive.</p>
              <div className={styles.nudgeMeta}>
                <span>Optional local notification</span>
                <span>On device</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.guideSection} aria-labelledby="guide-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className="section-pill">Form guide</p>
              <h2 id="guide-title">
                Build better reps. <span>Not just bigger numbers.</span>
              </h2>
            </div>
            <p>
              Watch the positions Buster teaches: top, middle, and bottom for
              standard, wide, close-grip, and diamond push-ups. Hands move;
              the trunk stays one line.
            </p>
          </div>
          <FormGuide />
        </section>

        <section className={styles.widgetSection} aria-labelledby="widget-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className="section-pill">Home, Lock, Island</p>
              <h2 id="widget-title">
                Today stays <span>in sight.</span>
              </h2>
            </div>
            <p>
              See reps to do, progress, completion, and your streak on the Home
              Screen, Lock Screen, and Dynamic Island. Animation and reminders
              are optional.
            </p>
          </div>

          <ul className={styles.widgetGrid}>
            {widgetSurfaces.map((widget) => (
              <li className={styles.widgetCard} key={widget.surface}>
                <div
                  className={`${styles.widgetPreview} ${
                    widget.surface === "Home Screen"
                      ? styles.widgetHome
                      : widget.surface === "Lock Screen"
                        ? styles.widgetLock
                        : styles.widgetIsland
                  }`}
                  aria-hidden="true"
                >
                  {widget.surface === "Home Screen" ? (
                    <div className={styles.homeWidget}>
                      <small>Today</small>
                      <strong>14</strong>
                      <span>Stone Crown</span>
                    </div>
                  ) : widget.surface === "Lock Screen" ? (
                    <div className={styles.lockWidget}>
                      <i />
                      <span>31 reps · Day 7</span>
                    </div>
                  ) : (
                    <div className={styles.islandWidget}>
                      <i />
                      <span>Live · 31</span>
                    </div>
                  )}
                </div>
                <h3>{widget.surface}</h3>
                <p>
                  <strong>{widget.title}</strong> {widget.detail}
                </p>
              </li>
            ))}
          </ul>
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
              open. They are never saved or uploaded. Pose points and reminders
              stay optional, and under your control.
            </p>
            <a
              className={styles.privacyLink}
              href="https://www.pushedworld.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the privacy policy
              <span className="link-icon" aria-hidden="true">
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  size={16}
                  strokeWidth={1.8}
                />
              </span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
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
              without making competition a requirement. Opening League does not
              sync a score; connecting is a choice.
            </p>
            <p className={styles.exampleNote}>
              Illustrative Game Center preview—not customer testimonials.
            </p>
          </div>
          <div className={styles.leagueVisual}>
            <Image
              src="/world/league.png"
              alt="Illustrative PushedWorld League preview showing all-time standings in Game Center"
              width={240}
              height={522}
              sizes="(max-width: 759px) 68vw, 24vw"
            />
          </div>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title">
          <p>Coming soon on iPhone</p>
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
