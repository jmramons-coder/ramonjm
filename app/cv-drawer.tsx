"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, SentIcon } from "@hugeicons/core-free-icons";

export function CvDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const dialogRef = useRef<HTMLElement>(null);
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
      if (event.key === "Tab") {
        const elements = dialogRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
        if (!elements?.length) return;
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
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
    <>
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

      {isMounted
        ? createPortal(
            <div className={`cv-drawer-root${isOpen ? " is-open" : ""}`} inert={!isOpen}>
              <button
                className="cv-drawer-backdrop"
                type="button"
                aria-label="Close CV"
                tabIndex={-1}
                onClick={() => setIsOpen(false)}
              />

              <aside
                ref={dialogRef}
                id="cv-drawer"
                className="cv-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="cv-drawer-title"
                aria-hidden={!isOpen}
              >
                <div className="cv-drawer-header">
                  <div>
                    <p className="cv-drawer-updated">
                      Product design · AI · Quebec City
                    </p>
                  </div>
                  <button
                    ref={closeButtonRef}
                    className="cv-drawer-close"
                    type="button"
                    aria-label="Close CV"
                    tabIndex={isOpen ? 0 : -1}
                    onClick={() => setIsOpen(false)}
                  >
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      size={19}
                      strokeWidth={1.8}
                    />
                  </button>
                </div>

                <div className="cv-drawer-scroll">
                  <div className="cv-drawer-intro">
                    <h2 id="cv-drawer-title">José Manuel Ramon</h2>
                    <p className="cv-drawer-role">
                      Senior Product Designer · Design & development
                    </p>
                    <p>
                      Seven years of experience connecting research, product strategy,
                      interaction design, and development. Based in Quebec City.
                    </p>
                  </div>

                  <section
                    className="cv-section"
                    aria-labelledby="cv-current-title"
                  >
                    <p className="cv-section-label" id="cv-current-title">
                      Current
                    </p>
                    <div className="cv-section-main">
                      <h3>Equisoft</h3>
                      <p className="cv-section-meta">Senior Product Designer</p>
                      <p>
                        Designing fintech and insurance products from discovery to
                        delivery, in partnership with product and engineering.
                        Work spans policy administration, customer relationships,
                        digital insurance tools, and case management.
                      </p>
                      <p className="cv-domain-copy">
                        Led an AI committee exploring agentic solutions and AI
                        integrations. Confidential work can be discussed through
                        its challenges, process, and my contribution.
                      </p>
                    </div>
                  </section>

                  <section className="cv-section" aria-labelledby="cv-experience-title">
                    <p className="cv-section-label" id="cv-experience-title">Earlier experience</p>
                    <ul className="cv-work-list">
                      <li><span>FolksHR</span><span>Product design for HR software</span></li>
                      <li><span>PetalMD</span><span>User research in Quebec’s healthcare system</span></li>
                      <li><span>Peak Media</span><span>Immersive experience design for museums</span></li>
                    </ul>
                  </section>

                  <section className="cv-section" aria-labelledby="cv-work-title">
                    <p className="cv-section-label" id="cv-work-title">Side projects</p>
                    <ul className="cv-work-list">
                      <li><Link href="/nudge" onClick={() => setIsOpen(false)}>Nudge</Link><span>Shared tasks · iPhone & iPad</span></li>
                      <li><Link href="/world" onClick={() => setIsOpen(false)}>PushedWorld</Link><span>Daily push-ups · Augmented reality</span></li>
                      <li><Link href="/tracer" onClick={() => setIsOpen(false)}>Tracer</Link><span>Research due diligence</span></li>
                      <li><Link href="/abeam" onClick={() => setIsOpen(false)}>aBeam</Link><span>Travel agency conversations</span></li>
                      <li><Link href="/crypto-inheritance" onClick={() => setIsOpen(false)}>CryptoCroc</Link><span>Crypto inheritance</span></li>
                      <li><Link href="/equisoft-labs" onClick={() => setIsOpen(false)}>Decision ROI</Link><span>Decision-making prototype</span></li>
                    </ul>
                  </section>

                  <div className="cv-drawer-footer">
                    <p>
                      Let’s talk about the problems your team is working on.
                    </p>
                    <a
                      className="cv-contact-link"
                      href="mailto:jmanuelr.99@gmail.com"
                      tabIndex={isOpen ? 0 : -1}
                      onClick={() => setIsOpen(false)}
                    >
                      <span>Get in touch</span>
                      <span className="link-icon" aria-hidden="true">
                        <HugeiconsIcon
                          icon={SentIcon}
                          size={16}
                          strokeWidth={1.8}
                        />
                      </span>
                    </a>
                  </div>
                </div>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
