import type { Metadata } from "next";
import Image from "next/image";
import { Inter } from "next/font/google";
import Link from "next/link";
import { SiteHeader } from "../site-header";
import styles from "./tracer.module.css";

export const metadata: Metadata = {
  title: "Tracer — Brand, product & digital experience — Ramon JM",
  description:
    "From a symbol of protection and discovery to a research-security workspace. Explore Tracer's identity, art direction, app, and website.",
  alternates: { canonical: "/tracer" },
};
const inter = Inter({ subsets: ["latin"], display: "swap" });
const website = "https://tracersecurity.ca/";
const embedEnabled = process.env.TRACER_EMBED_ENABLED === "true";
const principles = [
  {
    number: "01",
    name: "Perception",
    asset: "eye",
    text: "The Eye of Horus study explores awareness: looking closer and making the unseen visible.",
  },
  {
    number: "02",
    name: "Direction",
    asset: "path",
    text: "A path runs through the letterform. A visual expression of tracing connections and moving forward.",
  },
  {
    number: "03",
    name: "Protection",
    asset: "shield",
    text: "An enclosing outline lends the mark a protective character while keeping its form open and fluid.",
  },
];
function WebsiteLink() {
  return (
    <a
      className={styles.button}
      href={website}
      target="_blank"
      rel="noopener noreferrer"
    >
      Visit Tracer<span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
export default function TracerProjectPage() {
  return (
    <>
      <SiteHeader tone="dark" textOnly />
      <main className={`${styles.page} ${inter.className}`}>
        <section className={styles.hero} aria-labelledby="tracer-title">
          <Image
            className={styles.heroLandscape}
            src="/tracer/landscape.webp"
            alt=""
            fill
            priority
            sizes="100vw"
          />
          <div className={styles.heroShade} />
          <div className={styles.heroTop}>
            <span>Tracer / Research security</span>
            <span>Identity · Art direction · Digital experience</span>
          </div>
          <div className={styles.heroTitle}>
            <p className={styles.eyebrow}>Protect the possibility.</p>
            <h1 id="tracer-title">
              Clear the path
              <br />
              to great science.
            </h1>
          </div>
          <Image
            className={styles.heroMark}
            src="/tracer/logo-glass.png"
            alt="Tracer's sculptural glass monogram"
            width={523}
            height={478}
            priority
            sizes="(max-width: 700px) 55vw, 36vw"
          />
          <div className={styles.heroBottom}>
            <p>
              A distinctive identity for a platform that helps research teams
              understand who they’re working with—and move forward with greater
              clarity.
            </p>
            <a href="#product">Discover the product</a>
          </div>
        </section>
        <nav className={styles.chapterNav} aria-label="Case study chapters">
          <span>TRACER</span>
          <a href="#vision">Vision</a>
          <a href="#identity">Identity</a>
          <a href="#product">Product</a>
          <a href="#website">Website</a>
        </nav>

        <section id="vision" className={styles.vision}>
          <p className={styles.eyebrow}>01 / The opportunity</p>
          <h2>
            Security that makes
            <br />
            <span>room for discovery.</span>
          </h2>
          <div className={styles.visionBottom}>
            <p>
              Research partnerships are built on possibility. Understanding
              affiliations, funding, and institutional connections is part of
              protecting that possibility. Tracer brings those threads into a
              structured research-security workflow.
            </p>
            <p>
              The creative challenge: give an evidence-driven platform a clear,
              credible identity with enough openness and ambition to speak to
              the world of science.
            </p>
          </div>
          <div className={styles.scope}>
            <span>Visual identity</span>
            <span>Brand world</span>
            <span>Product experience</span>
            <span>Website</span>
          </div>
        </section>

        <section id="identity" className={styles.identity}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>02 / Building the mark</p>
              <h2>
                One symbol.
                <br />
                Several layers of meaning.
              </h2>
            </div>
            <p>
              The early studies connect perception, movement, a path, and
              protection. Those ideas converge in a compact monogram that can
              move from an app icon to an architectural scale.
            </p>
          </div>
          <div className={styles.principles}>
            {principles.map((p) => (
              <article key={p.asset}>
                <div className={styles.principleLabel}>
                  <span>{p.number}</span>
                  <h3>{p.name}</h3>
                </div>
                <Image
                  src={`/tracer/mark-${p.asset}.webp`}
                  alt={`Original ${p.name.toLowerCase()} logo exploration from the Tracer Figma file`}
                  width={560}
                  height={480}
                  sizes="(max-width: 700px) 65vw, 25vw"
                />
                <p>{p.text}</p>
              </article>
            ))}
          </div>
          <details className={styles.development}>
            <summary>Explore the original logo-development board</summary>
            <Image
              src="/tracer/logo-development.webp"
              alt="Original symbol studies connecting the Eye of Horus, movement, path, and shield to the Tracer mark, followed by glass, nature, and outline applications."
              width={3000}
              height={1801}
              sizes="100vw"
            />
          </details>
          <div className={styles.markPair}>
            <div className={styles.flatMark}>
              <span className={styles.eyebrow}>The essential form</span>
              <Image
                src="/tracer/logo-light.png"
                alt="Flat white Tracer monogram"
                width={363}
                height={318}
                sizes="30vw"
              />
              <p>Precision at every scale.</p>
            </div>
            <div className={styles.glassMark}>
              <span className={styles.eyebrow}>The expressive form</span>
              <Image
                src="/tracer/logo-glass.png"
                alt="Transparent glass expression of the same Tracer monogram"
                width={523}
                height={478}
                sizes="40vw"
              />
              <p>Transparency made tangible.</p>
            </div>
          </div>
        </section>

        <section className={styles.brandWorld}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>03 / A world around the mark</p>
              <h2>
                Rigorous by nature.
                <br />
                Open by design.
              </h2>
            </div>
            <p>
              Glass gives transparency a material presence. Architecture brings
              structure. Open landscapes express the possibility behind every
              research partnership.
            </p>
          </div>
          <figure className={styles.architecture}>
            <Image
              src="/tracer/brand-architecture.webp"
              alt="Tracer's white identity against cobalt light and monochrome glass architecture"
              width={2400}
              height={1260}
              sizes="100vw"
            />
          </figure>
          <div className={styles.systemGrid}>
            <div className={styles.typeSpecimen}>
              <p className={styles.eyebrow}>Typography / Inter</p>
              <span className={styles.bigType}>Aa</span>
              <p className={styles.typeLine}>
                Clear thinking.
                <br />
                <strong>Confident expression.</strong>
              </p>
              <div className={styles.specimenFooter}>
                <span>Light / Bold</span>
                <span>Aa Bb Cc 0123</span>
              </div>
            </div>
            <div className={styles.palette}>
              <div>
                <span>Tracer blue</span>
                <strong>#1D54B5</strong>
              </div>
              <div>
                <span>Depth</span>
                <strong>#2557A5</strong>
              </div>
              <div>
                <span>Light & space</span>
                <strong>Clarity in contrast</strong>
              </div>
            </div>
          </div>
          <figure className={styles.guidelines}>
            <Image
              src="/tracer/brand-guidelines.webp"
              alt="Original Tracer guidelines showing the brand cover, purpose statement, and primary identity"
              width={4800}
              height={871}
              sizes="100vw"
            />
            <figcaption>
              From purpose to a coherent visual system.
              <a
                href="/tracer/brand-guidelines.webp"
                target="_blank"
                rel="noopener noreferrer"
              >
                View original guidelines
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </figcaption>
          </figure>
        </section>

        <section className={styles.campaign}>
          <div className={styles.campaignCopy}>
            <p className={styles.eyebrow}>The brand, out in the world</p>
            <h2>
              Partnership.
              <br />
              Transparency.
              <br />
              <em>Progress.</em>
            </h2>
            <p>
              A campaign concept turns a complex category into an invitation:
              clear the path to great science.
            </p>
          </div>
          <figure>
            <Image
              src="/tracer/brand-campaign.webp"
              alt="Outdoor campaign concept with Tracer's glass monogram in a green landscape"
              width={2400}
              height={1600}
              sizes="(max-width: 900px) 100vw, 70vw"
            />
            <figcaption>
              Environmental application / Campaign concept
            </figcaption>
          </figure>
        </section>

        <section id="product" className={styles.product}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>04 / Inside the product</p>
              <h2>
                Complex evidence.
                <br />A clear place to work.
              </h2>
            </div>
            <p>
              The same emphasis on clarity carries into the workspace. Analysts
              can keep a case in context, navigate its evidence, and prepare a
              report for the next conversation.
            </p>
          </div>
          <figure className={styles.workspace}>
            <div className={styles.monitor}>
              <div className={styles.monitorScreen}>
                <a
                  href="/tracer/app-workspace.webp"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View full-size Tracer app screenshot in a new tab"
                >
                  <Image
                    src="/tracer/app-workspace.webp"
                    alt="Actual Tracer app screenshot from Figma, with a case sidebar, report workspace, evidence categories, and HTML and PDF export controls"
                    width={1921}
                    height={858}
                    sizes="(max-width: 1080px) 85vw, 960px"
                    unoptimized
                  />
                </a>
              </div>
              <div className={styles.monitorChin} aria-hidden="true">
                <span>TRACER</span>
              </div>
            </div>
            <div className={styles.monitorStand} aria-hidden="true" />
            <figcaption>
              The Tracer workspace. From case review to a shareable report.{" "}
              <a
                href="/tracer/app-workspace.webp"
                target="_blank"
                rel="noopener noreferrer"
              >
                Inspect full size
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </figcaption>
          </figure>
          <div className={styles.productBenefits}>
            <article>
              <span>01 / Organize</span>
              <h3>Keep the case in view.</h3>
              <p>
                Cases and entities remain within reach alongside the active
                report, keeping the review grounded in its context.
              </p>
            </article>
            <article>
              <span>02 / Understand</span>
              <h3>Give evidence a structure.</h3>
              <p>
                Affiliations, co-authors, funding, and other evidence categories
                give analysts a consistent way to navigate a complex file.
              </p>
            </article>
            <article>
              <span>03 / Communicate</span>
              <h3>Carry the work forward.</h3>
              <p>
                Report controls put copying and HTML or PDF export in the
                workspace, connecting investigation with communication.
              </p>
            </article>
          </div>
        </section>

        <section id="website" className={styles.website}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>05 / The digital front door</p>
              <h2>
                Make the value
                <br />
                visible from the start.
              </h2>
            </div>
            <div>
              <p>
                Before someone enters the workspace, the website makes its
                purpose clear: who can be screened, what a brief contains, and
                how the evidence is presented. The brand sets the tone; product
                examples make the offer concrete.
              </p>
              <WebsiteLink />
            </div>
          </div>
          <div className={styles.websiteFrame}>
            {embedEnabled ? (
              <iframe
                src={website}
                title="Tracer live research-security website"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <a href={website} target="_blank" rel="noopener noreferrer">
                <Image
                  src="/tracer/website.webp"
                  alt="Captured Tracer website homepage with glass architecture, the headline Screen research partners in minutes, and a sample research brief. Opens the live website."
                  width={1280}
                  height={720}
                  sizes="(max-width: 700px) 88vw, 640px"
                  unoptimized
                />
              </a>
            )}
          </div>
          {!embedEnabled && (
            <p className={styles.websiteCaption}>
              tracersecurity.ca / Select the preview to visit the website.
            </p>
          )}
        </section>
        <section className={styles.closing}>
          <Image
            src="/tracer/logo-light.png"
            alt=""
            width={363}
            height={318}
            sizes="100px"
          />
          <p className={styles.eyebrow}>
            From the first impression to the everyday experience.
          </p>
          <h2>
            One clear idea.
            <br />
            From identity to experience.
          </h2>
          <a href="mailto:jmanuelr.99@gmail.com">
            Let’s build something with purpose.
          </a>
        </section>
        <footer className={styles.footer}>
          <span>Tracer / Ramon JM</span>
          <Link href="/#applications">Back to selected work</Link>
        </footer>
      </main>
    </>
  );
}
