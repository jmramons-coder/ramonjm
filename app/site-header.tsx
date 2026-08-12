import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon } from "@hugeicons/core-free-icons";
import { CvDrawer } from "./cv-drawer";

export function SiteHeader({
  home = false,
  tone = "light",
}: {
  home?: boolean;
  tone?: "light" | "dark";
}) {
  return (
    <header
      className={`site-header site-header--${tone}`}
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
