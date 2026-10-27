"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export type LandingIntroState = Readonly<{ visible: boolean; exiting: boolean }>;
type IntroHost = { now: () => number; setTimeout: (callback: () => void, delay: number) => number; clearTimeout: (id: number) => void };
type MotionPreference = Pick<MediaQueryList, "matches" | "addEventListener" | "removeEventListener">;
const VISIBLE: LandingIntroState = { visible: true, exiting: false };
const EXITING: LandingIntroState = { visible: true, exiting: true };
const HIDDEN: LandingIntroState = { visible: false, exiting: false };
const MINIMUM_MS = 1_000;
const EXIT_MS = 200;

/** One initial entry only. The clock starts in the effect, never during SSR/render. */
export function createLandingIntroController(host: IntroHost) {
  let state = VISIBLE;
  let mountedAt: number | null = null;
  let exitEndsAt: number | null = null;
  let active = false;
  let timer: number | null = null;
  let revision = 0;
  let ready = false;
  let enabled = true;
  let reducedMotion = false;
  const listeners = new Set<() => void>();
  const publish = (next: LandingIntroState) => {
    if (state === next) return;
    state = next;
    listeners.forEach((listener) => listener());
  };
  const cancel = () => {
    revision++;
    if (timer !== null) host.clearTimeout(timer);
    timer = null;
  };
  const schedule = (delay: number) => {
    const current = revision;
    timer = host.setTimeout(() => {
      if (!active || revision !== current) return;
      timer = null;
      reconcile();
    }, delay);
  };
  const reconcile = () => {
    cancel();
    if (!active || state === HIDDEN) return;
    if (!enabled) { publish(HIDDEN); return; }
    if (!ready) { exitEndsAt = null; publish(VISIBLE); return; }
    if (reducedMotion) { publish(HIDDEN); return; }
    const now = host.now();
    const remaining = (mountedAt ?? now) + MINIMUM_MS - now;
    if (remaining > 0) { publish(VISIBLE); schedule(remaining); return; }
    exitEndsAt ??= now + EXIT_MS;
    if (exitEndsAt <= now) { publish(HIDDEN); return; }
    publish(EXITING);
    schedule(exitEndsAt - now);
  };
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    start() { active = true; mountedAt ??= host.now(); },
    update(nextReady: boolean, nextEnabled: boolean, nextReducedMotion: boolean) {
      ready = nextReady; enabled = nextEnabled; reducedMotion = nextReducedMotion;
      reconcile();
    },
    stop() { active = false; cancel(); },
  };
}

/** Shared effect lifecycle makes preference changes and Strict Mode cleanup testable. */
export function observeLandingIntro(controller: ReturnType<typeof createLandingIntroController>, ready: boolean, enabled: boolean, preference?: MotionPreference) {
  let active = true;
  controller.start();
  const update = () => { if (active) controller.update(ready, enabled, preference?.matches ?? false); };
  update();
  preference?.addEventListener("change", update);
  return () => { active = false; preference?.removeEventListener("change", update); controller.stop(); };
}

export function useLandingIntro(ready: boolean, enabled: boolean): LandingIntroState {
  const [controller] = useState(() => createLandingIntroController({
    now: () => performance.now(),
    setTimeout: (callback, delay) => window.setTimeout(callback, delay),
    clearTimeout: (id) => window.clearTimeout(id),
  }));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, () => VISIBLE);
  useEffect(() => observeLandingIntro(controller, ready, enabled, window.matchMedia?.("(prefers-reduced-motion: reduce)")), [controller, ready, enabled]);
  // Known auth/login/recovery views bypass even the render before effect cleanup.
  return enabled ? state : HIDDEN;
}
