/** Shared `mm:ss`, or `h:mm:ss` beyond an hour, without a UI dependency. */
export function formatTimecode(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/** An explicit, finite anchor includes the beginning of the recording. */
export function hasAncre(ancreMs: number | null | undefined): ancreMs is number {
  return typeof ancreMs === "number" && Number.isFinite(ancreMs) && ancreMs >= 0;
}
