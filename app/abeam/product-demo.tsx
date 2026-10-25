"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import styles from "./product-demo.module.css";

const scenes = [
  {
    label: "Conversation",
    detail: "Be present. Keep the details.",
    caption:
      "A speaker-labelled transcript captures the conversation, while a private assistant helps the advisor ask the next useful question.",
  },
  {
    label: "Client context",
    detail: "One client. A growing picture.",
    caption:
      "Conversations come together in a persistent client file: a readable travel plan, the facts that matter, and the questions still open.",
  },
  {
    label: "Trip journey",
    detail: "Carry the context forward.",
    caption:
      "Shape the next steps before departure, during the trip and after the return. Suggestions stay visible as proposals for the advisor to review.",
  },
  {
    label: "Follow-up",
    detail: "A thoughtful next step.",
    caption:
      "Turn the conversation into a follow-up draft. Review the details, make it your own, and keep control of what gets shared.",
  },
] as const;

const transcript = [
  {
    name: "Maya",
    initials: "M",
    time: "00:18",
    text: "We’re thinking Japan in September, about twelve days. Food and design are the big things.",
    kind: "client",
  },
  {
    name: "Alex",
    initials: "A",
    time: "00:31",
    text: "Around eight thousand Canadian for both of us. We’d rather do fewer places and not feel rushed.",
    kind: "client",
  },
  {
    name: "Advisor",
    initials: "Y",
    time: "00:44",
    text: "A slower pace. We can use Tokyo and Kyoto as a starting point.",
    kind: "advisor",
  },
  {
    name: "Maya",
    initials: "M",
    time: "00:51",
    text: "Yes, with a little room to wander.",
    kind: "client",
  },
] as const;

const initialDraft = `Hi Maya and Alex,

It was lovely hearing about your Japan plans. I have September, around 12 days and a total budget of CAD $8,000 noted, with a focus on food, design and a relaxed pace.

We discussed Tokyo and Kyoto as a starting point. Before I explore options, could you confirm your departure airport and whether your September dates are flexible?

I’ll use that to shape a first proposal with room to wander.

Warmly,
Your travel advisor`;

type IconName =
  | "conversation"
  | "folder"
  | "explore"
  | "arrow"
  | "lock"
  | "spark"
  | "play"
  | "stop"
  | "check"
  | "copy"
  | "people"
  | "calendar"
  | "wallet"
  | "plane"
  | "mail"
  | "edit"
  | "chevron";

function Icon({ name, className }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    conversation: (
      <>
        <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-3 3v-9.5A7.5 7.5 0 0 1 9.5 5h3" />
        <path d="M7 10h6m-6 4h8m3-12v6m-3-3h6" />
      </>
    ),
    folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10H3V7Z" />,
    explore: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14m-5-5 5 5-5 5" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="3" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Zm7-1v4m-2-2h4" />
      </>
    ),
    play: <path d="m9 5 10 7-10 7V5Z" />,
    stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
    check: <path d="m5 12 4 4L19 6" />,
    copy: (
      <>
        <rect x="8" y="8" width="12" height="13" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-3a6 6 0 0 1 12 0v3m2-14a3 3 0 0 1 0 6m3 8v-3a6 6 0 0 0-3-5" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M7 3v4m10-4v4M3 11h18m-14 4h3" />
      </>
    ),
    wallet: (
      <>
        <path d="M20 7H5a2 2 0 0 1 0-4h12v4M3 5v14a2 2 0 0 0 2 2h15V7" />
        <path d="M20 11h-5v6h5m-3-3h.01" />
      </>
    ),
    plane: <path d="m21 3-7 18-3-8-8-3L21 3ZM11 13l5-5" />,
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    edit: (
      <>
        <path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14v6Z" />
      </>
    ),
    chevron: <path d="m9 5 7 7-7 7" />,
  };

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}

