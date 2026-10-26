"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import styles from "./case-header-actions.module.css";

type Popup = "create" | "options";

export type CaseHeaderActionsProps = {
  assigneeName: string;
  assigneeInitials: string;
  onViewAssignment: () => void;
  className?: string;
};

export function CaseHeaderActions({
  assigneeName,
  assigneeInitials,
  onViewAssignment,
  className,
}: CaseHeaderActionsProps) {
  const uid = useId();
  const createTrigger = useRef<HTMLButtonElement>(null);
  const optionsTrigger = useRef<HTMLButtonElement>(null);
  const createPopup = useRef<HTMLDivElement>(null);
  const optionsPopup = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Popup | null>(null);

  function position(kind: Popup) {
    const anchor =
      kind === "create" ? createTrigger.current : optionsTrigger.current;
    const popup =
      kind === "create" ? createPopup.current : optionsPopup.current;
    if (!anchor || !popup) return;
    const rect = anchor.getBoundingClientRect();
    const width = 198;
    const height =
      popup.getBoundingClientRect().height || (kind === "create" ? 136 : 94);
    popup.style.left = `${Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8))}px`;
    popup.style.top = `${rect.bottom + height + 8 > window.innerHeight ? Math.max(8, rect.top - height - 6) : rect.bottom + 6}px`;
  }

  function close(kind: Popup, restoreFocus = false) {
    (kind === "create"
      ? createPopup.current
      : optionsPopup.current
    )?.hidePopover();
    if (restoreFocus)
      (kind === "create"
        ? createTrigger.current
        : optionsTrigger.current
      )?.focus({
        preventScroll: true,
      });
  }

  function navigate(event: KeyboardEvent<HTMLDivElement>, kind: Popup) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(kind, true);
    } else if (event.key === "Tab") {
      // Return to the trigger before native Tab moves to the adjacent control.
      close(kind, true);
    }
  }

  function toggled(kind: Popup, opening: boolean) {
    setOpen((previous) =>
      opening ? kind : previous === kind ? null : previous,
    );
    if (opening) {
      position(kind);
      (kind === "create" ? createPopup.current : optionsPopup.current)?.focus({
        preventScroll: true,
      });
    }
  }

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
    <div className={[styles.controls, className].filter(Boolean).join(" ")}>
      <button
        className={styles.assignee}
        type="button"
        aria-label={`Assigned to ${assigneeName}`}
        aria-describedby={`${uid}-assignee-tooltip`}
        onClick={onViewAssignment}
      >
        <span aria-hidden="true">{assigneeInitials}</span>
        <span
          id={`${uid}-assignee-tooltip`}
          role="tooltip"
          className={styles.tooltip}
        >
          Assigned to {assigneeName}
        </span>
      </button>
      <button
        className={styles.decision}
        type="button"
        disabled
        title="Decisions are unavailable in this preview"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        Decision
      </button>
      <button
        ref={createTrigger}
        className={styles.create}
        type="button"
        aria-haspopup="menu"
        aria-controls={`${uid}-create`}
        aria-expanded={open === "create"}
        popoverTarget={`${uid}-create`}
        onClick={() => position("create")}
      >
        Create
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>
      <button
        ref={optionsTrigger}
        className={styles.options}
        type="button"
        aria-label="Case options"
        aria-describedby={`${uid}-options-tooltip`}
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
        <span
          id={`${uid}-options-tooltip`}
          role="tooltip"
          className={styles.tooltip}
        >
          Case options
        </span>
      </button>
      <div
        ref={createPopup}
        id={`${uid}-create`}
        popover="auto"
        className={styles.popup}
        role="menu"
        aria-label="Create"
        tabIndex={-1}
        onKeyDown={(event) => navigate(event, "create")}
        onToggle={(event) => toggled("create", event.newState === "open")}
      >
        {["Create Task", "Create Requirement", "Upload Document"].map(
          (label) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              title="Unavailable in this preview"
              disabled
            >
              {label}
            </button>
          ),
        )}
      </div>
      <div
        ref={optionsPopup}
        id={`${uid}-options`}
        popover="auto"
        className={styles.popup}
        role="menu"
        aria-label="Case options"
        tabIndex={-1}
        onKeyDown={(event) => navigate(event, "options")}
        onToggle={(event) => toggled("options", event.newState === "open")}
      >
        {["Manage assignee", "Delete"].map((label) => (
          <button
            key={label}
            type="button"
            role="menuitem"
            title="Unavailable in this preview"
            disabled
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
