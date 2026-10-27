import type { createAdminClient } from "@/lib/supabase/admin";
import { SEARCH_BUDGET_LEASE_SECONDS } from "./search-limits.ts";

export { SEARCH_BUDGET_LEASE_SECONDS } from "./search-limits.ts";

type AdminClient = ReturnType<typeof createAdminClient>;

export type SearchReservation = {
  id: string;
  remaining: number;
};

/** Reserve une tranche atomique avant d'appeler un fournisseur payant. */
export async function reserveSearchBudget(
  admin: AdminClient,
  sessionId: string,
  ownerId: string,
  requested: number,
): Promise<{ reservation: SearchReservation | null; remaining: number; error?: string }> {
  const { data, error } = await admin.rpc("reserve_session_search_budget", {
    p_session_id: sessionId,
    p_owner_id: ownerId,
    p_requested: requested,
    p_lease_seconds: SEARCH_BUDGET_LEASE_SECONDS,
  });
  if (error) return { reservation: null, remaining: 0, error: error.message };

  const row = Array.isArray(data) ? data[0] : data;
  const remaining = typeof row?.remaining === "number" ? row.remaining : 0;
  if (!row?.allowed || typeof row.reservation_id !== "string") {
    return { reservation: null, remaining };
  }
  return { reservation: { id: row.reservation_id, remaining }, remaining };
}

/**
 * Règle la tranche sur les appels réellement tentés. Si le worker meurt avant
 * cet appel, Postgres solde la tranche entière à l'expiration : une panne ne
 * peut donc transformer un appel SerpAPI éventuellement débité en crédit
 * réutilisable.
 */
export async function settleSearchBudget(
  admin: AdminClient,
  reservationId: string,
  ownerId: string,
  consumed: number,
): Promise<string | null> {
  const { error } = await admin.rpc("settle_session_search_budget", {
    p_reservation_id: reservationId,
    p_owner_id: ownerId,
    p_consumed: Math.max(0, Math.floor(consumed)),
  });
  return error?.message ?? null;
}
