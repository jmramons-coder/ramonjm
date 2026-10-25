"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import styles from "./case-context-tabs.module.css";

export type CaseObjectTab = {
  key: string;
  kind: "task" | "requirement" | "document";
  label: string;
  contextLabel?: string;
};

type CaseContextTabsProps = {
  idPrefix: string;
  tabs: CaseObjectTab[];
  activeKey: string | null;
  onSelect: (key: string) => void;
  onClear: (key: string) => void;
  onHide: () => void;
};

function TabIcon({
  kind,
}: {
  kind: CaseObjectTab["kind"] | "assistant" | "close";
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {kind === "assistant" ? (
        <>
          <path d="M18 12v3a3 3 0 0 1-3 3H9l-5 3V7a3 3 0 0 1 3-3h5" />
          <path d="m18 2 1.1 2.9L22 6l-2.9 1.1L18 10l-1.1-2.9L14 6l2.9-1.1Z" />
        </>
      ) : kind === "task" ? (
        <>
          <rect x="5" y="4" width="14" height="17" rx="3" />
          <path d="M9 3h6v4H9zm0 9h6m-6 4h4" />
        </>
      ) : kind === "requirement" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 3 3 5-6" />
        </>
      ) : kind === "document" ? (
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Zm0 0v6h6M8 13h8m-8 4h6" />
      ) : (
        <path d="m6 6 12 12M18 6 6 18" />
      )}
    </svg>
  );
}

export function CaseContextTabs({
  idPrefix,
  tabs,
  activeKey,
  onSelect,
  onClear,
  onHide,
}: CaseContextTabsProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const restoreRailFocus = useRef(false);
  const selectedKey =
    activeKey === "assistant" || tabs.some((tab) => tab.key === activeKey)
      ? activeKey
      : "assistant";

  useEffect(() => {
    const selected = tabRefs.current.get(selectedKey ?? "assistant");
    const rail = railRef.current;
    const revealSelected = () => {
      if (!rail?.getClientRects().length) return;
      const target =
        selected?.closest<HTMLElement>("[data-object-tab]") ?? selected;
      target?.scrollIntoView({ block: "nearest", inline: "nearest" });
    };
    revealSelected();
    if (restoreRailFocus.current) {
      restoreRailFocus.current = false;
      selected?.focus({ preventScroll: true });
    }
    const resizeObserver = new ResizeObserver(revealSelected);
    if (rail) resizeObserver.observe(rail);
    return () => resizeObserver.disconnect();
  }, [selectedKey, tabs.length]);

  function clearTab(key: string) {
    restoreRailFocus.current =
      railRef.current?.contains(document.activeElement) ?? false;
    onClear(key);
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, key: string) {
    const keys = ["assistant", ...tabs.map((tab) => tab.key)];
    const current = keys.indexOf(key);
    let next: number;
    switch (event.key) {
      case "ArrowRight":
        next = (current + 1) % keys.length;
        break;
      case "ArrowLeft":
        next = (current - 1 + keys.length) % keys.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = keys.length - 1;
        break;
      case "Delete":
        if (key === "assistant") return;
        event.preventDefault();
        event.stopPropagation();
        clearTab(key);
        return;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    tabRefs.current.get(keys[next])?.focus({ preventScroll: true });
    onSelect(keys[next]);
  }

  function tabRef(key: string, element: HTMLButtonElement | null) {
    if (element) tabRefs.current.set(key, element);
    else tabRefs.current.delete(key);
  }

  return (
    <div className={styles.header}>
      <div
        ref={railRef}
        className={styles.rail}
        role="tablist"
        aria-label="Related case records"
        aria-orientation="horizontal"
      >
        <button
          ref={(element) => tabRef("assistant", element)}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-assistant`}
          aria-controls={`${idPrefix}-body-assistant`}
          aria-selected={selectedKey === "assistant"}
          tabIndex={selectedKey === "assistant" ? 0 : -1}
          className={`${styles.tab} ${styles.assistant}`}
          title="Assistant"
          onClick={() => onSelect("assistant")}
          onKeyDown={(event) => navigate(event, "assistant")}
        >
          <TabIcon kind="assistant" />
          <span className={styles.assistantLabel}>Assistant</span>
        </button>
        <div className={styles.records} role="presentation">
          {tabs.map((tab) => (
            <div
              className={styles.record}
              data-object-tab={tab.key}
              data-active={selectedKey === tab.key}
              role="presentation"
              key={tab.key}
            >
              <button
                ref={(element) => tabRef(tab.key, element)}
                type="button"
                role="tab"
                id={`${idPrefix}-tab-${tab.key}`}
                aria-controls={`${idPrefix}-body-${tab.key}`}
                aria-selected={selectedKey === tab.key}
                tabIndex={selectedKey === tab.key ? 0 : -1}
                className={styles.tab}
                title={
                  tab.contextLabel
                    ? `${tab.label} · ${tab.contextLabel}`
                    : tab.label
                }
                aria-describedby={
                  tab.contextLabel
                    ? `${idPrefix}-context-${tab.key}`
                    : undefined
                }
                onClick={() => onSelect(tab.key)}
                onKeyDown={(event) => navigate(event, tab.key)}
              >
                <TabIcon kind={tab.kind} />
                <span className={styles.label}>{tab.label}</span>
              </button>
              {tab.contextLabel && (
                <span id={`${idPrefix}-context-${tab.key}`} hidden>
                  {tab.contextLabel}
                </span>
              )}
              <button
                type="button"
                className={styles.clear}
                aria-label={`Clear ${tab.label}`}
                title={
                  tab.contextLabel
                    ? `Clear ${tab.label} · ${tab.contextLabel}`
                    : "Clear tab"
                }
                tabIndex={-1}
                onClick={() => clearTab(tab.key)}
              >
                <TabIcon kind="close" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        className={styles.hide}
        aria-label="Close record panel"
        title="Close panel"
        onClick={onHide}
      >
        <TabIcon kind="close" />
      </button>
    </div>
  );
}
