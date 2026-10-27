"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

const COMPOSER_HEIGHT = "--conversation-composer-height";
const PANEL_ROOM = "--conversation-panel-room";
const MEASURED_PROPERTIES = [COMPOSER_HEIGHT, PANEL_ROOM] as const;
type MeasuredProperty = typeof MEASURED_PROPERTIES[number];
type ComposerNode = Pick<HTMLElement, "closest" | "getBoundingClientRect">;
type ResizeObserverLike = Pick<ResizeObserver, "observe" | "disconnect">;
type ComposerHost = Pick<Window, "requestAnimationFrame" | "cancelAnimationFrame" | "addEventListener" | "removeEventListener"> & {
  ResizeObserver?: new (callback: () => void) => ResizeObserverLike;
  getComputedStyle?: (element: Element) => Pick<CSSStyleDeclaration, "getPropertyValue">;
};
type MeasurementOwnership = { token: object; previous: Record<MeasuredProperty, { value: string; priority: string }> };
const ownership = new WeakMap<HTMLElement, MeasurementOwnership>();

/** Measure the actual controls, including safe-area padding, without measuring their absolute popup. */
export function observeConversationComposer(composer: ComposerNode, host: ComposerHost = window, onResize?: (height: number, panelRoom: number) => void): () => void {
  const main = composer.closest<HTMLElement>(".conversation-main");
  if (!main) return () => undefined;
  const previous = ownership.get(main);
  const owned: MeasurementOwnership = { token: {}, previous: {
    [COMPOSER_HEIGHT]: previous?.previous[COMPOSER_HEIGHT] ?? { value: main.style.getPropertyValue(COMPOSER_HEIGHT), priority: main.style.getPropertyPriority(COMPOSER_HEIGHT) },
    [PANEL_ROOM]: previous?.previous[PANEL_ROOM] ?? { value: main.style.getPropertyValue(PANEL_ROOM), priority: main.style.getPropertyPriority(PANEL_ROOM) },
  } };
  ownership.set(main, owned);
  let disposed = false;
  let frame: number | null = null;
  const written = new Map<MeasuredProperty, string>();
  const update = () => {
    frame = null;
    if (disposed || ownership.get(main)?.token !== owned.token) return;
    const bounds = composer.getBoundingClientRect();
    const height = bounds.height;
    if (!Number.isFinite(height)) return;
    const mainTop = main.getBoundingClientRect().top;
    const tokenGap = Number.parseFloat(host.getComputedStyle?.(main).getPropertyValue("--space-2") ?? "");
    // The gap follows the spacing token; its fallback is the token's 8px value.
    const gap = Number.isFinite(tokenGap) ? Math.max(0, tokenGap) : 8;
    const room = Number.isFinite(bounds.top) && Number.isFinite(mainTop) ? Math.max(0, bounds.top - mainTop - gap) : 0;
    const values: Record<MeasuredProperty, string> = { [COMPOSER_HEIGHT]: `${Math.max(0, height)}px`, [PANEL_ROOM]: `${room}px` };
    let changed = false;
    for (const property of MEASURED_PROPERTIES) {
      if (written.get(property) === values[property]) continue;
      main.style.setProperty(property, values[property]);
      written.set(property, values[property]);
      changed = true;
    }
    if (!changed) return;
    onResize?.(Math.max(0, height), room);
  };
  const schedule = () => {
    if (!disposed && ownership.get(main)?.token === owned.token && frame === null) frame = host.requestAnimationFrame(update);
  };
  update();
  const observer = host.ResizeObserver ? new host.ResizeObserver(schedule) : null;
  observer?.observe(composer as HTMLElement, { box: "border-box" });
  observer?.observe(main, { box: "border-box" });
  host.addEventListener("resize", schedule, { passive: true });
  return () => {
    if (disposed) return;
    disposed = true;
    observer?.disconnect();
    host.removeEventListener("resize", schedule);
    if (frame !== null) host.cancelAnimationFrame(frame);
    if (ownership.get(main)?.token !== owned.token) return;
    ownership.delete(main);
    // Leave a newer external style intact; restore only our own last write.
    for (const property of MEASURED_PROPERTIES) {
      if (!written.has(property) || main.style.getPropertyValue(property) !== written.get(property)) continue;
      const original = owned.previous[property];
      if (original.value) main.style.setProperty(property, original.value, original.priority);
      else main.style.removeProperty(property);
    }
  };
}

