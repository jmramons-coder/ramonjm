"use client";

import { FileText, Mic } from "lucide-react";
import { useId } from "react";
import { folderBriefNarrative, type FolderBriefLegacy } from "@/lib/dashboard/folder-brief";
import type { TripBrief } from "@/lib/extraction/trip-brief";
import type { UILanguage } from "@/lib/ui/language";
import "./folder-brief.css";

export type FolderBriefProps = {
  brief: TripBrief | null;
  legacy?: FolderBriefLegacy | null;
  language: UILanguage;
  processing?: boolean;
  onStartConversation?: () => void;
};

const COPY = {
  fr: {
    title: "Le projet de voyage",
    empty: "Les envies et les détails du voyage prendront forme ici au fil des conversations.",
    processing: "La conversation est en cours de traitement. Les nouveaux détails apparaîtront ici lorsqu’ils seront prêts.",
    unconfirmed: "Certaines informations évoquées restent à confirmer dans les conversations.",
    historical: "Ces détails proviennent d’une note précédente.",
    start: "Démarrer une conversation",
  },
  en: {
    title: "The travel plan",
    empty: "Preferences and travel details will take shape here as the conversations develop.",
    processing: "The conversation is being processed. New details will appear here when they are ready.",
    unconfirmed: "Some details discussed still need confirming in the conversations.",
    historical: "These details come from an earlier note.",
    start: "Start a conversation",
  },
} as const;

/** A compact narrative from saved facts. It never starts a generation or search. */
export default function FolderBrief({ brief, legacy, language, processing = false, onStartConversation }: FolderBriefProps) {
  const headingId = useId();
  const copy = COPY[language];
  const narrative = folderBriefNarrative(brief, language, legacy);
  const hasContent = narrative.paragraphs.length > 0;
  return (
    <section className="folder-brief" aria-labelledby={headingId} data-state={hasContent ? "ready" : processing ? "processing" : "empty"}>
      <h2 id={headingId}>{copy.title}</h2>
      {hasContent ? (
        <div className="folder-brief-narrative">
          {narrative.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
      ) : (
        <div className="folder-overview-empty-zone folder-brief-empty-zone">
          <FileText className="folder-brief-empty-mark" size={24} strokeWidth={1.5} aria-hidden="true" />
          <p className="folder-brief-empty" role={processing ? "status" : undefined}>
            {processing ? copy.processing : narrative.unconfirmed ? copy.unconfirmed : copy.empty}
          </p>
          {!processing && onStartConversation ? (
            <button type="button" className="primary-button folder-brief-action" onClick={onStartConversation}>
              <Mic size={16} strokeWidth={1.7} aria-hidden="true" />
              <span>{copy.start}</span>
            </button>
          ) : null}
        </div>
      )}
      {hasContent && processing ? <p className="folder-brief-note" role="status">{copy.processing}</p> : null}
      {hasContent && narrative.unconfirmed ? <p className="folder-brief-note">{copy.unconfirmed}</p> : null}
      {narrative.historical ? <p className="folder-brief-note">{copy.historical}</p> : null}
    </section>
  );
}
