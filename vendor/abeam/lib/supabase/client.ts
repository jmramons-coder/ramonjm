import { demoSupabaseClient } from "../../demo/database.ts";

/** The portfolio build uses the authentic frontend with visitor-local demo services. */
export function createClient() {
  return demoSupabaseClient;
}
