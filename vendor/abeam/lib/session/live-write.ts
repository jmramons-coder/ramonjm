/**
 * Versionnement léger des publications live.
 *
 * `sessions.updated_at` est déjà le battement de cœur du filet. Les routes
 * coûteuses l'utilisent aussi comme jeton CAS : le résultat ne peut être
 * publié que si la ligne n'a pas changé pendant l'appel fournisseur/LLM.
 */
export const LIVE_RESULT_STALE_CODE = "LIVE_RESULT_STALE";

export function nextLiveUpdatedAt(previous: string, now = Date.now()): string {
  const previousMs = Date.parse(previous);
  const nextMs = Number.isFinite(previousMs) ? Math.max(now, previousMs + 1) : now;
  return new Date(nextMs).toISOString();
}
