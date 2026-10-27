import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const project = join(root, "vendor", "abeam");
const output = join(root, "public", "embed", "abeam");
const next = join(root, "node_modules", "next", "dist", "bin", "next");

// Do not inherit portfolio/provider credentials into the nested static build.
// Keep only runtime/OS configuration; the embedded app uses local demo services.
const env = Object.fromEntries(
  [
    "PATH",
    "HOME",
    "TMPDIR",
    "TEMP",
    "TMP",
    "SystemRoot",
    "COMSPEC",
    "CI",
    "TERM",
  ]
    .filter((name) => process.env[name] !== undefined)
    .map((name) => [name, process.env[name]]),
);
Object.assign(env, {
  NODE_ENV: "production",
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:9",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "portfolio-demo-no-service",
});

await new Promise((resolveBuild, reject) => {
  const child = spawn(process.execPath, [next, "build", "--webpack"], {
    cwd: project,
    env,
    stdio: "inherit",
  });
  child.on("error", reject);
  child.on("exit", (code, signal) => {
    if (code === 0) resolveBuild();
    else reject(new Error(`aBeam frontend build failed (${signal ?? code}).`));
  });
});

const exported = join(project, "out");
// Copy only after a successful export, so failures preserve the previous demo.
await readFile(join(exported, "index.html"));
await mkdir(dirname(output), { recursive: true });
await rm(output, { recursive: true, force: true });
await cp(exported, output, { recursive: true });
console.log("aBeam native frontend exported to public/embed/abeam.");
