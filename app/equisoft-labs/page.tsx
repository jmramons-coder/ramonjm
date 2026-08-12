import type { Metadata } from "next";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";
import { InteractivePreview } from "../interactive-preview";
import { SiteHeader } from "../site-header";
import styles from "./equisoft-labs.module.css";

export const metadata: Metadata = {
  title: "Equisoft Lab at Elevate — Ramon JM",
  description:
    "A field experiment for Equisoft Lab at Elevate, using Decision ROI to make the cost of missing information visible.",
  alternates: { canonical: "/equisoft-labs" },
};

const decisionInputs = [
  {
    number: "01",
    label: "Work hours",
    description: "Makes the time spent inside the decision visible.",
  },
  {
    number: "02",
    label: "Team size",
    description: "Shows how far one slow decision can travel across a team.",
  },
  {
    number: "03",
    label: "Critical decisions",
    description: "Focuses the conversation on choices where context matters most.",
  },
  {
    number: "04",
    label: "Delayed decisions",
    description: "Turns missing information into a cost people can discuss.",
  },
] as const;

const visionPillars = [
  {
    number: "01",
    title: "Reframe the problem",
    description:
      "Instead of opening with a product pitch, we started with the human cost of not having the right information at the right time.",
  },
  {
    number: "02",
    title: "Make it tactile",
    description:
      "A screen, a shared iPad, and a simple physical prompt gave an abstract data-access problem a place to land.",
  },
  {
    number: "03",
    title: "Learn in the moment",
    description:
      "Every interaction opened a conversation about centralisation, context, and how an AMS could support better decisions.",
  },
] as const;

