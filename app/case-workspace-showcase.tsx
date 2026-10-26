"use client";

import {
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useReducer,
  useState,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import styles from "./case-workspace-showcase.module.css";
import { CaseAssignee, CaseTableToolbar } from "./case-table-controls";
import { CreateCaseTaskDialog, type CaseTaskDraft } from "./case-create-task";
import { CaseAssistantChat } from "./case-assistant-chat";
import { CasePanelResizeHandle } from "./case-panel-resize";
import { CaseContextTabs } from "./case-context-tabs";
import { CaseHeaderActions } from "./case-header-actions";
import {
  CaseActionControls,
  type CaseActionStatus,
} from "./case-action-controls";
import { DesktopProjectCard } from "./desktop-project-card";
import {
  casePanelReducer,
  initialCasePanelState,
  type CasePanelRecord,
  type OpenCasePanelRecord,
} from "./case-panel-stack";

type RecordTab = "requirement" | "task" | "document";
const requirementTaskIndices = [0, 3, 3, 2, 5] as const;
type IconName =
  | "case"
  | "recommend"
  | "file"
  | "check"
  | "task"
  | "search"
  | "close"
  | "expand"
  | "clock"
  | "grid"
  | "plus"
  | "arrow"
  | "bell"
  | "phone"
  | "assistant";
function Icon({ name, ...props }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    case: (
      <>
        <rect x="3" y="6" width="18" height="15" rx="4" />
        <path d="M8 6V4h8v2M3 12h18m-11 0v3h4v-3" />
      </>
    ),
    recommend: (
      <path d="M7 10v11H3V10h4Zm0 0 4-7h1a2 2 0 0 1 2 2v4h5a2 2 0 0 1 2 2l-1 7a3 3 0 0 1-3 3H7" />
    ),
    file: (
      <>
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Zm0 0v6h6M8 13h8m-8 4h6" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    task: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="3" />
        <path d="M9 3h6v4H9zm0 9h6m-6 4h4" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    arrow: <path d="m9 5 7 7-7 7" />,
    plus: <path d="M12 5v14M5 12h14" />,
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
      </>
    ),
    phone: (
      <path d="m8 3 2 5-2.5 2a14 14 0 0 0 6.5 6.5l2-2.5 5 2v3a2 2 0 0 1-2.2 2A19 19 0 0 1 3 5.2 2 2 0 0 1 5 3Z" />
    ),
    assistant: (
      <>
        <path d="M18 12v3a3 3 0 0 1-3 3H9l-5 3V7a3 3 0 0 1 3-3h5" />
        <path d="m18 2 1.1 2.9L22 6l-2.9 1.1L18 10l-1.1-2.9L14 6l2.9-1.1Z" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  );
}
function navigateTabs(event: KeyboardEvent<HTMLDivElement>) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const tabs = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
  ).filter((tab) => !tab.disabled);
  const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
  if (current < 0) return;
  event.preventDefault();
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
          tabs.length;
  tabs[next]?.click();
  tabs[next]?.focus({ preventScroll: true });
  tabs[next]?.scrollIntoView({ block: "nearest", inline: "nearest" });
}

const workforce = [
  {
    name: "Application Review",
    role: "Application completeness",
    result:
      "Checked the application and its supplements. No missing answers recorded.",
    time: "09:18",
  },
  {
    name: "Requirement Ordering",
    role: "Evidence gathering",
    result:
      "Recorded the evidence requested for this application. Two financial requirements remain outstanding.",
    time: "09:24",
  },
  {
    name: "Financial Screening",
    role: "Financial review",
    result:
      "The company statements are received. The applicant’s personal financial statement is still missing; financial review needs a caseworker.",
    time: "10:06",
  },
];
const caseRows = [
  {
    ref: "CS–549019",
    client: "Avery Morgan",
    due: "Today",
    owner: "You",
    progress: 3,
    priority: "High",
  },
  {
    ref: "CS–549023",
    client: "Jordan Lee",
    due: "Today",
    owner: "Marcus",
    progress: 2,
    priority: "Normal",
  },
  {
    ref: "CS–549031",
    client: "Rowan Parker",
    due: "Tomorrow",
    owner: "You",
    progress: 3,
    priority: "Normal",
  },
  {
    ref: "CS–549036",
    client: "Taylor Brooks",
    due: "Tomorrow",
    owner: "Lina",
    progress: 1,
    priority: "High",
  },
  {
    ref: "CS–549042",
    client: "Casey Rivera",
    due: "Oct 28",
    owner: "You",
    progress: 2,
    priority: "Normal",
  },
];
type TaskActionDefinition = {
  title: string;
  description: string;
  requirements: number[];
};
type CaseTask = {
  name: string;
  description: string;
  stage: string;
  owner: string;
  status: string;
  agent: number | null;
  action?: TaskActionDefinition;
};
const tasks: CaseTask[] = [
  {
    name: "Review the application",
    description:
      "Verify that the application is complete and ready for evidence gathering.",
    stage: "Intake",
    owner: "Application Review",
    status: "Completed",
    agent: 0,
  },
  {
    name: "Order the required evidence",
    description:
      "Collect the financial and medical evidence required for this case.",
    stage: "Evidence gathering",
    owner: "Requirement Ordering",
    status: "Completed",
    agent: 1,
  },
  {
    name: "Review the replacement disclosure",
    description:
      "Review the proposed policy replacement and the applicant’s signed disclosure.",
    stage: "Evidence gathering",
    owner: "You",
    status: "To do",
    agent: null,
  },
  {
    name: "Review financial data",
    description:
      "Assess the applicant’s financial position using the company and personal statements.",
    stage: "Underwriting analysis",
    owner: "You",
    status: "In review",
    agent: 2,
  },
  {
    name: "Reconcile evidence against the application",
    description:
      "Check that the evidence is consistent with the application before the case moves forward.",
    stage: "Underwriting analysis",
    owner: "Evidence Reconciliation",
    status: "Blocked",
    agent: null,
  },
  {
    name: "Assess medical and exposure risk",
    description:
      "Assess the medical and exposure information provided for this application.",
    stage: "Underwriting analysis",
    owner: "Underwriting",
    status: "Blocked",
    agent: null,
  },
  {
    name: "Record the underwriting decision",
    description:
      "Bring the financial and medical reviews together to record the case decision.",
    stage: "Decision & offer",
    owner: "You",
    status: "Blocked",
    agent: null,
  },
  {
    name: "Assemble and release the contract",
    description:
      "Prepare the contract documents for release once the decision is recorded.",
    stage: "Issue & delivery",
    owner: "Operations",
    status: "Blocked",
    agent: null,
  },
];
const requirements = [
  ["Signed application", "Received", "Application Review"],
  ["Audited financial statements", "Received", "Financial Screening"],
  ["Personal financial statement", "Outstanding", "Financial Screening"],
  ["Replacement disclosure", "Received", "You"],
  ["Attending physician statement", "Ordered", "Requirement Ordering"],
];
const taskActions: TaskActionDefinition[] = [
  {
    title: "Check application completeness",
    description:
      "Check the signed application and supplements for missing answers. Keep the review attached to the evidence received.",
    requirements: [0],
  },
  {
    title: "Order case evidence",
    description:
      "Request the financial and medical evidence needed for this application. Receipt is tracked separately on each requirement.",
    requirements: [4, 2, 1],
  },
  {
    title: "Review the replacement disclosure",
    description:
      "Compare the disclosure with the application and confirm the applicant’s signed declaration is on file.",
    requirements: [3],
  },
  {
    title: "Assess financial evidence",
    description:
      "Review the company statements and identify the personal evidence still needed. Record the review without closing the task while evidence is outstanding.",
    requirements: [1, 2],
  },
  {
    title: "Compare the received evidence",
    description:
      "Reconcile the application with the financial and medical evidence. Resolve missing records before recording a consistent case position.",
    requirements: [0, 1, 2, 3, 4],
  },
  {
    title: "Review medical evidence",
    description:
      "Review the attending physician’s statement against the application. This action is waiting for the ordered medical evidence.",
    requirements: [4],
  },
  {
    title: "Prepare the underwriting decision",
    description:
      "Bring the completed financial and medical assessments into the decision. The preceding reviews must be resolved first.",
    requirements: [2, 4],
  },
  {
    title: "Assemble the contract package",
    description:
      "Check the signed application and disclosure for the contract package. Release remains blocked until the underwriting decision is recorded.",
    requirements: [0, 3],
  },
];
function getTaskAction(task: CaseTask, index: number): TaskActionDefinition {
  return task.action ?? taskActions[index];
}
function personName(name: string) {
  return (
    (
      {
        You: "Natalie Adams",
        Underwriting: "Marcus Reed",
        Operations: "Lina Chen",
        Marcus: "Marcus Reed",
        Lina: "Lina Chen",
      } as Record<string, string>
    )[name] ?? name
  );
}
function isSpecialist(name: string) {
  return [
    "Application Review",
    "Requirement Ordering",
    "Financial Screening",
    "Evidence Reconciliation",
    "Document Intake",
  ].includes(name);
}
const documentRows = [
  {
    name: "Audited financial statements.pdf",
    requirement: 1,
    task: 3,
    actor: "Lina Chen",
    received: "09:58",
  },
  {
    name: "Signed application.pdf",
    requirement: 0,
    task: 0,
    actor: "Marcus Reed",
    received: "09:12",
  },
];

