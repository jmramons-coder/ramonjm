import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./workspace.css";
import "./mobile-workspace.css";
import "./conversation-workspace.css";
import "./desktop-refinement.css";
import "./ui-consistency.css";
import "./empty-state.css";
import "./folder-facts.css";
import "./folder-dashboard.css";
import "./dashboard-home.css";
import "./folder-workflow.css";
import "./unfiled-workflow.css";
import "./explore-workflow.css";
import "./folder-directory.css";
import "./conversation-island.css";
import "./conversation-surface.css";
import "./components/page-skeleton.css";
import "./desktop-comfort.css";

export const metadata: Metadata = {
  title: "aBeam — Interactive portfolio demo",
  description:
    "Explore the actual aBeam frontend with fictional, local demo data.",
  robots: { index: false, follow: false },
  icons: { icon: "/embed/abeam/abeam-icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
