"use client";

import { useCallback, useRef, type RefCallback } from "react";

type ProcessingOffsetHost = Pick<Window, "addEventListener" | "removeEventListener"> & {
  ResizeObserver?: typeof ResizeObserver;
};

const PROCESSING_HEIGHT = "--folder-processing-height";
const IDENTITY_HEIGHT = "--folder-identity-height";
const processingOwners = new WeakMap<HTMLElement, () => void>();
const identityOwners = new WeakMap<HTMLElement, () => void>();

/** Measure only this wrapper, and publish its border-box height on its direct parent. */
function observeFolderHeaderOffset(wrapper: HTMLElement, host: ProcessingOffsetHost, property: string, owners: WeakMap<HTMLElement, () => void>): () => void {
  const page = wrapper.parentElement;
  if (!page) return () => {};

  owners.get(page)?.();
  let disposed = false;
  let previousValue = page.style.getPropertyValue(property);
  let previousPriority = page.style.getPropertyPriority(property);
  let lastWritten: string | null = null;

  const measure = () => {
    if (disposed || owners.get(page) !== stop || wrapper.isConnected === false || wrapper.parentElement !== page) return;
    const height = wrapper.getBoundingClientRect().height;
    if (!Number.isFinite(height)) return;
    const value = `${Math.max(0, height)}px`;
    const currentValue = page.style.getPropertyValue(property);
    const currentPriority = page.style.getPropertyPriority(property);
    if (lastWritten === null || currentValue !== lastWritten || currentPriority) {
      previousValue = currentValue;
      previousPriority = currentPriority;
    }
    if (currentValue !== value || currentPriority) page.style.setProperty(property, value);
    lastWritten = value;
  };

  const observer = host.ResizeObserver ? new host.ResizeObserver(measure) : null;
  const stop = () => {
    if (disposed) return;
    disposed = true;
    observer?.disconnect();
    host.removeEventListener("resize", measure);
    if (owners.get(page) !== stop) return;
    if (lastWritten !== null && page.style.getPropertyValue(property) === lastWritten && !page.style.getPropertyPriority(property)) {
      if (previousValue) page.style.setProperty(property, previousValue, previousPriority);
      else page.style.removeProperty(property);
    }
    owners.delete(page);
  };

  owners.set(page, stop);
  if (observer) {
    try {
      observer.observe(wrapper, { box: "border-box" });
    } catch {
      observer.observe(wrapper);
    }
  }
  host.addEventListener("resize", measure, { passive: true });
  measure();
  return stop;
}

export function observeFolderProcessingOffset(wrapper: HTMLElement, host: ProcessingOffsetHost = window): () => void {
  return observeFolderHeaderOffset(wrapper, host, PROCESSING_HEIGHT, processingOwners);
}

export function observeFolderIdentityOffset(wrapper: HTMLElement, host: ProcessingOffsetHost = window): () => void {
  return observeFolderHeaderOffset(wrapper, host, IDENTITY_HEIGHT, identityOwners);
}

function useFolderHeaderOffset(observe: typeof observeFolderProcessingOffset): RefCallback<HTMLElement> {
  const cleanupRef = useRef<(() => void) | null>(null);
  return useCallback((wrapper: HTMLElement | null) => {
    cleanupRef.current?.();
    cleanupRef.current = wrapper ? observe(wrapper) : null;
  }, [observe]);
}

/** These two rows own independent offsets on the same overview page. */
export function useFolderProcessingOffset(): RefCallback<HTMLElement> {
  return useFolderHeaderOffset(observeFolderProcessingOffset);
}

export function useFolderIdentityOffset(): RefCallback<HTMLElement> {
  return useFolderHeaderOffset(observeFolderIdentityOffset);
}
