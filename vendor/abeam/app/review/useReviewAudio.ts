"use client";

/**
 * useReviewAudio — le dock audio du review, câblé à l'audio DÉJÀ stocké (D3, T2).
 *
 * L'audio vit dans un bucket **privé** (`session-audio`, chemin
 * `${userId}/${sessionId}.ext`). Un `<audio src>` ne peut donc pas pointer
 * dessus : il faut une **URL signée**. Elle est obtenue côté navigateur, par le
 * client Supabase de l'utilisatrice — c'est la politique de stockage existante
 * (`session_audio_select_own_folder`) qui autorise ou refuse, exactement comme
 * pour n'importe quelle lecture. Aucune route serveur nouvelle, aucun secret
 * côté client, aucun élargissement de la surface d'accès.
 *
 * Ce que ce hook résout, et qui n'est pas trivial :
 *
 * • **Un dossier = N conversations = N enregistrements.** Le brief affiché est la
 *   mémoire fusionnée du dossier ; chaque ancre porte donc SA session
 *   (`ancre_session_id`). Cliquer ⟨02:54⟩ sur un champ capté dans une autre
 *   conversation doit **changer la source du dock** puis sauter au moment dit :
 *   c'est le rôle de la file d'attente `pendingSeekRef`. Sans elle, l'ancre
 *   pointerait le bon timecode du mauvais enregistrement — un mensonge (loi 4).
 * • **La position de lecture n'est pas de l'état applicatif.** Le dock la pousse
 *   4 fois par seconde ; on ne la met en state que lorsqu'elle change de TOUR DE
 *   PAROLE, ce qui suffit à surligner le transcript sans re-rendre le brief.
 *
 * Tout ce qui peut être DÉRIVÉ l'est (conversation active, état de l'URL, tour
 * en cours) : le seul effet du hook est l'appel réseau de signature, et il n'y a
 * aucun `setState` synchrone dans un effet.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { ReviewSeek, ReviewSession } from "./types";
import { performReviewSeek, registerReviewSeek, sameReviewAudioIdentity, type RegisteredReviewSeek, type ReviewAudioIdentity } from "./audio-state.ts";

/** Durée de validité de l'URL signée. Une relecture de dossier dure moins d'une heure. */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export type ReviewAudioState = "none" | "loading" | "ready" | "error";

export type ReviewAudio = {
  /** Conversation dont l'audio et le transcript sont affichés à droite. */
  activeSessionId: string;
  selectSession: (sessionId: string) => void;
  activeSession: ReviewSession | null;
  /** Conversations du dossier, la plus récente en tête. */
  sessions: ReviewSession[];
  /** URL signée prête pour `<audio>`, ou `null` (dock désactivé, libellé honnête). */
  src: string | null;
  state: ReviewAudioState;
  /** Redemande une URL signée et invalide immédiatement le résultat précédent. */
  retry: () => void;
  /**
   * Vrai dès qu'UNE conversation du dossier a un enregistrement. C'est la bonne
   * condition pour rendre les ancres cliquables : un champ capté dans une autre
   * conversation reste écoutable même si celle qui est chargée n'a pas d'audio.
   */
  canSeek: boolean;
  /** À passer à `AudioDock.onSeekRegister`. */
  registerSeek: (seek: ((ms: number) => void) | null) => void;
  /** À passer à `AudioDock.onTimeUpdate`. */
  handleTimeUpdate: (ms: number) => void;
  /** À passer aux ancres des phrases du récap et aux tours de transcript. */
  seek: ReviewSeek;
  /** Identifiant du tour de parole en cours de lecture, pour le surlignage. */
  playingLineId: string | null;
};

export type UseReviewAudioOptions = {
  sessions: ReviewSession[];
  /** Account identity prevents a prior owner's signed URL or seek from being reused. */
  scopeKey?: string;
  /** Signe un chemin du bucket privé. Injecté par le parent, qui tient le client Supabase. */
  createSignedUrl: (audioRef: string, expiresIn: number) => Promise<string | null>;
};

/** Une signature appartient à son fichier ET à la tentative qui l'a demandée. */
type SignedAudio = { scopeKey: string; audioRef: string; revision: number; url: string | null };

