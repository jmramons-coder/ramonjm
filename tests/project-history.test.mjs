import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

// Match the bundler's extensionless local imports without changing app code.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        error.code === "ERR_MODULE_NOT_FOUND" &&
        /^\.{1,2}\//.test(specifier) &&
        !/\.[^/]+$/.test(specifier)
      ) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});
const { activeProjectSlug, openProjectNavigation, closeProjectNavigation } =
  await import("../app/project-history.ts");
const { projects, getProjectBySlug, getProjectById } =
  await import("../app/project-links.ts");
hooks.deregister();

const origin = "https://www.ramonjm.com";
const url = (href) => new URL(href, origin);
const nextState = Object.freeze({
  __NA: true,
  __PRIVATE_NEXTJS_INTERNALS_TREE: Object.freeze(["", { children: ["__PAGE__", {}] }]),
  scrollPosition: Object.freeze({ x: 0, y: 1240 }),
});

test("the registry contains the 17 expanded projects with unique slugs and IDs", () => {
  assert.equal(projects.length, 17);
  assert.equal(new Set(projects.map(({ slug }) => slug)).size, projects.length);
  assert.equal(new Set(projects.map(({ id }) => id)).size, projects.length);
  assert.equal(getProjectBySlug("pushedworld")?.id, "world-crew");
  assert.equal(getProjectById("world"), undefined, "Buster is not an expanded gallery");
  assert.equal(getProjectById("nudge-stickers"), undefined);
  assert.equal(getProjectById("abeam-identity"), undefined);
  assert.equal(getProjectBySlug("case-management")?.private, true);
});

for (const project of projects) {
  test(`${project.slug}: an opened project has a shareable query URL and closes through Back`, () => {
    const current = url("/?utm_source=message#applications");
    const opened = openProjectNavigation(current, nextState, project.slug);
    assert.equal(opened.action, "push");
    const shared = url(opened.href);
    assert.equal(shared.origin, origin);
    assert.equal(shared.pathname, "/");
    assert.equal(shared.searchParams.get("project"), project.slug);
    assert.equal(shared.searchParams.get("utm_source"), "message");
    assert.equal(shared.hash, "#applications");
    assert.equal(activeProjectSlug(shared), project.slug);
    assert.equal(getProjectById(project.id), getProjectBySlug(project.slug));
    assert.deepEqual(closeProjectNavigation(shared, opened.state, project.slug), {
      action: "back",
    });
  });
}

test("opening preserves Next history state, campaign parameters, and the fragment", () => {
  const current = url("/?utm_source=friend&utm_campaign=portfolio&other=value#applications");
  const before = current.href;
  const opened = openProjectNavigation(current, nextState, "pushedworld");
  assert.equal(opened.action, "push");
  assert.equal(current.href, before, "the current URL is not mutated");
  assert.notEqual(opened.state, nextState);
  assert.equal(opened.state.__NA, true);
  assert.deepEqual(opened.state.__PRIVATE_NEXTJS_INTERNALS_TREE, nextState.__PRIVATE_NEXTJS_INTERNALS_TREE);
  assert.deepEqual(opened.state.scrollPosition, nextState.scrollPosition);
  assert.deepEqual(opened.state.portfolioProject, {
    slug: "pushedworld",
    returnTo: "/?utm_source=friend&utm_campaign=portfolio&other=value#applications",
  });
  assert.equal("portfolioProject" in nextState, false);
});

test("open, Back, and Forward restore the project and the original grid entry", () => {
  const home = { url: url("/?utm_source=friend#applications"), state: nextState };
  const opened = openProjectNavigation(home.url, home.state, "pushedworld");
  assert.equal(opened.action, "push");
  const history = [home, { url: url(opened.href), state: opened.state }];
  let index = 1;
  assert.equal(activeProjectSlug(history[index].url), "pushedworld");

  const close = closeProjectNavigation(history[index].url, history[index].state, "pushedworld");
  assert.deepEqual(close, { action: "back" });
  index -= 1;
  assert.equal(activeProjectSlug(history[index].url), null);
  assert.equal(history[index].url.href, home.url.href);
  assert.deepEqual(history[index].state, nextState);

  index += 1;
  assert.equal(activeProjectSlug(history[index].url), "pushedworld");
  assert.deepEqual(openProjectNavigation(history[index].url, history[index].state, "pushedworld"), {
    action: "none",
  });
  assert.deepEqual(closeProjectNavigation(history[index].url, history[index].state, "pushedworld"), {
    action: "back",
  });
});

