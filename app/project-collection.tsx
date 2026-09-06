"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./home.module.css";

const projects = [
  {
    id: "nudge",
    name: "Nudge",
    purpose: "A lighter home. Together.",
    description:
      "A shared place for the tasks, people, and little things that keep a household moving.",
    role: "Product design · Native app · Identity",
    status: "Private beta",
    icon: "/nudge/app-icon.webp",
    image: "/nudge/household.webp",
    kind: "phone",
    detail: "Everyday coordination",
    number: "01",
  },
  {
    id: "world",
    name: "PushedWorld",
    purpose: "Every rep moves you forward.",
    description:
      "Hands-free push-up counting meets a world of progress, rewards, and a coach with character.",
    role: "Product design · Development · Identity",
    status: "iPhone product",
    icon: "/world/app-icon.png",
    image: "/world/path-current.jpg",
    kind: "phone",
    detail: "Movement & motivation",
    number: "02",
  },
  {
    id: "tracer",
    name: "Tracer",
    purpose: "Clear the path to great science.",
    description:
      "An identity and digital experience that connect research security with clarity, openness, and discovery.",
    role: "Identity · Art direction · Digital experience",
    status: "Brand & product",
    icon: "/tracer/logo-glass.png",
    image: "/tracer/landscape.webp",
    kind: "landscape",
    detail: "Research security",
    number: "03",
  },
  {
    id: "abeam",
    name: "aBeam",
    purpose: "Every conversation. Organized.",
    description:
      "An AI copilot concept for turning travel conversations into preferences, context, and next steps.",
    role: "Product concept · Visual identity",
    status: "Concept preview",
    icon: "/abeam/mark.png",
    image: "/abeam/mark.png",
    kind: "mark",
    detail: "AI for travel advisors",
    number: "04",
  },
  {
    id: "crypto-inheritance",
    name: "CryptoCroc",
    purpose: "Make the handoff less fragile.",
    description:
      "A guided legacy planner for organizing crypto holdings and preparing loved ones, with recovery secrets kept offline.",
    role: "Product experience · Working prototype",
    status: "Live planner",
    icon: "/crypto-inheritance/skull.png",
    image: "/crypto-inheritance/mascot.png",
    kind: "character",
    detail: "Trust & digital legacy",
    number: "05",
  },
  {
    id: "equisoft-labs",
    name: "Decision ROI",
    purpose: "Give an invisible cost a number.",
    description:
      "A field experiment exploring the cost of decisions made without the right information at the right moment.",
    role: "Product research · Interactive prototype",
    status: "Field experiment",
    icon: "/equisoft-labs/roi-calculator-rail.png",
    image: "/equisoft-labs/elevate-booth-roi-clean.png",
    kind: "scene",
    detail: "Research through making",
    number: "06",
  },
];
type Project = (typeof projects)[number];
function ProjectArt({
  project,
  mobile = false,
}: {
  project: Project;
  mobile?: boolean;
}) {
  return (
    <div
      className={`${styles.projectArt} ${styles[project.id === "crypto-inheritance" ? "crypto" : project.id === "equisoft-labs" ? "roi" : project.id]}`}
    >
      <span className={styles.artRing} aria-hidden="true" />
      <Image
        className={styles[project.kind]}
        src={project.image}
        alt=""
        width={project.kind === "phone" ? 760 : 1400}
        height={project.kind === "phone" ? 1651 : 1000}
        sizes={
          mobile
            ? "(max-width: 760px) 85vw, 1px"
            : "(max-width: 760px) 1px, 55vw"
        }
      />
      {project.id === "nudge" && (
        <Image
          className={styles.artSticker}
          src="/nudge/medal.webp"
          alt=""
          width={420}
          height={420}
          sizes="130px"
        />
      )}
      {project.id === "world" && (
        <Image
          className={styles.artBuster}
          src="/world/buster-top.webp"
          alt=""
          width={600}
          height={396}
          sizes="240px"
        />
      )}
      {project.id === "tracer" && (
        <Image
          className={styles.artGlass}
          src="/tracer/logo-glass.png"
          alt=""
          width={523}
          height={478}
          sizes="270px"
        />
      )}
      <span className={styles.artLabel}>{project.detail}</span>
    </div>
  );
}
export function ProjectCollection() {
  const [active, setActive] = useState(0);
  const project = projects[active];
  return (
    <section
      id="applications"
      className={styles.projects}
      aria-labelledby="projects-title"
    >
      <div className={styles.sectionTop}>
        <p className={styles.eyebrow}>
          Independent products & selected experiments
        </p>
        <span className={styles.sectionIndex}>02 — Selected work</span>
      </div>
      <div className={styles.projectHeading}>
        <h2 id="projects-title">
          Curiosity,
          <br />
          <em>put into practice.</em>
        </h2>
        <p>
          Different problems. Different worlds.
          <br />
          The same drive to make something useful.
          <span className={styles.desktopHint}>
            Hover or focus to preview. Select a project to explore.
          </span>
        </p>
      </div>
      <div className={styles.collection}>
        <div className={styles.projectList}>
          {projects.map((p, index) => (
            <article
              id={p.id}
              key={p.id}
              className={`${styles.projectItem} ${index === active ? styles.active : ""}`}
            >
              <Link
                className={styles.projectLink}
                href={`/${p.id}`}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
              >
                <span
                  className={`${styles.projectIcon} ${p.id === "tracer" ? styles.glassIcon : ""}`}
                >
                  <Image
                    src={p.icon}
                    alt=""
                    width={64}
                    height={64}
                    sizes="56px"
                  />
                </span>
                <div>
                  <span className={styles.projectName}>
                    {p.name}
                    <small>{p.number}</small>
                  </span>
                  <span className={styles.projectPurpose}>{p.detail}</span>
                </div>
                <span className={styles.openLabel}>Explore</span>
              </Link>
              <div className={styles.mobileProject}>
                <Link href={`/${p.id}`} aria-label={`Explore ${p.name}`}>
                  <ProjectArt project={p} mobile />
                  <div className={styles.mobileCopy}>
                    <h3>{p.purpose}</h3>
                    <p>{p.description}</p>
                    <span>{p.status} · View project</span>
                  </div>
                </Link>
              </div>
            </article>
          ))}
        </div>
        <div className={styles.projectPreview}>
          <Link
            className={styles.previewLink}
            href={`/${project.id}`}
            aria-label={`Explore ${project.name}: ${project.purpose}`}
          >
            <div key={project.id} className={styles.previewContent}>
              <ProjectArt project={project} />
              <div className={styles.previewCopy}>
                <div className={styles.previewMeta}>
                  <span>{project.name}</span>
                  <span>{project.status}</span>
                </div>
                <h3>{project.purpose}</h3>
                <p>{project.description}</p>
                <div className={styles.previewFoot}>
                  <span>{project.role}</span>
                  <strong>Explore project</strong>
                </div>
              </div>
            </div>
          </Link>
          <p className={styles.collectionNote}>
            Six ways of turning a question into something tangible.
          </p>
        </div>
      </div>
    </section>
  );
}
