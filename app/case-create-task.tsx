"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import styles from "./case-workspace-showcase.module.css";

export type CaseTaskDraft = {
  name: string;
  description: string;
  assignee: string;
};

export function CreateCaseTaskDialog({
  initialDraft,
  onClose,
  onCreate,
}: {
  initialDraft?: Partial<CaseTaskDraft>;
  onClose: () => void;
  onCreate: (draft: CaseTaskDraft) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const [name, setName] = useState(initialDraft?.name ?? "");
  const [description, setDescription] = useState(
    initialDraft?.description ?? "",
  );
  const [assignee, setAssignee] = useState(
    initialDraft?.assignee ?? "Natalie Adams",
  );
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    nameRef.current?.focus({ preventScroll: true });
    return () => dialog.close();
  }, []);

  function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(true);
      nameRef.current?.focus();
      return;
    }
    onCreate({
      name: trimmedName,
      description: description.trim(),
      assignee,
    });
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.createDialog}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form className={styles.createForm} onSubmit={createTask} noValidate>
        <header className={styles.createHeader}>
          <h3 id={`${id}-title`}>Create task</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close create task"
            title="Close create task"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="m6 6 12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>
        <div className={styles.createFields}>
          <label htmlFor={`${id}-name`}>Task name</label>
          <input
            ref={nameRef}
            id={`${id}-name`}
            name="name"
            maxLength={160}
            required
            value={name}
            placeholder="What needs to be done?"
            aria-invalid={nameError || undefined}
            aria-describedby={nameError ? `${id}-name-error` : undefined}
            onChange={(event) => {
              setName(event.target.value);
              if (event.target.value.trim()) setNameError(false);
            }}
          />
          {nameError && (
            <p
              id={`${id}-name-error`}
              className={styles.fieldError}
              role="alert"
            >
              Enter a task name.
            </p>
          )}
          <label htmlFor={`${id}-assignee`}>Assignee</label>
          <select
            id={`${id}-assignee`}
            name="assignee"
            value={assignee}
            onChange={(event) => setAssignee(event.target.value)}
          >
            <option>Natalie Adams</option>
            <option>Marcus Reed</option>
            <option>Lina Chen</option>
          </select>
          <label htmlFor={`${id}-description`}>
            Description <span>(optional)</span>
          </label>
          <textarea
            id={`${id}-description`}
            name="description"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <footer className={styles.createActions}>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit">Create task</button>
        </footer>
      </form>
    </dialog>
  );
}