test("closing a directly shared URL replaces it with the grid instead of leaving the site", () => {
  const current = url("/?utm_source=chat&project=pushedworld#applications");
  const closed = closeProjectNavigation(current, nextState, "pushedworld");
  assert.deepEqual(closed, {
    action: "replace",
    href: "/?utm_source=chat#applications",
    state: nextState,
  });
  assert.equal(activeProjectSlug(url(closed.href)), null);
});

test("switching an open project replaces its entry and retains the original return URL", () => {
  const first = openProjectNavigation(url("/?utm_source=friend#applications"), nextState, "pushedworld");
  assert.equal(first.action, "push");
  const second = openProjectNavigation(url(first.href), first.state, "nudge");
  assert.equal(second.action, "replace");
  assert.equal(activeProjectSlug(url(second.href)), "nudge");
  assert.deepEqual(second.state.portfolioProject, {
    slug: "nudge",
    returnTo: "/?utm_source=friend#applications",
  });
  assert.equal(second.state.__NA, true);
  assert.deepEqual(first.state.portfolioProject, {
    slug: "pushedworld",
    returnTo: "/?utm_source=friend#applications",
  }, "replacing does not mutate the previous state");
  assert.deepEqual(closeProjectNavigation(url(second.href), second.state, "nudge"), {
    action: "back",
  });
});

test("switching a directly shared project does not invent a Back entry", () => {
  const current = url("/?project=pushedworld&utm_source=friend#applications");
  const switched = openProjectNavigation(current, nextState, "nudge");
  assert.equal(switched.action, "replace");
  assert.equal(activeProjectSlug(url(switched.href)), "nudge");
  assert.equal(switched.state.portfolioProject, undefined);
  assert.deepEqual(closeProjectNavigation(url(switched.href), switched.state, "nudge"), {
    action: "replace",
    href: "/?utm_source=friend#applications",
    state: nextState,
  });
});

test("unknown slugs never open, and an already open project does not add history", () => {
  for (const slug of ["", "unknown", "world", "__proto__", "PushedWorld"]) {
    assert.equal(getProjectBySlug(slug), undefined);
    assert.equal(activeProjectSlug(url(`/?project=${encodeURIComponent(slug)}`)), null);
    assert.deepEqual(openProjectNavigation(url("/"), nextState, slug), { action: "none" });
    assert.deepEqual(closeProjectNavigation(url("/"), nextState, slug), { action: "none" });
  }
  assert.equal(getProjectBySlug(null), undefined);
  assert.equal(getProjectBySlug(undefined), undefined);
  assert.deepEqual(openProjectNavigation(url("/?project=nudge"), nextState, "nudge"), {
    action: "none",
  });
});

test("a stale close from another project cannot remove the active project", () => {
  const opened = openProjectNavigation(url("/#applications"), nextState, "nudge");
  assert.equal(opened.action, "push");
  assert.deepEqual(closeProjectNavigation(url(opened.href), opened.state, "pushedworld"), {
    action: "none",
  });
  assert.equal(activeProjectSlug(url(opened.href)), "nudge");
});

test("untrusted history markers cannot send closing navigation Back", () => {
  for (const returnTo of [
    "https://other.example/",
    "//other.example/",
    "/another-page",
    "/?project=nudge",
  ]) {
    const state = {
      ...nextState,
      portfolioProject: { slug: "pushedworld", returnTo },
    };
    const closed = closeProjectNavigation(url("/?project=pushedworld&utm_source=chat#applications"), state, "pushedworld");
    assert.deepEqual(closed, {
      action: "replace",
      href: "/?utm_source=chat#applications",
      state: nextState,
    });
    assert.deepEqual(state.portfolioProject, { slug: "pushedworld", returnTo });
  }
});

test("null or array history state is safely replaced without losing the shared project", () => {
  for (const state of [null, undefined, []]) {
    const opened = openProjectNavigation(url("/"), state, "pushedworld");
    assert.equal(opened.action, "push");
    assert.equal(activeProjectSlug(url(opened.href)), "pushedworld");
    assert.deepEqual(opened.state, {
      portfolioProject: { slug: "pushedworld", returnTo: "/" },
    });
  }
});