function Status({ value }: { value: string }) {
  return (
    <span className={styles.status} data-state={value}>
      {value}
    </span>
  );
}

const workflowStages = [
  { name: "Intake", detail: "Initial information collected" },
  { name: "Evidence gathering", detail: "Supporting records requested" },
  { name: "Review", detail: "People and specialists review the evidence" },
  { name: "Decision", detail: "Record the outcome and its context" },
  { name: "Completion", detail: "Finish the remaining work" },
];

function CaseProgress({ progress }: { progress: number }) {
  return (
    <article className={styles.overviewProgressCard} aria-label="Case progress">
      <header>
        <h3>Progress</h3>
        <small>
          Stage {progress} of {workflowStages.length}
        </small>
      </header>
      <ol className={styles.overviewStages}>
        {workflowStages.map((stage, index) => {
          const state =
            index < progress - 1
              ? "done"
              : index === progress - 1
                ? "current"
                : "next";
          return (
            <li
              key={stage.name}
              data-state={state}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span className={styles.stageIndicator}>
                {state === "done" ? <Icon name="check" /> : index + 1}
              </span>
              <div>
                <strong>{stage.name}</strong>
                <small>
                  {state === "done"
                    ? "Completed"
                    : state === "current"
                      ? "In progress · " + stage.detail
                      : stage.detail}
                </small>
              </div>
            </li>
          );
        })}
      </ol>
    </article>
  );
}

