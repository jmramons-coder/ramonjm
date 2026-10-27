import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthMode = "sign-in" | "sign-up" | "reset-request" | "update-password";
type Language = "fr" | "en";

/** Signing in never creates an account as a side effect of invalid credentials. */
export async function authenticateWithEmail(
  auth: Pick<SupabaseClient["auth"], "signInWithPassword" | "signUp">,
  mode: "sign-in" | "sign-up",
  credentials: { email: string; password: string },
  language: Language,
  emailRedirectTo: string,
) {
  if (mode === "sign-in") return auth.signInWithPassword(credentials);
  return auth.signUp({
    ...credentials,
    options: {
      emailRedirectTo,
      data: { display_name: credentials.email.split("@")[0], language },
    },
  });
}

export function passwordValidationError(password: string, confirmation: string, mode: "sign-up" | "update-password" = "update-password"): "short" | "mismatch" | null {
  if (password.length < 8) return "short";
  if (mode === "sign-up") return null;
  return password === confirmation ? null : "mismatch";
}

export function authErrorMessage(error: unknown, language: Language): string {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  const messages: Record<string, [string, string]> = {
    invalid_credentials: ["Courriel ou mot de passe incorrect.", "Incorrect email or password."],
    email_not_confirmed: ["Confirmez votre courriel avant de vous connecter.", "Confirm your email before signing in."],
    user_already_exists: ["Ce compte existe déjà. Connectez-vous ou réinitialisez votre mot de passe.", "This account already exists. Sign in or reset your password."],
    weak_password: ["Choisissez un mot de passe plus sûr, avec au moins 8 caractères.", "Choose a stronger password with at least 8 characters."],
    same_password: ["Choisissez un mot de passe différent de l’ancien.", "Choose a password different from your previous one."],
    over_email_send_rate_limit: ["Veuillez patienter avant de demander un autre courriel.", "Please wait before requesting another email."],
    over_request_rate_limit: ["Trop de tentatives. Réessayez dans un instant.", "Too many attempts. Please try again shortly."],
    otp_expired: ["Ce lien a expiré. Demandez un nouveau lien.", "This link has expired. Request a new one."],
    session_not_found: ["Votre session a expiré. Demandez un nouveau lien.", "Your session has expired. Request a new link."],
    signup_disabled: ["La création de comptes est temporairement indisponible.", "Account registration is temporarily unavailable."],
  };
  const message = messages[code];
  return message?.[language === "fr" ? 0 : 1]
    ?? (language === "fr" ? "Impossible de continuer. Réessayez dans un instant." : "Unable to continue. Please try again shortly.");
}

/** URL hints only choose a screen; Supabase still authenticates every operation. */
export function readAuthReturn(url: URL): { mode: AuthMode | null; recovery: boolean; error: boolean } {
  const fragment = new URLSearchParams(url.hash.slice(1));
  const recovery = url.searchParams.get("auth") === "recovery" || fragment.get("type") === "recovery";
  const error = url.searchParams.has("auth_error") || url.searchParams.has("error") || fragment.has("error");
  const reset = url.searchParams.get("auth") === "reset-request";
  return {
    mode: recovery ? "update-password" : reset ? "reset-request" : url.searchParams.get("auth") === "login" || error ? "sign-in" : null,
    recovery,
    error,
  };
}

export function authCallbackUrl(origin: string, recovery = false): string {
  const callback = new URL("/auth/callback", origin);
  if (recovery) callback.searchParams.set("flow", "recovery");
  return callback.href;
}

/** Relative redirects preserve the browser's actual LAN/preview origin. */
export function authCallbackReturnLocation(recovery: boolean, failed = false): string {
  if (failed) return `/?auth=${recovery ? "reset-request" : "login"}&auth_error=callback`;
  return recovery ? "/?auth=recovery" : "/";
}

export function cleanAuthReturnUrl(url: URL, recovery: boolean): URL {
  const clean = new URL(url.href);
  for (const key of ["auth", "auth_error", "error", "error_code", "error_description", "code"]) clean.searchParams.delete(key);
  const fragment = new URLSearchParams(clean.hash.slice(1));
  if (fragment.has("access_token") || fragment.has("error") || fragment.get("type") === "recovery") clean.hash = "";
  if (recovery) clean.searchParams.set("auth", "recovery");
  return clean;
}

/** Settings are public, but a failed/malformed response never advertises unavailable OAuth. */
export async function googleProviderEnabled(
  url: string,
  anonKey: string,
  signal: AbortSignal,
  request: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const response = await request(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
      headers: { apikey: anonKey }, signal, cache: "no-store",
    });
    if (!response.ok) return false;
    const settings: unknown = await response.json();
    if (!settings || typeof settings !== "object" || !("external" in settings)) return false;
    const external = settings.external;
    return Boolean(external && typeof external === "object" && "google" in external && external.google === true);
  } catch {
    return false;
  }
}
