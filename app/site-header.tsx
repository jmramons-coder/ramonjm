"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, SentIcon } from "@hugeicons/core-free-icons";
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
}: {
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

  return (
    <header
      className={`site-header site-header--${tone}${isScrolled ? " is-scrolled" : ""}`}
      id={home ? "top" : undefined}
    >
      <div className="header-leading">
        {backHref ? (
          <Link className="header-back-link" href={backHref} aria-label={backLabel}>
            <HugeiconsIcon
              icon={ArrowLeft02Icon}
              size={19}
              strokeWidth={1.8}
              aria-hidden="true"
            />
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
        <a
          className="header-action header-contact"
          href="mailto:jmanuelr.99@gmail.com"
          aria-label="Email Ramon JM at jmanuelr.99@gmail.com"
        >
          <span>Contact</span>
          <span className="header-contact-plane" aria-hidden="true">
            <HugeiconsIcon icon={SentIcon} size={16} strokeWidth={1.8} />
          </span>
        </a>
      </div>
    </header>
  );
}
