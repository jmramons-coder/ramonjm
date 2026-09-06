import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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

function ProductLink({
  children = "Explore PushedWorld",
}: {
  children?: React.ReactNode;
}) {
  return (
    <a
      className={styles.link}
      href="https://www.pushedworld.com/"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
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
      <SiteHeader backHref="/#applications" textOnly />
      <main className={styles.page} id="project-content" tabIndex={-1}>
        <section className={styles.hero} aria-labelledby="project-title">
          <div className={styles.heroCopy}>
            <div className={styles.identity}>
              <Image
                src="/world/app-icon.png"
                width={72}
                height={72}
                alt=""
                priority
              />
              <span>
                PushedWorld<small>Independent product · iPhone</small>
              </span>
            </div>
            <p className={styles.eyebrow}>
              Product strategy / Identity / Design / Development
            </p>
            <h1 id="project-title">
              Every rep.
              <br />
              <em>A little further.</em>
            </h1>
            <p className={styles.intro}>
              Turning a simple push-up into a reason to come back. A native
              fitness game that pairs hands-free counting with a world of
              progress.
            </p>
            <ProductLink />
          </div>
          <div className={styles.heroStage}>
            <span className={styles.orbit} aria-hidden="true" />
            <span className={styles.stageLabel}>Movement becomes momentum</span>
            <div className={styles.heroPhone}>
              <WorldVideo
                src="/world/session-live.mp4"
                poster="/world/session-poster.jpg"
                label="PushedWorld live rep counting demo"
              />
            </div>
            <Image
              className={styles.heroBuster}
              src="/world/buster-top.webp"
              width={600}
              height={396}
              alt="Buster demonstrating a push-up"
              priority
            />
            <span className={styles.stageFoot}>
              Real app. Real-time feedback.
            </span>
          </div>
        </section>

        <section className={styles.brief} aria-labelledby="brief-title">
          <p className={styles.eyebrow}>The design challenge</p>
          <h2 id="brief-title">
            Make the next set
            <br />
            feel worth starting.
          </h2>
          <div className={styles.briefBody}>
            <p>
              Counting reps is only the beginning. PushedWorld connects the
              effort of a single set to something larger: a destination, an
              earned reward, and the feeling of moving forward.
            </p>
            <p>
              I brought the native app, character system, and product website
              together around that idea. The experience moves from clear camera
              feedback to a playful journey, without losing sight of the workout
              itself.
            </p>
          </div>
          <dl className={styles.facts}>
            {[
              ["My role", "Product design & development"],
              ["Built for", "iPhone · SwiftUI · Vision"],
              ["Product loop", "Move · Save · Progress"],
              ["Principle", "Private, on-device tracking"],
            ].map(([title, value]) => (
              <div key={title}>
                <dt>{title}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.progress} aria-labelledby="progress-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>01 / A reason to return</p>
              <h2 id="progress-title">
                Effort you can
                <br />
                <em>see accumulating.</em>
              </h2>
            </div>
            <p>
              The Path gives every saved rep a place to go. A visible next
              target makes progress concrete; earned profile frames give each
              milestone a lasting identity.
            </p>
          </div>
          <div className={styles.progressStage}>
            <div className={styles.worldArt}>
              <Image
                src="/world/path-world.webp"
                width={665}
                height={1330}
                alt="A winding stone path rising through clouds"
              />
              <span>
                100 levels.
                <br />
                Ten evolving worlds.
              </span>
            </div>
            <figure className={styles.deviceFigure}>
              <div className={styles.phone}>
                <Image
                  src="/world/path-current.jpg"
                  width={1320}
                  height={2868}
                  alt="PushedWorld Path with the current level and next target"
                  sizes="(max-width: 700px) 68vw, 260px"
                />
              </div>
              <figcaption>
                Know where you are.
                <br />
                <strong>See what comes next.</strong>
              </figcaption>
            </figure>
            <figure className={styles.deviceFigure}>
              <div className={styles.phone}>
                <Image
                  src="/world/frame-unlock.jpg"
                  width={1320}
                  height={2868}
                  alt="Session recap with an earned Stone Crown profile frame"
                  sizes="(max-width: 700px) 68vw, 260px"
                />
              </div>
              <figcaption>
                Finish the set.
                <br />
                <strong>Keep the reward.</strong>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className={styles.brand} aria-labelledby="brand-title">
          <div className={styles.brandIntro}>
            <div>
              <p className={styles.eyebrow}>02 / Character with a purpose</p>
              <h2 id="brand-title">
                A coach with
                <br />
                <em>some character.</em>
              </h2>
              <p>
                Buster carries the personality of PushedWorld into the
                experience. Expressive artwork makes the product approachable,
                while the form guide uses the same character to demonstrate
                movement clearly.
              </p>
            </div>
            <Image
              src="/world/buster-mentor.webp"
              width={512}
              height={768}
              alt="Buster extending a hand in encouragement"
              sizes="(max-width: 700px) 220px, 280px"
            />
          </div>
          <div className={styles.poseGrid}>
            {[
              ["top", "01 / Set your position"],
              ["middle", "02 / Lower with control"],
              ["bottom", "03 / Complete the movement"],
            ].map(([pose, label]) => (
              <figure key={pose}>
                <Image
                  src={`/world/buster-${pose}.webp`}
                  width={600}
                  height={396}
                  alt={`Buster at the ${pose} position of a push-up`}
                  sizes="(max-width: 700px) 80vw, 28vw"
                />
                <figcaption>{label}</figcaption>
              </figure>
            ))}
          </div>
          <p className={styles.caption}>
            One character language, from encouragement to instruction.
          </p>
        </section>

        <section className={styles.setup} aria-labelledby="setup-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>03 / Remove the friction</p>
              <h2 id="setup-title">
                Less setup.
                <br />
                <em>More movement.</em>
              </h2>
            </div>
            <p>
              The first rep starts with understanding where the phone goes.
              Short in-app motion guides explain placement and framing, then
              live camera feedback takes over the count.
            </p>
          </div>
          <div className={styles.guideGrid}>
            {[
              {
                name: "place",
                title: "Place it low.",
                body: "Position the iPhone upright at floor level, with the front camera facing your workout space.",
                src: "place-phone",
              },
              {
                name: "count",
                title: "Move. It counts.",
                body: "Keep your full body in frame. Supported push-up movement is counted hands-free, with live cues throughout the set.",
                src: "count-rep",
              },
            ].map((clip) => (
              <figure key={clip.name}>
                <div className={styles.guideMedia}>
                  <WorldVideo
                    src={`/world/guides/${clip.src}.mp4`}
                    poster={`/world/guides/${clip.name}-poster.jpg`}
                    label={clip.title}
                  />
                </div>
                <figcaption>
                  <h3>{clip.title}</h3>
                  <p>{clip.body}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className={styles.trust} aria-labelledby="trust-title">
          <div>
            <p className={styles.eyebrow}>04 / Motivation, on your terms</p>
            <h2 id="trust-title">
              Personal progress.
              <br />
              <em>Optional competition.</em>
            </h2>
            <p>
              Your own Path is the foundation. Game Center adds a global League
              when you want another reason to show up.
            </p>
            <div className={styles.privacy}>
              <span>Private by design</span>
              <h3>
                The camera counts.
                <br />
                It doesn’t keep the footage.
              </h3>
              <p>
                Frames are analyzed live on your iPhone during a session. They
                are never saved or uploaded.
              </p>
            </div>
          </div>
          <figure className={styles.leagueFigure}>
            <div className={styles.phone}>
              <Image
                src="/world/league-current.jpg"
                width={1320}
                height={2868}
                alt="PushedWorld League screen inviting the user to connect Game Center"
                sizes="(max-width: 700px) 68vw, 280px"
              />
            </div>
            <figcaption>Connect when competition feels right.</figcaption>
          </figure>
        </section>

        <section className={styles.storeCampaign} aria-labelledby="store-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>05 / The first impression</p>
              <h2 id="store-title">
                A small screen.
                <br />
                <em>A complete story.</em>
              </h2>
            </div>
            <p>
              The App Store sequence brings the experience into focus:
              hands-free counting, Buster’s encouragement, and progress worth
              returning for. Real app views and expressive artwork carry one
              consistent visual language across all seven panels.
            </p>
          </div>
          <div
            className={styles.storeGallery}
            role="region"
            aria-label="PushedWorld App Store screenshots"
            tabIndex={0}
          >
            {[
              ["01-count", "Push, we count: hands-free camera tracking"],
              ["02-mentor", "Stay motivated with Buster, your personal coach"],
              ["03-anywhere", "Train anywhere with PushedWorld"],
              ["04-path", "Climb your 100-level path"],
              ["05-completion", "One rep at a time: celebrate a completed set"],
              ["06-league", "Join the Hall of Fame"],
              ["07-rewards", "Unlock profile frames as you rise"],
            ].map(([file, label], index) => (
              <a
                key={file}
                href={`/world/store-${file}.webp`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open screenshot ${index + 1}: ${label} (opens in a new tab)`}
              >
                <Image
                  src={`/world/store-${file}.webp`}
                  width={990}
                  height={2151}
                  alt={label}
                  sizes="(max-width: 700px) 75vw, 290px"
                />
              </a>
            ))}
          </div>
          <p className={styles.galleryHint}>
            Scroll through all seven panels. Select a screenshot to view it
            larger.
          </p>
        </section>

        <section className={styles.website} aria-labelledby="website-title">
          <Image
            src="/world/community.webp"
            width={1600}
            height={971}
            alt="Buster and the PushedWorld cast gathered after a workout"
            sizes="(max-width: 700px) 100vw, 60vw"
          />
          <div>
            <p className={styles.eyebrow}>The product, beyond the app</p>
            <h2 id="website-title">
              A whole world
              <br />
              behind one rep.
            </h2>
            <p>
              The website extends the same character, movement, and progression
              into the first encounter with PushedWorld. A cohesive introduction
              to what the app does—and why you might keep coming back.
            </p>
            <ProductLink>Visit the product website</ProductLink>
          </div>
        </section>
        <footer className={styles.closing}>
          <span>PushedWorld · Product, identity & development</span>
          <Link href="/#applications">Back to all projects</Link>
        </footer>
      </main>
    </>
  );
}
