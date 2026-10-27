import { Check, LoaderCircle } from "lucide-react";
import type { FolderProcessingState, SessionProcessingCheckpoint, SessionProcessingStage } from "@/lib/session/folder-processing";
import { uiLocale, type UILanguage } from "@/lib/ui/language";
import "./folder-processing-strip.css";

const PHASES = {
  fr: {
    saving: "Préparation de la sauvegarde…",
    uploading: "Sauvegarde de l’audio…",
    transcribing: "Transcription de la conversation…",
    analyzing: "Préparation de l’aperçu…",
    integrating: "Mise à jour du dossier…",
    resuming: "Reprise du traitement…",
    processing: "Traitement en cours…",
  },
  en: {
    saving: "Preparing to save…",
    uploading: "Saving audio…",
    transcribing: "Transcribing conversation…",
    analyzing: "Preparing overview…",
    integrating: "Updating folder…",
    resuming: "Resuming processing…",
    processing: "Processing…",
  },
} satisfies Record<UILanguage, Record<SessionProcessingStage, string>>;

const CHECKPOINTS = {
  fr: { recording: "Enregistrement terminé", audio: "Audio", transcript: "Transcription", overview: "Aperçu" },
  en: { recording: "Recording ended", audio: "Audio", transcript: "Transcript", overview: "Overview" },
} satisfies Record<UILanguage, Record<SessionProcessingCheckpoint, string>>;

const CHECKPOINT_ORDER: readonly SessionProcessingCheckpoint[] = ["recording", "audio", "transcript", "overview"];

/** An existing sticky header owns the position; this strip reports actual work only. */
export default function FolderProcessingStrip({ state, language }: { state: FolderProcessingState | null; language: UILanguage }) {
  if (!state || !Number.isSafeInteger(state.count) || state.count < 1) return null;
  const fr = language === "fr";
  const phase = PHASES[language][state.stage] ?? PHASES[language].processing;
  const completed = CHECKPOINT_ORDER.filter((checkpoint) => state.completed.includes(checkpoint));
  const count = new Intl.NumberFormat(uiLocale(language)).format(state.count);
  const countMessage = fr ? `${count} conversation${state.count === 1 ? "" : "s"} en traitement` : `${count} conversation${state.count === 1 ? "" : "s"} processing`;
  const completedMessage = completed.length ? `${fr ? "Étapes terminées : " : "Completed steps: "}${completed.map((checkpoint) => CHECKPOINTS[language][checkpoint]).join(", ")}. ` : "";
  const updateMessage = fr ? "Les informations du dossier se mettent à jour automatiquement." : "Folder information updates automatically.";

  return <div className="folder-processing-strip" role="status" aria-live="polite" aria-atomic="true" data-stage={state.stage}>
    <span className="folder-processing-strip-spinner" aria-hidden="true"><LoaderCircle size={12} /></span>
    <span className="folder-processing-phase" aria-hidden="true">{phase}</span>
    {state.count > 1 ? <span className="folder-processing-count" aria-hidden="true">{count}</span> : null}
    <span className="folder-processing-context" aria-hidden="true">{fr ? (state.count === 1 ? "Intégration de la conversation" : "Intégration des conversations") : (state.count === 1 ? "Integrating conversation" : "Integrating conversations")}</span>
    {completed.length ? <ul className="folder-processing-checkpoints" aria-hidden="true">{completed.map((checkpoint) => <li key={checkpoint} data-checkpoint={checkpoint}><Check size={12} /><span>{CHECKPOINTS[language][checkpoint]}</span></li>)}</ul> : null}
    <span className="sr-only">{`${countMessage}. ${phase.replace(/…$/, "")}. ${completedMessage}${updateMessage}`}</span>
  </div>;
}
