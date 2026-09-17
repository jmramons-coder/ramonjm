"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  Linkedin01Icon,
  Mail01Icon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { CvDrawer } from "./cv-drawer";

const subscribeToScroll = (onStoreChange: () => void) => {
  window.addEventListener("scroll", onStoreChange, { passive: true });
  return () => window.removeEventListener("scroll", onStoreChange);
};

const getScrollState = () => window.scrollY > 12;
const getServerScrollState = () => false;

export function SiteHeader({
  home = false,
  tone = "light",
  backHref,
  backLabel = "Back to side projects",
  textOnly = false,
}: {
  textOnly?: boolean;
  home?: boolean;
  tone?: "light" | "dark";
  backHref?: string;
  backLabel?: string;
}) {
  const progressRef = useRef<HTMLDivElement>(null);
  const resolvedBackHref = backHref ?? (home ? undefined : "/#applications");

  useEffect(() => {
    if (home) return;
    let frame = 0;
    const update = () => {
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      const progress = distance > 0 ? Math.max(0, Math.min(1, window.scrollY / distance)) : 1;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [home]);

  const isScrolled = useSyncExternalStore(
    subscribeToScroll,
    getScrollState,
    getServerScrollState,
  );
  const [contactOpen, setContactOpen] = useState(false);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contactOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!contactRef.current?.contains(event.target as Node)) {
        setContactOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContactOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [contactOpen]);

  return (
    <header
      className={`site-header site-header--${tone}${isScrolled ? " is-scrolled" : ""}`}
      id={home ? "top" : undefined}
    >
      <div className="header-leading">
        {resolvedBackHref ? (
          <Link
            className="header-back-link"
            href={resolvedBackHref}
            aria-label={backLabel}
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} size={19} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        ) : null}
        <Link
          className="wordmark"
          href={home ? "#top" : "/"}
          aria-label="Ramon JM, home"
        >
          <span>Ramon JM</span>
        </Link>
      </div>
      <div className="header-actions">
        <CvDrawer />
        <div className="contact-menu" ref={contactRef}>
          <button
            className="header-action header-contact"
            type="button"
            aria-expanded={contactOpen}
            aria-controls="contact-menu-list"
            onClick={() => setContactOpen((open) => !open)}
          >
            <span>Contact</span>
            {!textOnly && (
              <span className="header-contact-plane" aria-hidden="true">
                <HugeiconsIcon icon={SentIcon} size={16} strokeWidth={1.8} />
              </span>
            )}
          </button>
          <div
            className={`contact-menu-list${contactOpen ? " is-open" : ""}`}
            id="contact-menu-list"
            role="menu"
            aria-hidden={!contactOpen}
          >
            <a
              href="mailto:jmanuelr.99@gmail.com"
              role="menuitem"
              tabIndex={contactOpen ? 0 : -1}
              onClick={() => setContactOpen(false)}
            >
              <span className="contact-menu-icon" aria-hidden="true">
                <HugeiconsIcon icon={Mail01Icon} size={17} strokeWidth={1.8} />
              </span>
              <span>
                <strong>Email</strong>
                <small>jmanuelr.99@gmail.com</small>
              </span>
            </a>
            <a
              href="https://www.linkedin.com/in/jmanuelr"
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              tabIndex={contactOpen ? 0 : -1}
              onClick={() => setContactOpen(false)}
            >
              <span className="contact-menu-icon" aria-hidden="true">
                <HugeiconsIcon
                  icon={Linkedin01Icon}
                  size={17}
                  strokeWidth={1.8}
                />
              </span>
              <span>
                <strong>LinkedIn</strong>
                <small>Connect professionally</small>
              </span>
            </a>
          </div>
        </div>
      </div>
      {!home && <div className="reading-progress" aria-hidden="true"><div ref={progressRef} className="reading-progress-fill" /></div>}
    </header>
  );
}
