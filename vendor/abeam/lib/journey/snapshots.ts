import { FolderJourneyError } from "./errors.ts";
import { FOLDER_JOURNEY_KEY, journeyIdentifier, journeyRecord, parseFolderJourney } from "./types.ts";

type Scope = { clientId: string; tripId: string | null };

/** A malformed present snapshot is not an empty journey to overwrite. */
export function scopedJourneySnapshot(passes: unknown, scope: Scope) {
  const map = journeyRecord(passes);
  if (!map || !Object.hasOwn(map, FOLDER_JOURNEY_KEY)) return null;
  const raw = journeyRecord(map[FOLDER_JOURNEY_KEY]);
  // A valid explicit different scope belongs to a former folder assignment.
  // Its contents are never used as evidence for the current folder.
  if (raw && journeyIdentifier(raw.clientId) && (raw.tripId === null || journeyIdentifier(raw.tripId))
    && (raw.clientId !== scope.clientId || raw.tripId !== scope.tripId)) return null;
  const journey = parseFolderJourney(map[FOLDER_JOURNEY_KEY]);
  if (!journey) throw new FolderJourneyError(500, "Le parcours enregistré est invalide. Aucun contenu n’a été remplacé.", "invalid_snapshot");
  return journey;
}

export function selectLatestJourneySnapshot<T extends { id: string; passes: unknown }>(members: readonly T[], scope: Scope) {
  const snapshots = members.flatMap((member) => {
    const journey = scopedJourneySnapshot(member.passes, scope);
    return journey ? [{ member, journey }] : [];
  }).sort((a, b) => b.journey.revision - a.journey.revision || Date.parse(b.journey.updatedAt) - Date.parse(a.journey.updatedAt) || a.member.id.localeCompare(b.member.id));
  const newest = snapshots[0];
  if (!newest) return null;
  const content = JSON.stringify({ ...newest.journey, updatedAt: "" });
  if (snapshots.some((snapshot) => snapshot.journey.revision === newest.journey.revision
    && JSON.stringify({ ...snapshot.journey, updatedAt: "" }) !== content)) {
    throw new FolderJourneyError(409, "Deux versions du parcours ont été enregistrées en même temps. Les deux ont été conservées.", "snapshot_conflict");
  }
  return newest;
}
