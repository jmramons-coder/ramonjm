import { Suspense } from "react";
import { Analytics } from "./analytics/analytics";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Geist } from "next/font/google";
import "./globals.css";
import { portfolio } from "./portfolio-content";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f7f7f7",
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = new URL(`${protocol}://${host}`);
  const { title, description } = portfolio;

  return {
    metadataBase: baseUrl,
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description,
      type: "website",
      url: "/",
      siteName: "Ramon JM",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={geistSans.variable}>{children}<Suspense fallback={null}><Analytics /></Suspense></body>
    </html>
  );
}
