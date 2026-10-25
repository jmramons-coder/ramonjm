import type { Metadata } from "next";
import { SiteHeader } from "../site-header";
import { ScrollBackground } from "./scroll-background";
import { ShakepayStudyContent } from "./study-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Shakepay rewards exploration — Ramon JM",
  description: "An independent product design study, shared for discussion.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/shakepay" },
  openGraph: {
    title: "Shakepay rewards exploration — Ramon JM",
    description: "Shared for discussion.",
    images: [],
  },
  twitter: {
    title: "Shakepay rewards exploration",
    description: "Shared for discussion.",
    images: [],
  },
};
export default function Study() {
  return (
    <>
      <SiteHeader
        textOnly
        backHref="/#applications"
        backLabel="Back to portfolio"
      />
      <ScrollBackground />
      <main id="main-content">
        <ShakepayStudyContent />
      </main>
    </>
  );
}