function Sidebar({ conversation }: { conversation: boolean }) {
  return (
    <aside className={styles.sidebar} aria-hidden="true">
      <div className={styles.brand}>
        <Image src="/abeam/icon.svg" alt="" width={28} height={28} />
        <span>aBeam</span>
      </div>
      <div className={styles.newConversation}>
        <span>+</span> New conversation
      </div>
      <div className={styles.sidebarNav}>
        <span className={conversation ? styles.navActive : undefined}>
          <Icon name="conversation" />
          Conversations
        </span>
        <span className={!conversation ? styles.navActive : undefined}>
          <Icon name="folder" />
          Client files
        </span>
        <span>
          <Icon name="explore" />
          Explore
        </span>
      </div>
      <div className={styles.sidebarFolder}>
        <span className={styles.smallLabel}>RECENT FILE</span>
        <span>
          <span className={styles.folderDot} />
          Maya & Alex
        </span>
        <small>Japan · September</small>
      </div>
      <div className={styles.account}>
        <span className={styles.accountAvatar}>Y</span>
        <span>
          Your workspace<small>Travel advisor</small>
        </span>
      </div>
    </aside>
  );
}

function FileHeading({
  view,
}: {
  view: "Overview" | "Trip journey" | "Follow-up";
}) {
  return (
    <div className={styles.fileHeading}>
      <p className={styles.breadcrumb}>
        Client files <Icon name="chevron" /> Maya & Alex
      </p>
      <div className={styles.fileTitle}>
        <div>
          <span className={styles.clientName}>Maya & Alex</span>
          <h3>Japan, at their own pace.</h3>
        </div>
        <span className={styles.fileTag}>12 days · September</span>
      </div>
      <div className={styles.fileTabs} aria-hidden="true">
        <span
          className={
            view === "Overview" || view === "Trip journey"
              ? styles.fileTabActive
              : undefined
          }
        >
          Overview
        </span>
        <span>
          Conversations <small>2</small>
        </span>
        <span
          className={view === "Follow-up" ? styles.fileTabActive : undefined}
        >
          Follow-up
        </span>
      </div>
    </div>
  );
}

