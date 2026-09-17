import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "./site-header";
import { AiAvatar } from "./ai-avatar";
import { portfolio, projects } from "./portfolio-content";
import styles from "./home.module.css";

const clients = [
  { name: "FolksHR", logo: "/client-folks.svg", detail: "Product design for HR software." },
  { name: "PetalMD", logo: "/client-petalmd.svg", detail: "User research for Quebec’s healthcare system, Canada." },
  { name: "Peak Media", logo: "/client-peak-wordmark.svg", detail: "Immersive experience design for museums." },
];


export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader home />
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <section className={styles.intro} aria-labelledby="page-title">
          <p className={styles.eyebrow}>{portfolio.name} · {portfolio.role}</p>
          <h1 id="page-title">{portfolio.headline}</h1>
          <p>{portfolio.intro[0]}<br />{portfolio.intro[1]}</p>
        </section>

        <section className={styles.section} aria-labelledby="clients-title">
          <h2 id="clients-title">Current & past collaborations</h2>
          <ul className={styles.list}>
            <li className={styles.client}>
              <Image className={styles.clientLogo} src="/equisoft-symbol.svg" alt="" width={44} height={44} />
              <div className={styles.clientBody}>
                <div className={styles.clientHeading}><h3>Equisoft</h3><span className={styles.current}><span aria-hidden="true" />Current</span></div>
                <p>Senior product designer<br />Fintech & insurance · 0-to-1</p>
                <ul className={styles.domains} aria-label="Equisoft product experience">
                  <li><span className={styles.acronym}>CRM</span><span>Customer relationship management</span></li>
                  <li><span className={styles.acronym}>PaaS</span><span>Policy administration</span></li>
                  <li><span className={styles.acronym}>DIT</span><span>Digital insurance tools</span></li>
                  <li><span className={styles.acronym}>CM</span><span>Case management</span></li>
                  <li className={styles.aiRow}><AiAvatar /><span>Agentic solutions & AI integrations</span></li>
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
          <p className={styles.projectNote}>All projects: design & development <span className={styles.buildTag} aria-label="From zero to one">0 <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg> 1</span></p>
          <ul className={styles.list}>
            {projects.map((project) => (
              <li key={project.slug} id={project.slug}>
                <Link className={styles.project} href={`/${project.slug}`}>
                  <Image className={`${styles.projectIcon} ${project.slug === "world" ? styles.rounded : ""}`} src={project.image} alt="" width={44} height={44} sizes="44px" />
                  <div className={styles.projectBody}>
                    <div className={styles.projectHeading}>
                      <h3>{project.name}</h3>
                      {project.slug === "tracer" && <span className={styles.collaboration} title="Design and development by Ramon, with collaborators contributing subject-matter expertise and field contacts.">Collaboration<span className="sr-only">: design and development by Ramon, with collaborators contributing subject-matter expertise and field contacts.</span></span>}
                      {project.slug === "abeam" && <span className={styles.collaboration}>Collaboration</span>}
                    </div>
                    <p>{project.detail}</p>
                  </div>
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
