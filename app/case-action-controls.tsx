"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import styles from "./case-action-controls.module.css";

const statuses = ["Failed", "Completed", "Waived"] as const;
export type CaseActionStatus = (typeof statuses)[number];
type Popup = "status" | "options";

export function CaseActionControls({
  status,
  onStatusChange,
  active,
  expanded,
  onExpandedChange,
}: {
  status: CaseActionStatus | undefined;
  onStatusChange: (status: CaseActionStatus) => void;
  active: boolean;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}) {
  const uid = useId();
  const statusTrigger = useRef<HTMLButtonElement>(null);
  const optionsTrigger = useRef<HTMLButtonElement>(null);
  const statusPopup = useRef<HTMLDivElement>(null);
  const optionsPopup = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Popup | null>(null);

  function position(kind: Popup) {
    const anchor =
      kind === "status" ? statusTrigger.current : optionsTrigger.current;
    const popup =
      kind === "status" ? statusPopup.current : optionsPopup.current;
    if (!anchor || !popup) return;
    const rect = anchor.getBoundingClientRect();
    const width = 190;
    const height =
      popup.getBoundingClientRect().height || (kind === "status" ? 144 : 56);
    popup.style.left = `${Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8))}px`;
    popup.style.top = `${rect.bottom + height + 8 > window.innerHeight ? Math.max(8, rect.top - height - 8) : rect.bottom + 8}px`;
  }

  function close(kind: Popup, restoreFocus = false) {
    const popup =
      kind === "status" ? statusPopup.current : optionsPopup.current;
    popup?.hidePopover();
    if (restoreFocus)
      (kind === "status"
        ? statusTrigger.current
        : optionsTrigger.current
      )?.focus({ preventScroll: true });
  }

  function navigate(event: KeyboardEvent<HTMLDivElement>, kind: Popup) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(kind, true);
      return;
    }
    if (event.key === "Tab") {
      close(kind, true);
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
    );
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) %
            items.length;
    items[next]?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (!active) {
      statusPopup.current?.hidePopover();
      optionsPopup.current?.hidePopover();
    }
  }, [active]);

  useEffect(() => {
    if (!open) return;
    const reposition = () => position(open);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, {
      capture: true,
      passive: true,
    });
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  return (
    <div className={styles.controls}>
      <button
        ref={optionsTrigger}
        className={styles.options}
        type="button"
        aria-label="Action options"
        aria-describedby={`${uid}-tooltip`}
        aria-haspopup="menu"
        aria-controls={`${uid}-options`}
        aria-expanded={open === "options"}
        popoverTarget={`${uid}-options`}
        onClick={() => position("options")}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
        <span id={`${uid}-tooltip`} role="tooltip" className={styles.tooltip}>
          Action options
        </span>
      </button>
      <button
        ref={statusTrigger}
        className={styles.statusTrigger}
        type="button"
        data-status={status}
        aria-label={status ? `Action status: ${status}` : "Mark as"}
        aria-haspopup="listbox"
        aria-controls={`${uid}-status`}
        aria-expanded={open === "status"}
        popoverTarget={`${uid}-status`}
        onClick={() => position("status")}
      >
        {status ?? "Mark as"}
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>
      <div
        ref={statusPopup}
        id={`${uid}-status`}
        popover="auto"
        className={styles.popup}
        role="listbox"
        aria-label="Action status"
        onKeyDown={(event) => navigate(event, "status")}
        onToggle={(event) => {
          const opening = event.newState === "open";
          setOpen((previous) =>
            opening ? "status" : previous === "status" ? null : previous,
          );
          if (opening) {
            position("status");
            statusPopup.current
              ?.querySelector<HTMLButtonElement>(
                status ? '[aria-selected="true"]' : "button",
              )
              ?.focus({ preventScroll: true });
          }
        }}
      >
        {statuses.map((value, index) => (
          <button
            key={value}
            type="button"
            role="option"
            aria-selected={status === value}
            tabIndex={status === value || (!status && index === 0) ? 0 : -1}
            data-status={value}
            onClick={() => {
              onStatusChange(value);
              close("status", true);
            }}
          >
            <span>{value}</span>
            {status === value && (
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m5 12 4 4L19 6" />
              </svg>
            )}
          </button>
        ))}
      </div>
      <div
        ref={optionsPopup}
        id={`${uid}-options`}
        popover="auto"
        className={styles.popup}
        role="menu"
        aria-label="Action options"
        onKeyDown={(event) => navigate(event, "options")}
        onToggle={(event) => {
          const opening = event.newState === "open";
          setOpen((previous) =>
            opening ? "options" : previous === "options" ? null : previous,
          );
          if (opening) {
            position("options");
            optionsPopup.current
              ?.querySelector("button")
              ?.focus({ preventScroll: true });
          }
        }}
      >
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onExpandedChange(!expanded);
            close("options", true);
          }}
        >
          {expanded ? "Collapse action" : "Expand action"}
        </button>
      </div>
    </div>
  );
}
