const REQUIRED_SERVER_ENV = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
] as const;

const REQUIRED_PUBLIC_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const PRIVILEGED_SERVER_ENV = ["SUPABASE_SERVICE_ROLE_KEY"] as const;

export type EnvCheck = {
  ok: boolean;
  missing: string[];
};

export function checkEnv(keys: readonly string[]): EnvCheck {
  const missing = keys.filter((key) => !process.env[key]);

  return {
    ok: missing.length === 0,
    missing,
  };
}

export function checkCoreEnv(): EnvCheck {
  return checkEnv([...REQUIRED_SERVER_ENV, ...REQUIRED_PUBLIC_ENV]);
}

export function checkPrivilegedEnv(): EnvCheck {
  return checkEnv(PRIVILEGED_SERVER_ENV);
}

export function requireEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${key}`);
  }

  return value;
}
