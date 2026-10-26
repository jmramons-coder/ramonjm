"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import styles from "./case-assistant-chat.module.css";

export type CaseAssistantChatProps = {
  caseRef: string;
  clientName: string;
  onOpenTask: (index: number) => void;
  onOpenRequirement: (index: number) => void;
  paused?: boolean;
  active?: boolean;
};

type ContextLink = {
  label: string;
  type: "task" | "requirement";
  index: number;
};

type Reply = {
  paragraphs: string[];
  points?: string[];
  links?: ContextLink[];
};

type Message = Reply & {
  id: number;
  role: "user" | "assistant";
};

const starterPrompts = [
  "What’s holding up this case?",
  "What should I do next?",
  "What have the AI specialists done?",
];

function sampleReply(
  question: string,
  caseRef: string,
  clientName: string,
): Reply {
  const normalized = question.toLocaleLowerCase();

  if (
    /agent|specialist|assistant|\bai\b|who.*(review|check|work)/.test(
      normalized,
    )
  ) {
    return {
      paragraphs: ["Three specialists have recorded work on this sample case:"],
      points: [
        "Application Review checked the application and supplements. No missing answers were recorded.",
        "Requirement Ordering recorded the evidence requests. The attending physician statement is ordered.",
        "Financial Screening found that the company statements were received, but the personal financial statement is still outstanding.",
      ],
      links: [
        { label: "Application review", type: "task", index: 0 },
        { label: "Evidence ordering", type: "task", index: 1 },
        { label: "Financial review", type: "task", index: 3 },
      ],
    };
  }

  if (/next|should|priority|action|recommend|proceed/.test(normalized)) {
    return {
      paragraphs: [
        "Follow up on the personal financial statement, then continue the financial review when it arrives.",
        "The audited company statements are already received. Natalie’s review stays open while personal evidence is outstanding; the recorded AI finding doesn’t complete the review.",
      ],
      links: [
        {
          label: "Personal financial statement",
          type: "requirement",
          index: 2,
        },
        { label: "Review financial data", type: "task", index: 3 },
      ],
    };
  }

  if (
    /missing|hold|block|waiting|outstanding|delay|personal/.test(normalized)
  ) {
    return {
      paragraphs: [
        "The financial review is waiting on the applicant’s personal financial statement.",
        "Financial Screening recorded the gap. The company’s audited statements are received, but they don’t replace the personal statement. Natalie still needs to review the complete financial evidence.",
      ],
      links: [
        {
          label: "Personal financial statement",
          type: "requirement",
          index: 2,
        },
        { label: "Review financial data", type: "task", index: 3 },
      ],
    };
  }

  if (/document|evidence|audited|received|medical|physician/.test(normalized)) {
    return {
      paragraphs: ["The sample case records these evidence states:"],
      points: [
        "Fulfilled: signed application, with its supporting document available.",
        "Received: audited financial statements and replacement disclosure.",
        "Ordered: personal financial statement and attending physician statement; receipt has not been recorded.",
      ],
      links: [
        {
          label: "Audited financial statements",
          type: "requirement",
          index: 1,
        },
        {
          label: "Personal financial statement",
          type: "requirement",
          index: 2,
        },
        { label: "Physician statement", type: "requirement", index: 4 },
      ],
    };
  }

  if (/financial|finance/.test(normalized)) {
    return {
      paragraphs: [
        "The company’s audited statements have been received. The applicant’s personal financial statement remains outstanding.",
        "Natalie’s financial review stays in review until the complete evidence can be assessed.",
      ],
      links: [
        { label: "Review financial data", type: "task", index: 3 },
        {
          label: "Personal financial statement",
          type: "requirement",
          index: 2,
        },
      ],
    };
  }

  if (
    /overview|summari[sz]e|summary|status|progress|about|case|\bhi\b|hello/.test(
      normalized,
    )
  ) {
    return {
      paragraphs: [`${caseRef} is ${clientName}’s sample life-insurance case.`],
      points: [
        "Application review and evidence ordering are complete.",
        "Financial review is in progress with Natalie. The personal financial statement is the recorded gap.",
        "Evidence reconciliation, risk assessment, and the underwriting decision remain blocked by the preceding work.",
      ],
      links: [
        { label: "Review financial data", type: "task", index: 3 },
        { label: "Missing personal statement", type: "requirement", index: 2 },
      ],
    };
  }

  return {
    paragraphs: [
      "That detail isn’t included in this sample case. I can explain its recorded progress, outstanding evidence, next step, or specialist activity.",
      "The current financial-review gap is the applicant’s personal financial statement. You can inspect the linked records for context.",
    ],
    links: [
      { label: "Review financial data", type: "task", index: 3 },
      { label: "Personal financial statement", type: "requirement", index: 2 },
    ],
  };
}

function AssistantMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 12v3a3 3 0 0 1-3 3H9l-5 3V7a3 3 0 0 1 3-3h5" />
      <path d="m18 2 1.1 2.9L22 6l-2.9 1.1L18 10l-1.1-2.9L14 6l2.9-1.1Z" />
    </svg>
  );
}

