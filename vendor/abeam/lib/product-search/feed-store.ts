import { emptyDiscoveryFeed, readDiscoveryFeedSnapshot, mergeDiscoveryFeed, validDiscoveryFeedBatch, pruneDiscoveryFeed } from "./feed-cache.ts";
import { ProductResearchStorage } from "./research-storage.ts";
import type { DiscoveryFeedClaim, DiscoveryFeedSnapshot } from "./feed-types.ts";

export const DISCOVERY_FEED_REFRESH_SECONDS = 120;
const CLAIM_SECONDS = 60;
type Marker = { claimId: string; ownerId: string; day: string; sequence: number; startedAt: string; resultName: string };
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
const marker = (value: unknown, ownerId: string): Marker | null => {
  const data = object(value);
  if (data.ownerId !== ownerId || typeof data.claimId !== "string" || !/^storage:\d{4}-\d{2}-\d{2}:[a-f\d-]{36}$/.test(data.claimId)
    || typeof data.day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.day)
    || typeof data.startedAt !== "string" || !Number.isFinite(Date.parse(data.startedAt))
    || typeof data.sequence !== "number" || !Number.isSafeInteger(data.sequence) || data.sequence < 0
    || typeof data.resultName !== "string" || !/^\d{4}-\d{2}-\d{2}T[\d:.]+Z_[a-f\d-]{36}\.json$/.test(data.resultName)) return null;
  return data as Marker;
};

/** Immutable successful batches; failures never evict the last good offers. */
export class DiscoveryFeedStorage {
  private readonly storage: ProductResearchStorage;
  constructor(storage: ProductResearchStorage) { this.storage = storage; }

