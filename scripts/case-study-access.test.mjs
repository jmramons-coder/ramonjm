import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  CASE_STUDY_COOKIE_NAME,
  CASE_STUDY_MAX_CODE_LENGTH,
  CASE_STUDY_SESSION_MAX_AGE,
  createCaseStudyToken,
  isCaseStudyConfigured,
  isValidCaseStudyCode,
  verifyCaseStudyToken,
} from "../app/case-workspace/session.ts";

const config = {
  accessCode: "DEMO",
  sessionSecret: "test-only-case-study-session-secret-32-bytes",
};
const now = Date.UTC(2026, 9, 27, 12);

test("accepts the configured code with case and surrounding whitespace normalized", () => {
  assert.equal(isCaseStudyConfigured(config), true);
  for (const code of ["DEMO", "demo", " DeMo\n"]) {
    assert.equal(isValidCaseStudyCode(code, config), true);
  }
  assert.equal(
    isValidCaseStudyCode("demo", { ...config, accessCode: " DEMO " }),
    true,
  );
});

test("rejects wrong, blank, and oversized codes before normalization", () => {
  for (const code of ["WRONG", "", "  ", "DEMO!", "D EMO"]) {
    assert.equal(isValidCaseStudyCode(code, config), false);
  }
  const padded = " ".repeat(CASE_STUDY_MAX_CODE_LENGTH) + "DEMO";
  assert.equal(isValidCaseStudyCode(padded, config), false);
});

test("tokens round-trip for eight hours and use a fresh random nonce", () => {
  const first = createCaseStudyToken(config, now);
  const second = createCaseStudyToken(config, now);
  assert.equal(CASE_STUDY_COOKIE_NAME, "case-study-access");
  assert.equal(CASE_STUDY_SESSION_MAX_AGE, 8 * 60 * 60);
  assert.equal(typeof first, "string");
  assert.notEqual(first, second);
  assert.equal(verifyCaseStudyToken(first, config, now), true);
  assert.equal(
    verifyCaseStudyToken(first, config, now + CASE_STUDY_SESSION_MAX_AGE * 1000 - 1),
    true,
  );
});

test("rejects a token at its expiry and afterwards", () => {
  const token = createCaseStudyToken(config, now);
  const expiry = now + CASE_STUDY_SESSION_MAX_AGE * 1000;
  assert.equal(verifyCaseStudyToken(token, config, expiry), false);
  assert.equal(verifyCaseStudyToken(token, config, expiry + 1000), false);
});

test("rejects a correctly signed token issued in the future", () => {
  const token = createCaseStudyToken(config, now + 1000);
  assert.equal(verifyCaseStudyToken(token, config, now), false);
});

test("rejects tampered expiry, nonce, signature, and secret", () => {
  const token = createCaseStudyToken(config, now);
  const parts = token.split(".");
  const expiry = [...parts];
  expiry[2] = String(Number(expiry[2]) + 1);
  const nonce = [...parts];
  nonce[3] = (nonce[3][0] === "0" ? "1" : "0") + nonce[3].slice(1);
  const signature = [...parts];
  signature[4] = (signature[4][0] === "0" ? "1" : "0") + signature[4].slice(1);
  for (const altered of [expiry, nonce, signature]) {
    assert.equal(verifyCaseStudyToken(altered.join("."), config, now), false);
  }
  assert.equal(
    verifyCaseStudyToken(token, { ...config, sessionSecret: "another-secret" }, now),
    false,
  );
});

test("rejects malformed tokens without throwing", () => {
  const token = createCaseStudyToken(config, now);
  for (const malformed of [
    undefined,
    "",
    "true",
    "DEMO",
    "1.invalid",
    token + ".extra",
    token + "\n",
    token + " ",
    token.slice(0, -1),
    token.replace(/^v1/, "v2"),
    token.replace("v1.", "v1.0"),
    token.replace(/\.[a-f0-9]{64}$/, "." + "g".repeat(64)),
  ]) {
    assert.equal(verifyCaseStudyToken(malformed, config, now), false);
  }
});

test("does not accept a signature from an unrelated token namespace", () => {
  const token = createCaseStudyToken(config, now);
  const payload = token.slice(0, token.lastIndexOf("."));
  const unrelated = createHmac("sha256", config.sessionSecret)
    .update(payload)
    .digest("hex");
  assert.equal(verifyCaseStudyToken(`${payload}.${unrelated}`, config, now), false);
});

test("fails closed when either environment-backed configuration value is missing", () => {
  const token = createCaseStudyToken(config, now);
  for (const missing of [
    {},
    { accessCode: "DEMO" },
    { sessionSecret: config.sessionSecret },
    { ...config, accessCode: "" },
    { ...config, accessCode: " " },
    { ...config, accessCode: "x".repeat(65) },
    { ...config, sessionSecret: "" },
    { ...config, sessionSecret: " " },
  ]) {
    assert.equal(isCaseStudyConfigured(missing), false);
    assert.equal(isValidCaseStudyCode("DEMO", missing), false);
    assert.equal(createCaseStudyToken(missing, now), null);
    assert.equal(verifyCaseStudyToken(token, missing, now), false);
  }
});
