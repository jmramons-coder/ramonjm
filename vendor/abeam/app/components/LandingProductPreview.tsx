"use client";

import {
  FileText,
  Folder,
  Home,
  Mic,
  MessagesSquare,
  Send,
  Check,
  ArrowUp,
  Search,
} from "lucide-react";
import RecapPanel from "@/app/review/RecapPanel";
import { createEmptyTripBrief } from "@/lib/extraction/trip-brief";
import type { ReviewNotesState } from "@/app/review/types";
import type { UILanguage } from "@/lib/ui/language";
import styles from "./landing-page.module.css";

const brief = createEmptyTripBrief();
const NOTES: Record<UILanguage, ReviewNotesState> = {
  fr: {
    state: "ready",
    notes: {
      version: "1",
      titre: "Un anniversaire au bord de la mer, en Grèce",
      cadre: null,
      resume: [{ texte: "Maya et Alex souhaitent passer dix nuits en Grèce en septembre pour leur anniversaire.", champs: [] }],
      ce_qui_compte: [{ texte: "Un rythme tranquille, des vues sur la mer et de la cuisine locale.", champs: [] }],
      contraintes: [],
      a_clarifier: ["Confirmer les dates exactes de départ."],
      prochaines_etapes: ["Préparer une première proposition adaptée à leur rythme."],
    },
  },
  en: {
    state: "ready",
    notes: {
      version: "1",
      titre: "An anniversary by the sea in Greece",
      cadre: null,
      resume: [{ texte: "Maya and Alex would like to spend ten nights in Greece in September for their anniversary.", champs: [] }],
      ce_qui_compte: [{ texte: "A relaxed pace, sea views and local food.", champs: [] }],
      contraintes: [],
      a_clarifier: ["Confirm the exact departure dates."],
      prochaines_etapes: ["Prepare an initial proposal suited to their pace."],
    },
  },
};

const COPY = {
  fr: {
    files: "Dossiers clients", example: "Exemple", navigation: "Navigation illustrée", file: "Anniversaire en Grèce",
    overview: "Aperçu", conversations: "Conversations", followUp: "Suivi", transcript: "Transcription de la conversation",
    client: "CLIENT", advisor: "CONSEILLER", recorded: "Conversation enregistrée", review: "Relisez avant d’envoyer.",
    to: "À", subject: "Objet", emailSubject: "Votre anniversaire en Grèce", greeting: "Bonjour Maya et Alex,",
    summary: "Nous explorons dix nuits en Grèce en septembre pour votre anniversaire, avec des vues sur la mer, de la cuisine locale et un rythme tranquille.",
    nextStep: "La prochaine étape : confirmer vos dates et préparer une première proposition.",
    draft: "Brouillon à relire · rien n’est envoyé automatiquement", clarify: "À clarifier", agent: "Agent",
    clarifyClient: "À CLARIFIER AVEC LE CLIENT", confirmDates: "Confirmer les dates exactes de départ.",
    context: "Ce dossier garde le contexte des conversations.", question: "Question à l’Agent…",
    dialogue: ["On aimerait partir en Grèce pour notre anniversaire. Dix nuits en septembre, si possible.", "Qu’est-ce qui compte le plus pour vous pendant ce voyage ?", "Les vues sur la mer, la cuisine locale. Et surtout, prendre notre temps."],
  },
  en: {
    files: "Client folders", example: "Example", navigation: "Illustrative navigation", file: "Anniversary in Greece",
    overview: "Overview", conversations: "Conversations", followUp: "Follow-up", transcript: "Conversation transcript",
    client: "CLIENT", advisor: "ADVISOR", recorded: "Saved conversation", review: "Review before sending.",
    to: "To", subject: "Subject", emailSubject: "Your anniversary in Greece", greeting: "Hello Maya and Alex,",
    summary: "We’re exploring ten nights in Greece in September for your anniversary, with sea views, local food and a relaxed pace.",
    nextStep: "Next, we’ll confirm your dates and prepare an initial proposal.",
    draft: "Draft for review · nothing is sent automatically", clarify: "To clarify", agent: "Agent",
    clarifyClient: "TO CLARIFY WITH THE CLIENT", confirmDates: "Confirm the exact departure dates.",
    context: "This folder keeps the context of its conversations.", question: "Ask the Agent…",
    dialogue: ["We’d like to go to Greece for our anniversary. Ten nights in September, if possible.", "What matters most to you during this trip?", "Sea views and local food. Most of all, taking our time."],
  },
};

