"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const equisoftProductTypes = [
  {
    id: "workbench",
    caption:
      "Principal design on customer relationship and distribution workbenches, from discovery through delivery.",
  },
  {
    id: "pas",
    caption:
      "Systems design for data-heavy policy admin—configuration interfaces, complex forms, and audit layers.",
  },
  {
    id: "ai",
    caption:
      "Led an AI committee and partnered across teams to integrate AI and agentic workflows.",
  },
  {
    id: "portals",
    caption:
      "Deep UI for digital insurance tools: agent and client portals across multi-stage processes.",
  },
  {
    id: "cases",
    caption:
      "Systems design for case management through complex, multi-stage claims and requests.",
  },
] as const;

function ProfessionalThumb({
  type,
}: {
  type: (typeof equisoftProductTypes)[number]["id"];
}) {
  return (
    <div
      className={`professional-thumb professional-thumb--${type}`}
      aria-hidden="true"
    >
      <span className="pt-accent" />
      {type === "workbench" ? (
        <>
          <span className="pt-rail">
            <span className="pt-rail-mark" />
            <span />
            <span />
            <span />
            <span />
          </span>
          <span className="pt-stage">
            <span className="pt-toolbar" />
            <span className="pt-row">
              <span className="pt-chip" />
              <span className="pt-bar" />
              <span className="pt-bar pt-bar--short" />
            </span>
            <span className="pt-row">
              <span className="pt-chip" />
              <span className="pt-bar" />
              <span className="pt-bar pt-bar--short" />
            </span>
            <span className="pt-row is-on">
              <span className="pt-chip" />
              <span className="pt-bar" />
              <span className="pt-bar pt-bar--short" />
            </span>
          </span>
        </>
      ) : type === "pas" ? (
        <>
          <span className="pt-config">
            <span className="pt-toggle" />
            <span className="pt-toggle is-on" />
            <span className="pt-toggle" />
          </span>
          <span className="pt-form">
            <span className="pt-label" />
            <span className="pt-field" />
            <span className="pt-label" />
            <span className="pt-field">
              <span className="pt-field-fill" />
            </span>
            <span className="pt-audit">
              <span />
              <span className="is-on" />
              <span />
            </span>
          </span>
        </>
      ) : type === "ai" ? (
        <span className="pt-flow">
          <span className="pt-node" />
          <span className="pt-link" />
          <span className="pt-node is-on" />
          <span className="pt-link" />
          <span className="pt-node" />
        </span>
      ) : type === "portals" ? (
        <>
          <span className="pt-portal">
            <span className="pt-portal-bar" />
            <span className="pt-portal-body" />
            <span className="pt-portal-body pt-portal-body--short" />
          </span>
          <span className="pt-portal">
            <span className="pt-portal-bar" />
            <span className="pt-portal-body pt-portal-body--short" />
            <span className="pt-portal-body" />
          </span>
        </>
      ) : (
        <>
          <span className="pt-col">
            <span className="pt-col-head" />
            <span className="pt-ticket" />
            <span className="pt-ticket is-on" />
          </span>
          <span className="pt-col">
            <span className="pt-col-head" />
            <span className="pt-ticket" />
            <span className="pt-ticket" />
            <span className="pt-ticket" />
          </span>
          <span className="pt-col">
            <span className="pt-col-head" />
            <span className="pt-ticket" />
          </span>
        </>
      )}
    </div>
  );
}

export function ProfessionalTypeRow() {
  const rowRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        setIsInView(true);
        observer.disconnect();
      },
      { threshold: 0.32, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(row);

    const frame = window.requestAnimationFrame(() => {
      setIsReady(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={rowRef}
      className={`professional-type-row${isReady ? " is-ready" : ""}${isInView ? " is-inview" : ""}`}
    >
      <span className="professional-system-line" aria-hidden="true" />
      <ul className="professional-type-grid" aria-label="Product types">
        {equisoftProductTypes.map((productType, index) => (
          <li
            className="professional-type"
            key={productType.id}
            style={{ "--type-index": index } as CSSProperties}
          >
            <ProfessionalThumb type={productType.id} />
            <p className="professional-type-copy">{productType.caption}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
