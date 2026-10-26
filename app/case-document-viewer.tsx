"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { CaseRecordLink, CaseTaskActionPath } from "./case-record-links";
import styles from "./case-document-viewer.module.css";

type ViewerIcon = "file" | "minus" | "plus" | "fit" | "pages";

function Icon({ name }: { name: ViewerIcon }) {
  const paths: Record<ViewerIcon, ReactNode> = {
    file: (
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Zm0 0v6h6M8 13h8m-8 4h6" />
    ),
    minus: <path d="M5 12h14" />,
    plus: <path d="M5 12h14m-7-7v14" />,
    fit: <path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4M9 9h6v6H9Z" />,
    pages: (
      <>
        <rect x="7" y="3" width="13" height="16" rx="2" />
        <path d="M4 7v12a3 3 0 0 0 3 3h9" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

type SourceKey =
  "revenue" | "liabilities" | "scope" | "identity" | "receipt" | "verification";
type DocumentPage = { title: string; section: string };
type DocumentInsight = {
  title: string;
  text: string;
  source: SourceKey;
  page: number;
  citation: string;
};

const financialPages: DocumentPage[] = [
  { title: "Company financial statements", section: "Income statement" },
  { title: "Statement of financial position", section: "Assets & liabilities" },
  { title: "Submission record", section: "Evidence scope" },
];
const evidencePages: DocumentPage[] = [
  { title: "Application record", section: "Applicant details" },
  { title: "Evidence confirmation", section: "Submission record" },
];
const financialInsights: DocumentInsight[] = [
  {
    title: "Business revenue recorded",
    text: "The income statement reports $1.24m in annual company revenue. This describes the business, rather than the applicant’s personal income.",
    source: "revenue",
    page: 0,
    citation: "Page 1 · Revenue",
  },
  {
    title: "Company liabilities identified",
    text: "Total company liabilities are $380,000. The statement alone does not establish the applicant’s personal liabilities or guarantees.",
    source: "liabilities",
    page: 1,
    citation: "Page 2 · Total liabilities",
  },
  {
    title: "Personal evidence still needed",
    text: "The submission does not include a personal financial statement. Keep the financial review open until that evidence is received and verified.",
    source: "scope",
    page: 2,
    citation: "Page 3 · Evidence scope",
  },
];
const evidenceInsights: DocumentInsight[] = [
  {
    title: "Linked to the current case",
    text: "The applicant and case reference match this record. Confirm these details against the application before relying on the submission.",
    source: "identity",
    page: 0,
    citation: "Page 1 · Applicant details",
  },
  {
    title: "Submission recorded",
    text: "The evidence record includes a receipt for this requirement. Receipt confirms availability; it does not by itself complete the related review.",
    source: "receipt",
    page: 1,
    citation: "Page 2 · Receipt",
  },
  {
    title: "Review remains with a person",
    text: "The verification note requests a human check of the document’s completeness and relevance before the task is marked complete.",
    source: "verification",
    page: 1,
    citation: "Page 2 · Verification note",
  },
];

function Source({
  source,
  highlighted,
  children,
}: {
  source: SourceKey;
  highlighted: SourceKey | null;
  children: ReactNode;
}) {
  return (
    <div
      className={styles.source}
      data-source={source}
      data-highlighted={highlighted === source || undefined}
    >
      {children}
    </div>
  );
}

function DocumentPaper({
  page,
  financial,
  clientName,
  caseReference,
  requirementName,
  receivedTime,
  highlighted,
}: {
  page: number;
  financial: boolean;
  clientName: string;
  caseReference: string;
  requirementName: string;
  receivedTime: string;
  highlighted: SourceKey | null;
}) {
  const definition = (financial ? financialPages : evidencePages)[page];
  return (
    <article
      className={styles.paper}
      aria-label={`Document page ${page + 1}: ${definition.section}`}
    >
      <header className={styles.paperMasthead}>
        <strong>NORTHLINE</strong>
        <span>ILLUSTRATIVE RECORD</span>
      </header>
      <p className={styles.paperKicker}>{definition.section}</p>
      <h4>
        {financial
          ? definition.title
          : page === 0
            ? requirementName
            : definition.title}
      </h4>
      <p className={styles.paperIntro}>
        {financial
          ? "Reporting period · Year ending 31 December 2025"
          : "Application evidence · Submitted 25 October 2026"}
      </p>
      <Source source="identity" highlighted={highlighted}>
        <dl className={styles.paperIdentity}>
          <div>
            <dt>Prepared for</dt>
            <dd>{clientName}</dd>
          </div>
          <div>
            <dt>Case reference</dt>
            <dd>{caseReference}</dd>
          </div>
        </dl>
      </Source>
      {financial && page === 0 ? (
        <>
          <h5>Income statement</h5>
          <p>
            Summary of the company’s reported operating performance. All amounts
            are in Canadian dollars.
          </p>
          <Source source="revenue" highlighted={highlighted}>
            <table className={styles.financialTable}>
              <caption>Company income · CAD</caption>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">2025</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Annual revenue</th>
                  <td>$1,240,000</td>
                </tr>
                <tr>
                  <th scope="row">Operating expenses</th>
                  <td>$860,000</td>
                </tr>
                <tr className={styles.totalRow}>
                  <th scope="row">Net operating income</th>
                  <td>$380,000</td>
                </tr>
              </tbody>
            </table>
          </Source>
          <h5>Basis of preparation</h5>
          <p>
            This summary relates to the company’s operations. It does not report
            the applicant’s personal income, assets or liabilities.
          </p>
          <div className={styles.paperNote}>
            For case review · Company evidence only
          </div>
        </>
      ) : financial && page === 1 ? (
        <>
          <h5>Assets and liabilities</h5>
          <p>
            Position reported at 31 December 2025. Amounts reflect company
            balances, in Canadian dollars.
          </p>
          <Source source="liabilities" highlighted={highlighted}>
            <table className={styles.financialTable}>
              <caption>Company position · CAD</caption>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">2025</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Total assets</th>
                  <td>$940,000</td>
                </tr>
                <tr>
                  <th scope="row">Total liabilities</th>
                  <td>$380,000</td>
                </tr>
                <tr className={styles.totalRow}>
                  <th scope="row">Total equity</th>
                  <td>$560,000</td>
                </tr>
              </tbody>
            </table>
          </Source>
          <h5>Notes to the summary</h5>
          <p>
            Personal guarantees and the applicant’s individual financial
            obligations are not established by this company statement.
          </p>
          <div className={styles.paperNote}>
            Read together with the evidence scope on page 3.
          </div>
        </>
      ) : financial ? (
        <>
          <h5>Documents in this submission</h5>
          <Source source="scope" highlighted={highlighted}>
            <ul className={styles.evidenceList}>
              <li>
                <span>Company income statement</span>
                <strong>Included</strong>
              </li>
              <li>
                <span>Company financial position</span>
                <strong>Included</strong>
              </li>
              <li data-missing="true">
                <span>Personal financial statement</span>
                <strong>Not included</strong>
              </li>
            </ul>
            <p>
              No personal financial statement accompanies this submission. The
              company records do not establish the applicant’s individual
              financial position.
            </p>
          </Source>
          <h5>Review note</h5>
          <p>
            Check the evidence against the linked requirement. Obtain the
            missing personal statement before completing the financial
            assessment.
          </p>
          <div className={styles.paperNote}>
            Prepared as a fictional document for this interaction study.
          </div>
        </>
      ) : page === 0 ? (
        <>
          <h5>Application details</h5>
          <p>
            This document was submitted as evidence for the requirement below
            and linked to the current application.
          </p>
          <dl className={styles.paperDetails}>
            <div>
              <dt>Requirement</dt>
              <dd>{requirementName}</dd>
            </div>
            <div>
              <dt>Applicant</dt>
              <dd>{clientName}</dd>
            </div>
            <div>
              <dt>Reference</dt>
              <dd>{caseReference}</dd>
            </div>
            <div>
              <dt>Document type</dt>
              <dd>Application evidence</dd>
            </div>
          </dl>
          <h5>Scope of the record</h5>
          <p>
            The submission supports the related case review. Its receipt and
            verification are recorded separately on page 2.
          </p>
          <div className={styles.paperNote}>
            Fictional applicant · Demonstration evidence
          </div>
        </>
      ) : (
        <>
          <h5>Submission receipt</h5>
          <Source source="receipt" highlighted={highlighted}>
            <dl className={styles.paperDetails}>
              <div>
                <dt>Evidence received</dt>
                <dd>{requirementName}</dd>
              </div>
              <div>
                <dt>Received</dt>
                <dd>25 October 2026 · {receivedTime}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>Applicant submission</dd>
              </div>
            </dl>
          </Source>
          <h5>Verification note</h5>
          <Source source="verification" highlighted={highlighted}>
            <p>
              Confirm that the evidence is complete, legible and relevant to the
              requirement. A reviewer must verify the submission before
              completing the related task.
            </p>
          </Source>
          <div className={styles.paperNote}>
            Receipt records document availability, not a review decision.
          </div>
        </>
      )}
      <footer className={styles.paperFooter}>
        <span>FICTIONAL SAMPLE · INTERACTION STUDY</span>
        <span>
          {page + 1} /{" "}
          {financial ? financialPages.length : evidencePages.length}
        </span>
      </footer>
    </article>
  );
}

export function CaseDocumentViewer({
  documentName,
  requirementName,
  requirementStatus,
  caseReference,
  clientName,
  financial,
  taskName,
  actionTitle,
  receivedTime = "09:58",
  active,
  onRequirement,
  onTask,
  onAction,
  showContext = true,
}: {
  documentName: string;
  requirementName: string;
  requirementStatus: string;
  caseReference: string;
  clientName: string;
  financial: boolean;
  taskName: string;
  actionTitle: string;
  receivedTime?: string;
  active: boolean;
  onRequirement: () => void;
  onTask: () => void;
  onAction: () => void;
  showContext?: boolean;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [fit, setFit] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(520);
  const [highlighted, setHighlighted] = useState<SourceKey | null>(null);
  const [dragging, setDragging] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const viewerLayout = useRef<HTMLDivElement>(null);
  const pan = useRef<{
    pointerId: number;
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const sourcePending = useRef(false);
  const id = useId();
  const pages = financial ? financialPages : evidencePages;
  const insights = financial ? financialInsights : evidenceInsights;
  const scale = fit
    ? Math.max(0.5, Math.min(1.8, (viewportWidth - 32) / 520))
    : zoom / 100;
  const percent = Math.round(scale * 100);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0)
        setViewportWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active || !sourcePending.current) return;
    const element = viewport.current;
    if (!element) return;
    const source = highlighted
      ? element.querySelector<HTMLElement>(`[data-source="${highlighted}"]`)
      : null;
    const viewportRect = element.getBoundingClientRect();
    const sourceRect = source?.getBoundingClientRect();
    element.scrollTo({
      left: sourceRect
        ? element.scrollLeft +
          sourceRect.left -
          viewportRect.left -
          Math.max(16, (element.clientWidth - sourceRect.width) / 2)
        : 0,
      top: sourceRect
        ? element.scrollTop +
          sourceRect.top -
          viewportRect.top -
          Math.max(16, (element.clientHeight - sourceRect.height) / 2)
        : 0,
      behavior: "instant",
    });
    sourcePending.current = false;
  }, [active, pageIndex, highlighted]);

  function selectPage(index: number, source: SourceKey | null = null) {
    if (source) viewerLayout.current?.scrollTo({ top: 0, behavior: "instant" });
    sourcePending.current = true;
    setHighlighted(source);
    setPageIndex(index);
    if (pageIndex === index && highlighted === source) {
      const element = viewport.current;
      const target = source
        ? element?.querySelector<HTMLElement>(`[data-source="${source}"]`)
        : null;
      if (element && target) {
        const targetRect = target.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        element.scrollTo({
          left:
            element.scrollLeft +
            targetRect.left -
            elementRect.left -
            Math.max(16, (element.clientWidth - targetRect.width) / 2),
          top:
            element.scrollTop +
            targetRect.top -
            elementRect.top -
            Math.max(16, (element.clientHeight - targetRect.height) / 2),
          behavior: "instant",
        });
      } else if (element)
        element.scrollTo({ top: 0, left: 0, behavior: "instant" });
      sourcePending.current = false;
    }
  }

  function changeZoom(delta: number) {
    setZoom(Math.max(50, Math.min(180, percent + delta)));
    setFit(false);
  }

  function startPan(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const element = event.currentTarget;
    pan.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: element.scrollLeft,
      top: element.scrollTop,
    };
    element.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function movePan(event: PointerEvent<HTMLDivElement>) {
    const origin = pan.current;
    if (!origin || origin.pointerId !== event.pointerId) return;
    event.currentTarget.scrollLeft = origin.left - (event.clientX - origin.x);
    event.currentTarget.scrollTop = origin.top - (event.clientY - origin.y);
  }

  function endPan(event: PointerEvent<HTMLDivElement>) {
    if (pan.current?.pointerId !== event.pointerId) return;
    pan.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <section
      className={styles.document}
      data-active={active}
      aria-label={`Document viewer for ${documentName}`}
    >
      {showContext && (
        <div className={styles.context}>
          <div className={styles.metadata}>
            <span>PDF · {pages.length} pages</span>
            <span>Received 25 Oct 2026 · {receivedTime}</span>
          </div>
          <section
            className={styles.links}
            aria-label="Linked document context"
          >
            <h4>Links</h4>
            <CaseTaskActionPath
              taskName={taskName}
              actionTitle={actionTitle}
              onTask={onTask}
              onAction={onAction}
            />
            <CaseRecordLink
              kind="requirement"
              name={requirementName}
              status={requirementStatus}
              onOpen={onRequirement}
            />
          </section>
        </div>
      )}
      <div ref={viewerLayout} className={styles.viewer}>
        <section className={styles.preview} aria-label="Document preview">
          <div className={styles.toolbar}>
            <span className={styles.pageIndicator}>
              <Icon name="pages" />
              <span>
                Page {pageIndex + 1} <span>of {pages.length}</span>
              </span>
            </span>
            <div className={styles.zoomControls}>
              <button
                type="button"
                aria-label="Zoom out"
                title="Zoom out"
                disabled={percent <= 50}
                onClick={() => changeZoom(-20)}
              >
                <Icon name="minus" />
              </button>
              <output aria-label="Document zoom">{percent}%</output>
              <button
                type="button"
                aria-label="Zoom in"
                title="Zoom in"
                disabled={percent >= 180}
                onClick={() => changeZoom(20)}
              >
                <Icon name="plus" />
              </button>
              <span className={styles.controlDivider} />
              <button
                type="button"
                aria-label="Fit document to width"
                title="Fit to width"
                aria-pressed={fit}
                onClick={() => setFit(true)}
              >
                <Icon name="fit" />
              </button>
            </div>
          </div>
          <div
            id={`${id}-preview`}
            ref={viewport}
            className={styles.viewport}
            data-dragging={dragging || undefined}
            role="region"
            tabIndex={0}
            aria-label="Scrollable document. Drag to pan, or use arrow keys to move."
            onPointerDown={startPan}
            onPointerMove={movePan}
            onPointerUp={endPan}
            onPointerCancel={endPan}
            onLostPointerCapture={() => {
              pan.current = null;
              setDragging(false);
            }}
          >
            <div
              className={styles.paperSpace}
              style={{ width: 520 * scale + 32, minHeight: 760 * scale + 32 }}
            >
              <div
                className={styles.scaledPaper}
                style={{ transform: `scale(${scale})` }}
              >
                <DocumentPaper
                  page={pageIndex}
                  financial={financial}
                  clientName={clientName}
                  caseReference={caseReference}
                  requirementName={requirementName}
                  receivedTime={receivedTime}
                  highlighted={highlighted}
                />
              </div>
            </div>
          </div>
          <nav className={styles.thumbnails} aria-label="Document pages">
            {pages.map((page, index) => (
              <button
                type="button"
                key={page.section}
                className={styles.thumbnail}
                aria-label={`Show page ${index + 1}: ${page.section}`}
                aria-current={pageIndex === index ? "page" : undefined}
                onClick={() => selectPage(index)}
              >
                <span className={styles.miniature} aria-hidden="true">
                  <span>NORTHLINE</span>
                  <strong>{page.section}</strong>
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <span>{index + 1}</span>
              </button>
            ))}
          </nav>
        </section>
        <aside className={styles.insights} aria-labelledby={`${id}-insights`}>
          <header>
            <h4 id={`${id}-insights`}>Document insights</h4>
            <span className={styles.aiTag}>AI</span>
          </header>
          <p className={styles.insightsIntro}>
            Select an insight to see its source in the document.
          </p>
          <div className={styles.insightList}>
            {insights.map((insight) => (
              <button
                type="button"
                className={styles.insight}
                key={insight.source}
                data-selected={highlighted === insight.source || undefined}
                aria-label={`View source: ${insight.title}`}
                aria-describedby={`${id}-${insight.source}-text ${id}-${insight.source}-citation`}
                aria-controls={`${id}-preview`}
                aria-pressed={highlighted === insight.source}
                onClick={() => selectPage(insight.page, insight.source)}
              >
                <span className={styles.insightTitle}>{insight.title}</span>
                <span
                  className={styles.insightText}
                  id={`${id}-${insight.source}-text`}
                >
                  {insight.text}
                </span>
                <span
                  className={styles.citation}
                  id={`${id}-${insight.source}-citation`}
                >
                  <Icon name="file" />
                  {insight.citation}
                </span>
              </button>
            ))}
          </div>
          <p className={styles.reviewNote}>
            Illustrative analysis · A person verifies the evidence and makes the
            decision.
          </p>
        </aside>
      </div>
    </section>
  );
}
