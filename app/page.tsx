import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "./site-header";
import { AiAvatar } from "./ai-avatar";
import styles from "./home.module.css";

const clients = [
  { name: "FolksHR", logo: "/client-folks.svg", detail: "Product design for HR software." },
  { name: "PetalMD", logo: "/client-petalmd.svg", detail: "User research for Quebec’s healthcare system, Canada." },
  { name: "Peak Media", logo: "/client-peak-wordmark.svg", detail: "Immersive experience design for museums." },
];
const projects = [
  { name: "Nudge", slug: "nudge", image: "/nudge/mark.webp", detail: "A lighter home, together.", discipline: "Product & brand" },
  { name: "PushedWorld", slug: "world", image: "/world/app-icon.png", detail: "Making every push-up count.", discipline: "Design & development" },
  { name: "Tracer", slug: "tracer", image: "/tracer/logo-glass.png", detail: "Due diligence software for research partners and company audits.", discipline: "Brand & website" },
  { name: "aBeam", slug: "abeam", image: "/abeam/mark.png", detail: "Organizing conversations for travel agencies.", discipline: "AI product concept" },
  { name: "CryptoCroc", slug: "crypto-inheritance", image: "/crypto-inheritance/skull.png", detail: "A plan for your digital legacy.", discipline: "Product concept" },
  { name: "Decision ROI", slug: "equisoft-labs", image: "/equisoft-labs/roi-calculator-rail.png", detail: "Making the cost of decisions visible.", discipline: "Interactive prototype" },
];

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader home />
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <section className={styles.intro} aria-labelledby="page-title">
          <p className={styles.eyebrow}>Ramon JM · Senior product designer</p>
          <h1 id="page-title">I design useful things.</h1>
          <p>Complex products at work. Independent ideas brought to life.</p>
        </section>

        <section className={styles.section} aria-labelledby="clients-title">
          <h2 id="clients-title">Clients I’ve worked with</h2>
          <ul className={styles.list}>
            <li className={styles.client}>
              <Image className={styles.clientLogo} src="/equisoft-symbol.svg" alt="" width={44} height={44} />
              <div className={styles.clientBody}>
                <h3>Equisoft</h3>
                <p>Senior product designer · Fintech & insurance · 0-to-1</p>
                <ul className={styles.domains} aria-label="Equisoft product experience">
                  <li>Customer relationship management</li>
                  <li>Policy administration</li>
                  <li>Digital insurance tools</li>
                  <li>Case management</li>
                  <li className={styles.aiRow}><AiAvatar />Agentic solutions</li>
                  <li>AI integrations</li>
                </ul>
              </div>
            </li>
            {clients.map((client) => (
              <li className={styles.client} key={client.name}>
                <Image className={`${styles.clientLogo} ${client.name === "PetalMD" ? styles.petalLogo : ""}`} src={client.logo} alt="" width={44} height={44} unoptimized />
                <div className={styles.clientBody}><h3>{client.name}</h3><p>{client.detail}</p></div>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section} id="applications" aria-labelledby="projects-title">
          <h2 id="projects-title">Side projects</h2>
          <ul className={styles.list}>
            {projects.map((project) => (
              <li key={project.slug} id={project.slug}>
                <Link className={styles.project} href={`/${project.slug}`}>
                  <Image className={`${styles.projectIcon} ${project.slug === "world" ? styles.rounded : ""}`} src={project.image} alt="" width={44} height={44} sizes="44px" />
                  <div className={styles.projectBody}><h3>{project.name}</h3><p>{project.detail}</p></div>
                  <span className={styles.discipline}>{project.discipline}</span>
                  <span className={styles.view} aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <footer className={styles.footer}>
          <p>Have something in mind?</p>
          <a href="https://www.linkedin.com/in/jmanuelr" target="_blank" rel="noopener noreferrer">Let’s talk<span className="sr-only"> on LinkedIn (opens in a new tab)</span></a>
          <small>© {new Date().getFullYear()} Ramon JM</small>
        </footer>
      </main>
    </>
  );
}
