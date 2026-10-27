import type { SupabaseClient } from "@supabase/supabase-js";
import { createDemoSeed, DEMO_IDS } from "./fixtures.ts";

export const STORAGE_KEY = "portfolio.abeam.demo.workspace.v1";
export type DemoRow = Record<string, unknown>;
type Tables = Record<string, DemoRow[]>;
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type QueryError = {
  message: string;
  code: string;
  details: string;
  hint: string;
};
type QueryResult = {
  data: DemoRow[] | DemoRow | null;
  error: QueryError | null;
  count: number | null;
  status: number;
  statusText: string;
};
const TABLES = new Set([
  "profiles",
  "agencies",
  "clients",
  "trips",
  "sessions",
  "session_events",
]);
const clone = <T>(value: T): T => structuredClone(value);
const error = (message: string, code = "DEMO_UNAVAILABLE"): QueryError => ({
  message,
  code,
  details: "Visitor-local portfolio workspace",
  hint: "",
});
const record = (value: unknown): value is DemoRow =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));
const equivalent = (a: unknown, b: unknown): boolean => {
  if (typeof a === "object" && a !== null && typeof b === "string") {
    try {
      return equivalent(a, JSON.parse(b));
    } catch {
      return false;
    }
  }
  if (record(a) && record(b))
    return (
      Object.keys(a).length === Object.keys(b).length &&
      Object.keys(a).every((key) => equivalent(a[key], b[key]))
    );
  if (Array.isArray(a) && Array.isArray(b))
    return (
      a.length === b.length &&
      a.every((item, index) => equivalent(item, b[index]))
    );
  return a === b;
};

export class DemoDatabase {
  private tables: Tables | null = null;
  private serialized = "";
  private storageAvailable = true;
  constructor(
    private readonly storage: () => StorageLike | undefined = () =>
      typeof window === "undefined" ? undefined : window.localStorage,
  ) {}
  private read(): Tables {
    // Re-read our own namespace so separate tabs see edits; inaccessible storage stays in memory.
    try {
      const saved = this.storageAvailable
        ? this.storage()?.getItem(STORAGE_KEY)
        : null;
      if (saved && saved !== this.serialized) {
        const value: unknown = JSON.parse(saved);
        if (
          record(value) &&
          value.version === 1 &&
          record(value.tables) &&
          [...TABLES].every(
            (table) =>
              Array.isArray((value.tables as DemoRow)[table]) &&
              ((value.tables as DemoRow)[table] as unknown[]).every(record),
          )
        ) {
          this.tables = value.tables as Tables;
          this.serialized = saved;
        }
      }
    } catch {
      this.storageAvailable = false; /* Private browsing still permits an in-memory demo. */
    }
    if (!this.tables) {
      this.tables = createDemoSeed();
      this.persist();
    }
    return this.tables;
  }
  private persist() {
    this.serialized = JSON.stringify({ version: 1, tables: this.tables });
    try {
      if (this.storageAvailable)
        this.storage()?.setItem(STORAGE_KEY, this.serialized);
    } catch {
      this.storageAvailable = false; /* Keep current in-memory records, without reloading the old stored version. */
    }
  }
  rows(table: string): DemoRow[] {
    if (!TABLES.has(table))
      throw new Error(`Table ${table} is unavailable in this demo.`);
    return clone(this.read()[table]);
  }
  /** Atomic synchronous replacement, called only after all scoped validation succeeds. */
  transaction(update: (tables: Tables) => void): void {
    const draft = clone(this.read());
    update(draft);
    this.tables = draft;
    this.persist();
  }
  reset(): void {
    this.tables = createDemoSeed();
    this.persist();
  }
  from(table: string) {
    return new DemoQuery(this, table);
  }
}

