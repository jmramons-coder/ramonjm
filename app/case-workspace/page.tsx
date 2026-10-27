import type { Metadata } from "next";
import { hasCaseAccess } from "./access";
import { CaseAccessGate } from "./access-gate";
import { CaseWorkspaceFrame } from "./workspace-frame";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Equisoft · Case management | Ramon JM",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function CaseWorkspacePage() {
  return (await hasCaseAccess()) ? <CaseWorkspaceFrame /> : <CaseAccessGate />;
}
