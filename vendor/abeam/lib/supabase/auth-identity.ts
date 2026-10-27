/** Explicit credentials take precedence; invalid credentials fail closed. */
export async function resolveUserIdentity(
  authorization: string | null,
  verifyBearer: (token: string) => Promise<string | null>,
  verifyCookie: () => Promise<string | null>,
): Promise<string | null> {
  if (authorization === null) return verifyCookie();
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  return token ? verifyBearer(token) : null;
}
