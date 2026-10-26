"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { LocationGlobe } from "./location-globe";
import styles from "./personal-bento.module.css";

const emailAddress = "jmanuelr.99@gmail.com";
const collaborations = [
  {
    name: "Equisoft",
    src: "/client-equisoft.svg",
    width: 160,
    height: 40,
    role: "Senior product design across fintech, insurance and AI.",
  },
  {
    name: "FolksHR",
    src: "/client-folks.svg",
    width: 77,
    height: 24,
    role: "Product design for HR software.",
  },
  {
    name: "PetalMD",
    src: "/client-petalmd.svg",
    width: 163,
    height: 72,
    role: "User research in Quebec’s healthcare system.",
  },
  {
    name: "Peak Media",
    src: "/client-peak-wordmark.svg",
    width: 173,
    height: 100,
    role: "Immersive experience design for museums.",
  },
] as const;
type MotionCardProps = { paused?: boolean };

function Arrow({ diagonal = true }: { diagonal?: boolean }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h16m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LocalClock() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Toronto",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const update = () => setTime(formatter.format(new Date()));
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <span className={styles.clock}>
      {time ?? "--:--"}
      <span>local time</span>
    </span>
  );
}

/** Each decorative animation belongs to its own visible card. */
function useCardMotion(paused: boolean) {
  const card = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = card.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = !window.IntersectionObserver;
    const update = () =>
      element.style.setProperty(
        "--bento-play-state",
        inView && !document.hidden && !paused && !motion.matches
          ? "running"
          : "paused",
      );
    const observer = window.IntersectionObserver
      ? new IntersectionObserver(([entry]) => {
          inView = entry.isIntersecting;
          update();
        })
      : null;
    observer?.observe(element);
    document.addEventListener("visibilitychange", update);
    motion.addEventListener("change", update);
    update();
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", update);
      motion.removeEventListener("change", update);
      element.style.removeProperty("--bento-play-state");
    };
  }, [paused]);
  return card;
}

export function ProfileCard({ portraitSrc = "/profile/ramon.jpg" }: { portraitSrc?: string } = {}) {
  const [failedPortrait, setFailedPortrait] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState("");
  const copyTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  async function copyEmail() {
    if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(emailAddress);
      setCopyFeedback("Email copied.");
    } catch {
      setCopyFeedback("Copy unavailable.");
    }
    copyTimer.current = window.setTimeout(() => setCopyFeedback(""), 3200);
  }

  return (
    <section
      className={`${styles.card} ${styles.profile}`}
      aria-labelledby="portfolio-intro-title"
    >
      <div className={styles.identity}>
        <div className={styles.portrait}>
          {portraitSrc && failedPortrait !== portraitSrc ? (
            <Image
              src={portraitSrc}
              alt="Ramon JM"
              width={72}
              height={72}
              sizes="72px"
              unoptimized
              onError={() => setFailedPortrait(portraitSrc)}
            />
          ) : (
            <span className={styles.portraitFallback} aria-hidden="true">
              RJ
            </span>
          )}
        </div>
      </div>
      <div className={styles.profileName}>
        Ramon JM <span>Senior product designer</span>
      </div>
      <h1 id="portfolio-intro-title">
        I design & build
        <br />
        0–1 digital products.
      </h1>
      <ul className={styles.profileTags} aria-label="Design expertise">
        {["UX", "UI", "Strategy", "Research"].map(tag => <li key={tag}>{tag}</li>)}
      </ul>
      <p className={styles.bio}>
        Seven years connecting strategy, design and code across fintech,
        insurance and independent ideas.
      </p>
      <div className={styles.inspiration}>
        <p className={styles.inspirationLabel}>Inspired by</p>
        <ul>
          <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v9H8zM6 13h12v3H6zm2 3v5m8-5v5M8 8h8" /></svg><span>Product &amp; industrial design</span></li>
          <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8M5 9v12h14V9M10 21v-7h4v7" /></svg><span>Architecture</span></li>
          <li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 13 2v11L5 16V5Zm0 11-3 3 13 2 7-3-4 0M8 8l7 1" /></svg><span>Interface</span></li>
        </ul>
      </div>
      <div className={styles.profileLinks}>
        <a className={styles.email} href={`mailto:${emailAddress}`}>
          Let’s talk <Arrow diagonal={false} />
        </a>
        <button
          className={styles.copyEmail}
          type="button"
          onClick={() => void copyEmail()}
          aria-label="Copy email address"
          aria-describedby="profile-copy-tooltip"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="8"
              y="8"
              width="12"
              height="12"
              rx="3"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M15 5V4a1 1 0 0 0-1-1H5a2 2 0 0 0-2 2v9a1 1 0 0 0 1 1h1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span id="profile-copy-tooltip" role="tooltip" className={styles.iconTooltip}>{copyFeedback || "Copy address email"}</span>
        </button>
        <a
          className={styles.linkedin}
          href="https://www.linkedin.com/in/jmanuelr"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ramon JM on LinkedIn (opens in a new tab)"
          aria-describedby="profile-linkedin-tooltip"
        >
          <span aria-hidden="true">in</span>
          <span id="profile-linkedin-tooltip" role="tooltip" className={styles.iconTooltip}>Navigate to LinkedIn<small>linkedin.com/in/jmanuelr</small></span>
        </a>
      </div>
      <p className={styles.copyStatus} role="status">
        {copyFeedback}
      </p>
    </section>
  );
}

