import type { createAdminClient } from "../supabase/admin";
import type { ProductSearchReservation } from "./service.ts";
import { productResearchStorage } from "./research-storage.ts";

type AdminClient = ReturnType<typeof createAdminClient>;
/** Manual and daily research ALWAYS share the same immutable storage ledger. */
export async function reserveProductSearchBudget(admin: AdminClient, ownerId: string, searches: number): Promise<ProductSearchReservation> {
  try { return await productResearchStorage(admin).reserve(ownerId, searches); }
  catch { return { id: null, remaining: 0, reason: "unavailable" }; }
}

export async function settleProductSearchBudget(admin: AdminClient, ownerId: string, reservationId: string, consumed: number): Promise<boolean> {
  // The conservative ledger charges claimed slots, even after worker failure.
  // No second SQL counter or refund path can create another 60-credit pool.
  if (!Number.isFinite(consumed) || consumed < 0) return false;
  try { return await productResearchStorage(admin).confirm(ownerId, reservationId); } catch { return false; }
}
