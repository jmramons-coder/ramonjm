"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { DiscoveryFeedResult } from "@/lib/product-search/feed-types";

type FeedState = { ownerId: string; data: DiscoveryFeedResult | null; loading: boolean; error: string };
type Options = { ownerId: string; enabled: boolean; language: "fr" | "en"; getAccessToken: () => Promise<string | null> };
const EMPTY: FeedState = { ownerId: "", data: null, loading: false, error: "" };

function validFeed(value: unknown): value is DiscoveryFeedResult {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<DiscoveryFeedResult>;
  return (data.status === "ready" || data.status === "refreshing") && Array.isArray(data.items) && Array.isArray(data.editorialScopes) && Array.isArray(data.warnings);
}

/** One account-owned request shared by the sidebar, dashboard and Explore. */
export function useDiscoveryFeed({ ownerId, enabled, language, getAccessToken }: Options) {
  const [state, setState] = useState<FeedState>(EMPTY);
  const pending = useRef<{ ownerId: string; controller: AbortController; promise: Promise<void> } | null>(null);

  const load = useCallback((refresh = false): Promise<void> => {
    if (!enabled || !ownerId) return Promise.resolve();
    if (pending.current?.ownerId === ownerId) return pending.current.promise;
    pending.current?.controller.abort();
    const controller = new AbortController();
    const active = () => !controller.signal.aborted && pending.current?.controller === controller;
    const promise = (async () => {
      try {
        const token = await getAccessToken();
        if (!active()) return;
        setState((current) => ({ ownerId, data: current.ownerId === ownerId ? current.data : null, loading: true, error: "" }));
        if (!token) throw new Error(language === "fr" ? "Reconnectez-vous pour actualiser les offres." : "Sign in again to refresh offers.");
        const read = async (method: "GET" | "POST") => {
          const response = await fetch(method === "GET" ? `/api/discovery-feed?language=${language}` : "/api/discovery-feed", {
            method, signal: controller.signal, cache: "no-store",
            headers: { Authorization: `Bearer ${token}`, ...(method === "POST" ? { "Content-Type": "application/json" } : {}) },
            ...(method === "POST" ? { body: JSON.stringify({ language, refresh }) } : {}),
          });
          let payload: unknown;
          try { payload = await response.json(); } catch { throw new Error(language === "fr" ? "Les offres n’ont pas pu être chargées. Réessayez." : "Offers could not be loaded. Try again."); }
          if (!response.ok) {
            const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string" ? payload.error : null;
            throw new Error(message || (language === "fr" ? "Les offres n’ont pas pu être actualisées. Réessayez." : "Offers could not be refreshed. Try again."));
          }
          if (!validFeed(payload)) throw new Error(language === "fr" ? "Les offres reçues sont indisponibles." : "The returned offers are unavailable.");
          return payload;
        };
        let data = await read("POST");
        // Another tab may own today's request. Poll its cache, never its providers.
        for (let attempt = 0; active() && data.status === "refreshing" && attempt < 15; attempt += 1) {
          setState({ ownerId, data, loading: true, error: "" });
          await new Promise<void>((resolve) => window.setTimeout(resolve, 2_000));
          if (!active()) return;
          data = await read("GET");
        }
        if (!active()) return;
        setState({ ownerId, data, loading: false, error: data.status === "refreshing" ? (language === "fr" ? "Les offres sont encore en cours d’actualisation. Réessayez dans un instant." : "Offers are still updating. Try again shortly.") : "" });
      } catch (error) {
        if (!active()) return;
        const message = error instanceof Error ? error.message : (language === "fr" ? "L’actualisation a échoué." : "Refresh failed.");
        setState((current) => ({ ownerId, data: current.ownerId === ownerId ? current.data : null, loading: false, error: message }));
        throw error;
      } finally {
        if (active()) pending.current = null;
      }
    })();
    pending.current = { ownerId, controller, promise };
    return promise;
  }, [enabled, getAccessToken, language, ownerId]);

  useEffect(() => {
    if (enabled && ownerId) void load().catch(() => {});
    return () => {
      pending.current?.controller.abort();
      pending.current = null;
    };
  }, [enabled, load, ownerId]);

  const owned = enabled && state.ownerId === ownerId ? state : EMPTY;
  useEffect(() => {
    const next = Date.parse(owned.data?.nextRefreshAt ?? "");
    if (!enabled || !Number.isFinite(next) || next <= Date.now()) return;
    const timer = window.setTimeout(() => void load().catch(() => {}), Math.min(next - Date.now() + 1_000, 86_401_000));
    return () => window.clearTimeout(timer);
  }, [enabled, load, owned.data?.nextRefreshAt]);

  return { data: owned.data, error: owned.error, loading: enabled && Boolean(ownerId) && (state.ownerId !== ownerId || owned.loading), refresh: () => load(true) };
}
