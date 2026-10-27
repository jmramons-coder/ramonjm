import type { ClientFolder, ClientOverview, TravelSession } from "./types";

export const UNFILED_FOLDER_KEY = "::unfiled";

/** Folders are persisted trips or actual general conversations, never an empty client. */
export function buildClientFolders(overviews: readonly ClientOverview[], sessions: readonly TravelSession[], labels: { general: string; unfiled: string; unfiledHint: string }): ClientFolder[] {
  const folders: ClientFolder[] = [];
  for (const overview of overviews) {
    const general = overview.sessions.filter((session) => !session.tripId);
    const scopes = [...overview.trips, ...(general.length ? [null] : [])];
    for (const trip of scopes) {
      const members = trip ? overview.sessions.filter((session) => session.tripId === trip.id) : general;
      folders.push({ key: `${overview.client.id}::${trip?.id ?? "general"}`, clientId: overview.client.id,
        tripId: trip?.id, clientName: overview.client.name, clientEmail: overview.client.email,
        tripTitle: trip?.title ?? labels.general, sessions: members, latest: members[0] ?? null });
    }
  }
  const covered = new Set(folders.flatMap((folder) => folder.sessions.map((session) => session.id)));
  const unassigned = sessions.filter((session) => !covered.has(session.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (unassigned.length) folders.push({ key: UNFILED_FOLDER_KEY, clientId: "", clientEmail: "",
    clientName: labels.unfiledHint, tripTitle: labels.unfiled, sessions: unassigned, latest: unassigned[0] });
  return folders.sort((a, b) => new Date(b.latest?.createdAt ?? 0).getTime() - new Date(a.latest?.createdAt ?? 0).getTime());
}
