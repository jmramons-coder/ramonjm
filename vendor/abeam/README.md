# aBeam frontend in the portfolio

This directory vendors the actual aBeam frontend from commit `184e20fb010715b322c97e3725e9c2ceae269872` on `redesign/landing-page`. `SOURCE.json` records the source repository and SHA-256 of each copied original file, plus the replaced entrypoints and measured source fidelity. No secrets, environment files, private client records, API routes or authentication callback were copied. The initial integration verified 252 original files and all 50 original CSS files unchanged; five original client/data files carry explicit portfolio adaptations.

## Source fidelity

The original `TravelWorkspace`, its components, hooks, styles, fonts and public assets provide the interface. The portfolio does not recreate those screens. The original global styles and body-mounted dialogs stay isolated in an iframe, so their viewport and document behavior remain intact.

Adaptations are limited to:

- A static Next entry/layout and `DemoWorkspace` bootstrap.
- A local demo-service adapter in `demo/` and `lib/supabase/client.ts`, with fictional records and local mutations.
- Explicit demo seams in `app/travel-workspace.tsx` for the portfolio's service and hardware boundaries.
- A demo provenance label in the search-item source type.
- Mechanical `/embed/abeam` prefixes on absolute local image paths in `LandingPage.tsx`.
- Exact bundled-photo allowances in the existing offer validators, so fictional sample cards use local destination art without external image requests.
- An exact allowlist for the bundled demonstration photograph in the native offer-image validation path; remote provider image restrictions remain in place.

The source repository remains separate and untouched. The older `work/abeam-voice-capture` directory is a screenshot-only fixture; it is not the runtime embedded here.

## Build

The parent repository supplies one Next 16.2.6 / React 19.2.6 runtime and the native frontend libraries. There is no nested install, committed `node_modules` symlink or second React bundle dependency tree.

Run `npm run build:abeam` to export this app into the parent's ignored `public/embed/abeam/` directory. Normal parent `npm run build` builds the aBeam export before the portfolio, and `npm run dev` prepares it before starting the parent dev server.

Run `npm run test:abeam` for the visitor-local adapter's native contract, persistence, reset and isolation checks.

`scripts/build-abeam.mjs` invokes the parent's installed Next with this directory as its project. The child process receives an explicit OS/runtime environment allowlist and fake loopback public Supabase values; it does not inherit provider or portfolio credentials. The static export contains no backend. Source Next 16.3.8 static-export and the installed Next 16.2.6 guides were reviewed; supported client components, images without optimization and static metadata are used.

Next's `basePath` is `/embed/abeam`; `output` is `export`; native images remain unoptimized. The parent serves the export at `/embed/abeam/index.html` and rewrites `/embed/abeam` to that file. Generated files and type caches are ignored, while the vendored source remains reviewable. Parent TypeScript/ESLint do not re-analyze this independent app; its own strict TypeScript check runs during its Next build.

## Data and service boundaries

The visible UI is genuine application code populated with fictional demo records. Local demo interactions do not provide live travel availability or connect a real customer account. Native API call shapes are handled by the local adapter; provider, recording, sending and persistence limits are described by the adapter and portfolio disclosure.

The parent adds a Content Security Policy to this app with `connect-src 'none'`, same-origin script/style/assets, and disabled microphone/camera/geolocation permissions. The host iframe also disables hardware access. This isolates the demo from both paid providers and the real application database.
