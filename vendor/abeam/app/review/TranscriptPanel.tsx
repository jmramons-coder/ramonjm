"use client";

/**
 * TranscriptPanel — la PREUVE, à côté de la compréhension (T3, répare D5).
 *
 * C'est le motif central relevé chez Fireflies : le document (ce que la machine a
 * compris) et le transcript (ce qu'elle a entendu) sont visibles EN MÊME TEMPS,
 * sans modale et sans changer de page. Ici la preuve est en plus :
 *
 * • **cherchable** — la recherche filtre les tours et surligne l'occurrence ;
 *   c'est le premier bout de D4 (« aucune recherche ») qui tombe ;
 * • **cliquable** — un tour = un bouton = un saut du dock audio. Chaque tour
 *   porte son `startMs` exact quand le STT l'a fourni, sinon la seconde arrondie
 *   (dégradé mais honnête, jamais faux à la minute) ;
 * • **suivie** — le tour en cours de lecture est marqué, pour ne pas perdre sa
 *   place quand on écoute en lisant.
 *
 * Les notes privées de l'agente restent affichées mais marquées comme telles :
 * elles ne sont pas de la parole du client et ne doivent jamais se lire comme
 * telle.
 */

import { defineBilingualCopy } from "@/lib/ui/copy";
import { uiLocale } from "@/lib/ui/language";
import { LockKeyhole, Play, Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import EmptyState from "@/app/components/EmptyState";
import { formatTimecode } from "@/lib/ui/provenance";

import type { ReviewLanguage, ReviewSession, ReviewTranscriptLine } from "./types";

import "./transcript-chat.css";

const COPY = defineBilingualCopy({
  fr: {
    search: "Rechercher dans la transcription",
    searchPlaceholder: "Rechercher un mot dit…",
    matches: (count: number) => `${new Intl.NumberFormat(uiLocale("fr")).format(count)} ${count === 1 ? "correspondance" : "correspondances"}`,
    noMatch: "Aucun tour ne contient ce mot",
    noMatchHint: "Essayez un autre mot, ou effacez la recherche.",
    empty: "Aucune transcription",
    emptyHint: "Cette conversation n'a pas de transcription enregistrée.",
    privateNote: "Note privée",
    advisor: "Conseillère",
    client: "Client",
    conversation: "Conversation",
    listen: "Écouter ce passage",
    playing: "Lecture",
  },
  en: {
    search: "Search the transcript",
    searchPlaceholder: "Search a spoken word…",
    matches: (count: number) => `${new Intl.NumberFormat(uiLocale("en")).format(count)} ${count === 1 ? "match" : "matches"}`,
    noMatch: "No turn contains that word",
    noMatchHint: "Try another word, or clear the search.",
    empty: "No transcript",
    emptyHint: "This conversation has no stored transcript.",
    privateNote: "Private note",
    advisor: "Advisor",
    client: "Client",
    conversation: "Conversation",
    listen: "Listen to this passage",
    playing: "Playing",
  },
});

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Début exact du tour, ou repli sur la seconde arrondie (transcripts historiques). */
export function lineStartMs(line: ReviewTranscriptLine) {
  return typeof line.startMs === "number" && Number.isFinite(line.startMs)
    ? Math.max(0, Math.round(line.startMs))
    : Math.max(0, Math.round(line.time * 1000));
}

/** Surligne l'occurrence recherchée sans jamais réécrire le texte dit. */
function highlight(text: string, query: string): ReactNode {
  if (!query) return text;
  const haystack = normalize(text);
  const needle = normalize(query);
  if (!needle || !haystack.includes(needle)) return text;

  const parts: ReactNode[] = [];
  let cursor = 0;
  let found = haystack.indexOf(needle, cursor);
  while (found !== -1) {
    if (found > cursor) parts.push(text.slice(cursor, found));
    parts.push(
      <mark className="rv-mark" key={`${found}-${parts.length}`}>
        {text.slice(found, found + needle.length)}
      </mark>,
    );
    cursor = found + needle.length;
    found = haystack.indexOf(needle, cursor);
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

export type TranscriptPanelProps = {
  session: ReviewSession | null;
  language: ReviewLanguage;
  /** Saut audio sur le tour cliqué. Absent → tours non cliquables (pas de faux bouton). */
  onSeek?: (ms: number, sessionId?: string | null) => void;
  /** Tour en cours de lecture, fourni par le dock. */
  playingLineId?: string | null;
};

export function TranscriptPanel({ session, language, onSeek, playingLineId = null }: TranscriptPanelProps) {
  const copy = COPY[language];
  const [query, setQuery] = useState("");

  const lines = useMemo(() => session?.transcript ?? [], [session]);
  const trimmed = query.trim();

  const visible = useMemo(() => {
    if (!trimmed) return lines;
    const needle = normalize(trimmed);
    return lines.filter((line) => normalize(line.text).includes(needle));
  }, [lines, trimmed]);

  const speakerLabel = (line: ReviewTranscriptLine) => {
    if (line.kind === "private-note") return copy.privateNote;
    if (line.speaker === "Advisor") return copy.advisor;
    if (line.speaker === "Client") return copy.client;
    return copy.conversation;
  };

  if (!session || lines.length === 0) {
    return (
      <div className="rv-pane-body rv-transcript-chat">
        <EmptyState variant="compact" icon={Search} title={copy.empty} description={copy.emptyHint} language={language} />
      </div>
    );
  }

  return (
    <div className="rv-pane-body rv-transcript-chat">
      <div className="rv-search">
        <label className="rv-search-field">
          <Search className="ab-icon ab-icon-sm" aria-hidden="true" />
          <span className="ab-sr-only">{copy.search}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
          />
        </label>
        {trimmed ? <span className="rv-search-count" role="status">{copy.matches(visible.length)}</span> : null}
      </div>

      {visible.length === 0 ? (
        <EmptyState variant="compact" icon={Search} title={copy.noMatch} description={copy.noMatchHint} language={language} />
      ) : (
        <div className="rv-turns rv-chat-thread ab-scroll-y">
          {visible.map((line) => {
            const startMs = lineStartMs(line);
            const timecode = formatTimecode(startMs);
            const speaker = line.speaker === "Client" ? "client" : line.speaker === "Advisor" ? "advisor" : "conversation";
            const privateNote = line.kind === "private-note";
            const playing = playingLineId === line.id;
            const body = (
              <>
                <span className="rv-turn-meta">
                  <strong>{privateNote ? <LockKeyhole size={12} aria-hidden="true" /> : null}{speakerLabel(line)}</strong>
                  <time>{timecode}</time>
                  {playing ? <span className="rv-chat-playing"><Play size={10} aria-hidden="true" />{copy.playing}</span> : null}
                </span>
                <span className="rv-turn-text">{highlight(line.text, trimmed)}</span>
              </>
            );

            const className = [
              "rv-turn",
              "rv-chat-message",
              privateNote ? "is-note" : `is-${speaker}`,
              playing ? "is-playing" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return onSeek ? (
              <button
                key={line.id}
                type="button"
                className={className}
                data-speaker={speaker}
                data-kind={privateNote ? "private-note" : "speech"}
                onClick={() => onSeek(startMs, session.id)}
                title={`${copy.listen} — ${timecode}`}
                aria-current={playing ? "true" : undefined}
              >
                {body}
              </button>
            ) : (
              <article key={line.id} className={className} data-speaker={speaker} data-kind={privateNote ? "private-note" : "speech"} aria-current={playing ? "true" : undefined}>
                {body}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TranscriptPanel;
