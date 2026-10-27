import { z } from "zod";
import { parseJsonBody } from "../http/json-body.ts";
import { hasJsonContentType, requestOriginError } from "../http/request-boundary.ts";
import { emptyDiscoveryFeed, mergeDiscoveryFeed } from "./feed-cache.ts";
import { editorialSearchRequest, editorialSearchScope } from "./feed-catalog.ts";
import type { DiscoveryFeedClaim, DiscoveryFeedResult, DiscoveryFeedSnapshot } from "./feed-types.ts";
import type { ProductSearchRequest, ProductSearchResult } from "./types.ts";

type Dependencies = {
  getUserId(request: Request): Promise<string | null>;
  providerConfigured(): boolean;
  read(ownerId: string): Promise<DiscoveryFeedClaim>;
  claim(ownerId: string, refresh: boolean): Promise<DiscoveryFeedClaim>;
  finish(ownerId: string, claimId: string, snapshot: DiscoveryFeedSnapshot | null): Promise<boolean>;
  search(request: ProductSearchRequest): Promise<ProductSearchResult>;
  now?: () => Date;
};
const schema = z.object({ language: z.enum(["fr", "en"]).default("fr"), refresh: z.boolean().default(false) }).strict();

function responseFor(claim: DiscoveryFeedClaim, language: "fr" | "en", now: Date): DiscoveryFeedResult {
  const today = now.toISOString().slice(0, 10);
  const midnight = Date.parse(`${today}T00:00:00Z`) + 86_400_000;
  const warnings: string[] = [];
  if (claim.lastError) warnings.push(language === "fr" ? "L’actualisation n’a pas abouti. Les derniers repères vérifiés restent disponibles." : "The refresh did not finish. The latest verified references remain available.");
  if (claim.state === "cooldown") warnings.push(language === "fr" ? `Les découvertes viennent d’être vérifiées. Réessayez dans ${claim.retryAfterSeconds ?? 120} secondes.` : `Discoveries were just checked. Try again in ${claim.retryAfterSeconds ?? 120} seconds.`);
  if (claim.state === "limit") warnings.push(language === "fr" ? "Le plafond de recherches du jour est atteint. Les repères précédents restent disponibles." : "Today's search limit has been reached. Previous references remain available.");
  return {
    ...claim.snapshot, status: claim.state === "busy" ? "refreshing" : "ready",
    stale: claim.snapshot.day !== today || Boolean(claim.lastError), automaticAttemptedToday: claim.automaticAttemptDay === today,
    warnings, nextRefreshAt: new Date(midnight).toISOString(), retryAfterSeconds: claim.retryAfterSeconds,
    searchesRemaining: claim.searchesRemaining, searchesUsed: 0,
  };
}

