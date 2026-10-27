"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCaseStudyConfig } from "./access";
import {
  CASE_STUDY_COOKIE_NAME,
  CASE_STUDY_SESSION_MAX_AGE,
  createCaseStudyToken,
  isValidCaseStudyCode,
} from "./session";

const accessError = "Unable to unlock this preview. Check the code and try again.";

export async function unlockCaseStudy(
  _previous: { error: string },
  formData: FormData,
): Promise<{ error: string }> {
  const code = formData.get("code");
  const config = getCaseStudyConfig();
  if (typeof code !== "string" || !isValidCaseStudyCode(code, config)) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { error: accessError };
  }

  const token = createCaseStudyToken(config);
  if (!token) return { error: accessError };

  (await cookies()).set(CASE_STUDY_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/case-workspace",
    maxAge: CASE_STUDY_SESSION_MAX_AGE,
  });
  redirect("/case-workspace");
}