export function TodoCard({ paused = false }: MotionCardProps = {}) {
  const milestones = [
    {
      title: "Study architecture, industrial design & human–computer interaction",
      completed: true,
    },
    { title: "Work in fintech & insurance", completed: true },
    {
      title: "Build my first web app & reach 500 users",
      detail: "First build: pasting code snippets from ChatGPT in 2024. Now sunsetted.",
      completed: true,
    },
    { title: "Launch my first iOS app", detail: "Nudge To-do", completed: true },
    { title: "Work at an AI-first company", completed: false },
    { title: "Work at a crypto company", completed: false },
    { title: "Work at a robotics company", completed: false },
  ];
  return (
    <section
      className={`${styles.card} ${styles.todo}`}
      data-paused={paused}
      aria-labelledby="todo-title"
    >
      <div className={styles.cardHeading}><h2 id="todo-title">To-do</h2></div>
      <ul className={styles.milestones}>
        {milestones.map(({ title, detail, completed }) => (
          <li key={title}>
            <span
              className={styles.milestoneCheck}
              data-completed={completed}
              aria-hidden="true"
            >
              {completed && (
                <svg viewBox="0 0 16 16" fill="none">
                  <path d="m4 8 2.5 2.5L12 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <div>
              <span className={styles.srOnly}>{completed ? "Completed: " : "To do: "}</span>
              <span>{title}</span>
              {detail && <small>{detail}</small>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CurrentWorkCard({ paused = false }: MotionCardProps) {
  const card = useCardMotion(paused);
  const areas = ["Policy administration", "Customer relationships", "Digital insurance tools", "Case management", "Agentic solutions & AI integrations"];
  return (
    <section
      ref={card}
      data-paused={paused}
      className={`${styles.card} ${styles.current}`}
      aria-labelledby="current-title"
    >
      <div className={styles.cardHeading}>
        <h2 id="current-title">Currently at</h2>

      </div>
      <div className={styles.workIdentity}>
        <WorkGlassMark />
        <span className={styles.workName}>Equisoft</span>
      </div>
      <p className={styles.workRole}>Senior product designer</p>
      <p className={styles.workSectors}>Fintech · Insurance · AI</p>
      <div className={styles.workAreaWindow} aria-label="Areas of work">
        <div className={styles.workAreaTrack}>
          {[0,1].map(copy => <ul key={copy} aria-hidden={copy === 1 || undefined}>{areas.map(area => <li key={area}>{area}</li>)}</ul>)}
        </div>
      </div>
    </section>
  );
}

export function ClientsCard({ paused = false }: MotionCardProps) {
  const card = useCardMotion(paused);
  const captionId = useId();
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <section
      ref={card}
      data-paused={paused}
      className={`${styles.card} ${styles.clients}`}
      aria-labelledby="collaborations-title"
    >
      <div className={styles.cardHeading}>
        <h2 id="collaborations-title">Clients</h2>
        <span>Past & present</span>
      </div>
      <div
        className={styles.clientWindow}
        role="group"
        aria-label="Choose a team to see my contribution"
      >
        <div className={styles.clientTrack}>
          <ul>
            {collaborations.map((client, index) => (
              <li key={client.name} data-client={client.name}>
                <button
                  type="button"
                  className={styles.clientButton}
                  aria-label={`Show my work with ${client.name}`}
                  aria-pressed={selected === index}
                  aria-controls={captionId}
                  onClick={() => setSelected(index)}
                  onFocus={(event) =>
                    event.currentTarget.scrollIntoView({
                      block: "nearest",
                      inline: "nearest",
                      behavior: "instant",
                    })
                  }
                >
                  <Image
                    src={client.src}
                    alt=""
                    width={client.width}
                    height={client.height}
                    unoptimized
                  />
                </button>
              </li>
            ))}
          </ul>
          <ul className={styles.clientDuplicate} aria-hidden="true">
            {collaborations.map((client) => (
              <li key={client.name} data-client={client.name}>
                <span>
                  <Image
                    src={client.src}
                    alt=""
                    width={client.width}
                    height={client.height}
                    unoptimized
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className={styles.clientCaption} id={captionId} role="status">
        {selected === null ? (
          "Different teams. Shared ambition."
        ) : (
          <>
            <strong>{collaborations[selected].name}</strong>
            {collaborations[selected].role}
          </>
        )}
      </p>
    </section>
  );
}

export function LocationCard({ paused = false }: MotionCardProps) {
  return (
    <section
      data-paused={paused}
      className={`${styles.card} ${styles.location}`}
      aria-labelledby="location-title"
    >
      <div className={styles.globeCanvas}>
        <LocationGlobe paused={paused} />
      </div>
      <div className={styles.locationCopy}>
        <p>Location</p>
        <h2 id="location-title">Quebec City</h2>
        <span>Canada · Eastern time</span>
        <LocalClock />
      </div>
    </section>
  );
}

// Adapted from the case management assistant’s native glass mark.
const workPyramidPaths = [
  "M15.84 0.00 22.04 10.82 9.36 10.82 11.10 7.92 15.84 7.92Z",
  "M15.84 12.83 23.19 12.83 26.49 18.59 4.71 18.59 6.45 15.69 15.84 15.69Z",
  "M15.84 20.59 27.64 20.59 31.00 26.45 0.00 26.45 1.74 23.55 15.84 23.55Z",
];
function WorkGlassMark() {
  const uid = useId().replace(/:/g, "");
  const clip = `${uid}-clip`;
  const glass = `${uid}-glass`;
  const sheen = `${uid}-sheen`;
  const hot = `${uid}-hot`;
  const cool = `${uid}-cool`;

  return (
    <svg
      className={styles.workGlassMark}
      aria-hidden
      focusable="false"
      height={48}
      width={48}
      viewBox={"-0.5 -2.77 32 32"}
    >
      <defs>
        <clipPath id={clip}>
          {workPyramidPaths.map((d) => (
            <path key={d} d={d} />
          ))}
        </clipPath>
        <linearGradient id={glass} x1="18%" y1="0%" x2="88%" y2="100%">
          <stop offset="0%" stopColor="#fbdad6" stopOpacity="0.88" />
          <stop offset="38%" stopColor="#ef473e" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#d63a30" stopOpacity="0.96" />
        </linearGradient>
        <linearGradient id={sheen} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={hot} cx="35%" cy="28%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="48%" stopColor="#fbdad6" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={cool} cx="68%" cy="78%" r="58%">
          <stop offset="0%" stopColor="#961e18" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#961e18" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect
          className="galia-glass-fill"
          x="-0.5"
          y="-2.77"
          width="32"
          height="32"
          fill={`url(#${glass})`}
        />
        <rect
          className="galia-glass-drift-a"
          x="-10"
          y="-10"
          width="30"
          height="30"
          fill={`url(#${hot})`}
        />
        <rect
          className="galia-glass-drift-b"
          x="6"
          y="6"
          width="30"
          height="30"
          fill={`url(#${cool})`}
        />
        <rect
          className="galia-glass-sheen"
          x="-14"
          y="-6"
          width="16"
          height="42"
          fill={`url(#${sheen})`}
        />
      </g>
      <g fill="none" stroke="rgba(205,54,44,0.28)" strokeLinejoin="round" strokeWidth="0.25">
        {workPyramidPaths.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}
