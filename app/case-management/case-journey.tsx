"use client";

import {
  useEffect,
  useId,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import styles from "./case-journey.module.css";

type Context = "task" | "requirement" | "evidence";
type Phase = 0 | 1 | 2 | 3;
type State = {
  phase: Phase;
  context: Context;
  prepared: boolean;
  announcement: string;
};
type Action =
  | { type: "advance"; from: Phase }
  | { type: "context"; context: Context }
  | { type: "prepare" }
  | { type: "reset" };

const initialState: State = {
  phase: 0,
  context: "task",
  prepared: false,
  announcement: "",
};
const contexts: Context[] = ["task", "requirement", "evidence"];
const contextLabels = {
  task: "Task",
  requirement: "Requirements",
  evidence: "Evidence",
};
const stages = [
  "Review the task",
  "Read the evidence",
  "Find the gap",
  "Prepare the handoff",
];
const content = [
  {
    label: "Financial review",
    heading: "Start with the next human action.",
    description:
      "Review the financial evidence for a corporate buy-sell case. The task keeps the case, its documents and its requirements within reach.",
    action: "Review company evidence",
    note: "Explore the linked objects at any point.",
  },
  {
    label: "Received company evidence",
    heading: "See what the document supports.",
    description:
      "The company statements support business value and ownership. Each funding partner’s personal capacity needs its own evidence.",
    action: "Find the missing statements",
    note: "Keep the company evidence in context.",
  },
  {
    label: "Evidence gap identified",
    heading: "Two missing statements. A clear next action.",
    description:
      "Partner A and Partner B still need personal financial statements. Those requests have not been created yet. Prepare them as separate demo requirements.",
    action: "Prepare demo requirements",
    note: "This changes only the local demonstration.",
  },
  {
    label: "Local handoff prepared",
    heading: "Make the request and its handoff visible.",
    description:
      "Two partner-specific requirements now sit beside the received company evidence. An attributed receipt makes the handoff visible. The financial review remains open.",
    action: "Return to task context",
    note: "The reviewer still records the financial position.",
  },
] as const;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "advance": {
      if (state.phase !== action.from || state.phase >= 2) return state;
      const phase = (state.phase + 1) as Phase;
      return {
        ...state,
        phase,
        context: phase === 1 ? "evidence" : "requirement",
        announcement:
          phase === 1
            ? "Company financial statements received. They support business value and ownership. Review the separate personal evidence needed for the funding partners."
            : "Two personal financial statements are missing. No partner-specific requirements have been created yet. You can prepare two local demo requirements.",
      };
    }
    case "context":
      return { ...state, context: action.context };
    case "prepare":
      if (state.phase !== 2 || state.prepared) return state;
      return {
        ...state,
        phase: 3,
        context: "requirement",
        prepared: true,
        announcement:
          "Two local requirements prepared: Partner A personal financial statement and Partner B personal financial statement. A simulated AI Administrator notification receipt is attached to this demo case. The financial review and case remain open.",
      };
    case "reset":
      return {
        ...initialState,
        announcement:
          "Study reset. Company financials are received. The two partner requirements have not been created. All changes were local to this demonstration.",
      };
  }
}

function Icon({
  kind,
}: {
  kind: "check" | "arrow" | "person" | "spark" | "link" | "reset" | "document";
}) {
  const paths = {
    check: "m5 10 3 3 7-7",
    arrow: "M4 10h12m-5-5 5 5-5 5",
    person: "M6 16v-1a4 4 0 0 1 8 0v1M13 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
    spark: "m10 2 2.2 5.8L18 10l-5.8 2.2L10 18l-2.2-5.8L2 10l5.8-2.2L10 2Z",
    link: "m8 12 4-4M7 7l1-1a3.5 3.5 0 0 1 5 5l-1 1m-5-3-1 1a3.5 3.5 0 0 0 5 5l1-1",
    reset: "M4 7a6.5 6.5 0 1 1-.3 5M4 3v4h4",
    document: "M5 2h7l4 4v12H5zM12 2v5h4M8 11h5M8 14h5",
  };
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d={paths[kind]} />
    </svg>
  );
}

