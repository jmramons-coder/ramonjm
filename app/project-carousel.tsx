"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./project-carousel.module.css";

const projects = [
  { name: "Nudge", href: "/nudge", kind: "nudge", image: "/nudge/home.webp", detail: "A lighter home. Together.", type: "Product design · Native app", phone: true },
  { name: "PushedWorld", href: "/world", kind: "world", image: "/world/path-current.jpg", detail: "Every rep moves you forward.", type: "Product design · Development", phone: true },
  { name: "Tracer", href: "/tracer", kind: "tracer", image: "/tracer/app-workspace.webp", detail: "Clear the path to great science.", type: "Brand · Digital experience", phone: false },
  { name: "aBeam", href: "/abeam", kind: "abeam", image: "/abeam/mark.png", detail: "Every conversation. Organized.", type: "AI product concept", phone: false },
  { name: "CryptoCroc", href: "/crypto-inheritance", kind: "crypto", image: "/crypto-inheritance/mascot.png", detail: "Plan the handoff.", type: "Digital legacy planner", phone: false },
  { name: "Decision ROI", href: "/equisoft-labs", kind: "roi", image: "/equisoft-labs/app-screenshot.jpg", detail: "Make the cost of a decision visible.", type: "Research · Interactive prototype", phone: false },
];

export function ProjectCarousel() {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  function go(index: number) {
    const el = track.current;
    if (!el) return;
    const target = el.children[index] as HTMLElement;
    const first = el.children[0] as HTMLElement;
    el.scrollTo({ left: target.offsetLeft - first.offsetLeft,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  return (
    <section className={styles.section} aria-labelledby="project-carousel-title" aria-roledescription="carousel">
      <div className={styles.heading}>
        <div><p className="section-pill">Selected projects · 06</p><h2 id="project-carousel-title">Ideas made real.</h2></div>
        <div className={styles.controls}>
          <button type="button" disabled={active === 0} onClick={() => go(active - 1)} aria-controls="project-carousel-track">Previous</button>
          <span aria-live="polite" className={styles.count}>{active + 1} / {projects.length}</span>
          <button type="button" disabled={active === projects.length - 1} onClick={() => go(active + 1)} aria-controls="project-carousel-track">Next</button>
        </div>
      </div>
      <ul id="project-carousel-track" ref={track} className={styles.track} onScroll={() => {
        const el = track.current;
        if (!el) return;
        const items = Array.from(el.children) as HTMLElement[];
        const first = items[0].offsetLeft;
        const nearest = items.reduce((best, item, index) => Math.abs(item.offsetLeft - first - el.scrollLeft) < Math.abs(items[best].offsetLeft - first - el.scrollLeft) ? index : best, 0);
        setActive(nearest);
      }}>
        {projects.map((project, index) => (
          <li key={project.href} className={styles.slide}>
            <Link href={project.href} aria-label={`Explore ${project.name}: ${project.detail}`}>
              <div className={`${styles.art} ${styles[project.kind]}`}>
                <span className={styles.artType}>{project.type}</span>
                <Image className={project.phone ? styles.phone : styles.product} src={project.image} alt="" width={project.phone ? 760 : 1400} height={project.phone ? 1651 : 900} sizes="(max-width: 700px) 75vw, 65vw" />
                {project.kind === "world" && <Image className={styles.character} src="/world/buster-top.webp" alt="" width={600} height={396} sizes="200px" />}
                {project.kind === "nudge" && <Image className={styles.medal} src="/nudge/medal.webp" alt="" width={420} height={420} sizes="100px" />}
              </div>
              <div className={styles.caption}><div><span className={styles.name}>{project.name}</span><p>{project.detail}</p></div><span className={styles.explore}>View project <small>{String(index + 1).padStart(2, "0")}</small></span></div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
