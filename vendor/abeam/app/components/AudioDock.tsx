"use client";

/**
 * AudioDock — le dock lecteur persistant (T2, répare D3 ; §6.2).
 *
 * On paie déjà le stockage de l'audio et l'agent n'y a jamais accès. Ce dock
 * rejoue le fichier existant : temps écoulé/total, play/pause, ±10 s,
 * vitesse 1× / 1,5× / 2×, barre de progression cliquable.
 *
 * ── Le seek impératif (décision) ─────────────────────────────────────────────
 * `ProvenanceChip` doit pouvoir piloter le dock sans que l'état de lecture
 * remonte dans l'arbre : une position d'écoute n'est pas de l'état applicatif,
 * et la faire transiter par un state React ferait re-rendre le brief 4 fois par
 * seconde. Le dock expose donc la commande, jamais la position :
 *
 *   • `ref` → `AudioDockHandle` (`seek` / `play` / `pause` / `toggle` / `currentMs`)
 *     pour un parent qui tient une ref ;
 *   • `onSeekRegister(seek)` pour un parent qui doit **passer** la fonction plus
 *     bas (le cas réel du brief : chaque champ reçoit `onSeek`). Appelé avec
 *     `null` au démontage / changement de source, pour qu'aucune pastille ne
 *     garde une poignée morte.
 *
 * `seek()` lance aussi la lecture : cliquer ⟨02:54⟩ veut dire « fais-moi
 * entendre ça », pas « déplace un curseur ». Le clic est le geste utilisateur
 * qui autorise l'autoplay.
 *
 * `src === null` → dock désactivé avec un libellé honnête. Aucun faux lecteur,
 * aucune barre de progression décorative (loi 4).
 */

import { AudioLines, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
} from "react";

import { formatTimecode } from "@/lib/ui/provenance";
import type { UILanguage } from "@/lib/ui/language";
import { releaseReviewMediaElement } from "../review/audio-state.ts";

import "./components.css";

/** Les trois vitesses retenues (§4 T2). Pas de 0,75× : personne ne ralentit une consultation. */
export const AUDIO_DOCK_SPEEDS = [1, 1.5, 2] as const;
export type AudioDockSpeed = (typeof AUDIO_DOCK_SPEEDS)[number];

/** Le saut ±, en millisecondes. */
const SKIP_MS = 10_000;

