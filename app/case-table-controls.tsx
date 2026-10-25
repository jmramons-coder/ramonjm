"use client";

import { useId, useRef, type CSSProperties, type ReactNode } from "react";
import styles from "./case-table-controls.module.css";

export type CaseAssigneeProps = {
  name: string;
  specialist?: boolean;
  onClick?: () => void;
  compact?: boolean;
};

const avatarTones = [
  { background: "#edf1f5", color: "#607184" },
  { background: "#eff3ed", color: "#6b7d63" },
  { background: "#f5eee8", color: "#94745c" },
  { background: "#eeedf5", color: "#7b7095" },
];

function initialsFor(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return words.length > 1
    ? `${words[0][0]}${words[words.length - 1][0]}`.toLocaleUpperCase()
    : words[0].slice(0, 2).toLocaleUpperCase();
}

export function CaseBrainIcon({ className }: { className?: string } = {}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M12 5.5a3 3 0 0 0-5.7-1.3 3.7 3.7 0 0 0-3.1 5.6 3.7 3.7 0 0 0 .9 6.8 3.6 3.6 0 0 0 7.9 2V5.5Z" />
      <path d="M12 5.5a3 3 0 0 1 5.7-1.3 3.7 3.7 0 0 1 3.1 5.6 3.7 3.7 0 0 1-.9 6.8 3.6 3.6 0 0 1-7.9 2M8 6.5v1.8a2.4 2.4 0 0 0 2.4 2.4M5 12a2.8 2.8 0 0 1 2.8 2.8M8 18v-1.2M16 6.5v1.8a2.4 2.4 0 0 1-2.4 2.4M19 12a2.8 2.8 0 0 0-2.8 2.8M16 18v-1.2" />
    </svg>
  );
}

export function CaseAssignee({
  name,
  specialist = false,
  onClick,
  compact = false,
}: CaseAssigneeProps) {
  const tone =
    avatarTones[
      Array.from(name).reduce(
        (total, letter) => total + letter.charCodeAt(0),
        0,
      ) % avatarTones.length
    ];
  const avatarStyle = {
    "--assignee-avatar-background": tone.background,
    "--assignee-avatar-color": tone.color,
  } as CSSProperties;
  const content = (
    <>
      <span
        className={specialist ? styles.aiAvatar : styles.avatar}
        style={specialist ? undefined : avatarStyle}
        aria-hidden="true"
      >
        {specialist ? "AI" : initialsFor(name)}
      </span>
      <span className={styles.identity}>
        <span className={styles.name}>{name}</span>
        {specialist && !compact && (
          <span className={styles.specialistLabel}>AI specialist</span>
        )}
      </span>
      {specialist && compact && (
        <span className={styles.srOnly}>AI specialist</span>
      )}
    </>
  );
  const sharedProps = {
    className: styles.assignee,
    "data-specialist": specialist,
    "data-compact": compact,
  };

  return onClick ? (
    <button
      type="button"
      {...sharedProps}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {content}
    </button>
  ) : (
    <span {...sharedProps}>{content}</span>
  );
}

export type CaseTableToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  searchLabel: string;
  placeholder?: string;
  action?: ReactNode;
  disabled?: boolean;
};

export function CaseTableToolbar({
  query,
  onQueryChange,
  searchLabel,
  placeholder = "Search",
  action,
  disabled = false,
}: CaseTableToolbarProps) {
  const inputId = useId();
  const clearTooltipId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.toolbar}>
      <div
        className={styles.searchField}
        data-filled={query.length > 0}
        data-disabled={disabled}
        role="search"
        aria-label={searchLabel}
      >
        <svg
          className={styles.searchIcon}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.5 15.5 4.5 4.5" />
        </svg>
        <label htmlFor={inputId} className={styles.srOnly}>
          {searchLabel}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          className={styles.searchInput}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            type="button"
            className={styles.clearSearch}
            aria-label="Clear search"
            aria-describedby={clearTooltipId}
            disabled={disabled}
            onClick={() => {
              onQueryChange("");
              inputRef.current?.focus({ preventScroll: true });
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m7 7 10 10M17 7 7 17" />
            </svg>
            <span id={clearTooltipId} className={styles.tooltip} role="tooltip">
              Clear search
            </span>
          </button>
        )}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