function ChatIcon({ name }: { name: "send" | "task" | "document" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {name === "send" ? (
        <path d="M12 19V5m-6 6 6-6 6 6" />
      ) : name === "task" ? (
        <>
          <rect x="4" y="5" width="16" height="16" rx="3" />
          <path d="M9 3h6v4H9zm-1 10 2 2 5-5" />
        </>
      ) : (
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Zm0 0v6h6M8 13h8m-8 4h5" />
      )}
    </svg>
  );
}

export function CaseAssistantChat({
  caseRef,
  clientName,
  onOpenTask,
  onOpenRequirement,
  paused = false,
  active = true,
}: CaseAssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const nextMessageId = useRef(1);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);
  const logScrollTop = useRef(0);
  const previousContent = useRef({ count: 0, pending: false });
  const unreadContent = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const sendTooltipId = useId();

  useEffect(() => {
    return () => {
      if (replyTimer.current !== null) clearTimeout(replyTimer.current);
    };
  }, []);

  useEffect(() => {
    if (active && !document.activeElement?.closest('[role="tablist"]')) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [active]);

  useLayoutEffect(() => {
    const changed =
      previousContent.current.count !== messages.length ||
      previousContent.current.pending !== pending;
    previousContent.current = { count: messages.length, pending };
    if (!active) {
      if (changed) unreadContent.current = true;
      return;
    }
    const log = logRef.current;
    if (!log) return;
    log.scrollTop =
      changed || unreadContent.current
        ? log.scrollHeight
        : logScrollTop.current;
    logScrollTop.current = log.scrollTop;
    unreadContent.current = false;
  }, [messages.length, pending, active]);

  function ask(text: string) {
    if (!text.trim() || pendingRef.current) return;
    pendingRef.current = true;
    const response = sampleReply(text, caseRef, clientName);
    const userMessage: Message = {
      id: nextMessageId.current++,
      role: "user",
      paragraphs: [text],
    };
    setMessages((previous) => [...previous, userMessage]);
    setQuestion("");
    setPending(true);

    const finish = () => {
      const reply: Message = {
        id: nextMessageId.current++,
        role: "assistant",
        ...response,
      };
      setMessages((previous) => [...previous, reply]);
      setPending(false);
      pendingRef.current = false;
      replyTimer.current = null;
    };

    if (paused) finish();
    else replyTimer.current = setTimeout(finish, 280);
    inputRef.current?.focus({ preventScroll: true });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(question);
  }

  return (
    <section
      className={styles.chat}
      aria-label="Case assistant"
      data-paused={paused}
    >
      <header className={styles.header}>
        <span className={styles.recordType}>ASSISTANT · {caseRef}</span>
        <h3 className={styles.headerTitle}>Case assistant</h3>
        <p className={styles.clientName}>{clientName}</p>
      </header>

      <div
        ref={logRef}
        className={styles.conversation}
        onScroll={(event) => {
          if (active) logScrollTop.current = event.currentTarget.scrollTop;
        }}
        role="log"
        aria-label="Case assistant conversation"
        aria-live="polite"
        aria-relevant="additions text"
        aria-busy={pending}
      >
        {messages.length === 0 && (
          <div className={styles.welcome}>
            <span className={styles.welcomeMark}>
              <AssistantMark />
            </span>
            <h3>How can I help with this case?</h3>
            <p>Explore the case, its evidence, and the work behind it.</p>
            <div className={styles.prompts} aria-label="Suggested questions">
              {starterPrompts.map((prompt) => (
                <button type="button" key={prompt} onClick={() => ask(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <article
            key={message.id}
            className={styles.message}
            data-role={message.role}
          >
            {message.role === "assistant" && (
              <span className={styles.messageAvatar} aria-hidden="true">
                <AssistantMark />
              </span>
            )}
            <div className={styles.messageBody}>
              <span className={styles.srOnly}>
                {message.role === "user" ? "You" : "Assistant"}
              </span>
              {message.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
              {message.points && (
                <ul>
                  {message.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              )}
              {message.links && (
                <div
                  className={styles.contextLinks}
                  aria-label="Related case records"
                >
                  {message.links.map((link) => (
                    <button
                      key={`${link.type}-${link.index}`}
                      type="button"
                      onClick={() =>
                        link.type === "task"
                          ? onOpenTask(link.index)
                          : onOpenRequirement(link.index)
                      }
                    >
                      <ChatIcon
                        name={link.type === "task" ? "task" : "document"}
                      />
                      {link.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
        {pending && (
          <div className={styles.pending} role="status">
            <span className={styles.messageAvatar} aria-hidden="true">
              <AssistantMark />
            </span>
            <span>
              Preparing sample response
              <span className={styles.pendingDots} aria-hidden="true">
                …
              </span>
            </span>
          </div>
        )}
      </div>

      <form className={styles.composerArea} onSubmit={submit}>
        <div className={styles.composer}>
          <label htmlFor={inputId} className={styles.srOnly}>
            Ask about this sample case
          </label>
          <input
            ref={inputRef}
            type="text"
            enterKeyHint="send"
            id={inputId}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about this case…"
            maxLength={2000}
          />
          <button
            className={styles.send}
            type="submit"
            aria-label="Send message"
            aria-describedby={sendTooltipId}
            disabled={!question.trim() || pending}
          >
            <ChatIcon name="send" />
            <span className={styles.tooltip} id={sendTooltipId} role="tooltip">
              Send message
            </span>
          </button>
        </div>
      </form>
    </section>
  );
}
