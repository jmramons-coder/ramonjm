"use client";

import { sampleConversationCards } from "@/demo/fixtures";
import { applyBackgroundResult } from "@/lib/session/background-result";
import { conversationDestination } from "@/lib/session/close-destination";
import { buildConversationSequence, conversationLabel } from "@/lib/session/conversation-label";
import { folderProcessingState, type SessionProcessingOperation, type SessionProcessingStage, type SessionProcessingCheckpoint } from "@/lib/session/folder-processing";

import {
  Home, Folder, Mic, MessagesSquare, Settings, PanelLeft, LayoutDashboard, Globe2, UserRound,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Mail,
  MicOff,
  NotebookTabs,
  Pause,
  Bookmark,
  Phone,
  Play,
  Search,
  Send,
  FileText,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  X,
} from "lucide-react";
import {
  FormEvent,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { CSSProperties } from "react";
import type { User } from "@supabase/supabase-js";

import { createRequestScope } from "@/lib/live/request-scope";
import AudioDock from "@/app/components/AudioDock";
import UnfiledConversation, { UnfiledConversationList } from "@/app/components/UnfiledConversation";
import TranscriptPanel from "@/app/review/TranscriptPanel";
import EmptyState from "@/app/components/EmptyState";
import PageSkeleton, { SectionSkeleton, type PageSkeletonVariant } from "@/app/components/PageSkeleton";
import FolderListItem from "@/app/components/FolderListItem";
import FolderDirectory from "@/app/components/FolderDirectory";
import RecentConversationItem from "@/app/components/RecentConversationItem";
import DashboardResearch from "@/app/components/DashboardResearch";
import { useDiscoveryFeed } from "@/app/hooks/useDiscoveryFeed";
import { useFolderConversationViewport } from "@/app/hooks/useFolderConversationViewport";
import { useFolderProcessingOffset, useFolderIdentityOffset } from "@/app/hooks/useFolderProcessingOffset";
import FolderBrief from "@/app/components/FolderBrief";
import "./components/folder-overview.css";
import FolderHeader from "@/app/components/FolderHeader";
import FolderClientSnapshot from "@/app/components/FolderClientSnapshot";
import FolderProcessingStrip from "@/app/components/FolderProcessingStrip";
import FolderConversations from "@/app/components/FolderConversations";
import ConversationFilingDialog from "@/app/components/ConversationFilingDialog";
import WorkspaceDeletionDialog from "@/app/components/WorkspaceDeletionDialog";
import { deletionViewEffects } from "@/lib/workspace/deletion-view";
import SettingsDialog, { type SettingsSection } from "@/app/components/SettingsDialog";
import { ProfileSettingsQueue, resolveProfileRead } from "@/lib/settings/profile";
import Toast from "@/app/components/Toast";
import { enqueueToast, dismissQueuedToast, type ToastMessage, type ToastVariant } from "@/lib/ui/toast";
import { uiLocale } from "@/lib/ui/language";
import UnassignedConversationBanner from "@/app/components/UnassignedConversationBanner";
import SessionStartDialog from "@/app/components/SessionStartDialog";
import FolderFacts from "@/app/components/FolderFacts";
import LandingPage from "@/app/components/LandingPage";
import LandingIntro from "@/app/components/LandingIntro";
import { useLandingIntro } from "@/app/hooks/useLandingIntro";
import AuthPage from "@/app/components/AuthPage";
import ShaderOrb from "@/app/components/ShaderOrb";
import ConversationSuggestionIsland from "@/app/components/ConversationSuggestionIsland";
import ConversationBookmarks from "@/app/components/ConversationBookmarks";
import ConversationOfferCard from "@/app/components/ConversationOfferCard";
import { revealConversationCard, scrollConversationToEnd, useConversationComposer } from "@/app/hooks/useConversationComposer";
import OfferBookmarks from "@/app/components/OfferBookmarks";
import TripJourneyPanel from "@/app/components/TripJourneyPanel";
import { useFolderJourney } from "@/app/hooks/useFolderJourney";
import type { JourneyEntry } from "@/lib/journey/types";
import { relocateFolderJourneyBeforeSessionDeletion } from "@/lib/journey/relocation";
import { MAX_CONVERSATION_BOOKMARKS, normalizeConversationBookmarks, persistConversationBookmarks } from "@/lib/conversation/bookmarks";
import { canBookmarkConversationCard, refreshBookmarkedConversationCards, splitConversationMessages, toggleBookmarkedConversationCard, type NudgeThreadItem } from "@/lib/conversation/workspace";
import { parseNotesAgent } from "@/lib/notes-agent/parse";
import { ReviewSidePanel } from "@/app/review/ReviewWorkspace";
import { lignesPanneau } from "@/app/live/capte-manquant";
import useReviewAudio from "@/app/review/useReviewAudio";
import type { ReviewNotesState, ReviewSession } from "@/app/review/types";
import { notesSourceCoversScope } from "@/lib/review/notes-scope";
import { mergeSessionBriefs } from "@/lib/extraction/merge";
import type { TripBrief } from "@/lib/extraction/trip-brief";
import type { NudgeMessage } from "@/lib/live/nudge-agent";
import type { NudgeItem, SuggestionCard, SuggestionItem, SuggestionsResult } from "@/lib/suggestions/engine";
import { briefSearchKey, buildLiveBrief, triggersSubjectKey, type LiveTriggers } from "@/lib/live/live-brief";
import {
  decideVoieLente,
  decidePartiel,
  decideVoieRapide,
  memoriser,
  memoriserRejets,
  motsTranscript,
  PARTIEL_VIDE,
  SEEN_VIDE,
  VOIE_LENTE,
  type EtatPartiel,
  type LiveSeen,
} from "@/lib/live/cadence";
import { cardIdentity, FEED_MAX, mergeLiveCards, type LiveFeedCard } from "@/lib/live/feed";
import { LatestRequestQueue } from "@/lib/live/latest-request";
import {
  ETAT_INITIAL,
  trancherProposition,
  type CandidatEtablissement,
  type DisambiguationProposal,
  type DisambiguationState,
} from "@/lib/suggestions/disambiguation";
import { startAssemblyLiveStream, type LiveStreamHandle } from "@/lib/live/streaming";
import { RECONNEXION_VIERGE, decideReconnexion, marquerOuverte, type EtatReconnexion } from "@/lib/live/reconnect";
import { REPRISE, decideReprise } from "@/lib/session/reprise";
import { readSuggestionResponse } from "@/lib/live/suggestion-stream";
import { STT_CONTEXT_PROMPT, TRAVEL_KEYTERMS } from "@/lib/transcription/keyterms";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import { authCallbackUrl, authErrorMessage, authenticateWithEmail, cleanAuthReturnUrl, googleProviderEnabled, passwordValidationError, readAuthReturn, type AuthMode } from "@/lib/supabase/login";
import { changedRowFields } from "@/lib/workspace/persistence";
import { canDeleteWorkspaceSession, deleteOwnedSessions, WorkspaceDeletionError, type WorkspaceDeletionResult } from "@/lib/workspace/deletion";
import { deleteFolderFromApi, FolderDeleteClientError } from "@/lib/workspace/folder-delete-client";
import { buildDiscoveryEntries, type DiscoveryEntry } from "@/lib/discovery/entries";
import { manualResearchEntries, mergeResearchHistory } from "@/lib/discovery/research";
import { folderGroupTag } from "@/lib/dashboard/folder-tag";
import type { ProductSearchItem, ProductSearchRequest, ProductSearchResult } from "@/lib/product-search/types";
import { SEARCH_BUDGET_PER_SESSION } from "@/lib/session/search-limits";
import type { UILanguage as Language } from "@/lib/ui/language";
import { WORKSPACE_COPY } from "./workspace/copy";
import { clientFromRow, clientToRow, sessionFromRow, sessionToRow, tripFromRow, tripToRow } from "./workspace/rows";
import { buildSummary, isTripBriefSummary } from "./workspace/summary";
import { DEFAULT_FOLDER_SORT, sortFolders, type FolderSort } from "./workspace/folder-sort";
import { buildClientFolders, UNFILED_FOLDER_KEY } from "./workspace/folders";
import type { BriefSummary, SessionSummary, ClientFolder, ClientOverview, ClientRecord, ClientRow, SessionLifecycle, SessionRow, SessionSetup, TranscriptLine, TravelSession, TripRecord, TripRow, UserProfile } from "./workspace/types";

type AppView = "dashboard" | "clients" | "client-create" | "recording" | "review" | "explore";
// Keep original live-capture implementation below for source parity; this
// portfolio build always uses the isolated public service boundary.
function portfolioDemoEnabled(): boolean { return true; }
const PAGE_SKELETON_VARIANTS: Record<AppView, PageSkeletonVariant> = {
  dashboard: "dashboard", clients: "folders", "client-create": "form",
  recording: "conversation", review: "overview", explore: "explore",
};
type RecordingState = "idle" | "requesting" | "recording" | "paused" | "blocked" | "stopping";
type LiveTranscriptStatus = "idle" | "starting" | "active" | "paused" | "unavailable";
type SaveStage = "idle" | "finalizing_audio" | "uploading_audio" | "transcribing" | "extracting" | "finalizing";
type ReviewTab = "internal" | "transcript" | "client";
type JourneyDialogState = { scopeKey: string; entry?: JourneyEntry; offer?: JourneyEntry["offer"]; offerContext?: { title: string; subtitle?: string; badge?: string } };
type WorkspaceDeletionIntent =
  | { type: "conversation" | "conversations"; title?: string; sessions: TravelSession[]; ownerId: string }
  | { type: "folder"; title: string; folder: ClientFolder; ownerId: string };
type ConversationOrigin = {
  view: Exclude<AppView, "recording">;
  folderKey: string;
  sessionId: string;
  detailSessionId: string;
  reviewTab: ReviewTab;
};
type FeedDisplayMode = "strict" | "lab";
type JevLabChoice = "baseline" | "jev_lab";
type JevDecisionMode = JevLabChoice | "jev_live";
type LabCardRating = "utile" | "erronee" | "trop_tard";
type JevPilotResult = {
  mode: "baseline" | "jev_shadow" | "jev_lab" | "jev_live";
  status: "baseline" | "skipped" | "unavailable" | "timeout" | "error" | "shadow" | "applied";
  model: string | null;
  transport: "gateway" | "connect" | "direct" | null;
  version: string;
  baselineMs: number;
  jevMs: number | null;
  candidateCount: number;
  disagreements: number;
  corrections: number;
};

const FEED_MODE_EVENT = "abeam:feed-mode-change";
const CAPTURE_STATUS_LABELS = {
  fr: { idle: "Prêt", requesting: "Connexion…", recording: "Enregistrement", paused: "En pause", blocked: "Micro indisponible", stopping: "Sauvegarde…" },
  en: { idle: "Ready", requesting: "Connecting…", recording: "Recording", paused: "Paused", blocked: "Mic unavailable", stopping: "Saving…" },
} satisfies Record<Language, Record<RecordingState, string>>;
const Explore = lazy(() => import("@/app/components/Explore"));
const TripJourneyEntryDialog = lazy(() => import("@/app/components/TripJourneyEntryDialog"));

function readFeedDisplayMode(): FeedDisplayMode {
  return new URLSearchParams(window.location.search).get("mode") === "lab" ? "lab" : "strict";
}

function subscribeToFeedDisplayMode(onChange: () => void) {
  window.addEventListener(FEED_MODE_EVENT, onChange);
  return () => window.removeEventListener(FEED_MODE_EVENT, onChange);
}

type LiveScanRequest = {
  lines: TranscriptLine[];
  sessionId: string | null;
  clientId: string;
  startedAt: number;
  source: "partial" | "final";
  pilotMode: JevDecisionMode;
  labMode: boolean;
};

/**
 * Le feed vivant : cartes neuves EN HAUT, cartes dont le contenu a changé mises
 * à jour EN PLACE et remontées en tête avec une marque de fraîcheur, cartes
 * inchangées laissées tranquilles. Identité vs contenu, plafond, et la raison
 * de chaque choix : `lib/live/feed.ts`.
 */
type LiveSuggestions = Omit<SuggestionsResult, "cards"> & {
  cards: LiveFeedCard[];
  generatedAt?: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorLike = {
  error: string;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const LANGUAGE_KEY = "portfolio:abeam:language:v1";

/**
 * Clé sentinelle du bac « Non classées ». Deux-points en tête : une vraie clé de
 * dossier est `clientId::tripId`, donc aucune ne peut la heurter.
 */

/**
 * Le review est EN FRANÇAIS, quoi que dise le compte (décision François,
 * 2026-08-06). Le récap lui-même est rédigé en français par le générateur — un
 * chrome anglais autour d'un texte français ne serait pas « bilingue », il serait
 * incohérent. L'anglais reste possible partout ailleurs dans l'app.
 */


const DEFAULT_SETUP: SessionSetup = {
  clientId: "",
  tripId: "",
  clientName: "",
  clientEmail: "",
  tripTitle: "",
  consent: false,
  mode: "microphone",
};

function makeId(prefix = "item") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function appendTranscriptLine(
  lines: TranscriptLine[],
  speaker: TranscriptLine["speaker"],
  text: string,
  time: number,
  kind: TranscriptLine["kind"] = "speech",
) {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) return lines;

  const previous = lines[lines.length - 1];
  const previousIsSpeech = !previous?.kind || previous.kind === "speech";
  const lineIsSpeech = !kind || kind === "speech";
  if (previous && previousIsSpeech && lineIsSpeech && previous.speaker === speaker) {
    return [
      ...lines.slice(0, -1),
      { ...previous, text: `${previous.text} ${cleanText}`, time },
    ];
  }

  return [...lines, { id: makeId("line"), speaker, text: cleanText, time, kind }];
}

function folderKeyForValues(clientName: string, tripTitle: string) {
  return `${clientName.trim().toLowerCase().replace(/\s+/g, " ")}::${tripTitle.trim().toLowerCase().replace(/\s+/g, " ")}`;
}

function folderKeyForSession(session: TravelSession) {
  return session.clientId && session.tripId
    ? `${session.clientId}::${session.tripId}`
    : folderKeyForValues(session.clientName, session.tripTitle);
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return `${minutes} min`;
}

/**
 * UNE ATTENTE QUI SE DIT À LA SECONDE (loi 4, appliquée à l'attente).
 *
 * Volontairement PAS `formatDuration` : celui-ci arrondit à la minute avec un
 * plancher de 1 min, donc il afficherait « 1 min » pendant quatre-vingt-six
 * secondes, puis « 1 min » encore — un décompte qui ne bouge pas se lit comme
 * un écran figé, et c'est précisément le silence qu'on corrige. Ici l'agente
 * voit le nombre descendre entre deux ré-évaluations.
 */
function formatAttente(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`;
}

function formatSessionDate(value: string, language: Language = "en") {
  return new Intl.DateTimeFormat(language === "fr" ? "fr-CA" : "en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatSessionDay(value: string, language: Language = "en") {
  return new Intl.DateTimeFormat(language === "fr" ? "fr-CA" : "en-CA", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function greetingForNow(language: Language = "en") {
  const hour = new Date().getHours();
  if (language === "fr") {
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  }
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * MARQUE DE FRAÎCHEUR — la carte a été RECALCULÉE, pas remplacée.
 *
 * Elle n'apparaît que sur une carte déjà présente dont le contenu a changé
 * (nouveaux prix, nouvelles dates, pax différent). Sans elle, « remontée en
 * tête » se lirait « nouvelle carte » et l'agente chercherait le doublon.
 * Discrète par construction : une pastille, pas une notification — la 1ʳᵉ loi
 * vaut aussi pour les changements.
 */
function MajBadge({ card, language }: { card: LiveFeedCard; language: Language }) {
  if (!card.majAt) return null;
  return (
    <span className="sg-badge sg-badge-maj" title={new Date(card.majAt).toLocaleTimeString(language === "fr" ? "fr-CA" : "en-CA")}>
      {language === "fr" ? "Mis à jour" : "Updated"}
    </span>
  );
}

/**
 * BADGE DE CYCLE DE VIE (le filet) — visible UNIQUEMENT quand une session n'est
 * pas un document complet : rencontre encore en cours (autre onglet), onglet
 * mort en pleine rencontre, ou traitement de sauvegarde à finir. Une session
 * saine ne porte RIEN — le badge est une alarme, pas une décoration.
 *
 * Libellés courts dans les listes ; échéance de reprise conservée en tooltip.
 */
function SessionLifecycleBadge({ status, resteMs, language, processing = false }: { status?: SessionLifecycle; resteMs?: number; language: Language; processing?: boolean }) {
  const fr = language === "fr";
  const busy = processing || ((status === "traitement" || status === "transcrit") && Boolean(resteMs && resteMs > 0));
  if (!busy && status !== "en_cours" && status !== "interrompue") return null;
  const label = busy ? (fr ? "En traitement" : "Processing")
    : status === "en_cours" ? (fr ? "En cours" : "In progress")
    : (fr ? "Interrompue" : "Interrupted");
  const detail = resteMs && resteMs > 0
    ? (fr ? `Reprise possible dans ${formatAttente(resteMs)}` : `Resumable in ${formatAttente(resteMs)}`)
    : label;
  return <span className="session-lifecycle-tag" data-state={busy ? "processing" : status} title={detail}>{label}</span>;
}

/**
 * LES PASTILLES DE DÉSAMBIGUÏSATION — « Parlez-vous des Roches Blanches à Cassis ? »
 *
 * La question, elle, est déjà dans le fil : elle est rédigée par le cerveau
 * (`proposition.question`) et affichée TELLE QUELLE, sans préambule. Ce
 * composant ne rend que ce sur quoi on peut cliquer.
 *
 * Trois états, et un seul à la fois :
 *  · en attente de réponse → une pastille par établissement (deux au maximum,
 *    jamais une liste déroulante : l'alternative se pose à côté, à égalité) ;
 *  · un clic en vol        → la pastille cliquée dit qu'elle a été reçue, les
 *    autres se figent (on ne lance pas deux fiches pour une seule question) ;
 *  · répondue              → les pastilles disparaissent, la carte est au feed,
 *    et le fil garde une trace de ce qui a été retenu. Elle ne redemande pas.
 *
 * Une pastille dont le clic n'a rien trouvé s'éteint SEULE : l'échec de l'une ne
 * dit rien de l'autre, et l'agente doit pouvoir essayer la seconde.
 *
 * ⚠️ EN FRANÇAIS, TOUJOURS — et pas selon `language`. Tout le fil du Nudge est
 * écrit en français : la question elle-même vient du cerveau (« Parlez-vous des
 * Roches Blanches à Cassis ? »), les messages d'échec sont en dur en français
 * (`runDisambiguation`, `choisirCandidat`), et les rencontres se tiennent en
 * français. Suivre `language` ici ne rendait pas la pastille bilingue : ça
 * plantait « — shown to the client » au milieu d'une phrase française. Défaut
 * vu en rencontre réelle le 2026-08-06.
 */
function DesambPastilles({
  proposition, choisi, echoues, enCours, onChoisir, language,
}: {
  language: Language;
  proposition: DisambiguationProposal;
  choisi?: string;
  echoues: string[];
  enCours: string | null;
  onChoisir: (proposition: DisambiguationProposal, candidat: CandidatEtablissement) => void;
}) {
  if (choisi) {
    return <p className="sg-desamb-choisi">{choisi} — {language === "fr" ? "montré au client" : "shown to client"}</p>;
  }
  const candidats = [proposition.candidat, ...(proposition.alternative ? [proposition.alternative] : [])];
  return (
    <div className="sg-desamb">
      {candidats.map((candidat) => {
        const cle = `${proposition.id}:${candidat.property_token}`;
        const attend = enCours === cle;
        const eteinte = echoues.includes(cle);
        return (
          <button
            key={candidat.property_token}
            type="button"
            className="sg-desamb-chip"
            disabled={eteinte || enCours !== null}
            aria-busy={attend}
            onClick={() => onChoisir(proposition, candidat)}
          >
            {candidat.vignette ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={candidat.vignette} alt="" aria-hidden="true" loading="lazy" referrerPolicy="no-referrer" />
            ) : null}
            <span>{candidat.libelle}</span>
            {attend ? <em>{language === "fr" ? "Recherche…" : "Checking…"}</em> : null}
          </button>
        );
      })}
    </div>
  );
}

function SuggestionCardView({
  card,
  language = "fr",
  bookmarked = false,
  onToggleBookmark,
}: {
  card: LiveFeedCard;
  language?: Language;
  bookmarked?: boolean;
  onToggleBookmark?: (card: LiveFeedCard, restoreFocus?: boolean) => void;
}) {
  if (card.type === "hotels" || card.type === "vols") return <ConversationOfferCard card={card} language={language} bookmarked={bookmarked} onToggleBookmark={onToggleBookmark} updatedBadge={<MajBadge card={card} language={language} />} />;

  if (card.type === "info") {
    return (
      <article className="sg-card sg-card-info">
        <p>{card.sousTitre}</p>
        <span className="sg-source">{card.source}</span>
      </article>
    );
  }

  if (card.type === "vigie" || card.type === "avis") {
    return (
      <article className={`sg-card sg-card-lab-${card.type}`}>
        <header>
          <h4>{card.titre || (card.type === "vigie" ? (language === "fr" ? "Vigie agent" : "Advisor checks") : (language === "fr" ? "Avis utiles" : "Relevant reviews"))}</h4>
          {card.badge ? <span className="sg-badge">{card.badge}</span> : null}
        </header>
        {card.sousTitre ? <p className="sg-subtitle">{card.sousTitre}</p> : null}
        {card.extraits?.length ? (
          <ul className="sg-lab-excerpts">
            {card.extraits.map((extrait, index) => <li key={index}>« {extrait} »</li>)}
          </ul>
        ) : null}
        {card.items.length > 0 ? (
          <ul className="sg-lab-items">
            {card.items.map((item, index) => <li key={index}><strong>{item.titre}</strong>{item.detail ? <span>{item.detail}</span> : null}</li>)}
          </ul>
        ) : null}
        <span className="sg-source">{card.source}</span>
      </article>
    );
  }

  return null;
}

function FeedLabPanel({
  cards,
  nudges,
  searchesUsed,
  warnings,
  pilotChoice,
  pilotResult,
  ratings,
  onRate,
  language,
}: {
  language: Language;
  cards: LiveFeedCard[];
  nudges: NudgeItem[];
  searchesUsed: number;
  warnings: string[];
  pilotChoice: JevLabChoice;
  pilotResult: JevPilotResult | null;
  ratings: Record<string, LabCardRating>;
  onRate: (card: LiveFeedCard, rating: LabCardRating) => void;
}) {
  const fr = language === "fr";
  const strictCards = cards.filter((card) => card.type === "hotels" || card.type === "vols" || (card.type === "info" && card.audience === "client"));
  return (
    <aside className="sg-lab-panel" aria-labelledby="sg-lab-title">
      <header className="sg-lab-header">
        <div>
          <span className="sg-lab-eyebrow">{pilotChoice === "jev_lab" ? (fr ? "Essai Jev" : "Jev trial") : (fr ? "Observation du moteur actuel" : "Current engine observation")}</span>
          <h2 id="sg-lab-title">{fr ? "Mode laboratoire" : "Lab mode"}</h2>
          <p>{fr ? "La rencontre est en mode élargi : le feed montre davantage de cartes et réagit plus vite, sans changer le mode agence." : "This conversation uses expanded mode: more cards and faster responses, while agency mode stays the same."}</p>
        </div>
        <span className="sg-lab-engine">{pilotChoice === "jev_lab" ? (fr ? "Pilote Jev" : "Jev pilot") : (fr ? "Moteur actuel" : "Current engine")} · {fr ? "fixé pour cette rencontre" : "fixed for this conversation"}</span>
      </header>
      {pilotChoice === "jev_lab" ? (
        <p className="sg-lab-note" role="status">
          {pilotResult?.status === "applied"
            ? `Jev ${fr ? "actif" : "active"} · ${pilotResult.model ?? "jev-1.13.0"} · ${pilotResult.jevMs ?? 0} ms · ${pilotResult.corrections} ${fr ? "correction(s) au dernier scan" : "correction(s) in the latest scan"}`
            : pilotResult?.status === "timeout" || pilotResult?.status === "error" || pilotResult?.status === "unavailable"
              ? `${fr ? "Jev indisponible" : "Jev unavailable"} (${pilotResult.status}) · ${fr ? "moteur actuel utilisé pour ce scan" : "current engine used for this scan"}`
              : pilotResult?.status === "skipped" ? (fr ? "Aucun lieu ou hôtel à vérifier dans ce scan" : "No place or hotel to check in this scan") : (fr ? "Jev attend un premier candidat à vérifier" : "Jev is waiting for a first candidate to check")}
        </p>
      ) : null}
      <div className="sg-lab-metrics" aria-label={fr ? "Mesures de la rencontre" : "Conversation metrics"}>
        <span><strong>{cards.length}</strong> {fr ? "cartes conservées" : "cards retained"}</span>
        <span><strong>{strictCards.length}</strong> {fr ? "montrables au client" : "shareable with client"}</span>
        <span><strong>{searchesUsed}</strong> {fr ? "recherches" : "searches"}</span>
      </div>
      <p className="sg-lab-note">
        {cards.length > 0
          ? (fr ? "Les cartes élargies sont affichées dans le feed ci-dessous, avec les éléments normalement réservés au rail agent." : "Expanded cards appear in the feed below, including information usually reserved for the advisor panel.")
          : (fr ? "Aucune carte produite pour le moment — le prochain déclencheur live sera visible ici." : "No cards yet. The next live result will appear here.")}
      </p>
      {cards.length > 0 ? (
        <div className="sg-lab-notes">
          <strong>{fr ? "Évaluation des cartes par l’agente" : "Advisor card ratings"}</strong>
          <ul className="jev-lab-ratings">
            {cards.map((card) => {
              const identity = cardIdentity(card);
              return (
                <li key={identity}>
                  <span>{card.titre}</span>
                  <div aria-label={`${fr ? "Évaluer" : "Rate"} ${card.titre}`}>
                    {(["utile", "erronee", "trop_tard"] as const).map((rating) => (
                      <button key={rating} type="button" aria-pressed={ratings[identity] === rating} onClick={() => onRate(card, rating)}>
                        {rating === "utile" ? (fr ? "Utile" : "Helpful") : rating === "erronee" ? (fr ? "Erronée" : "Incorrect") : (fr ? "Trop tard" : "Too late")}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {nudges.length > 0 ? (
        <div className="sg-lab-notes">
          <strong>{fr ? "Nudges en attente" : "Pending guidance"}</strong>
          <ul>{nudges.map((nudge) => <li key={nudge.champ}>{nudge.message}</li>)}</ul>
        </div>
      ) : null}
      {warnings.length > 0 ? (
        <div className="sg-lab-notes is-warning">
          <strong>{fr ? "Observations techniques" : "Technical observations"}</strong>
          <ul>{warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
        </div>
      ) : null}
    </aside>
  );
}


function mergeFolderSessions(sessions: TravelSession[]) {
  const latest = sessions[0];
  if (!latest) return null;
  const tripBriefs = sessions.map((session) => session.summary).filter(isTripBriefSummary);
  if (tripBriefs.length > 0) {
    return {
      ...latest,
      clientSummary: latest.clientSummary || sessions.find((session) => session.clientSummary)?.clientSummary || "",
      clientSubject: latest.clientSubject || sessions.find((session) => session.clientSubject)?.clientSubject,
      summary: mergeSessionBriefs(tripBriefs),
    };
  }

  const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));
  const conversationCount = sessions.length;
  const latestSummary = latest.summary as SessionSummary;

  return {
    ...latest,
    clientSummary: latest.clientSummary || sessions.find((session) => session.clientSummary)?.clientSummary || "",
    clientSubject: latest.clientSubject || sessions.find((session) => session.clientSubject)?.clientSubject,
    summary: {
      ...latestSummary,
      atGlance: conversationCount > 1
        ? `${latestSummary.atGlance} ${conversationCount} conversations are shaping this workspace.`
        : latestSummary.atGlance,
      preferences: unique(sessions.flatMap((session) => isTripBriefSummary(session.summary) ? [] : session.summary.preferences)),
      constraints: unique(sessions.flatMap((session) => isTripBriefSummary(session.summary) ? [] : session.summary.constraints)),
      openQuestions: unique(sessions.flatMap((session) => isTripBriefSummary(session.summary) ? [] : session.summary.openQuestions)),
      followUps: unique(sessions.flatMap((session) => isTripBriefSummary(session.summary) ? [] : session.summary.followUps)),
    },
  };
}

function AppLogo({ compact = false }: { compact?: boolean }) {
  return <span className={`app-logo ${compact ? "is-compact" : ""}`} aria-hidden="true"><ShaderOrb tone="blue" animated className="workspace-brand-sphere" /></span>;
}

export function TravelWorkspace() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [hydrated, setHydrated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const authOperationRef = useRef(0);
  const authBusyRef = useRef(false);
  const authRecoveryRef = useRef(false);
  const authReturnErrorRef = useRef(false);
  const authReturnModeRef = useRef<AuthMode>("sign-in");
  const authIdentityRef = useRef<string | null>(null);
  const authMountedRef = useRef(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authView, setAuthView] = useState<"landing" | "login">("landing");
  const [remoteWorkspaceLoaded, setRemoteWorkspaceLoaded] = useState(false);
  const [workspaceLoad, setWorkspaceLoad] = useState<{ ownerId: string; status: "idle" | "loading" | "error" }>({ ownerId: "", status: "idle" });
  const [view, setView] = useState<AppView>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [homeActivity, setHomeActivity] = useState<"files" | "conversations">("files");
  // Explicit research stays in this account's mounted workspace, separate from encounter facts.
  const [researchHistory, setResearchHistory] = useState<{ ownerId: string; items: ProductSearchItem[] }>({ ownerId: "", items: [] });
  const [discoveryLaunch, setDiscoveryLaunch] = useState<{ ownerId: string; id: number; kind: "flights" | "hotels"; offer?: DiscoveryEntry } | null>(null);
  const discoveryLaunchSequence = useRef(0);

  useEffect(() => {
    // Each workspace destination starts above its content, including on mobile.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (hydrated && view !== "clients" && window.location.hash === "#folders") {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }, [view, hydrated]);
  const [sessions, setSessions] = useState<TravelSession[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [conversationDetailSessionId, setConversationDetailSessionId] = useState<string>("");
  const [selectedFolderKey, setSelectedFolderKey] = useState<string>("");
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const openLinkedFolders = () => {
      if (window.location.hash !== "#folders") return;
      setSelectedFolderKey("");
      setSelectedSessionId("");
      setConversationDetailSessionId("");
      setView("clients");
    };
    openLinkedFolders();
    window.addEventListener("hashchange", openLinkedFolders);
    return () => window.removeEventListener("hashchange", openLinkedFolders);
  }, []);
  const [assignmentSessionId, setAssignmentSessionId] = useState<string>("");
  const [assignmentFolderSearch, setAssignmentFolderSearch] = useState("");
  const [assignmentCreateOpen, setAssignmentCreateOpen] = useState(false);
  const [assignmentFolderTitle, setAssignmentFolderTitle] = useState("");
  const [assignmentClientName, setAssignmentClientName] = useState("");
  const [assignmentClientEmail, setAssignmentClientEmail] = useState("");
  const [assignmentClientPhone, setAssignmentClientPhone] = useState("");
  const [deletionIntent, setDeletionIntent] = useState<WorkspaceDeletionIntent | null>(null);
  const [deletionBusy, setDeletionBusy] = useState(false);
  const [clientCreateReturnView, setClientCreateReturnView] = useState<"dashboard" | "clients">("clients");
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientTrip, setNewClientTrip] = useState("");
  const [newClientNotes, setNewClientNotes] = useState("");
  const [setup, setSetup] = useState<SessionSetup>(DEFAULT_SETUP);
  const [activeSetup, setActiveSetup] = useState<SessionSetup>(DEFAULT_SETUP);
  const [sessionStartOpen, setSessionStartOpen] = useState(false);
  const [conversationOrigin, setConversationOrigin] = useState<ConversationOrigin>({ view: "dashboard", folderKey: "", sessionId: "", detailSessionId: "", reviewTab: "internal" });
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [liveTranscript, setLiveTranscript] = useState<TranscriptLine[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [liveTranscriptStatus, setLiveTranscriptStatus] = useState<LiveTranscriptStatus>("idle");
  const closingCaptureRef = useRef(false);
  const [processingSessionIds, setProcessingSessionIds] = useState<Set<string>>(() => new Set());
  const [sessionProcessingOperations, setSessionProcessingOperations] = useState<Record<string, SessionProcessingOperation>>({});
  const [saveStage, setSaveStage] = useState<SaveStage>("idle");
  /** Session en cours de reprise (`""` = aucune) — un seul « Reprendre » à la fois. */
  const [resumingSessionId, setResumingSessionId] = useState("");
  // Per-conversation notes survive review tab changes, and reset with the account.
  const [notesByScope, setNotesByScope] = useState<Record<string, ReviewNotesState>>({});
  const [notesSignatureByFolder, setNotesSignatureByFolder] = useState<Record<string, string>>({});
  const notesRequestsRef = useRef(new Map<string, object>());
  const [liveSuggestions, setLiveSuggestions] = useState<LiveSuggestions | null>(null);
  const feedDisplayMode = useSyncExternalStore(subscribeToFeedDisplayMode, readFeedDisplayMode, () => "strict");
  const [jevLabChoice, setJevLabChoice] = useState<JevLabChoice>("jev_lab");
  const [activeJevLabChoice, setActiveJevLabChoice] = useState<JevLabChoice>("jev_lab");
  const [jevPilotResult, setJevPilotResult] = useState<JevPilotResult | null>(null);
  const [labCardRatings, setLabCardRatings] = useState<Record<string, LabCardRating>>({});
  const activeJevLabChoiceRef = useRef<JevDecisionMode>("jev_live");
  const activeLabModeRef = useRef(false);
  const microphoneStartedAtRef = useRef<number | null>(null);
  const firstVisibleCardLoggedRef = useRef(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [railWidth, setRailWidth] = useState(30);
  const [isRailResizing, setIsRailResizing] = useState(false);
  const [nudgeThread, setNudgeThread] = useState<NudgeThreadItem[]>([]);
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<string[]>([]);
  const [language, setLanguage] = useState<Language>("en");
  const uiLanguageRef = useRef<Language>(language);
  useLayoutEffect(() => { uiLanguageRef.current = language; }, [language]);
  const localize = useCallback((fr: string, en: string) => uiLanguageRef.current === "fr" ? fr : en, []);
  const [bookmarkedConversationCards, setBookmarkedConversationCards] = useState<LiveFeedCard[]>([]);
  const portfolioSampleSessionRef = useRef("");
  const [bookmarksExpanded, setBookmarksExpanded] = useState(false);
  const [bookmarkAnnouncement, setBookmarkAnnouncement] = useState("");
  const bookmarkFocusRef = useRef<{ identity: string; scope: number } | null>(null);
  const [conversationPresentationKey, setConversationPresentationKey] = useState(0);
  const conversationPresentationScopeRef = useRef(0);
  const bookmarksHeadingRef = useRef<HTMLElement | null>(null);
  const liveFeedRef = useRef<HTMLElement | null>(null);
  const liveFeedStickToBottomRef = useRef(true);
  const liveFeedManualScrollRef = useRef(false);
  const resetConversationPresentation = useCallback(() => {
    portfolioSampleSessionRef.current = "";
    conversationPresentationScopeRef.current += 1;
    setDismissedSuggestionIds([]);
    setBookmarkedConversationCards([]);
    setBookmarksExpanded(false);
    setBookmarkAnnouncement("");
    bookmarkFocusRef.current = null;
    liveFeedStickToBottomRef.current = true;
    liveFeedManualScrollRef.current = false;
    setConversationPresentationKey((current) => current + 1);
  }, []);
  const conversationMessages = useMemo(() => splitConversationMessages(nudgeThread, dismissedSuggestionIds), [nudgeThread, dismissedSuggestionIds]);
  const visibleBookmarkedCards = useMemo(() => refreshBookmarkedConversationCards(bookmarkedConversationCards, liveSuggestions?.cards ?? []), [bookmarkedConversationCards, liveSuggestions?.cards]);
  const bookmarkedCardIdentities = useMemo(() => new Set(visibleBookmarkedCards.map(cardIdentity)), [visibleBookmarkedCards]);
  useEffect(() => {
    if (view !== "recording" || !liveSuggestions?.cards) return;
    const scope = conversationPresentationKey;
    const cards = liveSuggestions.cards;
    const projectedFrom = bookmarkedConversationCards;
    queueMicrotask(() => {
      if (scope !== conversationPresentationScopeRef.current) return;
      setBookmarkedConversationCards((current) => {
        if (current !== projectedFrom) return current;
        const refreshed = refreshBookmarkedConversationCards(current, cards);
        return refreshed.length === current.length && refreshed.every((card, index) => card === current[index]) ? current : refreshed;
      });
    });
  }, [view, liveSuggestions?.cards, bookmarkedConversationCards, conversationPresentationKey]);
  const toggleConversationBookmark = useCallback((card: LiveFeedCard, restoreFocus = false) => {
    if (!canBookmarkConversationCard(card)) return;
    const identity = cardIdentity(card);
    const bookmarked = !bookmarkedCardIdentities.has(identity);
    if (bookmarked && visibleBookmarkedCards.length >= MAX_CONVERSATION_BOOKMARKS) {
      setBookmarkAnnouncement(language === "fr" ? `Vous pouvez garder ${MAX_CONVERSATION_BOOKMARKS} signets par conversation.` : `You can keep ${MAX_CONVERSATION_BOOKMARKS} bookmarks per conversation.`);
      return;
    }
    if (restoreFocus) bookmarkFocusRef.current = { identity, scope: conversationPresentationScopeRef.current };
    setBookmarkAnnouncement(`${card.titre} · ${language === "fr" ? (bookmarked ? "Signet ajouté" : "Signet retiré") : (bookmarked ? "Offer bookmarked" : "Bookmark removed")}`);
    if (bookmarked) setBookmarksExpanded(true);
    setBookmarkedConversationCards((current) => toggleBookmarkedConversationCard(refreshBookmarkedConversationCards(current, liveSuggestions?.cards ?? []), card));
    const sampleId = portfolioSampleSessionRef.current;
    if (portfolioDemoEnabled() && sampleId && currentUser) {
      void persistConversationBookmarks(supabase, sampleId, currentUser.id,
        bookmarked ? { type: "set", card } : { type: "remove", identity },
        () => portfolioSampleSessionRef.current === sampleId,
      ).then((bookmarks) => {
        setSessions((current) => current.map((session) => session.id === sampleId ? { ...session, bookmarks } : session));
      }).catch(() => {
        if (portfolioSampleSessionRef.current === sampleId) setBookmarkAnnouncement(language === "fr" ? "Le signet n’a pas pu être enregistré." : "The bookmark could not be saved.");
      });
    }
  }, [bookmarkedCardIdentities, liveSuggestions?.cards, visibleBookmarkedCards.length, language, currentUser, supabase]);
  useEffect(() => {
    const intent = bookmarkFocusRef.current;
    if (view !== "recording" || !intent) return;
    const frame = window.requestAnimationFrame(() => {
      if (bookmarkFocusRef.current !== intent || intent.scope !== conversationPresentationScopeRef.current) return;
      bookmarkFocusRef.current = null;
      const button = [...document.querySelectorAll<HTMLButtonElement>(".conversation-resources button[data-conversation-bookmark]")].find((element) => element.dataset.conversationBookmark === intent.identity);
      (button ?? bookmarksHeadingRef.current)?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [view, visibleBookmarkedCards]);
  const [nudgeInput, setNudgeInput] = useState("");
  const [nudgeBusy, setNudgeBusy] = useState(false);
  const nudgeRequestScopeRef = useRef(createRequestScope());
  const cancelNudgeRequest = useCallback(() => {
    nudgeRequestScopeRef.current.cancel();
    setNudgeBusy(false);
  }, []);
  useEffect(() => {
    if (view !== "recording" || recordingState === "stopping" || recordingState === "idle") nudgeRequestScopeRef.current.cancel();
  }, [view, recordingState]);
  useEffect(() => {
    const scope = nudgeRequestScopeRef.current;
    return () => scope.cancel();
  }, []);
  const nudgePostedRef = useRef<Set<string>>(new Set());
  const { ref: conversationComposerRef, height: conversationComposerHeight, panelRoom: conversationPanelRoom } = useConversationComposer();
  useEffect(() => {
    if (view === "recording" && conversationComposerHeight > 0 && liveFeedStickToBottomRef.current && liveFeedRef.current) scrollConversationToEnd(liveFeedRef.current);
  }, [view, conversationComposerHeight, conversationPanelRoom]);

  useEffect(() => {
    if (!isRailResizing) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (window.innerWidth <= 900) return;
      const nextWidth = ((window.innerWidth - event.clientX) / window.innerWidth) * 100;
      setRailWidth(Math.min(52, Math.max(24, nextWidth)));
    };
    const stopResizing = () => setIsRailResizing(false);

    document.body.classList.add("is-resizing-live-rail");
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);
    window.addEventListener("pointercancel", stopResizing);
    return () => {
      document.body.classList.remove("is-resizing-live-rail");
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
      window.removeEventListener("pointercancel", stopResizing);
    };
  }, [isRailResizing]);

  // Suggestions are a live stream: keep the newest card in view when the
  // agent is already at the bottom, but never pull the reader away from an
  // older card after they have scrolled up to inspect it.
  useEffect(() => {
    if (view !== "recording") {
      liveFeedStickToBottomRef.current = true;
      liveFeedManualScrollRef.current = false;
      return;
    }
    const feed = liveFeedRef.current;
    if (!feed || !liveFeedStickToBottomRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      if (!liveFeedStickToBottomRef.current || liveFeedRef.current !== feed || !feed.isConnected) return;
      liveFeedManualScrollRef.current = false;
      const proposition = feed.querySelector<HTMLElement>(".conversation-resources > .sg-card:last-child");
      if (proposition) revealConversationCard(feed, proposition);
      else scrollConversationToEnd(feed);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [view, liveSuggestions?.cards, conversationPresentationKey]);
  useEffect(() => {
    if (view !== "recording" || !liveFeedStickToBottomRef.current || (!conversationMessages.messages.length && !nudgeBusy)) return;
    liveFeedManualScrollRef.current = false;
    if (liveFeedRef.current) scrollConversationToEnd(liveFeedRef.current);
  }, [view, conversationMessages.messages.length, nudgeBusy]);

  /**
   * DÉSAMBIGUÏSATION — la curation vit ici, dans la RENCONTRE (une proposition
   * à la fois, jamais deux fois la même). Un ref et non un état : les boucles
   * la lisent et l'écrivent sans provoquer de rendu, et c'est la réponse du
   * serveur qui fait autorité sur sa valeur suivante.
   */
  const desambEtatRef = useRef<DisambiguationState>(ETAT_INITIAL);
  const desambBusyRef = useRef(false);
  /**
   * Les questions déjà répondues : `id de proposition → l'établissement retenu`.
   * Une fois répondue, la question ne redemande pas — les pastilles laissent
   * place à la carte, et le fil garde la trace de ce qui a été choisi.
   */
  const [desambChoisi, setDesambChoisi] = useState<Record<string, string>>({});
  /**
   * Les pastilles dont le clic n'a rien trouvé (`id:token`). Elles s'éteignent,
   * mais l'ALTERNATIVE reste cliquable : l'échec de l'une ne dit rien de l'autre.
   */
  const [desambEchoues, setDesambEchoues] = useState<string[]>([]);
  /** La pastille en cours d'enrichissement (`id:token`) — l'attente se voit. */
  const [desambEnCours, setDesambEnCours] = useState<string | null>(null);
  const liveBriefRef = useRef<TripBrief | null>(null);
  /**
   * Le brief live EN ÉTAT, pour le panneau « capté / manquant » (station 4) —
   * qui n'est rien d'autre que l'entrée du Payload Agent rendue visible.
   * `liveBriefRef` reste le ref des boucles (elles lisent sans re-rendre) ;
   * ceci est ce que l'écran regarde, posé au même endroit, toujours.
   *
   * DEUX ÉTATS et non un, parce qu'il y a deux vitesses (règles §2) : la voie
   * rapide ne lit que la fenêtre récente, la voie lente relit tout. Les écraser
   * l'une l'autre ferait « oublier » au panneau, à chaque scan rapide, ce que la
   * voie lente avait établi. `lignesPanneau` les compose : la lente fait
   * autorité, la rapide comble. Voir le commentaire de cette fonction.
   */
  const [liveBriefRapide, setLiveBriefRapide] = useState<TripBrief | null>(null);
  const [liveBriefLent, setLiveBriefLent] = useState<TripBrief | null>(null);
  const liveScanKeyRef = useRef("");
  const liveScanQueueRef = useRef(new LatestRequestQueue<LiveScanRequest>());
  const liveScanCoalescedRef = useRef(0);
  const liveSearchesRef = useRef(0);
  const liveScanTimerRef = useRef<number | null>(null);
  const liveLastFireRef = useRef(0);
  /**
   * Le dernier PARTIEL sur lequel la voie rapide a été armée. Un ref et pas un
   * état : il ne doit rien redessiner, et surtout il ne doit jamais approcher
   * `transcriptRef` — le transcript officiel reste fait de tours finalisés
   * (Loi 25). Voir `decidePartiel` dans `lib/live/cadence.ts`.
   */
  const partielArmeRef = useRef<EtatPartiel>(PARTIEL_VIDE);
  /**
   * Ce que la rencontre a DÉJÀ entendu — la mémoire qui rend la garde
   * adaptative : c'est elle qui distingue « il redit la même chose » (on
   * attend) de « il vient de dire quelque chose de neuf » (on part tout de
   * suite). Voir `lib/live/cadence.ts`.
   */
  const liveSeenRef = useRef<LiveSeen>(SEEN_VIDE);
  const liveStreamRef = useRef<LiveStreamHandle | null>(null);
  const liveFirstLabelRef = useRef<string | null>(null);
  const liveFlushChainRef = useRef<Promise<void> | null>(null);
  const liveFlushClosedRef = useRef(false);
  const liveSlowBusyRef = useRef(false);
  const liveSlowGenerationRef = useRef(0);
  /**
   * Total de mots de parole au lancement de la dernière re-dérivation. Des MOTS
   * et plus des lignes : `appendTranscriptLine` fusionne les tours consécutifs
   * du même locuteur, donc un monologue de 77 s reste UNE ligne qui grossit sur
   * place — le compteur de lignes ne voyait pas la rencontre avancer.
   */
  const liveSlowMotsRef = useRef(0);
  /** L'autorité a-t-elle déjà rendu un brief dans cette rencontre ? */
  const liveSlowDejaRef = useRef(false);
  /**
   * Tirs de la voie rapide depuis la dernière re-dérivation RÉUSSIE. Chaque tir
   * a posé quelque chose de NEUF devant le client (doctrine 3 : le feed est à
   * lui). Trois tirs sans que l'autorité ait parlé, c'est une proposition
   * entière montrée sans que personne ne l'ait vérifiée.
   */
  const liveTirsSansAutoriteRef = useRef(0);
  const liveSlowAtRef = useRef(0);
  const liveSuggestKeyRef = useRef("");
  /** Sujet live le plus récent et demande de revalidation par la voie lente. */
  const liveSubjectKeyRef = useRef("");
  const liveSubjectRefreshRef = useRef(false);
  const livePartielRef = useRef("");
  const [, setLiveEngine] = useState<"assembly" | "browser" | null>(null);
  const [captureMessage, setCaptureMessage] = useState("");
  const [reviewTab, setReviewTab] = useState<ReviewTab>("internal");
  const [searchQuery, setSearchQuery] = useState("");
  const [folderSort, setFolderSort] = useState<FolderSort>(DEFAULT_FOLDER_SORT);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toast = toasts[0] ?? null;
  const toastSequenceRef = useRef(0);
  const showToast = useCallback((message: string, variant: ToastVariant = "success", options: Partial<Omit<ToastMessage, "message" | "variant">> = {}) => {
    const id = options.id ?? ++toastSequenceRef.current;
    setToasts((current) => enqueueToast(current, { ...options, id, message, variant }));
    return id;
  }, []);
  const dismissToast = useCallback((id: ToastMessage["id"]) => setToasts((current) => dismissQueuedToast(current, id)), []);
  const [generatingRecapSessionIds, setGeneratingRecapSessionIds] = useState<Set<string>>(new Set());
  const recapGenerationRequestsRef = useRef(new Map<string, { ownerId: string }>());
  const [isSendingRecap, setIsSendingRecap] = useState(false);
  const recapSendRequestRef = useRef<object | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  // FRANÇAIS PAR DÉFAUT (décision François, 2026-08-06) : nos agentes sont
  // québécoises et travaillent en français. L'anglais reste disponible dans les
  // réglages, mais il n'est plus le défaut d'un compte neuf.
  const [settingsSection, setSettingsSection] = useState<SettingsSection | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSettingsError, setProfileSettingsError] = useState(false);
  const [languageSettingsError, setLanguageSettingsError] = useState(false);
  const profileSettingsRevisionRef = useRef(0);
  const profileSettingsQueueRef = useRef(new ProfileSettingsQueue());
  const languageToastRef = useRef<ToastMessage["id"] | null>(null);
  const languageSaveRef = useRef<{ ownerId: string; value: Language; revision: number } | null>(null);
  const nameSaveRef = useRef<object | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const copy = WORKSPACE_COPY[language];
  const agentDisplayName = [profile?.display_name, currentUser?.user_metadata?.full_name, currentUser?.user_metadata?.name]
    .find((name): name is string => typeof name === "string" && Boolean(name.trim()) && !name.includes("@"))?.trim()
    || (language === "fr" ? "Conseiller·ère" : "Advisor");
  const agentInitials = agentDisplayName.trim().split(/\s+/).slice(0, 2).map((word) => Array.from(word)[0]).join("").toUpperCase();
  const saveStageItems: Array<{ id: Exclude<SaveStage, "idle">; label: string }> = language === "fr"
    ? [
        { id: "finalizing_audio", label: "Finalisation de l’enregistrement" },
        { id: "uploading_audio", label: "Sauvegarde sécurisée de l’audio" },
        { id: "transcribing", label: "Transcription de la conversation" },
        { id: "extracting", label: "Création du brief structuré" },
        { id: "finalizing", label: "Préparation de votre espace de révision" },
      ]
    : [
        { id: "finalizing_audio", label: "Finalizing the recording" },
        { id: "uploading_audio", label: "Saving audio securely" },
        { id: "transcribing", label: "Transcribing the conversation" },
        { id: "extracting", label: "Creating the structured brief" },
        { id: "finalizing", label: "Preparing your review workspace" },
      ];
  const activeSaveStageIndex = saveStageItems.findIndex((item) => item.id === saveStage);
  const timerRef = useRef<number | null>(null);
  const recognitionRestartRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioMimeTypeRef = useRef("audio/webm");
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const recognitionShouldRunRef = useRef(false);
  const captureCancelledRef = useRef(false);
  const microphoneRequestScopeRef = useRef(createRequestScope());
  const transcriptRef = useRef<TranscriptLine[]>([]);
  const elapsedRef = useRef(0);
  /**
   * LA RENCONTRE EN COURS, côté base (le filet). Posé à `startSession`, consommé
   * par l'insertion au démarrage du micro, le flush périodique du transcript et
   * la sauvegarde (qui RÉUTILISE cet id au lieu d'en fabriquer un).
   *
   * `inserted` dit si la ligne existe réellement en base : toutes les écritures
   * du filet sont conditionnées dessus. Règle du chantier : le filet est une
   * ASSURANCE — s'il échoue (hors-ligne, migration pas encore passée), il
   * échoue en silence et la rencontre continue exactement comme avant.
   */
  const activeLiveSessionRef = useRef<{ id: string; setup: SessionSetup; inserted: boolean } | null>(null);
  const liveFlushTimerRef = useRef<number | null>(null);
  const liveFlushLastAtRef = useRef(0);
  /**
   * L'AUDIO PAR MORCEAUX (le filet). `cursor` = index du premier blob de 1 s
   * pas encore téléversé ; `seq` = numéro du prochain segment. Les deux
   * n'avancent QU'ENSEMBLE et qu'au succès : les segments partitionnent
   * exactement `audioChunksRef`, donc leur concaténation octet à octet redonne
   * le fichier complet — c'est ce que la reprise consommera.
   */
  const audioPartCursorRef = useRef(0);
  const audioPartSeqRef = useRef(0);
  const audioPartBusyRef = useRef(false);
  /**
   * RECONNEXION STREAMING (le filet, tranche D).
   *
   * `generation` : chaque flux démarré prend un numéro ; les événements d'un
   * flux remplacé sont ignorés. Sans ça, la même chute livrerait `error` PUIS
   * `closed` (les deux arrivent souvent ensemble sur un incident réseau) et
   * consommerait deux tentatives pour une seule panne.
   *
   * `handleStreamDownRef` : indirection nécessaire — le gestionnaire de chute
   * relance `startAssemblyStreaming`, qui lui-même signale ses chutes au
   * gestionnaire. Le ref casse le cycle sans usine à gaz.
   */
  const reconnexionEtatRef = useRef<EtatReconnexion>(RECONNEXION_VIERGE);
  const reconnexionTimerRef = useRef<number | null>(null);
  /**
   * Le message d'alarme que la reconnexion a posé dans la légende en direct.
   * On le mémorise pour pouvoir le retirer À L'IDENTIQUE quand le flux revient :
   * sans ça, un blip réseau de deux secondes laissait « transcription
   * interrompue — reconnexion en cours… » sous les yeux de l'agente pendant
   * tout le reste de la rencontre, devant son client, alors que tout
   * refonctionnait. On ne compare QUE notre propre message : les autres
   * légendes (micro refusé, moteur dégradé) ne nous appartiennent pas.
   */
  const messageReconnexionRef = useRef<string | null>(null);
  const streamGenerationRef = useRef(0);
  const handleStreamDownRef = useRef<(generation: number) => void>(() => {});

  const loadUserProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(null);
      return;
    }

    const revision = profileSettingsRevisionRef.current;
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,display_name,agency_id,language")
      .eq("id", user.id)
      .maybeSingle();

    if (authIdentityRef.current !== user.id) return;
    if (!error && data) {
      const nextProfile = data as UserProfile;
      const languageDraft = languageSaveRef.current?.ownerId === user.id ? languageSaveRef.current : null;
      if (nextProfile.id !== user.id) return;
      const readState = { readRevision: revision, currentRevision: profileSettingsRevisionRef.current, namePending: nameSaveRef.current !== null, languageDraft: languageDraft?.value ?? null, currentLanguage: uiLanguageRef.current };
      setProfile((current) => resolveProfileRead(nextProfile, current, readState).profile);
      const nextLanguage = resolveProfileRead(nextProfile, null, readState).language;
      if (nextLanguage) setLanguage(nextLanguage);
    }
  }, [supabase]);

  // Identités réellement présentes en base. Une ligne inconnue est insérée
  // une seule fois ; les autres ne reçoivent que les champs modifiés.
  const remoteIdsRef = useRef({
    clients: new Set<string>(),
    trips: new Set<string>(),
    sessions: new Set<string>(),
  });
  const persistedRowsRef = useRef({
    clients: new Map<string, ReturnType<typeof clientToRow>>(),
    trips: new Map<string, ReturnType<typeof tripToRow>>(),
    sessions: new Map<string, ReturnType<typeof sessionToRow>>(),
  });
  const persistedBookmarksRef = useRef(new Map<string, readonly SuggestionCard[]>());
  const persistedSourcesRef = useRef({
    clients: new Map<string, ClientRecord>(),
    trips: new Map<string, TripRecord>(),
    sessions: new Map<string, TravelSession>(),
  });
  const persistLatestRef = useRef<{
    userId: string;
    agencyId: string;
    language: Language;
    clients: ClientRecord[];
    trips: TripRecord[];
    sessions: TravelSession[];
    liveBookmarks: { sessionId: string; cards: readonly SuggestionCard[] } | null;
  } | null>(null);
  const persistRequestedRef = useRef(false);
  const persistRunningRef = useRef(false);
  const persistGenerationRef = useRef(0);
  // Progress belongs to the exact conversation/account operation, never the
  // currently selected folder or a later recording's global save stage.
  const setSessionProcessing = useCallback((sessionId: string, generation: number, stage: SessionProcessingStage, checkpoint?: SessionProcessingCheckpoint) => {
    setSessionProcessingOperations((current) => {
      if (generation !== persistGenerationRef.current) return current;
      const completed = current[sessionId]?.completed ?? [];
      return { ...current, [sessionId]: { stage, completed: checkpoint && !completed.includes(checkpoint) ? [...completed, checkpoint] : completed } };
    });
  }, []);
  const clearSessionProcessing = useCallback((sessionId: string, generation: number) => {
    setSessionProcessingOperations((current) => {
      if (generation !== persistGenerationRef.current || !Object.hasOwn(current, sessionId)) return current;
      const next = { ...current };
      delete next[sessionId];
      return next;
    });
  }, []);
  const persistRetryTimerRef = useRef<number | null>(null);
  const persistRetryDelayRef = useRef(2_000);
  const persistWorkspaceRunnerRef = useRef<() => void>(() => {});
  // A destructive action drains the current write before touching its rows.
  // Exact tombstones keep obsolete snapshots from recreating a deleted object.
  const deletionOperationRef = useRef<object | null>(null);
  const deletionRetryRunnerRef = useRef<((intent: WorkspaceDeletionIntent, toastId?: ToastMessage["id"]) => Promise<void>) | null>(null);
  const persistIdleWaitersRef = useRef(new Set<() => void>());
  const deletedWorkspaceIdsRef = useRef({ sessions: new Set<string>(), trips: new Set<string>(), clients: new Set<string>() });

  const persistWorkspaceNow = useCallback(async () => {
    if (persistRunningRef.current || persistRetryTimerRef.current !== null || deletionOperationRef.current) return;
    persistRunningRef.current = true;
    const generation = persistGenerationRef.current;
    try {
      while (persistRequestedRef.current && generation === persistGenerationRef.current && !deletionOperationRef.current) {
        persistRequestedRef.current = false;
        const latest = persistLatestRef.current;
        if (!latest) break;
        const known = remoteIdsRef.current;
        const persisted = persistedRowsRef.current;
        let bookmarkError: Error | null = null;
        const saveBookmarks = async (sessionId: string, source: readonly SuggestionCard[]) => {
          const cards = normalizeConversationBookmarks(source);
          const previous = persistedBookmarksRef.current.get(sessionId) ?? [];
          if (JSON.stringify(previous) === JSON.stringify(cards)) return;
          const isCurrent = () => generation === persistGenerationRef.current && authIdentityRef.current === latest.userId;
          try {
            await persistConversationBookmarks(supabase, sessionId, latest.userId, { type: "sync", previous, cards }, isCurrent);
            if (isCurrent()) persistedBookmarksRef.current.set(sessionId, cards);
          } catch {
            if (isCurrent()) bookmarkError = new Error(latest.language === "fr" ? "Les signets n’ont pas pu être enregistrés. Nouvel essai automatique." : "Bookmarks could not be saved. Retrying automatically.");
          }
        };

        // A new folder needs its client first; an assigned conversation needs
        // both. One serialized writer also prevents an older edit arriving last.
        for (const client of latest.clients) {
          if (generation !== persistGenerationRef.current || deletionOperationRef.current) return;
          if (deletedWorkspaceIdsRef.current.clients.has(client.id)) continue;
          if (known.clients.has(client.id) && persistedSourcesRef.current.clients.get(client.id) === client) continue;
          const row = clientToRow(client, latest.agencyId);
          if (!known.clients.has(row.id)) {
            const { error } = await supabase.from("clients").insert(row);
            if (error) throw error;
            known.clients.add(row.id);
          } else {
            const patch = changedRowFields(row, persisted.clients.get(row.id), ["id", "agency_id", "created_at"]);
            if (Object.keys(patch).length === 0) {
              persistedSourcesRef.current.clients.set(row.id, client);
              continue;
            }
            const { data, error } = await supabase.from("clients").update(patch).eq("id", row.id).select("id");
            if (error) throw error;
            if (!data?.length) throw new Error(`Client ${row.id} introuvable pendant l'enregistrement.`);
          }
          if (generation !== persistGenerationRef.current || deletionOperationRef.current) return;
          persisted.clients.set(row.id, row);
          persistedSourcesRef.current.clients.set(row.id, client);
        }

        for (const trip of latest.trips) {
          if (generation !== persistGenerationRef.current || deletionOperationRef.current) return;
          if (deletedWorkspaceIdsRef.current.trips.has(trip.id)) continue;
          if (known.trips.has(trip.id) && persistedSourcesRef.current.trips.get(trip.id) === trip) continue;
          const row = tripToRow(trip);
          if (!known.trips.has(row.id)) {
            const { error } = await supabase.from("trips").insert(row);
            if (error) throw error;
            known.trips.add(row.id);
          } else {
            const patch = changedRowFields(row, persisted.trips.get(row.id), ["id", "created_at"]);
            if (Object.keys(patch).length === 0) {
              persistedSourcesRef.current.trips.set(row.id, trip);
              continue;
            }
            const { data, error } = await supabase.from("trips").update(patch).eq("id", row.id).select("id");
            if (error) throw error;
            if (!data?.length) throw new Error(`Dossier ${row.id} introuvable pendant l'enregistrement.`);
          }
          if (generation !== persistGenerationRef.current || deletionOperationRef.current) return;
          persisted.trips.set(row.id, row);
          persistedSourcesRef.current.trips.set(row.id, trip);
        }

        // The active capture is deliberately absent from the workspace list.
        // Bookmark metadata uses the same serialized writer after its row exists.
        if (latest.liveBookmarks && known.sessions.has(latest.liveBookmarks.sessionId)) {
          await saveBookmarks(latest.liveBookmarks.sessionId, latest.liveBookmarks.cards);
          if (generation !== persistGenerationRef.current || deletionOperationRef.current) return;
        }
        for (const session of latest.sessions) {
          if (generation !== persistGenerationRef.current || deletionOperationRef.current) return;
          if (deletedWorkspaceIdsRef.current.sessions.has(session.id)) continue;
          if (known.sessions.has(session.id)) {
            await saveBookmarks(session.id, session.bookmarks ?? []);
            if (generation !== persistGenerationRef.current || deletionOperationRef.current) return;
          }
          // The recovery pipeline owns incomplete documents and their lifecycle.
          if ((session.status ?? "prete") !== "prete") {
            if (known.sessions.has(session.id)) {
              const metadata = sessionToRow(session, latest.userId);
              const patch = { client_id: metadata.client_id, trip_id: metadata.trip_id,
                client_name: metadata.client_name, client_email: metadata.client_email, trip_title: metadata.trip_title };
              const previous = persisted.sessions.get(session.id);
              if (!previous || Object.entries(patch).some(([key, value]) => previous[key as keyof typeof previous] !== value)) {
                const { error } = await supabase.from("sessions").update(patch).eq("id", session.id);
                if (error) throw error;
                persisted.sessions.set(session.id, { ...metadata, ...previous, ...patch });
              }
            }
            continue;
          }
          if (known.sessions.has(session.id) && persistedSourcesRef.current.sessions.get(session.id) === session) continue;
          const row = sessionToRow(session, latest.userId);
          if (!known.sessions.has(row.id)) {
            const { error } = await supabase.from("sessions").insert(row);
            if (error) throw error;
            known.sessions.add(row.id);
            await saveBookmarks(session.id, session.bookmarks ?? []);
            if (generation !== persistGenerationRef.current || deletionOperationRef.current) return;
          } else {
            const patch = changedRowFields(row, persisted.sessions.get(row.id), ["id", "owner_id", "created_at"]);
            if (Object.keys(patch).length === 0) {
              persistedSourcesRef.current.sessions.set(row.id, session);
              continue;
            }
            const { data, error } = await supabase.from("sessions").update(patch).eq("id", row.id).select("id");
            if (error) throw error;
            if (!data?.length) throw new Error(`Rencontre ${row.id} introuvable pendant l'enregistrement.`);
          }
          if (generation !== persistGenerationRef.current || deletionOperationRef.current) return;
          persisted.sessions.set(row.id, row);
          persistedSourcesRef.current.sessions.set(row.id, session);
        }
        if (bookmarkError) throw bookmarkError;
        persistRetryDelayRef.current = 2_000;
      }
    } catch  {
      if (generation === persistGenerationRef.current) {
        showToast(localize("Votre espace n’a pas pu être enregistré. Réessayez.", "Your workspace could not be saved. Try again."), "error");
        const delay = persistRetryDelayRef.current;
        persistRetryDelayRef.current = Math.min(delay * 2, 30_000);
        persistRetryTimerRef.current = window.setTimeout(() => {
          persistRetryTimerRef.current = null;
          persistRequestedRef.current = true;
          persistWorkspaceRunnerRef.current();
        }, delay);
      }
    } finally {
      persistRunningRef.current = false;
      persistIdleWaitersRef.current.forEach((resolve) => resolve());
      persistIdleWaitersRef.current.clear();
      if (persistRequestedRef.current && persistRetryTimerRef.current === null) persistWorkspaceRunnerRef.current();
    }
  }, [showToast, supabase, localize]);

  useEffect(() => {
    persistWorkspaceRunnerRef.current = () => { void persistWorkspaceNow(); };
  }, [persistWorkspaceNow]);

  /**
   * ÉCRIRE « INTERROMPUE » — le jugement « cette rencontre est morte », daté et
   * visible par tous les onglets (le filet).
   *
   * Extrait du chargement pour que la ré-évaluation périodique appelle
   * EXACTEMENT la même écriture : c'est l'existence de deux marquages
   * légèrement différents qu'il faut éviter, pas la duplication de trois lignes.
   *
   * Trois détails qui ne se négocient pas :
   *  · PAS de `updated_at` — rafraîchir la date effacerait l'heure de la mort et
   *    ferait repasser la ligne pour fraîche au jugement suivant ;
   *  · `.eq("status", "en_cours")` — si un autre onglet a repris la main entre
   *    la lecture et l'écriture, l'update ne touche RIEN au lieu d'écraser un
   *    statut plus avancé (`traitement`, `transcrit`, `prete`) par un retour en
   *    arrière. La lecture datait d'il y a quelques centaines de millisecondes ;
   *    c'est l'écriture qui arbitre ;
   *  · …et LA FRAÎCHEUR S'ARBITRE ICI AUSSI, pour la même raison.
   *
   * Ce troisième point corrige une régression que la revue adverse a démontrée :
   * `session.updatedAt` n'est écrit dans l'état local qu'UNE fois, au chargement.
   * La ré-évaluation périodique fait donc avancer l'horloge contre un battement
   * FIGÉ — et environ trois minutes après l'ouverture d'un second onglet, elle
   * déclarait « interrompue » une rencontre que le premier onglet était en train
   * d'enregistrer. Le `.eq("status", "en_cours")` ne protégeait rien : une
   * rencontre vivante EST « en_cours ». Ensuite, `/api/finalize` ne re-teste pas
   * la fraîcheur d'une session déjà jugée morte (c'est légitime : le jugement est
   * censé être écrit), et reconstituait l'audio partiel d'une rencontre en cours
   * pendant qu'elle se déroulait.
   *
   * La parade est celle que la route emploie déjà : un compare-and-swap sur
   * `updated_at`, avec le seuil recalculé AU MOMENT de l'écriture. Une ligne dont
   * le battement est frais ne matche plus, zéro ligne revient, et l'état local ne
   * bascule pas — la course est fermée par le moteur SQL, pas par un raisonnement
   * applicatif tenu sur des données périmées.
   *
   * `.is("updated_at", null)` complète le filtre : `lt` ne matche jamais un NULL,
   * et une ligne sans battement (d'avant le chantier, ou dont l'écriture n'a
   * jamais atterri) resterait sinon coincée pour toujours.
   *
   * Rend les ids RÉELLEMENT promus : l'appelant ne doit basculer son état local
   * que sur ceux-là. Best-effort et fail-silent, comme toute écriture du filet.
   */
  const marquerInterrompues = useCallback(async (ids: string[]): Promise<string[]> => {
    if (ids.length === 0) return [];
    const perime = new Date(Date.now() - REPRISE.STALE_EN_COURS_MS).toISOString();
    const { data, error } = await supabase
      .from("sessions")
      .update({ status: "interrompue" })
      .in("id", ids)
      .eq("status", "en_cours")
      .or(`updated_at.lt.${perime},updated_at.is.null`)
      .select("id");
    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[abeam:filet] marquage « interrompue » — échec silencieux", error);
      }
      return [];
    }
    return (data ?? []).map((row) => String((row as { id: unknown }).id));
  }, [supabase]);

  const loadWorkspaceFromSupabase = useCallback(async (canApply: () => boolean = () => true, retainOnError = false) => {
    const generationAtStart = persistGenerationRef.current;
    const [clientsResult, tripsResult, sessionsResult] = await Promise.all([
      supabase.from("clients").select("*").order("updated_at", { ascending: false }),
      supabase.from("trips").select("*").order("updated_at", { ascending: false }),
      supabase.from("sessions").select("*").order("created_at", { ascending: false }),
    ]);
    if (generationAtStart !== persistGenerationRef.current || !canApply()) return false;

    if (clientsResult.error || tripsResult.error || sessionsResult.error) {
      if (!retainOnError) {
        showToast(localize("Votre espace n’a pas pu être chargé. Réessayez.", "Your workspace could not be loaded. Try again."), "error");
        setRemoteWorkspaceLoaded(false);
      }
      return false;
    }

    const remoteClients = (clientsResult.data ?? []).map((row) => clientFromRow(row as ClientRow));
    const remoteTrips = (tripsResult.data ?? []).map((row) => tripFromRow(row as TripRow));

    // LE FILET — détection des rencontres mortes en vol. Une session encore
    // « en_cours » dont le battement de cœur (updated_at, rafraîchi ≤ 60 s par
    // l'onglet qui enregistre) est périmé n'est plus une rencontre : c'est un
    // onglet mort. On la marque « interrompue », en base (best-effort) et à
    // l'écran (toujours). Une rencontre vivante dans un autre onglet a un
    // battement frais et n'est jamais touchée ; celle de CET onglet est en plus
    // protégée par son id.
    //
    // Le jugement lui-même vit dans `decideReprise` : ce chargement n'est plus
    // que le PREMIER passage, la ré-évaluation périodique (plus bas) rejoue la
    // même règle toutes les RESWEEP_MS. Avant ça, ce balayage était le seul, et
    // une rencontre morte depuis 94 s ne franchissait pas le seuil — l'écran
    // n'avait alors plus jamais l'occasion de la rejuger.
    const nowMs = Date.now();
    const interrompues = new Set(
      (sessionsResult.data ?? [])
        .map((row) => row as SessionRow)
        .filter((row) => decideReprise(
          {
            statut: row.status,
            updatedAtMs: row.updated_at ? Date.parse(row.updated_at) : null,
            estCetOnglet: row.id === activeLiveSessionRef.current?.id,
          },
          nowMs,
        ).etat === "a-marquer")
        .map((row) => row.id),
    );
    // Ici, et seulement ici, l'optimisme local est justifié : les lignes viennent
    // d'être lues, donc le jugement porte sur des battements FRAIS et le
    // compare-and-swap de l'écriture promeut exactement le même ensemble. On ne
    // bloque donc pas le chargement sur la réponse. (Le balayage périodique, lui,
    // juge sur un état figé : il DOIT attendre le verdict de la base.)
    void marquerInterrompues([...interrompues]);

    const toutesSessions = (sessionsResult.data ?? []).map((row) => {
      const session = sessionFromRow(row as SessionRow, uiLanguageRef.current);
      return interrompues.has(session.id) ? { ...session, status: "interrompue" as const } : session;
    });

    /**
     * LA RENCONTRE EN COURS N'ENTRE PAS DANS LA LISTE (le filet).
     *
     * Sa ligne existe en base depuis le démarrage du micro — c'est tout l'objet
     * du chantier — mais elle appartient au FLUX D'ENREGISTREMENT, pas encore à
     * l'espace de travail : `saveSession` l'y fera entrer, une fois, avec son
     * document complet.
     *
     * Sans cette exclusion, un chargement pendant la rencontre l'injecterait
     * dans `sessions` avant la sauvegarde. `saveSession` réutilise ce même id ;
     * le workspace ne doit porter qu'un seul objet par rencontre.
     */
    const idEnCours = activeLiveSessionRef.current?.id;
    const remoteSessions = idEnCours
      ? toutesSessions.filter((session) => session.id !== idEnCours)
      : toutesSessions;

    remoteIdsRef.current = {
      clients: new Set(remoteClients.map((client) => client.id)),
      trips: new Set(remoteTrips.map((trip) => trip.id)),
      // …mais elle existe bien en base et sera mise à jour à la sauvegarde.
      sessions: new Set(toutesSessions.map((session) => session.id)),
    };
    // The loaded rows are the baseline. Re-rendering or receiving an auth
    // refresh must not write the entire workspace back to Supabase.
    persistGenerationRef.current += 1;
    // The replacement snapshot invalidates local operation ownership too.
    // Its actual remote lifecycle supplies the conservative processing signal.
    setSessionProcessingOperations({});
    setProcessingSessionIds(new Set());
    setResumingSessionId("");
    persistedRowsRef.current = {
      clients: new Map(remoteClients.map((client) => [client.id, clientToRow(client, "")])),
      trips: new Map(remoteTrips.map((trip) => [trip.id, tripToRow(trip)])),
      sessions: new Map(toutesSessions.map((session) => [session.id, sessionToRow(session, "")])),
    };
    persistedBookmarksRef.current = new Map(toutesSessions.map((session) => [session.id, session.bookmarks ?? []]));
    persistedSourcesRef.current = {
      clients: new Map(remoteClients.map((client) => [client.id, client])),
      trips: new Map(remoteTrips.map((trip) => [trip.id, trip])),
      sessions: new Map(toutesSessions.map((session) => [session.id, session])),
    };
    persistRequestedRef.current = false;
    if (persistRetryTimerRef.current !== null) {
      window.clearTimeout(persistRetryTimerRef.current);
      persistRetryTimerRef.current = null;
    }

    setClients(remoteClients);
    setTrips(remoteTrips);
    setSessions(remoteSessions);

    setRemoteWorkspaceLoaded(true);
    return true;
  }, [marquerInterrompues, showToast, supabase, localize]);

  /**
   * LE TEMPS PASSE DANS L'ÉCRAN (le cœur du correctif du cul-de-sac `en_cours`).
   *
   * `maintenant` n'existe que pour être poussé : c'est lui qui fait re-juger la
   * fraîcheur des rencontres sans rechargement. Le défaut vécu le 2026-08-07 :
   * le balayage ne tournait QU'AU CHARGEMENT, donc une rencontre morte depuis
   * 94 s était (correctement) jugée vivante, et rien ne la rejugeait plus
   * jamais — il fallait recharger une seconde fois, plus tard, ce que personne
   * ne devine.
   *
   * `etatsReprise` porte le verdict de CHAQUE session, rendu par la même règle
   * que `/api/finalize`. Il alimente trois choses et rien d'autre : le décompte
   * des badges, le filtre du bandeau de reprise, et le marquage « interrompue ».
   *
   * `estCetOnglet` n'est PAS renseigné ici : la rencontre de cet onglet n'entre
   * pas dans `sessions` (voir l'exclusion de `loadWorkspaceFromSupabase`) et
   * `saveSession` ne l'y fait entrer que « prete ». La garde par id est posée là
   * où elle protège vraiment — juste avant l'écriture, dans l'effet de marquage,
   * qui peut lire un ref sans le faire pendant le rendu.
   */
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const dejaMarqueesRef = useRef(new Set<string>());

  const etatsReprise = useMemo(
    () => new Map(sessions.map((session) => [
      session.id,
      decideReprise(
        { statut: session.status, updatedAtMs: session.updatedAt ? Date.parse(session.updatedAt) : null },
        maintenant,
      ),
    ])),
    [sessions, maintenant],
  );

  /**
   * L'attente d'une session, quand il y en a une à AFFICHER. `undefined` sur
   * tout le reste : un badge ne porte un décompte que s'il y a réellement
   * quelque chose à attendre.
   */
  const attenteDe = useCallback((sessionId: string) => {
    const etat = etatsReprise.get(sessionId);
    if (etat?.etat === "vivante" || etat?.etat === "en-traitement") return etat.resteMs;
    return undefined;
  }, [etatsReprise]);

  // Y a-t-il quelque chose dont l'attente puisse SE TERMINER toute seule ?
  // Un booléen, et pas la Map, pour que l'effet d'horloge ne se remonte pas à
  // chaque tic (le tic change `maintenant`, donc `etatsReprise`).
  const surveillanceUtile = useMemo(
    () => [...etatsReprise.values()].some((etat) => etat.etat === "vivante" || etat.etat === "en-traitement")
      || sessions.some((session) => session.status === "transcrit" && !canDeleteWorkspaceSession(session, maintenant)),
    [etatsReprise, maintenant, sessions],
  );

  /**
   * L'HORLOGE DE LA RÉ-ÉVALUATION — 15 s, et seulement quand elle sert.
   *
   * Elle n'est PLANIFIÉE que s'il existe au moins une attente en cours : sur un
   * espace de travail sain, aucun timer n'existe. Elle ne pousse qu'un scalaire.
   * Et pendant une rencontre, l'écran ne juge personne : le composant est gros,
   * le direct passe avant, et la seule session qui compte alors est celle de cet
   * onglet — intouchable par construction.
   *
   * ⚠️ Ce n'est PAS l'horloge de 15 s de la voie lente (`RESWEEP` de
   * `tenterVoieLente`, plus bas) : celle-là ne tourne QUE pendant
   * l'enregistrement et déclenche `/api/extract`. Les deux gardes sont
   * disjointes (`view === "recording"` contre `!==`), elles ne peuvent pas
   * tourner ensemble — et elles ne doivent pas être fusionnées : l'une surveille
   * une rencontre vivante, l'autre des rencontres mortes.
   *
   * `maintenant` peut dater d'avant la rencontre qui vient de se terminer.
   * Ce retard ne se paie que d'un tic : une valeur en
   * retard fait juger les rencontres PLUS vivantes qu'elles ne sont, donc
   * `surveillanceUtile` reste vrai, le premier tic remet l'heure réelle et
   * corrige. L'erreur va toujours vers l'attente, jamais vers l'écrasement.
   */
  useEffect(() => {
    if (!surveillanceUtile || view === "recording") return;
    const horloge = window.setInterval(() => setMaintenant(Date.now()), REPRISE.RESWEEP_MS);
    return () => window.clearInterval(horloge);
  }, [surveillanceUtile, view]);

  /**
   * LE JUGEMENT S'ÉCRIT — une fois par session, jamais en boucle.
   *
   * Une session qui vient de basculer « a-marquer » est écrite `interrompue` en
   * base (best-effort) ET dans l'état local. L'état local bascule que l'écriture
   * réussisse ou non — c'est déjà ce que fait le chargement — donc la session
   * sort de l'ensemble des candidates au premier passage. `dejaMarqueesRef` est
   * la seconde barrière : un id n'est tenté qu'UNE fois par vie de page, sans
   * quoi une écriture refusée (réseau, RLS) deviendrait du bruit réseau toutes
   * les 15 s. Une écriture ratée se retentera au prochain chargement, et le
   * serveur sait de toute façon promouvoir tout seul.
   */
  useEffect(() => {
    if (view === "recording") return;
    // L'onglet qui enregistre ne se déclare jamais mort lui-même. La rencontre
    // en cours ne devrait pas être dans `sessions`, mais la garde par id est la
    // parade qui compte et elle ne coûte rien.
    const idEnCours = activeLiveSessionRef.current?.id;
    const aMarquer: string[] = [];
    etatsReprise.forEach((etat, id) => {
      if (etat.etat === "a-marquer" && id !== idEnCours && !dejaMarqueesRef.current.has(id)) aMarquer.push(id);
    });
    if (aMarquer.length === 0) return;
    aMarquer.forEach((id) => dejaMarqueesRef.current.add(id));
    /**
     * ON NE BASCULE QUE CE QUE LA BASE A RÉELLEMENT PROMU.
     *
     * Ce balayage juge sur `session.updatedAt`, qui n'est écrit dans l'état local
     * qu'au chargement : l'horloge avance, le battement reste FIGÉ. Un second
     * onglet ouvert pendant qu'un premier enregistre finissait donc, au bout de
     * trois minutes, par ranger une rencontre BIEN VIVANTE parmi les mortes —
     * badge « interrompue », bouton « Reprendre », et /api/finalize qui part
     * reconstituer l'audio d'une rencontre en cours.
     *
     * Le compare-and-swap de `marquerInterrompues` refuse ces lignes-là (leur
     * battement est frais) et ne rend que les ids VRAIMENT morts. Basculer
     * l'affichage sur cette réponse plutôt que sur notre intention est ce qui
     * rend l'erreur impossible à voir pour l'agente : au pire, un tic de plus
     * passe sans rien annoncer.
     */
    void marquerInterrompues(aMarquer).then((promus) => {
      if (promus.length === 0) return;
      const cibles = new Set(promus);
      setSessions((current) => current.map((session) => (
        cibles.has(session.id) ? { ...session, status: "interrompue" as const } : session
      )));
    });
  }, [etatsReprise, marquerInterrompues, view]);

  const workspaceLoadedForUserRef = useRef<string | null>(null);
  const workspaceLoadGenerationRef = useRef(0);
  const clearPersistWorkspace = useCallback(() => {
    workspaceLoadGenerationRef.current += 1;
    resetConversationPresentation();
    cancelNudgeRequest();
    setView("dashboard");
    setNudgeThread([]);
    setLiveSuggestions(null);
    persistGenerationRef.current += 1;
    deletionOperationRef.current = null;
    persistIdleWaitersRef.current.forEach((resolve) => resolve());
    persistIdleWaitersRef.current.clear();
    deletedWorkspaceIdsRef.current = { sessions: new Set(), trips: new Set(), clients: new Set() };
    setDeletionIntent(null);
    setDeletionBusy(false);
    setToasts([]);
    setSettingsSection(null);
    setProfileSaving(false);
    setProfileSettingsError(false);
    setLanguageSettingsError(false);
    profileSettingsRevisionRef.current += 1;
    languageSaveRef.current = null;
    languageToastRef.current = null;
    nameSaveRef.current = null;
    profileSettingsQueueRef.current.cancel();
    profileSettingsQueueRef.current = new ProfileSettingsQueue();
    setSessionStartOpen(false);
    setConversationOrigin({ view: "dashboard", folderKey: "", sessionId: "", detailSessionId: "", reviewTab: "internal" });
    closingCaptureRef.current = false;
    setProcessingSessionIds(new Set());
    setSessionProcessingOperations({});
    setResumingSessionId("");
    setNotesByScope({});
    recapGenerationRequestsRef.current.clear();
    recapSendRequestRef.current = null;
    setIsSendingRecap(false);
    setGeneratingRecapSessionIds(new Set());
    setNotesSignatureByFolder({});
    persistLatestRef.current = null;
    persistRequestedRef.current = false;
    persistRetryDelayRef.current = 2_000;
    if (persistRetryTimerRef.current !== null) window.clearTimeout(persistRetryTimerRef.current);
    persistRetryTimerRef.current = null;
    persistedRowsRef.current = { clients: new Map(), trips: new Map(), sessions: new Map() };
    persistedSourcesRef.current = { clients: new Map(), trips: new Map(), sessions: new Map() };
    persistedBookmarksRef.current.clear();
    remoteIdsRef.current = { clients: new Set(), trips: new Set(), sessions: new Set() };
    workspaceLoadedForUserRef.current = null;
    setRemoteWorkspaceLoaded(false);
    setWorkspaceLoad({ ownerId: "", status: "idle" });
    setResearchHistory({ ownerId: "", items: [] });
    setDiscoveryLaunch(null);
    setAssignmentSessionId("");
    setAssignmentFolderSearch("");
    setAssignmentCreateOpen(false);
    setAssignmentFolderTitle("");
    setAssignmentClientName("");
    setAssignmentClientEmail("");
    setAssignmentClientPhone("");
    setClients([]);
    setTrips([]);
    setSessions([]);
  }, [cancelNudgeRequest, resetConversationPresentation]);

  const loadWorkspaceOnce = useCallback(async (user: User) => {
    if (workspaceLoadedForUserRef.current === user.id) return;
    // An account switch can arrive as SIGNED_IN without a preceding SIGNED_OUT.
    // Invalidate the old writer before rendering this user's workspace.
    if (workspaceLoadedForUserRef.current && workspaceLoadedForUserRef.current !== user.id) {
      clearPersistWorkspace();
      setProfile(null);
    }
    workspaceLoadedForUserRef.current = user.id;
    const generation = ++workspaceLoadGenerationRef.current;
    setWorkspaceLoad({ ownerId: user.id, status: "loading" });
    const isCurrent = () => generation === workspaceLoadGenerationRef.current && workspaceLoadedForUserRef.current === user.id;
    try {
      const loaded = await loadWorkspaceFromSupabase();
      if (!isCurrent()) return;
      if (!loaded) workspaceLoadedForUserRef.current = null;
      setWorkspaceLoad({ ownerId: user.id, status: loaded ? "idle" : "error" });
    } catch {
      if (!isCurrent()) return;
      workspaceLoadedForUserRef.current = null;
      setWorkspaceLoad({ ownerId: user.id, status: "error" });
    }
  }, [clearPersistWorkspace, loadWorkspaceFromSupabase]);

  useEffect(() => {
    let active = true;
    let revision = 0;
    const deferred = new Set<number>();
    const providerController = new AbortController();
    authMountedRef.current = true;
    const returned = readAuthReturn(new URL(window.location.href));
    authRecoveryRef.current = returned.recovery && !returned.error;
    authReturnErrorRef.current = returned.error;
    authReturnModeRef.current = returned.recovery && returned.error ? "reset-request" : returned.mode ?? "sign-in";
    let initialLanguage: "fr" | "en" = "en";
    const applyUser = async (user: User | null, stamp: number) => {
      const isCurrent = () => active && stamp === revision;
      if (!isCurrent()) return;
      const previousIdentity = authIdentityRef.current;
      authIdentityRef.current = user?.id ?? null;
      setCurrentUser(user);
      if (user && previousIdentity !== user.id) setEmail(user.email ?? "");
      if (authReturnErrorRef.current) {
        // A failed callback remains actionable even when another valid
        // session is stored; refocusing the tab must not dismiss this form.
        clearPersistWorkspace();
        setProfile(null);
        setIsAuthenticated(false);
        setAuthView("login");
        setAuthMode(authReturnModeRef.current);
        window.history.replaceState(null, "", cleanAuthReturnUrl(new URL(window.location.href), false).href);
        setHydrated(true);
        return;
      }
      if (authRecoveryRef.current) {
        // A valid recovery session may update its password, but cannot enter
        // the workspace before that update succeeds (including after refresh).
        clearPersistWorkspace();
        setProfile(null);
        setIsAuthenticated(false);
        setAuthView("login");
        setAuthMode(user ? "update-password" : "reset-request");
        if (!user) {
          authRecoveryRef.current = false;
          setAuthError(initialLanguage === "fr" ? "Ce lien a expiré. Demandez un nouveau lien." : "This link has expired. Request a new one.");
        }
        window.history.replaceState(null, "", cleanAuthReturnUrl(new URL(window.location.href), Boolean(user)).href);
        setHydrated(true);
        return;
      }
      setIsAuthenticated(Boolean(user));
      if (user) {
        setAuthView("landing");
        setPassword("");
        setConfirmPassword("");
        await loadWorkspaceOnce(user);
        if (!isCurrent()) return;
        await loadUserProfile(user);
      } else {
        clearPersistWorkspace();
        setProfile(null);
      }
      if (isCurrent()) {
        window.history.replaceState(null, "", cleanAuthReturnUrl(new URL(window.location.href), false).href);
        setHydrated(true);
      }
    };
    const scheduleUser = (user: User | null) => {
      const stamp = ++revision;
      const timer = window.setTimeout(() => {
        deferred.delete(timer);
        void applyUser(user, stamp).catch(() => {
          if (!active || stamp !== revision) return;
          setRemoteWorkspaceLoaded(false);
          showToast(initialLanguage === "fr" ? "Impossible de charger votre espace. Réessayez dans un instant." : "Unable to load your workspace. Please try again shortly.", "error");
          setHydrated(true);
        });
      }, 0);
      deferred.add(timer);
    };
    const hydrationTimer = window.setTimeout(() => {
      if (returned.mode) {
        setAuthView("login");
        setAuthMode(authReturnModeRef.current);
      }
      // Supabase est la SEULE source de vérité de l'espace de travail.
      // On ne lit plus sessions/clients/dossiers depuis localStorage : ces trois
      // clés étaient lues mais jamais écrites, donc le chemin ne pouvait faire
      // qu'une chose — réinjecter la conversation de démonstration dans l'état,
      // d'où elle partait vers le carnet clients PARTAGÉ de l'agence dès que le
      // chargement distant revenait vide ou en retard. Seule la langue reste locale.
      try {
        const savedLanguage = window.localStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage === "en" || savedLanguage === "fr") {
          initialLanguage = savedLanguage;
          setLanguage(savedLanguage);
        }
      } catch {
        // localStorage indisponible (navigation privée, quota) : langue par défaut.
      }
      if (returned.error) setAuthError(initialLanguage === "fr" ? "Ce lien n’est plus valide. Réessayez ou demandez un nouveau lien." : "This link is no longer valid. Try again or request a new link.");
      const stamp = revision;
      void supabase.auth.getSession().then(({ data, error }) => {
        if (!active) return;
        if (error && stamp === revision) {
          setAuthError(authErrorMessage(error, initialLanguage));
          setAuthView("login");
        }
        if (stamp === revision) scheduleUser(data.session?.user ?? null);
      }).catch(() => {
        if (active && stamp === revision) {
          setAuthError(authErrorMessage(null, initialLanguage));
          setAuthView("login");
          scheduleUser(null);
        }
      });
      if (!portfolioDemoEnabled()) {
        void googleProviderEnabled(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "", providerController.signal)
          .then((enabled) => { if (active) setGoogleEnabled(enabled); });
      }
    }, 0);
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // Token refreshes do not change workspace data. Reloading all transcripts
      // here used to replace local edits and trigger another persistence pass.
      if (event === "TOKEN_REFRESHED") return;
      if (!active) return;
      const nextUser = session?.user ?? null;
      const previousIdentity = authIdentityRef.current;
      authIdentityRef.current = nextUser?.id ?? null;
      // Invalidate the prior account's asynchronous data reads immediately,
      // before deferring UI hydration to the next task.
      if (previousIdentity && previousIdentity !== nextUser?.id) {
        clearPersistWorkspace();
        setProfile(null);
      }
      if (nextUser && previousIdentity !== nextUser.id) setEmail(nextUser.email ?? "");
      if (event === "PASSWORD_RECOVERY") {
        authRecoveryRef.current = true;
        authReturnErrorRef.current = false;
        setPassword("");
        setConfirmPassword("");
        setAuthError("");
        setAuthNotice("");
        window.history.replaceState(null, "", cleanAuthReturnUrl(new URL(window.location.href), true).href);
      }
      // Defer data calls and initial hydration until URL recovery events have
      // had a chance to run. The auth listener itself remains synchronous.
      scheduleUser(nextUser);
    });

    return () => {
      active = false;
      authMountedRef.current = false;
      authOperationRef.current += 1;
      authBusyRef.current = false;
      providerController.abort();
      window.clearTimeout(hydrationTimer);
      deferred.forEach((timer) => window.clearTimeout(timer));
      authListener.subscription.unsubscribe();
    };
  }, [clearPersistWorkspace, loadUserProfile, loadWorkspaceOnce, showToast, supabase]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated || !currentUser || !profile || !remoteWorkspaceLoaded) return;
    persistLatestRef.current = {
      userId: currentUser.id,
      agencyId: profile.agency_id,
      language,
      clients,
      trips,
      sessions,
      liveBookmarks: view === "recording" && activeLiveSessionRef.current ? { sessionId: activeLiveSessionRef.current.id, cards: visibleBookmarkedCards } : null,
    };
    persistRequestedRef.current = true;
    void persistWorkspaceNow();
  }, [clients, currentUser, hydrated, isAuthenticated, persistWorkspaceNow, profile, remoteWorkspaceLoaded, sessions, trips, view, visibleBookmarkedCards, language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = language === "fr" ? "aBeam — Le copilote des rencontres voyage" : "aBeam — The travel consultation copilot";
    if (!hydrated) return;
    try {
      window.localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      // The language switch remains usable when browser storage is unavailable.
    }
  }, [hydrated, language]);

  const clearCaptureTimers = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const stopMediaResources = useCallback(() => {
    microphoneRequestScopeRef.current.cancel();
    // Le filet : plus de reconnexion en vol ni d'écho de flux mort après un
    // arrêt volontaire.
    if (reconnexionTimerRef.current) window.clearTimeout(reconnexionTimerRef.current);
    reconnexionTimerRef.current = null;
    streamGenerationRef.current += 1;
    void liveStreamRef.current?.stop();
    liveStreamRef.current = null;
    setLiveEngine(null);
    captureCancelledRef.current = true;
    recognitionShouldRunRef.current = false;
    if (recognitionRestartRef.current) window.clearTimeout(recognitionRestartRef.current);
    recognitionRestartRef.current = null;
    try {
      recognitionRef.current?.stop();
    } catch {
      recognitionRef.current?.abort();
    }
    recognitionRef.current = null;

    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

  }, []);

  const pauseMediaResources = useCallback(() => {
    liveStreamRef.current?.pause();
    recognitionShouldRunRef.current = false;
    if (recognitionRestartRef.current) window.clearTimeout(recognitionRestartRef.current);
    recognitionRestartRef.current = null;
    try {
      recognitionRef.current?.stop();
    } catch {
      recognitionRef.current?.abort();
    }
    recognitionRef.current = null;
    try {
      if (recorderRef.current?.state === "recording") recorderRef.current.pause();
    } catch {
      // A browser that cannot pause MediaRecorder can still pause recognition.
    }
  }, []);

  const stopRecorderForSave = useCallback(async () => {
    void liveStreamRef.current?.stop();
    liveStreamRef.current = null;
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    await new Promise<void>((resolve) => {
      const previousOnStop = recorder.onstop;
      recorder.onstop = (event) => {
        previousOnStop?.call(recorder, event);
        resolve();
      };
      try {
        recorder.requestData();
        recorder.stop();
      } catch {
        resolve();
      }
    });
  }, []);

  // ── LE FILET — écritures best-effort du cycle de vie ────────────────────────
  //
  // Quatre écritures directes (hors de l'état React, donc hors de la file
  // du workspace — voir le commentaire de `sessionToRow`).
  // Toutes silencieuses à l'échec : une assurance qui échoue ne doit jamais
  // faire échouer la rencontre. En dev, l'échec se journalise (`[abeam:filet]`)
  // pour rester vérifiable.

  const filetWarn = useCallback((operation: string, error: unknown) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[abeam:filet] ${operation} — échec silencieux`, error);
    }
  }, []);

  /** La ligne `sessions` naît quand le micro démarre réellement. */
  const insertSessionStartRow = useCallback(async () => {
    const active = activeLiveSessionRef.current;
    if (!active || active.inserted || !currentUser) return;
    try {
      const { error } = await supabase.from("sessions").insert({
        id: active.id,
        owner_id: currentUser.id,
        // Instantanés TEXTE seulement : pas de client_id/trip_id ici — un client
        // tout juste créé peut ne pas être encore persisté (FK), et la ligne de
        // démarrage doit réussir même là. Les liens s'attachent à la sauvegarde.
        client_name: active.setup.clientName,
        client_email: active.setup.clientEmail,
        trip_title: active.setup.tripTitle,
        capture_mode: active.setup.mode,
        consent: active.setup.consent,
        duration: 0,
        transcript: [],
        status: "en_cours",
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      /**
       * L'annulation peut arriver pendant le round-trip Supabase. Dans ce cas
       * `deleteSessionStartRow` a déjà détaché la rencontre et ne pouvait pas
       * encore supprimer une ligne qu'il ne savait pas créée. Ne jamais
       * ressusciter cette rencontre : on supprime explicitement l'insertion
       * arrivée trop tard, en gardant l'ancien id (jamais celui d'une nouvelle
       * rencontre qui aurait déjà été démarrée entre-temps).
       */
      if (activeLiveSessionRef.current !== active) {
        const { error: cleanupError } = await supabase
          .from("sessions")
          .delete()
          .eq("id", active.id)
          .eq("owner_id", currentUser.id);
        if (cleanupError) filetWarn("suppression d'une insertion arrivée après annulation", cleanupError);
        return;
      }
      active.inserted = true;
      // L'id est désormais légitime en base : l'upsert de la sauvegarde ne doit
      // plus être signalé comme « ligne inédite » par l'instrumentation dev.
      remoteIdsRef.current.sessions.add(active.id);
      persistRequestedRef.current = true;
      persistWorkspaceRunnerRef.current();
    } catch (error) {
      filetWarn("insertion de la ligne de démarrage", error);
    }
  }, [currentUser, filetWarn, supabase]);

  /**
   * Le transcript vivant part en base : débouncé sur les tours finalisés, et
   * battement de cœur ≤ 60 s même quand personne ne parle — c'est `updated_at`
   * qui distingue « rencontre vivante dans un autre onglet » de « onglet mort »
   * au chargement suivant.
   */
  const flushLiveSessionSnapshot = useCallback(async () => {
    const active = activeLiveSessionRef.current;
    if (!active?.inserted || liveFlushClosedRef.current) return;
    // Une sauvegarde peut arriver pendant qu'un battement ou un flush de tour
    // est encore en vol. On capture le bon id et le bon snapshot AVANT d'entrer
    // dans la file : un flush de l'ancienne rencontre ne doit jamais écrire le
    // transcript de la suivante après un changement de ref.
    const transcriptSnapshot = [...transcriptRef.current];
    const durationSnapshot = elapsedRef.current;
    const précédent = liveFlushChainRef.current;
    const courant = (async () => {
      await précédent;
      if (liveFlushClosedRef.current || activeLiveSessionRef.current !== active) return;
      liveFlushLastAtRef.current = Date.now();
      try {
        const { error } = await supabase
          .from("sessions")
          .update({
            transcript: transcriptSnapshot,
            duration: durationSnapshot,
            updated_at: new Date().toISOString(),
          })
          .eq("id", active.id);
        if (error) throw error;
      } catch (error) {
        filetWarn("flush du transcript vivant", error);
      }
    })();
    liveFlushChainRef.current = courant;
    try {
      await courant;
    } finally {
      if (liveFlushChainRef.current === courant) liveFlushChainRef.current = null;
    }
  }, [filetWarn, supabase]);

  /** Transition de cycle de vie — jamais portée par l'upsert d'état (écho). */
  const updateSessionLifecycle = useCallback(async (sessionId: string, status: SessionLifecycle) => {
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", sessionId);
      if (error) throw error;
    } catch (error) {
      filetWarn(`transition vers « ${status} »`, error);
    }
  }, [filetWarn, supabase]);

  /**
   * Un SEGMENT audio part en base : les blobs de 1 s accumulés depuis le
   * dernier segment, d'un bloc. `upsert: true` volontaire — si un envoi réussit
   * côté serveur mais que la réponse se perd, la reprise du même numéro de
   * segment RÉÉCRIT le même début de plage (le curseur n'a pas bougé) au lieu
   * de bloquer sur « existe déjà ». L'intégrité de la partition tient parce que
   * curseur et numéro n'avancent qu'ensemble, au succès.
   */
  const uploadAudioPart = useCallback(async () => {
    const active = activeLiveSessionRef.current;
    if (!active?.inserted || !currentUser || audioPartBusyRef.current) return;
    const from = audioPartCursorRef.current;
    const to = audioChunksRef.current.length;
    if (to <= from) return;
    audioPartBusyRef.current = true;
    try {
      const mimeType = audioMimeTypeRef.current || "audio/webm";
      const seq = audioPartSeqRef.current;
      const part = new Blob(audioChunksRef.current.slice(from, to), { type: mimeType });
      const chemin = `${currentUser.id}/${active.id}/parts/${String(seq).padStart(4, "0")}`;
      const { error } = await supabase.storage
        .from("session-audio")
        .upload(chemin, part, {
          contentType: mimeType,
          upsert: true,
        });
      if (error) throw error;
      /**
       * LE CURSEUR N'APPARTIENT QU'À LA RENCONTRE QUI L'A OUVERT.
       *
       * Un téléversement lent peut se terminer APRÈS que l'agente a annulé et
       * enchaîné sur une autre rencontre : `startSession` a remis curseur et
       * numéro à zéro entre-temps. Écrire `to` (une longueur de l'ANCIENNE
       * rencontre, p. ex. 137) sur le curseur de la NOUVELLE ferait démarrer sa
       * segmentation 137 blobs trop loin — ses deux premières minutes, celles
       * où l'on nomme le client et la destination, n'entreraient dans aucun
       * segment, et la reprise reconstituerait un audio amputé de son ouverture.
       */
      if (activeLiveSessionRef.current !== active) {
        // Et le segment qui vient d'atterrir est orphelin : la purge de
        // l'annulation est déjà passée avant lui. On le retire nous-mêmes —
        // c'est le seul endroit qui connaît son chemin exact, et une rencontre
        // annulée ne doit laisser AUCUNE trace de la parole du client.
        void supabase.storage.from("session-audio").remove([chemin]);
        return;
      }
      audioPartCursorRef.current = to;
      audioPartSeqRef.current = seq + 1;
    } catch (error) {
      filetWarn("téléversement d'un segment audio", error);
    } finally {
      audioPartBusyRef.current = false;
    }
  }, [currentUser, filetWarn, supabase]);

  /**
   * Les segments ne sont qu'une ASSURANCE : dès que le fichier complet existe
   * (sauvegarde normale) — ou que la rencontre est annulée — ils se purgent.
   * Best-effort : des segments orphelins ne gênent personne, la purge pourra
   * repasser.
   */
  const cleanupAudioParts = useCallback(async (sessionId: string) => {
    if (!currentUser) return;
    try {
      const dossier = `${currentUser.id}/${sessionId}/parts`;
      const { data, error } = await supabase.storage.from("session-audio").list(dossier, { limit: 1000 });
      if (error) throw error;
      const cibles = (data ?? []).map((objet) => `${dossier}/${objet.name}`);
      if (cibles.length > 0) {
        const { error: removeError } = await supabase.storage.from("session-audio").remove(cibles);
        if (removeError) throw removeError;
      }
    } catch (error) {
      filetWarn("purge des segments audio", error);
    }
  }, [currentUser, filetWarn, supabase]);

  /**
   * JOURNAL DE BORD de la rencontre (tranche F) — les événements qui, jusqu'ici,
   * mouraient en console : tour jeté par le filtre d'hallucination, chute et
   * reconnexion du streaming, bascule dégradée. C'est ce qui permet de vérifier
   * APRÈS COUP que le filet a bien travaillé (« le filtre a-t-il mangé du
   * vrai ? », « combien de reconnexions cette semaine ? »). Best-effort,
   * comme tout le filet.
   */
  const logSessionEvent = useCallback((type: string, payload: Record<string, unknown> = {}, savedSessionId?: string) => {
    const active = activeLiveSessionRef.current;
    if ((!savedSessionId && !active?.inserted) || !currentUser) return;
    void supabase
      .from("session_events")
      .insert({ session_id: savedSessionId ?? active!.id, owner_id: currentUser.id, type, payload })
      .then(({ error }) => {
        if (error) filetWarn(`journal « ${type} »`, error);
      });
  }, [currentUser, filetWarn, supabase]);

  // La mesure de première carte part après le rendu du feed, une seule fois
  // par rencontre. Le temps de préparation dans /api/suggest reste séparé.
  useEffect(() => {
    if (view !== "recording" || firstVisibleCardLoggedRef.current
      || microphoneStartedAtRef.current === null || !liveSuggestions?.cards.length) return;
    const sessionId = activeLiveSessionRef.current?.id;
    const startedAt = microphoneStartedAtRef.current;
    const feed = liveFeedRef.current;
    const markVisible = () => {
      if (activeLiveSessionRef.current?.id !== sessionId || firstVisibleCardLoggedRef.current || !feed) return;
      const viewport = feed.getBoundingClientRect();
      const visible = Array.from(feed.querySelectorAll<HTMLElement>(".conversation-resources > .sg-card"))
        .some((card) => { const bounds = card.getBoundingClientRect(); return bounds.bottom > viewport.top && bounds.top < viewport.bottom; });
      if (!visible) return;
      firstVisibleCardLoggedRef.current = true;
      logSessionEvent("jev_pilot_first_card_visible", {
        pilotMode: activeJevLabChoiceRef.current,
        msFromMicrophone: Math.round(performance.now() - startedAt),
      });
    };
    const frame = window.requestAnimationFrame(markVisible);
    feed?.addEventListener("scroll", markVisible, { passive: true });
    return () => { window.cancelAnimationFrame(frame); feed?.removeEventListener("scroll", markVisible); };
  }, [view, liveSuggestions?.cards, logSessionEvent]);

  const rateLabCard = useCallback((card: LiveFeedCard, rating: LabCardRating) => {
    const identity = cardIdentity(card);
    setLabCardRatings((current) => ({ ...current, [identity]: rating }));
    logSessionEvent("jev_pilot_card_rating", {
      pilotMode: activeJevLabChoiceRef.current,
      cardId: card.id,
      cardType: card.type,
      rating,
    });
  }, [logSessionEvent]);

  /** Une rencontre ANNULÉE n'a pas à survivre : la ligne de démarrage s'efface. */
  const deleteSessionStartRow = useCallback(async () => {
    const active = activeLiveSessionRef.current;
    activeLiveSessionRef.current = null;
    if (!active?.inserted) return;
    try {
      remoteIdsRef.current.sessions.delete(active.id);
      persistedRowsRef.current.sessions.delete(active.id);
      persistedSourcesRef.current.sessions.delete(active.id);
      // …et hors de l'état local, sans quoi une future mutation la réinsérerait — avec
      // le statut par défaut `prete`, donc une rencontre explicitement annulée
      // devant le client qui réapparaît comme un document complet. Le
      // chargement filtre déjà la rencontre en cours, ceci couvre le reste.
      setSessions((current) => current.filter((item) => item.id !== active.id));
      const { error } = await supabase.from("sessions").delete().eq("id", active.id);
      if (error) throw error;
    } catch (error) {
      // Pire cas : la ligne survit et se marquera « interrompue » au prochain
      // chargement — un faux positif bénin, jamais une perte.
      filetWarn("suppression de la ligne annulée", error);
    }
  }, [filetWarn, supabase]);

  const uploadSessionAudio = useCallback(async (sessionId: string, snapshot?: { chunks: Blob[]; mimeType: string }) => {
    const chunks = snapshot?.chunks ?? audioChunksRef.current;
    if (!currentUser || chunks.length === 0) return null;

    const mimeType = snapshot?.mimeType || audioMimeTypeRef.current || "audio/webm";
    const extension = mimeType.includes("mp4")
      ? "m4a"
      : mimeType.includes("mpeg")
        ? "mp3"
        : mimeType.includes("ogg")
          ? "ogg"
          : "webm";
    const blob = new Blob(chunks, { type: mimeType });
    const audioRef = `${currentUser.id}/${sessionId}.${extension}`;
    const { error } = await supabase.storage
      .from("session-audio")
      .upload(audioRef, blob, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) throw error;

    return audioRef;
  }, [currentUser, supabase]);

  const transcribeSessionAudio = useCallback(async (audioRef: string, sessionId: string) => {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ audioRef, sessionId }),
    });

    const payload = await response.json() as { lines?: TranscriptLine[]; error?: string };
    if (!response.ok) {
      throw new Error(localize("La transcription n’a pas pu être préparée.", "The transcript could not be prepared."));
    }

    return payload.lines ?? [];
  }, [supabase, localize]);

  const extractTripBrief = useCallback(async (transcript: TranscriptLine[], clientId?: string, sessionId?: string) => {
    if (transcript.length === 0) return null;

    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    const response = await fetch("/api/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      // `session_id` n'est pas ici pour la persistance (la ligne n'existe pas
      // encore) mais pour l'ANCRAGE : c'est lui que `deriveTripBriefAnchors`
      // écrit dans `ancre_session_id`, et sans lui la fusion en brief de dossier
      // remet chaque ancre à `null` (une ancre orpheline ne désigne rien).
      body: JSON.stringify({ transcript, client_id: clientId, session_id: sessionId }),
    });

    const payload = await response.json() as { brief?: TripBrief; error?: string };
    if (!response.ok) {
      throw new Error(localize("L’aperçu n’a pas pu être préparé.", "The overview could not be prepared."));
    }

    return payload.brief ?? null;
  }, [supabase, localize]);

  const updateConciergeProfile = useCallback((clientId: string, brief: TripBrief, sessionId?: string) => {
    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        await fetch("/api/concierge", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ client_id: clientId, session_id: sessionId, brief }),
        });
      } catch {
        // le Concierge n'est jamais bloquant
      }
    })();
  }, [supabase]);

  const requestSuggestions = useCallback((sessionId: string, brief: TripBrief, clientId?: string) => {
    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        const response = await fetch("/api/suggest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ session_id: sessionId, brief, client_id: clientId }),
        });
        if (!response.ok) return;
        const payload = (await response.json()) as TravelSession["suggestions"];
        setSessions((current) => current.map((item) => (item.id === sessionId ? { ...item, suggestions: payload } : item)));
      } catch {
        // les suggestions arrivent en arrière-plan — jamais bloquantes
      }
    })();
  }, [supabase]);

  // NUDGE GATEWAY côté écran : vigie et nudges sont POSTÉS dans le fil dès que
  // les résultats arrivent (pas depuis un effet : c'est un événement, pas un rendu).
  const postNudgeMessages = useCallback((payload: NonNullable<TravelSession["suggestions"]>) => {
    const additions: Array<{ id: string; from: "nudge"; text: string; extraits?: string[]; kind: "vigie" | "nudge" }> = [];
    for (const card of payload.cards) {
      if (card.type !== "vigie") continue;
      const key = `vigie:${card.sousTitre ?? card.id}`;
      if (nudgePostedRef.current.has(key)) continue;
      nudgePostedRef.current.add(key);
      additions.push({
        id: key,
        from: "nudge",
        kind: "vigie",
        text: card.sousTitre ? `⚠️ ${card.sousTitre}` : card.titre,
        extraits: card.extraits,
      });
    }
    for (const nudge of payload.nudges ?? []) {
      // Le nudge « destination » est le seul dont le TEXTE change au fil de la
      // rencontre : la question se précise à mesure qu'on écarte des lieux
      // (« Floride, ça peut être… » à 20 s, puis « Caraïbes, quelle île ? » à 60 s).
      // Le dédoublonner sur le champ seul figeait la PREMIÈRE question de la
      // rencontre — donc, le 2026-08-07, la mauvaise. Strictement limité à ce
      // champ : élargir ferait reposter `prix_hotel` à chaque variation de tarif.
      const key = nudge.champ === "destination" ? `nudge:destination:${nudge.message}` : `nudge:${nudge.champ}`;
      if (nudgePostedRef.current.has(key)) continue;
      nudgePostedRef.current.add(key);
      additions.push({ id: key, from: "nudge", kind: "nudge", text: nudge.message });
    }
    if (liveSearchesRef.current >= SEARCH_BUDGET_PER_SESSION && !nudgePostedRef.current.has("budget")) {
      nudgePostedRef.current.add("budget");
      additions.push({
        id: "budget",
        from: "nudge",
        kind: "nudge",
        text: localize("Budget de recherches atteint pour cette rencontre — les suggestions live sont en pause, tout sera repris à la sauvegarde.", "Search allowance reached for this conversation. Live suggestions are paused and will resume when saving."),
      });
    }
    if (additions.length) setNudgeThread((current) => [...current, ...additions]);
  }, [localize]);

  /** Point unique où une réponse live réussie entre dans le rail et le feed. */
  const applyLiveSuggestionPayload = useCallback((payload: NonNullable<TravelSession["suggestions"]>) => {
    postNudgeMessages(payload);
    setLiveSuggestions((current) => ({
      ...payload,
      cards: mergeLiveCards(current?.cards ?? [], payload.cards),
    }));
  }, [postNudgeMessages]);

  /** Progressive snapshots only paint cards; the completed result owns nudges and cost. */
  const applyLiveSuggestionProgress = useCallback((cards: SuggestionCard[]) => {
    setLiveSuggestions((current) => ({
      ...(current ?? { nudges: [], searchesUsed: 0, warnings: [] }),
      cards: mergeLiveCards(current?.cards ?? [], cards),
    }));
  }, []);

  // VOIE RAPIDE (boucle live) : fenêtre récente → trigger-scan → brief
  // synthétique → /api/suggest (mode live). Dédup par clé, budget plafonné.
  // RAW CONTEXT AGENT sur le brouillon navigateur : uniquement quand la
  // transcription AssemblyAI n'a pas abouti. Le transcript officiel AssemblyAI
  // n'est jamais réécrit.
  const cleanBrowserDraft = useCallback(async (lines: TranscriptLine[]) => {
    if (lines.length === 0) return lines;
    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      const response = await fetch("/api/clean-transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ lines }),
      });
      if (!response.ok) return lines;
      const payload = (await response.json()) as { lines?: TranscriptLine[] };
      return payload.lines?.length === lines.length ? payload.lines : lines;
    } catch {
      return lines; // jamais bloquant
    }
  }, [supabase]);

  /**
   * Poser une carte au feed par la MÊME machinerie que les autres (`mergeLiveCards`) :
   * elle a donc la même vie qu'elles — même identité, même mise à jour en place
   * si une recherche ultérieure retombe sur le même établissement, même plafond.
   * Une carte qui arriverait par un chemin parallèle serait une carte à part, et
   * le feed se remettrait à empiler des doublons.
   */
  const poserCarteAuFeed = useCallback((card: SuggestionCard) => {
    setLiveSuggestions((current) => ({
      cards: mergeLiveCards(current?.cards ?? [], [card]),
      nudges: current?.nudges ?? [],
      searchesUsed: current?.searchesUsed ?? 0,
      warnings: current?.warnings ?? [],
      generatedAt: new Date().toISOString(),
    }));
  }, []);

  /** Une ligne dans le fil du Nudge, posée une seule fois (clé de dédoublonnage). */
  const posterDansLeFil = useCallback((cle: string, item: Omit<NudgeThreadItem, "id">) => {
    if (nudgePostedRef.current.has(cle)) return;
    nudgePostedRef.current.add(cle);
    setNudgeThread((current) => [...current, { ...item, id: cle }]);
  }, []);

  const annoncerBudgetAtteint = useCallback(() => {
    posterDansLeFil("budget", {
      from: "nudge",
      kind: "nudge",
      text: localize("Budget de recherches atteint pour cette rencontre — les suggestions live sont en pause, tout sera repris à la sauvegarde.", "Search allowance reached for this conversation. Live suggestions are paused and will resume when saving."),
    });
  }, [posterDansLeFil, localize]);

  /**
   * DÉSAMBIGUÏSATION — « Parlez-vous des Roches Blanches à Cassis ? »
   *
   * Elle part À CÔTÉ de la voie rapide, pas dedans : `decideVoieRapide` arbitre
   * des RECHERCHES de cartes (garde anti-churn comprise), alors qu'ici la
   * question n'est posée qu'une fois par nom entendu — le module tient sa propre
   * curation (`entendus`, `enAttente`, `vues`). La brancher derrière la décision
   * de la voie rapide reviendrait à taire la question pendant les 20 s de garde,
   * c'est-à-dire précisément quand l'agente en a besoin.
   *
   * Elle ne bloque jamais le chemin des cartes : elle est lancée sans être
   * attendue, et son échec est silencieux côté code (mais dit à l'écran, loi 4).
   */
  const runDisambiguation = useCallback((triggers: LiveTriggers, lines: TranscriptLine[]) => {
    // Le gate est celui du module : un NOM prononcé. Un lieu seul ne suffit pas
    // — on ne choisit pas l'hôtel à la place de l'agente (§1).
    if (!triggers.hotel) return;
    if (desambBusyRef.current) return;
    // Une proposition à la fois (§4) : inutile d'aller le redemander au serveur.
    if (desambEtatRef.current.enAttente !== null) return;
    if (liveSearchesRef.current >= SEARCH_BUDGET_PER_SESSION) return;
    const requestSessionId = activeLiveSessionRef.current?.id ?? null;
    const requestGeneration = liveSlowGenerationRef.current;
    const requestSubjectKey = triggersSubjectKey(triggers);
    const isCurrent = () => liveSlowGenerationRef.current === requestGeneration
      && (activeLiveSessionRef.current?.id ?? null) === requestSessionId
      && (!requestSubjectKey || liveSubjectKeyRef.current === requestSubjectKey);
    desambBusyRef.current = true;
    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        const response = await fetch("/api/disambiguate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
            body: JSON.stringify({
              action: "proposer",
              sessionId: requestSessionId,
              signal: {
              nomApproximatif: triggers.hotel,
              lieux: triggers.destinations,
              // Le champ dédié du trigger-scan. `triggers.hesitation` n'est PAS
              // envoyé : c'est l'hésitation du client sur son PROJET, et la
              // confondre avec un doute sur le nom ferait tirer la pastille sur
              // des rencontres qui n'ont rien demandé.
              doutePourLeNom: triggers.hotel_nom_incertain,
              // La fenêtre reste le repli lexical du module quand le scan n'a
              // pas su trancher.
              fenetre: lines.map((line) => line.text).join(" "),
            },
            etat: desambEtatRef.current,
          }),
        });
        if (!response.ok) {
          if (response.status === 429 && isCurrent()) annoncerBudgetAtteint();
          return;
        }
        const outcome = (await response.json()) as {
          proposition?: DisambiguationProposal | null;
          etat?: DisambiguationState;
          searchesUsed?: number;
          message?: string | null;
          /** Identité du sujet, partagée avec le nudge homonyme de l'engin. */
          champ?: string;
        };
        if (liveSlowGenerationRef.current === requestGeneration
          && (activeLiveSessionRef.current?.id ?? null) === requestSessionId) {
          liveSearchesRef.current += outcome.searchesUsed ?? 0;
        }
        if (!isCurrent()) return;
        if (outcome.etat) desambEtatRef.current = outcome.etat;
        if (outcome.proposition) {
          // La question est DÉJÀ rédigée par le cerveau : aucun préambule, elle
          // EST le message.
          posterDansLeFil(`desamb:${outcome.proposition.id}`, {
            from: "nudge",
            kind: "desamb",
            text: outcome.proposition.question,
            proposition: outcome.proposition,
          });
        } else if (outcome.message) {
          // Loi 4 : une recherche est partie et n'a rien donné — ça se dit.
          //
          // MAIS UNE SEULE FOIS. Sur la rencontre du 2026-08-06, l'agente a lu
          // DEUX fois qu'on n'avait rien trouvé, dans deux formulations : celle-ci,
          // et le nudge `hotel_introuvable` de l'engin, qui répond à la même
          // question par un autre chemin. On poste donc sous LA MÊME clé que lui
          // (`outcome.champ`, partagé depuis `disambiguation.ts`) : le registre
          // `nudgePostedRef` fait le reste, et le second se tait — §3, un message
          // à la fois. Celui-ci arrive en premier dans les faits, et c'est le bon :
          // il cite ce qui a été entendu et nomme le lieu, là où l'autre est
          // générique.
          posterDansLeFil(`nudge:${outcome.champ ?? "hotel_introuvable"}`, {
            from: "nudge",
            kind: "nudge",
            text: outcome.message,
          });
        }
      } catch {
        // Aucune recherche n'est partie (le réseau a lâché avant) : rien à dire.
      } finally {
        if (liveSlowGenerationRef.current === requestGeneration
          && (activeLiveSessionRef.current?.id ?? null) === requestSessionId) desambBusyRef.current = false;
      }
    })();
  }, [annoncerBudgetAtteint, supabase, posterDansLeFil]);

  /**
   * LE CLIC — la pastille devient une vraie carte, photos comprises. C'est
   * exactement ce qui manquait : « Montrer au client » publiait le TEXTE de la
   * réponse du Nudge, jamais la chaîne d'enrichissement.
   */
  const choisirCandidat = useCallback((proposition: DisambiguationProposal, candidat: CandidatEtablissement) => {
    if (desambEnCours) return;
    const requestSessionId = activeLiveSessionRef.current?.id ?? null;
    const requestGeneration = liveSlowGenerationRef.current;
    const isCurrent = () => liveSlowGenerationRef.current === requestGeneration
      && (activeLiveSessionRef.current?.id ?? null) === requestSessionId;
    setDesambEnCours(`${proposition.id}:${candidat.property_token}`);
    void (async () => {
      const echec = (texte: string) => {
        if (!isCurrent()) return;
        // Jamais de silence après une action de l'agente (loi 4).
        posterDansLeFil(`desamb-clic:${proposition.id}:${candidat.property_token}`, { from: "nudge", kind: "nudge", text: texte });
        setDesambEchoues((current) => [...current, `${proposition.id}:${candidat.property_token}`]);
      };
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        const brief = liveBriefRef.current;
        const response = await fetch("/api/disambiguate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            action: "enrichir",
            sessionId: requestSessionId,
            candidat,
            // Les VRAIES dates seulement. La rencontre n'en a presque jamais
            // d'aussi précises à ce stade, et c'est très bien : sans elles, la
            // carte montre l'adresse. Afficher une fenêtre dérivée d'un « en
            // mars » ferait croire à une disponibilité qu'on n'a pas vérifiée.
            checkIn: brief?.temps.depart.precision === "jour" ? brief.temps.depart.valeur : null,
            checkOut: null,
            adultes: brief?.voyageurs.adultes.valeur ?? null,
            enfantsAges: brief?.voyageurs.enfants_ages.valeur ?? [],
          }),
        });
        const payload = (await response.json()) as {
          card?: SuggestionCard | null;
          message?: string | null;
          searchesUsed?: number;
          error?: string;
        };
        if (response.status === 429 && isCurrent()) annoncerBudgetAtteint();
        if (isCurrent()) liveSearchesRef.current += payload.searchesUsed ?? 0;
        if (!isCurrent()) return;
        if (payload.card) {
          poserCarteAuFeed(payload.card);
          // La question a trouvé sa réponse : la pastille laisse place à la carte.
          setDesambChoisi((current) => ({ ...current, [proposition.id]: candidat.libelle }));
        } else {
          echec(payload.message ?? payload.error ?? `Je n'arrive pas à ouvrir la fiche ${candidat.nom} — rien à montrer pour l'instant.`);
        }
      } catch {
        echec(`Je n'arrive pas à ouvrir la fiche ${candidat.nom} — rien à montrer pour l'instant.`);
      } finally {
        // La place se libère dans les deux cas : la question a été engagée, elle
        // ne se reposera pas (`vues`), mais une AUTRE peut désormais arriver.
        if (isCurrent()) {
          desambEtatRef.current = trancherProposition(desambEtatRef.current, proposition.id);
          setDesambEnCours(null);
        }
      }
    })();
  }, [annoncerBudgetAtteint, desambEnCours, supabase, poserCarteAuFeed, posterDansLeFil]);

  /**
   * @param partiel Le tour EN COURS, transmis quand il réveille une voie live.
   *   Il est ajouté uniquement aux payloads éphémères du trigger-scan ou de
   *   l'extraction — et NULLE PART dans l'état officiel : il n'entre pas dans
   *   `transcriptRef`, donc pas dans le transcript, le récap ni le courriel.
   *   Le transcript persistant reste fait de tours finalisés (Loi 25).
   */
  const runLiveScan = useCallback((partiel?: string) => {
    // Le plafond protège les recherches. Les déclencheurs reçus pendant un
    // appel sont fusionnés dans la file ci-dessous, jamais simplement jetés.
    if (liveSearchesRef.current >= SEARCH_BUDGET_PER_SESSION) return;
    const finalisees = transcriptRef.current.filter((line) => line.kind !== "private-note").slice(-15);
    // Ligne ÉPHÉMÈRE : construite ici, consommée par le fetch, jamais gardée.
    const enCours = partiel?.trim()
      ? [{ id: "partiel-en-cours", speaker: "Conversation" as const, text: partiel.trim(), time: Math.max(1, elapsedRef.current) }]
      : [];
    const windowLines = [...finalisees, ...enCours];
    if (windowLines.length === 0) return;
    const queue = liveScanQueueRef.current;
    const queued = queue.enqueue({
      lines: windowLines,
      sessionId: activeLiveSessionRef.current?.id ?? null,
      clientId: activeSetup.clientId ?? "",
      startedAt: performance.now(),
      source: partiel?.trim() ? "partial" : "final",
      pilotMode: activeJevLabChoiceRef.current,
      labMode: activeLabModeRef.current,
    });
    if (queued.runner === null) {
      liveScanCoalescedRef.current += 1;
      return;
    }
    const runner = queued.runner;
    void (async () => {
      const process = async (generation: number, request: LiveScanRequest) => {
        const isActive = () => queue.isActive(generation)
          && (activeLiveSessionRef.current?.id ?? null) === request.sessionId;
        const isLatestScan = () => isActive() && queue.isCurrent(generation);
        if (!isActive() || liveSearchesRef.current >= SEARCH_BUDGET_PER_SESSION) return;
        const scanStartedAt = performance.now();
        let phase: "scan" | "suggest" = "scan";
        try {
          const { data } = await supabase.auth.getSession();
          const accessToken = data.session?.access_token;
          const headers = {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          };
          const scanResponse = await fetch("/api/live-scan", {
            method: "POST",
            headers,
            body: JSON.stringify({ lines: request.lines, pilotMode: request.pilotMode, labMode: request.labMode }),
          });
          if (!scanResponse.ok) return;
          const triggers = (await scanResponse.json()) as LiveTriggers & { pilot?: JevPilotResult };
          const scanMs = performance.now() - scanStartedAt;
          if (isActive() && triggers.pilot) {
            setJevPilotResult(triggers.pilot);
            logSessionEvent("jev_pilot_scan", {
              mode: triggers.pilot.mode,
              status: triggers.pilot.status,
              model: triggers.pilot.model,
              transport: triggers.pilot.transport,
              version: triggers.pilot.version,
              baselineMs: triggers.pilot.baselineMs,
              jevMs: triggers.pilot.jevMs,
              candidateCount: triggers.pilot.candidateCount,
              disagreements: triggers.pilot.disagreements,
              corrections: triggers.pilot.corrections,
            });
          }
          // La session ET la fenêtre doivent encore être courantes. Si une
          // fenêtre plus récente est arrivée, elle sera traitée juste après.
          if (!isLatestScan()) return;
          // La désambiguïsation et le refus n'achètent pas de recherche. Ils
          // restent hors de la cadence, mais seulement pour la fenêtre courante.
          runDisambiguation(triggers, request.lines);
          liveSeenRef.current = memoriserRejets(triggers, liveSeenRef.current);
          // La garde adaptative laisse passer les nouveaux faits et retient
          // seulement la répétition. Un refus ne consomme jamais la clé.
          const cadenceDecision = decideVoieRapide({
            triggers,
            seen: liveSeenRef.current,
            derniereCle: liveScanKeyRef.current,
            dernierTirAt: liveLastFireRef.current,
            now: Date.now(),
          });
          const subjectKey = triggersSubjectKey(triggers);
          const subjectChanged = Boolean(subjectKey && subjectKey !== liveSubjectKeyRef.current);
          if (subjectChanged) {
            liveSubjectKeyRef.current = subjectKey;
            // Une destination ou un hôtel nouveau réveille la voie lente.
            liveSubjectRefreshRef.current = true;
          }
          // Le labo ne lève que la garde de 20 s, jamais le gate, la clé ou le budget.
          const decision = feedDisplayMode === "lab" && cadenceDecision.action === "garder"
            ? { ...cadenceDecision, action: "tirer" as const, raisons: ["mode laboratoire — réaction live accélérée"] }
            : cadenceDecision;
          logSessionEvent("live_trigger_scan", {
            mode: feedDisplayMode,
            action: decision.action,
            raisons: decision.raisons,
            destinations: triggers.destinations.slice(0, 5),
            hotel: triggers.hotel,
            date: Boolean(triggers.date_verbatim),
            sujet_change: subjectChanged,
          });
          if (decision.action !== "tirer" || liveSearchesRef.current >= SEARCH_BUDGET_PER_SESSION) return;
          // Les clés et le compteur de tirs ne sont validés qu'après succès.
          const brief = buildLiveBrief(triggers);
          liveBriefRef.current = brief;
          setLiveBriefRapide(brief); // station 4 : la voie rapide comble le panneau…
          phase = "suggest";
          const suggestStartedAt = performance.now();
          let firstCardReadyMs: number | null = null;
          const suggestResponse = await fetch("/api/suggest", {
            method: "POST",
            headers: { ...headers, Accept: "application/x-ndjson" },
            body: JSON.stringify({
              brief,
              client_id: request.clientId || undefined,
              session_id: request.sessionId,
              mode: "live",
            }),
          });
          if (!suggestResponse.ok) {
            if (suggestResponse.status === 429 && isActive()) annoncerBudgetAtteint();
            if (isActive()) logSessionEvent("live_suggest_failed", { status: suggestResponse.status });
            return; // la clé n'est pas consommée : le prochain déclencheur peut retenter
          }
          const payload = await readSuggestionResponse(suggestResponse, (cards) => {
            if (!isActive()) return;
            if (firstCardReadyMs === null && cards.some((card) => feedDisplayMode === "lab"
              || card.type === "hotels" || card.type === "vols"
              || (card.type === "info" && card.audience === "client"))) {
              firstCardReadyMs = Math.round(performance.now() - request.startedAt);
            }
            applyLiveSuggestionProgress(cards);
          });
          const suggestMs = performance.now() - suggestStartedAt;
          // Une fenêtre plus récente en attente n'annule pas une recherche déjà
          // payée : ses cartes arrivent, puis la dernière fenêtre est traitée.
          // Une session terminée ne reçoit jamais ces cartes.
          if ((activeLiveSessionRef.current?.id ?? null) === request.sessionId) {
            liveSearchesRef.current += payload.searchesUsed ?? 0;
          }
          if (!isActive()) return;
          liveScanKeyRef.current = decision.cle;
          liveSeenRef.current = memoriser(triggers, liveSeenRef.current);
          liveLastFireRef.current = Date.now();
          if (payload.cards.length > 0) liveTirsSansAutoriteRef.current += 1;
          logSessionEvent("live_suggest_result", {
            mode: feedDisplayMode,
            searchesUsed: payload.searchesUsed ?? 0,
            cardCount: payload.cards.length,
            cardTypes: [...new Set(payload.cards.map((card) => card.type))],
          });
          applyLiveSuggestionPayload(payload);
          const hasVisibleCard = payload.cards.some((card) => feedDisplayMode === "lab"
            || card.type === "hotels" || card.type === "vols"
            || (card.type === "info" && card.audience === "client"));
          logSessionEvent("live_pipeline_timing", {
            source: request.source,
            pilotMode: triggers.pilot?.mode ?? "baseline",
            pilotStatus: triggers.pilot?.status ?? "baseline",
            scanMs: Math.round(scanMs), suggestMs: Math.round(suggestMs),
            queueMs: Math.round(scanStartedAt - request.startedAt),
            firstCardReadyMs: firstCardReadyMs ?? (hasVisibleCard ? Math.round(performance.now() - request.startedAt) : null),
            coalescedTriggers: liveScanCoalescedRef.current,
          });
        } catch {
          // Aucun état de déduplication n'est consommé : le prochain signal
          // significatif pourra retenter sans rafale automatique de recherches.
          if (isActive()) logSessionEvent(`live_${phase}_failed`, { status: "network_or_parse" });
        }
      };
      let next: { generation: number; value: LiveScanRequest } | null = queued;
      while (next) {
        await process(next.generation, next.value);
        next = queue.next(runner);
      }
    })();
  }, [annoncerBudgetAtteint, applyLiveSuggestionPayload, applyLiveSuggestionProgress, feedDisplayMode, logSessionEvent, supabase, activeSetup.clientId, runDisambiguation]);

  useEffect(() => {
    if (view !== "recording" || recordingState !== "recording") return;
    if (liveTranscript.length === 0) return;
    if (liveScanTimerRef.current) window.clearTimeout(liveScanTimerRef.current);
    // Speech is already finalized: only coalesce adjacent turns, without
    // imposing another 1.2-second wait before the decision pipeline.
    liveScanTimerRef.current = window.setTimeout(() => runLiveScan(), 350);
    return () => {
      if (liveScanTimerRef.current) window.clearTimeout(liveScanTimerRef.current);
    };
  }, [liveTranscript, recordingState, view, runLiveScan]);

  // LE FILET — le transcript vivant part en base pendant qu'on parle. Débounce
  // court : un tour finalisé est une raison d'écrire, mais deux tours qui
  // s'enchaînent ne valent qu'une écriture.
  //
  // ⚠️ Ce que ce débounce garantit VRAIMENT : il se réarme à CHAQUE tour, donc
  // dans un échange nourri (tours espacés de moins de 5 s) il ne se déclenche
  // jamais — c'est alors le battement de cœur ci-dessous qui écrit, et le
  // transcript en base peut accuser jusqu'à ~90 s de retard, pas « quelques
  // secondes ». Ce n'est pas un défaut du filet : l'audio, lui, part par
  // segments de 30 s, et la reprise re-transcrit depuis l'audio — le document
  // officiel d'une rencontre récupérée est donc complet quoi qu'il arrive. Le
  // retard ne concerne que le BROUILLON, et seulement dans le cas où aucun
  // audio n'a survécu. Un plafond d'attente (« écrire de toute façon toutes les
  // N secondes ») le réduirait, au prix d'écritures plus fréquentes.
  useEffect(() => {
    if (view !== "recording" || recordingState !== "recording") return;
    if (liveTranscript.length === 0) return;
    if (liveFlushTimerRef.current) window.clearTimeout(liveFlushTimerRef.current);
    liveFlushTimerRef.current = window.setTimeout(() => void flushLiveSessionSnapshot(), 5_000);
    return () => {
      if (liveFlushTimerRef.current) window.clearTimeout(liveFlushTimerRef.current);
    };
  }, [liveTranscript, recordingState, view, flushLiveSessionSnapshot]);

  // …et un BATTEMENT DE CŒUR pour les silences longs (client qui lit une
  // brochure, agente qui tape) et les PAUSES : c'est `updated_at` frais qui
  // distingue, au chargement suivant, une rencontre vivante dans un autre
  // onglet d'un onglet mort à marquer « interrompue ». Sans lui, une rencontre
  // silencieuse trois minutes serait déclarée morte de son vivant.
  useEffect(() => {
    if (view !== "recording") return;
    if (recordingState !== "recording" && recordingState !== "paused") return;
    const heartbeat = window.setInterval(() => {
      if (Date.now() - liveFlushLastAtRef.current >= 60_000) void flushLiveSessionSnapshot();
    }, 30_000);
    return () => window.clearInterval(heartbeat);
  }, [view, recordingState, flushLiveSessionSnapshot]);


  // « Si c'est positif, ça peut apparaître dans le fil » (François) : l'agent
  // décide lui-même de promouvoir une réponse vers l'espace visible du client.
  const promoteToFeed = useCallback((text: string) => {
    const card: SuggestionCard = {
      id: `info-${Date.now()}`,
      type: "info",
      audience: "client",
      priorite: 1,
      titre: "",
      sousTitre: text,
      items: [],
      source: "Vérifié par aBeam",
    };
    setLiveSuggestions((current) => ({
      cards: [card, ...(current?.cards ?? [])].slice(0, FEED_MAX),
      nudges: current?.nudges ?? [],
      searchesUsed: current?.searchesUsed ?? 0,
      warnings: current?.warnings ?? [],
      generatedAt: new Date().toISOString(),
    }));
  }, []);

  const sendNudgeQuestion = useCallback(() => {
    const question = nudgeInput.trim();
    if (!question || nudgeBusy) return;
    const scope = nudgeRequestScopeRef.current;
    const pending = scope.begin();
    if (!pending) return;
    const sessionId = activeLiveSessionRef.current?.id;
    const body = JSON.stringify({ messages: [...nudgeThread, { from: "agent", text: question }]
      .filter((item) => !("kind" in item && item.kind === "nudge")).slice(-8)
      .map((item) => ({ role: item.from === "agent" ? "user" : "assistant", content: item.text })),
      brief: liveBriefRef.current, session_id: sessionId, client_id: activeSetup.clientId || undefined });
    const isCurrent = () => scope.isCurrent(pending) && activeLiveSessionRef.current?.id === sessionId;
    setNudgeInput("");
    setNudgeBusy(true);
    const askedId = `q:${Date.now()}`;
    setNudgeThread((current) => [...current, { id: askedId, from: "agent", text: question }]);
    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isCurrent()) return;
        const accessToken = data.session?.access_token;
        const response = await fetch("/api/nudge-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body,
          signal: pending.signal,
        });
        const payload = (await response.json()) as { reply?: string; error?: string };
        if (!isCurrent()) return;
        setNudgeThread((current) => [...current, {
          id: `a:${Date.now()}`,
          from: "nudge",
          text: response.ok && payload.reply ? payload.reply : localize("L’assistant n’a pas pu répondre. Réessayez.", "The assistant could not respond. Try again."),
        }]);
      } catch {
        if (!isCurrent()) return;
        setNudgeThread((current) => [...current, { id: `a:${Date.now()}`, from: "nudge", text: localize("Impossible de joindre l’assistant. Réessayez.", "The assistant could not be reached. Try again.") }]);
      } finally {
        if (scope.finish(pending)) setNudgeBusy(false);
      }
    })();
  }, [nudgeInput, nudgeBusy, nudgeThread, supabase, activeSetup.clientId, localize]);

  /**
   * VOIE LENTE live (règles §2.2) : l'autorité qui confirme, corrige ou RETIRE
   * ce que la voie rapide a montré. Déclenchée par le CHANGEMENT RÉEL de la
   * conversation, pas par l'horloge : une seule phrase de plus ne change pas le
   * sens, et re-dériver pour rien coûte cher sans rien apporter.
   *
   * Extraite de son intervalle (2026-08-07) parce qu'elle a maintenant DEUX
   * déclencheurs : l'horloge de secours, et le transcript lui-même. C'est le
   * second qui règle le cas du monologue — le partiel réveille désormais
   * l'autorité avant la finalisation, sans contaminer le transcript officiel.
   * La décision est pure et locale (une somme de mots sur un tableau déjà en
   * mémoire) : elle ne coûte rien quand elle dit non, et c'est ELLE qui fait
   * office de débounce.
   */
  const tenterVoieLente = useCallback((partiel?: string) => {
    const finalisees = transcriptRef.current.filter((line) => line.kind !== "private-note");
    // Le partiel est une ligne ÉPHÉMÈRE : il sert à réveiller l'autorité et à
    // atteindre son seuil pendant un monologue, mais ne rejoint jamais le
    // transcript officiel ni le snapshot persistant.
    const textePartiel = (partiel ?? (liveSubjectRefreshRef.current ? livePartielRef.current : ""))
      .replace(/\s+/g, " ")
      .trim();
    const lines = textePartiel
      ? [
          ...finalisees,
          {
            id: "partiel-en-cours",
            speaker: "Conversation" as const,
            text: textePartiel,
            time: Math.max(1, elapsedRef.current),
          },
        ]
      : finalisees;
    // Le verrou de non-concurrence, testé en premier : le déclencheur sur le
    // transcript rend cette fonction réentrante par construction.
    if (liveSlowBusyRef.current) return;
    const mots = motsTranscript(lines);
    // Le signal est le nombre de MOTS, pas de lignes : voir `VOIE_LENTE` dans
    // `lib/live/cadence.ts` (fusion des tours du même locuteur, 2026-08-07) et
    // le filet qui reste un filet (les 11 appels à /api/extract, 2026-08-06).
    const decisionBase = decideVoieLente({
      mots,
      motsDerives: liveSlowMotsRef.current,
      aDejaDerive: liveSlowDejaRef.current,
      tirsSansAutorite: liveTirsSansAutoriteRef.current,
      // Sur l'horloge murale, donc il continue de courir pendant une pause. À
      // la reprise, une re-dérivation peut partir tout de suite : c'est VOULU —
      // s'il reste assez de mots neufs non traités, l'autorité a du retard.
      depuisMs: Date.now() - liveSlowAtRef.current,
    });
    const sujetChangeAutorite = liveSubjectRefreshRef.current
      && liveSlowDejaRef.current
      && mots >= VOIE_LENTE.MOTS_AMORCE
      && Date.now() - liveSlowAtRef.current >= 30_000;
    const decision = sujetChangeAutorite
      ? { action: "deriver" as const, raison: "nouveau lieu ou hôtel — revalidation live" }
      : decisionBase;
    if (decision.action !== "deriver") return;
    liveSlowBusyRef.current = true;
    // Consommés AU LANCEMENT, même si l'appel échoue : c'est l'anti-bousculade,
    // ce qui empêche une rafale d'extractions concurrentes.
    liveSlowMotsRef.current = mots;
    liveSlowAtRef.current = Date.now();
    const slowGeneration = liveSlowGenerationRef.current;
    const requestSessionId = activeLiveSessionRef.current?.id ?? null;
    const requestSubjectKey = liveSubjectKeyRef.current;
    const isCurrent = () => slowGeneration === liveSlowGenerationRef.current
      && (activeLiveSessionRef.current?.id ?? null) === requestSessionId;
    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        const headers = {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        };
        const extractResponse = await fetch("/api/extract", {
          method: "POST",
          headers,
          body: JSON.stringify({ transcript: lines, client_id: activeSetup.clientId || undefined }),
        });
        if (!extractResponse.ok) {
          if (isCurrent()) logSessionEvent("live_brief_authority_failed", { reason: "http", status: extractResponse.status });
          return;
        }
        const { brief } = (await extractResponse.json()) as { brief?: TripBrief };
        if (!isCurrent()) return;
        if (requestSubjectKey !== liveSubjectKeyRef.current) {
          liveSubjectRefreshRef.current = true;
          // Une amorce périmée n'a jamais produit d'autorité : elle doit
          // pouvoir repartir au prochain signal, sans attendre le repos de 2 min.
          if (!liveSlowDejaRef.current) liveSlowMotsRef.current = 0;
          return; // le sujet a changé pendant l'extraction : attendre sa revalidation
        }
        if (!brief || brief.meta.nature_conversation !== "planification") return;
        liveBriefRef.current = brief; // le chat du Nudge Agent profite du brief à jour
        // L'autorité vient de parler, et c'est ICI qu'on le sait — un brief
        // REÇU, pas un appel lancé. Un /api/extract qui échoue ne confirme
        // rien : le filet de tirs doit rester armé pour retenter (le plancher
        // REPOS_MIN_MS borne ce retry à 30/h même contre un endpoint mort).
        liveSlowDejaRef.current = true;
        liveTirsSansAutoriteRef.current = 0;
        // Si un nouveau lieu a été dit pendant l'appel LLM, le brief reçu est
        // déjà périmé pour ce nouveau sujet. On garde le drapeau armé afin que
        // la prochaine passe lente revalide Cassis (au lieu de considérer à
        // tort que la réponse Cancun vient de tout confirmer).
        const authoritySubjectKey = triggersSubjectKey({
          destinations: brief.lieu.destinations.valeur ?? [],
          hotel: brief.lieu.hotel_nomme.valeur ?? null,
        });
        liveSubjectRefreshRef.current = Boolean(
          liveSubjectKeyRef.current && authoritySubjectKey !== liveSubjectKeyRef.current,
        );
        logSessionEvent("live_brief_authority", {
          reason: decision.raison,
          destinations: brief.lieu.destinations.valeur ?? [],
          hotel: brief.lieu.hotel_nomme.valeur,
          nature: brief.meta.nature_conversation,
        });
        // …et la voie lente le CORRIGE, sans bruit (règles §3). Deux choses
        // se jouent ici, dans cet ordre :
        //   ① la lente devient la seule source du panneau, et on JETTE le
        //      brief rapide. C'est ce qui rend le « retrait silencieux »
        //      possible : ce que l'autorité ne reprend pas à son compte
        //      disparaît de l'écran, au lieu d'être maintenu en vie par une
        //      fenêtre de transcript vieille de trois minutes ;
        //   ② le `set` est placé AVANT le court-circuit de `briefSearchKey` :
        //      même quand la signature cherchable n'a pas bougé — donc
        //      qu'aucune recherche ne sera relancée — le brief, lui, a pu
        //      être corrigé (« Club Med Michès » enfin situé en République
        //      dominicaine, une date précisée). Le panneau suit cette
        //      correction-là aussi, elle ne coûte rien.
        setLiveBriefLent(brief);
        setLiveBriefRapide(null);
        // Même payload cherchable → mêmes cartes : on garde le brief, on ne
        // relance pas les recherches.
        const searchKey = briefSearchKey(brief);
        if (searchKey === liveSuggestKeyRef.current) return;
        // LA GARDE DE BUDGET EST ICI, ET PAS AVANT /api/extract : l'extraction
        // ne consomme aucune recherche SerpAPI, seul /api/suggest en consomme.
        // Placée en tête, elle éteignait L'AUTORITÉ dès que la voie rapide
        // avait brûlé les 60 recherches — l'écran se figeait alors sur ce que
        // la voie rapide avait deviné, un silence qui ment (loi 4). À budget
        // épuisé, la correction du panneau et le retrait silencieux continuent
        // donc de fonctionner ; seules les cartes neuves s'arrêtent.
        if (liveSearchesRef.current >= SEARCH_BUDGET_PER_SESSION) return;
        const suggestResponse = await fetch("/api/suggest", {
          method: "POST",
          headers: { ...headers, Accept: "application/x-ndjson" },
          body: JSON.stringify({
            brief,
            client_id: activeSetup.clientId || undefined,
            session_id: requestSessionId,
            mode: "live",
          }),
        });
        if (!suggestResponse.ok) {
          if (suggestResponse.status === 429 && isCurrent()) annoncerBudgetAtteint();
          return;
        }
        const payload = await readSuggestionResponse(suggestResponse, (cards) => {
          if (isCurrent() && requestSubjectKey === liveSubjectKeyRef.current) {
            applyLiveSuggestionProgress(cards);
          }
        });
        if ((activeLiveSessionRef.current?.id ?? null) === requestSessionId) {
          liveSearchesRef.current += payload.searchesUsed ?? 0;
        }
        if (!isCurrent() || requestSubjectKey !== liveSubjectKeyRef.current) return;
        liveSuggestKeyRef.current = searchKey;
        applyLiveSuggestionPayload(payload);
      } catch {
        if (isCurrent()) logSessionEvent("live_brief_authority_failed", { reason: "network_or_parse" });
        // silencieuse — jamais bloquante
      } finally {
        if (slowGeneration === liveSlowGenerationRef.current) liveSlowBusyRef.current = false;
      }
    })();
  }, [annoncerBudgetAtteint, applyLiveSuggestionPayload, applyLiveSuggestionProgress, logSessionEvent, supabase, activeSetup.clientId]);

  // ① L'HORLOGE DE SECOURS — elle ne sert plus qu'aux silences, puisque le
  // transcript déclenche lui-même ci-dessous. 15 s et non 60 : sur la rencontre
  // de 94 s du 2026-08-07 il n'y avait matériellement qu'UN tour de boucle, et
  // il tombait avant même que le tour long ne soit finalisé. 15 s borne aussi
  // le dépassement du filet temporel à ≤15 s.
  useEffect(() => {
    if (view !== "recording" || recordingState !== "recording") return;
    const intervalId = window.setInterval(tenterVoieLente, 15_000);
    return () => window.clearInterval(intervalId);
  }, [view, recordingState, tenterVoieLente]);

  // ② LE TRANSCRIPT — le déclencheur qui règle vraiment le cas du monologue. Pas
  // de débounce : la décision pure EST le débounce, et elle ne change aucun
  // seuil. Ce déclencheur ne peut que réduire la latence, jamais augmenter la
  // cadence.
  useEffect(() => {
    if (view !== "recording" || recordingState !== "recording") return;
    if (liveTranscript.length === 0) return;
    tenterVoieLente();
  }, [liveTranscript, view, recordingState, tenterVoieLente]);

  useEffect(() => {
    const scanQueue = liveScanQueueRef.current;
    return () => {
      scanQueue.invalidate();
      liveSlowGenerationRef.current += 1;
      clearCaptureTimers();
      stopMediaResources();
    };
  }, [clearCaptureTimers, stopMediaResources]);


  /**
   * REPRENDRE LE TRAITEMENT (le filet, tranche E) — la boucle cliente de
   * /api/finalize : une étape coûteuse par appel, jusqu'à `prete`. Le plafond
   * d'appels et le test d'avancement garantissent qu'un statut qui ne bouge
   * pas ne devient jamais une boucle infinie. À la fin, la ligne serveur est
   * LA source de vérité : on la recharge au lieu de recoudre l'état local.
   */
  const reprendreTraitement = useCallback(async (sessionId: string) => {
    if (resumingSessionId || processingSessionIds.has(sessionId)) return;
    const generation = persistGenerationRef.current;
    const ownerId = currentUser?.id;
    const isCurrent = () => generation === persistGenerationRef.current;
    if (!ownerId) return;
    setResumingSessionId(sessionId);
    setSessionProcessing(sessionId, generation, "resuming");
    try {
      const { data } = await supabase.auth.getSession();
      if (!isCurrent()) return;
      const accessToken = data.session?.access_token;
      if (!accessToken || data.session?.user.id !== ownerId) throw new Error(language === "fr" ? "Reconnectez-vous pour reprendre le traitement." : "Sign in again to resume processing.");
      const headers = {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      };
      let statut: string | null = null;
      for (let appel = 0; appel < 4 && statut !== "prete"; appel += 1) {
        const response = await fetch("/api/finalize", { method: "POST", headers, body: JSON.stringify({ sessionId }) });
        const payload = (await response.json()) as { status?: string; error?: string; etat?: string; reprenableDansMs?: number };
        if (!isCurrent()) return;
        if (!response.ok) {
          // UN REFUS SE DIT AVEC SON ÉCHÉANCE (loi 4). Quand le serveur refuse
          // parce que l'attente n'est pas finie, il envoie combien de temps il
          // reste : on l'affiche plutôt que son message brut, qui renvoyait à un
          // rechargement de l'espace de travail — vrai après trois minutes, FAUX
          // pendant, et un message faux est pire qu'un silence.
          if (typeof payload.reprenableDansMs === "number") {
            const attente = formatAttente(payload.reprenableDansMs);
            const sauvegarde = payload.etat === "en-traitement";
            throw new Error(language === "fr"
              ? (sauvegarde
                ? `Sauvegarde encore en cours — reprise possible dans ${attente}`
                : `Rencontre encore active ailleurs — reprise possible dans ${attente}`)
              : (sauvegarde
                ? `Save still running — resumable in ${attente}`
                : `Meeting still active elsewhere — resumable in ${attente}`));
          }
          throw new Error(localize("Le traitement n’a pas pu reprendre.", "Processing could not resume."));
        }
        if (payload.status === statut) break; // pas d'avancement → on s'arrête, on ne boucle pas
        statut = payload.status ?? null;
        if (statut === "transcrit") setSessionProcessing(sessionId, generation, "analyzing", "transcript");
        else if (statut === "prete") setSessionProcessing(sessionId, generation, "integrating");
      }
      const { data: row, error } = await supabase.from("sessions").select("*").eq("id", sessionId).maybeSingle();
      if (!isCurrent()) return;
      if (error || !row) throw new Error(localize("La conversation n’a pas pu être retrouvée.", "The conversation could not be found."));
      const fraiche = sessionFromRow(row as SessionRow, uiLanguageRef.current);
      // Recovery just wrote this exact row on the server. Adopt it as the
      // baseline so the workspace writer does not echo its transcript/brief.
      persistedRowsRef.current.sessions.set(sessionId, sessionToRow(fraiche, ownerId));
      persistedSourcesRef.current.sessions.set(sessionId, fraiche);
      persistedBookmarksRef.current.set(sessionId, fraiche.bookmarks ?? []);
      remoteIdsRef.current.sessions.add(sessionId);
      // Filing can happen while recovery runs. Publish processed fields without
      // replacing a newer client/folder assignment with this response's snapshot.
      const processedResult = {
        transcript: fraiche.transcript, summary: fraiche.summary, audioRef: fraiche.audioRef, status: fraiche.status,
        notes: fraiche.notes, clientSummary: fraiche.clientSummary, clientSubject: fraiche.clientSubject,
        natureConversation: fraiche.natureConversation, suggestions: fraiche.suggestions, updatedAt: fraiche.updatedAt,
      };
      setSessions((current) => applyBackgroundResult(current, sessionId, processedResult));
      if (statut === "prete" && isTripBriefSummary(fraiche.summary) && fraiche.summary.meta.nature_conversation === "planification") {
        const currentConversation = persistLatestRef.current?.sessions.find((item) => item.id === sessionId);
        requestSuggestions(fraiche.id, fraiche.summary, currentConversation ? currentConversation.clientId : fraiche.clientId);
      }
      showToast(statut === "prete"
        ? (language === "fr" ? "Traitement terminé — la conversation est complète" : "Processing finished — the conversation is complete")
        : (language === "fr" ? "Reprise incomplète — réessayer dans un instant" : "Recovery incomplete — try again shortly"), statut === "prete" ? "success" : "warning");
    } catch (error) {
      if (!isCurrent()) return;
      showToast(error instanceof Error ? error.message : (language === "fr" ? "La reprise a échoué." : "Recovery failed."), "error");
    } finally {
      clearSessionProcessing(sessionId, generation);
      if (isCurrent()) setResumingSessionId("");
    }
  }, [clearSessionProcessing, currentUser, language, processingSessionIds, requestSuggestions, resumingSessionId, setSessionProcessing, showToast, supabase, localize]);

  const appendTranscript = useCallback((speaker: TranscriptLine["speaker"], text: string, kind: TranscriptLine["kind"] = "speech") => {
    transcriptRef.current = appendTranscriptLine(
      transcriptRef.current,
      speaker,
      text,
      Math.max(1, elapsedRef.current),
      kind,
    );
    setLiveTranscript(transcriptRef.current);
  }, []);

  const startElapsedTimer = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      elapsedRef.current += 1;
    }, 1000);
  }, []);

  const startBrowserRecognition = useCallback(() => {
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setLiveTranscriptStatus("unavailable");
      setCaptureMessage(
        language === "fr"
          ? "Le micro enregistre bien. La transcription en direct n’est pas offerte par ce navigateur."
          : "The microphone is recording. Live transcription is not available in this browser.",
      );
      return;
    }

    setLiveTranscriptStatus("starting");
    const recognition = new Recognition();
    const captureSession = activeLiveSessionRef.current;
    const isCurrent = () => recognitionRef.current === recognition && activeLiveSessionRef.current === captureSession;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "fr-CA";
    recognitionShouldRunRef.current = true;

    recognition.onresult = (event) => {
      if (!isCurrent()) return;
      setLiveTranscriptStatus("active");
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          // The browser API does not expose speaker diarization. Keep the local mic
          // stream assigned to the advisor instead of inventing alternating voices.
          appendTranscript("Advisor", text);
        } else {
          interim += text;
        }
      }
      setInterimTranscript(interim.trim());
    };

    recognition.onerror = (event) => {
      if (!isCurrent()) return;
      if (!recognitionShouldRunRef.current && event.error === "aborted") return;
      if (event.error === "no-speech") {
        setLiveTranscriptStatus("active");
        return;
      }

      recognitionShouldRunRef.current = false;
      setLiveTranscriptStatus("unavailable");
      setCaptureMessage(
        language === "fr"
          ? "L’audio continue d’être enregistré, mais le service de transcription en direct s’est arrêté."
          : "Audio recording continues, but the live transcription service stopped.",
      );
    };

    recognition.onend = () => {
      if (!isCurrent() || !recognitionShouldRunRef.current) return;
      recognitionRestartRef.current = window.setTimeout(() => {
        recognitionRestartRef.current = null;
        if (!isCurrent() || !recognitionShouldRunRef.current) return;
        try {
          recognition.start();
        } catch {
          recognitionShouldRunRef.current = false;
          setLiveTranscriptStatus("unavailable");
          setCaptureMessage(
            language === "fr"
              ? "L’audio continue d’être enregistré, mais la transcription en direct n’a pas pu redémarrer."
              : "Audio recording continues, but live transcription could not restart.",
          );
        }
      }, 350);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setLiveTranscriptStatus("active");
      setCaptureMessage(
        language === "fr"
          ? "Transcription en direct active. L’audio sera retranscrit officiellement après la sauvegarde."
          : "Live transcription is active. The official transcript will be created after saving.",
      );
    } catch {
      recognitionShouldRunRef.current = false;
      setLiveTranscriptStatus("unavailable");
      setCaptureMessage(
        language === "fr"
          ? "Le micro enregistre bien, mais la transcription en direct n’a pas pu démarrer."
          : "The microphone is recording, but live transcription could not start.",
      );
    }
  }, [appendTranscript, language]);

  const fetchLiveToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    const response = await fetch("/api/live-token", {
      method: "POST",
      headers: { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    });
    if (!response.ok) throw new Error(localize("La transcription en direct est indisponible.", "Live transcription is unavailable."));
    const payload = (await response.json()) as { token?: string };
    if (!payload.token) throw new Error(localize("La transcription en direct est indisponible.", "Live transcription is unavailable."));
    return payload.token;
  }, [supabase, localize]);

  // Entrée live 2.1 : streaming AssemblyAI d'abord (qualité constante),
  // reconnaissance navigateur en repli. La boucle live est input-agnostique.
  const startAssemblyStreaming = useCallback(async (stream: MediaStream) => {
    const generation = ++streamGenerationRef.current;
    const handle = await startAssemblyLiveStream({
      stream,
      fetchToken: async () => {
        const token = await fetchLiveToken();
        if (generation !== streamGenerationRef.current) throw new DOMException("Capture cancelled", "AbortError");
        return token;
      },
      prompt: STT_CONTEXT_PROMPT,
      keyterms: TRAVEL_KEYTERMS,
      onFinal: (text, label) => {
        if (generation !== streamGenerationRef.current) return;
        if (label && !liveFirstLabelRef.current) liveFirstLabelRef.current = label;
        const speaker: TranscriptLine["speaker"] = label
          ? (label === liveFirstLabelRef.current ? "Advisor" : "Client")
          : "Conversation";
        appendTranscript(speaker, text);
        livePartielRef.current = "";
        // Le tour est clos : le partiel a fini son travail, l'ardoise est nette
        // pour le suivant.
        partielArmeRef.current = PARTIEL_VIDE;
      },
      /**
       * ARMER PENDANT QU'ON PARLE (défaut ②) — le fondateur n'a vu la question
       * qu'au moment d'appuyer sur pause, parce que la pause était ce qui
       * FORÇAIT la finalisation de son unique tour de 23 s. On écoute désormais
       * les partiels ; `decidePartiel` décide s'ils valent un scan.
       *
       * Le partiel ne va NULLE PART sauf dans les fenêtres éphémères de
       * `tenterVoieLente` et `runLiveScan`, qui l'oublient après leur requête.
       * Il n'entre ni dans `transcriptRef` (le transcript officiel — Loi 25), ni dans
       * `interimTranscript` : ce dernier est le reliquat de la reconnaissance
       * du navigateur, recollé au transcript à la sauvegarde, et un partiel
       * AssemblyAI y doublerait la dernière phrase puisque `Terminate` le
       * rendra une seconde fois comme tour finalisé. Il ne passe même pas par
       * un état React — un ref suffit, et rien ne se redessine.
       *
       * Conséquence voulue : la voie lente garde toute son autorité (§2) sur un
       * transcript qui, lui, n'a pas bougé, et le retrait silencieux (§3)
       * continue de fonctionner si le partiel s'avère faux — la carte armée
       * trop tôt se retire sans bruit à la re-dérivation suivante.
       */
      onPartial: (text) => {
        if (generation !== streamGenerationRef.current) return;
        livePartielRef.current = text;
        // La voie lente ne doit pas attendre la clôture d'un monologue : elle
        // compte et transmet ce texte dans sa fenêtre éphémère. `tenterVoieLente`
        // ne l'écrit ni dans `transcriptRef` ni en base.
        tenterVoieLente(text);
        const decision = decidePartiel({
          partiel: text,
          etat: partielArmeRef.current,
          // Le vocabulaire voyage rend la détection de nom indépendante de la
          // casse — les partiels ne sont pas formatés (`turn_is_formatted:false`).
          vocabulaire: TRAVEL_KEYTERMS,
        });
        if (decision.action !== "armer") return;
        partielArmeRef.current = decision.etat;
        runLiveScan(text);
      },
      /**
       * Un tour jeté par le filtre d'hallucination. Volontairement MUET à
       * l'écran : la loi 4 (« l'échec se dit ») porte sur les RECHERCHES —
       * « j'ai cherché et je n'ai pas trouvé » — pas sur la captation. Annoncer
       * en pleine rencontre « je viens de jeter une phrase » serait du bruit
       * pur, et la loi 1 l'interdit. Mais ça se journalise : c'est le seul
       * moyen de vérifier après coup que le filtre n'a pas mangé du vrai.
       */
      onRejet: (text, raison) => {
        if (generation !== streamGenerationRef.current) return;
        console.warn("[abeam:stt] tour écarté (hallucination probable)", { raison, texte: text });
        // Le journal persistant est ce qui permet de vérifier, à froid et à
        // l'échelle, que le filtre n'a pas mangé une vraie phrase.
        logSessionEvent("stt_tour_rejete", { raison });
      },
      /**
       * CHUTE DE FLUX (le filet, tranche D). `error` ET `closed` se traitent
       * pareil : le flux n'existe plus. `closed` n'était pas géré du tout —
       * une fermeture propre côté AssemblyAI (limite de session, incident
       * serveur) tuait la transcription live EN SILENCE, micro toujours
       * ouvert, agente pas prévenue. Désormais les deux passent par la
       * politique de reconnexion (`lib/live/reconnect.ts`) ; la bascule
       * navigateur n'arrive qu'après épuisement, et EN LE DISANT.
       */
      onStatus: (status) => {
        if (generation !== streamGenerationRef.current) return; // écho d'un flux déjà remplacé
        if (status === "active") {
          reconnexionEtatRef.current = marquerOuverte(reconnexionEtatRef.current, Date.now());
          setLiveTranscriptStatus("active");
          return;
        }
        if (status === "error" || status === "closed") {
          handleStreamDownRef.current(generation);
        }
      },
    });
    if (generation !== streamGenerationRef.current) {
      // Un flux plus récent a pris la place pendant qu'on ouvrait celui-ci
      // (double reconnexion) : celui-ci est de trop, on le referme proprement.
      void handle.stop();
      return;
    }
    liveStreamRef.current = handle;
    setLiveEngine("assembly");

    // Le flux est revenu : on retire NOTRE bandeau d'alarme, et lui seul.
    if (messageReconnexionRef.current !== null) {
      const pose = messageReconnexionRef.current;
      messageReconnexionRef.current = null;
      setCaptureMessage((actuel) => (actuel === pose ? "" : actuel));
    }

    /**
     * ADOPTÉ, MAIS MUET SI LA RENCONTRE EST EN PAUSE.
     *
     * Une reconnexion partie avant la pause peut aboutir PENDANT : le jeton met
     * une seconde à revenir, l'agente a mis en pause entre-temps.
     * `pauseMediaResources` a déjà appelé `pause()` sur un `liveStreamRef` alors
     * vide — ce flux-ci lui échapperait donc, et se mettrait à envoyer l'audio
     * de la pièce à AssemblyAI alors que l'agente voit « En pause ». C'est un
     * problème de consentement autant que de facture.
     * On l'adopte quand même (pour que `resumeActiveSession` le retrouve et le
     * relance d'un simple `resume()`), mais on le met en pause immédiatement.
     */
    if (recorderRef.current?.state === "paused") {
      handle.pause();
      setLiveTranscriptStatus("paused");
      return;
    }
    setLiveTranscriptStatus("active");
  }, [appendTranscript, fetchLiveToken, logSessionEvent, runLiveScan, tenterVoieLente]);

  /**
   * LA CHUTE, ET SA SUITE. Une seule porte de sortie pour un flux mort :
   * décider (politique pure), retenter avec un jeton frais, ou abandonner vers
   * le navigateur en l'annonçant. Le MediaRecorder, lui, n'est jamais touché —
   * l'enregistrement officiel continue pendant toute la manœuvre, c'est lui qui
   * garantit que le document de la rencontre sera complet quoi qu'il arrive.
   */
  const handleStreamDown = useCallback((generation: number) => {
    if (generation !== streamGenerationRef.current) return; // déjà traité
    if (captureCancelledRef.current) return; // arrêt volontaire en cours
    streamGenerationRef.current += 1; // les événements restants de ce flux sont morts
    const mourant = liveStreamRef.current;
    liveStreamRef.current = null;
    if (mourant) void mourant.stop(); // teardown AudioContext/worklet, idempotent

    /**
     * EN PAUSE, UNE CHUTE NE SE TRAITE PAS — elle attend la reprise.
     *
     * L'agente a mis la rencontre en pause : rien ne doit ni écrire dans sa
     * légende (le « En pause » qu'elle vient de poser serait remplacé par
     * « Démarrage… » et ne reviendrait jamais), ni surtout RALLUMER un micro.
     * Sans cette garde, l'épuisement du compteur appelait
     * `startBrowserRecognition()` sans condition : le moteur du navigateur se
     * remettait à écouter la pièce pendant une pause — exactement ce que la
     * pause promet d'empêcher.
     * Le flux mort est déjà démonté ci-dessus ; à la reprise,
     * `resumeActiveSession` voit `liveStreamRef` vide et relance AssemblyAI avec
     * un jeton frais. On lit l'état sur le `MediaRecorder` (un ref) plutôt que
     * sur `recordingState` : ce gestionnaire est appelé à travers un ref, il ne
     * doit dépendre d'aucune valeur capturée.
     */
    if (recorderRef.current?.state !== "recording") return;

    const decision = decideReconnexion(reconnexionEtatRef.current, Date.now());
    reconnexionEtatRef.current = decision.etat;
    logSessionEvent("stt_chute", {
      decision: decision.action,
      tentatives: decision.etat.tentatives,
      ...(decision.action === "retenter" ? { delai_ms: decision.delaiMs } : {}),
    });

    if (decision.action === "retenter") {
      setLiveTranscriptStatus("starting");
      const alerte = language === "fr"
        ? "Transcription en direct interrompue — reconnexion en cours… (l'audio continue d'être enregistré)"
        : "Live transcription dropped — reconnecting… (audio keeps recording)";
      // Mémorisé pour être retiré à l'identique quand le flux revient.
      messageReconnexionRef.current = alerte;
      setCaptureMessage(alerte);
      reconnexionTimerRef.current = window.setTimeout(() => {
        reconnexionTimerRef.current = null;
        const stream = streamRef.current;
        // La rencontre a pu se terminer, s'annuler ou se mettre en pause
        // pendant le délai : on ne rouvre JAMAIS un micro que l'agente croit
        // fermé ou en pause.
        if (!stream || captureCancelledRef.current) return;
        if (recorderRef.current?.state !== "recording") return;
        const captureSession = activeLiveSessionRef.current;
        const recorder = recorderRef.current;
        const attempt = startAssemblyStreaming(stream);
        const attemptGeneration = streamGenerationRef.current;
        void attempt.catch(() => {
          if (attemptGeneration !== streamGenerationRef.current || activeLiveSessionRef.current !== captureSession
            || recorderRef.current !== recorder || recorder?.state !== "recording" || captureCancelledRef.current) return;
          handleStreamDownRef.current(attemptGeneration);
        });
      }, decision.delaiMs);
      return;
    }

    // Épuisement : bascule navigateur, annoncée (loi 4 — l'échec se dit).
    setLiveEngine("browser");
    startBrowserRecognition();
    const degrade = language === "fr"
      ? "Transcription en direct dégradée (moteur du navigateur). Le document officiel sera complet à la sauvegarde."
      : "Live transcription degraded (browser engine). The official transcript will be complete after saving.";
    // Mémorisé au même titre que l'alerte de reconnexion : si AssemblyAI revient
    // plus tard (reprise après une pause), « dégradée » cesse d'être vrai et le
    // message doit disparaître avec la panne qu'il décrivait.
    messageReconnexionRef.current = degrade;
    setCaptureMessage(degrade);
  }, [language, logSessionEvent, startAssemblyStreaming, startBrowserRecognition]);

  useEffect(() => {
    handleStreamDownRef.current = handleStreamDown;
  }, [handleStreamDown]);

  const beginMicrophoneCapture = useCallback(async () => {
    if (portfolioDemoEnabled()) {
      // Never request microphone permission or start STT in the public demo.
      setRecordingState("blocked");
      setLiveTranscriptStatus("unavailable");
      setCaptureMessage(language === "fr"
        ? "Le microphone est désactivé dans cette démonstration. Explorez les conversations d’exemple dans les dossiers."
        : "Recording is unavailable in this public demo. Explore the sample conversations in Folders.");
      return;
    }

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setRecordingState("blocked");
      setLiveTranscriptStatus("unavailable");
      setCaptureMessage(
        language === "fr" ? "Ouvrez l’app en HTTPS pour utiliser le microphone." : "Open the app over HTTPS to use the microphone.",
      );
      return;
    }

    const requestScope = microphoneRequestScopeRef.current;
    const request = requestScope.begin();
    if (!request) return;
    const captureSession = activeLiveSessionRef.current;
    const isCurrent = () => requestScope.isCurrent(request) && Boolean(captureSession) && activeLiveSessionRef.current === captureSession;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (!isCurrent() || captureCancelledRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const mimeTypes = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"];
      const mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      audioMimeTypeRef.current = recorder.mimeType || mimeType || "audio/webm";
      recorder.ondataavailable = (event) => {
        // The final save blob is accepted until onstop; a replaced recorder
        // must never append delayed audio into the next conversation.
        if (recorderRef.current !== recorder) return;
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          // Le filet : toutes les ~30 s de captation, un segment part en base.
          // Un onglet mort ne coûte plus que la traîne depuis le dernier segment.
          if (audioChunksRef.current.length - audioPartCursorRef.current >= 30) {
            void uploadAudioPart();
          }
        }
      };
      recorder.start(1000);
      microphoneStartedAtRef.current = performance.now();
      setRecordingState("recording");
      startElapsedTimer();
      // Le micro tourne pour de vrai : la rencontre existe, la base le sait.
      void insertSessionStartRow();
      try {
        await startAssemblyStreaming(stream);
      } catch {
        if (!isCurrent() || captureCancelledRef.current) return;
        setLiveEngine("browser");
        if (recorder.state === "recording") startBrowserRecognition();
        else if (recorder.state === "paused") setLiveTranscriptStatus("paused");
      }
    } catch (error) {
      if (!isCurrent() || captureCancelledRef.current) return;
      stopMediaResources();
      const name = error instanceof DOMException ? error.name : "UnknownError";
      setRecordingState("blocked");
      setLiveTranscriptStatus("unavailable");
      if (name === "NotAllowedError") {
        setCaptureMessage(language === "fr" ? "Autorisez le microphone dans les réglages du navigateur, puis réessayez." : "Allow the microphone in your browser settings, then try again.");
      } else if (name === "NotFoundError") {
        setCaptureMessage(language === "fr" ? "Aucun microphone trouvé. Connectez-en un, puis réessayez." : "No microphone found. Connect one and try again.");
      } else {
        setCaptureMessage(language === "fr" ? "Le microphone n’a pas pu démarrer. Réessayez." : "The microphone could not start. Try again.");
      }
    } finally {
      requestScope.finish(request);
    }
  }, [insertSessionStartRow, language, startAssemblyStreaming, startBrowserRecognition, startElapsedTimer, stopMediaResources, uploadAudioPart]);

  const startSession = useCallback(async (setupOverride?: SessionSetup) => {
    if (closingCaptureRef.current) {
      showToast(language === "fr" ? "Le micro termine sa sauvegarde. Réessayez dans un instant." : "The microphone is finishing its save. Try again in a moment.", "info");
      return;
    }
    // The session ref changes synchronously, before React renders requesting.
    // Two Start clicks in the same frame can only create one capture.
    if (recordingState !== "idle" || activeLiveSessionRef.current) return;
    const sourceSetup = setupOverride ?? setup;
    if (!sourceSetup.consent) {
      showToast(language === "fr" ? "Consentement requis avant d’enregistrer." : "Confirm client consent before recording.", "warning");
      return;
    }
    cancelNudgeRequest();
    const nextSetup = {
      ...sourceSetup,
      clientName: sourceSetup.clientName.trim() || "New contact",
      clientEmail: sourceSetup.clientEmail.trim(),
      tripTitle: sourceSetup.tripTitle.trim() || "General conversation",
    };
    setActiveSetup(nextSetup);
    activeLabModeRef.current = feedDisplayMode === "lab";
    activeJevLabChoiceRef.current = activeLabModeRef.current ? jevLabChoice : "jev_live";
    setActiveJevLabChoice(jevLabChoice);
    setJevPilotResult(null);
    setLabCardRatings({});
    microphoneStartedAtRef.current = null;
    firstVisibleCardLoggedRef.current = false;
    // Le filet : l'identité de la rencontre naît ICI, pas à la sauvegarde. La
    // ligne en base ne sera insérée que quand le micro démarrera réellement
    // (`beginMicrophoneCapture`) — un démarrage bloqué ne sème pas de ligne.
    activeLiveSessionRef.current = { id: makeId("session"), setup: nextSetup, inserted: false };
    reconnexionEtatRef.current = RECONNEXION_VIERGE;
    setSelectedFolderKey(nextSetup.clientId && nextSetup.tripId
      ? `${nextSetup.clientId}::${nextSetup.tripId}`
      : folderKeyForValues(nextSetup.clientName, nextSetup.tripTitle));
    setSelectedSessionId("");
    setConversationDetailSessionId("");
    setLiveSuggestions(null);
    resetConversationPresentation();
    liveScanQueueRef.current.invalidate();
    liveScanCoalescedRef.current = 0;
    liveSlowGenerationRef.current += 1;
    liveSlowBusyRef.current = false;
    liveScanKeyRef.current = "";
    liveSearchesRef.current = 0;
    liveFirstLabelRef.current = null;
    partielArmeRef.current = PARTIEL_VIDE;
    liveSlowMotsRef.current = 0;
    liveSlowDejaRef.current = false;
    liveTirsSansAutoriteRef.current = 0;
    liveBriefRef.current = null;
    setLiveBriefRapide(null);
    setLiveBriefLent(null);
    // Le filet de la voie lente se compte depuis le DÉBUT de la rencontre. À
    // zéro, il se croyait déjà en retard de 56 ans et repartait au premier tour
    // de boucle. Le piège vaut mot pour mot pour le plancher REPOS_MIN_MS.
    liveSlowAtRef.current = Date.now();
    liveLastFireRef.current = 0;
    liveSeenRef.current = SEEN_VIDE;
    liveSuggestKeyRef.current = "";
    liveSubjectKeyRef.current = "";
    liveSubjectRefreshRef.current = false;
    livePartielRef.current = "";
    liveFlushClosedRef.current = false;
    nudgePostedRef.current = new Set();
    setNudgeThread([]);
    setNudgeInput("");
    // « Jamais deux fois la même dans une rencontre » — donc remis à neuf à
    // chaque nouvelle rencontre : c'est un nouveau client, il a droit à sa question.
    desambEtatRef.current = ETAT_INITIAL;
    desambBusyRef.current = false;
    setDesambChoisi({});
    setDesambEchoues([]);
    setDesambEnCours(null);
    setLiveEngine(null);
    setRailCollapsed(false);
    setView("recording");
    setRecordingState("requesting");
    setCaptureMessage(language === "fr" ? "Demande d’accès au microphone…" : "Requesting microphone access…");
    elapsedRef.current = 0;
    setInterimTranscript("");
    setLiveTranscriptStatus("starting");
    setSaveStage("idle");
    transcriptRef.current = [];
    audioChunksRef.current = [];
    audioPartCursorRef.current = 0;
    audioPartSeqRef.current = 0;
    audioPartBusyRef.current = false;
    audioMimeTypeRef.current = "audio/webm";
    setLiveTranscript([]);
    clearCaptureTimers();
    stopMediaResources();
    captureCancelledRef.current = false;

    await beginMicrophoneCapture();
  }, [beginMicrophoneCapture, cancelNudgeRequest, clearCaptureTimers, feedDisplayMode, jevLabChoice, language, recordingState, resetConversationPresentation, setup, showToast, stopMediaResources]);

  const pauseActiveSession = useCallback(() => {
    if (recordingState !== "recording") return;
    clearCaptureTimers();
    pauseMediaResources();
    setInterimTranscript("");
    setLiveTranscriptStatus("paused");
    setRecordingState("paused");
    // Une pause est un point de synchronisation naturel : tout ce qui a été dit
    // jusqu'ici part en base maintenant — transcript ET traîne audio.
    void flushLiveSessionSnapshot();
    void uploadAudioPart();
    setCaptureMessage(language === "fr" ? "En pause · appuyez sur lecture pour continuer" : "Paused · tap play to continue");
  }, [clearCaptureTimers, flushLiveSessionSnapshot, language, pauseMediaResources, recordingState, uploadAudioPart]);

  const resumeActiveSession = useCallback(() => {
    if (recordingState !== "paused") return;
    captureCancelledRef.current = false;
    setInterimTranscript("");
    setLiveTranscriptStatus("starting");
    try {
      if (recorderRef.current?.state === "paused") recorderRef.current.resume();
    } catch {
      // Recognition can still resume if MediaRecorder resume is unavailable.
    }
    setRecordingState("recording");
    startElapsedTimer();
    if (liveStreamRef.current) {
      liveStreamRef.current.resume();
      setLiveTranscriptStatus("active");
    } else if (streamRef.current) {
      // Le flux est mort pendant la pause (ou la reconnexion attendait la
      // reprise) : on retente AssemblyAI avec un jeton frais avant de se
      // rabattre sur le navigateur — même logique qu'au démarrage.
      const captureSession = activeLiveSessionRef.current;
      const recorder = recorderRef.current;
      const attempt = startAssemblyStreaming(streamRef.current);
      const attemptGeneration = streamGenerationRef.current;
      void attempt.catch(() => {
        if (attemptGeneration !== streamGenerationRef.current || activeLiveSessionRef.current !== captureSession
          || recorderRef.current !== recorder || recorder?.state !== "recording" || captureCancelledRef.current) return;
        setLiveEngine("browser");
        startBrowserRecognition();
      });
    } else {
      startBrowserRecognition();
    }
  }, [recordingState, startAssemblyStreaming, startBrowserRecognition, startElapsedTimer]);

  const restoreConversationOrigin = useCallback((origin: ConversationOrigin = conversationOrigin) => {
    setSelectedFolderKey(origin.folderKey);
    setSelectedSessionId(origin.sessionId);
    setConversationDetailSessionId(origin.detailSessionId);
    setReviewTab(origin.reviewTab);
    setView(origin.view);
    if (origin.view === "review") window.requestAnimationFrame(() => reviewHeadingRef.current?.focus({ preventScroll: true }));
  }, [conversationOrigin]);

  const cancelActiveSession = useCallback(() => {
    setSessionStartOpen(false);
    cancelNudgeRequest();
    captureCancelledRef.current = true;
    clearCaptureTimers();
    stopMediaResources();
    // Une rencontre annulée ne laisse pas de trace de démarrage en base —
    // ni ligne, ni segments audio. (L'id se lit AVANT que la suppression ne
    // remette le ref à null.)
    const cancelledId = activeLiveSessionRef.current?.id;
    if (cancelledId && activeLiveSessionRef.current?.inserted) void cleanupAudioParts(cancelledId);
    void deleteSessionStartRow();
    setRecordingState("idle");
    setLiveTranscriptStatus("idle");
    setSaveStage("idle");
    setLiveSuggestions(null);
    liveScanQueueRef.current.invalidate();
    liveScanCoalescedRef.current = 0;
    liveSlowGenerationRef.current += 1;
    liveSlowBusyRef.current = false;
    liveScanKeyRef.current = "";
    liveSuggestKeyRef.current = "";
    liveSearchesRef.current = 0;
    liveFirstLabelRef.current = null;
    partielArmeRef.current = PARTIEL_VIDE;
    // Les MÊMES trois lignes qu'au démarrage, et pour la même raison : une
    // rencontre annulée puis relancée qui hériterait de `liveSlowDejaRef = true`
    // perdrait silencieusement son amorce — une régression qui se manifeste par
    // une absence, donc invisible.
    liveSlowMotsRef.current = 0;
    liveSlowDejaRef.current = false;
    liveTirsSansAutoriteRef.current = 0;
    // …et l'horloge repart d'ici, sinon la rencontre suivante démarre avec
    // REPOS_MIN_MS déjà écoulé (asymétrie avec `startSession`, corrigée ici).
    liveSlowAtRef.current = Date.now();
    liveSeenRef.current = SEEN_VIDE;
    liveLastFireRef.current = 0;
    liveSubjectKeyRef.current = "";
    liveSubjectRefreshRef.current = false;
    livePartielRef.current = "";
    liveFlushClosedRef.current = true;
    desambEtatRef.current = ETAT_INITIAL;
    desambBusyRef.current = false;
    setDesambChoisi({});
    setDesambEchoues([]);
    setDesambEnCours(null);
    restoreConversationOrigin();
  }, [cancelNudgeRequest, cleanupAudioParts, clearCaptureTimers, deleteSessionStartRow, restoreConversationOrigin, stopMediaResources]);

  const openConversationFiling = useCallback((conversation: TravelSession) => {
    setAssignmentFolderSearch("");
    setAssignmentCreateOpen(false);
    setAssignmentFolderTitle(conversation.tripTitle === "General conversation" ? "" : conversation.tripTitle);
    setAssignmentClientName(conversation.clientName === "New contact" ? "" : conversation.clientName);
    setAssignmentClientEmail(conversation.clientEmail);
    setAssignmentClientPhone("");
    setAssignmentSessionId(conversation.id);
  }, []);

  const saveSession = useCallback(async (options?: { returnToOrigin?: boolean }) => {
    if (closingCaptureRef.current || recordingState === "stopping") return;
    closingCaptureRef.current = true;
    const returnOrigin = options?.returnToOrigin ? conversationOrigin : null;
    cancelNudgeRequest();
    const { client: linkedClient, trip: linkedTrip, folderKey } = conversationDestination(clients, trips, activeSetup);
    // Le filet : la sauvegarde REPREND l'identité née au démarrage — c'est la
    // même rencontre, donc la même ligne. Le repli (`makeId`) ne sert que si le
    // démarrage n'a pas pu poser son id (état antérieur au chantier).
    const activeLive = activeLiveSessionRef.current;
    const duration = elapsedRef.current;
    const accountGeneration = persistGenerationRef.current;
    const sessionId = activeLive?.id ?? makeId("session");
    const pendingSession: TravelSession = {
      id: sessionId, clientId: linkedClient?.id, tripId: linkedTrip?.id,
      clientName: linkedClient?.name ?? activeSetup.clientName,
      clientEmail: linkedClient?.email ?? activeSetup.clientEmail,
      tripTitle: linkedTrip?.title ?? activeSetup.tripTitle,
      createdAt: new Date().toISOString(), duration,
      transcript: [...transcriptRef.current], summary: buildSummary(transcriptRef.current, activeSetup, language),
      clientSummary: "", captureMode: activeSetup.mode, consent: activeSetup.consent,
      audioRef: null, status: "traitement",
      bookmarks: normalizeConversationBookmarks(visibleBookmarkedCards),
    };
    setSessions((current) => [pendingSession, ...current.filter((item) => item.id !== sessionId)]);
    setProcessingSessionIds((current) => new Set(current).add(sessionId));
    setSessionProcessing(sessionId, accountGeneration, "saving");
    setSelectedFolderKey(folderKey ?? UNFILED_FOLDER_KEY);
    setSelectedSessionId(pendingSession.id);
    setConversationDetailSessionId("");
    setReviewTab("internal");
    // A known folder is already the destination; filing choices are only for unfiled conversations.
    if (returnOrigin) {
      // Back preserves the audio through the same save pipeline, then returns
      // immediately. Unfiled captures stay visible in the conversation inbox.
      setAssignmentSessionId("");
      restoreConversationOrigin(returnOrigin);
    } else {
      setView("review");
      if (folderKey) setAssignmentSessionId("");
      else openConversationFiling(pendingSession);
      if (folderKey) window.requestAnimationFrame(() => reviewHeadingRef.current?.focus({ preventScroll: true }));
    }
    try {
      const saveStartedAt = performance.now();
      const saveTimings: Record<string, number> = {};
      setRecordingState("stopping");
      liveScanQueueRef.current.invalidate();
      liveSlowGenerationRef.current += 1;
      setLiveTranscriptStatus("idle");
      setSaveStage("finalizing_audio");
      clearCaptureTimers();
      await stopRecorderForSave();
      if (accountGeneration !== persistGenerationRef.current) return;
      stopMediaResources();
      const transcript = [...transcriptRef.current];
      /**
       * `interimTranscript` reste le reliquat de la reconnaissance du NAVIGATEUR
       * — elle seule perd son interim en s'arrêtant. Les partiels d'AssemblyAI
       * n'y entrent jamais (voir `onPartial`) : le moteur les rend une seconde
       * fois comme tour finalisé quand `stop()` envoie `Terminate`, et les
       * recoller ici doublerait la dernière phrase de chaque rencontre.
       */
      const finalInterim = interimTranscript.replace(/\s+/g, " ").trim();
      if (finalInterim) {
        const mergedTranscript = appendTranscriptLine(transcript, "Advisor", finalInterim, Math.max(1, duration));
        transcript.splice(0, transcript.length, ...mergedTranscript);
      }
      if (accountGeneration !== persistGenerationRef.current) return;
      setSessionProcessing(sessionId, accountGeneration, "saving", "recording");
      if (activeLive && !activeLive.inserted) await insertSessionStartRow();
      if (!activeLive?.inserted) throw new Error((language === "fr" ? "La conversation n’a pas pu être sauvegardée sur le serveur." : "The conversation could not be saved to the server."));
      // Toutes les écritures de filet lancées pendant la captation doivent être
      // terminées avant le snapshot CAS de `/api/extract`. Sinon une mise à jour
      // du transcript pouvait arriver pendant l'extraction et invalider son
      // résultat, laissant un brief générique tout en fermant la session.
      if (activeLive?.inserted) {
        await flushLiveSessionSnapshot();
        // Le snapshot final est maintenant publié : aucun timer ou battement
        // résiduel ne doit pouvoir réécrire `updated_at` pendant l'extraction.
        liveFlushClosedRef.current = true;
      }
      // La rencontre entre en traitement : si l'onglet meurt pendant le pipeline
      // qui suit (upload, transcription batch, extraction), la ligne le dira et
      // la reprise sera possible — au lieu d'un brouillon qui se fait passer
      // pour une rencontre complète.
      if (activeLive?.inserted) {
        const { error } = await supabase
          .from("sessions")
          .update({
            status: "traitement",
            transcript,
            duration: duration,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sessionId);
        if (error) filetWarn("transition vers « traitement »", error);
      }
      if (accountGeneration !== persistGenerationRef.current) return;
      setSessions((current) => current.map((item) => item.id === sessionId ? { ...item, transcript } : item));
      const audioSnapshot = { chunks: [...audioChunksRef.current], mimeType: audioMimeTypeRef.current };
      if (activeLiveSessionRef.current === activeLive) activeLiveSessionRef.current = null;
      closingCaptureRef.current = false;
      setRecordingState("idle");
      setSaveStage("idle");
      let audioRef: string | null = null;
      let officialTranscript = transcript;
      let transcriptFromAssembly = false;
      saveTimings.finalizingAudioMs = Math.round(performance.now() - saveStartedAt);
      try {
        const uploadStartedAt = performance.now();
        setSessionProcessing(sessionId, accountGeneration, "uploading");
        audioRef = await uploadSessionAudio(sessionId, audioSnapshot);
        if (accountGeneration !== persistGenerationRef.current) return;
        if (audioRef) setSessionProcessing(sessionId, accountGeneration, "uploading", "audio");
        saveTimings.uploadAudioMs = Math.round(performance.now() - uploadStartedAt);
        // Le fichier complet existe : les segments d'assurance ont fini leur
        // service. Purge en arrière-plan, jamais bloquante — et l'audio_ref se
        // consigne tout de suite : si l'onglet meurt pendant la transcription,
        // la reprise saura que le fichier est déjà là.
        if (audioRef) void cleanupAudioParts(sessionId);
        if (audioRef && activeLive?.inserted) {
          const { error } = await supabase
            .from("sessions")
            .update({ audio_ref: audioRef, updated_at: new Date().toISOString() })
            .eq("id", sessionId);
          if (error) filetWarn("consignation de audio_ref", error);
        }
        if (accountGeneration !== persistGenerationRef.current) return;
        if (audioRef) {
            const transcriptionStartedAt = performance.now();
          setSessionProcessing(sessionId, accountGeneration, "transcribing");
          const transcribed = await transcribeSessionAudio(audioRef, sessionId);
        if (accountGeneration !== persistGenerationRef.current) return;
          saveTimings.transcriptionMs = Math.round(performance.now() - transcriptionStartedAt);
          if (transcribed.length > 0) {
            officialTranscript = transcribed;
            transcriptFromAssembly = true;
            setSessionProcessing(sessionId, accountGeneration, "transcribing", "transcript");
            // Borne de reprise « transcrit » : un onglet mort pendant
            // l'extraction (~45 s) ne fera pas repayer la transcription batch.
            if (activeLive?.inserted) {
              const { error } = await supabase
                .from("sessions")
                .update({ transcript: transcribed, status: "transcrit", updated_at: new Date().toISOString() })
                .eq("id", sessionId);
              if (error) filetWarn("transition vers « transcrit »", error);
            }
          }
        }
      } catch  {
        if (accountGeneration !== persistGenerationRef.current) return;
        showToast(localize("L’audio ou la transcription n’a pas pu être traité. Réessayez.", "Audio or transcript could not be processed. Try again."), "error");
      }
      if (accountGeneration !== persistGenerationRef.current) return;
      setSessionProcessing(sessionId, accountGeneration, "analyzing");
      // Repli : AssemblyAI n'a rien donné, on garde le brouillon navigateur — et
      // c'est LÀ que le Raw Context Agent gagne sa place.
      if (!transcriptFromAssembly && officialTranscript.length > 0) {
        const cleanupStartedAt = performance.now();
        officialTranscript = await cleanBrowserDraft(officialTranscript);
        saveTimings.cleanupMs = Math.round(performance.now() - cleanupStartedAt);
      }
      if (accountGeneration !== persistGenerationRef.current) return;
      let summary: BriefSummary = buildSummary(officialTranscript, activeSetup, language);
      let extractionSucceeded = false;
      try {
        const extractionStartedAt = performance.now();
        const processingClientId = persistLatestRef.current?.sessions.find((item) => item.id === sessionId)?.clientId ?? linkedClient?.id;
        const extractedBrief = await extractTripBrief(officialTranscript, processingClientId, sessionId);
        if (accountGeneration !== persistGenerationRef.current) return;
        saveTimings.extractionMs = Math.round(performance.now() - extractionStartedAt);
        if (extractedBrief) {
          summary = extractedBrief;
          extractionSucceeded = true;
          logSessionEvent("brief_extraction_succeeded", {
            stage: "save",
            nature: extractedBrief.meta.nature_conversation,
          }, sessionId);
          const assignedClientId = persistLatestRef.current?.sessions.find((item) => item.id === sessionId)?.clientId;
          if (assignedClientId) updateConciergeProfile(assignedClientId, extractedBrief, sessionId);
        }
      } catch  {
        // Une transcription sauvée mais sans brief n'est PAS un document prêt :
        // la session reste `transcrit`, donc le filet `/api/finalize` peut
        // reprendre l'extraction sans refaire payer l'audio/STT. Avant ce garde,
        // le code affichait un brief générique tout en marquant la rencontre
        // `prete`, ce qui transformait une erreur temporaire en perte silencieuse.
        logSessionEvent("brief_extraction_failed", { stage: "save", retryable: true }, sessionId);
        showToast(localize("L’aperçu n’a pas pu être préparé. Réessayez.", "The overview could not be prepared. Try again."), "error");
      }

      if (accountGeneration !== persistGenerationRef.current) return;
      setSessionProcessing(sessionId, accountGeneration, "integrating", extractionSucceeded ? "overview" : undefined);
      const session: TravelSession = {
        id: sessionId,
        clientId: linkedClient?.id,
        tripId: linkedTrip?.id,
        clientName: linkedClient?.name ?? activeSetup.clientName,
        clientEmail: linkedClient?.email ?? activeSetup.clientEmail,
        tripTitle: linkedTrip?.title ?? activeSetup.tripTitle,
        createdAt: new Date().toISOString(),
        duration: duration,
        transcript: officialTranscript,
        summary,
        clientSummary: "",
        captureMode: activeSetup.mode,
        consent: activeSetup.consent,
        audioRef,
        status: extractionSucceeded ? "prete" : "transcrit",
      };

      // Le filet réutilise l'id né au démarrage. Garder une seule version locale
      // évite qu'une ligne en cours chargée plus tôt survive à la sauvegarde.
      setSessions((current) => applyBackgroundResult(current, sessionId, {
        transcript: session.transcript, summary: session.summary, audioRef: session.audioRef, status: session.status,
      }));
      if (isTripBriefSummary(session.summary) && session.summary.meta.nature_conversation === "planification") {
        requestSuggestions(session.id, session.summary, persistLatestRef.current?.sessions.find((item) => item.id === sessionId)?.clientId);
      }
      if (linkedClient && linkedTrip) {
        const now = new Date().toISOString();
        setClients((current) => current.map((client) => client.id === linkedClient.id ? { ...client, updatedAt: now } : client));
        setTrips((current) => current.map((trip) => trip.id === linkedTrip.id ? { ...trip, updatedAt: now } : trip));
      }
      logSessionEvent("save_pipeline_timing", {
        totalMs: Math.round(performance.now() - saveStartedAt),
        stages: saveTimings,
        audioAvailable: Boolean(audioRef),
        batchTranscriptUsed: transcriptFromAssembly,
        extractionSucceeded,
      }, sessionId);
      // Fin du pipeline : la rencontre est un document complet. La transition
      // directe (hors écho d'état) clôt le cycle de vie ouvert au démarrage.
      if (activeLive?.inserted) void updateSessionLifecycle(sessionId, extractionSucceeded ? "prete" : "transcrit");
      showToast(extractionSucceeded
        ? (language === "fr" ? "Conversation prête" : "Conversation ready")
        : (language === "fr" ? "Conversation sauvegardée. Le brief peut être repris." : "Conversation saved. Brief processing can be resumed."), extractionSucceeded ? "success" : "warning");
    } catch (error) {
      if (accountGeneration !== persistGenerationRef.current) return;
      filetWarn("sauvegarde en arrière-plan", error);
      setSessions((current) => current.map((item) => item.id === sessionId ? { ...item, status: "interrompue" } : item));
      showToast(language === "fr" ? "Traitement interrompu. La conversation reste disponible pour reprise." : "Processing interrupted. The conversation remains available to resume.", "warning");
    } finally {
      if (accountGeneration === persistGenerationRef.current && closingCaptureRef.current && activeLiveSessionRef.current === activeLive) {
        closingCaptureRef.current = false;
        activeLiveSessionRef.current = null;
        stopMediaResources();
        setRecordingState("idle");
        setSaveStage("idle");
      }
      clearSessionProcessing(sessionId, accountGeneration);
      setProcessingSessionIds((current) => {
        if (accountGeneration !== persistGenerationRef.current) return current;
        const next = new Set(current); next.delete(sessionId); return next;
      });
    }
  }, [
    activeSetup,
    visibleBookmarkedCards,
    conversationOrigin,
    cancelNudgeRequest,
    insertSessionStartRow,
    cleanBrowserDraft,
    updateConciergeProfile,
    requestSuggestions,
    clearCaptureTimers,
    clients,
    interimTranscript,
    language,
    recordingState,
    restoreConversationOrigin,
    openConversationFiling,
    showToast,
    stopMediaResources,
    stopRecorderForSave,
    trips,
    extractTripBrief,
    transcribeSessionAudio,
    uploadSessionAudio,
    supabase,
    flushLiveSessionSnapshot,
    logSessionEvent,
    filetWarn,
    updateSessionLifecycle,
    cleanupAudioParts,
    localize,
    setSessionProcessing,
    clearSessionProcessing,
  ]);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? null,
    [selectedSessionId, sessions],
  );

  const clientOverviews = useMemo<ClientOverview[]>(() => clients
    .map((client) => {
      const clientTrips = trips
        .filter((trip) => trip.clientId === client.id)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      const clientSessions = sessions
        .filter((session) => session.clientId === client.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return {
        client,
        trips: clientTrips,
        sessions: clientSessions,
        latest: clientSessions[0] ?? null,
        activeTrip: clientTrips.find((trip) => trip.status === "active") ?? clientTrips[0] ?? null,
      };
    })
    .sort((a, b) => {
      const aDate = a.latest?.createdAt ?? a.client.updatedAt;
      const bDate = b.latest?.createdAt ?? b.client.updatedAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    }), [clients, sessions, trips]);

  const clientFolders = useMemo(() => buildClientFolders(clientOverviews, sessions, {
    general: language === "fr" ? "Conversation générale" : "General conversation",
    unfiled: copy.unfiled, unfiledHint: copy.unfiledSub,
  }), [clientOverviews, copy.unfiled, copy.unfiledSub, language, sessions]);

  /**
   * Le dossier d'une conversation, par identité et non par clé reconstruite.
   * `folderKeyForSession` retombe sur un couple de NOMS quand les liens manquent,
   * ce qui ne peut jamais correspondre au bac « Non classées » — d'où les
   * conversations invisibles à l'accueil. Cette table est la seule source.
   */
  const folderBySessionId = useMemo(() => {
    const map = new Map<string, ClientFolder>();
    clientFolders.forEach((folder) => {
      folder.sessions.forEach((session) => map.set(session.id, folder));
    });
    return map;
  }, [clientFolders]);

  const selectedFolder = useMemo(() => {
    if (selectedFolderKey) {
      return clientFolders.find((folder) => folder.key === selectedFolderKey) ?? null;
    }
    if (!selectedSession) return null;
    return folderBySessionId.get(selectedSession.id) ?? null;
  }, [clientFolders, folderBySessionId, selectedFolderKey, selectedSession]);

  const isUnfiledFolder = selectedFolderKey === UNFILED_FOLDER_KEY || selectedFolder?.key === UNFILED_FOLDER_KEY;
  const unfiledSessions = useMemo(() => clientFolders.find((folder) => folder.key === UNFILED_FOLDER_KEY)?.sessions ?? [], [clientFolders]);
  // Use all loaded conversations, including filed ones, before any list filtering.
  const conversationSequence = useMemo(() => buildConversationSequence(sessions), [sessions]);
  const selectedFolderSessions = useMemo(() => {
    // Unfiled conversations share an inbox, never a brief, playback scope or budget.
    if (isUnfiledFolder) return selectedSession ? unfiledSessions.filter((session) => session.id === selectedSession.id) : [];
    return [...(selectedFolder?.sessions ?? (selectedSession ? [selectedSession] : []))]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [isUnfiledFolder, selectedFolder, selectedSession, unfiledSessions]);
  const folderConversationCountLabel = selectedFolderSessions.length.toLocaleString(uiLocale(language));
  const folderBookmarks = useMemo(() => refreshBookmarkedConversationCards(selectedFolderSessions.flatMap((session) => session.bookmarks ?? []), []), [selectedFolderSessions]);
  const getJourneyAccessSession = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    const session = data.session;
    if (error || !session || authIdentityRef.current !== session.user.id) return null;
    return { ownerId: session.user.id, accessToken: session.access_token };
  }, [supabase]);
  const journeyScopeKey = `${currentUser?.id ?? ""}:${selectedFolder?.key ?? ""}`;
  const journeySourceSignature = useMemo(() => JSON.stringify(selectedFolderSessions.map((session) => [session.id, session.updatedAt, session.status, session.summary, session.transcript, session.bookmarks])), [selectedFolderSessions]);
  const folderJourney = useFolderJourney({
    ownerId: currentUser?.id ?? "", folderKey: selectedFolder?.key ?? "", sessionId: selectedFolderSessions[0]?.id ?? "",
    language, enabled: isAuthenticated && view === "review" && !isUnfiledFolder && Boolean(selectedFolder),
    sourceSignature: journeySourceSignature, getAccessSession: getJourneyAccessSession,
  });
  const [journeyDialog, setJourneyDialog] = useState<JourneyDialogState | null>(null);
  const [journeyDialogError, setJourneyDialogError] = useState<{ dialog: JourneyDialogState; message: string } | null>(null);
  const openBookmarkJourney = useCallback((card: SuggestionCard, item: SuggestionItem) => {
    if ((card.type !== "vols" && card.type !== "hotels") || !folderJourney.source || folderJourney.loading || folderJourney.saving || folderJourney.generating || folderJourney.pendingMutation) return;
    // The server resolves the exact saved offer's sources; same-route cards
    // in another recording may contain an older price or a different offer.
    setJourneyDialog({ scopeKey: journeyScopeKey, offer: { type: card.type, item }, offerContext: { title: card.titre, subtitle: card.sousTitre, badge: card.badge } });
  }, [folderJourney.source, folderJourney.loading, folderJourney.saving, folderJourney.generating, folderJourney.pendingMutation, journeyScopeKey]);
  const saveJourneyEntry = async (entry: JourneyEntry) => {
    const dialog = journeyDialog;
    if (!dialog || dialog.scopeKey !== journeyScopeKey) return;
    try {
      await folderJourney.saveEntry(entry);
      setJourneyDialog((current) => current === dialog ? null : current);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setJourneyDialogError({ dialog, message: error instanceof Error ? error.message : language === "fr" ? "L’étape n’a pas pu être enregistrée. Réessayez." : "The step could not be saved. Try again." });
    }
  };
  const selectedUnfiledSession = isUnfiledFolder ? selectedFolderSessions[0] ?? null : null;
  const briefSession = useMemo(
    () => {
      // Fusionner les briefs du bac « Non classées » fabriquerait un brief
      // Frankenstein : ces conversations ne partagent NI client NI voyage. On
      // n'affiche donc que le brief de la conversation ouverte, jamais un
      // agrégat qui mentirait (loi 4).
      if (isUnfiledFolder) return selectedFolderSessions[0] ?? null;
      return mergeFolderSessions(selectedFolderSessions) ?? selectedSession;
    },
    [isUnfiledFolder, selectedFolderSessions, selectedSession],
  );
  const recapSession = isUnfiledFolder ? selectedUnfiledSession : selectedFolderSessions[0] ?? selectedSession;
  const isGeneratingRecap = Boolean(recapSession && generatingRecapSessionIds.has(recapSession.id));

  const folderIntegration = folderProcessingState({ sessions: selectedFolderSessions, operations: sessionProcessingOperations, processingIds: processingSessionIds, resumingId: resumingSessionId, nowMs: maintenant });
  const folderProcessing = Boolean(folderIntegration);
  const unfiledConversationProcessing = Boolean(selectedUnfiledSession && (processingSessionIds.has(selectedUnfiledSession.id) || etatsReprise.get(selectedUnfiledSession.id)?.etat === "en-traitement"));
  // ── REVIEW : audio, provenance, agent de dossier (lot W5b) ────────────────
  //
  // Le brief affiché à gauche est la mémoire FUSIONNÉE du dossier ; la preuve à
  // droite (transcript + audio) appartient à UNE conversation. Ces trois
  // callbacks sont la seule frontière entre le monolithe et `app/review/*` :
  // le client Supabase et le jeton restent ici, les écrans sont dehors.

  const reviewSessions = useMemo<ReviewSession[]>(
    () => selectedFolderSessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      duration: session.duration,
      audioRef: session.audioRef ?? null,
      transcript: session.transcript,
    })),
    [selectedFolderSessions],
  );

  /**
   * URL signée du fichier audio. Le bucket `session-audio` est PRIVÉ : c'est le
   * client du navigateur, porteur de la session de l'utilisatrice, qui demande
   * la signature — la politique `session_audio_select_own_folder` décide, comme
   * pour n'importe quelle lecture. Aucune route serveur nouvelle, aucun secret
   * exposé, aucun élargissement d'accès.
   */
  const createReviewSignedUrl = useCallback(async (audioRef: string, expiresIn: number) => {
    const { data, error } = await supabase.storage.from("session-audio").createSignedUrl(audioRef, expiresIn);
    if (error) return null;
    return data?.signedUrl ?? null;
  }, [supabase]);

  const reviewAudio = useReviewAudio({ sessions: reviewSessions, createSignedUrl: createReviewSignedUrl, scopeKey: currentUser?.id ?? "" });
  const folderConversationViewport = useFolderConversationViewport();
  const folderProcessingOffset = useFolderProcessingOffset();
  const folderIdentityOffset = useFolderIdentityOffset();
  const folderConversation = selectedFolderSessions.find((session) => session.id === reviewAudio.activeSessionId) ?? null;
  const folderConversationDetailOpen = Boolean(folderConversation && conversationDetailSessionId === folderConversation.id);
  const folderConversationProcessing = Boolean(folderConversation && (processingSessionIds.has(folderConversation.id) || etatsReprise.get(folderConversation.id)?.etat === "en-traitement"));

  const folderBrief = briefSession && isTripBriefSummary(briefSession.summary) ? briefSession.summary : null;

  // ── RÉCAP EN PROSE (lot W6b) ──────────────────────────────────────────────
  //
  // Le générateur et la route `POST /api/notes` sont écrits en parallèle par un
  // autre agent. Cet écran est donc développé contre le TYPE (`NotesAgent`), et
  // il doit tenir les trois situations que cette parallélisation implique :
  // l'attente, l'échec (route absente incluse), et « pas encore demandé ».
  //
  // L'état suit le dossier (ou la conversation non classée) et survit au
  // changement d'onglet. Une note de session ne devient jamais une note de dossier.
  const activeReviewFolderKey = isUnfiledFolder ? (selectedUnfiledSession ? `conversation:${selectedUnfiledSession.id}` : "") : selectedFolder?.key ?? selectedFolderKey;
  const folderNotesSignature = useMemo(() => JSON.stringify({
    sessions: selectedFolderSessions.map((session) => session.id),
    brief: folderBrief,
  }), [folderBrief, selectedFolderSessions]);
  const briefNeedsRefresh = Boolean(activeReviewFolderKey && notesSignatureByFolder[activeReviewFolderKey]
    && notesSignatureByFolder[activeReviewFolderKey] !== folderNotesSignature);

  const reviewNotes = useMemo<ReviewNotesState>(() => {
    if (!briefSession) return { state: "idle" };
    const requested = notesByScope[activeReviewFolderKey];
    if (requested) return requested.state === "ready" && briefNeedsRefresh ? { ...requested, stale: true } : requested;
    // A saved single-conversation recap never claims to describe a larger folder.
    if (selectedFolderSessions.length === 1 && briefSession.notes) return { state: "ready", notes: briefSession.notes, stale: briefNeedsRefresh };
    return { state: "idle", stale: briefNeedsRefresh };
  }, [activeReviewFolderKey, briefNeedsRefresh, briefSession, notesByScope, selectedFolderSessions.length]);

  /**
   * Rédige le récap, sur DEMANDE EXPLICITE (loi 1 + parité avec les passes :
   * rien ne s'exécute tout seul). La route est appelée avec le jeton de
   * l'agente ; le brief est relu côté serveur sous scope propriétaire, comme
   * `/api/pass` — on ne renvoie pas le brief depuis le navigateur.
   *
   * Tolérance de contrat assumée : on accepte le récap sous `notes`, `recap`,
   * `resultat` ou à la racine de la réponse, et `parseNotesAgent` tranche. C'est
   * le prix d'un développement en parallèle, et c'est moins cher qu'un écran
   * bloqué sur un nom de clé.
   */
  const generateFolderNotes = useCallback(async () => {
    const sessionId = briefSession?.id;
    const scopeKey = activeReviewFolderKey;
    if (!sessionId || !scopeKey) return;
    const generation = persistGenerationRef.current;
    const requestKey = `${generation}:${scopeKey}`;
    if (notesRequestsRef.current.has(requestKey)) return;
    const token = {};
    notesRequestsRef.current.set(requestKey, token);
    const isCurrent = () => generation === persistGenerationRef.current && notesRequestsRef.current.get(requestKey) === token;
    const signature = folderNotesSignature;
    const expectedSessionIds = reviewSessions.map((session) => session.id);
    const sourceScope = isUnfiledFolder ? "session" : "dossier";
    setNotesByScope((current) => ({ ...current, [scopeKey]: { state: "loading" } }));

    const fail = (message: string) => {
      if (isCurrent()) setNotesByScope((current) => ({ ...current, [scopeKey]: { state: "error", message } }));
    };
    try {
      const { data } = await supabase.auth.getSession();
      if (!isCurrent()) return;
      const accessToken = data.session?.access_token;
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify(isUnfiledFolder ? { sessionId } : { folderKey: scopeKey }),
      });
      const raw = await response.text();
      if (!isCurrent()) return;
      let payload: Record<string, unknown> | null = null;
      try { payload = raw ? JSON.parse(raw) as Record<string, unknown> : null; } catch { /* The safe error state also handles non-JSON failures. */ }
      if (!response.ok) {
        fail(localize("L’aperçu n’a pas pu être préparé. Réessayez.", "The overview could not be prepared. Try again."));
        return;
      }
      const notes = parseNotesAgent(payload?.notes) ?? parseNotesAgent(payload?.recap) ?? parseNotesAgent(payload?.resultat) ?? parseNotesAgent(payload);
      if (!notes) {
        fail(language === "fr" ? "L’aperçu reçu est inutilisable." : "The returned overview could not be read.");
        return;
      }
      const complete = notesSourceCoversScope(payload?.source, expectedSessionIds, sourceScope);
      setNotesByScope((current) => ({ ...current, [scopeKey]: { state: "ready", notes, stale: !complete } }));
      if (complete) setNotesSignatureByFolder((current) => ({ ...current, [scopeKey]: signature }));
    } catch  {
      fail(localize("L’aperçu n’a pas pu être préparé. Réessayez.", "The overview could not be prepared. Try again."));
    } finally {
      if (notesRequestsRef.current.get(requestKey) === token) notesRequestsRef.current.delete(requestKey);
    }
  }, [activeReviewFolderKey, briefSession?.id, folderNotesSignature, isUnfiledFolder, language, reviewSessions, supabase, localize]);

  /**
   * L'agent du DOSSIER : même route, même moteur de recherche que le fil live,
   * mais avec une portée dossier explicite : le serveur relit les échanges
   * possédés du même client et voyage. Le brief fusionné complète ce contexte.
   */
  const askFolderAgent = useCallback(async (messages: NudgeMessage[]) => {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    const response = await fetch("/api/nudge-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        messages,
        brief: folderBrief,
        session_id: recapSession?.id,
        client_id: selectedFolder?.clientId || undefined,
        contextScope: isUnfiledFolder ? "session" : "folder",
      }),
    });
    const payload = (await response.json()) as { reply?: string; error?: string };
    if (!response.ok) throw new Error(localize("L’assistant n’a pas pu répondre. Réessayez.", "The assistant could not respond. Try again."));
    return payload.reply ?? payload.error ?? "";
  }, [folderBrief, isUnfiledFolder, recapSession?.id, selectedFolder?.clientId, supabase, localize]);

  const assignmentFolders = useMemo(() => {
    const query = assignmentFolderSearch.trim().toLowerCase();
    return clientFolders
      .filter((folder) => folder.key !== UNFILED_FOLDER_KEY && Boolean(folder.clientId && folder.tripId))
      .filter((folder) => !query || [folder.tripTitle, folder.clientName, folder.clientEmail].some((value) => value.toLowerCase().includes(query)))
      .sort((a, b) => a.clientName.localeCompare(b.clientName) || a.tripTitle.localeCompare(b.tripTitle));
  }, [assignmentFolderSearch, clientFolders]);

  const assignmentSession = useMemo(
    () => sessions.find((session) => session.id === assignmentSessionId) ?? null,
    [assignmentSessionId, sessions],
  );

  const filteredFolders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matching = clientFolders.filter((folder) => folder.key !== UNFILED_FOLDER_KEY && (!query || [folder.tripTitle, folder.clientName, folder.clientEmail].some((value) => value.toLowerCase().includes(query))));
    return sortFolders(matching, folderSort, language);
  }, [clientFolders, folderSort, language, searchQuery]);

  const recentFolders = useMemo(() => clientFolders.filter((folder) => folder.key !== UNFILED_FOLDER_KEY).slice(0, 4), [clientFolders]);
  const researchOwnerId = currentUser?.id ?? "";
  const discoveryAccessToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id === researchOwnerId ? data.session.access_token : null;
  }, [researchOwnerId, supabase]);
  const dailyFeed = useDiscoveryFeed({ ownerId: researchOwnerId, enabled: Boolean(isAuthenticated && remoteWorkspaceLoaded && researchOwnerId), language, getAccessToken: discoveryAccessToken });
  const discoveryEntries = useMemo(() => {
    const shared = manualResearchEntries(mergeResearchHistory(dailyFeed.data?.items ?? [], researchHistory.ownerId === researchOwnerId ? researchHistory.items : [], 64), language);
    return [...shared, ...buildDiscoveryEntries(sessions, language).filter((entry) => entry.kind === "flight" || entry.kind === "hotel")]
      .sort((a, b) => (Date.parse(b.observedAt ?? "") || 0) - (Date.parse(a.observedAt ?? "") || 0));
  }, [dailyFeed.data?.items, sessions, language, researchHistory, researchOwnerId]);
  const recordResearch = useCallback((result: ProductSearchResult) => {
    if (result.status !== "ready" || !researchOwnerId || workspaceLoadedForUserRef.current !== researchOwnerId) return;
    setResearchHistory((previous) => ({
      ownerId: researchOwnerId,
      items: mergeResearchHistory(previous.ownerId === researchOwnerId ? previous.items : [], result.items),
    }));
  }, [researchOwnerId]);
  const launchResearch = useCallback((kind: "flights" | "hotels", offer?: DiscoveryEntry) => {
    if (!researchOwnerId) return;
    setDiscoveryLaunch({ ownerId: researchOwnerId, id: ++discoveryLaunchSequence.current, kind, offer });
    setSelectedFolderKey("");
    setSelectedSessionId("");
    setConversationDetailSessionId("");
    setView("explore");
  }, [researchOwnerId]);
  const openResearchOffer = useCallback((offer: DiscoveryEntry) => {
    if (offer.kind === "flight" || offer.kind === "hotel") launchResearch(offer.kind === "flight" ? "flights" : "hotels", offer);
  }, [launchResearch]);
  const searchProducts = useCallback(async (input: ProductSearchRequest, signal: AbortSignal): Promise<ProductSearchResult> => {
    const generation = persistGenerationRef.current;
    const { data } = await supabase.auth.getSession();
    if (signal.aborted || generation !== persistGenerationRef.current) throw new DOMException("Search cancelled", "AbortError");
    const accessToken = data.session?.access_token;
    if (!accessToken || data.session?.user.id !== researchOwnerId) throw new Error(input.language === "fr" ? "Reconnectez-vous pour lancer une recherche." : "Sign in again to search.");
    const response = await fetch("/api/product-search", {
      method: "POST", signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(input),
    });
    let payload: Partial<ProductSearchResult> & { error?: string };
    try { payload = await response.json(); } catch { throw new Error(input.language === "fr" ? "Les résultats n’ont pas pu être chargés. Réessayez." : "Results could not be loaded. Try again."); }
    if (signal.aborted || generation !== persistGenerationRef.current) throw new DOMException("Search cancelled", "AbortError");
    if (!response.ok) throw new Error(payload.error || (input.language === "fr" ? "La recherche est indisponible. Réessayez." : "Search is unavailable. Try again."));
    if ((payload.status !== "ready" && payload.status !== "needs-details") || !Array.isArray(payload.items) || !Array.isArray(payload.clarifications) || !Array.isArray(payload.warnings)) {
      throw new Error(input.language === "fr" ? "Les résultats n’ont pas pu être chargés. Réessayez." : "Results could not be loaded. Try again.");
    }
    return payload as ProductSearchResult;
  }, [researchOwnerId, supabase]);
  // Ce filtre `clientId && tripId` était la seconde moitié du cul-de-sac : une
  // conversation « à classer plus tard » n'entrait même pas dans la liste, donc
  // aucune table de correspondance ne pouvait la rattraper. Toute conversation a
  // maintenant un dossier — un vrai, ou le bac « Non classées ».
  const recentConversations = useMemo(
    () => [...sessions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
    [sessions],
  );

  const openSession = useCallback((sessionId: string, nextTab: ReviewTab = "internal") => {
    const target = sessions.find((session) => session.id === sessionId);
    if (!target) return;
    // `folderKeyForSession` retombe sur un couple de NOMS quand les liens
    // manquent : la clé ne correspondait alors à aucun dossier, `selectedFolder`
    // valait null, et le review — gardé par `view === "review" && selectedFolder`
    // — rendait une PAGE BLANCHE. On prend le dossier réel, bac inclus.
    const folder = folderBySessionId.get(sessionId);
    setSelectedFolderKey(folder?.key ?? folderKeyForSession(target));
    setSelectedSessionId(sessionId);
    reviewAudio.selectSession(sessionId);
    setConversationDetailSessionId(folder?.key === UNFILED_FOLDER_KEY || nextTab === "transcript" ? sessionId : "");
    setReviewTab(folder?.key === UNFILED_FOLDER_KEY ? "transcript" : nextTab);
    setView("review");
  }, [folderBySessionId, reviewAudio, sessions]);

  const overviewAudio = useMemo(() => ({ ...reviewAudio, seek: (ms: number, sessionId?: string | null) => {
    const target = sessionId ?? reviewAudio.activeSessionId;
    if (!target) return;
    openSession(target, "transcript");
    reviewAudio.seek(ms, target);
  } }), [openSession, reviewAudio]);

  const openFolder = useCallback((folderKey: string) => {
    const folder = clientFolders.find((item) => item.key === folderKey);
    if (!folder) return;
    setSelectedFolderKey(folder.key);
    setSelectedSessionId("");
    setConversationDetailSessionId("");
    // Le bac « Non classées » n'a pas de brief de dossier : on ouvre donc sur la
    // liste des conversations, seul écran qui ait du sens à ce niveau.
    setReviewTab(folder.key === UNFILED_FOLDER_KEY ? "transcript" : "internal");
    setView("review");
  }, [clientFolders]);

  const openWorkspaceSection = useCallback((nextView: "dashboard" | "clients" | "explore") => {
    setSelectedFolderKey("");
    setSelectedSessionId("");
    setConversationDetailSessionId("");
    setView(nextView);
  }, []);

  const conversationDeletionBlocked = useCallback((session: TravelSession) => (
    processingSessionIds.has(session.id) || resumingSessionId === session.id
    || generatingRecapSessionIds.has(session.id)
    || !canDeleteWorkspaceSession(session, maintenant)
  ), [generatingRecapSessionIds, maintenant, processingSessionIds, resumingSessionId]);

  const requestConversationDeletion = useCallback((id: string) => {
    const session = sessions.find((item) => item.id === id);
    if (!currentUser || !session || deletionOperationRef.current || activeLiveSessionRef.current?.id === id || conversationDeletionBlocked(session)) return;
    setDeletionIntent({ type: "conversation", title: conversationLabel(id, language, conversationSequence), sessions: [session], ownerId: currentUser.id });
  }, [conversationDeletionBlocked, conversationSequence, currentUser, language, sessions]);

  const requestUnassignedDeletion = useCallback(() => {
    if (!currentUser || deletionOperationRef.current || !unfiledSessions.length) return;
    if (unfiledSessions.some(conversationDeletionBlocked)) {
      showToast(language === "fr" ? "Attendez la fin du traitement avant de tout supprimer." : "Wait for processing to finish before deleting all recordings.", "warning");
      return;
    }
    setDeletionIntent({ type: "conversations", sessions: [...unfiledSessions], ownerId: currentUser.id });
  }, [conversationDeletionBlocked, currentUser, language, showToast, unfiledSessions]);

  const requestFolderDeletion = useCallback(() => {
    if (!currentUser || !selectedFolder || isUnfiledFolder || deletionOperationRef.current) return;
    const active = activeLiveSessionRef.current;
    if (selectedFolder.sessions.some(conversationDeletionBlocked) || (active?.setup.clientId === selectedFolder.clientId && (active.setup.tripId || null) === (selectedFolder.tripId || null))) {
      showToast(language === "fr" ? "Terminez la conversation ou attendez la fin du traitement avant de supprimer ce dossier." : "Finish the conversation or wait for processing before deleting this folder.", "warning");
      return;
    }
    setDeletionIntent({ type: "folder", title: selectedFolder.tripTitle, folder: selectedFolder, ownerId: currentUser.id });
  }, [conversationDeletionBlocked, currentUser, isUnfiledFolder, language, selectedFolder, showToast]);

  const deletionViewRef = useRef({ view, folderKey: selectedFolderKey, sessionId: selectedSessionId, detailSessionId: conversationDetailSessionId, assignmentSessionId, audioSessionId: reviewAudio.activeSessionId, selectAudio: reviewAudio.selectSession });
  useLayoutEffect(() => {
    deletionViewRef.current = { view, folderKey: selectedFolderKey, sessionId: selectedSessionId, detailSessionId: conversationDetailSessionId, assignmentSessionId, audioSessionId: reviewAudio.activeSessionId, selectAudio: reviewAudio.selectSession };
  }, [assignmentSessionId, conversationDetailSessionId, reviewAudio.activeSessionId, reviewAudio.selectSession, selectedFolderKey, selectedSessionId, view]);

  const deletionFocusRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const previous = deletionFocusRef.current;
    deletionFocusRef.current = null;
    if (!previous || previous.isConnected || (document.activeElement !== document.body && document.activeElement !== previous)) return;
    const target = document.querySelector<HTMLElement>(".product-shell main h1, .product-shell main");
    if (!target) return;
    const hadTabIndex = target.hasAttribute("tabindex");
    if (!hadTabIndex) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    if (!hadTabIndex) target.removeAttribute("tabindex");
  }, [sessions, trips, view]);

  const confirmWorkspaceDeletion = useCallback(async (retryIntent?: WorkspaceDeletionIntent, retryToastId?: ToastMessage["id"]): Promise<void> => {
    const intent = retryIntent ?? deletionIntent;
    const latest = persistLatestRef.current;
    if (!intent || intent.ownerId !== currentUser?.id || intent.ownerId !== authIdentityRef.current || (latest && intent.ownerId !== latest.userId) || deletionOperationRef.current) return;
    const token = {};
    const generation = persistGenerationRef.current;
    deletionOperationRef.current = token;
    const isCurrent = () => authMountedRef.current && deletionOperationRef.current === token && generation === persistGenerationRef.current && authIdentityRef.current === intent.ownerId;
    setDeletionBusy(true);
    setDeletionIntent(null);
    const toastId = showToast(intent.type === "folder" ? (language === "fr" ? "Suppression du dossier et de ses conversations…" : "Deleting the folder and its conversations…") : (language === "fr" ? "Suppression des conversations…" : "Deleting conversations…"), "neutral", { id: retryToastId, pending: true, dismissible: false });
    const retryAction = { label: language === "fr" ? "Réessayer" : "Retry", onClick: () => { void deletionRetryRunnerRef.current?.(intent, toastId); } };
    // Pause synchronously, then await the last network write. New renders may
    // update persistLatestRef while blocked; those edits resume after deletion.
    if (persistRetryTimerRef.current !== null) window.clearTimeout(persistRetryTimerRef.current);
    persistRetryTimerRef.current = null;

    const applyCommitted = (result: WorkspaceDeletionResult) => {
      if (!isCurrent()) return;
      const removed = new Set([...result.deletedSessionIds, ...result.missingSessionIds]);
      const tripId = result.deletedTripId;
      const clientId = result.deletedClientId;
      if (!removed.size && !tripId && !clientId) return;
      removed.forEach((id) => {
        deletedWorkspaceIdsRef.current.sessions.add(id);
        remoteIdsRef.current.sessions.delete(id);
        persistedRowsRef.current.sessions.delete(id);
        persistedSourcesRef.current.sessions.delete(id);
        persistedBookmarksRef.current.delete(id);
      });
      if (tripId) {
        deletedWorkspaceIdsRef.current.trips.add(tripId);
        remoteIdsRef.current.trips.delete(tripId);
        persistedRowsRef.current.trips.delete(tripId);
        persistedSourcesRef.current.trips.delete(tripId);
      }
      if (clientId) {
        deletedWorkspaceIdsRef.current.clients.add(clientId);
        remoteIdsRef.current.clients.delete(clientId);
        persistedRowsRef.current.clients.delete(clientId);
        persistedSourcesRef.current.clients.delete(clientId);
      }
      deletionFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const transformSessions = (items: TravelSession[]) => items.filter((item) => !removed.has(item.id));
      const snapshot = persistLatestRef.current;
      if (snapshot) {
        const updatedSessions = transformSessions(snapshot.sessions);
        persistLatestRef.current = { ...snapshot, sessions: updatedSessions, trips: snapshot.trips.filter((item) => item.id !== tripId), clients: snapshot.clients.filter((item) => item.id !== clientId) };
      }
      setSessions(transformSessions);
      if (tripId) setTrips((items) => items.filter((item) => item.id !== tripId));
      if (clientId) setClients((items) => items.filter((item) => item.id !== clientId));
      const affectedScopes = new Set(clientFolders.filter((folder) => folder.sessions.some((item) => removed.has(item.id))).map((folder) => folder.key));
      if (intent.type === "folder") affectedScopes.add(intent.folder.key);
      removed.forEach((id) => affectedScopes.add(`conversation:${id}`));
      affectedScopes.forEach((scope) => notesRequestsRef.current.delete(`${generation}:${scope}`));
      setNotesByScope((current) => ({ ...current, ...Object.fromEntries([...affectedScopes].map((scope) => [scope, { state: "idle", stale: true }])) }));
      const folderRemoved = intent.type === "folder" && (tripId === intent.folder.tripId || (intent.folder.tripId == null && !(persistLatestRef.current?.sessions ?? []).some((item) => item.clientId === intent.folder.clientId && !item.tripId)));
      const currentView = deletionViewRef.current;
      const effects = deletionViewEffects(currentView, removed, folderRemoved && intent.type === "folder" ? intent.folder.key : null);
      if (effects.clearSession) setSelectedSessionId("");
      if (effects.clearDetail) setConversationDetailSessionId("");
      if (effects.clearAudio) currentView.selectAudio("");
      if (effects.clearAssignment) setAssignmentSessionId("");
      if (effects.leaveFolder) { setSelectedFolderKey(""); setView("clients"); }
    };

    try {
      if (persistRunningRef.current) await new Promise<void>((resolve) => persistIdleWaitersRef.current.add(resolve));
      if (!isCurrent()) return;
      const current = persistLatestRef.current?.sessions ?? [];
      const targets = intent.type === "folder" ? current.filter((item) => item.clientId === intent.folder.clientId && (item.tripId ?? null) === (intent.folder.tripId ?? null)) : current.filter((item) => intent.sessions.some((captured) => captured.id === item.id));
      if (targets.some((item) => conversationDeletionBlocked(item) || activeLiveSessionRef.current?.id === item.id)) throw new Error("busy");
      const active = activeLiveSessionRef.current;
      if (intent.type === "folder" && active?.setup.clientId === intent.folder.clientId && (active.setup.tripId || null) === (intent.folder.tripId || null)) throw new Error("busy");
      const expectedPassSnapshots = intent.type === "folder" ? undefined
        : await relocateFolderJourneyBeforeSessionDeletion(supabase, intent.ownerId, intent.sessions.map((item) => item.id), isCurrent, true);
      if (!isCurrent()) return;
      const result = intent.type === "folder"
        ? await deleteFolderFromApi({ ownerId: intent.ownerId, clientId: intent.folder.clientId, tripId: intent.folder.tripId ?? null, sessionIds: intent.folder.sessions.map((item) => item.id), language, getAccessSession: getJourneyAccessSession, isCurrent })
        : await deleteOwnedSessions(supabase, { ownerId: intent.ownerId, sessionIds: intent.sessions.map((item) => item.id), expectedPassSnapshots, expectedAssignments: intent.sessions.map((item) => ({ sessionId: item.id, clientId: item.clientId ?? null, tripId: item.tripId ?? null })) }, isCurrent);
      if (!isCurrent()) return;
      applyCommitted(result);
      if (result.audioCleanupFailures.length) {
        showToast(language === "fr" ? "Les conversations ont été supprimées. Réessayez pour terminer le nettoyage des fichiers audio." : "The conversations were deleted. Retry to finish cleaning up audio files.", "error", { id: toastId, action: retryAction });
        return;
      }
      showToast(result.skippedSessionIds.length
        ? (language === "fr" ? "Les conversations actives, modifiées ou reclassées ont été conservées." : "Active, changed or newly filed conversations were kept.")
        : intent.type === "folder"
          ? (language === "fr" ? "Dossier et conversations supprimés." : "Folder and conversations deleted.")
          : (language === "fr" ? "Conversations supprimées." : "Conversations deleted."), result.skippedSessionIds.length ? "warning" : "success", { id: toastId });
    } catch (error) {
      if (!isCurrent()) return;
      if (error instanceof WorkspaceDeletionError) applyCommitted(error.result);
      const refreshAction = { label: language === "fr" ? "Actualiser les dossiers" : "Refresh folders", onClick: () => {
        void (async () => {
          if (!authMountedRef.current || generation !== persistGenerationRef.current || authIdentityRef.current !== intent.ownerId || deletionOperationRef.current) return;
          if (activeLiveSessionRef.current) { showToast(language === "fr" ? "Terminez la conversation avant d’actualiser les dossiers." : "Finish the conversation before refreshing folders.", "warning"); return; }
          persistRequestedRef.current = true;
          await persistWorkspaceNow();
          if (persistRunningRef.current) await new Promise<void>((resolve) => persistIdleWaitersRef.current.add(resolve));
          if (!authMountedRef.current || generation !== persistGenerationRef.current || authIdentityRef.current !== intent.ownerId || persistRetryTimerRef.current !== null) return;
          if (deletionOperationRef.current) return;
          const refreshToken = {};
          const snapshot = persistLatestRef.current;
          deletionOperationRef.current = refreshToken;
          setDeletionBusy(true);
          showToast(language === "fr" ? "Actualisation des dossiers…" : "Refreshing folders…", "neutral", { id: toastId, pending: true, dismissible: false });
          try {
            const refreshed = await loadWorkspaceFromSupabase(() => deletionOperationRef.current === refreshToken && persistLatestRef.current === snapshot && !activeLiveSessionRef.current, true);
            if (!authMountedRef.current || authIdentityRef.current !== intent.ownerId || deletionOperationRef.current !== refreshToken) return;
            if (refreshed && generation + 1 === persistGenerationRef.current) {
              dismissToast(toastId);
              showToast(language === "fr" ? "Dossiers actualisés. Vérifiez le dossier avant de confirmer à nouveau sa suppression." : "Folders refreshed. Review the folder before confirming its deletion again.", "info");
            } else if (generation === persistGenerationRef.current && persistLatestRef.current !== snapshot) {
              showToast(language === "fr" ? "Vos modifications sont conservées. Actualisez les dossiers une fois l’enregistrement terminé." : "Your changes were kept. Refresh folders once saving is complete.", "warning", { id: toastId, action: refreshAction });
            } else if (generation === persistGenerationRef.current) {
              showToast(language === "fr" ? "Les dossiers n’ont pas pu être actualisés. Réessayez." : "Folders could not be refreshed. Try again.", "error", { id: toastId, action: refreshAction });
            }
          } finally {
            if (deletionOperationRef.current === refreshToken) {
              deletionOperationRef.current = null;
              setDeletionBusy(false);
              persistWorkspaceRunnerRef.current();
            }
          }
        })().catch(() => { if (authMountedRef.current && generation === persistGenerationRef.current && authIdentityRef.current === intent.ownerId) showToast(language === "fr" ? "Les dossiers n’ont pas pu être actualisés." : "Folders could not be refreshed.", "error"); });
      } };
      const code = error instanceof FolderDeleteClientError ? error.code : null;
      const action = code === "scope_changed" || code === "not_found" || code === "invalid_response" ? refreshAction
        : code === "shared_folder" || code === "too_large" || code === "invalid_request" || code === "unauthenticated" ? undefined : retryAction;
      showToast(error instanceof Error && error.message === "busy"
        ? (language === "fr" ? "Terminez la conversation ou attendez la fin du traitement avant de supprimer." : "Finish the conversation or wait for processing before deleting.")
        : intent.type === "folder" && error instanceof WorkspaceDeletionError ? error.message
        : (language === "fr" ? "La suppression n’a pas pu être terminée. Réessayez pour la terminer." : "Deletion could not be completed. Retry to finish it."), "error", { id: toastId, action });
    } finally {
      if (deletionOperationRef.current === token) {
        deletionOperationRef.current = null;
        setDeletionBusy(false);
        persistRequestedRef.current = true;
        persistWorkspaceRunnerRef.current();
      }
    }
  }, [clientFolders, conversationDeletionBlocked, currentUser?.id, deletionIntent, dismissToast, getJourneyAccessSession, language, loadWorkspaceFromSupabase, persistWorkspaceNow, showToast, supabase]);
  useEffect(() => {
    deletionRetryRunnerRef.current = confirmWorkspaceDeletion;
    return () => { if (deletionRetryRunnerRef.current === confirmWorkspaceDeletion) deletionRetryRunnerRef.current = null; };
  }, [confirmWorkspaceDeletion]);

  const changeAuthMode = async (mode: AuthMode) => {
    if (authBusyRef.current) return;
    const operation = ++authOperationRef.current;
    if (authRecoveryRef.current && mode !== "update-password") {
      authBusyRef.current = true;
      setAuthLoading(true);
      try {
        const { error } = await supabase.auth.signOut({ scope: "local" });
        if (!authMountedRef.current || operation !== authOperationRef.current) return;
        if (error) {
          setAuthError(authErrorMessage(error, language));
          return;
        }
        authRecoveryRef.current = false;
        authIdentityRef.current = null;
        setCurrentUser(null);
        setIsAuthenticated(false);
        clearPersistWorkspace();
        window.history.replaceState(null, "", cleanAuthReturnUrl(new URL(window.location.href), false).href);
      } catch {
        if (authMountedRef.current && operation === authOperationRef.current) setAuthError(authErrorMessage(null, language));
        return;
      } finally {
        if (authMountedRef.current && operation === authOperationRef.current) {
          authBusyRef.current = false;
          setAuthLoading(false);
        }
      }
    }
    if (!authMountedRef.current || operation !== authOperationRef.current) return;
    setAuthMode(mode);
    authReturnModeRef.current = mode;
    setAuthError("");
    setAuthNotice("");
    setPassword("");
    setConfirmPassword("");
  };

  const openAuthScreen = async (screen: "landing" | "login", mode: AuthMode = "sign-in") => {
    if (authBusyRef.current) return;
    await changeAuthMode(mode);
    if (!authMountedRef.current || authRecoveryRef.current) return;
    authReturnErrorRef.current = false;
    setAuthView(screen);
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (authBusyRef.current) return;
    if (authMode !== "update-password" && !email.trim()) return;
    if (authMode !== "reset-request" && !password) return;
    if (authMode === "sign-up" || authMode === "update-password") {
      const validation = passwordValidationError(password, confirmPassword, authMode);
      if (validation) {
        setAuthError(validation === "short"
          ? language === "fr" ? "Utilisez au moins 8 caractères." : "Use at least 8 characters."
          : language === "fr" ? "Les mots de passe ne correspondent pas." : "The passwords do not match.");
        return;
      }
    }
    authBusyRef.current = true;
    const operation = ++authOperationRef.current;
    const isCurrent = () => authMountedRef.current && operation === authOperationRef.current;
    setAuthLoading(true);
    setAuthError("");
    setAuthNotice("");
    try {
      if (authMode === "reset-request") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: authCallbackUrl(window.location.origin, true),
        });
        if (!isCurrent()) return;
        if (error) setAuthError(authErrorMessage(error, language));
        else setAuthNotice(language === "fr"
          ? "Si un compte utilise ce courriel, vous recevrez un lien pour réinitialiser votre mot de passe."
          : "If an account uses this email, you will receive a link to reset your password.");
        return;
      }
      if (authMode === "update-password") {
        const recoveryUserId = currentUser?.id;
        if (!authRecoveryRef.current || !recoveryUserId || authIdentityRef.current !== recoveryUserId) {
          setAuthError(language === "fr" ? "Demandez un nouveau lien pour réinitialiser votre mot de passe." : "Request a new link to reset your password.");
          return;
        }
        const { data, error } = await supabase.auth.updateUser({ password });
        if (!isCurrent() || authIdentityRef.current !== recoveryUserId) return;
        if (error || !data.user) {
          setAuthError(authErrorMessage(error, language));
          return;
        }
        authRecoveryRef.current = false;
        window.history.replaceState(null, "", cleanAuthReturnUrl(new URL(window.location.href), false).href);
        setPassword("");
        setConfirmPassword("");
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        setAuthView("landing");
        setAuthMode("sign-in");
        await loadWorkspaceOnce(data.user);
        if (!isCurrent() || authIdentityRef.current !== recoveryUserId) return;
        await loadUserProfile(data.user);
        showToast(language === "fr" ? "Mot de passe mis à jour." : "Password updated.");
        return;
      }
      const result = await authenticateWithEmail(supabase.auth, authMode, { email: email.trim(), password }, language, authCallbackUrl(window.location.origin));
      if (!isCurrent()) return;
      if (result.error) {
        setAuthError(authErrorMessage(result.error, language));
        return;
      }
      setPassword("");
      setConfirmPassword("");
      if (!result.data.session || !result.data.user) {
        setAuthNotice(language === "fr" ? "Vérifiez votre courriel pour confirmer votre compte, puis connectez-vous." : "Check your email to confirm your account, then sign in.");
        return;
      }
      // The synchronous listener owns subsequent refresh/account changes.
      const user = result.data.user;
      if (authRecoveryRef.current || authIdentityRef.current !== user.id) return;
      authReturnErrorRef.current = false;
      authIdentityRef.current = user.id;
      setCurrentUser(user);
      setIsAuthenticated(true);
      setAuthView("landing");
      await loadWorkspaceOnce(user);
      if (!isCurrent() || authIdentityRef.current !== user.id) return;
      await loadUserProfile(user);
    } catch {
      if (isCurrent()) setAuthError(authErrorMessage(null, language));
    } finally {
      if (isCurrent()) {
        authBusyRef.current = false;
        setAuthLoading(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    if (!googleEnabled || authBusyRef.current || authRecoveryRef.current) return;
    authBusyRef.current = true;
    const operation = ++authOperationRef.current;
    const isCurrent = () => authMountedRef.current && operation === authOperationRef.current;
    setAuthLoading(true);
    setAuthError("");
    setAuthNotice("");
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: authCallbackUrl(window.location.origin), skipBrowserRedirect: true },
      });
      if (!isCurrent()) return;
      if (error || !data.url) {
        setAuthError(authErrorMessage(error, language));
        return;
      }
      window.location.assign(data.url);
    } catch {
      if (isCurrent()) setAuthError(authErrorMessage(null, language));
    } finally {
      if (isCurrent()) {
        authBusyRef.current = false;
        setAuthLoading(false);
      }
    }
  };

  // The preselected consent is a draft. The explicit Start action in the
  // modal confirms it and begins recording; entering the room never does.
  const openSessionSetup = (folderKey?: string) => {
    if (closingCaptureRef.current) {
      showToast(language === "fr" ? "Le micro termine sa sauvegarde. Réessayez dans un instant." : "The microphone is finishing its save. Try again in a moment.", "info");
      return;
    }
    if (view === "recording") return;
    setConversationOrigin({ view, folderKey: selectedFolderKey, sessionId: selectedSessionId, detailSessionId: conversationDetailSessionId, reviewTab });
    setAccountMenuOpen(false);
    const folder = folderKey && folderKey !== UNFILED_FOLDER_KEY ? clientFolders.find((item) => item.key === folderKey) : null;
    const nextSetup: SessionSetup = folder ? {
      ...DEFAULT_SETUP, clientId: folder.clientId, tripId: folder.tripId,
      clientName: folder.clientName, clientEmail: folder.clientEmail,
      tripTitle: folder.tripTitle, mode: "microphone", consent: true,
    } : { ...DEFAULT_SETUP, clientId: "", tripId: "", consent: true };
    cancelNudgeRequest();
    activeLiveSessionRef.current = null;
    setActiveSetup(nextSetup);
    setSetup(nextSetup);
    resetConversationPresentation();
    setNudgeThread([]);
    setNudgeInput("");
    setLiveSuggestions(null);
    liveBriefRef.current = null;
    setLiveBriefRapide(null);
    setLiveBriefLent(null);
    setCaptureMessage("");
    setRecordingState("idle");
    setRailCollapsed(false);
    setView("recording");
    setSessionStartOpen(true);
    if (portfolioDemoEnabled()) {
      // Use the original conversation renderer with an explicit sample session,
      // rather than asking visitors for hardware or creating a fake recording.
      const sample = folder ? sessions.find((session) => session.tripId === folder.tripId) : sessions[0];
      setSessionStartOpen(false);
      if (sample) {
        portfolioSampleSessionRef.current = sample.id;
        const sampleSetup: SessionSetup = {
          clientId: sample.clientId, tripId: sample.tripId, clientName: sample.clientName,
          clientEmail: sample.clientEmail, tripTitle: sample.tripTitle, consent: true, mode: "microphone",
        };
        setActiveSetup(sampleSetup);
        setSetup(sampleSetup);
        setLiveTranscript(sample.transcript);
        transcriptRef.current = sample.transcript;
        const brief = isTripBriefSummary(sample.summary) ? sample.summary : null;
        liveBriefRef.current = brief;
        setLiveBriefLent(brief);
        const cards = sampleConversationCards(new Date(), brief?.lieu.destinations.valeur?.[0] ?? "Greece");
        setLiveSuggestions({ cards, nudges: [], searchesUsed: 0, warnings: [], generatedAt: new Date().toISOString() });
        setBookmarkedConversationCards(sample.bookmarks ?? []);
        setNudgeThread([{
          id: "portfolio-sample-session", from: "nudge",
          text: language === "fr"
            ? "Conversation d’exemple · microphone désactivé. Explorez les offres, les signets ou posez une question sur le budget et les prochaines étapes. Les réponses sont illustratives."
            : "Sample conversation · microphone off. Explore the offers, save a bookmark, or ask about the budget and next steps. Responses are illustrative.",
        }]);
      }
    }
  };

  const returnFromConversation = () => {
    setSessionStartOpen(false);
    // The recorder may already have started before React paints Listening.
    // Cancelling a real capture would delete its safety copy; save it instead.
    if (recorderRef.current || recordingState === "recording" || recordingState === "paused") {
      void saveSession({ returnToOrigin: true });
    } else if (recordingState !== "stopping") {
      cancelActiveSession();
    }
  };

  const conversationBackLabel = conversationOrigin.view === "review"
    ? (conversationOrigin.detailSessionId ? "Conversation" : (language === "fr" ? "Dossier" : "Folder"))
    : conversationOrigin.view === "clients" ? (language === "fr" ? "Dossiers" : "Folders")
    : conversationOrigin.view === "explore" ? (language === "fr" ? "Explorer" : "Explore")
    : conversationOrigin.view === "client-create" ? (language === "fr" ? "Nouveau dossier" : "New folder")
    : (language === "fr" ? "Accueil" : "Home");

  const openSettings = (section: SettingsSection = "settings") => {
    setAccountMenuOpen(false);
    setProfileSettingsError(false);
    setSettingsSection(section);
  };

  const changeLanguage = (next: Language) => {
    if (next !== "fr" && next !== "en") return;
    if (languageToastRef.current !== null) dismissToast(languageToastRef.current);
    languageToastRef.current = null;
    setLanguageSettingsError(false);
    setLanguage(next);
    const ownerId = currentUser?.id;
    if (!ownerId || !isAuthenticated) return;
    const request = { ownerId, value: next, revision: ++profileSettingsRevisionRef.current };
    languageSaveRef.current = request;
    setProfile((current) => current?.id === ownerId ? { ...current, language: next } : current);
    const isCurrent = () => authMountedRef.current && authIdentityRef.current === ownerId && languageSaveRef.current === request;
    void profileSettingsQueueRef.current.write(supabase, ownerId, { language: next }, isCurrent).then(() => {
      if (isCurrent() && languageSaveRef.current === request) {
        profileSettingsRevisionRef.current += 1;
        languageSaveRef.current = null;
        setProfile((current) => current?.id === ownerId ? { ...current, language: next } : current);
      }
    }).catch((error) => {
      if (!isCurrent() || languageSaveRef.current !== request || (error instanceof Error && error.name === "AbortError")) return;
      setLanguageSettingsError(true);
      languageToastRef.current = showToast(next === "fr" ? "La langue a changé sur cet appareil, mais n’a pas pu être enregistrée dans votre profil." : "The language changed on this device but could not be saved to your profile.", "error", { action: { label: next === "fr" ? "Réessayer" : "Retry", onClick: () => changeLanguage(next) } });
    });
  };

  const saveProfileName = async (name: string) => {
    const ownerId = currentUser?.id;
    if (!ownerId || nameSaveRef.current) return;
    const request = {};
    nameSaveRef.current = request;
    profileSettingsRevisionRef.current += 1;
    setProfileSaving(true);
    setProfileSettingsError(false);
    const isCurrent = () => authMountedRef.current && authIdentityRef.current === ownerId && nameSaveRef.current === request;
    try {
      const saved = await profileSettingsQueueRef.current.write(supabase, ownerId, { display_name: name }, isCurrent);
      if (!isCurrent()) return;
      profileSettingsRevisionRef.current += 1;
      setProfile((current) => current?.id === ownerId ? { ...current, display_name: saved.display_name! } : current);
      showToast(localize("Profil enregistré.", "Profile saved."));
    } catch (error) {
      if (isCurrent() && !(error instanceof Error && error.name === "AbortError")) setProfileSettingsError(true);
    } finally {
      if (isCurrent()) { nameSaveRef.current = null; setProfileSaving(false); }
    }
  };

  const openCreateClient = () => {
    setNewClientName("");
    setNewClientEmail("");
    setNewClientPhone("");
    setNewClientTrip("");
    setNewClientNotes("");
    setClientCreateReturnView(view === "clients" ? "clients" : "dashboard");
    setView("client-create");
  };

  const cancelClientCreate = () => {
    setNewClientName("");
    setNewClientEmail("");
    setNewClientPhone("");
    setNewClientTrip("");
    setNewClientNotes("");
    setView(clientCreateReturnView);
  };

  const createClient = () => {
    const name = newClientName.trim();
    const tripTitle = newClientTrip.trim();
    if (!name || !tripTitle) return;
    const now = new Date().toISOString();
    const client: ClientRecord = {
      id: makeId("client"),
      name,
      email: newClientEmail.trim(),
      phone: newClientPhone.trim() || undefined,
      notes: newClientNotes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    const trip = {
      id: makeId("trip"),
      clientId: client.id,
      title: tripTitle,
      status: "active" as const,
      createdAt: now,
      updatedAt: now,
    };
    setClients((current) => [client, ...current]);
    setTrips((current) => [trip, ...current]);
    setSelectedFolderKey(`${client.id}::${trip.id}`);
    setSelectedSessionId("");
    setConversationDetailSessionId("");
    setReviewTab("internal");
    setView("review");
    showToast(language === "fr" ? "Dossier créé" : "Folder created");
  };

  const dismissConversationAssignment = () => {
    setAssignmentSessionId("");
    setAssignmentFolderSearch("");
    setAssignmentCreateOpen(false);
    setAssignmentFolderTitle("");
    setAssignmentClientName("");
    setAssignmentClientEmail("");
    setAssignmentClientPhone("");
    showToast(language === "fr" ? "Conversation sauvegardée" : "Conversation saved");
  };

  const assignConversationToFolder = (folderKey: string) => {
    const conversation = sessions.find((session) => session.id === assignmentSessionId);
    const targetFolder = clientFolders.find((folder) => folder.key === folderKey);
    const targetClient = targetFolder ? clients.find((client) => client.id === targetFolder.clientId) : undefined;
    if (!conversation || !targetFolder || !targetClient) return;
    if (conversation.status === "prete" && isTripBriefSummary(conversation.summary)) updateConciergeProfile(targetClient.id, conversation.summary);
    const now = new Date().toISOString();
    const nextSessions = sessions.map((session) =>
      session.id === conversation.id
        ? {
            ...session,
            clientId: targetClient.id,
            tripId: targetFolder.tripId,
            clientName: targetClient.name,
            clientEmail: targetClient.email,
            tripTitle: targetFolder.tripTitle,
          }
        : session,
    );
    setSessions(nextSessions);
    setClients((current) => current.map((client) => client.id === targetClient.id ? { ...client, updatedAt: now } : client));
    if (targetFolder.tripId) setTrips((current) => current.map((trip) => trip.id === targetFolder.tripId ? { ...trip, updatedAt: now } : trip));
    setSelectedFolderKey(targetFolder.key);
    setSelectedSessionId(conversation.id);
    setConversationDetailSessionId("");
    setReviewTab("internal");
    setAssignmentSessionId("");
    setAssignmentCreateOpen(false);
    setView("review");
    window.requestAnimationFrame(() => reviewHeadingRef.current?.focus({ preventScroll: true }));
    showToast(language === "fr" ? "Conversation classée" : "Conversation filed");
  };

  const createFolderFromConversation = () => {
    const conversation = sessions.find((session) => session.id === assignmentSessionId);
    const folderTitle = assignmentFolderTitle.trim() || conversation?.tripTitle.trim();
    const clientName = assignmentClientName.trim() || conversation?.clientName.trim();
    if (!conversation || !folderTitle || !clientName) return;
    const now = new Date().toISOString();
    const client = {
      id: makeId("client"),
      name: clientName,
      email: assignmentClientEmail.trim(),
      phone: assignmentClientPhone.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    } satisfies ClientRecord;
    const trip = {
      id: makeId("trip"),
      clientId: client.id,
      title: folderTitle,
      status: "active" as const,
      createdAt: now,
      updatedAt: now,
    } satisfies TripRecord;
    const nextSessions = sessions.map((session) => session.id === conversation.id ? {
      ...session,
      clientId: client.id,
      tripId: trip.id,
      clientName: client.name,
      clientEmail: client.email,
      tripTitle: trip.title,
    } : session);
    setClients((current) => [client, ...current]);
    setTrips((current) => [trip, ...current]);
    setSessions(nextSessions);
    setSelectedFolderKey(`${client.id}::${trip.id}`);
    setSelectedSessionId(conversation.id);
    setConversationDetailSessionId("");
    setReviewTab("internal");
    setConversationDetailSessionId("");
    const assignedConversation = sessions.find((item) => item.id === assignmentSessionId);
    if (assignedConversation?.status === "prete" && isTripBriefSummary(assignedConversation.summary)) {
      updateConciergeProfile(client.id, assignedConversation.summary);
    }
    setAssignmentSessionId("");
    setAssignmentCreateOpen(false);
    setView("review");
    window.requestAnimationFrame(() => reviewHeadingRef.current?.focus({ preventScroll: true }));
    showToast(language === "fr" ? "Dossier créé" : "Folder created");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearPersistWorkspace();
    setCurrentUser(null);
    setProfile(null);
    setRemoteWorkspaceLoaded(false);
    setIsAuthenticated(false);
    setAuthView("landing");
    setView("dashboard");
    setSelectedFolderKey("");
    setSelectedSessionId("");
    setConversationDetailSessionId("");
    setAssignmentSessionId("");
    setAccountMenuOpen(false);
  };

  const generateClientSummary = async () => {
    const ownerId = currentUser?.id;
    if (!recapSession || !ownerId || recapGenerationRequestsRef.current.has(recapSession.id)) return;
    if (!isTripBriefSummary(recapSession.summary)) {
      showToast((language === "fr" ? "Aucun brief structuré n’est disponible pour ce récap." : "No structured brief is available for this recap."), "warning");
      return;
    }

    const sessionId = recapSession.id;
    const request = { ownerId };
    recapGenerationRequestsRef.current.set(sessionId, request);
    setGeneratingRecapSessionIds((current) => new Set(current).add(sessionId));
    const isCurrent = () => recapGenerationRequestsRef.current.get(sessionId) === request && authIdentityRef.current === ownerId;
    try {
      const { data } = await supabase.auth.getSession();
      if (!isCurrent()) return;
      const accessToken = data.session?.access_token;
      const response = await fetch("/api/recap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ sessionId }),
      });
      const payload = await response.json() as { subject?: string; body?: string; error?: string };
      if (!isCurrent()) return;
      if (!response.ok || !payload.subject || !payload.body) {
        throw new Error(payload.error ?? "Génération du récap échouée.");
      }

      setSessions((current) => current.map((session) =>
        session.id === sessionId
          ? { ...session, clientSummary: payload.body!, clientSubject: payload.subject! }
          : session,
      ));
      showToast((language === "fr" ? "Récap généré en français." : "Recap generated in French."));
    } catch  {
      if (isCurrent()) showToast(localize("Le récap n’a pas pu être préparé. Réessayez.", "The recap could not be prepared. Try again."), "error");
    } finally {
      if (recapGenerationRequestsRef.current.get(sessionId) === request) {
        recapGenerationRequestsRef.current.delete(sessionId);
        setGeneratingRecapSessionIds((current) => { const next = new Set(current); next.delete(sessionId); return next; });
      }
    }
  };

  const updateClientSummary = (value: string) => {
    if (!recapSession) return;
    setSessions((current) =>
      current.map((session) =>
        session.id === recapSession.id ? { ...session, clientSummary: value } : session,
      ),
    );
  };

  const updateClientEmail = (value: string) => {
    if (!recapSession) return;
    const now = new Date().toISOString();
    setSessions((current) =>
      current.map((session) =>
        session.id === recapSession.id ? { ...session, clientEmail: value } : session,
      ),
    );
    if (recapSession.clientId) {
      setClients((current) => current.map((client) =>
        client.id === recapSession.clientId ? { ...client, email: value, updatedAt: now } : client,
      ));
    }
  };

  const updateClientSubject = (value: string) => {
    if (!recapSession) return;
    setSessions((current) =>
      current.map((session) =>
        session.id === recapSession.id ? { ...session, clientSubject: value } : session,
      ),
    );
  };

  const copySummary = async () => {
    if (!recapSession?.clientSummary) return;
    try {
      await navigator.clipboard.writeText(recapSession.clientSummary);
      showToast((language === "fr" ? "Récap copié." : "Recap copied."));
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = recapSession.clientSummary;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      showToast((language === "fr" ? "Récap copié." : "Recap copied."));
    }
  };

  const sendClientSummary = async () => {
    if (!recapSession?.clientSummary || !currentUser || recapSendRequestRef.current) return;
    const ownerId = currentUser.id;
    const generation = persistGenerationRef.current;
    const token = {};
    const isCurrent = () => authMountedRef.current && authIdentityRef.current === ownerId && generation === persistGenerationRef.current && recapSendRequestRef.current === token;
    const recipient = recapSession.clientEmail.trim();
    const subject = recapSession.clientSubject?.trim() ?? "";
    if (!recipient || !subject) {
      showToast((language === "fr" ? "Le destinataire et l’objet sont requis." : "Recipient and subject are required."), "warning");
      return;
    }

    recapSendRequestRef.current = token;
    setIsSendingRecap(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!isCurrent()) return;
      const accessToken = data.session?.access_token;
      if (!accessToken || data.session?.user.id !== ownerId) throw new Error(language === "fr" ? "Reconnectez-vous avant d’envoyer le récap." : "Sign in again before sending the recap.");
      const { error: saveError } = await supabase
        .from("sessions")
        .update({
          client_email: recipient,
          client_subject: subject,
          client_summary: recapSession.clientSummary,
        })
        .eq("id", recapSession.id).eq("owner_id", ownerId);
      if (!isCurrent()) return;
      if (saveError) throw new Error(`Sauvegarde du récap impossible : ${saveError.message}`);
      const response = await fetch("/api/send-recap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          sessionId: recapSession.id,
          to: recipient,
        }),
      });
      const payload = await response.json() as { id?: string; error?: string };
      if (!isCurrent()) return;
      if (!response.ok || !payload.id) {
        throw new Error(payload.error ?? "Envoi du récap échoué.");
      }
      showToast(language === "fr" ? `Récap envoyé à ${recipient}` : `Recap sent to ${recipient}`);
    } catch  {
      if (!isCurrent()) return;
      showToast(localize("Le récap n’a pas pu être envoyé. Réessayez.", "The recap could not be sent. Try again."), "error");
    } finally {
      if (isCurrent()) { recapSendRequestRef.current = null; setIsSendingRecap(false); }
    }
  };

  const accountMenu = accountMenuOpen ? (
    <div className="account-menu" role="menu">
      <div className="account-menu-heading">
        <strong>{agentDisplayName}</strong>
        <small>{copy.serviceTeam}</small>
      </div>
      <button type="button" role="menuitem" onClick={() => openSettings("profile")}><span>{language === "fr" ? "Profil" : "Profile"}</span><UserRound size={15} aria-hidden="true" /></button>
      <button type="button" role="menuitem" onClick={() => openSettings("settings")}>
        <span>{copy.settings}</span>
        <Settings size={15} strokeWidth={1.7} aria-hidden="true" />
      </button>
      <button type="button" role="menuitem" onClick={() => void signOut()}>{copy.logout}</button>
    </div>
  ) : null;

  const workspaceSkeletonVariant: PageSkeletonVariant = view === "review" && reviewTab === "transcript" ? "folder-conversations" : view === "review" && reviewTab === "client" ? "review" : PAGE_SKELETON_VARIANTS[view];
  const landingIntro = useLandingIntro(hydrated, !isAuthenticated && authView === "landing");

  if (!hydrated) {
    return !isAuthenticated && authView === "landing" ? <LandingIntro language={language} /> : <PageSkeleton variant={isAuthenticated ? workspaceSkeletonVariant : "auth"} shell={isAuthenticated} language={language} />;
  }

  if (!isAuthenticated && authView === "landing") {
    return <>
      <div inert={landingIntro.visible || undefined} aria-hidden={landingIntro.visible || undefined}>
        <LandingPage language={language} onLanguageChange={changeLanguage} onLogin={() => void openAuthScreen("login")} />
      </div>
      {landingIntro.visible ? <LandingIntro language={language} exiting={landingIntro.exiting} /> : null}
    </>;
  }

  if (!isAuthenticated) {
    return (
      <AuthPage
        language={language}
        mode={authMode}
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        loading={authLoading}
        googleEnabled={googleEnabled}
        error={authError}
        notice={authNotice}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onModeChange={(mode) => void changeAuthMode(mode)}
        onSubmit={handleLogin}
        onGoogle={() => void handleGoogleLogin()}
        onBack={() => void openAuthScreen("landing")}
      />
    );
  }

  const workspaceLoadFailed = !remoteWorkspaceLoaded && workspaceLoad.ownerId === currentUser?.id && workspaceLoad.status === "error";
  const workspaceAwaitingData = !remoteWorkspaceLoaded && !workspaceLoadFailed;
  const folderFacts = reviewTab === "internal" && selectedFolderSessions.length > 0 ? (
    <FolderFacts brief={folderBrief} language={language} legacy={briefSession && !isTripBriefSummary(briefSession.summary) ? { people: briefSession.summary.travelers, timing: briefSession.summary.dates, budget: briefSession.summary.budget } : undefined} />
  ) : undefined;
  const folderHeader = selectedFolder ? (
    <FolderHeader
      folderTitle={selectedFolder.tripTitle}
      clientName={selectedFolder.clientName}
      language={language}
      overview={reviewTab === "internal"}
      headingRef={reviewHeadingRef}
      headerRef={reviewTab === "internal" ? folderIdentityOffset : undefined}
      deleting={deletionBusy}
      onBack={() => { setSelectedFolderKey(""); setSelectedSessionId(""); setConversationDetailSessionId(""); setView("clients"); }}
      onStart={() => openSessionSetup(selectedFolder.key)}
      onDelete={requestFolderDeletion}
    />
  ) : null;

  return (
    <div className={`product-shell view-${view}${sidebarCollapsed ? " sidebar-is-collapsed" : ""}`}>
      {view !== "recording" ? (
        <aside className="workspace-sidebar" id="workspace-sidebar">
          <div className="sidebar-top-row">
            <button className="sidebar-collapse-button" type="button" aria-controls="workspace-sidebar" aria-expanded={!sidebarCollapsed} aria-label={sidebarCollapsed ? (language === "fr" ? "Ouvrir le menu" : "Expand menu") : (language === "fr" ? "Réduire le menu" : "Collapse menu")} title={sidebarCollapsed ? (language === "fr" ? "Ouvrir le menu" : "Expand menu") : (language === "fr" ? "Réduire le menu" : "Collapse menu")} onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}><PanelLeft size={18} /></button>
          <button className="sidebar-brand" type="button" onClick={() => { setSelectedFolderKey(""); setSelectedSessionId(""); setConversationDetailSessionId(""); setView("dashboard"); }} aria-label={copy.home} title={copy.home}>
            <AppLogo compact />
            <span className="sidebar-brand-copy"><strong>aBeam</strong><small>{copy.conversationSidekick}</small></span>
          </button>

          </div>
          <button type="button" className="workspace-find sidebar-find" title={language === "fr" ? "Rechercher un dossier" : "Find a client file"} aria-label={language === "fr" ? "Rechercher un dossier" : "Find a client file"} onClick={() => { openWorkspaceSection("clients"); window.requestAnimationFrame(() => document.querySelector<HTMLInputElement>(".clients-page .search-field input")?.focus()); }}><Search size={17} /><span>{language === "fr" ? "Rechercher…" : "Search…"}</span></button>

          <button
            className="sidebar-new-button"
            type="button"
            onClick={() => openSessionSetup(view === "review" ? selectedFolder?.key : undefined)}
            aria-label={copy.startConversation}
            data-testid="sidebar-start-session"
          >
            <span className="sidebar-action-icon" aria-hidden="true">
              <Mic className="workspace-icon" size={20} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <span>{copy.startConversation}</span>
          </button>

          <nav className="sidebar-navigation" aria-label={language === "fr" ? "Navigation de l’espace de travail" : "Workspace navigation"}>
            <button
              className={view === "dashboard" || (view === "client-create" && clientCreateReturnView === "dashboard") ? "active" : ""}
              type="button"
              onClick={() => { setSelectedFolderKey(""); setSelectedSessionId(""); setConversationDetailSessionId(""); setView("dashboard"); }}
              aria-label={copy.home}
              aria-current={view === "dashboard" || (view === "client-create" && clientCreateReturnView === "dashboard") ? "page" : undefined}
              title={copy.home}
            >
              <span className="sidebar-nav-icon sidebar-nav-home" aria-hidden="true">
                <Home className="workspace-icon" size={20} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <span className="sidebar-nav-label">{copy.home}</span>
            </button>
            <button
              className={view === "clients" || (view === "client-create" && clientCreateReturnView === "clients") || view === "review" ? "active" : ""}
              type="button"
              onClick={() => openWorkspaceSection("clients")}
              aria-label={copy.folders}
              aria-current={view === "clients" || (view === "client-create" && clientCreateReturnView === "clients") || view === "review" ? "page" : undefined}
              title={copy.folders}
            >
              <span className="sidebar-nav-icon sidebar-nav-folder"><Folder className="workspace-icon" size={20} strokeWidth={1.6} aria-hidden="true" /></span>
              <span className="sidebar-nav-label">{copy.folders}</span>
            </button>
            <button className={view === "explore" ? "active" : ""} type="button" onClick={() => { setDiscoveryLaunch(null); openWorkspaceSection("explore"); }} aria-current={view === "explore" ? "page" : undefined} aria-label={language === "fr" ? "Explorer" : "Explore"} title={language === "fr" ? "Explorer" : "Explore"}>
              <span className="sidebar-nav-icon sidebar-nav-explore" aria-hidden="true"><Globe2 className="workspace-icon" size={20} strokeWidth={1.6} /></span>
              <span className="sidebar-nav-label">{language === "fr" ? "Explorer" : "Explore"}</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <button className="sidebar-settings-button" aria-haspopup="dialog" aria-expanded={settingsSection !== null} type="button" onClick={() => openSettings("settings")} aria-label={language === "fr" ? "Paramètres" : "Settings"} title={language === "fr" ? "Paramètres" : "Settings"}><Settings size={18} strokeWidth={1.7} aria-hidden="true" /><span>{language === "fr" ? "Paramètres" : "Settings"}</span></button>
            <div className="sidebar-account-wrap">
              <button
                className="sidebar-account-trigger"
                type="button"
                onClick={() => setAccountMenuOpen((open) => !open)}
                aria-label={copy.profile}
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
              >
                <span className="account-avatar" aria-hidden="true">{agentInitials}</span>
                <span className="sidebar-account-copy"><strong title={agentDisplayName}>{agentDisplayName}</strong><small>{copy.serviceTeam}</small></span>
                <ChevronDown className="sidebar-account-chevron" size={16} strokeWidth={1.7} aria-hidden="true" />
              </button>
              <div className="sidebar-account-menu-wrap">{accountMenu}</div>
            </div>
          </div>
        </aside>
      ) : null}

      {view !== "recording" ? (
        <header className="product-header mobile-product-header">
          <button className="sidebar-brand" type="button" onClick={() => { setSelectedFolderKey(""); setSelectedSessionId(""); setConversationDetailSessionId(""); setView("dashboard"); }}>
            <AppLogo compact />
            <span>aBeam</span>
          </button>
          <div className="account-menu-wrap">
            <button
              className="mobile-account-button"
              type="button"
              onClick={() => setAccountMenuOpen((open) => !open)}
              aria-label={language === "fr" ? "Ouvrir le profil" : "Open profile menu"}
              aria-expanded={accountMenuOpen}
              title={language === "fr" ? "Compte" : "Account"}
            >
              <span className="mobile-nav-avatar" aria-hidden="true">{agentInitials}</span>
            </button>
            {accountMenu}
          </div>
        </header>
      ) : null}

      {view !== "recording" ? (
        <nav className={`mobile-bottom-nav ${view === "client-create" ? "is-form-footer" : ""}`} aria-label={language === "fr" ? "Navigation mobile" : "Mobile workspace navigation"}>
          {view === "client-create" ? (
            <div className="client-create-footer">
              <button className="client-create-cancel" aria-label={copy.cancel} type="button" onClick={cancelClientCreate}><X size={18} />{copy.cancel}</button>
              <button className="mobile-nav-new" aria-label={language === "fr" ? "Enregistrer" : "Save"} type="submit" form="new-folder-form" disabled={!newClientName.trim() || !newClientTrip.trim()} data-testid="save-client">
                <Check size={18} strokeWidth={2.3} />
                <span>{language === "fr" ? "Enregistrer" : "Save"}</span>
              </button>
            </div>
          ) : (
            <>
              <div className="mobile-nav-links" data-modules="4">
                <button
                  className={view === "dashboard" ? "active" : ""}
                  type="button"
                  onClick={() => openWorkspaceSection("dashboard")}
                  aria-label={copy.home}
                  aria-current={view === "dashboard" ? "page" : undefined}
                >
                  <span className="mobile-nav-link-icon" aria-hidden="true"><Home className="workspace-icon" size={20} strokeWidth={1.6} aria-hidden="true" /></span>
                  <span>{copy.home}</span>
                </button>
                <button
                  className="mobile-nav-center-action"
                  type="button"
                  onClick={() => openSessionSetup(view === "review" ? selectedFolder?.key : undefined)}
                  aria-label={copy.startConversation}
                  data-testid="start-session"
                >
                  <span className="mobile-nav-link-icon mobile-nav-center-icon" aria-hidden="true"><Mic className="workspace-icon" size={20} strokeWidth={1.6} aria-hidden="true" /></span>
                  <span>{copy.startConversation}</span>
                </button>
                <button
                  className={view === "clients" || view === "review" ? "active" : ""}
                  type="button"
                  onClick={() => openWorkspaceSection("clients")}
                  aria-label={copy.folders}
                  aria-current={view === "clients" || view === "review" ? "page" : undefined}
                >
                  <span className="mobile-nav-link-icon" aria-hidden="true"><Folder className="workspace-icon" size={20} strokeWidth={1.6} aria-hidden="true" /></span>
                  <span>{copy.folders}</span>
                </button>
                <button className={view === "explore" ? "active" : ""} type="button" onClick={() => { setDiscoveryLaunch(null); openWorkspaceSection("explore"); }} aria-current={view === "explore" ? "page" : undefined} aria-label={language === "fr" ? "Explorer" : "Explore"}>
                  <span className="mobile-nav-link-icon" aria-hidden="true"><Globe2 className="workspace-icon" size={20} strokeWidth={1.6} /></span>
                  <span>{language === "fr" ? "Explorer" : "Explore"}</span>
                </button>
              </div>
            </>
          )}
        </nav>
      ) : null}

      {workspaceAwaitingData ? <PageSkeleton variant={workspaceSkeletonVariant} language={language} /> : workspaceLoadFailed ? (
        <main className="dashboard-page"><EmptyState language={language} icon={RefreshCw} headingLevel={2} title={language === "fr" ? "Votre espace n’a pas pu être chargé" : "Your workspace could not be loaded"} description={language === "fr" ? "Réessayez pour retrouver vos dossiers et conversations." : "Try again to load your folders and conversations."} action={{ label: language === "fr" ? "Réessayer" : "Retry", icon: RefreshCw, onClick: () => { if (currentUser) void loadWorkspaceOnce(currentUser); } }} /></main>
      ) : <>
      {view === "explore" ? <Suspense fallback={<PageSkeleton variant="explore" language={language} />}><Explore key={researchOwnerId} language={language} entries={discoveryEntries}
        onSearch={searchProducts} onSearchCompleted={recordResearch} onRefresh={dailyFeed.refresh}
        refreshing={dailyFeed.loading} feedError={dailyFeed.error} feedWarnings={dailyFeed.data?.warnings} feedNotice={dailyFeed.data?.warnings.join(" ")}
        inspirationItems={dailyFeed.data?.items} inspirationScopes={dailyFeed.data?.editorialScopes}
        launchRequest={discoveryLaunch?.ownerId === researchOwnerId ? discoveryLaunch : null} /></Suspense> : null}

      {view === "dashboard" ? (
        <main className="dashboard-page home-page">
          <header className="dashboard-heading home-welcome">
            <div>
              <p>{greetingForNow(language)}, {agentDisplayName.split(" ")[0]}</p>
              <h1>{copy.conversationWorkspace}</h1>
              <span>{copy.conversationWorkspaceSub}</span>
            </div>
          </header>

          <section className="home-start-strip" aria-label={copy.startConversation}>
            <span className="home-hero-art" aria-hidden="true"><ShaderOrb animated tone="blue" shape="field" /></span>
            <div className="home-start-copy">
              <h2>{copy.homeStartHeading}</h2>
              <p>{copy.homeStartSub}</p>
            </div>
            <button className="home-start-button mobile-icon-action" aria-label={copy.startConversation} type="button" onClick={() => openSessionSetup()} data-testid="home-start-session">
              <Mic className="workspace-icon" size={20} strokeWidth={1.6} aria-hidden="true" />
              <span>{copy.startConversation}</span>
              <ChevronRight size={16} />
            </button>
          </section>

          <nav className="home-activity-tabs" aria-label={language === "fr" ? "Activité récente" : "Recent activity"}>
            <button type="button" aria-pressed={homeActivity === "files"} onClick={() => setHomeActivity("files")}>{copy.recentFolders}</button>
            <button type="button" aria-pressed={homeActivity === "conversations"} onClick={() => setHomeActivity("conversations")}>{copy.recentConversations}</button>
          </nav>
          <div className="home-panels" data-active={homeActivity}>
            <section className="home-panel" aria-labelledby="recent-folders-title">
              <header className="home-panel-heading">
                <div>
                  <p>{copy.folders}</p>
                  <h2 id="recent-folders-title">{copy.recentFolders}</h2>
                  <span>{copy.homeFoldersHint}</span>
                </div>
                <button className="home-panel-link mobile-icon-action" aria-label={copy.homeViewAll} type="button" onClick={() => openWorkspaceSection("clients")}>{copy.homeViewAll}<ChevronRight size={14} /></button>
              </header>
              {recentFolders.length ? (
                <div className="home-list">
                  {recentFolders.map((folder) => {
                    const summary = folder.key === UNFILED_FOLDER_KEY ? null : mergeFolderSessions(folder.sessions)?.summary;
                    return <FolderListItem key={folder.key} variant="compact" title={folder.tripTitle} client={folder.clientName}
                      conversationCount="" tag={folderGroupTag(summary && isTripBriefSummary(summary) ? summary : null, language)}
                      onOpen={() => openFolder(folder.key)} />;
                  })}
                </div>
              ) : (
                <EmptyState language={language} compact icon={Folder} title={copy.noFolders} description={copy.emptyFolderHint} action={{ label: copy.relationshipTitle, onClick: openCreateClient, icon: Plus }} />
              )}
            </section>

            <section className="home-panel" aria-labelledby="recent-conversations-title">
              <header className="home-panel-heading">
                <div>
                  <p>{copy.conversations}</p>
                  <h2 id="recent-conversations-title">{copy.recentConversations}</h2>
                  <span>{copy.homeConversationsHint}</span>
                </div>
                <button className="home-panel-link mobile-icon-action" aria-label={copy.homeViewAll} type="button" onClick={() => openWorkspaceSection("clients")}>{copy.homeViewAll}<ChevronRight size={14} /></button>
              </header>
              {recentConversations.length ? (
                <div className="home-list">
                  {recentConversations.map((session) => {
                    const folder = folderBySessionId.get(session.id);
                    if (!folder) return null;
                    return (
                      <RecentConversationItem key={session.id}
                        title={folder.key === UNFILED_FOLDER_KEY ? conversationLabel(session.id, language, conversationSequence) : folder.clientName}
                        subtitle={folder.key === UNFILED_FOLDER_KEY ? (language === "fr" ? "À classer" : "Unfiled") : folder.tripTitle}
                        date={formatSessionDay(session.createdAt, language)}
                        status={<SessionLifecycleBadge processing={processingSessionIds.has(session.id)} status={session.status} resteMs={attenteDe(session.id)} language={language} />}
                        onOpen={() => openSession(session.id, "transcript")} />
                    );
                  })}
                </div>
              ) : (
                <EmptyState language={language} compact icon={MessagesSquare} title={copy.noConversations} description={language === "fr" ? "Démarrez une rencontre pour retrouver ici son brief et les prochaines étapes." : "Start a consultation to find its brief and next steps here."} action={{ label: copy.startConversation, onClick: () => openSessionSetup(), icon: Mic }} />
              )}
              {unfiledSessions.length ? <button className="unfiled-inbox-link" type="button" onClick={() => openFolder(UNFILED_FOLDER_KEY)}>{language === "fr" ? "Conversations à classer" : "Unfiled conversations"}<span>{unfiledSessions.length}</span></button> : null}
            </section>
            <DashboardResearch key={researchOwnerId} entries={discoveryEntries} loading={dailyFeed.loading} language={language} onOpen={openResearchOffer} onSearch={launchResearch} />
          </div>
        </main>
      ) : null}

      {view === "client-create" ? (
        <main className="client-create-page dashboard-page">
          <section className="client-create-content">
            <div className="client-create-intro">
              <div>
                <h1>{copy.relationshipTitle}</h1>
                <span>{copy.relationshipIntro}</span>
              </div>
            </div>

            <form id="new-folder-form" className="client-create-form" onSubmit={(event) => { event.preventDefault(); createClient(); }}>
              <section className="client-form-section">
                  <div className="client-form-grid">
                  <label className="client-form-field client-form-field-wide"><span><NotebookTabs size={14} /> {copy.topicProject} <b aria-hidden="true">*</b></span><input required value={newClientTrip} onChange={(event) => setNewClientTrip(event.target.value)} placeholder={language === "fr" ? "Ex. Anniversaire à Paris" : "e.g. Paris anniversary trip"} /></label>
                  <label className="client-form-field client-form-field-wide"><span><FileText size={14} /> {copy.privateNotes}</span><textarea value={newClientNotes} onChange={(event) => setNewClientNotes(event.target.value)} placeholder={language === "fr" ? "Préférences, contexte ou détails à retenir…" : "Preferences, context, or anything worth remembering…"} rows={4} /></label>
                </div>
              </section>

              <section className="client-form-section">
                  <div className="client-form-grid">
                  <label className="client-form-field client-form-field-wide"><span>{copy.fullName} <b aria-hidden="true">*</b></span><input required value={newClientName} onChange={(event) => setNewClientName(event.target.value)} autoComplete="name" placeholder={language === "fr" ? "Ex. Marion Dupont" : "e.g. Marion Dupont"} /></label>
                  <label className="client-form-field"><span><Mail size={14} /> {language === "fr" ? "Courriel" : "Email"}</span><input autoComplete="email" type="email" value={newClientEmail} onChange={(event) => setNewClientEmail(event.target.value)} placeholder="client@example.com" /></label>
                  <label className="client-form-field"><span><Phone size={14} /> {language === "fr" ? "Téléphone" : "Phone"}</span><input autoComplete="tel" type="tel" value={newClientPhone} onChange={(event) => setNewClientPhone(event.target.value)} placeholder={language === "fr" ? "Ex. +1 514 555 0123" : "e.g. +1 514 555 0123"} /></label>
                </div>
              </section>
            </form>
          </section>
        </main>
      ) : null}

      {view === "clients" ? (
        <main className="clients-page dashboard-page">
          <header className="dashboard-heading clients-heading">
            <div>
              <h1>{copy.folders}</h1>
            </div>
            <button className="primary-button mobile-icon-action" aria-label={copy.relationshipTitle} type="button" onClick={openCreateClient}><span className="button-asset-icon"><Plus className="workspace-icon" size={20} strokeWidth={1.6} aria-hidden="true" /></span> {copy.relationshipTitle}</button>
          </header>
          <section className="sessions-section clients-list-section">
            <UnassignedConversationBanner count={unfiledSessions.length} language={language} onOpen={() => openFolder(UNFILED_FOLDER_KEY)} />
            <div className="sessions-toolbar">
              <label className="search-field">
                <Search size={16} />
                <span className="sr-only">{copy.folders}</span>
                <input type="search" placeholder={copy.folders} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
              </label>
            </div>
            {filteredFolders.length ? (
              <>
              <div className="folder-mobile-list home-list">
                {filteredFolders.map((folder) => <FolderListItem key={folder.key} title={folder.tripTitle} client={folder.clientName} conversationCount={`${folder.sessions.length} ${folder.sessions.length === 1 ? copy.conversation : copy.conversationPlural}`} onOpen={() => openFolder(folder.key)} />)}
              </div>
              <FolderDirectory folders={filteredFolders} language={language} sort={folderSort} onSortChange={setFolderSort} onOpen={openFolder} />
              </>
            ) : (
              searchQuery.trim() ? <EmptyState language={language} icon={Search} title={language === "fr" ? "Aucun dossier trouvé" : "No matching folders"} description={language === "fr" ? "Essayez un autre nom de client ou de voyage." : "Try another client name or trip title."} action={{ label: language === "fr" ? "Effacer la recherche" : "Clear search", onClick: () => setSearchQuery("") }} /> : <EmptyState language={language} icon={Folder} title={copy.noFolders} description={copy.emptyFolderHint} action={{ label: copy.relationshipTitle, onClick: openCreateClient, icon: Plus }} />
            )}
          </section>
        </main>
      ) : null}

      {view === "recording" ? (
        <main className={`recording-page conversation-workspace ${conversationMessages.messages.length === 0 && !(liveSuggestions?.cards.length) && !liveBriefRapide && !liveBriefLent ? "is-empty" : "has-content"}`}>
          <header className="conversation-toolbar">
            <div className="conversation-entry-controls">
              <button type="button" className="conversation-back" disabled={recordingState === "stopping"} onClick={returnFromConversation} aria-label={`${language === "fr" ? "Retour :" : "Back to"} ${conversationBackLabel}`} title={recordingState === "recording" || recordingState === "paused" ? (language === "fr" ? "Enregistrer et revenir à la page précédente" : "Save and return to the previous page") : undefined}><ArrowLeft size={17} aria-hidden="true" /><span>{conversationBackLabel}</span></button>
            </div>
            <span id="conversation-capture-status" className="conversation-capture-state" data-state={recordingState} role="status" aria-atomic="true">
              <span className="conversation-capture-dot" aria-hidden="true" />
              <span className="conversation-capture-label">{portfolioDemoEnabled() ? (language === "fr" ? "Session d’exemple" : "Sample session") : CAPTURE_STATUS_LABELS[language][recordingState]}</span>
            </span>
            <button className="conversation-finish" aria-label={language === "fr" ? "Enregistrer la conversation" : "Save conversation"} type="button" disabled={recordingState !== "recording" && recordingState !== "paused"} onClick={() => void saveSession()} data-testid="finish-session-top">
              <Save size={17} aria-hidden="true" /> <span>{language === "fr" ? "Enregistrer" : "Save"}</span>
            </button>
          </header>

          {recordingState === "stopping" ? (
            <section className="recording-processing" aria-live="polite" aria-busy="true">
              <span className="recording-processing-icon"><LoaderCircle size={28} aria-hidden="true" /></span>
              <div className="recording-processing-copy">
                <span>{language === "fr" ? "Conversation terminée" : "Conversation complete"}</span>
                <h1>{language === "fr" ? "On prépare votre compte rendu." : "We’re preparing your conversation."}</h1>
                <p>{activeSaveStageIndex >= 0 ? saveStageItems[activeSaveStageIndex].label : saveStageItems[0].label}</p>
              </div>
              <ol className="recording-processing-steps">
                {saveStageItems.map((item, index) => {
                  const status = index < activeSaveStageIndex ? "complete" : index === activeSaveStageIndex ? "active" : "pending";
                  return (
                    <li className={status} key={item.id}>
                      <span>{status === "complete" ? <Check size={13} /> : index + 1}</span>
                      <strong>{item.label}</strong>
                    </li>
                  );
                })}
              </ol>
              <small>{language === "fr" ? "Gardez cet onglet ouvert. Vous serez redirigé automatiquement." : "Keep this tab open. You’ll be redirected automatically."}</small>
            </section>
          ) : recordingState === "requesting" ? (
            <section className="permission-panel requesting-panel">
              <div className="permission-icon"><Mic className="workspace-icon" size={20} strokeWidth={1.6} aria-hidden="true" /></div>
              <div>
                <h1>{language === "fr" ? "Autorisez le microphone" : "Allow microphone access"}</h1>
                <p>{language === "fr" ? "Confirmez la demande du navigateur. L’écoute commencera aussitôt." : "Confirm the browser prompt. Listening will begin immediately."}</p>
              </div>
              <div className="permission-actions">
                <button className="secondary-button" type="button" onClick={returnFromConversation}>{language === "fr" ? "Annuler" : "Cancel"}</button>
              </div>
            </section>
          ) : recordingState === "blocked" ? (
            <section className="permission-panel">
              <div className="permission-icon"><MicOff size={36} strokeWidth={1.65} /></div>
              <div>
                <h1>{language === "fr" ? "Microphone indisponible" : "Microphone unavailable"}</h1>
                <p>{captureMessage}</p>
              </div>
              <div className="permission-actions">
                <button className="secondary-button" type="button" onClick={() => {
                  captureCancelledRef.current = false;
                  setRecordingState("requesting");
                  void beginMicrophoneCapture();
                }}>{language === "fr" ? "Réessayer" : "Try again"}</button>
                <button className="secondary-button" type="button" onClick={returnFromConversation}>{language === "fr" ? "Retour" : "Back"}</button>
              </div>
            </section>
          ) : (
            <div className="conversation-body">
              <ConversationBookmarks scopeKey={`${currentUser?.id ?? ""}:${conversationPresentationKey}`} cards={visibleBookmarkedCards} language={language} expanded={bookmarksExpanded} onExpandedChange={setBookmarksExpanded} headingRef={bookmarksHeadingRef} onRemove={(card) => toggleConversationBookmark(card, true)} />
              <div className="conversation-main">
                <section className="conversation-scroll-region" ref={liveFeedRef}
                  onWheel={(event) => { liveFeedManualScrollRef.current = true; if (event.deltaY < 0) liveFeedStickToBottomRef.current = false; }}
                  onTouchMove={() => { liveFeedManualScrollRef.current = true; liveFeedStickToBottomRef.current = false; }}
                  onPointerDown={() => { liveFeedManualScrollRef.current = true; }}
                  onKeyDown={(event) => { if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(event.key)) liveFeedManualScrollRef.current = true; }}
                  onScroll={() => {
                  const stream = liveFeedRef.current;
                  if (stream && liveFeedManualScrollRef.current) liveFeedStickToBottomRef.current = stream.scrollHeight - stream.scrollTop - stream.clientHeight < 24;
                }}>
                  {feedDisplayMode === "lab" ? (
                    <FeedLabPanel language={language}
                      cards={liveSuggestions?.cards ?? []}
                      nudges={liveSuggestions?.nudges ?? []}
                      searchesUsed={liveSuggestions?.searchesUsed ?? 0}
                      warnings={liveSuggestions?.warnings ?? []}
                      pilotChoice={activeJevLabChoice}
                      pilotResult={jevPilotResult}
                      ratings={labCardRatings}
                      onRate={rateLabCard}
                    />
                  ) : null}
                  <div className="conversation-content">
                    {(() => {
                      const fr = language === "fr";
                      const liveCards = liveSuggestions?.cards ?? [];
                      const availableFeedCards = feedDisplayMode === "lab"
                        ? liveCards
                        : liveCards.filter((card) => ((card.type === "hotels" || card.type === "vols") && card.audience !== "agent") || (card.type === "info" && card.audience === "client"));
                      const feedCards = availableFeedCards;
                      return (
                        <div
                          className="conversation-stream"
                          style={{ "--rail-width": `${railWidth}%` } as CSSProperties}
                        >
                          <section className="conversation-resources" aria-label={fr ? "Ressources voyage" : "Travel resources"}>
                            {feedCards.length === 0 ? (
                              <div className="live-resource-preview">
                                {recordingState === "idle" ? (
                                  <button className="conversation-start-orb" type="button" onClick={() => setSessionStartOpen(true)} aria-label={fr ? "Démarrer la conversation" : "Start the conversation"} data-testid="start-session-orb">
                                    <span className="conversation-start-art" aria-hidden="true"><ShaderOrb animated tone="blue" edge="smooth" /></span>
                                    <span className="conversation-start-symbol" aria-hidden="true"><Play size={28} fill="currentColor" /></span>
                                    <span className="conversation-start-label">{fr ? "Démarrer" : "Start"}</span>
                                  </button>
                                ) : <div className="live-resource-art" aria-hidden="true"><ShaderOrb animated={recordingState === "recording"} tone="blue" edge="smooth" /></div>}
                                <div className="live-resource-copy">
                                  {recordingState === "idle" ? <h2>{fr ? "Commençons la conversation." : "Let’s start a conversation."}</h2> : null}
                                  <p>{recordingState === "idle" ? (fr ? "Démarrez l’écoute ou écrivez à l’assistant." : "Start listening or type to the assistant.") : (fr ? "Vos ressources voyage apparaîtront ici." : "Your travel resources will appear here.")}</p>
                                </div>
                              </div>
                            ) : (
                              // The live feed keeps its newest item at the bottom:
                              // older cards remain readable above as the agent scrolls.
                              feedCards.slice().reverse().map((card) => <SuggestionCardView key={card.id} card={card} language={language} bookmarked={bookmarkedCardIdentities.has(cardIdentity(card))} onToggleBookmark={toggleConversationBookmark} />)
                            )}
                          </section>
                          <div
                            className={`sg-room-divider${isRailResizing ? " is-resizing" : ""}`}
                            role="separator"
                            aria-orientation="vertical"
                            aria-valuemin={24}
                            aria-valuemax={52}
                            aria-valuenow={railCollapsed ? 0 : Math.round(railWidth)}
                            aria-label={fr ? "Redimensionner le panneau agent" : "Resize agent panel"}
                            onPointerDown={(event) => {
                              if (event.target instanceof HTMLElement && event.target.closest("button")) return;
                              if (window.innerWidth <= 900) return;
                              event.preventDefault();
                              setIsRailResizing(true);
                            }}
                          >
                            <button
                              type="button"
                              className="sg-rail-toggle"
                              onClick={() => setRailCollapsed((value) => !value)}
                              aria-expanded={!railCollapsed}
                              title={fr ? (railCollapsed ? "Ouvrir le panneau agent" : "Replier le panneau agent") : (railCollapsed ? "Open agent panel" : "Collapse agent panel")}
                            >
                              {railCollapsed ? "‹" : "›"}
                            </button>
                          </div>
                          <aside className="conversation-assistant" aria-label={fr ? "Assistant privé" : "Private assistant"}>
                            {!railCollapsed ? (
                              <div className="conversation-assistant-body">
                                <div className="sg-chat-thread" role="log" aria-live="polite">
                                  {conversationMessages.messages.length === 0 ? (
                                    <p className="sg-chat-empty">{fr
                                      ? "J'écoute la rencontre. Je te signale ce qui bloque, et tu peux m'écrire une question — j'irai vérifier."
                                      : "I'm listening. I'll flag what's blocking, and you can ask me anything — I'll go check."}</p>
                                  ) : null}
                                  {conversationMessages.messages.map((item) => (
                                    <article key={item.id} className={`sg-chat-msg ${item.from}${item.kind === "vigie" ? " vigie" : ""}`}>
                                      <p>{item.text}</p>
                                      {item.extraits?.length ? (
                                        <ul>{item.extraits.map((extrait, index) => <li key={index}>« {extrait} »</li>)}</ul>
                                      ) : null}
                                      {item.kind === "desamb" && item.proposition ? (
                                        <DesambPastilles language={language}
                                          proposition={item.proposition}
                                          choisi={desambChoisi[item.proposition.id]}
                                          echoues={desambEchoues}
                                          enCours={desambEnCours}
                                          onChoisir={choisirCandidat}
                                        />
                                      ) : null}
                                      {item.from === "nudge" && !item.kind ? (
                                        <button type="button" className="sg-promote" onClick={() => promoteToFeed(item.text)}>
                                          {fr ? "→ Montrer au client" : "→ Show the client"}
                                        </button>
                                      ) : null}
                                    </article>
                                  ))}
                                  {nudgeBusy ? <article className="sg-chat-msg nudge pending"><p>{fr ? "Je vérifie…" : "Checking…"}</p></article> : null}
                                </div>

                                {liveTranscriptStatus === "unavailable" ? (
                                  <p className="sg-room-status">{fr
                                    ? "Cartes live indisponibles sur ce navigateur — tout arrivera au récap après la sauvegarde."
                                    : "Live cards unavailable in this browser — everything arrives in the recap after saving."}</p>
                                ) : null}
                              </div>
                            ) : null}
                          </aside>
                        </div>
                      );
                    })()}
                  </div>
                </section>
                <div className="conversation-composer" ref={conversationComposerRef}>
                  <ConversationSuggestionIsland
                    key={conversationPresentationKey}
                    items={conversationMessages.suggestions}
                    language={language}
                    busy={desambEnCours !== null}
                    signals={lignesPanneau(liveBriefRapide, liveBriefLent, language)}
                    checkingHotel={desambEnCours !== null}
                    onDismiss={(id) => setDismissedSuggestionIds((current) => current.includes(id) ? current : [...current, id])}
                    renderActions={(item) => item.kind === "desamb" && item.proposition ? <DesambPastilles language={language} proposition={item.proposition} choisi={desambChoisi[item.proposition.id]} echoues={desambEchoues} enCours={desambEnCours} onChoisir={choisirCandidat} /> : null}
                  />
                  <span className="conversation-island-status" role="status" aria-live="polite" aria-atomic="true">{bookmarkAnnouncement}</span>
                  {feedDisplayMode === "lab" && recordingState === "idle" ? <label className="conversation-engine">{language === "fr" ? "Moteur" : "Engine"} <select value={jevLabChoice} onChange={(event) => setJevLabChoice(event.target.value as "baseline" | "jev_lab")}><option value="baseline">{language === "fr" ? "Actuel" : "Current"}</option><option value="jev_lab">{language === "fr" ? "Jev (pilote)" : "Jev (pilot)"}</option></select></label> : null}
                  <form className="conversation-input-row" onSubmit={(event) => { event.preventDefault(); sendNudgeQuestion(); }}>
                    <input value={nudgeInput} onChange={(event) => setNudgeInput(event.target.value)} placeholder={language === "fr" ? "Demander à l’assistant…" : "Ask the assistant…"} aria-label={language === "fr" ? "Question à l’assistant" : "Question for the assistant"} />
                    <button type="submit" className="conversation-send" disabled={nudgeBusy || !nudgeInput.trim()} aria-label={language === "fr" ? "Envoyer" : "Send"}><Send size={18} /></button>
                    <button type="button" className={`conversation-mic ${recordingState === "recording" ? "is-listening" : recordingState === "paused" ? "is-paused" : "is-quiet"}`} onClick={() => { if (portfolioDemoEnabled()) { showToast(language === "fr" ? "Le microphone est désactivé dans cette démonstration." : "Microphone recording is unavailable in this public demo.", "info"); return; } if (recordingState === "idle") setSessionStartOpen(true); else if (recordingState === "paused") resumeActiveSession(); else pauseActiveSession(); }} aria-describedby="conversation-capture-status" aria-label={recordingState === "idle" ? (language === "fr" ? "Démarrer l’enregistrement" : "Start recording") : recordingState === "paused" ? (language === "fr" ? "Reprendre l’enregistrement" : "Resume recording") : (language === "fr" ? "Mettre l’enregistrement en pause" : "Pause recording")} data-testid="toggle-recording">
                      <span className="conversation-voice-orb" aria-hidden="true"><ShaderOrb animated={recordingState === "recording"} tone="blue" edge="smooth" /></span>
                      <span className="conversation-voice-symbol" aria-hidden="true">{recordingState === "recording" ? <Pause size={18} /> : recordingState === "paused" ? <Play size={18} fill="currentColor" /> : <Mic size={18} />}</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      ) : null}

      {view === "review" && isUnfiledFolder ? (
        <main className="review-page unfiled-review-page">
          {selectedUnfiledSession ? <UnfiledConversation key={selectedUnfiledSession.id} language={language}
            label={conversationLabel(selectedUnfiledSession.id, language, conversationSequence)} identifier={selectedUnfiledSession.id}
            date={formatSessionDate(selectedUnfiledSession.createdAt, language)} duration={formatTime(selectedUnfiledSession.duration)}
            status={<SessionLifecycleBadge status={selectedUnfiledSession.status} processing={processingSessionIds.has(selectedUnfiledSession.id)} resteMs={attenteDe(selectedUnfiledSession.id)} language={language} />}
            onBack={() => { setSelectedSessionId(""); setConversationDetailSessionId(""); reviewAudio.selectSession(""); }}
            onFile={() => openConversationFiling(selectedUnfiledSession)}
            id={selectedUnfiledSession.id} onDelete={requestConversationDeletion}
            deletionBusy={deletionBusy} deleteDisabled={conversationDeletionBlocked(selectedUnfiledSession)}
            audio={reviewAudio.state === "loading" ? <SectionSkeleton variant="audio" language={language} label={language === "fr" ? "Chargement de l’audio…" : "Loading audio…"} /> : reviewAudio.state === "ready" ? <AudioDock key={selectedUnfiledSession.id} src={reviewAudio.src} durationMs={selectedUnfiledSession.duration * 1000} language={language} onSeekRegister={reviewAudio.registerSeek} onTimeUpdate={reviewAudio.handleTimeUpdate} /> : undefined}
            feedback={<>{reviewAudio.state !== "ready" && reviewAudio.state !== "loading" ? <div className="unfiled-audio-message" role="status">{reviewAudio.state === "error" ? <>{language === "fr" ? "L’enregistrement audio n’a pas pu être chargé." : "The audio recording could not be loaded."}<button className="unfiled-text-action" type="button" onClick={reviewAudio.retry}>{language === "fr" ? "Réessayer" : "Retry"}</button></> : (language === "fr" ? (unfiledConversationProcessing ? "L’audio n’est pas encore disponible." : "Aucun enregistrement audio pour cette conversation.") : (unfiledConversationProcessing ? "Audio is not available yet." : "No audio recording for this conversation."))}</div> : null}{etatsReprise.get(selectedUnfiledSession.id)?.etat === "reprenable" ? <button className="unfiled-text-action" type="button" disabled={Boolean(resumingSessionId) || processingSessionIds.has(selectedUnfiledSession.id)} onClick={() => void reprendreTraitement(selectedUnfiledSession.id)}>{resumingSessionId === selectedUnfiledSession.id ? (language === "fr" ? "Reprise en cours…" : "Resuming…") : (language === "fr" ? "Reprendre le traitement" : "Resume processing")}</button> : null}</>}
            transcript={selectedUnfiledSession.transcript.length ? <TranscriptPanel key={selectedUnfiledSession.id} session={reviewSessions[0] ?? null} language={language} onSeek={reviewAudio.state === "ready" ? reviewAudio.seek : undefined} playingLineId={reviewAudio.playingLineId} />
              : unfiledConversationProcessing ? <SectionSkeleton variant="conversation" language={language} label={language === "fr" ? "Préparation de la transcription…" : "Preparing transcript…"} /> : <EmptyState language={language} compact icon={FileText} title={language === "fr" ? "Aucune transcription enregistrée" : "No saved transcript"} description={language === "fr" ? "Cette conversation reste disponible pour être classée." : "This conversation is still available to file."} />}
          /> : <UnfiledConversationList language={language} items={unfiledSessions.map((session) => ({ id: session.id, label: conversationLabel(session.id, language, conversationSequence), date: formatSessionDate(session.createdAt, language), duration: formatTime(session.duration), deleteDisabled: conversationDeletionBlocked(session), status: <SessionLifecycleBadge status={session.status} processing={processingSessionIds.has(session.id)} resteMs={attenteDe(session.id)} language={language} /> }))} onOpen={(id) => openSession(id, "transcript")} onBack={() => openWorkspaceSection("clients")} onDelete={requestConversationDeletion} onDeleteAll={requestUnassignedDeletion} deletionBusy={deletionBusy} deletingAll={deletionBusy && deletionIntent?.type === "conversations"} />}
        </main>
      ) : null}

      {view === "review" && selectedFolder && !isUnfiledFolder ? (
        <main className={`review-page folder-page${reviewTab === "transcript" ? " review-conversations" : reviewTab === "internal" ? " review-overview" : ""}`} ref={reviewTab === "transcript" && folderConversationDetailOpen ? folderConversationViewport : undefined} data-conversation-detail-open={reviewTab === "transcript" && folderConversationDetailOpen || undefined}>
          {reviewTab === "internal" ? <>
            <div className="review-processing-head" ref={folderProcessingOffset}><FolderProcessingStrip state={folderIntegration} language={language} /></div>
            {folderHeader}
          </> : null}
          <div className="review-sticky-head">
            <FolderProcessingStrip state={reviewTab === "internal" ? null : folderIntegration} language={language} />
            {reviewTab === "internal" ? null : folderHeader}

            <nav className="review-step-nav" aria-label={language === "fr" ? "Vues du dossier" : "Folder views"}>
              <button type="button" aria-pressed={reviewTab === "internal"} className={reviewTab === "internal" ? "active" : ""} onClick={() => setReviewTab("internal")}><span className="review-tab-icon" aria-hidden="true"><LayoutDashboard size={16} strokeWidth={1.6} /></span><span className="review-tab-label">{copy.brief}</span></button>
              <button
                type="button"
                aria-label={`${copy.conversations}, ${folderConversationCountLabel} ${selectedFolderSessions.length === 1 ? "conversation" : "conversations"}`}
                aria-pressed={reviewTab === "transcript"}
                className={reviewTab === "transcript" ? "active" : ""}
                onClick={() => { setReviewTab("transcript"); setConversationDetailSessionId(""); setSelectedSessionId(""); }}
              >
                <span className="review-tab-icon" aria-hidden="true"><MessagesSquare size={16} strokeWidth={1.6} /></span>
                <span className="review-tab-label">{copy.conversations}</span>
                <span className="review-tab-count" aria-hidden="true">{folderConversationCountLabel}</span>
              </button>
              <button type="button" aria-pressed={reviewTab === "client"} className={reviewTab === "client" ? "active" : ""} onClick={() => setReviewTab("client")}><span className="review-tab-icon" aria-hidden="true"><Send size={16} strokeWidth={1.6} /></span><span className="review-tab-label">{copy.followUp}</span></button>
            </nav>
          </div>

          <div className={`review-content-grid${reviewTab === "client" ? " review-followup" : reviewTab === "transcript" ? " review-conversations" : ""}`}>
          <article className={`brief-document ${reviewTab === "transcript" ? "is-transcript-view" : ""}`} tabIndex={reviewTab === "internal" ? 0 : undefined} aria-label={reviewTab === "internal" ? (language === "fr" ? "Aperçu du dossier" : "Folder overview") : undefined}>
              {reviewTab === "internal" ? (
                <div className="internal-summary folder-dashboard">
                    <div className="folder-overview-main">
                      <FolderClientSnapshot clientName={selectedFolder.clientName} language={language} facts={folderFacts} />
                      <div className="folder-overview-shared-row">
                        <FolderBrief brief={folderBrief} legacy={briefSession && !isTripBriefSummary(briefSession.summary) ? briefSession.summary : undefined} language={language} processing={folderProcessing} onStartConversation={() => openSessionSetup(selectedFolder.key)} />
                        <section className="folder-bookmarks" aria-label={language === "fr" ? "Signets du dossier" : "Folder bookmarks"}>
                          <header>
                            <h2 aria-label={`${language === "fr" ? "Signets" : "Bookmarks"}, ${folderBookmarks.length.toLocaleString(uiLocale(language))}`}>
                              <Bookmark size={16} aria-hidden="true" />
                              <span className="folder-bookmarks-title">{language === "fr" ? "Signets" : "Bookmarks"}<span className="folder-bookmarks-count" aria-hidden="true">{folderBookmarks.length.toLocaleString(uiLocale(language))}</span></span>
                            </h2>
                          </header>
                          <div className={!folderBookmarks.length ? "folder-overview-empty-zone" : undefined}>
                            <OfferBookmarks cards={folderBookmarks} language={language} onAddToJourney={openBookmarkJourney} journeyDisabled={!folderJourney.source || folderJourney.loading || folderJourney.saving || folderJourney.generating || Boolean(folderJourney.pendingMutation) || folderProcessing} />
                          </div>
                        </section>
                      </div>
                      {briefSession && isTripBriefSummary(briefSession.summary) ? <details className="folder-context-disclosure" key={selectedFolder.key}>
                        <summary><NotebookTabs size={16} aria-hidden="true" /><span>{language === "fr" ? "À clarifier / Agent" : "To clarify / Agent"}</span><ChevronDown size={15} aria-hidden="true" /></summary>
                        <ReviewSidePanel
                          key={selectedFolder.key} brief={briefSession.summary} notes={reviewNotes} language={language} audio={overviewAudio}
                          scopeLabel={selectedFolder.tripTitle} fusionne conversationCount={selectedFolderSessions.length}
                          onGenerateNotes={generateFolderNotes} onAskAgent={askFolderAgent}
                        />
                      </details> : null}
                    </div>
                </div>
              ) : reviewTab === "client" ? (
                <div className="client-summary-panel">

                  {recapSession?.clientSummary ? (
                    <>
                      <div className="client-summary-toolbar">
                        <span className="client-recap-icon"><MessagesSquare className="workspace-icon" size={20} strokeWidth={1.6} aria-hidden="true" /></span>
                        <div><p>{copy.followUp}</p><h2>{copy.reviewBeforeSending}</h2><span>{copy.editRecipient}</span></div>
                      </div>
                      <section className="email-preview">
                        <label className="email-field"><span>{language === "fr" ? "À :" : "To:"}</span><input type="email" value={recapSession.clientEmail} onChange={(event) => updateClientEmail(event.target.value)} placeholder="client@example.com" /></label>
                        <label className="email-field"><span>{language === "fr" ? "Objet :" : "Subject:"}</span><input value={recapSession.clientSubject ?? ""} readOnly={isGeneratingRecap} onChange={(event) => updateClientSubject(event.target.value)} /></label>
                        <textarea
                          value={recapSession.clientSummary}
                          readOnly={isGeneratingRecap}
                          onChange={(event) => updateClientSummary(event.target.value)}
                          aria-label={language === "fr" ? "Récap client modifiable" : "Editable client recap"}
                        />
                        <div className="share-actions">
                          <button className="secondary-button mobile-icon-action" aria-label={language === "fr" ? "Régénérer le récap" : "Regenerate recap"} type="button" onClick={generateClientSummary} disabled={isGeneratingRecap}>
                            <RefreshCw size={15} /> {isGeneratingRecap ? (language === "fr" ? "Génération…" : "Generating…") : (language === "fr" ? "Régénérer le récap" : "Regenerate recap")}
                          </button>
                          <button className="secondary-button mobile-icon-action" aria-label={language === "fr" ? "Copier le récap" : "Copy recap"} type="button" onClick={copySummary} data-testid="copy-client-recap"><Copy size={15} /> {language === "fr" ? "Copier" : "Copy"}</button>
                          <button
                            className="primary-button mobile-icon-action"
                            aria-label={language === "fr" ? "Envoyer le récap" : "Send recap"}
                            type="button"
                            onClick={sendClientSummary}
                            disabled={isSendingRecap || !recapSession.clientEmail.trim() || !recapSession.clientSubject?.trim()}
                            data-testid="send-client-recap"
                          >
                            <Send size={15} /> {isSendingRecap ? (language === "fr" ? "Envoi…" : "Sending…") : (language === "fr" ? "Envoyer" : "Send")}
                          </button>
                        </div>
                      </section>
                      <div className="recap-footnote">
                        <span className="autosave-label"><Check size={13} /> {language === "fr" ? "Modifications enregistrées" : "Changes saved"}</span>
                        <p>{language === "fr" ? "Rien n’est envoyé automatiquement. L’envoi nécessite une action explicite." : "Nothing is sent automatically. Sending requires an explicit action."}</p>
                      </div>
                    </>
                  ) : isGeneratingRecap ? <SectionSkeleton variant="brief" language={language} label={language === "fr" ? "Préparation du suivi…" : "Preparing follow-up…"} /> : (
                    <EmptyState language={language} className="folder-followup-empty" headingLevel={2} icon={Send} title={recapSession ? copy.prepareFollowUp : copy.followUpAfterConversation} description={recapSession ? copy.draftFollowUp : copy.startFollowUpHint.replace("{name}", selectedFolder.clientName)} action={recapSession ? { label: language === "fr" ? "Préparer le suivi" : "Prepare follow-up", onClick: generateClientSummary, icon: Send, testId: "draft-client-recap" } : { label: copy.startConversation, onClick: () => openSessionSetup(selectedFolder.key), icon: Mic }} />
                  )}
                </div>
              ) : (
                <FolderConversations
                  key={selectedFolder.key}
                  language={language}
                  rows={selectedFolderSessions.map((session) => ({
                    id: session.id,
                    label: conversationLabel(session.id, language, conversationSequence),
                    date: new Intl.DateTimeFormat(language === "fr" ? "fr-CA" : "en-CA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(session.createdAt)),
                    dateTime: session.createdAt,
                    duration: formatDuration(session.duration),
                    status: <SessionLifecycleBadge processing={processingSessionIds.has(session.id)} status={session.status} resteMs={attenteDe(session.id)} language={language} />,
                    processing: processingSessionIds.has(session.id) || etatsReprise.get(session.id)?.etat === "en-traitement",
                    canResume: etatsReprise.get(session.id)?.etat === "reprenable",
                    resuming: resumingSessionId === session.id,
                    deleteDisabled: conversationDeletionBlocked(session),
                  }))}
                  activeId={reviewAudio.activeSessionId}
                  activeReference={folderConversation?.id}
                  detailOpen={folderConversationDetailOpen}
                  onSelect={(id) => openSession(id, "transcript")}
                  onBack={() => { setConversationDetailSessionId(""); setSelectedSessionId(""); }}
                  onResume={(id) => { void reprendreTraitement(id); }}
                  onDelete={requestConversationDeletion}
                  deletionBusy={deletionBusy}
                  onStartConversation={() => openSessionSetup(selectedFolder.key)}
                  transcript={folderConversation?.transcript.length ? <TranscriptPanel
                    key={reviewAudio.activeSessionId}
                    session={reviewAudio.activeSession}
                    language={language}
                    onSeek={reviewAudio.state === "ready" ? reviewAudio.seek : undefined}
                    playingLineId={reviewAudio.playingLineId}
                  /> : folderConversationProcessing ? <SectionSkeleton variant="conversation" language={language} label={language === "fr" ? "Préparation de la transcription…" : "Preparing transcript…"} /> : <EmptyState language={language} compact icon={FileText} title={language === "fr" ? "Aucune transcription enregistrée" : "No saved transcript"} description={copy.noSpokenTranscript} />}
                  player={reviewAudio.state === "loading" ? <SectionSkeleton variant="audio" language={language} label={language === "fr" ? "Chargement de l’audio…" : "Loading audio…"} /> : reviewAudio.state === "ready" ? <AudioDock
                    key={reviewAudio.activeSessionId}
                    src={reviewAudio.src}
                    durationMs={reviewAudio.activeSession ? reviewAudio.activeSession.duration * 1000 : null}
                    onSeekRegister={reviewAudio.registerSeek}
                    onTimeUpdate={reviewAudio.handleTimeUpdate}
                    language={language}
                  /> : reviewAudio.state === "error" ? <p className="folder-conversation-audio-note" role="status">{language === "fr" ? "L’audio n’a pas pu être chargé." : "Audio could not be loaded."}<button type="button" className="secondary-button" onClick={reviewAudio.retry}><RefreshCw size={14} aria-hidden="true" />{language === "fr" ? "Réessayer" : "Retry"}</button></p> : <p className="folder-conversation-audio-note">{language === "fr" ? (folderConversationProcessing ? "L’audio sera disponible après sa sauvegarde." : "Aucun enregistrement audio pour cette conversation.") : (folderConversationProcessing ? "Audio will be available once saved." : "No audio recording for this conversation.")}</p>}
                />
              )}
          </article>
          {reviewTab === "internal" ? <aside className="folder-overview-rail folder-journey-rail" aria-label={language === "fr" ? "Parcours du voyage" : "Trip journey"}>
            <TripJourneyPanel
              language={language} journey={folderJourney.journey} source={folderJourney.source}
              loading={folderJourney.loading} generating={folderJourney.generating} saving={folderJourney.saving} stale={folderJourney.stale} error={folderJourney.error}
              disabled={!folderJourney.source || folderJourney.saving || Boolean(folderJourney.pendingMutation) || folderProcessing || !selectedFolderSessions.length}
              onRetry={() => { void folderJourney.retry().catch(() => {}); }}
              onStartConversation={() => openSessionSetup(selectedFolder.key)}
              onEdit={(entry) => setJourneyDialog({ scopeKey: journeyScopeKey, entry })}
              onToggle={(entry, done) => { void folderJourney.toggleEntry(entry.id, done).catch(() => {}); }}
              onRemove={(entry) => { void folderJourney.removeEntry(entry.id).catch(() => {}); }}
            />
          </aside> : null}
          </div>

        </main>
      ) : null}

      </>}

      {view === "recording" && recordingState === "idle" && sessionStartOpen ? <SessionStartDialog language={language} consent={setup.consent} onConsentChange={(consent) => setSetup((current) => ({ ...current, consent }))} onStart={() => { if (!setup.consent) return; setSessionStartOpen(false); void startSession(setup); }} onDismiss={returnFromConversation} context={setup.tripTitle} /> : null}

      {assignmentSessionId ? <ConversationFilingDialog
        language={language}
        context={[assignmentSession ? conversationLabel(assignmentSession.id, language, conversationSequence) : null, assignmentSession ? formatTime(assignmentSession.duration) : null].filter(Boolean).join(" · ")}
        createOpen={assignmentCreateOpen} onCreateOpenChange={setAssignmentCreateOpen}
        search={assignmentFolderSearch} onSearchChange={setAssignmentFolderSearch}
        fields={{ folderTitle: assignmentFolderTitle, clientName: assignmentClientName, email: assignmentClientEmail, phone: assignmentClientPhone }}
        onFieldChange={(field, value) => { const setters = { folderTitle: setAssignmentFolderTitle, clientName: setAssignmentClientName, email: setAssignmentClientEmail, phone: setAssignmentClientPhone }; setters[field](value); }}
        folders={assignmentFolders.map((folder) => ({ key: folder.key, title: folder.tripTitle, clientName: folder.clientName }))}
        onSelectFolder={assignConversationToFolder} onCreate={createFolderFromConversation} onDismiss={dismissConversationAssignment}
      /> : null}

      {journeyDialog?.scopeKey === journeyScopeKey && view === "review" && !isUnfiledFolder ? <Suspense fallback={null}>
        <TripJourneyEntryDialog
          key={`${journeyScopeKey}:${journeyDialog.entry?.id ?? JSON.stringify(journeyDialog.offer ?? "new")}`}
          language={language} entry={journeyDialog.entry} offer={journeyDialog.offer} offerContext={journeyDialog.offerContext}
          busy={folderJourney.saving} error={journeyDialogError?.dialog === journeyDialog ? journeyDialogError.message : folderJourney.error}
          onClose={() => { if (!folderJourney.saving) { folderJourney.discardPendingMutation(); setJourneyDialog(null); } }}
          onSubmit={(entry) => { void saveJourneyEntry(entry); }}
        />
      </Suspense> : null}

      {deletionIntent && currentUser?.id === deletionIntent.ownerId ? <WorkspaceDeletionDialog
        language={language} type={deletionIntent.type} title={deletionIntent.title}
        count={deletionIntent.type === "folder" ? deletionIntent.folder.sessions.length : deletionIntent.sessions.length}
        busy={deletionBusy}
        onClose={() => {
          if (deletionOperationRef.current) return;
          if (deletionIntent.type === "folder" && !clientFolders.some((folder) => folder.key === deletionIntent.folder.key)) openWorkspaceSection("clients");
          setDeletionIntent(null);
        }}
        onConfirm={() => { void confirmWorkspaceDeletion(); }}
      /> : null}

      {settingsSection && currentUser ? <SettingsDialog key={currentUser.id} language={language} section={settingsSection} onSectionChange={setSettingsSection} onClose={() => setSettingsSection(null)} onLanguageChange={changeLanguage}
        profile={{ name: profile?.display_name ?? currentUser.user_metadata?.full_name ?? currentUser.user_metadata?.name ?? "", email: currentUser.email ?? profile?.email ?? "" }}
        languageError={languageSettingsError ? (language === "fr" ? "La langue n’a pas pu être enregistrée dans votre profil. Réessayez." : "The language could not be saved to your profile. Try again.") : undefined} onRetryLanguage={() => changeLanguage(language)}
        profileBusy={profileSaving} profileError={profileSettingsError ? (language === "fr" ? "Votre profil n’a pas pu être enregistré. Réessayez." : "Your profile could not be saved. Try again.") : undefined} onSaveProfile={(name) => { void saveProfileName(name); }} /> : null}
      <Toast toast={toast} language={language} onDismiss={dismissToast} />
    </div>
  );
}
