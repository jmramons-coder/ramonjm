"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  buildCaseAssistantReply,
  caseAssistantPrompts,
  type AssistantRecord,
  type AssistantTarget,
  type CaseAssistantContext,
  type CaseAssistantReply,
} from "./case-assistant-replies";
import styles from "./case-assistant-chat.module.css";

export type CaseAssistantChatProps = {
  caseRef: string;
  clientName: string;
  context: CaseAssistantContext;
  onOpenOverview: () => void;
  onOpenDocument: (requirementIndex: number) => void;
  onOpenTask: (index: number) => void;
  onOpenRequirement: (index: number) => void;
  paused?: boolean;
  active?: boolean;
};

type Message = CaseAssistantReply & {
  id: number;
  role: "user" | "assistant";
};

function RecordRow({
  record,
  onOpen,
}: {
  record: AssistantRecord;
  onOpen: (target: AssistantTarget) => void;
}) {
  const content = (
    <>
      <ChatIcon name={record.target?.type ?? "task"} />
      <span className={styles.recordCopy}>
        <strong>{record.title}</strong>
        {record.detail && <span>{record.detail}</span>}
      </span>
      {record.ai && <span className={styles.aiBadge}>AI</span>}
      {record.status && (
        <span className={styles.recordStatus} data-status={record.status}>
          {record.status}
        </span>
      )}
    </>
  );
  return (
    <li>
      {record.target ? (
        <button
          type="button"
          className={styles.recordRow}
          onClick={() => record.target && onOpen(record.target)}
        >
          {content}
        </button>
      ) : (
        <div className={styles.recordRow}>{content}</div>
      )}
    </li>
  );
}

function AssistantMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 12v3a3 3 0 0 1-3 3H9l-5 3V7a3 3 0 0 1 3-3h5" />
      <path d="m18 2 1.1 2.9L22 6l-2.9 1.1L18 10l-1.1-2.9L14 6l2.9-1.1Z" />
    </svg>
  );
}

function ChatIcon({
  name,
}: {
  name: "send" | "task" | "requirement" | "document" | "overview";
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {name === "send" ? (
        <path d="M12 19V5m-6 6 6-6 6 6" />
      ) : name === "task" ? (
        <>
          <rect x="4" y="5" width="16" height="16" rx="3" />
          <path d="M9 3h6v4H9zm-1 10 2 2 5-5" />
        </>
      ) : name === "requirement" ? (
        <>
          <path d="m12 3 8 4v10l-8 4-8-4V7Z" />
          <path d="m8 12 3 3 5-6" />
        </>
      ) : name === "overview" ? (
        <>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M4 10h16M10 10v10" />
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
  context,
  onOpenOverview,
  onOpenDocument,
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
    const response = buildCaseAssistantReply(
      text,
      caseRef,
      clientName,
      context,
    );
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

  function openRecord(target: AssistantTarget) {
    if (target.type === "overview") onOpenOverview();
    else if (target.type === "document") onOpenDocument(target.index);
    else if (target.type === "requirement") onOpenRequirement(target.index);
    else onOpenTask(target.index);
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
              {caseAssistantPrompts(context).map((prompt) => (
                <button type="button" key={prompt} onClick={() => ask(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, messageIndex) => (
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
              {message.facts && message.facts.length > 0 && (
                <dl className={styles.facts}>
                  {message.facts.map((fact) => (
                    <div key={fact.label}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {message.records && message.records.length > 0 && (
                <ul
                  className={styles.records}
                  aria-label="Related case records"
                >
                  {message.records.map((record, index) => (
                    <RecordRow
                      key={`${record.target?.type ?? "event"}-${index}`}
                      record={record}
                      onOpen={openRecord}
                    />
                  ))}
                </ul>
              )}
              {message.role === "assistant" &&
                messageIndex === messages.length - 1 &&
                message.suggestions && (
                  <div
                    className={styles.followUps}
                    aria-label="Suggested follow-up questions"
                  >
                    {message.suggestions.map((prompt) => (
                      <button
                        type="button"
                        key={prompt}
                        disabled={pending}
                        onClick={() => ask(prompt)}
                      >
                        {prompt}
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
              Reading the case
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
