"use client";

import { useSyncExternalStore } from "react";

const consentKey = "portfolio-analytics-consent-v1";
const consentEvent = "portfolio-analytics-consent-change";
export const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
const productionHosts = ["ramonjm.com", "www.ramonjm.com", "ramonjm.vercel.app"];
let initialized = false;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(consentEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(consentEvent, callback);
  };
}
function readConsent() {
  try { return localStorage.getItem(consentKey); } catch { return null; }
}
export function useAnalyticsEnabled() {
  return useSyncExternalStore(subscribe, analyticsEnabled, () => false);
}
export function useAnalyticsConsent() {
  return useSyncExternalStore(subscribe, readConsent, () => null);
}
export function saveConsent(value: "accepted" | "declined") {
  try { localStorage.setItem(consentKey, value); } catch { return; }
  if (value === "declined" && initialized) {
    window.gtag?.("consent", "update", { analytics_storage: "denied" });
    // Reload removes the loaded Google tag after consent is withdrawn.
    window.location.reload();
    return;
  }
  window.dispatchEvent(new Event(consentEvent));
}
export function analyticsEnabled() {
  return /^G-[A-Z0-9]+$/.test(measurementId) && productionHosts.includes(location.hostname);
}

export function track(name: "page_view" | "private_case_study_view", pathname: string) {
  if (!analyticsEnabled() || readConsent() !== "accepted") return;
  if (!initialized) {
    window.dataLayer = window.dataLayer || [];
    // Google’s queue consumes the arguments object used by its standard snippet.
    window.gtag = function () { window.dataLayer!.push(arguments); }; // eslint-disable-line prefer-rest-params
    window.gtag("consent", "default", {
      analytics_storage: "granted", ad_storage: "denied",
      ad_user_data: "denied", ad_personalization: "denied",
    });
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: `${location.origin}${pathname}`,
      page_referrer: "",
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
    initialized = true;
  }
  window.gtag?.("set", { page_location: `${location.origin}${pathname}`, page_referrer: "" });
  window.gtag?.("event", name, {
    send_to: measurementId,
    page_location: `${location.origin}${pathname}`,
    page_referrer: "",
    ...(name === "private_case_study_view" ? { study_name: "shakepay", access_state: "authorized" } : {}),
  });
}
