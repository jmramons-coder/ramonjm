import type { SupabaseClient } from "@supabase/supabase-js";
import type { UILanguage } from "../ui/language.ts";

export type ProfileSettingsPatch = { display_name?: string; language?: UILanguage };
type Client = Pick<SupabaseClient, "from">;

function cancelled(): never { throw new DOMException("Profile request cancelled", "AbortError"); }

/** Exact own-profile patches; never update account email or agency identity. */
export async function saveProfileSettings(client: Client, ownerId: string, patch: ProfileSettingsPatch, isCurrent: () => boolean, signal?: AbortSignal) {
  const captured = { ...patch };
  const keys = Object.keys(captured);
  if (!ownerId || !keys.length || keys.some((key) => key !== "display_name" && key !== "language")
    || (captured.language !== undefined && captured.language !== "fr" && captured.language !== "en")
    || (captured.display_name !== undefined && (!captured.display_name.trim() || captured.display_name.length > 160))) throw new Error("Invalid profile settings");
  if (captured.display_name !== undefined) captured.display_name = captured.display_name.trim();
  if (!isCurrent() || signal?.aborted) cancelled();
  const query = client.from("profiles").update(captured).eq("id", ownerId).select("id,display_name,language");
  const { data, error } = await (signal ? query.abortSignal(signal) : query).single();
  if (!isCurrent() || signal?.aborted) cancelled();
  if (error || !data || data.id !== ownerId
    || (captured.language !== undefined && data.language !== captured.language)
    || (captured.display_name !== undefined && data.display_name !== captured.display_name)) throw new Error("Profile settings could not be saved");
  return captured;
}

/** Serialize quick language changes so an older request cannot arrive last. */
export class ProfileSettingsQueue {
  private tail: Promise<unknown> = Promise.resolve();
  private readonly controller = new AbortController();
  cancel() { this.controller.abort(); }
  write(client: Client, ownerId: string, patch: ProfileSettingsPatch, isCurrent: () => boolean): Promise<ProfileSettingsPatch> {
    const captured = { ...patch };
    const job = this.tail.catch(() => undefined).then(() => saveProfileSettings(client, ownerId, captured, isCurrent, this.controller.signal));
    this.tail = job;
    return job;
  }
}

/** A delayed profile read cannot revert a language choice or a confirmed name save. */
export function resolveProfileRead<Profile extends { id: string; display_name: string | null; language: UILanguage }>(
  remote: Profile, current: Profile | null,
  state: { readRevision: number; currentRevision: number; namePending: boolean; languageDraft: UILanguage | null; currentLanguage: UILanguage },
): { profile: Profile; language: UILanguage | null } {
  const unchanged = state.readRevision === state.currentRevision && !state.namePending;
  const validLanguage = remote.language === "fr" || remote.language === "en";
  return {
    profile: { ...remote,
      display_name: unchanged ? remote.display_name : current?.id === remote.id ? current.display_name : remote.display_name,
      language: state.languageDraft ?? (unchanged && validLanguage ? remote.language : state.currentLanguage),
    },
    language: unchanged && !state.languageDraft && validLanguage ? remote.language : null,
  };
}
