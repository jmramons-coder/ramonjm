import { cp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const original = path.join(root, "work/case-management-platform");
const checkout = path.join(root, "work/case-management-portfolio-ui");
const output = path.join(root, "public/case-app");
const commit = "d58b51fa981664a533a8c9fe135a4254e952275f";
const sourceCommit = execFileSync("git", ["-C", original, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();

if (sourceCommit !== commit) {
  throw new Error("The Case Management source revision changed. Review the integration before rebuilding.");
}

// A separate app build preserves the product's React 18 / Equisoft design system
// without injecting its global CSS or runtime into the React 19 portfolio.
await mkdir(checkout, { recursive: true });
for (const entry of ["package.json", "package-lock.json", "vite.config.ts", "postcss.config.mjs", "index.html", "src", "utils", "vendor", "public"]) {
  await rm(path.join(checkout, entry), { recursive: true, force: true });
  await cp(path.join(original, entry), path.join(checkout, entry), { recursive: true });
}

const appPath = path.join(checkout, "src/app/App.tsx");
const app = await readFile(appPath, "utf8");
if (!app.includes("<BrowserRouter>")) throw new Error("Expected source BrowserRouter was not found.");
await writeFile(appPath, app.replace("<BrowserRouter>", "<BrowserRouter basename={import.meta.env.BASE_URL}>"));

const readonlyBootstrap = String.raw`/* Portfolio integration only. Original product components are unmodified. */
(() => {
  "use strict";
  const allowedMethods = new Set(["GET", "HEAD", "OPTIONS"]);
  const message = "This portfolio preview is read-only. Changes and remote AI requests are disabled.";
  const nativeFetch = window.fetch.bind(window);
  const state = { readOnly: true, sourceCommit: "${commit}", blockedRequests: 0, featureFlagOverrides: [] };
  Object.defineProperty(window, "casePortfolioPreview", { value: state, writable: false });

  function blocked(url, method) {
    const target = new URL(url, window.location.href);
    const remote = target.origin !== window.location.origin && /^https?:$/.test(target.protocol);
    // The native assistant's serverless endpoints include model invocation.
    return remote && (!allowedMethods.has(method.toUpperCase()) || target.pathname.startsWith("/functions/v1/"));
  }

  function refusal() {
    state.blockedRequests += 1;
    return new Response(JSON.stringify({ code: "PORTFOLIO_READ_ONLY", message }), {
      status: 403,
      statusText: "Portfolio preview is read-only",
      headers: { "Content-Type": "application/json" },
    });
  }

  window.fetch = async function portfolioReadOnlyFetch(input, init) {
    const request = typeof Request !== "undefined" && input instanceof Request;
    const url = request ? input.url : String(input);
    const method = init?.method ?? (request ? input.method : "GET");
    if (blocked(url, method)) return refusal();
    return nativeFetch(input, init);
  };

  const xhrRequests = new WeakMap();
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function portfolioReadOnlyOpen(method, url) {
    xhrRequests.set(this, { method, url: String(url) });
    return originalOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function portfolioReadOnlySend() {
    const request = xhrRequests.get(this);
    if (request && blocked(request.url, request.method)) {
      state.blockedRequests += 1;
      throw new DOMException(message, "NotAllowedError");
    }
    return originalSend.apply(this, arguments);
  };

  if (navigator.sendBeacon) {
    const originalBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function portfolioReadOnlyBeacon(url, data) {
      if (blocked(String(url), "POST")) {
        state.blockedRequests += 1;
        return false;
      }
      return originalBeacon(url, data);
    };
  }

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (form instanceof HTMLFormElement && blocked(form.action, form.method)) {
      event.preventDefault();
      state.blockedRequests += 1;
    }
  }, true);

  // This is the product's native browser-local demonstration-persona setting.
  // Preserve an existing selection and never change a database identity.
  try {
    if (!localStorage.getItem("case_mgmt_current_user_id")) {
      localStorage.setItem("case_mgmt_current_user_id", "10000000-0000-0000-0000-000000000005");
    }
  } catch { /* The original provider can select a persona if storage is unavailable. */ }
})();
`;

await writeFile(path.join(checkout, "public/portfolio-readonly.js"), readonlyBootstrap);
const indexPath = path.join(checkout, "index.html");
const index = await readFile(indexPath, "utf8");
await writeFile(indexPath, index.replace("<head>", '<head>\n      <script src="%BASE_URL%portfolio-readonly.js"></script>'));

await writeFile(path.join(checkout, "PORTFOLIO-INTEGRATION.md"), `# Native Case Management portfolio build\n\nSource: case-management-platform at ${commit}.\n\nThe source components, styles and vendored design system are copied unchanged. The only source integration edit adds the Vite base path to BrowserRouter. The original VITE_BYPASS_AUTH development option is enabled for this demonstration build. The generated HTML uses html { overflow: hidden !important; } and a fixed, full-viewport body with overflow: clip !important to contain the embedded document during focus navigation; native inner content scrollports are unchanged.\n\nA synchronous transport bootstrap runs before the module entry. It refuses remote fetch/XHR/beacon/form writes and all remote Supabase function requests. Read-only GET/HEAD/OPTIONS and native realtime read subscriptions remain available. The original assistant may attempt conversation persistence at startup; this receives a local 403 and cannot reach the shared backend. Remote AI calls are disabled.\n\nNo feature-flag response overrides are applied. At integration time the shared demonstration already enabled dynamic_side_panel, assistant_workforce, assistant_insights and assistant_insights_task. Natalie is selected only when the product's native local persona preference is empty.\n\nInitial route: /case-app/cases/CS-IN-549019?tab=task.\n\nThis uses the current shared demonstration data, so displayed case state may change independently of this build. Its read-only transport prevents accidental changes through this embedded UI; it is not a replacement for server-side authorization.\n\nRebuild from the portfolio root: node scripts/build-case-ui.mjs. The original checkout is never edited and no database import, reset, seed, model call or mutation is run.\n`);

const dependencyDirectory = process.env.CASE_UI_DEPENDENCY_DIR ? path.resolve(process.env.CASE_UI_DEPENDENCY_DIR) : checkout;
if (dependencyDirectory !== checkout) {
  await mkdir(dependencyDirectory, { recursive: true });
  for (const name of ["package.json", "package-lock.json"]) await cp(path.join(checkout, name), path.join(dependencyDirectory, name));
}
if (!existsSync(path.join(dependencyDirectory, "node_modules/.bin/vite"))) {
  execFileSync("npm", ["ci", "--ignore-scripts", "--no-audit", "--no-fund"], { cwd: dependencyDirectory, stdio: "inherit" });
}
if (dependencyDirectory !== checkout) {
  await rm(path.join(checkout, "node_modules"), { recursive: true, force: true });
  await symlink(path.join(dependencyDirectory, "node_modules"), path.join(checkout, "node_modules"), "dir");
}
execFileSync("npm", ["run", "build"], {
  cwd: checkout,
  stdio: "inherit",
  env: { ...process.env, BASE_PATH: "/case-app/", VITE_BYPASS_AUTH: "true" },
});
// The original shell owns its inner scrollports. An embedded document root
// must not scroll when browser focus reveals a native control inside a panel.
// Keep html non-visible so body clipping applies to that element, not the viewport.
const builtIndexPath = path.join(checkout, "dist/index.html");
const builtIndex = await readFile(builtIndexPath, "utf8");
await writeFile(builtIndexPath, builtIndex.replace("<head>", '<head>\n      <style id="portfolio-viewport">html { overflow: hidden !important; } body { position: fixed; inset: 0; width: 100%; height: 100%; overflow: clip !important; }</style>'));
await rm(output, { recursive: true, force: true });
await cp(path.join(checkout, "dist"), output, { recursive: true });
await writeFile(path.join(output, "build-manifest.json"), JSON.stringify({ sourceCommit: commit, basePath: "/case-app/", initialRoute: "/case-app/cases/CS-IN-549019?tab=task", originalComponents: true, readOnlyTransport: true, remoteAi: false, featureFlagOverrides: [], embeddedViewport: "fixed-body-clip" }, null, 2) + "\n");
console.log("Native Case Management built at public/case-app/ with a read-only transport.");
