"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, SentIcon } from "@hugeicons/core-free-icons";

export function CvDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && wasOpenRef.current) {
      triggerRef.current?.focus();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  return (
    <div className={`cv-drawer-root${isOpen ? " is-open" : ""}`}>
      <button
        className="cv-drawer-backdrop"
        type="button"
        aria-label="Close CV"
        tabIndex={isOpen ? 0 : -1}
        onClick={() => setIsOpen(false)}
      />

      <button
        ref={triggerRef}
        className="header-action cv-trigger"
        type="button"
        aria-expanded={isOpen}
        aria-controls="cv-drawer"
        onClick={() => setIsOpen(true)}
      >
        CV
      </button>

      <aside
        id="cv-drawer"
        className="cv-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-drawer-title"
        aria-hidden={!isOpen}
      >
        <div className="cv-drawer-header">
          <div>
            <p className="cv-drawer-kicker">A short public CV</p>
            <p className="cv-drawer-updated">Product design · AI · Montreal</p>
          </div>
          <button
            ref={closeButtonRef}
            className="cv-drawer-close"
            type="button"
            aria-label="Close CV"
            tabIndex={isOpen ? 0 : -1}
            onClick={() => setIsOpen(false)}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={19} strokeWidth={1.8} />
          </button>
        </div>

        <div className="cv-drawer-scroll">
          <div className="cv-drawer-intro">
            <h2 id="cv-drawer-title">José Manuel Ramon</h2>
            <p className="cv-drawer-role">Senior Product Designer · AI-native builder</p>
            <p>
              I turn ambiguous problems into clear product logic, useful
              experiences, and working prototypes that teams can ship.
            </p>
          </div>

          <section className="cv-section" aria-labelledby="cv-current-title">
            <p className="cv-section-label" id="cv-current-title">Current</p>
            <div className="cv-section-main">
              <h3>Equisoft</h3>
              <p className="cv-section-meta">Senior Product Designer</p>
              <p>
                Designing enterprise insurance products and AI-assisted
                workflows across strategy, UX, interaction, and prototyping.
              </p>
            </div>
          </section>

          <section className="cv-section" aria-labelledby="cv-focus-title">
            <p className="cv-section-label" id="cv-focus-title">Focus</p>
            <ul className="cv-focus-list">
              <li>Product strategy and framing</li>
              <li>UX and interaction design</li>
              <li>AI-native prototyping</li>
              <li>Designing with product and engineering</li>
            </ul>
          </section>

          <section className="cv-section" aria-labelledby="cv-work-title">
            <p className="cv-section-label" id="cv-work-title">Selected work</p>
            <ul className="cv-work-list">
              <li><span>PushedWorld</span><span>Fitness · iPhone</span></li>
              <li><span>aBeam</span><span>Travel advisor AI</span></li>
              <li><span>Tracer</span><span>Security intelligence</span></li>
              <li><span>CryptoCroc</span><span>Crypto inheritance</span></li>
              <li><span>Equisoft Labs</span><span>Insurance R&amp;D</span></li>
            </ul>
          </section>

          <div className="cv-drawer-footer">
            <p>For the full context, explore the selected work below.</p>
            <a
              className="cv-contact-link"
              href="mailto:jmanuelr.99@gmail.com"
              tabIndex={isOpen ? 0 : -1}
              onClick={() => setIsOpen(false)}
            >
              <span>Get in touch</span>
              <span className="link-icon" aria-hidden="true">
                <HugeiconsIcon icon={SentIcon} size={16} strokeWidth={1.8} />
              </span>
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}
