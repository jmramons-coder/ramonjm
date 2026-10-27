import { randomUUID } from "node:crypto";
import type { createAdminClient } from "../supabase/admin";
import type { ProductSearchReservation } from "./service.ts";

export const PRODUCT_RESEARCH_BUCKET = "product-research";
export const PRODUCT_RESEARCH_MAX_BYTES = 512 * 1024;
export const PRODUCT_RESEARCH_DAILY_CREDITS = 60;
export const PRODUCT_RESEARCH_WINDOW_SECONDS = 30;

export type StorageFailure = { status?: number; statusCode?: string; code?: string; message?: string };
type BucketConfig = { public: boolean; file_size_limit?: number; allowed_mime_types?: string[] };
export type ResearchStorageIO = {
  bucket(): Promise<{ data: BucketConfig | null; error: StorageFailure | null }>;
  createBucket(): Promise<{ error: StorageFailure | null }>;
  put(path: string, json: string): Promise<{ error: StorageFailure | null }>;
  get(path: string): Promise<{ data: Blob | null; error: StorageFailure | null }>;
  list(path: string, limit: number): Promise<{ data: { name: string }[] | null; error: StorageFailure | null }>;
};

const duplicate = (error: StorageFailure | null) => error?.status === 409 || error?.statusCode === "409"
  || error?.code === "ResourceAlreadyExists" || error?.code === "KeyAlreadyExists" || error?.code === "Duplicate"
  || (error?.status === 400 && error.message === "The resource already exists");
const missing = (error: StorageFailure | null) => error?.status === 404 || error?.statusCode === "404"
  || error?.code === "NoSuchBucket" || error?.code === "NoSuchKey" || error?.code === "not_found"
  || (error?.status === 400 && /^(Bucket|Object|The resource) not found\.?$/i.test(error.message ?? ""));
const validOwner = (ownerId: string) => /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(ownerId);

/** Immutable owner/day ledger. No SQL, browser-owned paths, refunds or CAS. */
export class ProductResearchStorage {
  private ready: Promise<void> | undefined;
  private readonly io: ResearchStorageIO;
  constructor(io: ResearchStorageIO) { this.io = io; }

  async ensure(): Promise<void> {
    if (!this.ready) this.ready = this.ensureBucket();
    return this.ready;
  }

  private async ensureBucket() {
    let checked = await this.io.bucket();
    if (checked.error && missing(checked.error)) {
      const created = await this.io.createBucket();
      if (created.error && !duplicate(created.error)) throw new Error("Research storage unavailable");
      checked = await this.io.bucket();
    }
    // Never change or relax a conflicting bucket. All reads and writes fail.
    if (checked.error || !checked.data || checked.data.public !== false
      || checked.data.file_size_limit !== PRODUCT_RESEARCH_MAX_BYTES
      || checked.data.allowed_mime_types?.length !== 1
      || checked.data.allowed_mime_types[0] !== "application/json") throw new Error("Research storage configuration conflicts");
  }

  ownerPath(ownerId: string) {
    if (!validOwner(ownerId)) throw new Error("Invalid research owner");
    return `v1/owners/${ownerId.toLowerCase()}`;
  }

  async put(path: string, value: unknown): Promise<"created" | "exists"> {
    await this.ensure();
    const json = JSON.stringify(value);
    if (new TextEncoder().encode(json).byteLength > PRODUCT_RESEARCH_MAX_BYTES) throw new Error("Research object too large");
    const { error } = await this.io.put(path, json);
    if (!error) return "created";
    if (duplicate(error)) return "exists";
    throw new Error("Research write unavailable");
  }

  async get(path: string): Promise<unknown | null> {
    await this.ensure();
    const { data, error } = await this.io.get(path);
    if (error && missing(error)) return null;
    if (error || !data || data.size > PRODUCT_RESEARCH_MAX_BYTES) throw new Error("Research read unavailable");
    try { return JSON.parse(await data.text()); } catch { throw new Error("Invalid research object"); }
  }

  async list(path: string, limit = 100): Promise<string[]> {
    await this.ensure();
    const { data, error } = await this.io.list(path, Math.min(100, Math.max(1, limit)));
    if (error || !data) throw new Error("Research listing unavailable");
    return data.map((entry) => entry.name).filter((name) => name && !name.includes("/") && name !== "." && name !== "..");
  }

