import { SiteHeader } from "./site-header";
import { ProjectCollection } from "./project-collection";
import styles from "./home.module.css";

const studies = [
  {
    id: "workbench",
    label: "01 / Operational workbenches",
    title: "Make the next action obvious.",
    text: "Dense information needs a hierarchy. Status, ownership, and the next decision should be visible before someone opens a record.",
  },
  {
    id: "configuration",
    label: "02 / Configuration & systems",
    title: "Show the consequence of a change.",
    text: "A valid input can still create an invalid combination. Dependencies and review belong in the workflow, before a change is committed.",
  },
  {
    id: "intelligence",
    label: "03 / AI-assisted workflows",
    title: "Keep judgment with the person.",
    text: "An answer is only useful if someone can assess it. Evidence, uncertainty, and a clear review step help people stay in control.",
  },
];

function InterfaceStudy({ kind }: { kind: string }) {
  return (
    <div className={styles.interface} aria-hidden="true">
      <div className={styles.uiBar}>
        <span className={styles.uiBrand} />{" "}
        <span>
          {kind === "workbench"
            ? "Operations"
            : kind === "configuration"
              ? "Product configuration"
              : "Review workspace"}
        </span>
        <span className={styles.uiAvatar}>JM</span>
      </div>
      {kind === "workbench" ? (
        <div className={styles.uiBody}>
          <div className={styles.uiTitle}>
            Your work, in view.<span>Today · 6 items</span>
          </div>
          <div className={styles.uiMetrics}>
            <div>
              <b>06</b>
              <span>Assigned</span>
            </div>
            <div>
              <b>02</b>
              <span>Needs review</span>
            </div>
            <div>
              <b>04</b>
              <span>Ready</span>
            </div>
          </div>
          <div className={styles.uiTable}>
            <div>
              <b>Case</b>
              <b>Owner</b>
              <b>Status</b>
            </div>
            <div>
              <span>Coverage review</span>
              <span>Alex</span>
              <em>Review</em>
            </div>
            <div>
              <span>New application</span>
              <span>Sam</span>
              <em>Ready</em>
            </div>
            <div>
              <span>Policy update</span>
              <span>Jo</span>
              <em>Ready</em>
            </div>
          </div>
          <div className={styles.uiFoot}>
            Next action <strong>Review supporting documents</strong>
          </div>
        </div>
      ) : kind === "configuration" ? (
        <div className={styles.uiBody}>
          <div className={styles.uiTitle}>
            A change, with context.<span>Draft configuration</span>
          </div>
          <div className={styles.uiSteps}>
            <b>1 Details</b>
            <b>2 Rules</b>
            <span>3 Review</span>
          </div>
          <div className={styles.uiField}>
            <span>Eligibility rule</span>
            <strong>
              Standard coverage <i>Enabled</i>
            </strong>
          </div>
          <div className={styles.uiDependency}>
            <span className={styles.uiDot} />
            <div>
              <b>One dependency to review</b>
              <span>This rule affects 2 related options.</span>
            </div>
          </div>
          <div className={styles.uiFoot}>
            Before publishing <strong>Compare proposed changes</strong>
          </div>
        </div>
      ) : (
        <div className={styles.uiBody}>
          <div className={styles.uiTitle}>
            Evidence before action.<span>Assisted review · Draft</span>
          </div>
          <div className={styles.uiAnswer}>
            <span>Suggested summary</span>
            <p>
              Two documents support this update. One detail needs your
              confirmation.
            </p>
            <div>
              <b>Source 01</b>
              <b>Source 02</b>
            </div>
          </div>
          <div className={styles.uiReview}>
            <span className={styles.uiDot} />
            <strong>Confirm the effective date</strong>
            <span>Needs review</span>
          </div>
          <div className={styles.uiFoot}>
            Human decision <strong>Review, edit, then approve</strong>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader home textOnly />
      <main className={styles.page} id="main-content" tabIndex={-1}>
        <section className={styles.hero} aria-labelledby="page-title">
          <div className={styles.heroMeta}>
            <span>José Manuel Ramon / Product designer</span>
            <span>Based in Québec City · Open to new opportunities</span>
          </div>
          <div className={styles.heroGrid}>
            <div>
              <h1 id="page-title">
                Complex systems.
                <br />
                Human experiences.
                <br />
                <em>Ideas made real.</em>
              </h1>
              <p className={styles.intro}>
                Seven years designing across enterprise software and independent
                products. I connect product thinking, interaction design, and
                code to turn an idea into something people can use.
              </p>
              <a className={styles.primaryLink} href="#applications">
                Explore my projects <span>06</span>
              </a>
            </div>
            <aside className={styles.heroNote}>
              <span className={styles.noteLabel}>
                A little about my practice
              </span>
              <div className={styles.years}>
                7
                <span>
                  years of
                  <br />
                  product design
                </span>
              </div>
              <p>
                Complex fintech by day.
                <br />
                Independent ideas brought to life.
              </p>
              <div className={styles.noteBottom}>
                <span className={styles.statusDot} />
                <span>Strategy, craft, and a builder’s curiosity.</span>
              </div>
            </aside>
          </div>
        </section>

        <section
          className={styles.enterprise}
          aria-labelledby="enterprise-title"
        >
          <div className={styles.sectionTop}>
            <p className={styles.eyebrow}>
              Professional practice / Confidential work
            </p>
            <span className={styles.sectionIndex}>01 — Experience</span>
          </div>
          <div className={styles.enterpriseHeading}>
            <h2 id="enterprise-title">
              The complexity
              <br />
              <em>behind the clarity.</em>
            </h2>
            <p>
              Much of my professional work lives inside fintech and insurance
              systems I can’t show publicly. These are the kinds of problems I
              work through: information-heavy workbenches, connected rules, and
              decisions that need context.
            </p>
          </div>
          <p className={styles.disclosure}>
            Illustrative interface studies with fictional data. Not employer
            product screens.
          </p>
          <div className={styles.studyGrid}>
            {studies.map((study) => (
              <article key={study.id}>
                <InterfaceStudy kind={study.id} />
                <div className={styles.studyCopy}>
                  <p>{study.label}</p>
                  <h3>{study.title}</h3>
                  <span>{study.text}</span>
                </div>
              </article>
            ))}
          </div>
          <details className={styles.teamDetails}>
            <summary>
              How I work inside teams <span aria-hidden="true">+</span>
            </summary>
            <div>
              <p>
                I partner with product and engineering from the initial question
                through interaction design and prototyping. Working across
                enterprise domains means connecting individual screens to the
                rules, roles, and processes around them.
              </p>
              <p>
                I’ve also led an AI committee and collaborated across teams on
                AI and agentic capabilities. I can discuss my role and approach
                in an interview, within the boundaries of confidentiality.
              </p>
            </div>
          </details>
        </section>

        <ProjectCollection />

        <section className={styles.about} aria-labelledby="about-title">
          <div>
            <p className={styles.eyebrow}>The way I work</p>
            <h2 id="about-title">
              A thoughtful partner.
              <br />
              <em>A hands-on builder.</em>
            </h2>
          </div>
          <div className={styles.aboutCopy}>
            <p>
              I like being close to the whole problem: understanding what
              matters, shaping the experience, and making the behavior tangible
              enough to discuss, test, and improve.
            </p>
            <p>
              Enterprise work has taught me to work with complexity and across
              teams. Independent projects give me room to take ownership across
              product, identity, and implementation.
            </p>
            <div className={styles.practiceTags}>
              <span>Product framing</span>
              <span>Interaction design</span>
              <span>Working prototypes</span>
              <span>Design & development</span>
            </div>
          </div>
        </section>
        <footer className={styles.footer}>
          <div className={styles.sectionTop}>
            <p className={styles.eyebrow}>Have a problem worth exploring?</p>
            <span>Let’s talk.</span>
          </div>
          <h2>
            Make the next
            <br />
            <em>useful thing.</em>
          </h2>
          <div className={styles.footerLinks}>
            <a href="mailto:jmanuelr.99@gmail.com">Get in touch</a>
            <a
              href="https://www.linkedin.com/in/jmanuelr"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn<span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a href="#top">Back to top</a>
          </div>
          <div className={styles.footerMeta}>
            <span>José Manuel Ramon</span>
            <span>Product design · Québec City</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </footer>
      </main>
    </>
  );
}
