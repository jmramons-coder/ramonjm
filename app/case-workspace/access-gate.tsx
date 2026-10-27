"use client";

import { useActionState } from "react";
import { CaseStudyPreview } from "../case-study-preview";
import { unlockCaseStudy } from "./actions";
import { CaseFrameEvents } from "./frame-events";
import styles from "./access-gate.module.css";

export function CaseAccessGate() {
  const [state, action, pending] = useActionState(unlockCaseStudy, { error: "" });
  return (
    <section className={styles.gate} aria-labelledby="case-access-title">
      <CaseFrameEvents />
      <div className={styles.backdrop}><CaseStudyPreview /></div>
      <div className={styles.tint} aria-hidden="true" />
      <form action={action} className={styles.form} aria-busy={pending}>
        <span className={styles.eyebrow}>Project access</span>
        <h1 id="case-access-title">Case management</h1>
        <p>Enter the access code to explore the workspace.</p>
        <label htmlFor="case-access-code">Access code</label>
        <input id="case-access-code" name="code" type="password" placeholder="Enter code"
          autoComplete="off" autoCapitalize="characters" spellCheck={false}
          maxLength={64} required disabled={pending}
          aria-invalid={Boolean(state.error)} aria-describedby={state.error ? "case-access-error" : undefined} />
        <div className={styles.feedback}>
          {state.error && <span id="case-access-error" role="alert">{state.error}</span>}
        </div>
        <button type="submit" disabled={pending}>{pending ? "Unlocking…" : "Unlock project"}</button>
      </form>
    </section>
  );
}