  private async currentMarkers(ownerId: string, day: string) {
    const root = `${this.storage.ownerPath(ownerId)}/feed/markers/${day}`;
    const names = await this.storage.list(root, 64);
    const latestRefresh = names.find((name) => /^r_\d+\.json$/.test(name));
    const [dailyValue, refreshValue] = await Promise.all([
      this.storage.get(`${root}/daily.json`), latestRefresh ? this.storage.get(`${root}/${latestRefresh}`) : Promise.resolve(null),
    ]);
    const daily = marker(dailyValue, ownerId);
    const refresh = marker(refreshValue, ownerId);
    const latest = [daily, refresh].filter((entry): entry is Marker => Boolean(entry)).sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))[0] ?? null;
    return { daily, latest, count: names.filter((name) => name === "daily.json" || /^r_\d+\.json$/.test(name)).length };
  }

  async read(ownerId: string, now = new Date()): Promise<DiscoveryFeedClaim> {
    const owner = this.storage.ownerPath(ownerId);
    const day = now.toISOString().slice(0, 10);
    const names = (await this.storage.list(`${owner}/feed/results`, 16)).filter((name) => /^\d{4}-\d{2}-\d{2}T[\d:.]+Z_[a-f\d-]{36}\.json$/.test(name));
    const values = await Promise.all(names.slice(0, 8).map((name) => this.storage.get(`${owner}/feed/results/${name}`)));
    const results = values.map(object).filter((value) => value.ownerId === ownerId && value.status === "ready" && validDiscoveryFeedBatch(value.snapshot) && typeof value.completedAt === "string" && Number.isFinite(Date.parse(value.completedAt)))
      .sort((a, b) => Date.parse(a.completedAt as string) - Date.parse(b.completedAt as string));
    let snapshot = emptyDiscoveryFeed();
    for (const result of results) {
      const batch = readDiscoveryFeedSnapshot(result.snapshot);
      const scope = batch.editorialScopes[0];
      if (scope && batch.refreshedAt) snapshot = mergeDiscoveryFeed(snapshot, batch.items, scope, batch.refreshedAt);
    }
    snapshot = pruneDiscoveryFeed(snapshot, now);
    const { daily, latest, count } = await this.currentMarkers(ownerId, day);
    const successValue = latest ? object(await this.storage.get(`${owner}/feed/results/${latest.resultName}`)) : null;
    const latestSuccess = latest && successValue?.ownerId === ownerId && successValue.claimId === latest.claimId && successValue.status === "ready" && validDiscoveryFeedBatch(successValue.snapshot) ? successValue : null;
    const errorValue = latest && !latestSuccess ? object(await this.storage.get(`${owner}/feed/errors/${latest.resultName}`)) : null;
    const latestError = latest && errorValue?.ownerId === ownerId && errorValue.claimId === latest.claimId && errorValue.status === "error" ? errorValue : null;
    const age = latest ? (now.getTime() - Date.parse(latest.startedAt)) / 1000 : Infinity;
    const active = Boolean(latest && !latestSuccess?.status && !latestError?.status && age < CLAIM_SECONDS);
    const expired = Boolean(latest && !latestSuccess?.status && !latestError?.status && age >= CLAIM_SECONDS);
    const lastError = latestError?.status === "error" || expired ? "provider_unavailable" : undefined;
    const manualRefreshAt = latest ? new Date(Date.parse(latest.startedAt) + DISCOVERY_FEED_REFRESH_SECONDS * 1000).toISOString() : undefined;
    return {
      claimId: null, state: active ? "busy" : "cached", sequence: Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000) + count,
      snapshot, automaticAttemptDay: daily ? day : null, manualRefreshAt, lastError,
      retryAfterSeconds: active ? Math.max(1, Math.ceil(CLAIM_SECONDS - age)) : undefined,
    };
  }

  async claim(ownerId: string, refresh: boolean, now = new Date()): Promise<DiscoveryFeedClaim> {
    const existing = await this.read(ownerId, now);
    const day = now.toISOString().slice(0, 10);
    if (!refresh && (existing.automaticAttemptDay === day || existing.snapshot.day === day)) return existing;
    if (existing.state === "busy") return existing;
    if (refresh && existing.manualRefreshAt && Date.parse(existing.manualRefreshAt) > now.getTime()) return { ...existing, state: "cooldown", retryAfterSeconds: Math.ceil((Date.parse(existing.manualRefreshAt) - now.getTime()) / 1000) };
    const budget = await this.storage.reserve(ownerId, 2, now, "daily");
    if (!budget.id) return {
      ...existing,
      state: budget.reason === "limit" ? "limit" : budget.reason === "cooldown"
        ? (existing.snapshot.items.length || existing.manualRefreshAt ? "cooldown" : "busy")
        : budget.reason === "busy" ? "busy" : "unavailable",
      retryAfterSeconds: budget.retryAfterSeconds, searchesRemaining: budget.remaining,
    };
    const owner = this.storage.ownerPath(ownerId);
    const uuid = budget.id.split(":")[2];
    const next: Marker = { ownerId, claimId: budget.id, day, sequence: existing.sequence, startedAt: now.toISOString(), resultName: `${now.toISOString()}_${uuid}.json` };
    const markerName = refresh ? `r_${Math.floor(now.getTime() / (DISCOVERY_FEED_REFRESH_SECONDS * 1000))}.json` : "daily.json";
    if (await this.storage.put(`${owner}/feed/markers/${day}/${markerName}`, next) !== "created") return { ...await this.read(ownerId, now), searchesRemaining: budget.remaining };
    if (await this.storage.put(`${owner}/feed/claims/${uuid}.json`, next) !== "created") throw new Error("Discovery claim conflict");
    return {
      ...existing, claimId: budget.id, state: "claimed", searchesRemaining: budget.remaining,
      automaticAttemptDay: !refresh ? day : existing.automaticAttemptDay,
      manualRefreshAt: new Date(now.getTime() + DISCOVERY_FEED_REFRESH_SECONDS * 1000).toISOString(), retryAfterSeconds: CLAIM_SECONDS,
    };
  }

  async finish(ownerId: string, claimId: string, payload: DiscoveryFeedSnapshot | null, now = new Date()): Promise<boolean> {
    const id = /^storage:(\d{4}-\d{2}-\d{2}):([a-f\d-]{36})$/.exec(claimId);
    if (!id || !await this.storage.confirm(ownerId, claimId)) return false;
    const owner = this.storage.ownerPath(ownerId);
    const claim = marker(await this.storage.get(`${owner}/feed/claims/${id[2]}.json`), ownerId);
    if (!claim || claim.claimId !== claimId) return false;
    const snapshot = payload ? readDiscoveryFeedSnapshot(payload) : null;
    if (payload && !validDiscoveryFeedBatch(payload)) return false;
    const result = { ownerId, claimId, status: snapshot ? "ready" : "error", snapshot, completedAt: now.toISOString() };
    const path = `${owner}/feed/${snapshot ? "results" : "errors"}/${claim.resultName}`;
    if (await this.storage.put(path, result) === "created") return true;
    const previous = object(await this.storage.get(path));
    return previous.ownerId === ownerId && previous.claimId === claimId;
  }
}
