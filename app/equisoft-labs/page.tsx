import type { Metadata } from "next";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { SiteHeader } from "../site-header";
import styles from "./equisoft-labs.module.css";

export const metadata: Metadata = {
  title: "Decision ROI at Elevate — Ramon JM",
  description:
    "A field experiment at Elevate about the cost of making decisions without the right information at the right moment.",
  alternates: { canonical: "/equisoft-labs" },
};

const decisionInputs = [
  {
    number: "01",
    label: "Work hours",
    appLabel: "Time in the decision",
    value: "40 h",
    description: "How much time moves through the decision before it lands.",
    level: "One",
  },
  {
    number: "02",
    label: "Team size",
    appLabel: "People affected",
    value: "06",
    description: "How far one missing piece of context travels across a team.",
    level: "Two",
  },
  {
    number: "03",
    label: "Critical decisions",
    appLabel: "High-impact moments",
    value: "12",
    description: "The choices where having the right information changes the outcome.",
    level: "Three",
  },
  {
    number: "04",
    label: "Delayed decisions",
    appLabel: "Waiting on context",
    value: "04",
    description: "The moments where a lack of context turns into visible cost.",
    level: "Four",
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
        <section className={styles.questionHero} aria-labelledby="page-title">
          <div className={styles.questionHeroInner}>
            <p className={styles.eyebrow}>Elevate / field experiment</p>
            <h1 id="page-title">
              <span>How much does a decision cost</span>
              <span>when information arrives too late?</span>
            </h1>
            <p className={styles.heroSummary}>
              At Elevate, insurance and fintech leaders gathered to talk about
              what comes next. We used the booth to start a different kind of
              conversation: what happens when the right information is not
              there at the moment someone needs to act?
            </p>
            <div className={styles.heroMeta} aria-label="Project details">
              <span>Booth activation</span>
              <span>Decision ROI</span>
              <span>Product research</span>
            </div>
          </div>
        </section>

        <section className={styles.storySection} aria-labelledby="story-title">
          <div className={styles.sectionLead}>
            <p>Start with the story</p>
            <h2 id="story-title">We made a product question physical.</h2>
            <span>
              The booth had two goals: spark wondering, then gather honest
              feedback about centralisation, data, and the moments where an
              AMS should make context easier to find.
            </span>
          </div>

          <div className={styles.sceneStack}>
            <article className={styles.scene}>
              <div className={styles.sceneImage}>
                <Image
                  src="/equisoft-labs/elevate-booth.png"
                  alt="People gathered around a blank screen and tablet at a pale blue Elevate booth"
                  width={1586}
                  height={992}
                  sizes="(max-width: 780px) 100vw, 58vw"
                />
              </div>
              <div className={styles.sceneCopy}>
                <p>01 / Spark wondering</p>
                <h3>Give the invisible cost somewhere to land.</h3>
                <span>
                  People gathered around one quiet surface. The screen stayed
                  blank on purpose; the conversation started with their own
                  experience, not a product pitch.
                </span>
                <dl className={styles.sceneDetail}>
                  <div>
                    <dt>Goal</dt>
                    <dd>Make the question feel close.</dd>
                  </div>
                </dl>
              </div>
            </article>

            <article className={`${styles.scene} ${styles.sceneReverse}`}>
              <div className={styles.sceneImage}>
                <Image
                  src="/equisoft-labs/elevate-balloon-wall.png"
                  alt="Over-the-shoulder view of a dart aimed at a compact pale blue balloon wall with a coral triangle"
                  width={1568}
                  height={1003}
                  sizes="(max-width: 780px) 100vw, 58vw"
                />
              </div>
              <div className={styles.sceneCopy}>
                <p>02 / Gather better questions</p>
                <h3>Turn a reaction into product direction.</h3>
                <span>
                  A small field of balloons gave people a simple action to
                  take. The dart became a prompt for talking about what should
                  be centralised, connected, and visible sooner.
                </span>
                <dl className={styles.sceneDetail}>
                  <div>
                    <dt>Goal</dt>
                    <dd>Hear where data gets stuck.</dd>
                  </div>
                </dl>
              </div>
            </article>
          </div>

          <div className={styles.storyQuestion}>
            <p>The question we carried forward</p>
            <blockquote>
              How could the right information arrive before the decision gets
              expensive?
            </blockquote>
          </div>
        </section>

        <section className={styles.prototypeSection} aria-labelledby="prototype-title">
          <div className={styles.sectionLead}>
            <p>Then show the product</p>
            <h2 id="prototype-title">We gave the conversation a number.</h2>
            <span>
              Decision ROI turns the feeling of delay into a model people can
              adjust together. The live prototype lets the conversation move.
            </span>
          </div>

          <div className={styles.prototypeBoard}>
            <iframe
              src="https://www.equisoftlabs.com/"
              title="Interactive Equisoft Labs Decision ROI prototype"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="fullscreen"
            />
          </div>
        </section>

        <section className={styles.inputsSection} aria-labelledby="inputs-title">
          <div className={styles.sectionLead}>
            <p>Inside the model</p>
            <h2 id="inputs-title">Four inputs. One conversation.</h2>
            <span>
              The controls stay simple because the value is in the discussion:
              time, people, impact, and the cost of waiting for context.
            </span>
          </div>

          <ol className={styles.inputList}>
            {decisionInputs.map((input) => (
              <li className={styles.inputCard} key={input.number}>
                <div className={styles.inputCardHeader}>
                  <span className={styles.inputNumber}>{input.number}</span>
                  <div>
                    <p>{input.appLabel}</p>
                    <h3>{input.label}</h3>
                  </div>
                  <div className={styles.inputControl}>
                    <span
                      className={styles.inputDial}
                      data-level={input.level}
                      aria-hidden="true"
                    />
                    <strong>{input.value}</strong>
                  </div>
                </div>
                <span className={styles.inputDescription}>{input.description}</span>
              </li>
            ))}
            <li className={`${styles.inputCard} ${styles.outputCard}`}>
              <div className={styles.outputCopy}>
                <p>Example output</p>
                <h3>Make the cost visible.</h3>
                <span>
                  A shared set of inputs becomes a number the room can react
                  to, question, and carry forward.
                </span>
              </div>
              <div
                className={styles.outputResult}
                aria-label="Example annual cost of waiting: 105,000 dollars"
              >
                <span className={styles.outputResultLabel}>
                  Estimated annual impact
                </span>
                <span className={styles.outputAmountGhost} aria-hidden="true">
                  $105,000
                </span>
                <strong className={styles.outputAmount}>$105,000</strong>
              </div>
            </li>
          </ol>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title">
          <p>From question to direction</p>
          <h2 id="closing-title">A small intervention can open a better product conversation.</h2>
          <span>
            Elevate gave Equisoft Lab a shared language for a problem that is
            usually hard to see: the cost of waiting for context.
          </span>
          <VisitProjectLink className={styles.closingLink} />
        </section>
      </main>
    </>
  );
}