export function ProductDemo() {
  const id = useId();
  const [scene, setScene] = useState(0);
  const [replaying, setReplaying] = useState(false);
  const [visibleLines, setVisibleLines] = useState<number>(transcript.length);
  const [replayStatus, setReplayStatus] = useState("");
  const [draft, setDraft] = useState(initialDraft);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!replaying) return;
    const timers = transcript.map((_, index) =>
      window.setTimeout(() => setVisibleLines(index + 1), 450 + index * 1100),
    );
    timers.push(
      window.setTimeout(() => {
        setReplaying(false);
        setReplayStatus(
          "Example replay complete. All four transcript excerpts are visible.",
        );
      }, 4400),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [replaying]);

  function selectScene(index: number, focus = false) {
    setScene(index);
    setReplaying(false);
    setVisibleLines(transcript.length);
    setReplayStatus("");
    if (focus) tabs.current[index]?.focus();
  }

  function onTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % scenes.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + scenes.length) % scenes.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = scenes.length - 1;
    else return;
    event.preventDefault();
    selectScene(next, true);
  }

  function replayExample() {
    if (replaying) {
      setReplaying(false);
      setVisibleLines(transcript.length);
      setReplayStatus(
        "Example replay stopped. All transcript excerpts are visible.",
      );
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisibleLines(transcript.length);
      setReplayStatus(
        "Example complete. All four transcript excerpts are visible; motion is reduced.",
      );
      return;
    }
    setVisibleLines(0);
    setReplaying(true);
    setReplayStatus(
      "Replaying four fictional transcript excerpts. This example has no audio.",
    );
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <div className={styles.demo}>
      <div
        className={styles.sceneTabs}
        role="tablist"
        aria-label="Explore the aBeam workflow"
      >
        {scenes.map((item, index) => (
          <button
            key={item.label}
            ref={(node) => {
              tabs.current[index] = node;
            }}
            id={`${id}-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={scene === index}
            aria-controls={`${id}-panel-${index}`}
            tabIndex={scene === index ? 0 : -1}
            className={
              scene === index ? styles.sceneTabActive : styles.sceneTab
            }
            onClick={() => selectScene(index)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
          >
            <span className={styles.sceneNumber}>0{index + 1}</span>
            {item.label}
            <Icon name="arrow" />
          </button>
        ))}
      </div>

      <div className={styles.browser}>
        <div className={styles.browserBar}>
          <div className={styles.browserDots} aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <span>
            <Icon name="lock" />
            aBeam — product walkthrough
          </span>
          <span className={styles.demoLabel}>Demo · Fictional client</span>
        </div>
        <div className={styles.workspace}>
          <Sidebar conversation={scene === 0} />
          <div className={styles.workspaceBody}>
            <section
              id={`${id}-panel-0`}
              role="tabpanel"
              aria-labelledby={`${id}-tab-0`}
              hidden={scene !== 0}
              tabIndex={0}
              className={styles.scenePanel}
            >
              <div className={styles.conversationHeading}>
                <div>
                  <p className={styles.breadcrumb}>
                    Conversation <Icon name="chevron" /> Maya & Alex
                  </p>
                  <h3>Let the conversation flow.</h3>
                </div>
                <span className={styles.consent}>
                  <Icon name="check" />
                  Consent confirmed in this example
                </span>
              </div>
              <div className={styles.conversationGrid}>
                <div className={styles.transcriptPane}>
                  <div className={styles.paneHeading}>
                    <h4>Transcript</h4>
                    <span>Speaker-labelled</span>
                  </div>
                  <div
                    className={styles.transcriptLines}
                    aria-label="Fictional conversation excerpts"
                  >
                    {transcript.map((line, index) => (
                      <article
                        key={line.time}
                        className={`${styles.transcriptLine} ${index < visibleLines ? styles.lineVisible : styles.linePending}`}
                        aria-hidden={index >= visibleLines}
                      >
                        <span
                          className={`${styles.speakerAvatar} ${line.kind === "advisor" ? styles.advisorAvatar : ""}`}
                        >
                          {line.initials}
                        </span>
                        <div>
                          <div className={styles.lineMeta}>
                            <strong>{line.name}</strong>
                            <time>{line.time}</time>
                          </div>
                          <p>{line.text}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className={styles.playback}>
                    <div
                      className={`${styles.waveform} ${replaying ? styles.waveformActive : ""}`}
                      aria-hidden="true"
                    >
                      {Array.from({ length: 25 }, (_, index) => (
                        <i
                          key={index}
                          style={{
                            height: `${[6, 10, 17, 11, 22, 14, 8, 19, 12, 25, 16, 9, 21, 14, 7, 18, 11, 23, 15, 9, 19, 12, 7, 13, 6][index]}px`,
                            animationDelay: `${index * -0.07}s`,
                          }}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      className={styles.replayButton}
                      onClick={replayExample}
                    >
                      <Icon name={replaying ? "stop" : "play"} />
                      {replaying ? "Stop replay" : "Replay example"}
                    </button>
                  </div>
                </div>
                <aside
                  className={styles.assistantPane}
                  aria-label="Example private assistant"
                >
                  <div className={styles.assistantTitle}>
                    <span className={styles.sparkIcon}>
                      <Icon name="spark" />
                    </span>
                    <div>
                      <h4>Your assistant</h4>
                      <span>
                        <Icon name="lock" />
                        Private to the advisor
                      </span>
                    </div>
                  </div>
                  <p className={styles.assistantIntro}>
                    A useful question, at the right moment.
                  </p>
                  <div
                    className={`${styles.assistantSuggestion} ${replaying && visibleLines < 2 ? styles.suggestionWaiting : ""}`}
                  >
                    <span className={styles.suggestionEyebrow}>TO CLARIFY</span>
                    <h5>Confirm departure airport</h5>
                    <p>
                      The destination, timing and budget are captured. The
                      departure airport is still open.
                    </p>
                    <div className={styles.suggestedQuestion}>
                      “Which airport would you like to leave from?”
                    </div>
                  </div>
                  <div className={styles.captured}>
                    <span className={styles.smallLabel}>
                      FROM THE CONVERSATION
                    </span>
                    <div>
                      <span>Japan</span>
                      <span>12 days</span>
                      <span>CAD $8,000</span>
                    </div>
                  </div>
                  <div className={styles.assistantFooter}>
                    <Icon name="lock" />
                    <span>
                      Guidance for you.
                      <br />
                      Space to stay with your client.
                    </span>
                  </div>
                </aside>
              </div>
            </section>

            <section
              id={`${id}-panel-1`}
              role="tabpanel"
              aria-labelledby={`${id}-tab-1`}
              hidden={scene !== 1}
              tabIndex={0}
              className={styles.scenePanel}
            >
              <FileHeading view="Overview" />
              <div className={styles.contextBody}>
                <div className={styles.facts}>
                  <div>
                    <Icon name="people" />
                    <span>
                      Travellers<strong>2 people</strong>
                    </span>
                  </div>
                  <div>
                    <Icon name="calendar" />
                    <span>
                      Timing
                      <strong>
                        September <small>· 12 days</small>
                      </strong>
                    </span>
                  </div>
                  <div>
                    <Icon name="wallet" />
                    <span>
                      Budget
                      <strong>
                        CAD $8,000 <small>total</small>
                      </strong>
                    </span>
                  </div>
                </div>
                <div className={styles.contextGrid}>
                  <div className={styles.travelPlan}>
                    <h4>The travel plan</h4>
                    <p>
                      Maya and Alex are imagining{" "}
                      <strong>12 unhurried days in Japan</strong>, with food and
                      design at the heart of the trip.
                    </p>
                    <p>
                      They’re considering September, with a total budget of CAD
                      $8,000. Tokyo and Kyoto came up as a starting point,
                      leaving room to wander rather than packing every day.
                    </p>
                    <blockquote>
                      “We’d rather do fewer places and not feel rushed.”
                      <cite>Alex · Discovery call · 00:31</cite>
                    </blockquote>
                    <div className={styles.contextSources}>
                      <span className={styles.sourceStack} aria-hidden="true">
                        <Icon name="conversation" />
                        <Icon name="conversation" />
                      </span>
                      <span>
                        Context from <strong>2 conversations</strong>
                        <small>Discovery call + planning follow-up</small>
                      </span>
                    </div>
                  </div>
                  <aside className={styles.clarifyPane}>
                    <span className={styles.clarifyIcon}>?</span>
                    <h4>To clarify</h4>
                    <p>The missing details stay visible.</p>
                    <ol>
                      <li>Which airport will they depart from?</li>
                      <li>How flexible are their September dates?</li>
                    </ol>
                    <span className={styles.uncertaintyNote}>
                      Exact dates remain unconfirmed.
                    </span>
                  </aside>
                </div>
              </div>
            </section>

            <section
              id={`${id}-panel-2`}
              role="tabpanel"
              aria-labelledby={`${id}-tab-2`}
              hidden={scene !== 2}
              tabIndex={0}
              className={styles.scenePanel}
            >
              <FileHeading view="Trip journey" />
              <div className={styles.journeyBody}>
                <div className={styles.journeyMain}>
                  <div className={styles.journeyTitle}>
                    <h4>Trip journey</h4>
                    <span>
                      <Icon name="spark" />
                      Suggestions · for review
                    </span>
                  </div>
                  <ol className={styles.journeyTimeline}>
                    <li>
                      <span className={styles.timelineIcon}>
                        <Icon name="calendar" />
                      </span>
                      <div>
                        <span className={styles.phaseLabel}>
                          Before departure
                        </span>
                        <h5>Confirm the essentials</h5>
                        <p>
                          Clarify departure airport and September dates before
                          exploring flight options.
                        </p>
                        <span className={styles.entryTag}>
                          Proposed next step
                        </span>
                      </div>
                      <Icon name="edit" className={styles.editIcon} />
                    </li>
                    <li>
                      <span className={styles.timelineIcon}>
                        <Icon name="plane" />
                      </span>
                      <div>
                        <span className={styles.phaseLabel}>
                          During the trip
                        </span>
                        <h5>Tokyo → Kyoto, with room to wander</h5>
                        <p>
                          Explore a two-city route with unhurried days for food
                          and design.
                        </p>
                        <span className={styles.entryTag}>
                          Route to explore · dates to confirm
                        </span>
                      </div>
                      <Icon name="edit" className={styles.editIcon} />
                    </li>
                    <li>
                      <span className={styles.timelineIcon}>
                        <Icon name="mail" />
                      </span>
                      <div>
                        <span className={styles.phaseLabel}>
                          After the trip
                        </span>
                        <h5>Find out what stayed with them</h5>
                        <p>
                          Follow up after their return and carry their
                          preferences into the next conversation.
                        </p>
                        <span className={styles.entryTag}>
                          Suggested follow-up
                        </span>
                      </div>
                      <Icon name="edit" className={styles.editIcon} />
                    </li>
                  </ol>
                </div>
                <aside className={styles.journeyAside}>
                  <span className={styles.smallLabel}>
                    THE THREAD THROUGH IT ALL
                  </span>
                  <div className={styles.clientMonogram}>
                    M<span>&</span>A
                  </div>
                  <h4>Maya & Alex</h4>
                  <p>
                    Japan
                    <br />
                    12 days · September
                  </p>
                  <div className={styles.preferenceTags}>
                    <span>Food</span>
                    <span>Design</span>
                    <span>Slow pace</span>
                  </div>
                  <div className={styles.proposalNote}>
                    <Icon name="spark" />
                    <p>
                      A working journey.
                      <br />
                      <strong>Every proposal stays for review.</strong>
                    </p>
                  </div>
                </aside>
              </div>
            </section>

            <section
              id={`${id}-panel-3`}
              role="tabpanel"
              aria-labelledby={`${id}-tab-3`}
              hidden={scene !== 3}
              tabIndex={0}
              className={styles.scenePanel}
            >
              <FileHeading view="Follow-up" />
              <div className={styles.followUpBody}>
                <div className={styles.draftPane}>
                  <div className={styles.draftHeading}>
                    <h4>A personal follow-up</h4>
                    <span>
                      <span />
                      Draft · for review
                    </span>
                  </div>
                  <div className={styles.emailMeta}>
                    <p>
                      <span>To</span>Maya & Alex
                    </p>
                    <p>
                      <span>Subject</span>Your Japan plans — a few next steps
                    </p>
                  </div>
                  <label className={styles.draftLabel} htmlFor={`${id}-draft`}>
                    Message
                    <span>
                      <Icon name="edit" />
                      Editable example
                    </span>
                  </label>
                  <textarea
                    id={`${id}-draft`}
                    value={draft}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      setCopyStatus("idle");
                    }}
                    className={styles.draftInput}
                    spellCheck={false}
                  />
                  <div className={styles.draftActions}>
                    <button
                      className={styles.resetButton}
                      type="button"
                      onClick={() => {
                        setDraft(initialDraft);
                        setCopyStatus("idle");
                      }}
                    >
                      Reset example
                    </button>
                    <button
                      type="button"
                      className={styles.copyButton}
                      onClick={copyDraft}
                      disabled={!draft.trim()}
                    >
                      <Icon name={copyStatus === "copied" ? "check" : "copy"} />
                      {copyStatus === "copied" ? "Copied" : "Copy draft"}
                    </button>
                  </div>
                  <p className={styles.copyFeedback} role="status">
                    {copyStatus === "copied"
                      ? "Draft copied. Ready to use wherever you follow up."
                      : copyStatus === "error"
                        ? "Copy unavailable. Select the message and copy it manually."
                        : "Try editing the message, then copy your draft."}
                  </p>
                </div>
                <aside className={styles.reviewPane}>
                  <span className={styles.reviewIcon}>
                    <Icon name="mail" />
                  </span>
                  <h4>
                    Your voice.
                    <br />
                    Your final say.
                  </h4>
                  <p>A starting point grounded in the conversation.</p>
                  <ul>
                    <li>
                      <Icon name="check" />
                      Travel details recalled
                    </li>
                    <li>
                      <Icon name="check" />
                      Open questions included
                    </li>
                    <li>
                      <Icon name="edit" />
                      Yours to review and edit
                    </li>
                  </ul>
                  <span className={styles.reviewNote}>
                    This example only copies the text to your clipboard.
                  </span>
                </aside>
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className={styles.sceneCaption}>
        <div key={scene} className={styles.captionCopy}>
          <h3>{scenes[scene].detail}</h3>
          <p>{scenes[scene].caption}</p>
        </div>
        <span className={styles.sceneCount} aria-hidden="true">
          0{scene + 1}
          <span>/</span>04
        </span>
      </div>
      <p className={styles.srOnly} role="status">
        {replayStatus}
      </p>
    </div>
  );
}
