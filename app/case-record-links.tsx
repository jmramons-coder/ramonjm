"use client";

import styles from "./case-record-links.module.css";

export function CaseRecordLink({
  kind,
  name,
  status,
  onOpen,
}: {
  kind: "requirement" | "document";
  name: string;
  status: string;
  onOpen: () => void;
}) {
  return (
    <button type="button" className={styles.record} onClick={onOpen}>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {kind === "requirement" ? (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 3 3 5-6" />
          </>
        ) : (
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Zm0 0v6h6M8 13h8m-8 4h6" />
        )}
      </svg>
      <span className={styles.name}>{name}</span>
      <span className={styles.status} data-state={status}>
        {status}
      </span>
    </button>
  );
}

export function CaseTaskActionPath({
  taskName,
  actionTitle,
  onTask,
  onAction,
}: {
  taskName: string;
  actionTitle: string;
  onTask: () => void;
  onAction: () => void;
}) {
  return (
    <div className={styles.path}>
      <button type="button" onClick={onTask}>
        {taskName}
      </button>
      <span className={styles.separator} aria-hidden="true">
        /
      </span>
      <button type="button" onClick={onAction}>
        {actionTitle}
      </button>
    </div>
  );
}
