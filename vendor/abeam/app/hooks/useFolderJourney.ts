"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { journeyIdentifier, parseFolderJourneyResponse, parseJourneyEntry, type FolderJourney, type FolderJourneySource, type JourneyEntry, type JourneyMutation } from "../../lib/journey/types.ts";

export type FolderJourneyOptions = {
  sessionId: string;
  folderKey: string;
  ownerId: string;
  language: "fr" | "en";
  enabled: boolean;
  /** Reload trigger only; the server's source signature determines staleness. */
  sourceSignature?: string;
  getAccessSession: () => Promise<{ ownerId: string; accessToken: string } | null>;
};
type JourneyState = {
  journey: FolderJourney | null;
  source: FolderJourneySource | null;
  loaded: boolean;
  loading: boolean;
  generating: boolean;
  saving: boolean;
  error: string;
  conflict: boolean;
  pendingMutation: JourneyMutation | null;
};
type Operation = { action: "load" } | { action: "generate" } | { action: "save"; mutation: JourneyMutation };
const EMPTY: JourneyState = { journey: null, source: null, loaded: false, loading: false, generating: false, saving: false, error: "", conflict: false, pendingMutation: null };
const cancelled = () => new DOMException("The folder journey request was cancelled.", "AbortError");
class JourneyApiError extends Error {
  readonly conflict: boolean;
  constructor(message: string, status: number) { super(message); this.conflict = status === 409; }
}