  async reserve(ownerId: string, requested: number, now = new Date(), purpose: "manual" | "daily" = "manual"): Promise<ProductSearchReservation> {
    const owner = this.ownerPath(ownerId);
    if (!Number.isInteger(requested) || requested < 1 || requested > 2) throw new Error("Invalid research cost");
    const day = now.toISOString().slice(0, 10);
    const root = `${owner}/days/${day}`;
    const reservationId = randomUUID();
    const window = Math.floor(now.getTime() / (PRODUCT_RESEARCH_WINDOW_SECONDS * 1000));
    const retryAfterSeconds = Math.max(1, Math.ceil(((window + 1) * PRODUCT_RESEARCH_WINDOW_SECONDS * 1000 - now.getTime()) / 1000));
    // Fixed time-window objects bound concurrent requests without unsafe lock
    // deletion: <=3 overlapping requests per owner under the 60s route limit.
    const gate = await this.put(`${root}/windows/${purpose}_${window}.json`, { reservationId, ownerId, requested, purpose, startedAt: now.toISOString() });
    if (gate === "exists") return { id: null, remaining: 0, reason: "cooldown", retryAfterSeconds };
    const names = await this.list(`${root}/credits`);
    const occupied = new Set(names.filter((name) => /^\d{2}\.json$/.test(name)));
    if (occupied.size + requested > PRODUCT_RESEARCH_DAILY_CREDITS) return { id: null, remaining: Math.max(0, PRODUCT_RESEARCH_DAILY_CREDITS - occupied.size), reason: "limit", retryAfterSeconds: secondsToNextDay(now) };
    const slots: number[] = [];
    for (let slot = 1; slot <= PRODUCT_RESEARCH_DAILY_CREDITS && slots.length < requested; slot++) {
      const name = `${String(slot).padStart(2, "0")}.json`;
      if (occupied.has(name)) continue;
      const written = await this.put(`${root}/credits/${name}`, { ownerId, reservationId, requested, claimedAt: now.toISOString() });
      if (written === "created") slots.push(slot);
      occupied.add(name);
    }
    if (slots.length !== requested) return { id: null, remaining: 0, reason: "limit", retryAfterSeconds: secondsToNextDay(now) };
    const id = `storage:${day}:${reservationId}`;
    const manifest = { id, ownerId, day, requested, slots, purpose, claimedAt: now.toISOString() };
    if (await this.put(`${root}/reservations/${reservationId}.json`, manifest) !== "created") throw new Error("Research manifest conflict");
    const latest = await this.list(`${root}/credits`);
    return { id, remaining: Math.max(0, PRODUCT_RESEARCH_DAILY_CREDITS - latest.filter((name) => /^\d{2}\.json$/.test(name)).length) };
  }

  async confirm(ownerId: string, reservationId: string): Promise<boolean> {
    const match = /^storage:(\d{4}-\d{2}-\d{2}):([a-f\d-]{36})$/.exec(reservationId);
    if (!match) return false;
    const value = await this.get(`${this.ownerPath(ownerId)}/days/${match[1]}/reservations/${match[2]}.json`);
    if (!value || typeof value !== "object") return false;
    const record = value as Record<string, unknown>;
    // All slots remain charged. Confirmation never deletes or refunds one.
    return record.id === reservationId && record.ownerId === ownerId && Array.isArray(record.slots)
      && (record.slots.length === 1 || record.slots.length === 2);
  }
}

export function secondsToNextDay(now: Date): number {
  const day = Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
  return Math.max(1, Math.ceil((day + 86_400_000 - now.getTime()) / 1000));
}

export function productResearchStorage(admin: ReturnType<typeof createAdminClient>) {
  const bucket = admin.storage.from(PRODUCT_RESEARCH_BUCKET);
  return new ProductResearchStorage({
    bucket: () => admin.storage.getBucket(PRODUCT_RESEARCH_BUCKET),
    createBucket: () => admin.storage.createBucket(PRODUCT_RESEARCH_BUCKET, { public: false, fileSizeLimit: PRODUCT_RESEARCH_MAX_BYTES, allowedMimeTypes: ["application/json"] }),
    put: (path, json) => bucket.upload(path, new Blob([json], { type: "application/json" }), { contentType: "application/json", upsert: false, cacheControl: "0" }),
    get: (path) => bucket.download(path),
    list: (path, limit) => bucket.list(path, { limit, sortBy: { column: "name", order: "desc" } }),
  });
}