function TaskActions({
  task,
  taskIndex,
  actionStatus,
  onActionStatusChange,
  active,
  onRequirement,
  onDocument,
  expanded,
  onExpandedChange,
}: {
  task: CaseTask;
  taskIndex: number;
  actionStatus: CaseActionStatus | undefined;
  onActionStatusChange: (status: CaseActionStatus) => void;
  active: boolean;
  onRequirement: (index: number) => void;
  onDocument: (index: number) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}) {
  const action = getTaskAction(task, taskIndex);
  const status =
    actionStatus ?? (task.status === "Completed" ? "Completed" : undefined);
  const id = useId();
  return (
    <section
      className={styles.actionSection}
      data-task-action
      aria-label={`${task.name} actions`}
    >
      <div className={styles.actionSectionHeading}>
        <h4>Actions</h4>
        <span>{status === "Completed" ? "1" : "0"} / 1</span>
      </div>
      <div className={styles.actionDisclosure}>
        <div className={styles.actionHeader}>
          <button
            className={styles.actionTrigger}
            aria-expanded={expanded}
            aria-controls={id}
            onClick={() => onExpandedChange(!expanded)}
          >
            <span className={styles.actionChevron}>
              <Icon name="arrow" />
            </span>
            <span className={styles.actionIdentity}>
              <strong>{action.title}</strong>
            </span>
          </button>
          <CaseActionControls
            status={status}
            onStatusChange={onActionStatusChange}
            active={active}
            expanded={expanded}
            onExpandedChange={onExpandedChange}
          />
        </div>
        <div
          className={styles.actionReveal}
          id={id}
          data-expanded={expanded}
          aria-hidden={!expanded}
          inert={!expanded}
        >
          <div className={styles.actionInner}>
            <div className={styles.actionDetails}>
              <p className={styles.actionDescription}>{action.description}</p>
              <section
                className={styles.actionRequirements}
                aria-label="Requirements"
              >
                <h5>Requirements</h5>
                <ul className={styles.actionEvidence}>
                  {action.requirements.map((index) => (
                    <li key={index} className={styles.actionRequirementCard}>
                      <button
                        className={styles.actionEvidenceRow}
                        onClick={() => onRequirement(index)}
                      >
                        <Icon name="file" />
                        <span>{requirements[index][0]}</span>
                        <Status value={requirements[index][1]} />
                      </button>
                      {requirements[index][1] === "Received" && (
                        <button
                          className={styles.actionDocumentLink}
                          onClick={() => onDocument(index)}
                        >
                          <Icon name="file" />
                          {documentRows.find((row) => row.requirement === index)
                            ?.name ?? `${requirements[index][0]}.pdf`}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {!action.requirements.length && (
                  <p className={styles.actionNotice}>
                    No requirements linked yet.
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CaseTaskTable({
  rows,
  active,
  onOpen,
  onAgent,
}: {
  rows: ((typeof tasks)[number] & { index: number })[];
  active: number | null;
  onOpen: (index: number) => void;
  onAgent: (index: number, agent: number) => void;
}) {
  return (
    <table className={styles.workTable} aria-label="Case tasks">
      <colgroup>
        <col style={{ width: "45%" }} />
        <col style={{ width: "27%" }} />
        <col style={{ width: "16%" }} />
        <col style={{ width: "12%" }} />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">Task</th>
          <th scope="col">Assigned to</th>
          <th scope="col">Status</th>
          <th scope="col">Due</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <TaskTableRow
            key={row.index}
            row={row}
            active={active === row.index}
            onOpen={onOpen}
            onAgent={onAgent}
          />
        ))}
        {!rows.length && (
          <tr>
            <td colSpan={4} className={styles.empty}>
              No tasks match your search.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
function TaskTableRow({
  row,
  active,
  onOpen,
  onAgent,
}: {
  row: (typeof tasks)[number] & { index: number };
  active: boolean;
  onOpen: (index: number) => void;
  onAgent: (index: number, agent: number) => void;
}) {
  const specialist = isSpecialist(row.owner);
  return (
    <tr data-selected={active} onClick={() => onOpen(row.index)}>
      <td>
        <button
          className={styles.tableTaskButton}
          onClick={(event) => {
            event.stopPropagation();
            onOpen(row.index);
          }}
          aria-label={`Open task ${row.name}`}
        >
          <span>
            <strong>{row.name}</strong>
            <small>{row.stage}</small>
          </span>
        </button>
      </td>
      <td>
        <CaseAssignee
          name={personName(row.owner)}
          specialist={specialist}
          onClick={
            specialist && row.agent !== null
              ? () => onAgent(row.index, row.agent!)
              : undefined
          }
        />
      </td>
      <td>
        <Status value={row.status} />
      </td>
      <td>
        <span className={styles.tableDue}>
          {row.status === "Completed" ? "—" : "Today"}
        </span>
      </td>
    </tr>
  );
}
type CaseActivityEntry = {
  title: string;
  actor: string;
  occurredAt: string;
  a: number | null;
  taskIndex: number | null;
  requirementIndex?: number;
  record: string;
};
const activityRows: CaseActivityEntry[] = [
  {
    title: "Financial evidence flagged for review",
    actor: "Financial Screening",
    occurredAt: "2026-10-25T10:06:00-04:00",
    a: 2,
    taskIndex: 3,
    record: "Task",
  },
  {
    title: "Company financial statements received",
    actor: "Lina Chen",
    occurredAt: "2026-10-25T09:58:00-04:00",
    a: null,
    taskIndex: 3,
    requirementIndex: 1,
    record: "Requirement",
  },
  {
    title: "Evidence requirements ordered",
    actor: "Requirement Ordering",
    occurredAt: "2026-10-25T09:24:00-04:00",
    a: 1,
    taskIndex: 1,
    record: "Task",
  },
  {
    title: "Application review completed",
    actor: "Application Review",
    occurredAt: "2026-10-25T09:18:00-04:00",
    a: 0,
    taskIndex: 0,
    record: "Task",
  },
  {
    title: "Case assigned to Natalie Adams",
    actor: "Marcus Reed",
    occurredAt: "2026-10-25T09:05:00-04:00",
    a: null,
    taskIndex: null,
    record: "Case",
  },
];
const activityDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Toronto",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const activityTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Toronto",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
function ActivityTimestamp({ value }: { value: string }) {
  const occurredAt = new Date(value);
  return (
    <time className={styles.activityTimestamp} dateTime={value}>
      <span>{activityDateFormatter.format(occurredAt)}</span>
      <span>{activityTimeFormatter.format(occurredAt)}</span>
    </time>
  );
}
function CaseActivityTable({
  rows,
  onOpen,
}: {
  rows: CaseActivityEntry[];
  onOpen: (entry: CaseActivityEntry) => void;
}) {
  return (
    <table
      className={`${styles.workTable} ${styles.activityTable}`}
      aria-label="Case activity history"
    >
      <colgroup>
        <col style={{ width: "45%" }} />
        <col style={{ width: "27%" }} />
        <col style={{ width: "16%" }} />
        <col style={{ width: "12%" }} />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">Activity</th>
          <th scope="col">By</th>
          <th scope="col">Record</th>
          <th scope="col">Date &amp; time</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row.title}-${index}`} onClick={() => onOpen(row)}>
            <td>
              <button
                className={styles.tableTaskButton}
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen(row);
                }}
                aria-label={`Inspect activity ${row.title}`}
              >
                <strong>{row.title}</strong>
              </button>
            </td>
            <td>
              <CaseAssignee
                name={personName(row.actor)}
                specialist={isSpecialist(row.actor)}
              />
            </td>
            <td>
              <span className={styles.activityRecord}>{row.record}</span>
            </td>
            <td>
              <ActivityTimestamp value={row.occurredAt} />
            </td>
          </tr>
        ))}
        {!rows.length && (
          <tr>
            <td colSpan={4} className={styles.empty}>
              No activity matches your search.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function CaseRecordContent({
  entry,
  active,
  idPrefix,
  currentTask,
  actionStatus,
  onActionStatusChange,
  onUpdate,
  onTask,
  onRequirement,
  onDocument,
}: {
  entry: CasePanelRecord;
  active: boolean;
  idPrefix: string;
  currentTask: CaseTask;
  actionStatus: CaseActionStatus | undefined;
  onActionStatusChange: (status: CaseActionStatus) => void;
  onUpdate: (
    patch: Partial<Pick<CasePanelRecord, "agentIndex" | "actionExpanded">>,
  ) => void;
  onTask: (revealAction?: boolean) => void;
  onRequirement: (index: number) => void;
  onDocument: (index?: number) => void;
}) {
  const content = useRef<HTMLDivElement>(null);
  const scrollPosition = useRef(0);
  const lastActionFocus = useRef(0);
  const tab = entry.kind;
  const task = entry.taskIndex;
  const requirement = entry.requirementIndex;
  const agent = entry.agentIndex;
  const currentCase = caseRows[entry.caseIndex];
  const currentRequirement = requirements[requirement];
  const financial = requirement === 1;
  const documentName =
    documentRows.find((row) => row.requirement === requirement)?.name ??
    `${currentRequirement[0]}.pdf`;
  const analysisAgent = agent ?? currentTask.agent;
  useLayoutEffect(() => {
    if (active && content.current)
      content.current.scrollTop = scrollPosition.current;
  }, [active]);
  useEffect(() => {
    if (!active || entry.actionFocusVersion === lastActionFocus.current) return;
    const frame = requestAnimationFrame(() => {
      const element = content.current;
      const action = element?.querySelector<HTMLElement>("[data-task-action]");
      if (!element || !action) return;
      lastActionFocus.current = entry.actionFocusVersion;
      element.scrollTo({
        top:
          action.getBoundingClientRect().top -
          element.getBoundingClientRect().top +
          element.scrollTop -
          12,
        behavior: "instant",
      });
      action
        .querySelector<HTMLButtonElement>("button")
        ?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [active, entry.actionFocusVersion]);
  return (
    <div
      ref={content}
      className={`${styles.recordContent} ${tab === "task" ? styles.taskRecordContent : ""}`}
      id={`${idPrefix}-body-${entry.key}`}
      role="tabpanel"
      aria-labelledby={`${idPrefix}-tab-${entry.key}`}
      data-record-key={entry.key}
      hidden={!active}
      inert={!active}
      onScroll={(event) => {
        if (active) scrollPosition.current = event.currentTarget.scrollTop;
      }}
    >
      {tab === "task" ? (
        <>
          <span className={styles.recordType}>TASK · {currentCase.ref}</span>
          <h3>{currentTask.name}</h3>
          <Status value={currentTask.status} />
          {analysisAgent !== null && (
            <section className={styles.insightBanner} aria-label="AI analysis">
              <header className={styles.insightHeading}>
                <h4>
                  {analysisAgent === 2
                    ? "Personal financial statement still required."
                    : analysisAgent === 0
                      ? "Application completeness checked."
                      : "Evidence requirements recorded."}
                </h4>
                <span className={styles.insightTag}>AI</span>
              </header>
              <p>{workforce[analysisAgent].result}</p>
            </section>
          )}
          <dl className={styles.properties}>
            <div>
              <dt>Assigned to</dt>
              <dd>
                <CaseAssignee
                  name={personName(currentTask.owner)}
                  specialist={isSpecialist(currentTask.owner)}
                  compact
                />
              </dd>
            </div>
            <div>
              <dt>Stage</dt>
              <dd>{currentTask.stage}</dd>
            </div>
            <div>
              <dt>Due</dt>
              <dd>Today</dd>
            </div>
          </dl>
          <p className={styles.taskDescription}>{currentTask.description}</p>
          <TaskActions
            task={currentTask}
            key={task}
            taskIndex={task}
            actionStatus={actionStatus}
            onActionStatusChange={onActionStatusChange}
            active={active}
            expanded={entry.actionExpanded}
            onExpandedChange={(expanded) =>
              onUpdate({ actionExpanded: expanded })
            }
            onRequirement={onRequirement}
            onDocument={onDocument}
          />
        </>
      ) : tab === "requirement" ? (
        <>
          <span className={styles.recordType}>
            REQUIREMENT · REQ–{104 + requirement}
          </span>
          <h3>{currentRequirement[0]}</h3>
          <Status value={currentRequirement[1]} />
          <dl className={styles.properties}>
            <div>
              <dt>Required for</dt>
              <dd>
                <button
                  className={styles.relatedTaskLink}
                  onClick={() => onTask(true)}
                  title={`Open ${getTaskAction(currentTask, task).title}`}
                >
                  {currentTask.name}
                </button>
              </dd>
            </div>
            <div>
              <dt>
                {currentRequirement[1] === "Received"
                  ? "Received"
                  : "Requested"}
              </dt>
              <dd>
                {currentRequirement[1] === "Received"
                  ? "Today, 09:58"
                  : "Today, 09:24"}
              </dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>Applicant submission</dd>
            </div>
          </dl>
          {financial ? (
            <div className={styles.finding}>
              <span>
                <Icon name="recommend" className={styles.studyMark} />
                Financial Screening · Recorded finding
              </span>
              <h4>
                Company evidence received.
                <br />
                Personal evidence outstanding.
              </h4>
              <p>
                The company statements are attached. They do not replace the
                applicant’s personal financial statement.
              </p>
              <button onClick={() => onTask(true)}>
                Review with the task
                <Icon name="arrow" />
              </button>
            </div>
          ) : (
            <p className={styles.recordDescription}>
              {currentRequirement[1] === "Received"
                ? "Evidence has been received for this requirement. Open the linked file to inspect it in the same case."
                : "The evidence is still outstanding. The related work stays blocked until this requirement is met."}
            </p>
          )}
          <h4 className={styles.sectionTitle}>Evidence</h4>
          {currentRequirement[1] === "Received" ? (
            <button
              className={styles.fileLink}
              onClick={() => onDocument(requirement)}
            >
              <Icon name="file" />
              <span>
                <strong>{documentName}</strong>
                <small>PDF · Received today · 1 page</small>
              </span>
              <Icon name="arrow" />
            </button>
          ) : (
            <p className={styles.recordDescription}>
              No document received yet.
            </p>
          )}
          {financial && (
            <>
              <h4 className={styles.sectionTitle}>Still required</h4>
              <div className={styles.outstanding}>
                <Icon name="clock" />
                <span>
                  Personal financial statement
                  <small>Not received · Blocks financial review</small>
                </span>
              </div>
            </>
          )}
        </>
      ) : tab === "document" ? (
        <>
          <span className={styles.recordType}>
            DOCUMENT · DOC–{301 + requirement}
          </span>
          <h3>{documentName}</h3>
          <div className={styles.documentContext}>
            <Icon name="file" />
            <span>{currentRequirement[0]}</span>
            <button onClick={() => onRequirement(requirement)}>
              Requirement
            </button>
          </div>
          <div className={styles.paper}>
            <header>
              <span>NORTHLINE</span>
              <small>
                {financial ? "FINANCIAL STATEMENTS" : "CASE EVIDENCE"}
              </small>
            </header>
            <h4>
              {financial ? (
                <>
                  Company financial
                  <br />
                  statements
                </>
              ) : (
                <>{currentRequirement[0]}</>
              )}
            </h4>
            <span>ILLUSTRATIVE DOCUMENT · SAMPLE DATA</span>
            <dl>
              <div>
                <dt>Submitted for</dt>
                <dd>{currentCase.client}</dd>
              </div>
              <div>
                <dt>Case reference</dt>
                <dd>{currentCase.ref}</dd>
              </div>
              <div>
                <dt>{financial ? "Reporting period" : "Submitted"}</dt>
                <dd>{financial ? "Year ending 2025" : "Today"}</dd>
              </div>
            </dl>
            <h5>Scope of this submission</h5>
            <p>
              {financial
                ? "Company financial information. No personal financial statement accompanies this submission."
                : `${currentRequirement[0]} received for this application. This is an illustrative case document.`}
            </p>
            <div className={styles.paperLines}>
              <i />
              <i />
              <i />
              <i />
            </div>
            <footer>1 / 1</footer>
          </div>
          <button className={styles.sourceLink} onClick={() => onTask(true)}>
            Return to {currentTask.name}
            <Icon name="arrow" />
          </button>
        </>
      ) : null}
    </div>
  );
}

export function CaseWorkspace({
  preview = false,
  paused = false,
  startInCase = false,
}: {
  preview?: boolean;
  paused?: boolean;
  startInCase?: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(
    startInCase ? 0 : null,
  );
  const [view, setView] = useState("Tasks");
  const [panel, dispatchPanel] = useReducer(
    casePanelReducer,
    initialCasePanelState,
  );
  const [assistantCaseIndex, setAssistantCaseIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [mine, setMine] = useState(false);
  const [taskSets, setTaskSets] = useState<Record<number, CaseTask[]>>({});
  const [activitySets, setActivitySets] = useState<
    Record<number, CaseActivityEntry[]>
  >({});
  const [actionStatuses, setActionStatuses] = useState<
    Record<string, CaseActionStatus>
  >({});
  const [creatingTask, setCreatingTask] = useState(false);
  const createOpener = useRef<HTMLButtonElement>(null);
  const recordPanel = useRef<HTMLElement>(null);
  const workBody = useRef<HTMLDivElement>(null);
  const assistantOpener = useRef<HTMLButtonElement>(null);
  const recordOpener = useRef<HTMLElement | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const uid = useId();
  const activeRecord = panel.entries.find(
    (entry) => entry.key === panel.activeKey,
  );
  const tab = panel.visible
    ? panel.activeKey === "assistant"
      ? "assistant"
      : (activeRecord?.kind ?? null)
    : null;
  const task =
    activeRecord?.caseIndex === selected ? activeRecord.taskIndex : null;
  const caseTasks = taskSets[selected ?? 0] ?? tasks;
  const caseActivity = activitySets[selected ?? 0] ?? activityRows;
  const currentCase = caseRows[selected ?? 0];
  const caseOwnerName = personName(currentCase.owner);
  const caseOwnerInitials = caseOwnerName
    .split(" ")
    .map((word) => word[0])
    .join("");

  function openCase(index: number) {
    setSelected(index);
    setView("Tasks");
    dispatchPanel({ type: "hide" });
    setQuery("");
  }
  function registerRecord(
    kind: RecordTab,
    caseIndex: number,
    taskIndex: number,
    requirementIndex: number,
    options: {
      agentIndex?: number | null;
      revealAction?: boolean;
      task?: CaseTask;
    } = {},
  ) {
    const sourceTask =
      options.task ?? (taskSets[caseIndex] ?? tasks)[taskIndex];
    if (!sourceTask) return;
    const key = `${kind}-${caseIndex}-${kind === "task" ? taskIndex : requirementIndex}`;
    const label =
      kind === "task"
        ? sourceTask.name
        : kind === "requirement"
          ? requirements[requirementIndex][0]
          : (documentRows.find((row) => row.requirement === requirementIndex)
              ?.name ?? `${requirements[requirementIndex][0]}.pdf`);
    const focused = document.activeElement;
    if (
      focused instanceof HTMLElement &&
      !recordPanel.current?.contains(focused)
    )
      recordOpener.current = focused;
    const record: OpenCasePanelRecord = {
      key,
      kind,
      label,
      caseIndex,
      taskIndex,
      requirementIndex,
      agentIndex: options.agentIndex,
      revealAction: options.revealAction,
    };
    dispatchPanel({
      type: "open",
      record,
      initialActionExpanded: sourceTask.status !== "Completed",
    });
  }
  function openTask(
    index: number,
    options: {
      caseIndex?: number;
      agentIndex?: number | null;
      revealAction?: boolean;
      task?: CaseTask;
    } = {},
  ) {
    const caseIndex = options.caseIndex ?? selected ?? 0;
    const sourceTask = options.task ?? (taskSets[caseIndex] ?? tasks)[index];
    if (!sourceTask) return;
    registerRecord(
      "task",
      caseIndex,
      index,
      getTaskAction(sourceTask, index).requirements[0] ?? 0,
      options,
    );
  }
  function openRequirement(
    index: number,
    taskIndex: number = requirementTaskIndices[index],
    caseIndex = selected ?? 0,
  ) {
    registerRecord("requirement", caseIndex, taskIndex, index);
  }
  function openDocument(
    index: number,
    taskIndex: number = requirementTaskIndices[index],
    caseIndex = selected ?? 0,
  ) {
    if (requirements[index][1] !== "Received") return;
    registerRecord("document", caseIndex, taskIndex, index);
  }
  function selectRecord(key: string) {
    if (key === "assistant")
      setAssistantCaseIndex(
        activeRecord?.caseIndex ?? selected ?? assistantCaseIndex,
      );
    dispatchPanel({ type: "select", key });
  }
  function clearRecord(key: string) {
    if (panel.activeKey === key && panel.entries.length === 1)
      setAssistantCaseIndex(panel.entries[0].caseIndex);
    dispatchPanel({ type: "clear", key });
  }
  function openAssistant() {
    setAssistantCaseIndex(
      selected ?? activeRecord?.caseIndex ?? assistantCaseIndex,
    );
    recordOpener.current = assistantOpener.current;
    dispatchPanel({ type: "select", key: "assistant" });
  }
  function closeRecordPanel() {
    dispatchPanel({ type: "hide" });
    requestAnimationFrame(() => {
      const target = recordOpener.current?.isConnected
        ? recordOpener.current
        : assistantOpener.current;
      target?.focus({ preventScroll: true });
    });
  }
  function createTask(draft: CaseTaskDraft) {
    const caseIndex = selected ?? 0;
    const index = caseTasks.length;
    const created: CaseTask = {
      name: draft.name,
      description:
        draft.description ||
        "Review the request and complete the actions needed to move this case forward.",
      stage: "Underwriting analysis",
      owner: draft.assignee,
      status: "To do",
      agent: null,
      action: {
        title: draft.name,
        description:
          draft.description ||
          "Review the task and link the evidence needed to move it forward.",
        requirements: [],
      },
    };
    setTaskSets((previous) => ({
      ...previous,
      [caseIndex]: [...(previous[caseIndex] ?? tasks), created],
    }));
    const occurredAt = new Date().toISOString();
    setActivitySets((previous) => ({
      ...previous,
      [caseIndex]: [
        {
          title: `Task created: ${draft.name}`,
          actor: "Natalie Adams",
          occurredAt,
          a: null,
          taskIndex: index,
          record: "Task",
        },
        ...(previous[caseIndex] ?? activityRows),
      ],
    }));
    setCreatingTask(false);
    setView("Tasks");
    setQuery("");
    openTask(index, { caseIndex, task: created });
  }
  useEffect(() => {
    if (!panel.visible) return;
    if (panel.activeKey === "assistant") {
      if (!document.activeElement?.closest('[role="tablist"]'))
        recordPanel.current
          ?.querySelector<HTMLInputElement>('[data-active-chat="true"] input')
          ?.focus({ preventScroll: true });
    } else {
      const selectedTab = recordPanel.current?.querySelector<HTMLButtonElement>(
        '[role="tab"][aria-selected="true"]',
      );
      selectedTab?.focus({ preventScroll: true });
      selectedTab?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [panel.activeKey, panel.visible, assistantCaseIndex]);
  const visibleCases = caseRows.filter(
    (row) =>
      (!mine || row.owner === "You") &&
      `${row.ref} ${row.client} ${personName(row.owner)} ${row.priority}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const visibleTasks = caseTasks
    .map((row, index) => ({ ...row, index }))
    .filter((row) =>
      `${row.name} ${personName(row.owner)}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  const visibleRequirements = requirements
    .map((row, index) => ({ row, index }))
    .filter(({ row }) =>
      `${row.join(" ")} ${personName(row[2])}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  const visibleDocuments = documentRows.filter((row) =>
    `${row.name} ${requirements[row.requirement][0]} ${row.actor}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const visibleActivity = caseActivity.filter((row) =>
    `${row.title} ${row.actor} ${row.record}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div
      ref={root}
      className={styles.workspace}
      data-preview={preview}
      data-paused={paused}
      onClickCapture={(event) => {
        if (!panel.visible || creatingTask) return;
        const target = event.target;
        if (
          !(target instanceof Element) ||
          recordPanel.current?.contains(target)
        )
          return;
        if (
          target.closest(
            'button, a[href], input, textarea, select, label, summary, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="option"], [role="separator"], [contenteditable]:not([contenteditable="false"]), [popover]',
          )
        )
          return;
        const row = target.closest("tr");
        if (
          row?.querySelector('button, a[href], [role="button"], [role="link"]')
        )
          return;
        const nestedDialog = target.closest("dialog");
        if (nestedDialog && root.current?.contains(nestedDialog)) return;
        dispatchPanel({ type: "hide" });
      }}
    >
      <aside className={styles.sidebar}>
        <div className={styles.studyIdentity}>
          <Icon name="grid" />
          <strong>Workspace</strong>
        </div>
        <nav aria-label="Case workspace navigation">
          <button
            data-active={selected === null && !mine}
            onClick={() => {
              setSelected(null);
              dispatchPanel({ type: "hide" });
              setMine(false);
              setQuery("");
            }}
          >
            <Icon name="case" />
            All cases<span>5</span>
          </button>
          <button
            data-active={selected === null && mine}
            onClick={() => {
              setSelected(null);
              dispatchPanel({ type: "hide" });
              setMine(true);
              setQuery("");
            }}
          >
            <Icon name="task" />
            Assigned to me<span>3</span>
          </button>
        </nav>
        <span className={styles.sideLabel}>OPEN CASE</span>
        {selected !== null ? (
          <button
            className={styles.openCase}
            onClick={() => dispatchPanel({ type: "hide" })}
          >
            <span className={styles.avatar}>
              {currentCase.client
                .split(" ")
                .map((x) => x[0])
                .join("")}
            </span>
            <span>
              <strong>{currentCase.client}</strong>
              <small>{currentCase.ref}</small>
            </span>
          </button>
        ) : (
          <p className={styles.sideEmpty}>Select a case to begin.</p>
        )}
        <div className={styles.sideBottom}>
          <span className={styles.avatar}>NA</span>
          <span>
            Natalie Adams<small>Caseworker</small>
          </span>
        </div>
      </aside>
      <div
        ref={workBody}
        className={styles.workBody}
        onKeyDown={(event) => {
          if (event.key === "Escape" && tab) {
            event.preventDefault();
            event.stopPropagation();
            closeRecordPanel();
          }
        }}
      >
        <header className={styles.topbar}>
          <span className={styles.mobileWorkspaceMark} aria-hidden="true">
            <Icon name="grid" />
          </span>
          <button
            onClick={() => {
              setSelected(null);
              dispatchPanel({ type: "hide" });
              setQuery("");
            }}
          >
            {selected === null ? "Workspace" : "Cases"}
          </button>
          {selected !== null && (
            <>
              <span>/</span>
              <strong>{currentCase.ref}</strong>
            </>
          )}
          {selected !== null && (
            <button
              ref={assistantOpener}
              className={styles.contextAssistant}
              aria-label={
                tab === "assistant"
                  ? "Close contextual assistant"
                  : "Open contextual assistant"
              }
              aria-expanded={tab === "assistant"}
              aria-controls={`${uid}-body-assistant`}
              aria-describedby={`${uid}-assistant-tooltip`}
              onClick={() =>
                tab === "assistant" ? closeRecordPanel() : openAssistant()
              }
            >
              <Icon name="assistant" />
              <span
                id={`${uid}-assistant-tooltip`}
                className={styles.assistantTooltip}
                role="tooltip"
              >
                {tab === "assistant"
                  ? "Close the assistant"
                  : "Ask the assistant"}
              </span>
            </button>
          )}
        </header>
        {selected === null ? (
          <section className={styles.queue} aria-label="Case list">
            <div className={styles.pageTitle}>
              <div>
                <h2>Cases</h2>
                <p>Track the work. Move the right case forward.</p>
              </div>
              <span className={styles.count}>
                {visibleCases.length} open cases
              </span>
            </div>
            <div
              className={`${styles.caseTabs} ${styles.queueTabs}`}
              role="tablist"
              aria-label="Case list views"
              onKeyDown={navigateTabs}
            >
              {[false, true].map((assigned) => (
                <button
                  key={String(assigned)}
                  role="tab"
                  tabIndex={mine === assigned ? 0 : -1}
                  aria-selected={mine === assigned}
                  aria-controls={`${uid}-queue-content`}
                  onClick={() => {
                    setMine(assigned);
                    setQuery("");
                  }}
                >
                  <span className={styles.caseTabLabel}>
                    {assigned ? "Assigned to me" : "All cases"}
                  </span>
                  <span className={styles.caseTabCount}>
                    {assigned
                      ? caseRows.filter((row) => row.owner === "You").length
                      : caseRows.length}
                  </span>
                </button>
              ))}
            </div>
            <div
              id={`${uid}-queue-content`}
              role="tabpanel"
              aria-label={mine ? "Assigned to me" : "All cases"}
              key={mine ? "mine" : "all"}
            >
              <CaseTableToolbar
                query={query}
                onQueryChange={setQuery}
                searchLabel="Search cases"
                placeholder="Search cases…"
              />
              <div
                className={styles.tableViewport}
                role="region"
                aria-label="Cases table scroll area"
                tabIndex={0}
              >
                <table
                  className={`${styles.workTable} ${styles.caseQueueTable}`}
                  aria-label={mine ? "Cases assigned to me" : "All cases"}
                >
                  <colgroup>
                    <col style={{ width: "32%" }} />
                    <col style={{ width: "23%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "10%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">Case / Client</th>
                      <th scope="col">Assigned to</th>
                      <th scope="col">Stage</th>
                      <th scope="col">Request type</th>
                      <th scope="col">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCases.map((row) => (
                      <tr
                        key={row.ref}
                        onClick={() => openCase(caseRows.indexOf(row))}
                      >
                        <td>
                          <button
                            className={styles.tableTaskButton}
                            aria-label={`Open case ${row.ref}, ${row.client}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              openCase(caseRows.indexOf(row));
                            }}
                          >
                            <span>
                              <strong>{row.client}</strong>
                              <small>{row.ref}</small>
                            </span>
                          </button>
                        </td>
                        <td>
                          <CaseAssignee name={personName(row.owner)} />
                        </td>
                        <td>
                          <span className={styles.tableCellText}>
                            {row.progress === 3
                              ? "Review"
                              : row.progress === 2
                                ? "Evidence gathering"
                                : "Intake"}
                            <small>{row.priority} priority</small>
                          </span>
                        </td>
                        <td>
                          <span className={styles.tableCellText}>
                            Individual life<small>New business</small>
                          </span>
                        </td>
                        <td>
                          <span className={styles.tableDue}>{row.due}</span>
                        </td>
                      </tr>
                    ))}
                    {!visibleCases.length && (
                      <tr>
                        <td colSpan={5} className={styles.empty}>
                          No cases match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={styles.queueNote}>
              <Icon name="recommend" className={styles.studyMark} />
              <span>
                AI agents work within the case.
                <small>
                  Assignments, results and exceptions stay attached to the work.
                </small>
              </span>
              <button onClick={() => openCase(0)}>
                Open Avery’s case
                <Icon name="arrow" />
              </button>
            </div>
          </section>
        ) : (
          <>
            <header className={styles.caseHeader}>
              <div className={styles.caseHeaderMain}>
                <div className={styles.caseIdentity}>
                  <h2 className={styles.caseTitle}>
                    <span className={styles.caseNumber}>{currentCase.ref}</span>
                    <span className={styles.titleDot} aria-hidden="true">
                      ·
                    </span>
                    <span className={styles.casePerson}>
                      {currentCase.client}
                    </span>
                  </h2>
                  <div className={styles.caseStatusLine}>
                    <Status value="In progress" />
                  </div>
                </div>
              </div>
              <CaseHeaderActions
                className={styles.caseHeaderActions}
                assigneeName={caseOwnerName}
                assigneeInitials={caseOwnerInitials}
                onViewAssignment={() => {
                  setView("Overview");
                  setQuery("");
                  dispatchPanel({ type: "hide" });
                }}
              />
            </header>
            <div
              className={styles.caseTabs}
              role="tablist"
              aria-label="Case sections"
              onKeyDown={navigateTabs}
            >
              {(
                [
                  { label: "Overview", count: null },
                  { label: "Tasks", count: caseTasks.length },
                  {
                    label: "Requirements",
                    count: requirements.length,
                  },
                  {
                    label: "Documents",
                    count: documentRows.length,
                  },
                  {
                    label: "Activity",
                    count: caseActivity.length,
                  },
                ] as const
              ).map(({ label, count }) => (
                <button
                  key={label}
                  role="tab"
                  tabIndex={view === label ? 0 : -1}
                  aria-selected={view === label}
                  aria-controls={`${uid}-case-content`}
                  onClick={() => {
                    setView(label);
                    setQuery("");
                    dispatchPanel({ type: "hide" });
                  }}
                >
                  <span className={styles.caseTabLabel}>{label}</span>
                  {count !== null && (
                    <span className={styles.caseTabCount}>{count}</span>
                  )}
                </button>
              ))}
            </div>
            <div className={styles.caseContent} data-panel={!!tab}>
              <section
                key={view}
                className={styles.caseMain}
                id={`${uid}-case-content`}
                role="tabpanel"
                aria-label={`${currentCase.client} ${view}`}
              >
                {view === "Overview" ? (
                  <section
                    className={styles.overview}
                    aria-label="Case overview"
                  >
                    <div className={styles.overviewHeading}>
                      <h3>Case overview</h3>
                      <p>Details and progress, kept with the work.</p>
                    </div>
                    <div className={styles.overviewLayout}>
                      <article
                        className={styles.overviewDetailsCard}
                        aria-label="Case details"
                      >
                        <header>
                          <h3>Case details</h3>
                        </header>
                        <dl className={styles.overviewFields}>
                          <div>
                            <dt>Owner</dt>
                            <dd>
                              <CaseAssignee name={caseOwnerName} />
                            </dd>
                          </div>
                          <div>
                            <dt>Policy</dt>
                            <dd>{"LIF–" + (40218 + (selected ?? 0))}</dd>
                          </div>
                          <div>
                            <dt>Priority</dt>
                            <dd>{currentCase.priority}</dd>
                          </div>
                          <div>
                            <dt>Due date</dt>
                            <dd>
                              <Icon name="clock" />
                              {currentCase.due}
                            </dd>
                          </div>
                          <div>
                            <dt>Type</dt>
                            <dd>
                              New business<small>Individual life</small>
                            </dd>
                          </div>
                        </dl>
                      </article>
                      <CaseProgress progress={currentCase.progress} />
                    </div>
                  </section>
                ) : (
                  <>
                    <CaseTableToolbar
                      query={query}
                      onQueryChange={setQuery}
                      searchLabel={
                        view === "Tasks"
                          ? "Search case tasks"
                          : view === "Requirements"
                            ? "Search requirements"
                            : view === "Documents"
                              ? "Search documents"
                              : "Search activity"
                      }
                      placeholder={"Search " + view.toLowerCase() + "…"}
                      action={
                        view === "Tasks" ? (
                          <button
                            className={styles.createTaskButton}
                            onClick={(event) => {
                              createOpener.current = event.currentTarget;
                              dispatchPanel({ type: "hide" });
                              setCreatingTask(true);
                            }}
                          >
                            <Icon name="plus" />
                            Create task
                          </button>
                        ) : undefined
                      }
                    />
                    <div
                      className={styles.tableViewport}
                      tabIndex={0}
                      role="region"
                      aria-label={view + " table scroll area"}
                    >
                      {view === "Tasks" ? (
                        <>
                          <CaseTaskTable
                            rows={visibleTasks}
                            active={tab === "task" ? task : null}
                            onOpen={openTask}
                            onAgent={(index, a) => {
                              openTask(index, { agentIndex: a });
                            }}
                          />
                        </>
                      ) : view === "Requirements" ? (
                        <table
                          className={styles.workTable}
                          aria-label="Case requirements"
                        >
                          <colgroup>
                            <col style={{ width: "45%" }} />
                            <col style={{ width: "27%" }} />
                            <col style={{ width: "16%" }} />
                            <col style={{ width: "12%" }} />
                          </colgroup>
                          <thead>
                            <tr>
                              <th scope="col">Requirement</th>
                              <th scope="col">Handled by</th>
                              <th scope="col">Status</th>
                              <th scope="col">Due</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleRequirements.map(
                              ({ row: [name, status, actor], index }) => (
                                <tr
                                  key={name}
                                  onClick={() => {
                                    openRequirement(index);
                                  }}
                                >
                                  <td>
                                    <button
                                      className={styles.tableTaskButton}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openRequirement(index);
                                      }}
                                    >
                                      <strong>{name}</strong>
                                    </button>
                                  </td>
                                  <td>
                                    <CaseAssignee
                                      name={personName(actor)}
                                      specialist={isSpecialist(actor)}
                                    />
                                  </td>
                                  <td>
                                    <Status value={status} />
                                  </td>
                                  <td>
                                    <span className={styles.tableDue}>
                                      {status === "Received" ? "—" : "Today"}
                                    </span>
                                  </td>
                                </tr>
                              ),
                            )}
                            {!visibleRequirements.length && (
                              <tr>
                                <td colSpan={4} className={styles.empty}>
                                  No requirements match your search.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      ) : view === "Documents" ? (
                        <table
                          className={styles.workTable}
                          aria-label="Case documents"
                        >
                          <colgroup>
                            <col style={{ width: "40%" }} />
                            <col style={{ width: "27%" }} />
                            <col style={{ width: "21%" }} />
                            <col style={{ width: "12%" }} />
                          </colgroup>
                          <thead>
                            <tr>
                              <th scope="col">Document</th>
                              <th scope="col">Added by</th>
                              <th scope="col">Requirement</th>
                              <th scope="col">Received</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleDocuments.map((row) => (
                              <tr
                                key={row.name}
                                onClick={() => {
                                  openDocument(row.requirement, row.task);
                                }}
                              >
                                <td>
                                  <button
                                    className={styles.tableTaskButton}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openDocument(row.requirement, row.task);
                                    }}
                                  >
                                    <span>
                                      <strong>{row.name}</strong>
                                      <small>PDF · 1 page</small>
                                    </span>
                                  </button>
                                </td>
                                <td>
                                  <CaseAssignee name={row.actor} />
                                </td>
                                <td>
                                  <span className={styles.tableDue}>
                                    {requirements[row.requirement][0]}
                                  </span>
                                </td>
                                <td>
                                  <time>{row.received}</time>
                                </td>
                              </tr>
                            ))}
                            {!visibleDocuments.length && (
                              <tr>
                                <td colSpan={4} className={styles.empty}>
                                  No documents match your search.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      ) : (
                        <CaseActivityTable
                          rows={visibleActivity}
                          onOpen={(entry) => {
                            if (entry.taskIndex === null) {
                              setView("Overview");
                              dispatchPanel({ type: "hide" });
                              return;
                            }
                            if (entry.requirementIndex !== undefined)
                              openRequirement(
                                entry.requirementIndex,
                                entry.taskIndex,
                              );
                            else
                              openTask(entry.taskIndex, {
                                agentIndex: entry.a,
                              });
                          }}
                        />
                      )}
                    </div>
                  </>
                )}
              </section>
            </div>
          </>
        )}
        <aside
          ref={recordPanel}
          className={styles.recordPanel}
          hidden={!panel.visible}
          aria-label="Case record panel"
        >
          <CasePanelResizeHandle
            panelRef={recordPanel}
            containerRef={workBody}
          />
          <CaseContextTabs
            idPrefix={uid}
            tabs={panel.entries.map((entry) => ({
              ...entry,
              contextLabel: caseRows[entry.caseIndex].ref,
            }))}
            activeKey={panel.activeKey}
            onSelect={selectRecord}
            onClear={clearRecord}
            onHide={closeRecordPanel}
          />
          {panel.entries.map((entry) => (
            <CaseRecordContent
              key={entry.key}
              entry={entry}
              idPrefix={uid}
              active={panel.visible && panel.activeKey === entry.key}
              currentTask={
                (taskSets[entry.caseIndex] ?? tasks)[entry.taskIndex]
              }
              actionStatus={
                actionStatuses[`${entry.caseIndex}-${entry.taskIndex}`]
              }
              onActionStatusChange={(status) =>
                setActionStatuses((previous) => ({
                  ...previous,
                  [`${entry.caseIndex}-${entry.taskIndex}`]: status,
                }))
              }
              onUpdate={(patch) =>
                dispatchPanel({ type: "update", key: entry.key, patch })
              }
              onTask={(revealAction) =>
                openTask(entry.taskIndex, {
                  caseIndex: entry.caseIndex,
                  revealAction,
                })
              }
              onRequirement={(index) =>
                openRequirement(index, entry.taskIndex, entry.caseIndex)
              }
              onDocument={(index = entry.requirementIndex) =>
                openDocument(index, entry.taskIndex, entry.caseIndex)
              }
            />
          ))}
          <div
            className={`${styles.recordContent} ${styles.assistantContent}`}
            id={`${uid}-body-assistant`}
            role="tabpanel"
            aria-labelledby={`${uid}-tab-assistant`}
            hidden={!panel.visible || panel.activeKey !== "assistant"}
            inert={!panel.visible || panel.activeKey !== "assistant"}
          >
            {caseRows.map((row, index) => (
              <div
                key={row.ref}
                className={styles.assistantSession}
                data-active-chat={assistantCaseIndex === index}
                hidden={assistantCaseIndex !== index}
                inert={assistantCaseIndex !== index}
              >
                <CaseAssistantChat
                  caseRef={row.ref}
                  clientName={row.client}
                  paused={paused}
                  active={
                    panel.visible &&
                    panel.activeKey === "assistant" &&
                    assistantCaseIndex === index
                  }
                  onOpenTask={(taskIndex) =>
                    openTask(taskIndex, { caseIndex: index })
                  }
                  onOpenRequirement={(requirementIndex) =>
                    openRequirement(
                      requirementIndex,
                      requirementTaskIndices[requirementIndex],
                      index,
                    )
                  }
                />
              </div>
            ))}
          </div>
        </aside>
      </div>
      {creatingTask && (
        <CreateCaseTaskDialog
          onCreate={createTask}
          onClose={() => {
            setCreatingTask(false);
            requestAnimationFrame(() =>
              createOpener.current?.focus({ preventScroll: true }),
            );
          }}
        />
      )}
    </div>
  );
}

function CaseDesktopPreview() {
  return <CaseWorkspace preview paused startInCase />;
}

function WorkspaceDialog({
  open,
  paused,
  onClose,
}: {
  open: boolean;
  paused: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node || !open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    node.showModal();
    close.current?.focus({ preventScroll: true });
    return () => {
      node.close();
      document.body.style.overflow = overflow;
    };
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label="Agent-first software"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header className={styles.modalBrand}>
        <span>
          Agent-first software
          <small>
            People and AI specialists collaborate on tasks, evidence and
            insights in context.
          </small>
        </span>
      </header>
      <button
        ref={close}
        className={styles.modalClose}
        aria-label="Close agent-first workspace"
        title="Close workspace"
        onClick={onClose}
      >
        <Icon name="close" />
      </button>
      <div className={styles.modalPanel}>
        <CaseWorkspace paused={paused || !open} startInCase />
      </div>
    </dialog>
  );
}
export function CaseWorkspaceShowcase({ paused }: { paused: boolean }) {
  const [open, setOpen] = useState(false);
  const [visited, setVisited] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  return (
    <>
      <DesktopProjectCard
        name="Case management"
        title={<>Agent-first.<br /><em>Data in context.</em></>}
        detail="People + AI specialists · Connected casework"
        tone="case"
        label="Agent-first case management workspace"
        openLabel="Explore agent-first workspace"
        opener={opener}
        paused={paused}
        opened={open}
        onOpen={() => {
          setVisited(true);
          setOpen(true);
        }}
      >
        <div className={styles.preview} aria-hidden="true" inert>
          <CaseDesktopPreview />
        </div>
      </DesktopProjectCard>
      {visited && (
        <WorkspaceDialog
          open={open}
          paused={paused}
          onClose={() => {
            setOpen(false);
            requestAnimationFrame(() =>
              opener.current?.focus({ preventScroll: true }),
            );
          }}
        />
      )}
    </>
  );
}

export function CaseConceptDemo() {
  return (
    <div className={`${styles.modalPanel} ${styles.standalone}`}>
      <CaseWorkspace startInCase />
    </div>
  );
}
