"use client";

import { Building2, CalendarDays, ChevronUp, LoaderCircle, MapPin, ShieldCheck, Wallet, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import type { LigneCapteManquant } from "@/app/live/capte-manquant";
import type { NudgeThreadItem } from "@/lib/conversation/workspace";
import type { UILanguage } from "@/lib/ui/language";

type Props = {
  items: NudgeThreadItem[];
  language: UILanguage;
  busy: boolean;
  signals: LigneCapteManquant[];
  checkingHotel: boolean;
  onDismiss: (id: string) => void;
  renderActions?: (item: NudgeThreadItem) => ReactNode;
};

const COMPACT_SIGNALS = ["destination", "dates", "hotel"] as const;
const SIGNAL_ICONS = { destination: MapPin, dates: CalendarDays, hotel: Building2, contrainte: ShieldCheck, budget: Wallet };
const SIGNAL_NAMES = {
  fr: { destination: "Destination", dates: "Dates", hotel: "Hôtel", contrainte: "Contraintes", budget: "Budget" },
  en: { destination: "Destination", dates: "Dates", hotel: "Hotel", contrainte: "Requirements", budget: "Budget" },
};

/** Localize presentation only; the supplied state and detail remain authoritative. */
function signalLabel(line: LigneCapteManquant, language: UILanguage) {
  if (language === "fr") return line.texte;
  if (line.id === "dates" && line.etat === "incertain") return "Approximate dates";
  const name = SIGNAL_NAMES.en[line.id];
  return `${name} ${line.etat === "capte" ? "captured" : line.etat === "incertain" ? "to confirm" : "pending"}`;
}

function SignalIcon({ signalId, state, attention, title }: { signalId: LigneCapteManquant["id"]; state: LigneCapteManquant["etat"] | "absent"; attention: boolean; title?: string }) {
  const Icon = SIGNAL_ICONS[signalId];
  return <span className="conversation-island-signal" data-state={state} title={title} aria-hidden="true">
    <Icon size={18} />
    <span className="conversation-island-status-dot" data-attention={attention || undefined}>
      <span className="conversation-island-dot-core" />
      <span className="conversation-island-dot-halo" />
    </span>
  </span>;
}

/** Suggestions remain a disclosure: new information never interrupts typing. */
export default function ConversationSuggestionIsland({ items, language, busy, signals, checkingHotel, onDismiss, renderActions }: Props) {
  const fr = language === "fr";
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);
  const count = items.length;
  const latestText = items.at(-1)?.text;
  const countLabel = `${count} ${count === 1 ? "suggestion" : "suggestions"}`;
  const checkingLabel = fr ? "Vérification…" : "Checking…";
  const preview = busy ? checkingLabel : latestText || (fr ? "Aucune suggestion pour le moment" : "No suggestions yet");
  const hotelCheckLabel = fr ? "Vérification de l’hôtel…" : "Checking the hotel…";
  const bySignal = new Map(signals.map((line) => [line.id, line]));
  const compactSignals = COMPACT_SIGNALS.map((key) => {
    const line = bySignal.get(key);
    const absentLabel = fr ? (key === "hotel" ? "Pas encore capté" : key === "dates" ? "Pas encore captées" : "Pas encore captée") : "Not yet captured";
    const label = line ? signalLabel(line, language) : `${SIGNAL_NAMES[language][key]} · ${absentLabel}`;
    const checking = key === "hotel" && checkingHotel;
    const state: LigneCapteManquant["etat"] | "absent" = line?.etat ?? "absent";
    return { key, line, absentLabel, state, attention: line?.etat === "manquant" || checking, label, summary: checking ? `${label} · ${hotelCheckLabel}` : label, detail: line?.detail, checking };
  });
  const extraSignals = signals.filter((line) => line.id === "contrainte" || line.id === "budget");

  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setExpanded(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (event.target instanceof Element && event.target.closest('dialog[open], [aria-modal="true"]')) return;
      event.preventDefault();
      event.stopPropagation();
      setExpanded(false);
      triggerRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);

  return <div className="conversation-suggestion-island" ref={rootRef}>
    <button className="conversation-island-trigger" ref={triggerRef} type="button" aria-expanded={expanded} aria-controls={`${id}-panel`} aria-labelledby={`${id}-label`} aria-describedby={`${id}-status ${id}-signals`} onClick={() => setExpanded((value) => !value)}>
      <span className="conversation-island-copy"><span className="conversation-island-label" id={`${id}-label`}>Suggestions</span><span className="conversation-island-count" aria-hidden="true">{count}</span></span>
      <span className="conversation-island-signals" aria-hidden="true">{compactSignals.map((signal) => <SignalIcon key={signal.key} signalId={signal.key} state={signal.state} attention={signal.attention} title={[signal.summary, signal.detail].filter(Boolean).join(" · ")} />)}</span>
      <span className="conversation-island-preview" aria-hidden="true">{busy ? <span className="conversation-island-spinner"><LoaderCircle size={14} /></span> : null}{preview}</span>
      <ChevronUp className="conversation-island-chevron" size={16} aria-hidden="true" />
    </button>
    <span className="conversation-island-status" id={`${id}-status`} role="status" aria-live="polite" aria-atomic="true">{countLabel}{busy ? ` · ${checkingLabel}` : ""}</span>
    <span className="conversation-island-status" id={`${id}-signals`}>{compactSignals.map((signal) => signal.summary).join(". ")}</span>
    <section className="conversation-island-panel" id={`${id}-panel`} role="region" aria-label={fr ? "Suggestions privées" : "Private suggestions"} hidden={!expanded}>
      <section className="conversation-island-context" aria-label={fr ? "Dans la conversation" : "In this conversation"}>
        <div className="conversation-island-context-grid">{compactSignals.map((signal) => <div className="conversation-island-context-cell" key={signal.key} data-state={signal.state} role="group" aria-label={[signal.summary, signal.detail].filter(Boolean).join(" · ")} title={[signal.summary, signal.detail].filter(Boolean).join(" · ")}>
          <div className="conversation-island-context-heading">
            <SignalIcon signalId={signal.key} state={signal.state} attention={signal.attention} />
            <h3 aria-label={signal.line ? signal.label : SIGNAL_NAMES[language][signal.key]}>
              <span className="conversation-island-context-title-full">{signal.line ? signal.label : SIGNAL_NAMES[language][signal.key]}</span>
              <span className="conversation-island-context-title-short" aria-hidden="true">{SIGNAL_NAMES[language][signal.key]}</span>
            </h3>
          </div>
          {signal.detail ? <p className="conversation-island-context-detail">{signal.detail}</p> : !signal.line ? <p className="conversation-island-context-detail">{signal.absentLabel}</p> : null}
          {signal.checking ? <p className="conversation-island-hotel-check">{hotelCheckLabel}</p> : null}
        </div>)}</div>
      </section>
      <div className="conversation-island-scroll" role="region" aria-label={fr ? "Suggestions et autres informations" : "Suggestions and additional details"} tabIndex={0}>
        {extraSignals.length ? <div className="conversation-island-extra"><ul className="conversation-island-signal-list">{extraSignals.map((line) => {
          return <li className="conversation-island-signal-line" key={line.id} data-state={line.etat}>
            <SignalIcon signalId={line.id} state={line.etat} attention={line.etat === "manquant"} />
            <span className="conversation-island-signal-copy"><strong>{signalLabel(line, language)}</strong>{line.detail ? <span className="conversation-island-signal-detail">{line.detail}</span> : null}</span>
          </li>;
        })}</ul></div> : null}
        <h3 className="conversation-island-section-label conversation-island-suggestions-label">Suggestions</h3>
      {count ? <ul className="conversation-island-list">{[...items].reverse().map((item, index) => {
        const textId = `${id}-suggestion-${index}`;
        const actions = renderActions?.(item);
        return <li className="conversation-island-item" key={item.id}>
          <div className="conversation-island-item-copy">
            <p className="conversation-island-text" id={textId}>{item.text}</p>
            {item.extraits?.length ? <ul className="conversation-island-excerpts">{item.extraits.map((excerpt, excerptIndex) => <li key={excerptIndex}><blockquote>{excerpt}</blockquote></li>)}</ul> : null}
            {actions ? <div className="conversation-island-actions">{actions}</div> : null}
          </div>
          <button className="conversation-island-dismiss" type="button" aria-label={fr ? "Masquer la suggestion" : "Dismiss suggestion"} aria-describedby={textId} onClick={() => { onDismiss(item.id); triggerRef.current?.focus({ preventScroll: true }); }}><X size={16} aria-hidden="true" /></button>
        </li>;
      })}</ul> : <p className="conversation-island-empty">{fr ? "Les suggestions de cette conversation apparaîtront ici." : "Suggestions from this conversation will appear here."}</p>}
      </div>
    </section>
  </div>;
}
