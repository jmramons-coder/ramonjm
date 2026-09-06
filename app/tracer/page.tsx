import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { SiteHeader } from "../site-header";
import styles from "./tracer.module.css";

export const metadata: Metadata = {
  title: "Tracer — Brand vision & website — Ramon JM",
  description: "A visual identity and web experience for research security: Tracer's brand vision, guidelines, and campaign explorations.",
  alternates: { canonical: "/tracer" },
};

const website = "https://tracersecurity.ca/";
// Enable only after Tracer's framing policy allows the portfolio origin.
const embedEnabled = process.env.TRACER_EMBED_ENABLED === "true";

function WebsiteLink({ className }: { className?: string }) {
  return <a className={`${styles.link} ${className ?? ""}`} href={website} target="_blank" rel="noopener noreferrer">
    Visit live website <HugeiconsIcon icon={ArrowUpRight01Icon} size={18} aria-hidden="true" />
    <span className="sr-only"> (opens in a new tab)</span>
  </a>;
}

export default function TracerProjectPage() {
  return <>
    <SiteHeader tone="dark" backHref="/#applications" />
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="tracer-title">
        <div className={styles.heroTop}>
          <p className={styles.eyebrow}>Tracer / Research security</p>
          <span className={styles.discipline}>Brand identity · Art direction · Website</span>
        </div>
        <div className={styles.intro}>
          <h1 id="tracer-title">Clarity for the<br />next discovery.</h1>
          <div className={styles.introCopy}>
            <p>A brand and digital experience for a research-security platform. Connecting the precision of intelligence with the openness of scientific discovery.</p>
            <a className={styles.textLink} href="#website">Explore the website <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <figure className={styles.heroArtwork}>
          <Image src="/tracer/brand-architecture.webp" alt="Tracer's white monogram and wordmark on an electric-blue gradient beside a monochrome glass research building." width={2400} height={1260} priority sizes="100vw" />
          <figcaption><span>01 / Visual identity</span><span>Architecture, transparency, precision.</span></figcaption>
        </figure>
      </section>

      <section className={styles.vision} aria-labelledby="vision-title">
        <p className={styles.eyebrow}>The vision</p>
        <div>
          <h2 id="vision-title">Make trust visible.</h2>
          <p>Research security deals with complex affiliations, networks, and risk. The identity gives that complexity a clear visual language: a distinctive monogram, confident blue, and clean typography.</p>
          <p>Glass brings transparency into the imagery. Architecture suggests structure and rigor; open landscapes make room for the possibility behind every research partnership.</p>
        </div>
      </section>

      <section className={styles.identity} aria-labelledby="identity-title">
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>02 / Brand system</p><h2 id="identity-title">One idea. A consistent identity.</h2></div>
          <p>Purpose, monogram, and wordmark form the foundation of the visual system.</p>
        </div>
        <figure>
          <div className={styles.guidelinesScroll} tabIndex={0} role="region" aria-label="Brand guidelines artwork; scroll horizontally to explore all three panels">
            <Image src="/tracer/brand-guidelines.webp" alt="Three original Tracer brand guideline panels: blue cover, brand purpose, and primary monogram and wordmark usage." width={4800} height={871} sizes="(max-width: 800px) 1200px, 100vw" />
          </div>
          <figcaption className={styles.caption}><span>Selected brand guidelines</span><a href="/tracer/brand-guidelines.webp" target="_blank" rel="noopener noreferrer">View full image <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a></figcaption>
        </figure>
      </section>

      <section className={styles.campaign} aria-labelledby="campaign-title">
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>03 / Brand in context</p><h2 id="campaign-title">Clear the path to great science.</h2></div>
          <p>An outdoor campaign concept brings the glass monogram into an open landscape, pairing research intelligence with a more human sense of progress.</p>
        </div>
        <figure>
          <Image src="/tracer/brand-campaign.webp" alt="Outdoor advertising concept featuring Tracer's glass monogram in a green landscape and the French headline Ouvrez la voie à une science d’excellence." width={2400} height={1600} sizes="100vw" />
          <figcaption className={styles.caption}><span>Environmental brand application</span><span>Campaign concept</span></figcaption>
        </figure>
      </section>

      <section className={styles.website} id="website" aria-labelledby="website-title">
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>04 / Digital experience</p><h2 id="website-title">The identity, in action.</h2></div>
          <div><p>The website introduces individual and organizational screening, shows the evidence behind a brief, and makes the platform’s value tangible.</p><WebsiteLink /></div>
        </div>
        {embedEnabled ? <div className={styles.browser}>
          <div className={styles.browserBar}><span aria-hidden="true">● ● ●</span><span>tracersecurity.ca</span><a href={website} target="_blank" rel="noopener noreferrer">Open website ↗<span className="sr-only"> (opens in a new tab)</span></a></div>
          <iframe src={website} title="Tracer — live research-security website" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
        </div> : <a className={styles.websiteCard} href={website} target="_blank" rel="noopener noreferrer">
          <Image src="/tracer/logo-glass.png" alt="" width={523} height={478} sizes="(max-width: 700px) 180px, 300px" />
          <div><span className={styles.eyebrow}>tracersecurity.ca</span><h3>Screen research partners in minutes.</h3><span className={styles.siteCta}>Explore the live website <span aria-hidden="true">↗</span></span><span className="sr-only"> (opens in a new tab)</span></div>
        </a>}
      </section>
      <footer className={styles.footer}><span>Tracer / Brand vision & website</span><Link href="/#applications">Back to selected work <span aria-hidden="true">↗</span></Link></footer>
    </main>
  </>;
}
