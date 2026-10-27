export type ReviewAudioIdentity = { scopeKey: string; sessionId: string };
export type RegisteredReviewSeek = ReviewAudioIdentity & { seek: (ms: number) => void };

export function sameReviewAudioIdentity(a: ReviewAudioIdentity | null, b: ReviewAudioIdentity): boolean {
  return Boolean(a && a.scopeKey === b.scopeKey && a.sessionId === b.sessionId);
}

/** A departing player's cleanup cannot erase another session/owner's handler. */
export function registerReviewSeek(
  current: RegisteredReviewSeek | null,
  identity: ReviewAudioIdentity,
  next: ((ms: number) => void) | null,
): RegisteredReviewSeek | null {
  if (next) return { ...identity, seek: next };
  return sameReviewAudioIdentity(current, identity) ? null : current;
}

/** Never apply an anchor to a handler from the previous source or account. */
export function performReviewSeek(current: RegisteredReviewSeek | null, identity: ReviewAudioIdentity, ms: number): boolean {
  if (!sameReviewAudioIdentity(current, identity)) return false;
  current!.seek(ms);
  return true;
}

/** Release only the captured, unmounted media node; never a replacement node. */
export function releaseReviewMediaElement(audio: Pick<HTMLMediaElement, "isConnected" | "pause" | "removeAttribute" | "load">): void {
  audio.pause();
  // StrictMode simulates effect cleanup while the live node is still mounted.
  // Detach its resource only after real DOM removal, never a React-updated src.
  if (audio.isConnected) return;
  audio.removeAttribute("src");
  audio.load();
}
