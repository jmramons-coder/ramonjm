import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "../site-header";
import styles from "./nudge.module.css";

export const metadata: Metadata = {
  title: "Nudge — A lighter home, together — Ramon JM",
  description:
    "A household to-do app for iPhone and iPad. Product design, native app experience, and a playful identity built around sharing the everyday load.",
  alternates: { canonical: "/nudge" },
};
function Phone({
  screen,
  alt,
  width,
  height,
  priority = false,
}: {
  screen: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}) {
  return (
    <div className={styles.phone}>
      <Image
        src={`/nudge/${screen}.webp`}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        unoptimized
      />
    </div>
  );
}
export default function NudgePage() {
  return (
    <>
      <SiteHeader textOnly />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.brand}>
              <Image
                src="/nudge/app-icon.webp"
                alt=""
                width={512}
                height={512}
                sizes="56px"
                priority
              />
              <span>Nudge</span>
            </div>
            <p className={styles.eyebrow}>
              Product design · Native app · Brand experience
            </p>
            <h1>
              A lighter home.
              <br />
              <em>Together.</em>
            </h1>
            <p className={styles.lead}>
              For all the little things someone has to remember. Nudge gives a
              household one shared place to turn those thoughts into things
              done.
            </p>
            <div className={styles.heroLinks}>
              <a href="#experience">Explore the experience</a>
              <span>iPhone & iPad / Private beta</span>
            </div>
          </div>
          <div className={styles.heroStage}>
            <span className={styles.orbit} aria-hidden="true" />
            <div className={styles.firstPhone}>
              <Phone
                screen="home"
                alt="Nudge to-do list showing school, dishwasher, and completed trash tasks assigned to household members"
                width={496}
                height={1078}
                priority
              />
            </div>
            <div className={styles.secondPhone}>
              <Phone
                screen="household"
                alt="Nudge household overview with Camille, Alex, and Sam"
                width={760}
                height={1651}
                priority
              />
            </div>
            <Image
              className={styles.heroSticker}
              src="/nudge/medal.webp"
              alt=""
              width={420}
              height={420}
              sizes="130px"
            />
          </div>
        </section>
        <nav className={styles.chapters} aria-label="Nudge case study chapters">
          <span>NUDGE</span>
          <a href="#idea">The idea</a>
          <a href="#experience">Experience</a>
          <a href="#personality">Personality</a>
          <a href="#explore">Explore</a>
        </nav>
        <section id="idea" className={styles.idea}>
          <p className={styles.eyebrow}>01 / The everyday problem</p>
          <h2>
            The task is only part
            <br />
            of the work.
          </h2>
          <div className={styles.ideaBody}>
            <p>
              Remembering what needs doing, deciding who will do it, and asking
              again can become a job of its own. Nudge is built around making
              that everyday coordination more visible and easier to share.
            </p>
            <p>
              The design brings three things into focus: quick capture, clear
              ownership, and a satisfying finish. People stay present in the
              interface, because a household list is as much about coordination
              as it is about tasks.
            </p>
          </div>
          <div className={styles.principles}>
            <div>
              <span>01</span>
              <h3>Get it out of your head.</h3>
              <p>Give a passing thought somewhere to go.</p>
            </div>
            <div>
              <span>02</span>
              <h3>Make the next step clear.</h3>
              <p>See the task, the person, and the timing.</p>
            </div>
            <div>
              <span>03</span>
              <h3>Let done feel done.</h3>
              <p>Acknowledge completion and leave room to undo.</p>
            </div>
          </div>
        </section>
        <section id="experience" className={styles.capture}>
          <div className={styles.captureArt}>
            <Image
              src="/nudge/voice.webp"
              alt="Nudge campaign artwork of a woman capturing a thought on her phone"
              width={900}
              height={1350}
              sizes="(max-width: 700px) 70vw, 400px"
            />
            <span className={styles.speech}>“Take out the trash.”</span>
          </div>
          <div className={styles.captureCopy}>
            <p className={styles.eyebrow}>02 / From thought to task</p>
            <h2>
              Say it once.
              <br />
              Share the load.
            </h2>
            <p>
              Voice capture helps catch the thought while it is still fresh. A
              visible assignee turns a general reminder into a clear next
              action. Completion closes the loop, with Undo close at hand.
            </p>
            <p className={styles.note}>
              The recording shows the native app with an illustrative
              voice-capture sequence and a fictional household.
            </p>
          </div>
          <figure className={styles.demo}>
            <div className={styles.phone}>
              <video
                controls
                playsInline
                preload="none"
                poster="/nudge/home.webp"
                width={496}
                height={1080}
                aria-label="Nudge demo: capture Take out the trash, assign it to Alex, create it, and mark it complete"
              >
                <source src="/nudge/demo.mp4" type="video/mp4" />
                <a href="/nudge/demo.mp4">Watch the Nudge demo</a>
              </video>
            </div>
            <figcaption>
              Capture. Assign. Complete.
              <br />
              Play the app walkthrough.
            </figcaption>
          </figure>
        </section>
        <section className={styles.household}>
          <div className={styles.householdCopy}>
            <p className={styles.eyebrow}>03 / Designed around people</p>
            <h2>
              A shared list.
              <br />A familiar face.
            </h2>
            <p>
              The household view makes the people behind the tasks visible.
              Profiles, assignment, and activity give shared work a human
              context, while the task list stays focused on what needs doing.
            </p>
            <div className={styles.detail}>
              <h3>A place for everyone.</h3>
              <p>
                Tasks can be left for anyone or assigned to a household member.
                Invitations connect people to the same household list.
              </p>
            </div>
            <div className={styles.detail}>
              <h3>Personality with a purpose.</h3>
              <p>
                Recognizable avatars help distinguish people at a glance. The
                bright primary action keeps adding a task easy to find.
              </p>
            </div>
          </div>
          <div className={styles.householdStage}>
            <Phone
              screen="household"
              alt="Actual Nudge household screen showing household activity and three illustrated member profiles"
              width={760}
              height={1651}
            />
            <Image
              src="/nudge/broom.webp"
              alt=""
              width={420}
              height={420}
              sizes="180px"
            />
          </div>
        </section>
        <section id="personality" className={styles.personality}>
          <div className={styles.personalityIntro}>
            <p className={styles.eyebrow}>
              04 / A little more life in the everyday
            </p>
            <h2>
              Useful can
              <br />
              have personality.
            </h2>
            <p>
              Purple gives Nudge its voice. Lime makes the next action easy to
              spot. Dimensional stickers bring a playful note to ordinary
              household work, while the app keeps tasks and people at the
              center.
            </p>
          </div>
          <div className={styles.brandAssets}>
            <Image
              src="/nudge/mark.webp"
              alt="Nudge's dimensional lime checkmark with purple highlights"
              width={360}
              height={360}
              sizes="(max-width: 700px) 40vw, 250px"
            />
            <Image
              src="/nudge/medal.webp"
              alt="Colorful Nudge reward medal artwork"
              width={420}
              height={420}
              sizes="(max-width: 700px) 35vw, 220px"
            />
            <Image
              src="/nudge/broom.webp"
              alt="Playful dimensional broom from Nudge's household artwork"
              width={420}
              height={420}
              sizes="(max-width: 700px) 35vw, 220px"
            />
          </div>
        </section>
        <section className={styles.focus}>
          <figure>
            <Image
              src="/nudge/family.webp"
              alt="Nudge campaign scene showing a focus timer on a phone in a calm kitchen"
              width={1120}
              height={1400}
              sizes="(max-width: 700px) 100vw, 50vw"
            />
            <figcaption>
              Campaign artwork / Bringing the product into everyday life.
            </figcaption>
          </figure>
          <div>
            <p className={styles.eyebrow}>05 / One thing at a time</p>
            <h2>
              Less looking.
              <br />
              More doing.
            </h2>
            <p>
              An optional focus timer gives one task its own space. A clear
              countdown and completion action keep the experience centered on
              finishing, then getting back to the day.
            </p>
            <div className={styles.timer}>
              <Phone
                screen="timer"
                alt="Nudge focus timer for Tidy your room, with a countdown, pause control, and Complete task button"
                width={440}
                height={956}
              />
            </div>
          </div>
        </section>
        <section id="explore" className={styles.explore}>
          <Image
            src="/nudge/app-icon.webp"
            alt="Nudge app icon"
            width={512}
            height={512}
            sizes="80px"
          />
          <p className={styles.eyebrow}>From the app to the first impression</p>
          <h2>
            Small tasks.
            <br />A little more room for life.
          </h2>
          <p>
            The website carries the same promise through real app demonstrations
            and everyday household scenes. Nudge is currently presented as a
            private beta.
          </p>
          <a
            className={styles.button}
            href="https://nudge-launch.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore the Nudge website
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </section>
        <footer className={styles.footer}>
          <Link href="/#applications">Back to selected work</Link>
          <a href="mailto:jmanuelr.99@gmail.com">
            Let’s make something useful.
          </a>
        </footer>
      </main>
    </>
  );
}
