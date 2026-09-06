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
        {backHref ? (
          <Link
            className={textOnly ? "header-action" : "header-back-link"}
            href={backHref}
            aria-label={backLabel}
          >
            {textOnly ? (
              backLabel
            ) : (
              <HugeiconsIcon
                icon={ArrowLeft02Icon}
                size={19}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            )}
          </Link>
        ) : null}
        <Link
          className="wordmark"
          href={home ? "#top" : "/"}
          aria-label="Ramon JM, home"
        >
          Ramon JM
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
    </header>
  );
}