/** Read-only product example. Uses the real recap renderer; never records, sends, or calls a provider. */
export default function LandingProductPreview({
  language,
  stage = 1,
  compact = false,
}: {
  language: UILanguage;
  stage?: number;
  compact?: boolean;
}) {
  const copy = COPY[language];
  return (
    <div lang={language} className={`${styles.appFrame} ${compact ? styles.compactFrame : ""}`}>
      <div className={styles.appTitlebar}>
        <span>
          <i />
          aBeam
        </span>
        <span>
          <Search size={12} /> {copy.files}
        </span>
        <span className={styles.demoBadge}>{copy.example}</span>
      </div>
      <div className={styles.appBody}>
        <aside className={styles.appSidebar} aria-label={copy.navigation}>
          <Home size={18} />
          <Folder size={18} />
          <Mic size={18} />
          <span>AM</span>
        </aside>
        <div className={styles.appWorkspace}>
          <div className={styles.fileHeading}>
            <div>
              <small>Maya &amp; Alex</small>
              <strong>{copy.file}</strong>
            </div>
            <span className={styles.smallMic}>
              <Mic size={15} />
            </span>
          </div>
          <div className={styles.appTabs} aria-hidden="true">
            <span className={stage === 1 ? styles.selectedTab : ""}>
              <FileText size={13} />
              {copy.overview}
            </span>
            <span className={stage === 0 ? styles.selectedTab : ""}>
              <MessagesSquare size={13} />
              {copy.conversations}
            </span>
            <span className={stage === 2 ? styles.selectedTab : ""}>
              <Send size={13} />
              {copy.followUp}
            </span>
          </div>
          <div className={styles.appColumns}>
            <div className={styles.appDocument}>
              {stage === 1 ? (
                <RecapPanel brief={brief} notes={NOTES[language]} language={language} />
              ) : stage === 0 ? (
                <div className={styles.transcript}>
                  <div className={styles.documentLabel}>
                    <MessagesSquare size={14} />
                    {copy.transcript}<span>16 min</span>
                  </div>
                  <div>
                    <small>{copy.client} · 00:18</small>
                    <p>
                      {copy.dialogue[0]}
                    </p>
                  </div>
                  <div>
                    <small>{copy.advisor} · 00:32</small>
                    <p>
                      {copy.dialogue[1]}
                    </p>
                  </div>
                  <div>
                    <small>{copy.client} · 00:40</small>
                    <p>
                      {copy.dialogue[2]}
                    </p>
                  </div>
                  <div className={styles.audioExample}>
                    <Mic size={15} />
                    <span>{copy.recorded}</span>
                    <span>00:40 / 16:00</span>
                  </div>
                </div>
              ) : (
                <div className={styles.followup}>
                  <div className={styles.documentLabel}>
                    <Send size={14} />
                    {copy.review}
                  </div>
                  <div className={styles.emailField}>
                    <span>{copy.to}</span>
                    <strong>Maya &amp; Alex</strong>
                  </div>
                  <div className={styles.emailField}>
                    <span>{copy.subject}</span>
                    <strong>{copy.emailSubject}</strong>
                  </div>
                  <p>{copy.greeting}</p>
                  <p>
                    {copy.summary}
                  </p>
                  <p>
                    {copy.nextStep}
                  </p>
                  <div className={styles.draftStatus}>
                    <Check size={14} />
                    {copy.draft}
                  </div>
                </div>
              )}
            </div>
            {!compact ? (
              <aside className={styles.previewRail}>
                <div className={styles.railTabs}>
                  <span>{copy.clarify}</span>
                  <span>{copy.agent}</span>
                </div>
                <small>{copy.clarifyClient}</small>
                <p>{copy.confirmDates}</p>
                <div className={styles.railContext}>
                  <Folder size={15} />
                  <span>{copy.context}</span>
                </div>
                <div className={styles.mockComposer}>
                  <span>{copy.question}</span>
                  <ArrowUp size={15} />
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
