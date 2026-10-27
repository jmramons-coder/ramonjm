import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const CASE_STUDY_COOKIE_NAME = "case-study-access";
export const CASE_STUDY_SESSION_MAX_AGE = 60 * 60 * 8;
export const CASE_STUDY_MAX_CODE_LENGTH = 64;

const signingNamespace = "ramonjm:case-study-access:v1:";

export type CaseStudyConfig = {
  accessCode?: string;
  sessionSecret?: string;
};

function normalizedCode(code: string) {
  return code.trim().toUpperCase();
}

export function isCaseStudyConfigured(config: CaseStudyConfig): boolean {
  const code = config.accessCode;
  const secret = config.sessionSecret;
  return (
    typeof code === "string" &&
    normalizedCode(code).length > 0 &&
    normalizedCode(code).length <= CASE_STUDY_MAX_CODE_LENGTH &&
    typeof secret === "string" &&
    secret.trim().length > 0
  );
}

export function isValidCaseStudyCode(
  code: string,
  config: CaseStudyConfig,
): boolean {
  if (
    !isCaseStudyConfigured(config) ||
    typeof code !== "string" ||
    code.length > CASE_STUDY_MAX_CODE_LENGTH ||
    normalizedCode(code).length === 0
  ) {
    return false;
  }

  // Hash both values to compare fixed-length buffers without exposing code length.
  const supplied = createHash("sha256").update(normalizedCode(code)).digest();
  const expected = createHash("sha256")
    .update(normalizedCode(config.accessCode!))
    .digest();
  return timingSafeEqual(supplied, expected);
}

function signature(payload: string, secret: string): Buffer {
  return createHmac("sha256", secret)
    .update(signingNamespace)
    .update(payload)
    .digest();
}

export function createCaseStudyToken(
  config: CaseStudyConfig,
  now = Date.now(),
): string | null {
  const issuedAt = Math.floor(now / 1000);
  if (
    !isCaseStudyConfigured(config) ||
    !Number.isSafeInteger(issuedAt) ||
    issuedAt <= 0
  ) {
    return null;
  }

  const expiresAt = issuedAt + CASE_STUDY_SESSION_MAX_AGE;
  const nonce = randomBytes(16).toString("hex");
  const payload = `v1.${issuedAt}.${expiresAt}.${nonce}`;
  return `${payload}.${signature(payload, config.sessionSecret!).toString("hex")}`;
}

export function verifyCaseStudyToken(
  token: string | undefined,
  config: CaseStudyConfig,
  now = Date.now(),
): boolean {
  if (!isCaseStudyConfigured(config) || typeof token !== "string") return false;

  const match = token.match(
    /^v1\.([1-9]\d{0,12})\.([1-9]\d{0,12})\.([a-f0-9]{32})\.([a-f0-9]{64})$/,
  );
  if (!match || match[0] !== token) return false;

  const issuedAt = Number(match[1]);
  const expiresAt = Number(match[2]);
  const nowSeconds = Math.floor(now / 1000);
  if (
    !Number.isSafeInteger(nowSeconds) ||
    nowSeconds <= 0 ||
    !Number.isSafeInteger(issuedAt) ||
    !Number.isSafeInteger(expiresAt) ||
    issuedAt > nowSeconds ||
    expiresAt <= nowSeconds ||
    expiresAt - issuedAt !== CASE_STUDY_SESSION_MAX_AGE
  ) {
    return false;
  }

  const payload = token.slice(0, token.lastIndexOf("."));
  const supplied = Buffer.from(match[4], "hex");
  return timingSafeEqual(
    supplied,
    signature(payload, config.sessionSecret!),
  );
}
