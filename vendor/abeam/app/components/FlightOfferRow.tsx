"use client";

import Image from "next/image";
import { Plane } from "lucide-react";
import { useState } from "react";
import { flightOfferImage } from "@/lib/discovery/flight-image";
import type { UILanguage } from "@/lib/ui/language";
import { displayConversationFlightDetail } from "./offer-format";

import "./flight-offer-row.css";

/** Actual provider logo, with a plain icon fallback and no enclosing badge. */
export function FlightOfferVisual({ image, className = "flight-offer-visual" }: { image?: string; className?: string }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const logo = flightOfferImage(image);
  const visibleLogo = logo && logo !== failedImage ? logo : undefined;
  return <span className={className} aria-hidden="true">
    {visibleLogo ? <Image src={visibleLogo} alt="" width={30} height={30} unoptimized loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedImage(visibleLogo)} /> : <Plane size={20} strokeWidth={1.6} />}
  </span>;
}

/** The same airline/details/price row in chat, Explore and compact feeds. */
export default function FlightOfferRow({ title, detail, price, image, compact = false, language = "fr" }: {
  title: string;
  detail?: string;
  price?: string;
  image?: string;
  compact?: boolean;
  language?: UILanguage;
}) {
  return (
    <span className={`flight-offer-row${compact ? " is-compact" : ""}`}>
      <FlightOfferVisual image={image} />
      <span className="flight-offer-copy"><strong>{title}</strong>{detail ? <span>{displayConversationFlightDetail(detail, language)}</span> : null}</span>
      {price ? <span className="flight-offer-price">{price}</span> : null}
    </span>
  );
}
