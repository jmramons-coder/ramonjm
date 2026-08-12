import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";
import { InteractivePreview } from "../interactive-preview";
import styles from "./crypto-inheritance.module.css";

export const metadata: Metadata = {
  title: "CryptoCroc Legacy Planner — Ramon JM",
  description:
    "A guided crypto legacy planner for organizing holdings, preparing loved ones, and keeping recovery secrets offline.",
  alternates: { canonical: "/crypto-inheritance" },
};

export default function CryptoInheritanceProjectPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.backLink} href="/#applications">
          <HugeiconsIcon
            icon={ArrowLeft02Icon}
            size={17}
            strokeWidth={1.8}
          />
          <span>Selected work</span>
        </Link>
      </header>

      <section
        className={styles.hero}
        aria-labelledby="crypto-inheritance-title"
      >
        <div className={styles.copy}>
          <Image
            className={styles.logo}
            src="/crypto-inheritance/logo.png"
            alt="CryptoCroc"
            width={1024}
            height={1024}
            sizes="(max-width: 700px) 88px, 116px"
            priority
          />
          <p className={styles.eyebrow}>Crypto legacy planner</p>
          <h1 id="crypto-inheritance-title">
            <span>Your crypto</span>
            <span>should outlive you.</span>
          </h1>
          <div className={styles.description}>
            <p>
              CryptoCroc helps people document holdings, prepare their loved
              ones, and rehearse the handoff before it matters.
            </p>
            <p>
              Recovery secrets stay outside the planner, while the finished
              organizer can be exported for offline reference.
            </p>
          </div>
          <a
            className={styles.siteLink}
            href="https://crypto-inheritance.xyz/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Visit CryptoCroc</span>
            <HugeiconsIcon
              icon={ArrowUpRight01Icon}
              size={17}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>

        <div className={styles.visual}>
          <span className={styles.glow} aria-hidden="true" />
          <Image
            className={styles.mascot}
            src="/crypto-inheritance/mascot.png"
            alt="CryptoCroc holding a wallet and a Bitcoin coin"
            width={1432}
            height={1432}
            sizes="(max-width: 900px) 92vw, 52vw"
            priority
          />
        </div>
      </section>

      <section
        className={styles.livePreviewSection}
        aria-labelledby="crypto-preview-title"
      >
        <div className={styles.livePreviewCopy}>
          <p>Try the live planner</p>
          <h2 id="crypto-preview-title">Make the handoff less fragile.</h2>
          <span>
            Explore the flow directly: organize what matters, prepare the
            people you trust, and keep recovery secrets outside the plan.
          </span>
        </div>
        <InteractivePreview
          className={styles.livePreviewFrame}
          src="https://crypto-inheritance.xyz/"
          title="Interactive CryptoCroc inheritance planner"
          hostname="crypto-inheritance.xyz"
        />
      </section>
    </main>
  );
}
