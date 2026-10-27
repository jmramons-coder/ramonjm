import { parseNotesAgent } from "../../lib/notes-agent/parse.ts";
import { conversationBookmarksFromPasses } from "../../lib/conversation/bookmarks.ts";
import type { UILanguage } from "../../lib/ui/language.ts";
import type { NotesAgent } from "@/lib/notes-agent/types";
import { buildSummary, isTripBriefSummary } from "./summary.ts";
import type { ClientRecord, ClientRow, SessionRow, SessionSetup, TravelSession, TripRecord, TripRow } from "./types.ts";

export function clientFromRow(row: ClientRow): ClientRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isPlaceholder: row.is_placeholder,
  };
}

export function tripFromRow(row: TripRow): TripRecord {
  return {
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Read current and historical note columns through the same validator. */
function notesFromRow(row: SessionRow): NotesAgent | null {
  return parseNotesAgent(row.notes_agent) ?? parseNotesAgent(row.notes);
}

export function sessionFromRow(row: SessionRow, language: UILanguage = "en"): TravelSession {
  const setup: SessionSetup = {
    clientId: row.client_id ?? undefined,
    tripId: row.trip_id ?? undefined,
    clientName: row.client_name,
    clientEmail: row.client_email,
    tripTitle: row.trip_title,
    consent: row.consent,
    mode: row.capture_mode,
  };

  return {
    id: row.id,
    clientId: row.client_id ?? undefined,
    tripId: row.trip_id ?? undefined,
    clientName: row.client_name,
    clientEmail: row.client_email,
    tripTitle: row.trip_title,
    createdAt: row.created_at,
    duration: row.duration,
    transcript: row.transcript,
    summary: row.brief ?? buildSummary(row.transcript, setup, language),
    clientSummary: row.client_summary,
    clientSubject: row.client_subject ?? undefined,
    captureMode: row.capture_mode,
    consent: row.consent,
    audioRef: row.audio_ref,
    natureConversation: row.nature_conversation,
    suggestions: row.suggestions ?? null,
    bookmarks: conversationBookmarksFromPasses(row.passes),
    notes: notesFromRow(row),
    // Toute valeur inattendue (colonne absente, état inconnu) se lit « prete » :
    // le pire qu'on risque est de ne PAS afficher un badge de reprise, jamais
    // d'en inventer un sur une session saine.
    status: row.status === "en_cours" || row.status === "interrompue" || row.status === "traitement" || row.status === "transcrit"
      ? row.status
      : "prete",
    updatedAt: row.updated_at ?? undefined,
  };
}

export function clientToRow(client: ClientRecord, agencyId: string) {
  return {
    id: client.id,
    agency_id: agencyId,
    name: client.name,
    email: client.email,
    phone: client.phone ?? null,
    notes: client.notes ?? null,
    is_placeholder: Boolean(client.isPlaceholder),
    created_at: client.createdAt,
    updated_at: client.updatedAt,
  };
}

export function tripToRow(trip: TripRecord) {
  return {
    id: trip.id,
    client_id: trip.clientId,
    title: trip.title,
    status: trip.status,
    created_at: trip.createdAt,
    updated_at: trip.updatedAt,
  };
}

export function sessionToRow(session: TravelSession, ownerId: string) {
  return {
    id: session.id,
    owner_id: ownerId,
    client_id: session.clientId ?? null,
    trip_id: session.tripId ?? null,
    client_name: session.clientName,
    client_email: session.clientEmail,
    trip_title: session.tripTitle,
    created_at: session.createdAt,
    duration: session.duration,
    capture_mode: session.captureMode,
    consent: Boolean(session.consent),
    audio_ref: session.audioRef ?? null,
    transcript: session.transcript,
    brief: session.summary,
    client_summary: session.clientSummary,
    client_subject: session.clientSubject ?? null,
    // Dérivé du brief, PAS du champ local. `/api/extract` écrit la bonne valeur
    // côté serveur, puis cet upsert réécrivait toute la ligne avec
    // `session.natureConversation` — que rien ne renseigne à la sauvegarde. Le
    // serveur était donc écrasé par `null` sur 100 % des lignes, et comme
    // `sessionFromRow` relisait ce `null`, ça ne guérissait jamais.
    //
    // C'est la DEUXIÈME fois que l'effet de persistance du navigateur écrase une
    // donnée écrite par le serveur (la première a semé 21 dossiers de démo). La
    // parade est la même : ne pas faire confiance à un champ local que personne
    // ne remplit, et dériver de la source de vérité — ici le brief lui-même.
    nature_conversation:
      (isTripBriefSummary(session.summary) ? session.summary.meta.nature_conversation : null)
      ?? session.natureConversation
      ?? null,
    suggestions: session.suggestions ?? null,
    // `passes` belongs to owner-scoped CAS writers. Bookmarks never echo the
    // loaded whole map through this upsert, which could erase a server result.
    // `status` et `updated_at` sont VOLONTAIREMENT absents : ils appartiennent
    // au cycle de vie (démarrage, flush, finalisation), jamais à l'écho de
    // l'état local. C'est la TROISIÈME fois que la question se pose (voir
    // `nature_conversation` ci-dessus et les dossiers de démo) : un upsert
    // navigateur qui porte une colonne écrite par ailleurs finit toujours par
    // l'écraser avec une valeur périmée. Un champ omis d'un upsert n'est pas
    // touché — c'est la protection.
    //
    // Et `updatedAt` sur `TravelSession` n'entre PAS ici non plus : c'est une
    // LECTURE (le battement de cœur, pour juger de la fraîcheur), jamais une
    // écriture. Le renvoyer écraserait le battement d'une rencontre vivante
    // avec la valeur qu'un chargement a lue il y a peut-être une heure — soit
    // la QUATRIÈME occurrence exacte du même piège.
  };
}
