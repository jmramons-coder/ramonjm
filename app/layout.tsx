import type { Metadata, Viewport } from "next";
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

const { title, description } = portfolio;
const shareImage = {
  url: "/social/portfolio-grid-20261025.png",
  width: 1200,
  height: 630,
  alt: "Ramon JM — product design and development, with aBeam, Nudge, Tracer and PushedWorld from the current portfolio.",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ramonjm.com"),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/",
    siteName: "Ramon JM",
    images: [{ ...shareImage, type: "image/png" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [shareImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={geistSans.variable}>{children}</body>
    </html>
  );
}
