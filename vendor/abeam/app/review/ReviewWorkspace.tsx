"use client";

/**
 * ReviewWorkspace — les DEUX VOLETS du review (§6.2 v2, après §6.1bis).
 *
 *   ┌──────────── récap FR (2fr) ──────────────┬──── (1fr) ─────────┐
 *   │ titre · cadre · 2-4 phrases ancrées       │ [À clarifier]      │
 *   │ ce qui compte · contraintes · étapes      │ [Transcript]       │
 *   │ Suggestions (cartes) sous le récap        │ [Agent]            │
 *   └───────────────────────────────────────────┴────────────────────┘
 *
 * Ce que la machine a compris (gauche, en prose française) et sa preuve (droite,
 * le transcript) sont visibles en même temps ; l'agent conversationnel occupe **la
 * même surface** que la preuve, comme chez Fireflies — on bascule entre
 * « demande » et « vérifie » sans perdre sa place, et sans quitter l'écran
 * (loi 6).
 *
 * W6b a retiré d'ici : la matrice de champs, les filtres par statut, et le
 * pré-remplissage du fil Agent depuis un champ manquant. Le volet droit gagne
 * « À clarifier », qui est la seule chose actionnable qu'on affichait vraiment —
 * mais en phrases, plus en noms de champs (loi 9).
 *
 * Le dock audio n'est PAS ici : il est monté un niveau au-dessus, au niveau de la
 * page de review, pour survivre au changement d'onglet (Brief · Conversations ·
 * Suivi). Ce composant reçoit donc la commande de seek déjà câblée
 * (`useReviewAudio`), il ne possède pas la lecture.
 */

import { defineBilingualCopy } from "@/lib/ui/copy";
import { uiLocale } from "@/lib/ui/language";
import { ListChecks, Sparkles } from "lucide-react";
import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type CSSProperties } from "react";

import type { TripBrief } from "@/lib/extraction/trip-brief";
import type { NudgeMessage } from "@/lib/live/nudge-agent";

import AgentPanel from "./AgentPanel";
import ClarifyPanel from "./ClarifyPanel";
import RecapPanel from "./RecapPanel";
import type { ReviewAudio } from "./useReviewAudio";
import type { ReviewLanguage, ReviewNotesState } from "./types";

import "../review.css";
import "./folder-context.css";

type SidePane = "clarify" | "agent";

const COPY = defineBilingualCopy({
  fr: {
    panes: "À clarifier et copilote",
    clarify: "À clarifier",
    agent: "Agent",
    conversations: (count: number) => `${new Intl.NumberFormat(uiLocale("fr")).format(count)} ${count === 1 ? "conversation" : "conversations"}`,
  },
  en: {
    panes: "To clarify and copilot",
    clarify: "To clarify",
    agent: "Agent",
    conversations: (count: number) => `${new Intl.NumberFormat(uiLocale("en")).format(count)} ${count === 1 ? "conversation" : "conversations"}`,
  },
});

export type ReviewWorkspaceProps = {
  /** Brief fusionné du dossier. Il ne s'affiche pas : il porte les ancres (loi 9). */
  brief: TripBrief;
  /** Le récap, dans son état courant (attente, échec, prêt, pas encore demandé). */
  notes: ReviewNotesState;
  /** Demande explicite de génération du récap. Rien ne se génère tout seul. */
  onGenerateNotes?: () => void;
  language: ReviewLanguage;
  audio: ReviewAudio;
  /** Nom du dossier — sert de portée visible à l'Agent. */
  scopeLabel: string;
  /** Actual folder conversations, independent of which audio is currently loaded. */
  conversationCount?: number;
  /**
   * Le brief passé est-il une fusion ? Faux dans le bac « Non classées ».
   * L'Agent doit annoncer la portée qu'il a vraiment, pas celle d'un dossier.
   */
  fusionne?: boolean;
  onAskAgent: (messages: NudgeMessage[]) => Promise<string>;
  suggestionsSlot?: ReactNode;
  /** The folder shell can mount the proof rail beside all three tabs. */
  showSidePanel?: boolean;
  recapVariant?: "document" | "dashboard";
};

export function ReviewWorkspace({
  brief,
  notes,
  onGenerateNotes,
  language,
  audio,
  scopeLabel,
  conversationCount,
  fusionne,
  onAskAgent,
  suggestionsSlot,
  showSidePanel = true,
  recapVariant = "document",
}: ReviewWorkspaceProps) {
  return (
    <div className={`rv-panes${showSidePanel ? " has-side-panel" : ""}`}>
      <div className="rv-recap-column">
        <RecapPanel
          brief={brief}
          notes={notes}
          language={language}
          onGenerate={onGenerateNotes}
          onSeek={audio.canSeek ? audio.seek : undefined}
          variant={recapVariant}
        />
        {suggestionsSlot}
      </div>

      {showSidePanel ? (
        <ReviewSidePanel
          brief={brief}
          notes={notes}
          language={language}
          audio={audio}
          scopeLabel={scopeLabel}
          conversationCount={conversationCount}
          fusionne={fusionne}
          onGenerateNotes={onGenerateNotes}
          onAskAgent={onAskAgent}
        />
      ) : null}
    </div>
  );
}

export type ReviewSidePanelProps = {
  brief: TripBrief;
  notes: ReviewNotesState;
  language: ReviewLanguage;
  audio: ReviewAudio;
  scopeLabel: string;
  conversationCount?: number;
  fusionne?: boolean;
  onGenerateNotes?: () => void;
  onAskAgent: (messages: NudgeMessage[]) => Promise<string>;
};

