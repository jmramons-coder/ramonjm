import type { TripBrief } from "@/lib/extraction/trip-brief";
import type { NotesAgent } from "@/lib/notes-agent/types";
import type { SuggestionCard, SuggestionsResult } from "@/lib/suggestions/engine";
import type { UILanguage } from "@/lib/ui/language";

export type CaptureMode = "microphone";
export type TranscriptLine = {
  id: string;
  speaker: "Advisor" | "Client" | "Conversation";
  text: string;
  time: number;
  /**
   * ANCRAGE (W3, loi 5) : bornes exactes du tour de parole en millisecondes,
   * posées par l'adaptateur AssemblyAI (`lib/transcription/types.ts`). Elles
   * DOIVENT survivre au trajet transcribe → état → /api/extract → stockage :
   * c'est ce qui permet de dériver `ancre_ms` à la milliseconde plutôt que de
   * retomber sur la seconde arrondie (`time * 1000`, dégradé mais correct).
   * Optionnelles : les transcripts historiques et le brouillon navigateur n'en ont pas.
   */
  startMs?: number;
  endMs?: number;
  kind?: "speech" | "private-note";
};

export type SessionSummary = {
  headline: string;
  atGlance: string;
  travelers: string;
  dates: string;
  budget: string;
  preferences: string[];
  constraints: string[];
  openQuestions: string[];
  followUps: string[];
};

export type BriefSummary = SessionSummary | TripBrief;

/**
 * CYCLE DE VIE D'UNE SESSION (le filet, chantier 2026-08-07).
 *
 * La ligne `sessions` naît au DÉMARRAGE du micro, plus à la sauvegarde : c'est
 * ce qui rend un onglet mort récupérable. Les états, dans l'ordre du chemin :
 *   en_cours → (sauvegarde) traitement → transcrit → prete
 *   en_cours → (onglet mort, battement périmé) interrompue
 * `transcrit` est la borne de reprise entre les deux étapes coûteuses
 * (transcription batch, extraction) : un onglet mort entre les deux ne fait
 * pas repayer la transcription. Les sessions d'avant le chantier n'ont pas la
 * colonne : elles se lisent `prete` — leur forme historique exacte.
 *
 * Ce que « pas fini » veut dire, et ce qu'un clic « Reprendre » sait finir,
 * n'est PLUS décidé ici : c'est `decideReprise` (`lib/session/reprise.ts`), la
 * même règle que `/api/finalize`. Une liste locale de statuts reprenables a
 * existé à cet endroit, et sa divergence avec la route est exactement ce qui a
 * créé le cul-de-sac `en_cours` — écran muet d'un côté, 409 de l'autre.
 */
export type SessionLifecycle = "en_cours" | "interrompue" | "traitement" | "transcrit" | "prete";

export type TravelSession = {
  id: string;
  clientId?: string;
  tripId?: string;
  clientName: string;
  clientEmail: string;
  tripTitle: string;
  createdAt: string;
  duration: number;
  transcript: TranscriptLine[];
  summary: BriefSummary;
  clientSummary: string;
  clientSubject?: string;
  captureMode: CaptureMode;
  consent?: boolean;
  audioRef?: string | null;
  natureConversation?: string | null;
  suggestions?: (SuggestionsResult & { generatedAt?: string }) | null;
  /** Public offers saved separately from generated passes and session lifecycle. */
  bookmarks?: SuggestionCard[];
  /**
   * Le récap en prose (`NotesAgent`), s'il a déjà été rédigé et persisté par le
   * générateur. Lecture OPPORTUNISTE : voir `notesFromRow`. Absent → l'écran
   * propose de le rédiger, il ne le fait pas tout seul.
   */
  notes?: NotesAgent | null;
  /** Cycle de vie (le filet). Absent = session historique, donc complète. */
  status?: SessionLifecycle;
  /**
   * Le BATTEMENT DE CŒUR de la ligne, en lecture SEULE (le filet).
   *
   * C'est la donnée qui manquait à l'écran : sans elle, un `en_cours` ne peut
   * pas se distinguer d'une rencontre vivante dans un autre onglet, et le badge
   * « En cours » ne pouvait donc rien dire d'utile ni proposer quoi que ce soit.
   * Elle n'entre JAMAIS dans un upsert — voir `sessionToRow`.
   */
  updatedAt?: string;
};

export type ClientRecord = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isPlaceholder?: boolean;
};

export type TripRecord = {
  id: string;
  clientId: string;
  title: string;
  status: "active" | "past";
  createdAt: string;
  updatedAt: string;
};

export type ClientOverview = {
  client: ClientRecord;
  trips: TripRecord[];
  sessions: TravelSession[];
  latest: TravelSession | null;
  activeTrip: TripRecord | null;
};

export type ClientFolder = {
  key: string;
  clientId: string;
  tripId?: string;
  clientName: string;
  clientEmail: string;
  tripTitle: string;
  sessions: TravelSession[];
  latest: TravelSession | null;
};

export type SessionSetup = {
  clientId?: string;
  tripId?: string;
  clientName: string;
  clientEmail: string;
  tripTitle: string;
  consent: boolean;
  mode: CaptureMode;
};

export type UserProfile = {
  id: string;
  email: string;
  display_name: string | null;
  agency_id: string;
  language: UILanguage;
};

export type ClientRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  is_placeholder: boolean;
  created_at: string;
  updated_at: string;
};

export type TripRow = {
  id: string;
  client_id: string;
  title: string;
  status: "active" | "past";
  created_at: string;
  updated_at: string;
};

export type SessionRow = {
  id: string;
  client_id: string | null;
  trip_id: string | null;
  client_name: string;
  client_email: string;
  trip_title: string;
  created_at: string;
  duration: number;
  capture_mode: CaptureMode;
  consent: boolean;
  audio_ref: string | null;
  transcript: TranscriptLine[];
  brief: BriefSummary | null;
  notes_agent?: unknown;
  notes?: unknown;
  client_summary: string;
  client_subject: string | null;
  nature_conversation: string | null;
  suggestions?: (SuggestionsResult & { generatedAt?: string }) | null;
  passes?: unknown;
  /**
   * Colonnes du filet — OPTIONNELLES par contrat : le code doit fonctionner
   * tel quel sur une base où la migration `add_session_lifecycle` n'est pas
   * encore passée (`select("*")` ne les renvoie simplement pas).
   */
  status?: string | null;
  updated_at?: string | null;
};
