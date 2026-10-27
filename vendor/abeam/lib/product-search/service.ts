import { parseJsonBody } from "../http/json-body.ts";
import { hasJsonContentType, requestOriginError } from "../http/request-boundary.ts";
import { executeProductSearch } from "./engine.ts";
import { parseProductSearchRequest, productSearchClarifications, productSearchCost } from "./validate.ts";
import type { ProductSearchRequest, ProductSearchResult } from "./types.ts";

export type ProductSearchReservation = {
  id: string | null;
  remaining: number;
  reason?: "busy" | "cooldown" | "limit" | "unavailable";
  retryAfterSeconds?: number;
};

type Dependencies = {
  getUserId(request: Request): Promise<string | null>;
  providerConfigured(): boolean;
  reserve(userId: string, searches: number): Promise<ProductSearchReservation>;
  settle(userId: string, reservationId: string, consumed: number): Promise<boolean>;
  search(request: ProductSearchRequest): Promise<ProductSearchResult>;
  now?: () => Date;
};

/** Testable authenticated boundary: no reservation or provider before scope. */
export async function handleProductSearch(request: Request, dependencies: Dependencies): Promise<Response> {
  const json = (value: unknown, status = 200, retry?: number) => Response.json(value, {
    status, headers: { "Cache-Control": "no-store", ...(retry ? { "Retry-After": String(retry) } : {}) },
  });
  let userId: string | null;
  try { userId = await dependencies.getUserId(request); }
  catch { return json({ error: "Connexion indisponible. Réessayez.", code: "SEARCH_UNAVAILABLE" }, 503); }
  if (!userId) return json({ error: "Non authentifié." }, 401);

  if (!hasJsonContentType(request)) return json({ error: "Un objet JSON est requis." }, 415);
  // Browser-initiated searches must come from this app, including cookie auth.
  const originError = requestOriginError(request);
  if (originError) return json({ error: originError === "invalid" ? "Origine de requête invalide." : "Origine de requête non autorisée." }, 403);
  const parsed = await parseJsonBody(request, 16_384);
  if (parsed.response) return parsed.response;
  const validated = parseProductSearchRequest(parsed.body);
  if (!validated.ok) return json({ error: validated.error, code: "INVALID_SEARCH" }, 400);
  const input = validated.request;
  const en = input.language === "en";
  const now = dependencies.now?.() ?? new Date();
  const clarifications = productSearchClarifications(input, now);
  if (clarifications.length) return json({ status: "needs-details", items: [], clarifications, warnings: [], generatedAt: now.toISOString(), searchesUsed: 0 } satisfies ProductSearchResult);
  if (!dependencies.providerConfigured()) return json({ error: en ? "Product search is not available yet." : "La recherche de produits n’est pas encore disponible.", code: "SEARCH_UNAVAILABLE" }, 503);
  const cost = productSearchCost(input);
  let reserved: ProductSearchReservation;
  try { reserved = await dependencies.reserve(userId, cost); }
  catch { reserved = { id: null, remaining: 0, reason: "unavailable" }; }
  if (!reserved.id) {
    if (reserved.reason === "unavailable" || !reserved.reason) return json({ error: en ? "A search could not be reserved. Try again shortly." : "La recherche n’a pas pu être réservée. Réessayez bientôt.", code: "SEARCH_BUDGET_UNAVAILABLE" }, 503);
    const busy = reserved.reason === "busy";
    const cooldown = reserved.reason === "cooldown";
    const reportedRetry = reserved.retryAfterSeconds;
    const retry = typeof reportedRetry === "number" && Number.isFinite(reportedRetry)
      ? Math.min(86_400, Math.max(1, Math.ceil(reportedRetry))) : (busy ? 120 : 3600);
    return json({ error: cooldown ? (en ? `A search was just submitted. Try again in ${retry} seconds.` : `Une recherche vient d’être lancée. Réessayez dans ${retry} secondes.`) : busy ? (en ? "Another product search is running. Try again shortly." : "Une autre recherche de produits est en cours. Réessayez bientôt.") : (en ? "The daily search limit has been reached." : "Le plafond quotidien de recherches est atteint."), code: cooldown ? "SEARCH_COOLDOWN" : busy ? "SEARCH_BUSY" : "SEARCH_LIMIT", retryAfterSeconds: retry }, 429, retry);
  }
  let result: ProductSearchResult;
  try { result = await dependencies.search(input); }
  catch {
    // A worker/provider may fail after spending; never refund uncertain calls.
    try { await dependencies.settle(userId, reserved.id, cost); } catch { /* immutable claimed credits remain counted */ }
    return json({ error: en ? "Product search could not finish. Try again." : "La recherche de produits n’a pas pu aboutir. Réessayez.", code: "SEARCH_UNAVAILABLE" }, 502);
  }
  const consumed = Number.isSafeInteger(result.searchesUsed) && result.searchesUsed >= 0 && result.searchesUsed <= cost ? result.searchesUsed : cost;
  let settled = false;
  try { settled = await dependencies.settle(userId, reserved.id, consumed); } catch { /* claimed credits remain counted */ }
  if (!settled) result.warnings.push(en ? "Search usage could not be confirmed. Reserved credits remain counted." : "Le décompte n’a pas pu être confirmé. Les crédits réservés restent comptés.");
  return json({ ...result, searchesUsed: consumed, searchesRemaining: reserved.remaining });
}

export { executeProductSearch };