/** Commande impérative exposée au parent. */
export type AudioDockHandle = {
  /** Positionne la lecture et démarre. */
  seek: (ms: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  /** Position courante, lue à la demande (jamais poussée en state du parent). */
  currentMs: () => number;
};

export type AudioDockProps = {
  /** URL du fichier audio. `null` → dock désactivé, libellé honnête. */
  src: string | null;
  /** Durée connue d'avance (ms), utilisée avant que les métadonnées arrivent. */
  durationMs?: number | null;
  /**
   * Reçoit la fonction de seek à monter, `null` au démontage.
   * Le parent la transmet ensuite aux `ProvenanceChip`.
   */
  onSeekRegister?: (seek: ((ms: number) => void) | null) => void;
  /** Notification de position, si le parent veut synchroniser le transcript. */
  onTimeUpdate?: (ms: number) => void;
  /** Libellé de contexte à gauche du dock (ex. « Rencontre du 6 août »). */
  title?: string;
  /** Langue des libellés. Défaut : `fr`. */
  language?: UILanguage;
  className?: string;
};

const COPY = {
  fr: {
    region: "Lecteur audio de la conversation",
    empty: "Aucun enregistrement audio pour cette conversation.",
    error: "Lecture impossible : le fichier audio n'a pas pu être chargé.",
    loading: "Chargement de l'audio…",
    play: "Lire",
    pause: "Pause",
    back: "Reculer de 10 secondes",
    forward: "Avancer de 10 secondes",
    scrub: "Position de lecture",
    speeds: "Vitesse de lecture",
    speed: (value: AudioDockSpeed) => `${String(value).replace(".", ",")}×`,
    position: (current: string, total: string) => `${current} sur ${total}`,
  },
  en: {
    region: "Conversation audio player",
    empty: "No audio recording for this conversation.",
    error: "Playback unavailable: the audio file could not be loaded.",
    loading: "Loading audio…",
    play: "Play",
    pause: "Pause",
    back: "Back 10 seconds",
    forward: "Forward 10 seconds",
    scrub: "Playback position",
    speeds: "Playback speed",
    speed: (value: AudioDockSpeed) => `${value}×`,
    position: (current: string, total: string) => `${current} of ${total}`,
  },
} as const;

export const AudioDock = forwardRef<AudioDockHandle, AudioDockProps>(function AudioDock(
  { src, durationMs = null, onSeekRegister, onTimeUpdate, title, language = "fr", className },
  ref,
) {
  const copy = COPY[language];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [metaDurationMs, setMetaDurationMs] = useState<number | null>(null);
  const [speed, setSpeed] = useState<AudioDockSpeed>(1);
  const hasSource = Boolean(src);

  useEffect(() => {
    const mountedAudio = audioRef.current;
    return () => {
      // Capture this node at mount. React may already have assigned a new
      // source/node by cleanup; never clear a replacement player's source.
      if (mountedAudio) releaseReviewMediaElement(mountedAudio);
    };
  }, [hasSource]);

  const totalMs = metaDurationMs ?? (typeof durationMs === "number" && Number.isFinite(durationMs) ? durationMs : 0);

  // Nouvelle source → on repart de zéro plutôt que d'afficher le temps de la précédente.
  useEffect(() => {
    setPlaying(false);
    setReady(false);
    setFailed(false);
    setPositionMs(0);
    setMetaDurationMs(null);
  }, [src]);

  /**
   * Adopte l'état réel de l'élément média. Indispensable : quand le fichier est
   * déjà en cache (retour sur un dossier consulté), `loadedmetadata` a déjà eu
   * lieu avant que React n'attache ses gestionnaires — sans cette lecture
   * impérative, le dock resterait « en chargement » et ses boutons désactivés
   * alors que l'audio est prêt.
   */
  const syncFromElement = useCallback((audio: HTMLAudioElement) => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) setMetaDurationMs(audio.duration * 1000);
    if (audio.readyState >= 1) {
      setReady(true);
      setFailed(false);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && src) syncFromElement(audio);
  }, [src, syncFromElement]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed, ready]);

  const applyPosition = useCallback(
    (ms: number) => {
      setPositionMs(ms);
      onTimeUpdate?.(ms);
    },
    [onTimeUpdate],
  );

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    void audio.play().catch(() => setPlaying(false));
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) play();
    else audio.pause();
  }, [play]);

  const seek = useCallback(
    (ms: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const seconds = Math.max(0, ms / 1000);
      audio.currentTime = Number.isFinite(audio.duration) && audio.duration > 0 ? Math.min(seconds, audio.duration) : seconds;
      applyPosition(audio.currentTime * 1000);
      play();
    },
    [applyPosition, play],
  );

  const skip = useCallback(
    (deltaMs: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const next = Math.max(0, audio.currentTime * 1000 + deltaMs);
      audio.currentTime = Number.isFinite(audio.duration) && audio.duration > 0 ? Math.min(next / 1000, audio.duration) : next / 1000;
      applyPosition(audio.currentTime * 1000);
    },
    [applyPosition],
  );

  useImperativeHandle(ref, () => ({
    seek,
    play,
    pause,
    toggle,
    currentMs: () => (audioRef.current ? audioRef.current.currentTime * 1000 : 0),
  }), [pause, play, seek, toggle]);

  // Le callback du parent vit dans une ref : on ne veut pas ré-enregistrer le
  // seek à chaque rendu du parent, seulement quand la commande change vraiment.
  const registerRef = useRef(onSeekRegister);
  useEffect(() => {
    registerRef.current = onSeekRegister;
  }, [onSeekRegister]);
  useEffect(() => {
    const register = registerRef.current;
    if (!register) return undefined;
    register(src ? seek : null);
    return () => register(null);
  }, [seek, src]);

  const handleScrub = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const audio = audioRef.current;
      const next = Number(event.target.value);
      if (!audio || !Number.isFinite(next)) return;
      audio.currentTime = next / 1000;
      applyPosition(next);
    },
    [applyPosition],
  );

  const classes = ["ab-dock", className].filter(Boolean).join(" ");

  if (!src) {
    return (
      <section className={classes} data-state="empty" aria-label={copy.region}>
        <AudioLines className="ab-icon" aria-hidden="true" />
        <p className="ab-dock-message" role="status">
          {copy.empty}
        </p>
      </section>
    );
  }

  const state = failed ? "error" : ready ? "ready" : "loading";
  const currentLabel = formatTimecode(positionMs);
  const totalLabel = totalMs > 0 ? formatTimecode(totalMs) : "--:--";

  return (
    <section className={classes} data-state={state} aria-label={copy.region} aria-busy={state === "loading"}>
      {/* Lecteur natif piloté par le dock : les contrôles visibles sont les nôtres. */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        hidden
        onLoadedMetadata={(event) => {
          event.currentTarget.playbackRate = speed;
          syncFromElement(event.currentTarget);
        }}
        onDurationChange={(event) => syncFromElement(event.currentTarget)}
        onCanPlay={(event) => syncFromElement(event.currentTarget)}
        onTimeUpdate={(event) => applyPosition(event.currentTarget.currentTime * 1000)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => {
          setFailed(true);
          setReady(false);
          setPlaying(false);
        }}
      />

      {title ? <span className="ab-dock-title">{title}</span> : null}

      {failed ? (
        <p className="ab-dock-message" role="status">
          {copy.error}
        </p>
      ) : (
        <>
          <div className="ab-dock-transport">
            <button
              type="button"
              className="ab-icon-button ab-dock-play"
              onClick={toggle}
              disabled={!ready}
              aria-label={playing ? copy.pause : copy.play}
              title={playing ? copy.pause : copy.play}
            >
              {playing ? <Pause className="ab-icon" aria-hidden="true" /> : <Play className="ab-icon" aria-hidden="true" />}
            </button>
            <button
              type="button"
              className="ab-icon-button"
              onClick={() => skip(-SKIP_MS)}
              disabled={!ready}
              aria-label={copy.back}
              title={copy.back}
            >
              <SkipBack className="ab-icon" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="ab-icon-button"
              onClick={() => skip(SKIP_MS)}
              disabled={!ready}
              aria-label={copy.forward}
              title={copy.forward}
            >
              <SkipForward className="ab-icon" aria-hidden="true" />
            </button>
          </div>

          <span className="ab-dock-time">
            {currentLabel}
            <span aria-hidden="true"> / </span>
            <span className="ab-dock-total">{totalLabel}</span>
          </span>

          <input
            type="range"
            className="ab-dock-scrub"
            // La portion écoutée est peinte par le CSS : la position se lit du coin de l'œil.
            style={{ "--ab-progress": `${(totalMs > 0 ? Math.min(1, positionMs / totalMs) * 100 : 0).toFixed(2)}%` } as CSSProperties}
            min={0}
            max={totalMs > 0 ? Math.round(totalMs) : 0}
            step={250}
            value={Math.min(Math.round(positionMs), totalMs > 0 ? Math.round(totalMs) : 0)}
            onChange={handleScrub}
            disabled={!ready || totalMs <= 0}
            aria-label={copy.scrub}
            aria-valuetext={copy.position(currentLabel, totalLabel)}
          />

          <select
            className="ab-dock-speed-select"
            aria-label={copy.speeds}
            value={speed}
            onChange={(event) => setSpeed(AUDIO_DOCK_SPEEDS.find((value) => value === Number(event.target.value)) ?? 1)}
            disabled={!ready}
          >
            {AUDIO_DOCK_SPEEDS.map((value) => <option key={value} value={value}>{copy.speed(value)}</option>)}
          </select>

          <div className="ab-dock-speeds" role="group" aria-label={copy.speeds}>
            {AUDIO_DOCK_SPEEDS.map((value) => (
              <button
                key={value}
                type="button"
                className="ab-text-button ab-dock-speed"
                aria-pressed={speed === value}
                onClick={() => setSpeed(value)}
                disabled={!ready}
              >
                {copy.speed(value)}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
});

export default AudioDock;