/**
 * The proof rail is deliberately a separate surface from the brief. It stays
 * pinned to the viewport while the recap scrolls, and its left edge can be
 * pulled wider when a transcript needs more room.
 */
export function ReviewSidePanel({
  brief,
  notes,
  language,
  audio,
  scopeLabel,
  conversationCount,
  fusionne,
  onGenerateNotes,
  onAskAgent,
}: ReviewSidePanelProps) {
  const copy = COPY[language];
  const [pane, setPane] = useState<SidePane>("clarify");
  const [draft, setDraft] = useState("");
  const panelVariant = conversationCount === undefined ? "default" : "folder";
  const count = conversationCount === undefined ? audio.sessions.length : Number.isFinite(conversationCount) ? Math.max(0, Math.floor(conversationCount)) : 0;
  const scopeNote = fusionne !== false && count > 0 ? copy.conversations(count) : undefined;
  const [width, setWidth] = useState<number | null>(null);
  const resizeCleanupRef = useRef<(() => void) | null>(null);
  const paneId = useId();
  const tabRefs = useRef<Partial<Record<SidePane, HTMLButtonElement>>>({});

  useEffect(() => () => resizeCleanupRef.current?.(), []);

  const tabs: Array<{ id: SidePane; label: string; Icon: typeof ListChecks }> = [
    { id: "clarify", label: copy.clarify, Icon: ListChecks },
    { id: "agent", label: copy.agent, Icon: Sparkles },
  ];

  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    resizeCleanupRef.current?.();
    const startX = event.clientX;
    const pointerId = event.pointerId;
    const startWidth = width ?? Math.round(window.innerWidth * 0.2);
    const minWidth = 280;
    const maxWidth = Math.max(minWidth, Math.round(window.innerWidth * 0.45));
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      const next = Math.min(maxWidth, Math.max(minWidth, startWidth + (startX - moveEvent.clientX)));
      setWidth(next);
    };
    const cleanup = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      resizeCleanupRef.current = null;
    };
    const onEnd = (endEvent: PointerEvent) => {
      if (endEvent.pointerId === pointerId) cleanup();
    };

    resizeCleanupRef.current = cleanup;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const nudgeResize = (direction: -1 | 1) => {
    const current = width ?? Math.round(window.innerWidth * 0.2);
    const minWidth = 280;
    const maxWidth = Math.max(minWidth, Math.round(window.innerWidth * 0.45));
    setWidth(Math.min(maxWidth, Math.max(minWidth, current + direction * 24)));
  };

  return (
    <div className="rv-side-shell rv-folder-context" style={{ "--review-side-width": width ? `${width}px` : "20vw" } as CSSProperties}>
      <div
        className="rv-side-resizer"
        role="separator"
        aria-orientation="vertical"
        tabIndex={0}
        aria-label={language === "fr" ? "Redimensionner le panneau" : "Resize panel"}
        onPointerDown={startResize}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            nudgeResize(1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            nudgeResize(-1);
          }
        }}
      />
      <aside className="rv-side" aria-label={copy.panes}>
        <header className="rv-side-head">
          <div className="rv-side-tabs rv-side-tabs-two" role="tablist" aria-label={copy.panes}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                ref={(element) => { if (element) tabRefs.current[tab.id] = element; else delete tabRefs.current[tab.id]; }}
                id={`${paneId}-${tab.id}-tab`}
                type="button"
                role="tab"
                aria-controls={`${paneId}-${tab.id}-panel`}
                aria-selected={pane === tab.id}
                tabIndex={pane === tab.id ? 0 : -1}
                className={pane === tab.id ? "is-active" : ""}
                onClick={() => setPane(tab.id)}
                onKeyDown={(event) => {
                  const currentIndex = tabs.findIndex((item) => item.id === tab.id);
                  const nextIndex = event.key === "ArrowRight" ? (currentIndex + 1) % tabs.length
                    : event.key === "ArrowLeft" ? (currentIndex - 1 + tabs.length) % tabs.length
                    : event.key === "Home" ? 0
                    : event.key === "End" ? tabs.length - 1
                    : null;
                  if (nextIndex === null) return;
                  event.preventDefault();
                  const nextPane = tabs[nextIndex].id;
                  setPane(nextPane);
                  tabRefs.current[nextPane]?.focus();
                }}
              >
                <tab.Icon className="ab-icon ab-icon-sm" aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </div>

        </header>

        <div
          className="rv-context-panel"
          id={`${paneId}-clarify-panel`}
          role="tabpanel"
          aria-labelledby={`${paneId}-clarify-tab`}
          hidden={pane !== "clarify"}
          tabIndex={0}
        >
          <div className="rv-clarify-single">
            <ClarifyPanel notes={notes} language={language} variant={panelVariant} onGenerate={onGenerateNotes} />
          </div>
        </div>
        <div
          className="rv-context-panel"
          id={`${paneId}-agent-panel`}
          role="tabpanel"
          aria-labelledby={`${paneId}-agent-tab`}
          hidden={pane !== "agent"}
          tabIndex={0}
        >
          <AgentPanel
            variant={panelVariant}
            brief={brief}
            scopeLabel={scopeLabel}
            fusionne={fusionne}
            scopeNote={scopeNote}
            showScope={false}
            active={pane === "agent"}
            language={language}
            onAsk={onAskAgent}
            draft={draft}
            onDraftChange={setDraft}
          />
        </div>
      </aside>
    </div>
  );
}

export default ReviewWorkspace;
