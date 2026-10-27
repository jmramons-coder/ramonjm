import type { createAdminClient } from "../supabase/admin";
import type { PasseResultat } from "./registry.ts";

type AdminClient = ReturnType<typeof createAdminClient>;
const MAX_ATTEMPTS = 3;

/**
 * Merge one already-generated result without overwriting other concurrent passes.
 * The last successful CAS wins for the same pass ID. Retries only read/write;
 * they never rerun the model or touch the session's lifecycle timestamps.
 */
export async function persistPass(admin: AdminClient, sessionId: string, userId: string, result: PasseResultat): Promise<string[]> {
  try {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const existing = await admin.from("sessions").select("id, passes")
        .eq("id", sessionId).eq("owner_id", userId).maybeSingle();
      if (existing.error) return [`Persistance: ${existing.error.message}`];
      if (!existing.data) return ["Persistance: cette conversation n’est plus disponible. Le livrable reste accessible."];
      const previous: unknown = existing.data.passes;
      if (previous !== null && (typeof previous !== "object" || Array.isArray(previous))) {
        return ["Persistance: les résultats enregistrés sont invalides. Le livrable reste accessible."];
      }
      const passes = { ...(previous as Record<string, unknown> | null), [result.passeId]: result };
      const update = admin.from("sessions").update({ passes })
        .eq("id", sessionId).eq("owner_id", userId);
      // A jsonb column supports full-value equality. Pass serialized JSON to
      // PostgREST eq (an object becomes "[object Object]"); SQL NULL uses is.
      const compare = previous === null ? update.is("passes", null) : update.eq("passes", JSON.stringify(previous));
      const committed = await compare.select("id").maybeSingle();
      if (committed.error) return [`Persistance: ${committed.error.message}`];
      if (committed.data?.id === sessionId) return [];
      // No matching row: another pass changed the map, or the session vanished.
      // Read the current owner-scoped value before another bounded attempt.
    }
    return ["Persistance: les résultats ont changé pendant la sauvegarde. Le livrable reste accessible ; réessayez plus tard."];
  } catch {
    return ["Persistance indisponible. Le livrable reste accessible."];
  }
}
