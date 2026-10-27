import "server-only";

import { cookies } from "next/headers";
import {
  CASE_STUDY_COOKIE_NAME,
  isCaseStudyConfigured,
  verifyCaseStudyToken,
  type CaseStudyConfig,
} from "./session";

export function getCaseStudyConfig(): CaseStudyConfig {
  return {
    accessCode: process.env.CASE_STUDY_ACCESS_CODE,
    sessionSecret: process.env.CASE_STUDY_SESSION_SECRET,
  };
}

export async function hasCaseAccess(): Promise<boolean> {
  const config = getCaseStudyConfig();
  if (!isCaseStudyConfigured(config)) return false;

  const token = (await cookies()).get(CASE_STUDY_COOKIE_NAME)?.value;
  return verifyCaseStudyToken(token, config);
}