export function useReviewAudio({ sessions, createSignedUrl, scopeKey = "" }: UseReviewAudioOptions): ReviewAudio {
  const preferredId = useMemo(() => {
    const withAudio = sessions.find((session) => Boolean(session.audioRef));
    return withAudio?.id ?? sessions[0]?.id ?? "";
  }, [sessions]);

  const [requested, setRequested] = useState<ReviewAudioIdentity | null>(null);
  const [signed, setSigned] = useState<SignedAudio | null>(null);
  const [signatureRevision, setSignatureRevision] = useState(0);
  const [playing, setPlaying] = useState<{ scopeKey: string; sessionId: string; lineId: string } | null>(null);
  const currentScopeRef = useRef(scopeKey);
  const seekRef = useRef<RegisteredReviewSeek | null>(null);
  const pendingSeekRef = useRef<(ReviewAudioIdentity & { ms: number }) | null>(null);

  // Invalidate imperative commands before the new account's player effects.
  // No React state is changed here: source selection remains derived below.
  useLayoutEffect(() => {
    currentScopeRef.current = scopeKey;
    if (seekRef.current?.scopeKey !== scopeKey) seekRef.current = null;
    if (pendingSeekRef.current?.scopeKey !== scopeKey) pendingSeekRef.current = null;
  }, [scopeKey]);

  // Conversation active : DÉRIVÉE. Un identifiant devenu orphelin (autre dossier,
  // conversation supprimée) retombe sur le défaut sans passer par un effet.
  const requestedId = requested?.scopeKey === scopeKey ? requested.sessionId : null;
  const activeSessionId = requestedId && sessions.some((session) => session.id === requestedId)
    ? requestedId
    : preferredId;

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, sessions],
  );

  const audioRef = activeSession?.audioRef ?? null;

  // Le seul effet du hook : demander la signature. L'état visible en est dérivé.
  useEffect(() => {
    if (!audioRef) return undefined;

    let cancelled = false;
    void (async () => {
      try {
        const url = await createSignedUrl(audioRef, SIGNED_URL_TTL_SECONDS);
        if (!cancelled && currentScopeRef.current === scopeKey) setSigned({ scopeKey, audioRef, revision: signatureRevision, url: url ?? null });
      } catch {
        if (!cancelled && currentScopeRef.current === scopeKey) setSigned({ scopeKey, audioRef, revision: signatureRevision, url: null });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [audioRef, createSignedUrl, signatureRevision, scopeKey]);

  const matched = audioRef && signed?.scopeKey === scopeKey && signed.audioRef === audioRef && signed.revision === signatureRevision ? signed : null;
  const src = matched?.url ?? null;
  const state: ReviewAudioState = !audioRef ? "none" : !matched ? "loading" : matched.url ? "ready" : "error";
  const retry = useCallback(() => setSignatureRevision((revision) => revision + 1), []);

  useEffect(() => {
    const pending = pendingSeekRef.current;
    if (pending && (pending.scopeKey !== scopeKey || !sessions.some((session) => session.id === pending.sessionId))) {
      pendingSeekRef.current = null;
    }
  }, [sessions, scopeKey]);

  const registerSeek = useCallback((next: ((ms: number) => void) | null) => {
    const identity = { scopeKey, sessionId: activeSessionId };
    if (next && (currentScopeRef.current !== scopeKey || !activeSessionId || !sessions.some((session) => session.id === activeSessionId))) return;
    seekRef.current = registerReviewSeek(seekRef.current, identity, next);
    if (!next) return;
    const pending = pendingSeekRef.current;
    if (pending === null) return;
    if (pending.scopeKey !== scopeKey || !sessions.some((session) => session.id === pending.sessionId)) {
      pendingSeekRef.current = null;
      return;
    }
    if (!sameReviewAudioIdentity(pending, identity)) return;
    pendingSeekRef.current = null;
    next(pending.ms);
  }, [activeSessionId, sessions, scopeKey]);

  const seek = useCallback<ReviewSeek>(
    (ms, sessionId) => {
      if (currentScopeRef.current !== scopeKey || !Number.isFinite(ms)) return;
      const position = Math.max(0, ms);
      const targetSessionId = sessionId ?? activeSessionId;
      if (!targetSessionId || !sessions.some((session) => session.id === targetSessionId)) return;
      if (sessionId && sessionId !== activeSessionId) {
        // L'ancre appartient à une autre conversation : on charge son
        // enregistrement, et le saut part dès que le dock est remonté.
        pendingSeekRef.current = { scopeKey, sessionId: targetSessionId, ms: position };
        setRequested({ scopeKey, sessionId });
        return;
      }
      if (!performReviewSeek(seekRef.current, { scopeKey, sessionId: targetSessionId }, position)) {
        // A brief anchor can be clicked while its player is still mounting.
        // Keep the position until the dock registers its seek handler.
        pendingSeekRef.current = { scopeKey, sessionId: targetSessionId, ms: position };
        return;
      }
    },
    [activeSessionId, sessions, scopeKey],
  );

  const selectSession = useCallback((sessionId: string) => {
    if (currentScopeRef.current !== scopeKey) return;
    pendingSeekRef.current = null;
    if (!sameReviewAudioIdentity(seekRef.current, { scopeKey, sessionId: sessionId || preferredId })) seekRef.current = null;
    setPlaying(null);
    // Cross-folder opening selects before the new folder's sessions render.
    // Membership is deliberately validated when deriving activeSessionId.
    setRequested({ scopeKey, sessionId });
  }, [preferredId, scopeKey]);

  // Tour de parole en cours : recalculé à chaque `timeupdate`, mais mis en state
  // seulement quand il CHANGE (sinon 4 re-rendus par seconde pour rien).
  const handleTimeUpdate = useCallback(
    (ms: number) => {
      if (currentScopeRef.current !== scopeKey) return;
      const lines = activeSession?.transcript ?? [];
      if (lines.length === 0 || !activeSession) return;

      let lineId: string | null = null;
      for (const line of lines) {
        const startMs = typeof line.startMs === "number" && Number.isFinite(line.startMs)
          ? line.startMs
          : Math.max(0, line.time * 1000);
        if (startMs <= ms + 250) lineId = line.id;
        else break;
      }

      setPlaying((previous) => {
        if (previous?.scopeKey === scopeKey && previous.sessionId === activeSession.id && previous.lineId === lineId) return previous;
        return lineId ? { scopeKey, sessionId: activeSession.id, lineId } : null;
      });
    },
    [activeSession, scopeKey],
  );

  return {
    activeSessionId,
    selectSession,
    activeSession,
    sessions,
    src,
    state,
    retry,
    canSeek: sessions.some((session) => Boolean(session.audioRef)),
    registerSeek,
    handleTimeUpdate,
    seek,
    // Le surlignage n'appartient qu'à la conversation chargée : on ne surligne
    // jamais un tour d'un autre enregistrement.
    playingLineId: playing?.scopeKey === scopeKey && playing.sessionId === activeSessionId ? playing.lineId : null,
  };
}

export default useReviewAudio;