export function CaseJourney({ paused = false }: { paused?: boolean }) {
  const id = useId();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [localPaused, setLocalPaused] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = content[state.phase];

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      element.dataset.motion =
        visible &&
        !paused &&
        !localPaused &&
        !document.hidden &&
        !reduced.matches
          ? "active"
          : "still";
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    sync();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
    };
  }, [paused, localPaused]);

  function showContext(context: Context) {
    dispatch({ type: "context", context });
    tabRefs.current[contexts.indexOf(context)]?.focus();
  }

  function onContextKey(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % contexts.length;
    else if (event.key === "ArrowLeft")
      next = (index + contexts.length - 1) % contexts.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = contexts.length - 1;
    else return;
    event.preventDefault();
    showContext(contexts[next]);
  }

  function reset() {
    dispatch({ type: "reset" });
    requestAnimationFrame(() => actionRef.current?.focus());
  }

  return (
    <div
      ref={root}
      className={styles.journey}
      data-motion="still"
      data-paused={paused || localPaused}
    >
      <div className={styles.topbar}>
        <div className={styles.productName}>
          <span className={styles.brandDot} />
          Amplify <span>/ Case Management</span>
        </div>
        <div className={styles.utilities}>
          <button
            type="button"
            onClick={() => setLocalPaused((value) => !value)}
            disabled={paused}
            aria-label={
              paused
                ? "Study visuals paused with page motion"
                : localPaused
                  ? "Resume study visuals"
                  : "Pause study visuals"
            }
          >
            <span aria-hidden="true">{localPaused || paused ? "▷" : "Ⅱ"}</span>
            {paused
              ? "Visuals paused"
              : localPaused
                ? "Resume visuals"
                : "Pause visuals"}
          </button>
          <button type="button" onClick={reset}>
            <Icon kind="reset" />
            Reset
          </button>
        </div>
      </div>

      <div className={styles.disclosure}>
        <span>Guided interaction study</span>
        <span>Fictional buy-sell case · Local demonstration</span>
      </div>
      <ol
        className={styles.stepper}
        aria-label="Financial review study progress"
      >
        {stages.map((label, index) => (
          <li
            key={label}
            data-complete={state.phase > index}
            aria-current={state.phase === index ? "step" : undefined}
          >
            <span className={styles.stepNumber}>
              {state.phase > index ? <Icon kind="check" /> : `0${index + 1}`}
            </span>
            <span>{label}</span>
          </li>
        ))}
      </ol>

      <div className={styles.workspace}>
        <div className={styles.primary}>
          <div className={styles.caseHeader}>
            <div>
              <span className={styles.objectLabel}>
                FICTIONAL STUDY · CS-IN-549019
              </span>
              <h3>William H. Tower</h3>
              <p>Corporate buy-sell funding · Financial review</p>
            </div>
            <span className={styles.caseStatus}>Case in progress</span>
          </div>
          <div className={styles.checkpoint}>
            <div className={styles.checkpointLabel}>
              <Icon kind="person" />
              {current.label}
              <span>{`0${state.phase + 1} / 04`}</span>
            </div>
            <h4>{current.heading}</h4>
            <p className={styles.checkpointDescription}>
              {current.description}
            </p>
            {state.phase === 2 && (
              <div className={styles.gap}>
                <Icon kind="spark" />
                <div>
                  <strong>
                    Company evidence received. Personal evidence absent.
                  </strong>
                  <p>
                    Partner A and Partner B each need a statement. No pending
                    request rows exist yet.
                  </p>
                </div>
              </div>
            )}
            <section
              className={styles.records}
              aria-labelledby={`${id}-records`}
            >
              <div className={styles.recordHeading}>
                <h5 id={`${id}-records`}>Case evidence & requirements</h5>
                <span>
                  {state.prepared ? "2 new demo requests" : "1 received item"}
                </span>
              </div>
              <ul aria-label="Local case evidence and requirement records">
                <li>
                  <span className={styles.documentMark}>
                    <Icon kind="document" />
                  </span>
                  <div>
                    <strong>Audited financial statements</strong>
                    <span>Company value and ownership</span>
                  </div>
                  <span className={styles.received}>
                    <Icon kind="check" />
                    Received
                  </span>
                </li>
                {state.prepared &&
                  ["Partner A", "Partner B"].map((partner) => (
                    <li
                      key={partner}
                      className={styles.newRecord}
                      data-demo-requirement="true"
                    >
                      <span className={styles.documentMark}>
                        <Icon kind="document" />
                      </span>
                      <div>
                        <strong>
                          {partner} · Personal financial statement
                        </strong>
                        <span>Separate personal funding evidence</span>
                      </div>
                      <span className={styles.prepared}>
                        Demo request prepared
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
            <div className={styles.actionRow}>
              <button
                ref={actionRef}
                type="button"
                className={styles.primaryAction}
                onClick={() => {
                  if (state.phase < 2)
                    dispatch({ type: "advance", from: state.phase });
                  else if (state.phase === 2) dispatch({ type: "prepare" });
                  else showContext("task");
                }}
              >
                {current.action}
                <Icon kind="arrow" />
              </button>
              <span>{current.note}</span>
            </div>
          </div>
          <section
            className={styles.activity}
            aria-labelledby={`${id}-activity`}
          >
            <div className={styles.activityHeading}>
              <div>
                <Icon kind="link" />
                <h4 id={`${id}-activity`}>Attached to this case</h4>
              </div>
              <span>Simulated activity</span>
            </div>
            <ol>
              <li>
                <span className={styles.activityMark}>
                  <Icon kind="check" />
                </span>
                <div>
                  <strong>Company financials received</strong>
                  <span>Prepared scenario · Evidence available for review</span>
                </div>
              </li>
              {state.prepared && (
                <>
                  <li className={styles.newActivity}>
                    <span className={styles.activityMark}>
                      <Icon kind="person" />
                    </span>
                    <div>
                      <strong>
                        Two partner-specific requirements prepared
                      </strong>
                      <span>Demo reviewer · Local example requests</span>
                    </div>
                  </li>
                  <li className={`${styles.newActivity} ${styles.receipt}`}>
                    <span className={styles.activityMark}>
                      <Icon kind="spark" />
                    </span>
                    <div>
                      <strong>AI Administrator notified</strong>
                      <span>
                        AI Administrator · Simulated notification receipt
                      </span>
                      <p>
                        The two demo requests are recorded for handoff. This
                        receipt stays linked to the case.
                      </p>
                    </div>
                  </li>
                </>
              )}
            </ol>
          </section>
        </div>

        <aside
          className={styles.context}
          aria-label="Linked financial review context"
        >
          <div className={styles.contextHeading}>
            <Icon kind="link" />
            <div>
              <h4>Keep the case in view.</h4>
              <p>Inspect related work without losing the review.</p>
            </div>
          </div>
          <div
            className={styles.contextTabs}
            role="tablist"
            aria-label="Linked case objects"
          >
            {contexts.map((context, index) => (
              <button
                key={context}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${context}`}
                aria-selected={state.context === context}
                aria-controls={`${id}-panel-${context}`}
                tabIndex={state.context === context ? 0 : -1}
                onClick={() => dispatch({ type: "context", context })}
                onKeyDown={(event) => onContextKey(event, index)}
              >
                {contextLabels[context]}
              </button>
            ))}
          </div>
          {contexts.map((context) => (
            <div
              key={context}
              hidden={state.context !== context}
              className={styles.contextBody}
              role="tabpanel"
              id={`${id}-panel-${context}`}
              aria-labelledby={`${id}-tab-${context}`}
              tabIndex={0}
            >
              {context === "task" ? (
                <>
                  <span className={styles.objectLabel}>HUMAN REVIEW TASK</span>
                  <h5>Review financial data</h5>
                  <p>
                    Decide whether the evidence supports the amount and purpose
                    of the cover. Record which figures and funding parties
                    remain unsupported.
                  </p>
                  <dl>
                    <div>
                      <dt>Owner</dt>
                      <dd>Natalie · Underwriting</dd>
                    </div>
                    <div>
                      <dt>Priority</dt>
                      <dd>High</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>Review in progress</dd>
                    </div>
                    <div>
                      <dt>Linked case</dt>
                      <dd>CS-IN-549019</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    className={styles.contextLink}
                    onClick={() => showContext("requirement")}
                  >
                    Inspect linked requirements
                    <Icon kind="arrow" />
                  </button>
                </>
              ) : context === "requirement" ? (
                <>
                  <span className={styles.objectLabel}>EVIDENCE REQUESTS</span>
                  <h5>Keep received and requested evidence distinct.</h5>
                  <p>
                    {state.prepared
                      ? "The two partner-specific requests now appear in the local case record. Their evidence is still outstanding."
                      : "The company financials are received. Partner-specific personal statement requests have not been created yet."}
                  </p>
                  <dl>
                    <div>
                      <dt>Company financials</dt>
                      <dd>Received</dd>
                    </div>
                    <div>
                      <dt>Partner requests</dt>
                      <dd>
                        {state.prepared
                          ? "2 prepared locally"
                          : "Not yet created"}
                      </dd>
                    </div>
                    <div>
                      <dt>Personal statements</dt>
                      <dd>Outstanding</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    className={styles.contextLink}
                    onClick={() => showContext("evidence")}
                  >
                    Inspect company evidence
                    <Icon kind="arrow" />
                  </button>
                </>
              ) : (
                <>
                  <span className={styles.objectLabel}>COMPANY EVIDENCE</span>
                  <div className={styles.documentPreview}>
                    <Icon kind="document" />
                    <span>Audited financial statements</span>
                    <small>Illustrative document context</small>
                  </div>
                  <div className={styles.insight}>
                    <span>
                      <Icon kind="spark" />
                      Prepared case insight
                    </span>
                    <p>
                      Company value and ownership are supported. The two funding
                      partners’ personal financial statements are missing.
                    </p>
                  </div>
                  <p>
                    Company financials and personal statements answer different
                    questions. Keep each evidence request tied to the party it
                    concerns.
                  </p>
                  <p className={styles.evidenceNote}>
                    This study uses a prepared explanation. No source document
                    is uploaded or analysed here.
                  </p>
                </>
              )}
            </div>
          ))}
          <div className={styles.contextFootnote}>
            <span className={styles.connectionDot} />
            One case · Connected task, requirements and evidence
          </div>
        </aside>
      </div>
      <div className={styles.bottomNote}>
        <Icon kind="link" />
        <span>The review and the case remain open.</span>
        <span>Local interaction study · No external requests</span>
      </div>
      <p
        className={styles.srOnly}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {state.announcement}
      </p>
    </div>
  );
}
