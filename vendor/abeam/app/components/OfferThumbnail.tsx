"use client";

import Image from "next/image";
import { Hotel } from "lucide-react";
import { useState } from "react";

/** Public provider thumbnails only, with an exact CDN hostname boundary. */
export function safeOfferPhoto(value?: string, width?: number, height?: number): string | undefined {
  if (value === "/embed/abeam/auth-coast.webp") return value;
  if (!value) return undefined;
  try {
    const url = new URL(value);
    const googleCdn = url.hostname === "googleusercontent.com" || url.hostname.endsWith(".googleusercontent.com");
    if (url.protocol !== "https:" || !googleCdn || url.username || url.password || url.port
      || [...url.searchParams.keys()].some((key) => /^(api[_-]?key|access[_-]?token)$/i.test(key))) return undefined;
    if (width && height && Number.isFinite(width) && Number.isFinite(height)) {
      // Replace Google's existing size directive; keep query parameters intact.
      url.pathname = `${url.pathname.replace(/=[^/=]*$/, "")}=w${Math.min(1280, Math.max(1, Math.round(width)))}-h${Math.min(800, Math.max(1, Math.round(height)))}-k-no`;
    }
    return url.href;
  } catch { return undefined; }
}

export default function OfferThumbnail({ image, className, width = 42, height = 48 }: {
  image?: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const photo = safeOfferPhoto(image, width * 2, height * 2);
  const visiblePhoto = photo && photo !== failedImage ? photo : undefined;
  return (
    <span className={className} aria-hidden="true" data-photo={visiblePhoto ? "true" : undefined}>
      {visiblePhoto ? <Image src={visiblePhoto} alt="" width={width} height={height} unoptimized loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedImage(visiblePhoto)} /> : <Hotel size={18} strokeWidth={1.6} />}
    </span>
  );
}
