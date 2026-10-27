import type { UILanguage } from "../../lib/ui/language.ts";
import type { ClientFolder } from "./types.ts";

export type FolderSortKey = "name" | "client" | "conversations" | "latest";
export type FolderSort = { key: FolderSortKey; direction: "ascending" | "descending" };
export const DEFAULT_FOLDER_SORT: FolderSort = Object.freeze({ key: "latest", direction: "descending" });

export function nextFolderSort(previous: FolderSort, key: FolderSortKey): FolderSort {
  return {
    key,
    direction: previous.key === key
      ? (previous.direction === "ascending" ? "descending" : "ascending")
      : (key === "name" || key === "client" ? "ascending" : "descending"),
  };
}

/** Accept real ISO calendar dates/timestamps; never guess a missing time zone. */
export function folderLatestTime(folder: ClientFolder): number | null {
  const value = folder.latest?.createdAt.trim();
  if (!value) return null;
  const parts = /^(\d{4})-(\d{2})-(\d{2})(?:T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,9})?)?(?:Z|[+-](?:[01]\d|2[0-3]):?[0-5]\d))?$/.exec(value);
  if (!parts) return null;
  const [, yearText, monthText, dayText] = parts;
  const year = Number(yearText), month = Number(monthText), day = Number(dayText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > monthDays[month - 1]) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

/** Sort copies only; unknown dates stay last and ties use title/key ascending. */
export function sortFolders(folders: readonly ClientFolder[], sort: FolderSort, language: UILanguage): ClientFolder[] {
  const collator = new Intl.Collator(language === "fr" ? "fr-CA" : "en-CA", { numeric: true, sensitivity: "base" });
  const direction = sort.direction === "ascending" ? 1 : -1;
  const times = sort.key === "latest" ? new Map(folders.map((folder) => [folder, folderLatestTime(folder)])) : null;
  return [...folders].sort((a, b) => {
    let comparison: number;
    switch (sort.key) {
      case "name": comparison = collator.compare(a.tripTitle, b.tripTitle); break;
      case "client": comparison = collator.compare(a.clientName, b.clientName); break;
      case "conversations": comparison = a.sessions.length - b.sessions.length; break;
      case "latest": {
        const aTime = times!.get(a) ?? null;
        const bTime = times!.get(b) ?? null;
        if (aTime === null && bTime !== null) return 1;
        if (aTime !== null && bTime === null) return -1;
        comparison = aTime === null || bTime === null ? 0 : aTime - bTime;
        break;
      }
    }
    return comparison * direction || collator.compare(a.tripTitle, b.tripTitle) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  });
}
