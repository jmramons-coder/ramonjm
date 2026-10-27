import type { createAdminClient } from "../supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;
export type AdvisorContext = { agentName?: string; agencyName: string };
export type AdvisorContextResult = { context: AdvisorContext; profileError: string | null };

const name = (value: unknown) => typeof value === "string" ? value.trim() : "";

/** Server use only: agency identity comes from the authenticated user's profile. */
export async function loadAdvisorContext(admin: AdminClient, userId: string): Promise<AdvisorContextResult> {
  const context: AdvisorContext = { agencyName: "aBeam" };
  if (!userId) return { context, profileError: "Utilisateur absent." };
  let profile;
  try {
    profile = await admin.from("profiles").select("display_name, agency_id").eq("id", userId).maybeSingle();
  } catch {
    return { context, profileError: "Profil indisponible." };
  }
  if (profile.error) return { context, profileError: profile.error.message };
  const agentName = name(profile.data?.display_name);
  if (agentName) context.agentName = agentName;
  const agencyId = name(profile.data?.agency_id);
  if (agencyId) {
    try {
      const agency = await admin.from("agencies").select("name").eq("id", agencyId).maybeSingle();
      if (!agency.error) context.agencyName = name(agency.data?.name) || context.agencyName;
    } catch {
      // The agency label is optional; never replace it with another tenant.
    }
  }
  return { context, profileError: null };
}
