import "server-only";
import { resolveUserIdentity } from "./auth-identity";

import { createClient } from "@supabase/supabase-js";

import { requireEnv } from "@/lib/env";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

export async function getCurrentUserId(request: Request) {
  return resolveUserIdentity(request.headers.get("authorization"), async (token) => {
    const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_ANON_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser(token);
    return !error && data.user ? data.user.id : null;
  }, async () => {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    return !error && data.user ? data.user.id : null;
  });
}