function VisitProjectLink({ className }: { className: string }) {
  return (
    <a
      className={className}
      href="https://www.equisoftlabs.com/"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>Explore the prototype</span>
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

export default function EquisoftLabsProjectPage() {
  return (
    <>
      <SiteHeader backHref="/#applications" />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="equisoft-labs-title">
          <span className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <Image
                className={styles.logo}
                src="/equisoft-labs/wordmark.png"
                alt="Equisoft Lab — Decision ROI"
                width={459}
                height={105}
                sizes="(max-width: 700px) 260px, 360px"
                priority
              />
              <p className={styles.eyebrow}>
                Elevate field experiment · insurance innovation
              </p>
              <h1 id="equisoft-labs-title">
                <span>Make the cost of</span>
                <span>missing context visible.</span>
              </h1>
              <p className={styles.summary}>
                At Elevate, Equisoft Lab turned a booth into a moment of
                reflection: what does it cost when the right information
                arrives too late? Decision ROI gave that conversation a number.
              </p>
              <VisitProjectLink className={styles.heroLink} />
            </div>

            <div className={styles.tabletStage}>
              <span className={styles.tabletGlow} aria-hidden="true" />
              <div className={styles.tabletFrame}>
                <span className={styles.tabletCamera} aria-hidden="true" />
                <div className={styles.tabletScreen}>
                  <Image
                    className={styles.tabletScreenshot}
                    src="/equisoft-labs/app-screenshot.jpg"
                    alt="Decision ROI app showing a Senior Executive scenario and decision impact calculator"
                    width={1200}
                    height={833}
                    sizes="(max-width: 1060px) 92vw, 50vw"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.livePreview} aria-labelledby="live-preview-title">
          <div className={styles.livePreviewIntro}>
            <p>Start with the product</p>
            <h2 id="live-preview-title">Make the cost of delay tangible.</h2>
            <span>
            Interact with Decision ROI as it was designed: start with a role,
            tune four inputs, and see how the story changes.
            </span>
          </div>
          <InteractivePreview
            className={styles.livePreviewFrame}
            src="https://www.equisoftlabs.com/"
            title="Interactive Equisoft Labs Decision ROI prototype"
            hostname="equisoftlabs.com"
          />
        </section>

      <section className={styles.inputsSection} aria-labelledby="inputs-title">
        <div className={styles.sectionIntro}>
          <p>The model</p>
          <h2 id="inputs-title">Four inputs. One shared conversation.</h2>
          <span>
            Work hours, team size, critical decisions, and delayed decisions
            turn an abstract operational problem into a business conversation
            people can discuss, test, and refine.
          </span>
        </div>

        <div className={styles.inputsLayout}>
          <ol className={styles.inputList}>
            {decisionInputs.map((input) => (
              <li key={input.number}>
                <span>{input.number}</span>
                <div>
                  <h3>{input.label}</h3>
                  <p>{input.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className={styles.startVisual}>
            <span className={styles.startGlow} aria-hidden="true" />
            <Image
              src="/equisoft-labs/start.png"
              alt=""
              width={700}
              height={700}
              sizes="(max-width: 900px) 92vw, 42vw"
            />
            <div className={styles.startCaption}>
              <span>Guided by role</span>
              <strong>From assumptions to a shared starting point.</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.elevateStory} aria-labelledby="elevate-title">
        <div className={styles.elevateIntro}>
          <p>Elevate · the field experiment</p>
          <h2 id="elevate-title">A booth designed to make information feel tangible.</h2>
          <span>
            Elevate brought together major insurance and fintech players,
            clients, and people shaping the next market. We used that setting
            to create a small pause: a way to feel the cost of missing the
            right context at the right moment.
          </span>
        </div>

        <div className={styles.storyGrid}>
          <figure className={styles.storyVisual}>
            <Image
              src="/equisoft-labs/elevate-booth.png"
              alt="Pale blue geometric booth with a blank screen, an iPad on a table, and people gathered around it"
              width={1536}
              height={1024}
              sizes="(max-width: 780px) 100vw, 64vw"
            />
            <figcaption>
              <span>01 / A shared surface</span>
              <strong>The product started with a moment around the iPad.</strong>
            </figcaption>
          </figure>

          <div className={styles.storyCopy}>
            <p>Interaction one</p>
            <h3>Start with a shared surface.</h3>
            <span>
              A single screen created the context. The iPad made the product
              approachable. People could gather around the table, move through
              the scenario together, and see how small delays compound across a
              team.
            </span>
          </div>

          <div className={styles.storyCopy}>
            <p>Interaction two</p>
            <h3>Turn a conversation into a prompt.</h3>
            <span>
              The balloon wall made the question physical. Participants threw
              darts at an 8 × 8 field, aiming at a coral triangle in the middle
              and opening a conversation about what should be easier to see,
              share, and act on inside an AMS.
            </span>
          </div>

          <figure className={styles.storyVisual}>
            <Image
              src="/equisoft-labs/elevate-balloon-wall.png"
              alt="Pale blue balloon wall with a coral triangle, silhouettes throwing darts, and a blank question placard"
              width={1536}
              height={1024}
              sizes="(max-width: 780px) 100vw, 64vw"
            />
            <figcaption>
              <span>02 / A question people could touch</span>
              <strong>The interaction made room for a more honest answer.</strong>
            </figcaption>
          </figure>
        </div>

        <div className={styles.storyQuestion}>
          <p>The question underneath it all</p>
          <blockquote>
            How could a more centralized AMS help teams get the right
            information at the right time?
          </blockquote>
        </div>
      </section>

      <section className={styles.vision} aria-labelledby="vision-title">
        <div className={styles.visionInner}>
          <div className={styles.visionCopy}>
            <p>Why the intervention worked</p>
            <h2 id="vision-title">From a booth moment to product direction.</h2>
            <span>
              The experience was deliberately small. It made an invisible
              problem visible, gave people a shared language, and let the
              product earn its place in the conversation.
            </span>

            <div className={styles.deviceVisual}>
              <span aria-hidden="true" />
              <Image
                src="/equisoft-labs/mobile-vision.png"
                alt="Equisoft Labs mobile-first product vision"
                width={248}
                height={459}
                sizes="(max-width: 700px) 52vw, 248px"
              />
            </div>
          </div>

          <ol className={styles.pillarList}>
            {visionPillars.map((pillar) => (
              <li key={pillar.number}>
                <span>{pillar.number}</span>
                <div>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.closing} aria-labelledby="closing-title">
        <Image
          className={styles.closingLogo}
          src="/equisoft-labs/wordmark.png"
          alt="Equisoft Lab — Decision ROI"
          width={459}
          height={105}
          sizes="(max-width: 700px) 240px, 340px"
        />
        <div className={styles.closingCopy}>
          <p>Field experiment · interactive prototype</p>
          <h2 id="closing-title">Make the invisible cost discussable.</h2>
          <VisitProjectLink className={styles.closingLink} />
        </div>
      </section>
      </main>
    </>
  );
}
