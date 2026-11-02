import { getProjectBySlug } from "./project-links";

const entryKey = "portfolioProject";
type State = Record<string, unknown>;
type ProjectEntry = { slug: string; returnTo: string };
export type ProjectNavigation =
  | { action: "push" | "replace"; href: string; state: State }
  | { action: "back" }
  | { action: "none" };

export function activeProjectSlug(url: URL) {
  return getProjectBySlug(url.searchParams.get("project"))?.slug ?? null;
}

function stateRecord(state: unknown): State {
  return state !== null && typeof state === "object" && !Array.isArray(state)
    ? { ...state } : {};
}

function projectEntry(state: State, url: URL): ProjectEntry | null {
  const entry = state[entryKey];
  if (!entry || typeof entry !== "object") return null;
  const { slug, returnTo } = entry as Partial<ProjectEntry>;
  if (typeof slug !== "string" || typeof returnTo !== "string") return null;
  try {
    const base = new URL(returnTo, url);
    if (base.origin !== url.origin || base.pathname !== url.pathname || base.searchParams.has("project")) return null;
    return { slug, returnTo: base.pathname + base.search + base.hash };
  } catch { return null; }
}

/** Keep Next's history fields and campaign/hash context intact. */
export function openProjectNavigation(current: URL, state: unknown, slug: string): ProjectNavigation {
  if (!getProjectBySlug(slug) || activeProjectSlug(current) === slug) return { action: "none" };
  const next = new URL(current);
  const base = new URL(current);
  base.searchParams.delete("project");
  next.searchParams.set("project", slug);
  const existing = stateRecord(state);
  const prior = projectEntry(existing, current);
  const action = activeProjectSlug(current) ? "replace" : "push";
  delete existing[entryKey];
  if (action === "push" || prior) {
    existing[entryKey] = { slug, returnTo: prior?.returnTo ?? base.pathname + base.search + base.hash };
  }
  return {
    action,
    href: next.pathname + next.search + next.hash,
    state: existing,
  };
}

export function closeProjectNavigation(current: URL, state: unknown, slug: string): ProjectNavigation {
  if (activeProjectSlug(current) !== slug) return { action: "none" };
  const existing = stateRecord(state);
  if (projectEntry(existing, current)?.slug === slug) return { action: "back" };
  const next = new URL(current);
  next.searchParams.delete("project");
  delete existing[entryKey];
  return { action: "replace", href: next.pathname + next.search + next.hash, state: existing };
}