/** A callback ref covers conditional mounting, replacement and conversation changes. */
export function useConversationComposer(): { ref: (element: HTMLDivElement | null) => void; height: number; panelRoom: number } {
  const [measurement, setMeasurement] = useState({ height: 0, panelRoom: 0 });
  const cleanupRef = useRef<(() => void) | null>(null);
  useLayoutEffect(() => () => { cleanupRef.current?.(); cleanupRef.current = null; }, []);
  const ref = useCallback((element: HTMLDivElement | null) => {
    cleanupRef.current?.();
    cleanupRef.current = element ? observeConversationComposer(element, window, (height, panelRoom) => setMeasurement({ height, panelRoom })) : null;
  }, []);
  return { ref, ...measurement };
}

type ConversationFeed = Pick<HTMLElement, "scrollTop" | "scrollHeight" | "clientHeight" | "getBoundingClientRect">;
type ConversationCard = Pick<HTMLElement, "getBoundingClientRect">;
type ScrollPadding = Pick<CSSStyleDeclaration, "scrollPaddingTop" | "scrollPaddingBottom">;
type PaddingReader = (feed: ConversationFeed) => ScrollPadding;
const readPadding: PaddingReader = (feed) => getComputedStyle(feed as HTMLElement);

function scrollRange(feed: ConversationFeed): number {
  return Number.isFinite(feed.scrollHeight) && Number.isFinite(feed.clientHeight) ? Math.max(0, feed.scrollHeight - feed.clientHeight) : 0;
}

function setScrollPosition(feed: ConversationFeed, requested: number): boolean {
  if (!Number.isFinite(requested)) return false;
  const position = Math.min(scrollRange(feed), Math.max(0, requested));
  if (position === feed.scrollTop) return false;
  feed.scrollTop = position;
  return true;
}

/** Physical bottom padding is part of scrollHeight, so the last item clears the overlay at the end. */
export function scrollConversationToEnd(feed: ConversationFeed): boolean {
  return setScrollPosition(feed, scrollRange(feed));
}

/** Reveal inside this feed only; never pan Safari, the page or another scrolling rail. */
export function revealConversationCard(feed: ConversationFeed, card: ConversationCard, paddingReader: PaddingReader = readPadding): boolean {
  const feedBounds = feed.getBoundingClientRect();
  const cardBounds = card.getBoundingClientRect();
  if (![feedBounds.top, cardBounds.top, cardBounds.bottom, feed.clientHeight, feed.scrollTop].every(Number.isFinite)) return false;
  const padding = paddingReader(feed);
  const pixels = (value: string) => {
    const amount = Number.parseFloat(value);
    if (!Number.isFinite(amount)) return 0;
    return Math.max(0, value.trim().endsWith("%") ? amount * feed.clientHeight / 100 : amount);
  };
  const top = feedBounds.top + pixels(padding.scrollPaddingTop);
  const bottom = Math.max(top, feedBounds.top + feed.clientHeight - pixels(padding.scrollPaddingBottom));
  const tallerThanReadingArea = cardBounds.bottom - cardBounds.top > bottom - top;
  const delta = tallerThanReadingArea || cardBounds.top < top ? cardBounds.top - top
    : cardBounds.bottom > bottom ? cardBounds.bottom - bottom : 0;
  return setScrollPosition(feed, feed.scrollTop + delta);
}
