"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import styles from "./project-previews.module.css";

type PreviewKind = "abeam" | "world" | "tracer" | "roi" | "shakepay" | "crypto";

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 10h10m-5-5 5 5-5 5" />
    </svg>
  );
}

function PreviewCard({
  name,
  category,
  href,
  kind,
  height,
  icon,
  paused,
  children,
}: {
  name: string;
  category: string;
  href: string;
  kind: PreviewKind;
  height: number;
  icon?: string;
  paused: boolean;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <article
      className={`${styles.card} ${styles[kind]}`}
      style={{ "--preview-height": `${height}px` } as CSSProperties}
      data-paused={paused ? "true" : "false"}
      aria-labelledby={`${id}-title`}
    >
      <div className={styles.heading}>
        {icon && (
          <Image
            className={styles.projectIcon}
            src={icon}
            alt=""
            width={32}
            height={32}
            unoptimized
            loading="eager"
          />
        )}
        <div>
          <h2 id={`${id}-title`}>{name}</h2>
          <p>{category}</p>
        </div>
      </div>
      <div className={styles.body}>{children}</div>
      <Link className={styles.projectLink} href={href}>
        Explore {name}
        <Arrow />
      </Link>
    </article>
  );
}

function ViewTabs<T extends string>({
  label,
  value,
  options,
  onChange,
  controls,
  className = "",
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  controls: string;
  className?: string;
}) {
  return (
    <div
      className={`${styles.tabs} ${className}`}
      role="group"
      aria-label={label}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          aria-controls={controls}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function AbeamPreview({ paused }: { paused: boolean }) {
  const id = useId();
  const [view, setView] = useState<"context" | "explorer">("context");
  return (
    <PreviewCard
      name="aBeam"
      category="AI travel copilot"
      href="/abeam"
      kind="abeam"
      height={520}
      icon="/abeam/icon.svg"
      paused={paused}
    >
      <ViewTabs
        label="aBeam preview"
        value={view}
        onChange={setView}
        options={[
          { value: "context", label: "Context" },
          { value: "explorer", label: "Explorer" },
        ]}
        controls={`${id}-view`}
      />
      <div className={styles.abeamWindow} id={`${id}-view`}>
        <div className={styles.browserBar} aria-hidden="true">
          <span>
            <i />
            <i />
            <i />
          </span>
          <small>{view === "context" ? "Client file" : "Explorer"}</small>
        </div>
        {view === "context" ? (
          <div
            key="context"
            className={`${styles.context} ${styles.viewEnter}`}
          >
            <p className={styles.demoLabel}>Demo · Fictional client</p>
            <h3>Japan, at their own pace.</h3>
            <p className={styles.clientNames}>Maya & Alex</p>
            <dl className={styles.contextFacts}>
              <div>
                <dt>When</dt>
                <dd>September</dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>12 days</dd>
              </div>
              <div>
                <dt>Budget</dt>
                <dd>CAD $8,000</dd>
              </div>
              <div>
                <dt>Pace</dt>
                <dd>Unhurried</dd>
              </div>
            </dl>
            <p className={styles.clarify}>
              <span>To clarify</span>Departure airport
            </p>
          </div>
        ) : (
          <Image
            key="explorer"
            className={`${styles.explorerImage} ${styles.viewEnter}`}
            src="/playground/abeam-explore.webp"
            alt="Actual aBeam Explorer interface showing travel research and flight details"
            width={900}
            height={600}
            unoptimized
            loading="eager"
          />
        )}
      </div>
      <p className={styles.abeamCaption}>
        {view === "context"
          ? "A conversation becomes useful context."
          : "Actual app · Travel research, in view."}
      </p>
    </PreviewCard>
  );
}

const poses = [
  { key: "top", src: "/world/buster-top.webp" },
  { key: "middle", src: "/world/buster-middle.webp" },
  { key: "bottom", src: "/world/buster-bottom.webp" },
] as const;

export function WorldPreview({ paused }: { paused: boolean }) {
  const [reps, setReps] = useState(0);
  const [pose, setPose] = useState<(typeof poses)[number]["key"]>("top");
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  function clearPoseTimers() {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  }

  function tryRep() {
    if (reps >= 5) return;
    clearPoseTimers();
    setReps((previous) => Math.min(5, previous + 1));
    if (
      paused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setPose("top");
      return;
    }
    setPose("bottom");
    timers.current = [
      window.setTimeout(() => setPose("middle"), 180),
      window.setTimeout(() => setPose("top"), 380),
    ];
  }

  function resetSet() {
    clearPoseTimers();
    setReps(0);
    setPose("top");
  }

  return (
    <PreviewCard
      name="PushedWorld"
      category="Every rep moves you forward"
      href="/world"
      kind="world"
      height={560}
      icon="/world/app-icon.png"
      paused={paused}
    >
      <div className={styles.worldStage}>
        <Image
          className={styles.worldScene}
          src="/world/path-world.webp"
          alt=""
          fill
          unoptimized
          loading="eager"
        />
        <div className={styles.worldStageShade} />
        <span className={styles.worldLevel}>A little further.</span>
        <div
          className={styles.buster}
          role="img"
          aria-label="Buster demonstrating a push-up"
        >
          {poses.map((item) => (
            <Image
              key={item.key}
              className={`${styles.pose} ${item.key === "top" ? styles.restPose : ""} ${item.key === pose ? styles.activePose : ""}`}
              src={item.src}
              alt=""
              width={600}
              height={396}
              unoptimized
              loading="eager"
            />
          ))}
        </div>
      </div>
      <div className={styles.worldControls}>
        <div className={styles.repSummary}>
          <div>
            <strong>
              {reps}
              <span> / 5</span>
            </strong>
            <p>Demo reps</p>
          </div>
          <span className={styles.setStatus} role="status">
            {reps === 5 ? "Example set complete" : "Try a small set"}
          </span>
        </div>
        <progress
          className={styles.repProgress}
          value={reps}
          max={5}
          aria-label="Demo set progress"
        />
        <div className={styles.repActions}>
          <button
            type="button"
            className={styles.repButton}
            onClick={tryRep}
            disabled={reps === 5}
          >
            {reps === 5 ? "Five reps. A little further." : "Try one demo rep"}
            <span aria-hidden="true">{reps === 5 ? "✓" : "+"}</span>
          </button>
          <button
            type="button"
            className={styles.resetButton}
            onClick={resetSet}
            aria-label="Reset demo reps"
          >
            Reset
          </button>
        </div>
      </div>
    </PreviewCard>
  );
}

export function TracerPreview({ paused }: { paused: boolean }) {
  const id = useId();
  const [view, setView] = useState<"work" | "identity">("identity");
  return (
    <div className={styles.tracerWrap}>
      <Image
        className={styles.tracerBackdrop}
        src="/playground/tracer-campaign.webp"
        alt=""
        fill
        unoptimized
        loading="eager"
      />
      <PreviewCard
        name="Tracer"
        category="Research security · Product & brand"
        href="/tracer"
        kind="tracer"
        height={440}
        paused={paused}
      >
        <div className={styles.tracerPanel} id={`${id}-view`}>
          {view === "work" ? (
            <Image
              key="work"
              className={`${styles.tracerWork} ${styles.viewEnter}`}
              src="/playground/tracer-workspace.webp"
              alt="Actual Tracer workspace, with cases, evidence categories and a research report"
              fill
              unoptimized
              loading="eager"
            />
          ) : (
            <Image
              key="identity"
              className={`${styles.tracerIdentity} ${styles.viewEnter}`}
              src="/playground/tracer-identity.webp"
              alt="Tracer brand architecture combining its blue identity and office application"
              fill
              unoptimized
              loading="eager"
            />
          )}
          <span className={styles.tracerPanelLabel}>
            {view === "work"
              ? "From evidence to a clear report."
              : "A clear identity, in context."}
          </span>
        </div>
        <ViewTabs
          label="Tracer presentation"
          value={view}
          onChange={setView}
          options={[
            { value: "work", label: "Work" },
            { value: "identity", label: "Identity" },
          ]}
          controls={`${id}-view`}
          className={styles.tracerTabs}
        />
      </PreviewCard>
    </div>
  );
}

export function DecisionPreview({ paused }: { paused: boolean }) {
  const id = useId();
  const [hours, setHours] = useState(3);
  return (
    <PreviewCard
      name="Decision ROI"
      category="Make the cost of waiting visible"
      href="/equisoft-labs"
      kind="roi"
      height={460}
      paused={paused}
    >
      <div className={styles.roiBody}>
        <Image
          className={styles.calculator}
          src="/playground/decision-calculator.webp"
          alt=""
          width={640}
          height={640}
          unoptimized
          loading="eager"
        />
        <p className={styles.roiLabel}>Illustrative time saved</p>
        <output
          className={styles.roiOutput}
          htmlFor={`${id}-hours`}
          aria-live="off"
        >
          <strong>{hours * 52}</strong>
          <span>hours / year</span>
        </output>
        <div className={styles.roiControls}>
          <label htmlFor={`${id}-hours`}>
            Hours saved each week<span>{hours} h</span>
          </label>
          <input
            id={`${id}-hours`}
            type="range"
            min={1}
            max={10}
            step={1}
            value={hours}
            onChange={(event) => setHours(Number(event.target.value))}
            aria-valuetext={`${hours} hours per week; ${hours * 52} illustrative hours per year`}
          />
          <p>Illustrative: {hours} h/week × 52 weeks.</p>
          <span className={styles.roiNote}>
            A simple scenario to explore the value of better context.
          </span>
        </div>
      </div>
    </PreviewCard>
  );
}

export function ShakepayPreview({ paused }: { paused: boolean }) {
  const id = useId();
  const [view, setView] = useState<"rewards" | "potential">("rewards");
  return (
    <PreviewCard
      name="Shakepay"
      category="Independent study"
      href="/shakepay"
      kind="shakepay"
      height={560}
      icon="/shakepay-icon.png"
      paused={paused}
    >
      <ViewTabs
        label="Shakepay prototype screen"
        value={view}
        onChange={setView}
        options={[
          { value: "rewards", label: "Rewards" },
          { value: "potential", label: "Potential" },
        ]}
        controls={`${id}-view`}
      />
      <div className={styles.shakepayStage} id={`${id}-view`}>
        <span className={styles.shakepayOrbit} aria-hidden="true" />
        <div className={styles.shakepayPhone}>
          <Image
            key={view}
            className={styles.viewEnter}
            src={
              view === "rewards"
                ? "/playground/shakepay-rewards.webp"
                : "/playground/shakepay-potential.webp"
            }
            alt={
              view === "rewards"
                ? "Fictional rewards overview from the independent Shakepay prototype"
                : "Fictional reward calculator from the independent Shakepay prototype"
            }
            width={384}
            height={835}
            unoptimized
            loading="eager"
          />
        </div>
        <span className={styles.shakepayLabel}>
          {view === "rewards"
            ? "See what contributes."
            : "Explore a different routine."}
        </span>
      </div>
      <p className={styles.studyNote}>Fictional prototype · Unaffiliated</p>
    </PreviewCard>
  );
}

export function CryptoPreview({ paused }: { paused: boolean }) {
  const id = useId();
  const [view, setView] = useState<"legacy" | "security">("legacy");
  return (
    <PreviewCard
      name="CryptoCroc"
      category="A more thoughtful handoff"
      href="/crypto-inheritance"
      kind="crypto"
      height={460}
      paused={paused}
    >
      <div className={styles.cryptoStage}>
        <Image
          className={styles.cryptoMascot}
          src="/playground/cryptocroc-mascot.webp"
          alt="CryptoCroc holding a wallet and a Bitcoin coin"
          width={640}
          height={640}
          unoptimized
          loading="eager"
        />
        <div className={styles.cryptoNote} id={`${id}-view`}>
          <p className={styles.cryptoDemo}>Demo · Concept preview</p>
          {view === "legacy" ? (
            <div key="legacy" className={styles.viewEnter}>
              <h3>Plan the handoff.</h3>
              <p>
                Document holdings. Prepare a trusted person. Rehearse the next
                step.
              </p>
            </div>
          ) : (
            <div key="security" className={styles.viewEnter}>
              <h3>Keep recovery secrets offline.</h3>
              <p>
                The organizer explains the process. Keys and seed phrases stay
                outside it.
              </p>
            </div>
          )}
        </div>
        <ViewTabs
          label="CryptoCroc preview"
          value={view}
          onChange={setView}
          options={[
            { value: "legacy", label: "Legacy" },
            { value: "security", label: "Security" },
          ]}
          controls={`${id}-view`}
          className={styles.cryptoTabs}
        />
      </div>
    </PreviewCard>
  );
}
