/**
 * Types partagés du review de dossier (lot W5b).
 *
 * Ces types sont volontairement des VUES minimales de `TravelSession` : les
 * sous-composants du review n'ont besoin que de l'identité de la conversation,
 * de son audio et de son transcript. Rien de plus ne traverse la frontière —
 * c'est ce qui permet de sortir ces écrans du monolithe sans y ramener son état.
 */

import type { NotesAgent } from "@/lib/notes-agent/types";

export type ReviewLanguage = "fr" | "en";

/**
 * L'état du récap, vu par l'écran (lot W6b).
 *
 * Le générateur (`POST /api/notes`) est une route qui coûte un appel modèle :
 * l'écran doit donc savoir dire les quatre situations, sans jamais inventer de
 * contenu (loi 4). `idle` n'est pas une erreur — c'est « rien n'a encore été
 * demandé », et **rien ne se génère tout seul**.
 */
export type ReviewNotesState =
  | { state: "idle"; stale?: boolean }
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; notes: NotesAgent; stale?: boolean };

/** Un tour de parole affichable et ancrable. */
export type ReviewTranscriptLine = {
  id: string;
  speaker: "Advisor" | "Client" | "Conversation";
  text: string;
  /** Seconde arrondie (contrat historique d'affichage). */
  time: number;
  /** Début exact du tour, quand le STT l'a fourni (AssemblyAI). */
  startMs?: number;
  kind?: "speech" | "private-note";
};

/** Une conversation du dossier, vue par le review. */
export type ReviewSession = {
  id: string;
  createdAt: string;
  duration: number;
  /** Chemin dans le bucket privé `session-audio` (`${userId}/${sessionId}.ext`). */
  audioRef?: string | null;
  transcript: ReviewTranscriptLine[];
};

/**
 * Renvoie l'audio du dossier au moment dit.
 * `sessionId` est celui porté par l'ancre du champ (`ancre_session_id`) : c'est
 * lui qui dit DE QUELLE conversation le timecode parle. `null` → la conversation
 * actuellement chargée dans le dock.
 */
export type ReviewSeek = (ms: number, sessionId?: string | null) => void;