type Predicate = (row: DemoRow) => boolean;
class DemoQuery implements PromiseLike<QueryResult> {
  private action: "select" | "insert" | "upsert" | "update" | "delete" =
    "select";
  private values: DemoRow[] = [];
  private filters: Predicate[] = [];
  private fields = "*";
  private returning = false;
  private countRequested = false;
  private head = false;
  private sorting: { key: string; ascending: boolean }[] = [];
  private offset = 0;
  private maximum = Infinity;
  private cardinality: "many" | "single" | "maybe" = "many";
  private conflictKeys = ["id"];
  private signal?: AbortSignal;
  private invalid?: QueryError;
  private pending?: Promise<QueryResult>;
  constructor(
    private readonly db: DemoDatabase,
    private readonly table: string,
  ) {}
  select(fields = "*", options?: { count?: string; head?: boolean }) {
    if (fields !== "*" && !/^[\w\s,]+$/.test(fields))
      this.invalid = error(
        "Relational selections are unavailable in this demo.",
      );
    this.fields = fields;
    this.returning = true;
    this.countRequested = options?.count === "exact";
    this.head = options?.head ?? false;
    return this;
  }
  insert(values: DemoRow | DemoRow[]) {
    this.action = "insert";
    this.values = clone(Array.isArray(values) ? values : [values]);
    return this;
  }
  upsert(values: DemoRow | DemoRow[], options?: { onConflict?: string }) {
    this.insert(values);
    this.action = "upsert";
    this.conflictKeys = options?.onConflict
      ?.split(",")
      .map((key) => key.trim()) ?? ["id"];
    return this;
  }
  update(values: DemoRow) {
    this.action = "update";
    this.values = [clone(values)];
    return this;
  }
  delete() {
    this.action = "delete";
    return this;
  }
  eq(key: string, value: unknown) {
    this.filters.push((row) => equivalent(row[key], value));
    return this;
  }
  neq(key: string, value: unknown) {
    this.filters.push(
      (row) => row[key] != null && !equivalent(row[key], value),
    );
    return this;
  }
  is(key: string, value: null | boolean) {
    this.filters.push((row) =>
      value === null ? row[key] == null : row[key] === value,
    );
    return this;
  }
  in(key: string, values: readonly unknown[]) {
    this.filters.push((row) =>
      values.some((value) => equivalent(row[key], value)),
    );
    return this;
  }
  lt(key: string, value: string | number) {
    this.filters.push(
      (row) => row[key] != null && (row[key] as string | number) < value,
    );
    return this;
  }
  gte(key: string, value: string | number) {
    this.filters.push(
      (row) => row[key] != null && (row[key] as string | number) >= value,
    );
    return this;
  }
  match(values: DemoRow) {
    Object.entries(values).forEach(([key, value]) => this.eq(key, value));
    return this;
  }
  or(expression: string) {
    const parts = expression
      .split(",")
      .map((part) => /^([\w]+)\.(lt|eq|is)\.(.*)$/.exec(part));
    if (parts.some((part) => !part || (part[2] === "is" && part[3] !== "null")))
      this.invalid = error("This filter is unavailable in the demo.");
    else
      this.filters.push((row) =>
        parts.some((part) => {
          const [, key, op, value] = part!;
          return op === "is"
            ? row[key] == null
            : op === "lt"
              ? row[key] != null && String(row[key]) < value
              : equivalent(row[key], value);
        }),
      );
    return this;
  }
  order(key: string, options?: { ascending?: boolean }) {
    this.sorting.push({ key, ascending: options?.ascending ?? true });
    return this;
  }
  limit(count: number) {
    this.maximum = Math.max(0, count);
    return this;
  }
  range(from: number, to: number) {
    this.offset = Math.max(0, from);
    this.maximum = Math.max(0, to - from + 1);
    return this;
  }
  single() {
    this.cardinality = "single";
    return this;
  }
  maybeSingle() {
    this.cardinality = "maybe";
    return this;
  }
  abortSignal(signal: AbortSignal) {
    this.signal = signal;
    return this;
  }
  throwOnError() {
    return this;
  }
  then<TResult1 = QueryResult, TResult2 = never>(
    resolve?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    this.pending ??= Promise.resolve().then(() => this.execute());
    return this.pending.then(resolve, reject);
  }
  private execute(): QueryResult {
    const fail = (failure: QueryError, status = 400): QueryResult => ({
      data: null,
      error: failure,
      count: null,
      status,
      statusText: "Demo request failed",
    });
    if (this.signal?.aborted)
      return fail(error("Request cancelled.", "ABORTED"), 499);
    if (this.invalid) return fail(this.invalid);
    if (!TABLES.has(this.table))
      return fail(error("This table is unavailable in the portfolio demo."));
    const matches = (row: DemoRow) =>
      this.filters.every((filter) => filter(row));
    let selected: DemoRow[] = [];
    try {
      if (this.action === "select")
        selected = this.db.rows(this.table).filter(matches);
      else
        this.db.transaction((tables) => {
          const rows = tables[this.table];
          if (this.action === "insert" || this.action === "upsert") {
            for (const value of this.values) {
              if (!record(value)) throw new Error("Invalid record.");
              if (
                (this.table === "sessions" &&
                  value.owner_id &&
                  value.owner_id !== DEMO_IDS.user) ||
                (this.table === "clients" &&
                  value.agency_id &&
                  value.agency_id !== DEMO_IDS.agency) ||
                (this.table === "profiles" && value.id !== DEMO_IDS.user)
              )
                throw new Error("This record is outside the demo workspace.");
              const existing = this.conflictKeys.every(
                (key) => value[key] !== undefined,
              )
                ? rows.find((row) =>
                    this.conflictKeys.every((key) =>
                      equivalent(row[key], value[key]),
                    ),
                  )
                : undefined;
              if (existing && this.action === "insert")
                throw new Error(
                  "A record with this identifier already exists.",
                );
              if (existing) {
                Object.assign(existing, value);
                selected.push(clone(existing));
              } else {
                const row = {
                  id: crypto.randomUUID(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  ...(this.table === "sessions"
                    ? { owner_id: DEMO_IDS.user }
                    : {}),
                  ...value,
                };
                rows.push(row);
                selected.push(clone(row));
              }
            }
          } else {
            if (!this.filters.length)
              throw new Error(
                "Choose records before modifying the demo workspace.",
              );
            selected = rows.filter(matches);
            if (this.action === "update") {
              const patch = this.values[0];
              if (patch.owner_id && patch.owner_id !== DEMO_IDS.user)
                throw new Error("This record is outside the demo workspace.");
              selected.forEach((row) => Object.assign(row, patch));
            } else tables[this.table] = rows.filter((row) => !matches(row));
            selected = clone(selected);
          }
        });
      const count = this.countRequested ? selected.length : null;
      selected.sort((a, b) => {
        for (const { key, ascending } of this.sorting) {
          const left = a[key];
          const right = b[key];
          const comparison =
            left == null
              ? right == null
                ? 0
                : 1
              : right == null
                ? -1
                : left < right
                  ? -1
                  : left > right
                    ? 1
                    : 0;
          if (comparison) return ascending ? comparison : -comparison;
        }
        return 0;
      });
      selected = selected.slice(
        this.offset,
        this.maximum === Infinity ? undefined : this.offset + this.maximum,
      );
      const projected =
        this.fields === "*"
          ? selected
          : selected.map((row) =>
              Object.fromEntries(
                this.fields
                  .split(",")
                  .map((key) => [key.trim(), row[key.trim()]]),
              ),
            );
      if (
        this.cardinality !== "many" &&
        (projected.length > 1 ||
          (this.cardinality === "single" && !projected.length))
      )
        return fail(
          error("Expected exactly one matching record.", "PGRST116"),
          406,
        );
      const data =
        this.head || (this.action !== "select" && !this.returning)
          ? null
          : this.cardinality === "many"
            ? projected
            : (projected[0] ?? null);
      return {
        data: clone(data),
        error: null,
        count,
        status: this.action === "insert" ? 201 : 200,
        statusText: "OK",
      };
    } catch (failure) {
      return fail(
        error(
          failure instanceof Error
            ? failure.message
            : "The local record could not be saved.",
        ),
      );
    }
  }
}

export const demoDatabase = new DemoDatabase();
const listeners = new Set<(event: string, session: unknown) => void>();
const user = {
  id: DEMO_IDS.user,
  aud: "authenticated",
  role: "authenticated",
  email: "advisor@example.test",
  email_confirmed_at: "2026-01-01T00:00:00Z",
  app_metadata: { provider: "portfolio-demo", providers: [] },
  user_metadata: { display_name: "Alex Morgan" },
  created_at: "2026-01-01T00:00:00Z",
  identities: [],
};
export const demoSession = {
  access_token: "portfolio-demo-local-only",
  refresh_token: "portfolio-demo-local-only",
  token_type: "bearer",
  expires_in: 31536000,
  expires_at: 4102444800,
  user,
};
const unavailable = async () => ({
  data: null,
  error: error(
    "Account authentication is unavailable in this visitor-local portfolio demo.",
  ),
});
const auth = {
  getSession: async () => ({
    data: { session: clone(demoSession) },
    error: null,
  }),
  getUser: async () => ({ data: { user: clone(user) }, error: null }),
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    listeners.add(callback);
    queueMicrotask(() => {
      if (listeners.has(callback))
        callback("INITIAL_SESSION", clone(demoSession));
    });
    return {
      data: {
        subscription: {
          unsubscribe() {
            listeners.delete(callback);
          },
        },
      },
    };
  },
  signOut: async () => ({
    error: error(
      "This is a visitor-local demo. Close the preview to leave; use Reset sample to restore its records.",
    ),
  }),
  signInWithPassword: unavailable,
  signInWithOAuth: unavailable,
  signUp: unavailable,
  resetPasswordForEmail: unavailable,
  updateUser: unavailable,
  exchangeCodeForSession: unavailable,
};
export function notifyDemoReset() {
  listeners.forEach((listener) => listener("SIGNED_IN", clone(demoSession)));
}
const storage = {
  from: () => ({
    list: async () => ({ data: [], error: null }),
    remove: async () => ({ data: [], error: null }),
    upload: async () => ({
      data: null,
      error: error("Audio recording is unavailable in the portfolio demo."),
    }),
    createSignedUrl: async () => ({
      data: null,
      error: error("This fictional conversation has no recorded audio."),
    }),
    download: async () => ({
      data: null,
      error: error("This fictional conversation has no recorded audio."),
    }),
  }),
};
const client = {
  auth,
  storage,
  from: (table: string) => demoDatabase.from(table),
  rpc: unavailable,
};
/** Typed at the existing SDK seam; no SDK client or network transport is constructed. */
export const demoSupabaseClient = client as unknown as SupabaseClient;
