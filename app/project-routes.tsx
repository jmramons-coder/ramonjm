"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  useSyncExternalStore, type ReactNode, type RefObject,
} from "react";
import { getProjectById, getProjectBySlug, type ProjectLink } from "./project-links";
import { activeProjectSlug, closeProjectNavigation, openProjectNavigation, type ProjectNavigation } from "./project-history";

const changeEvent = "portfolio:project-navigation";
let revision = 0;
let pendingBack = false;

function subscribe(listener: () => void) {
  function changed() { pendingBack = false; revision += 1; listener(); }
  window.addEventListener("popstate", changed);
  window.addEventListener(changeEvent, changed);
  return () => {
    window.removeEventListener("popstate", changed);
    window.removeEventListener(changeEvent, changed);
  };
}

function snapshot() {
  return JSON.stringify([revision, activeProjectSlug(new URL(window.location.href))]);
}

function navigate(change: ProjectNavigation) {
  if (change.action === "none") return;
  if (change.action === "back") {
    if (!pendingBack) { pendingBack = true; window.history.back(); }
    return;
  }
  if (change.action === "push") window.history.pushState(change.state, "", change.href);
  else window.history.replaceState(change.state, "", change.href);
  window.dispatchEvent(new Event(changeEvent));
}

type RouteContext = {
  activeProject: ProjectLink | undefined;
  version: number;
  open: (slug: string) => void;
  close: (slug: string, version: number) => void;
};
const Routes = createContext<RouteContext | null>(null);
const Project = createContext<string | null>(null);

export function ProjectRoutesProvider({ initialProject, children }: {
  initialProject: string | null;
  children: ReactNode;
}) {
  const serverSnapshot = useCallback(() => JSON.stringify([0, initialProject]), [initialProject]);
  const value = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const [version, slug] = JSON.parse(value) as [number, string | null];
  const activeProject = getProjectBySlug(slug);
  const open = useCallback((project: string) => {
    navigate(openProjectNavigation(new URL(window.location.href), window.history.state, project));
  }, []);
  const close = useCallback((project: string, expectedVersion: number) => {
    // An exit animation may finish after Back/Forward has already opened another view.
    if (revision !== expectedVersion) return;
    navigate(closeProjectNavigation(new URL(window.location.href), window.history.state, project));
  }, []);
  const context = useMemo(() => ({ activeProject, version, open, close }), [activeProject, version, open, close]);

  useEffect(() => {
    document.title = activeProject ? `${activeProject.title} — Ramon JM` : "Ramon JM — Senior Product Designer";
  }, [activeProject]);

  return <Routes.Provider value={context}>{children}</Routes.Provider>;
}

export function ProjectRoute({ id, children }: { id: string; children: ReactNode }) {
  return <Project.Provider value={getProjectById(id)?.slug ?? null}>{children}</Project.Provider>;
}

export function useActiveProject() {
  return useContext(Routes)?.activeProject;
}

/** Existing standalone examples keep local behavior; grid previews use the URL. */
export function useProjectOpen(): [boolean, (open: boolean) => void] {
  const routes = useContext(Routes);
  const slug = useContext(Project);
  const [local, setLocal] = useState(false);
  const setOpen = useCallback((open: boolean) => {
    if (!routes || !slug) { setLocal(open); return; }
    if (open) routes.open(slug);
    else routes.close(slug, routes.version);
  }, [routes, slug]);
  return [routes && slug ? routes.activeProject?.slug === slug : local, setOpen];
}

export type ProjectBounds = { left: number; top: number; width: number; height: number };

export function useProjectOrigin(opener: RefObject<HTMLButtonElement | null>): [ProjectBounds | null, (bounds: ProjectBounds | null) => void] {
  const [open, setOpen] = useProjectOpen();
  const [origin, setOrigin] = useState<ProjectBounds | null>(null);

  useEffect(() => {
    if (!open || origin) return;
    // Shared URLs have no click coordinates. Measure the real tile after masonry settles.
    const frame = requestAnimationFrame(() => {
      const button = opener.current;
      if (!button) return;
      const card = button.closest("[data-piece]") ?? button;
      card.scrollIntoView({ block: "center", behavior: "instant" });
      const target = card.querySelector("[data-desktop-frame]") ?? button;
      const { left, top, width, height } = target.getBoundingClientRect();
      setOrigin({ left, top, width, height });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, origin, opener]);

  const change = useCallback((bounds: ProjectBounds | null) => {
    if (bounds) setOrigin(bounds);
    setOpen(bounds !== null);
  }, [setOpen]);
  return [open ? origin : null, change];
}