/** GET only reads; POST can fill once/day or explicitly add a bounded batch. */
export async function handleDiscoveryFeed(request: Request, dependencies: Dependencies): Promise<Response> {
  const clock = dependencies.now ?? (() => new Date());
  const json = (value: unknown, status = 200, retry?: number) => Response.json(value, { status, headers: { "Cache-Control": "no-store", ...(retry ? { "Retry-After": String(retry) } : {}) } });
  let ownerId: string | null;
  try { ownerId = await dependencies.getUserId(request); } catch { return json({ error: "Connexion indisponible. Réessayez.", code: "SEARCH_UNAVAILABLE" }, 503); }
  if (!ownerId) return json({ error: "Non authentifié." }, 401);
  if (requestOriginError(request)) return json({ error: "Origine de requête non autorisée." }, 403);
  let input: unknown;
  if (request.method === "GET") input = { language: new URL(request.url).searchParams.get("language") ?? "fr" };
  else if (request.method === "POST") {
    if (!hasJsonContentType(request)) return json({ error: "Un objet JSON est requis." }, 415);
    const parsed = await parseJsonBody(request, 4096);
    if (parsed.response) return parsed.response;
    input = parsed.body;
  } else return json({ error: "Méthode non autorisée." }, 405);
  const parsed = schema.safeParse(input);
  if (!parsed.success) return json({ error: "Paramètres de découverte invalides.", code: "INVALID_SEARCH" }, 400);
  const { language, refresh } = parsed.data;
  const en = language === "en";
  if (request.method === "GET") {
    try { return json(responseFor(await dependencies.read(ownerId), language, clock())); }
    catch { return json({ error: en ? "Travel discoveries could not be loaded. Try again." : "Les découvertes n’ont pas pu être chargées. Réessayez.", code: "SEARCH_UNAVAILABLE" }, 503); }
  }
  if (!dependencies.providerConfigured()) {
    try {
      const cached = await dependencies.read(ownerId);
      if (cached.snapshot.items.length) return json({ ...responseFor(cached, language, clock()), stale: true, warnings: [en ? "Fresh offers are temporarily unavailable. Showing previous references." : "Les nouvelles offres sont temporairement indisponibles. Voici les repères précédents."] });
    } catch { /* return generic unavailable */ }
    return json({ error: en ? "Fresh travel offers are temporarily unavailable." : "Les nouvelles offres de voyage sont temporairement indisponibles.", code: "SEARCH_UNAVAILABLE" }, 503);
  }
  let claimed: DiscoveryFeedClaim;
  try { claimed = await dependencies.claim(ownerId, refresh); }
  catch { return json({ error: en ? "Travel discoveries could not refresh. Try again." : "Les découvertes n’ont pas pu être actualisées. Réessayez.", code: "SEARCH_UNAVAILABLE" }, 503); }
  if (claimed.state !== "claimed" || !claimed.claimId) {
    const value = responseFor(claimed, language, clock());
    if (claimed.state === "unavailable") return json({ error: en ? "Travel discoveries are temporarily unavailable." : "Les découvertes sont temporairement indisponibles.", code: "SEARCH_UNAVAILABLE" }, 503);
    if (claimed.state === "limit" && !value.items.length) return json({ error: en ? "Today's search limit has been reached." : "Le plafond de recherches du jour est atteint.", code: "SEARCH_LIMIT", retryAfterSeconds: claimed.retryAfterSeconds }, 429, claimed.retryAfterSeconds);
    return json(value, claimed.state === "busy" ? 202 : 200, claimed.retryAfterSeconds);
  }
  const scope = editorialSearchScope(claimed.sequence, clock());
  let result: ProductSearchResult;
  try { result = await dependencies.search(editorialSearchRequest(scope, language)); }
  catch {
    try { await dependencies.finish(ownerId, claimed.claimId, null); } catch { /* immutable credits remain charged */ }
    if (claimed.snapshot.items.length) return json({ ...responseFor({ ...claimed, state: "cached", lastError: "provider_unavailable" }, language, clock()), searchesUsed: 2 });
    return json({ error: en ? "Fresh offers could not be retrieved. Try refreshing shortly." : "Les nouvelles offres n’ont pas pu être récupérées. Réessayez bientôt.", code: "SEARCH_UNAVAILABLE" }, 502);
  }
  const completedAt = clock().toISOString();
  const batch = mergeDiscoveryFeed(emptyDiscoveryFeed(), result.items, { ...scope, retrievedAt: completedAt }, completedAt);
  let stored = false;
  try { stored = await dependencies.finish(ownerId, claimed.claimId, batch); } catch { /* returned offers remain verified, cache can fail separately */ }
  let latest: DiscoveryFeedClaim;
  try { latest = stored ? await dependencies.read(ownerId) : { ...claimed, state: "cached", snapshot: mergeDiscoveryFeed(claimed.snapshot, result.items, scope, completedAt) }; }
  catch { latest = { ...claimed, state: "cached", snapshot: mergeDiscoveryFeed(claimed.snapshot, result.items, scope, completedAt) }; }
  const value = responseFor(latest, language, clock());
  const warnings = [...value.warnings, ...result.warnings];
  if (!stored) warnings.push(en ? "These offers could not be saved yet." : "Ces offres n’ont pas encore pu être sauvegardées.");
  if (!result.items.length) warnings.push(en ? `No new offers were returned for ${scope.destinationLabel}.` : `Aucune nouvelle offre n’a été retournée pour ${scope.destinationLabel}.`);
  return json({ ...value, status: "ready", warnings, searchesUsed: 2, searchesRemaining: claimed.searchesRemaining });
}
