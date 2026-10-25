# Case Management — original frontend integration

**Archived reference.** The user subsequently chose the focused interaction study again. The original-app embed is no longer used by the portfolio or `/case-workspace`. Generated native files are retained at `work/native-case-workspace/public-case-app/`, outside the public directory; the Next fallback rewrite was removed. See [current interaction study](case-workspace-concept.md).

Updated October 25, 2026. This replaces the reconstructed `/case-workspace` concept with the actual Case Management application frontend. The portfolio card, expanded view and standalone page now use the original application rather than a new visual interpretation.

## Provenance

- Repository: [jmramons-coder/case-management-platform](https://github.com/jmramons-coder/case-management-platform).
- Pinned source: [`d58b51fa981664a533a8c9fe135a4254e952275f`](https://github.com/jmramons-coder/case-management-platform/tree/d58b51fa981664a533a8c9fe135a4254e952275f). Root separately verified the remote HEAD matches this revision.
- Original checkout: `work/case-management-platform/`. Its Git working tree remains clean.
- Isolated build copy: `work/case-management-portfolio-ui/`. The builder copies the source, Vite configuration, package lock, utility files, public assets and vendored Equisoft design-system bundle. It does not copy Git metadata, environment files or the original checkout's dependencies.
- Generated files: `public/case-app/`, including a source/build manifest.
- Initial route: `/case-app/cases/CS-IN-549019?tab=task`. This opens William H. Tower's existing demonstration case in the native Tasks tab; `task` is the original application's singular tab identifier.

The UI still reads the shared Supabase demonstration dataset. It preserves the current persisted statuses, task assignments, evidence and findings; this is not a pristine reset of the authored opening scenario. No scenario, case, task, requirement, document, account or feature-flag database row was changed for this integration. Earlier source and demonstration-data context is recorded in [Case Management capture sources](case-management-asset-sources.md) and [product analysis](case-management-product-analysis.md).

## What changed

The original frontend remains a separate Vite/React 18 application inside an iframe. This preserves its Equisoft design system and global CSS without mixing them into the portfolio's Next.js/React 19 runtime.

Only one file under the copied `src/` tree changes: `src/app/App.tsx` adds `basename={import.meta.env.BASE_URL}` to the existing `BrowserRouter`. Comparison of the original and build-copy source trees found no other component or stylesheet changes. The vendored design-system tree is unchanged.

The builder also injects a classic, synchronous `/case-app/portfolio-readonly.js` script into the copied HTML before the Vite module entry. It builds with the source's existing `VITE_BYPASS_AUTH=true` development option and `BASE_PATH=/case-app/`. This bypasses the demo login screen; it does not create a signed-in account or grant a new database role.

The generated HTML includes embedded viewport containment: `html { overflow: hidden !important; } body { position: fixed; inset: 0; width: 100%; height: 100%; overflow: clip !important; }`. Native focus/navigation was able to scroll the iframe document root by about 29 pixels, moving the application header above the visible edge. Testing confirmed that changing root overflow to `clip` alone did not prevent Chromium's focus scroll. Fixed-body containment stopped the initial task-only root displacement, but full requirement/document navigation still programmatically scrolled the body itself by about 29 pixels. The body now also uses `overflow: clip !important`; `html` retains `overflow: hidden`, so body clipping applies to the body instead of propagating to the viewport. The original shell's inner content scrollports remain available. This is an integration override in the generated HTML; no source component or stylesheet is changed. The complete task → requirement → document → requirement flow passed with header Y = 0 and both document/body scrollTop = 0.

Before React starts, the bootstrap selects Natalie only if the product's own browser-local `case_mgmt_current_user_id` preference is empty. An existing persona selection remains intact. This changes localStorage only.

No feature-flag read responses are overridden. Read-only checks at integration time found `dynamic_side_panel`, `assistant_workforce`, `assistant_insights` and `assistant_insights_task` already enabled in the demonstration dataset. The native record dock, context tabs, assignable workforce and insight surfaces therefore render through the original providers and components.

## Portfolio integration

- `app/case-workspace-showcase.tsx` embeds the same initial route in the grid and expanded dialog. The grid iframe is inert, hidden from assistive technology and covered by the accessible open button. The expanded iframe is interactive.
- Its CSS scales a 1440 × 1000 native viewport into the grid card. The dialog gives the application the available screen area, with the portfolio close button at the screen's top right. Closing restores focus to the card opener.
- `app/case-workspace/page.tsx` provides the standalone application with a small Back to portfolio header.
- `next.config.ts` uses a **fallback** rewrite from `/case-app/:path*` to `/case-app/index.html`. Real static assets resolve first; client-router deep links then receive the Vite HTML entry. Rewriting before static files would incorrectly return HTML for JavaScript assets.

The original public deployment requires login, so the integration serves the reviewed local production build rather than embedding that deployment.

## Read-only transport

The bootstrap installs before any application module executes. It permits remote HTTP GET, HEAD and OPTIONS reads and refuses other remote HTTP methods:

- `fetch`, including `Request` objects, receives a locally generated HTTP 403 JSON response with code `PORTFOLIO_READ_ONLY` and a clear read-only message. No refused request reaches native fetch.
- Remote XHR writes throw a local `NotAllowedError` before `send` reaches the native transport.
- Remote `sendBeacon` writes return `false` without sending.
- Remote form writes are cancelled in the submit capture handler. The iframe sandbox additionally does not grant form submission.
- All remote `/functions/v1/` requests are refused, including GET requests. The source assistant's model/function endpoints cannot be called by this embedded frontend.

The native application attempts to persist an assistant conversation at startup. That POST is subject to the same local refusal; browser confirmation of the source's graceful error handling is part of the root QA pass. No assistant prompt or model request was used in the integration audit.

Native WebSocket subscriptions remain available for the original Supabase Postgres read notifications. The reviewed application subscribes to changes; the integration does not add a broadcast, database-write or model transport over WebSocket.

The original UI's mutation controls remain visible because its product components are unchanged. Attempts to save, complete, order, upload, reset or otherwise persist should report a native error from the local read-only refusal. They do not simulate a successful backend operation. The iframe's allowed capabilities are scripts, same-origin storage, popups and downloads.

This client transport prevents accidental changes through the embedded application. It is not server-side authorization, an isolated database, or protection against someone deliberately bypassing browser code. The existing publishable client configuration is part of the original app build; no service credentials or secret environment values were added or printed. Read availability and displayed state depend on the shared demonstration service.

## Rebuilding

From the portfolio root, with a compatible Node runtime on PATH:

```sh
node scripts/build-case-ui.mjs
```

The builder validates the pinned source commit, prepares the separate copy, installs locked dependencies with `npm ci --ignore-scripts --no-audit --no-fund` when needed, builds the native app, and copies only its generated output into `public/case-app/`.

The successful build on this machine used external dependency/cache storage because the primary disk was full:

```sh
PATH=/Users/codex/Documents/Codex/2026-10-11/let/work/runtime/node-v24.21.0-darwin-arm64/bin:$PATH \
CASE_UI_DEPENDENCY_DIR=/Volumes/CodexBuildArchive/portfolio-case-ui-deps-d58b51f \
npm_config_cache=/Volumes/CodexBuildArchive/portfolio-case-ui-deps-d58b51f/npm-cache \
node scripts/build-case-ui.mjs
```

The optional dependency directory affects build tooling only. It is not required by the served application. Deployments must include the generated `public/case-app/` artifacts; the ignored `work/` checkouts are not a runtime dependency. No deployment was performed for this change.

## Verification and limitations

- Vite production build passed: 2,201 modules; approximately 4.3 MB generated files. The original design-system-heavy entry is approximately 2.99 MB minified / 661 KB gzip. The build's large-chunk warning is retained rather than changing the original component architecture.
- Targeted ESLint for the builder and whitespace checks passed.
- Source-tree comparison found only the intended `App.tsx` router integration change; the original checkout remains clean.
- The emitted HTML places the synchronous read-only bootstrap before every module entry.
- A transport VM test verified refusal of remote POST/PATCH/PUT/DELETE, a POST `Request`, function requests, XHR writes, beacon writes and form writes. None reached the native transport. GET/HEAD/OPTIONS were forwarded. Native local persona initialization was also checked.
- After root restarted the portfolio production server, HTTP checks returned 200 with the correct HTML and JavaScript content types for the case deep link and transport bootstrap.
- Root browser QA confirmed native startup, task-drawer opening, and action → requirement → document navigation retaining contextual tabs and AI reading. The final viewport correction passed that complete flow with header Y = 0 and both root/body scrollTop = 0. Activity History rendered its original table. Dialog close restored focus to the grid opener. At 390 × 720, the screen-level close button remained fully visible at x340/y18, sized 36 × 36, and restored opener focus. The source retains its original desktop layout; this does not claim a redesigned mobile application. The standalone `/case-workspace` page also loaded the actual case on Tasks.
- Proof: `outputs/case-management-native/task-drawer.png` and `outputs/case-management-native/requirement-context.png`. The native document panel currently displays its source fallback, “Preview unavailable — open the file to view it.” No document content or persisted data was modified.
- The portfolio production build and targeted ESLint for the wrapper, standalone page and Next configuration passed. The native artifact was rebuilt after the viewport correction; its component bundle remained unchanged. A fresh Runtime exception capture during native navigation reported no exceptions. An earlier transient MutationObserver error appeared during page/frame replacement and did not reproduce in that capture.

No other concrete defect was found in the reviewed wrapper, standalone route, or fallback rewrite. A retained original `window.location.assign("/")` exists only after a successful destructive reset; that success cannot occur through the read-only guard. The portfolio's Pause motion preference is not injected into the iframe; original application behavior and operating-system motion preferences remain the source's responsibility.
