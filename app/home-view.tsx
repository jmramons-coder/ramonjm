"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "./site-header";
import { ProjectPlayground } from "./project-playground";
import {
  ProfileCard,
  CurrentWorkCard,
  TodoCard,
  ClientsCard,
  LocationCard,
} from "./personal-bento";
import { FeaturedPresentation } from "./featured-presentation";
import styles from "./home-view.module.css";

type PortfolioTheme = "light" | "dark";

export function HomeView({ initialTheme }: { initialTheme: PortfolioTheme }) {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    const previous = meta?.content;
    if (meta) meta.content = theme === "dark" ? "#000000" : "#f1f1f0";
    return () => {
      if (meta && previous) meta.content = previous;
    };
  }, [theme]);

  function changeTheme() {
    const next: PortfolioTheme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.cookie = `portfolio-theme=${next}; path=/; max-age=31536000; SameSite=Lax`;
  }

  useEffect(() => {
    let frame = 0;
    const followHash = () => {
      if (!window.location.hash || window.location.hash === "#top") return;
      let targetId: string;
      try {
        targetId = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }
      // Old written-portfolio bookmarks now lead to the current project grid.
      if (
        [
          "list-content",
          "explorations",
          "nudge",
          "world",
          "tracer",
          "abeam",
          "crypto-inheritance",
          "equisoft-labs",
          "case-management",
        ].includes(targetId)
      ) {
        targetId = "applications";
      }
      const target = document.getElementById(targetId);
      if (!target) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        target.scrollIntoView({ block: "start", behavior: "instant" });
        if (targetId === "playground-content") {
          target.focus({ preventScroll: true });
        }
      });
    };
    followHash();
    window.addEventListener("hashchange", followHash);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", followHash);
    };
  }, []);

  const themeControl = (
    <button
      type="button"
      className={styles.themeButton}
      onClick={changeTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {theme === "dark" ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M20.8 13.2A8.9 8.9 0 0 1 10.8 3.2 9 9 0 1 0 20.8 13.2Z" />
        )}
      </svg>
      <span
        role="tooltip"
        className={styles.controlTooltip}
      >{`Switch to ${theme === "dark" ? "light" : "dark"} mode`}</span>
    </button>
  );

  return (
    <div className={styles.shell} data-portfolio-theme={theme}>
      <a className="skip-link" href="#playground-content">
        Skip to content
      </a>
      <SiteHeader
        home
        textOnly
        beforeActions={
          <div className={styles.displayControls}>{themeControl}</div>
        }
      />
      <div className={styles.dashboardHeader}>
        <p>Selected work & a few things about me</p>
      </div>
      <div id="portfolio-content" className={styles.content}>
        <main
          id="playground-content"
          className={styles.playground}
          tabIndex={-1}
          aria-labelledby="portfolio-intro-title"
        >
          <section
            id="portfolio-intro"
            className={styles.introBoard}
            aria-label="Introduction and featured work"
          >
            <div className={`${styles.introSlot} ${styles.introProfile}`}>
              <ProfileCard />
            </div>
            <div className={`${styles.introSlot} ${styles.introFeatured}`}>
              <FeaturedPresentation paused={false} />
            </div>
            <div className={`${styles.introSlot} ${styles.introTodo}`}>
              <TodoCard paused={false} />
            </div>
            <div className={`${styles.introSlot} ${styles.introCurrent}`}>
              <CurrentWorkCard paused={false} />
            </div>
            <div className={`${styles.introSlot} ${styles.introClients}`}>
              <ClientsCard paused={false} />
            </div>
            <div className={`${styles.introSlot} ${styles.introLocation}`}>
              <LocationCard paused={false} />
            </div>
          </section>
          <section
            id="applications"
            aria-labelledby="projects-title"
            className={styles.stage}
          >
            <div className={styles.projectsHeading}>
              <h2 id="projects-title">Selected work</h2>
            </div>
            <ProjectPlayground paused={false} />
          </section>
          <footer className={styles.footer}>
            <div className={styles.footerBottom}>
              <span>Ramon JM · Design, strategy, AI &amp; passion.</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