/** The actual scoped request pipeline, also exercised with deferred offline I/O. */
export function createFolderJourneyController(options: FolderJourneyOptions, request: typeof fetch = fetch) {
  const fr = options.language === "fr";
  const message = (french: string, english: string) => fr ? french : english;
  const validScope = options.enabled && Boolean(options.ownerId && options.folderKey && journeyIdentifier(options.sessionId));
  let state: JourneyState = EMPTY;
  let active = false;
  let generation = 0;
  let failureVersion = 0;
  let lastFailure: Error | null = null;
  let retryOperation: Operation | null = null;
  let hasSnapshot = false;
  let transport: AbortController | null = null;
  let tail = Promise.resolve();
  let pendingLoad: Promise<void> | null = null;
  let pendingGenerate: Promise<void> | null = null;
  const counts = { load: 0, generate: 0, save: 0 };
  const listeners = new Set<() => void>();
  const publish = (changes: Partial<JourneyState>) => {
    state = { ...state, ...changes };
    listeners.forEach((listener) => listener());
  };
  const current = (version: number) => active && validScope && generation === version;
  const assertCurrent = (version: number) => { if (!current(version)) throw cancelled(); };
  const read = async (operation: Operation, version: number) => {
    assertCurrent(version);
    const session = await options.getAccessSession();
    assertCurrent(version);
    if (!session || session.ownerId !== options.ownerId || !session.accessToken) throw new Error(message("Reconnectez-vous pour ouvrir le parcours de ce dossier.", "Sign in again to open this folder’s journey."));
    const controller = new AbortController();
    transport = controller;
    try {
      const response = await request("/api/folder-journey", {
        method: "POST", cache: "no-store", signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({ action: operation.action, sessionId: options.sessionId, language: options.language,
          ...(operation.action !== "load" ? { expectedRevision: state.journey?.revision ?? null } : {}),
          ...(operation.action === "save" ? { mutation: operation.mutation } : {}) }),
      });
      assertCurrent(version);
      let payload: unknown;
      try { payload = await response.json(); }
      catch { assertCurrent(version); throw new Error(message("Le parcours reçu est indisponible. Réessayez.", "The returned journey is unavailable. Try again.")); }
      assertCurrent(version);
      if (!response.ok) {
        const error = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string" ? payload.error : message("Le parcours n’a pas pu être enregistré. Réessayez.", "The journey could not be saved. Try again.");
        throw new JourneyApiError(error, response.status);
      }
      const parsed = parseFolderJourneyResponse(payload);
      if (!parsed) throw new Error(message("Le parcours reçu est indisponible. Réessayez.", "The returned journey is unavailable. Try again."));
      return parsed;
    } finally {
      if (transport === controller) transport = null;
    }
  };
  const accept = (data: NonNullable<ReturnType<typeof parseFolderJourneyResponse>>) => { hasSnapshot = true; publish({ journey: data.journey, source: data.source, loaded: true }); };
  const run = async (operation: Operation, version: number, expectedFailure: number) => {
    assertCurrent(version);
    // A queued write must not silently reapply after a predecessor conflicts/fails.
    if (expectedFailure !== failureVersion) throw lastFailure ?? new Error(message("Réessayez la modification précédente.", "Retry the previous change."));
    try {
      if (operation.action !== "load" && !hasSnapshot) accept(await read({ action: "load" }, version));
      const data = await read(operation, version);
      assertCurrent(version);
      accept(data);
      if (operation.action !== "load" || !retryOperation || retryOperation.action === "load") {
        publish({ error: "", conflict: false, ...(operation.action === "save" ? { pendingMutation: null } : {}) });
        retryOperation = null;
      }
    } catch (error) {
      if (!current(version)) throw cancelled();
      const failure = error instanceof Error ? error : new Error(message("Le parcours est indisponible. Réessayez.", "The journey is unavailable. Try again."));
      failureVersion++;
      lastFailure = failure;
      retryOperation = operation;
      const conflict = failure instanceof JourneyApiError && failure.conflict;
      let text = failure.message;
      if (conflict) {
        // Refresh only. Regeneration/reapplying a local draft needs another explicit action.
        try { accept(await read({ action: "load" }, version)); }
        catch (refreshError) {
          if (!current(version)) throw cancelled();
          text += ` ${message("L’actualisation a aussi échoué. Votre modification est conservée.", "Refresh also failed. Your change is retained.")}`;
          if (refreshError instanceof JourneyApiError && refreshError.conflict) lastFailure = refreshError;
        }
      }
      assertCurrent(version);
      publish({ loaded: true, error: text, conflict, ...(operation.action === "save" ? { pendingMutation: operation.mutation } : {}) });
      throw failure;
    }
  };
  const enqueue = (operation: Operation) => {
    const version = generation;
    if (!current(version)) return Promise.reject(cancelled());
    const expectedFailure = failureVersion;
    counts[operation.action]++;
    publish({ loading: counts.load > 0, generating: counts.generate > 0, saving: counts.save > 0, ...(!state.conflict ? { error: "" } : {}) });
    const promise = tail.then(() => run(operation, version, expectedFailure)).finally(() => {
      if (!current(version)) return;
      counts[operation.action]--;
      publish({ loading: counts.load > 0, generating: counts.generate > 0, saving: counts.save > 0 });
    });
    // Keep the queue usable after rejection without swallowing the caller's failure.
    tail = promise.catch(() => {});
    return promise;
  };
  const load = (): Promise<void> => {
    if (pendingLoad) return pendingLoad;
    const promise = enqueue({ action: "load" }).finally(() => { if (pendingLoad === promise) pendingLoad = null; });
    pendingLoad = promise;
    return promise;
  };
  const generate = (): Promise<void> => {
    if (pendingGenerate) return pendingGenerate;
    const promise = enqueue({ action: "generate" }).finally(() => { if (pendingGenerate === promise) pendingGenerate = null; });
    pendingGenerate = promise;
    return promise;
  };
  const save = (mutation: JourneyMutation) => enqueue({ action: "save", mutation });
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    start() { active = true; },
    stop() {
      active = false; generation++; transport?.abort(); transport = null;
      pendingLoad = null; pendingGenerate = null; tail = Promise.resolve();
      counts.load = 0; counts.generate = 0; counts.save = 0;
      publish({ loading: false, generating: false, saving: false });
    },
    load, generate,
    saveEntry(entry: JourneyEntry): Promise<void> {
      const parsed = parseJourneyEntry(entry);
      return parsed ? save({ type: "upsert", entry: parsed }) : Promise.reject(new Error(message("Vérifiez les informations de cette étape.", "Check this step’s information.")));
    },
    toggleEntry(id: string, done: boolean): Promise<void> {
      return journeyIdentifier(id) && typeof done === "boolean" ? save({ type: "toggle", id, done }) : Promise.reject(new Error(message("Cette étape est indisponible.", "This step is unavailable.")));
    },
    removeEntry(id: string): Promise<void> {
      return journeyIdentifier(id) ? save({ type: "remove", id }) : Promise.reject(new Error(message("Cette étape est indisponible.", "This step is unavailable.")));
    },
    discardPendingMutation() {
      if (counts.save > 0 || !state.pendingMutation) return;
      const discardedSave = retryOperation?.action === "save";
      if (discardedSave) { retryOperation = null; lastFailure = null; }
      publish({ pendingMutation: null, ...(discardedSave ? { error: "", conflict: false } : {}) });
    },
    retry(): Promise<void> {
      if (!retryOperation || retryOperation.action === "load") return load();
      return retryOperation.action === "generate" ? generate() : save(retryOperation.mutation);
    },
  };
}

export function useFolderJourney(options: FolderJourneyOptions) {
  const { ownerId, folderKey, sessionId, language, enabled, sourceSignature, getAccessSession } = options;
  // Each selected scope owns its own store. Old responses cannot enter another folder/account.
  const controller = useMemo(() => createFolderJourneyController({ ownerId, folderKey, sessionId, language, enabled, getAccessSession }), [ownerId, folderKey, sessionId, language, enabled, getAccessSession]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, () => EMPTY);
  const available = enabled && Boolean(ownerId && folderKey && journeyIdentifier(sessionId));
  useEffect(() => {
    if (!available) return;
    controller.start();
    return () => controller.stop();
  }, [available, controller]);
  useEffect(() => { if (available) void controller.load().catch(() => {}); }, [available, controller, sourceSignature]);
  return { ...state, loading: available && (!state.loaded || state.loading),
    stale: Boolean(state.journey?.generatedSourceSignature && state.source && state.journey.generatedSourceSignature !== state.source.signature),
    load: controller.load, generate: controller.generate, saveEntry: controller.saveEntry, toggleEntry: controller.toggleEntry, removeEntry: controller.removeEntry, discardPendingMutation: controller.discardPendingMutation, retry: controller.retry };
}
