"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon } from "@hugeicons/core-free-icons";
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
}: {
  home?: boolean;
  tone?: "light" | "dark";
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
      <Link
        className="wordmark"
        href={home ? "#top" : "/"}
        aria-label="Ramon JM, home"
      >
        Ramon JM
      </Link>
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
