# aBeam interactive portfolio app

Updated 27 October 2026. Opening the aBeam project now runs the actual application frontend, replacing the screenshot gallery. The grid cover retains its native desktop and voice-session captures; the expanded view is interactive code.

## Source

`vendor/abeam/` imports the original frontend from `jmramons-coder/ABeam`, branch `redesign/landing-page`, commit `184e20fb010715b322c97e3725e9c2ceae269872`. This is newer than that repository's default branch. `vendor/abeam/SOURCE.json` records original file hashes. The original checkout was not modified.

The original `TravelWorkspace`, components, hooks, styles, fonts and assets render the app. This is not a reconstructed portfolio dashboard. Native global styles and body-mounted dialogs run in an isolated iframe. The portfolio builds it as a static Next app using the shared Next 16.2.6 / React 19.2.6 runtime, rather than requiring a separately hosted app or external checkout.

## Interaction

Visitors can navigate Home, Folders and Explore; open sample consultations and their contextual Agent panel; create a local folder; view transcripts; search illustrative flights and hotels and open their detail drawers; edit journey entries and account settings; and change the app language.

Starting a conversation opens the genuine conversation workspace with authored sample context, travel cards, bookmarks and the original assistant composer. This is explicitly identified as a sample session with the microphone off. Native recording, transcription, live provider research and email sending are unavailable. Assistant responses are locally authored demonstrations, not live model output.

Desktop and Mobile resize the same mounted app, preserving its current screen and state. Desktop on a narrow phone can be panned horizontally. Closing and reopening also preserves state. The app loads only after the project is first opened. The close button remains at the upper-right of the screen, and Escape closes the project after any native dialog has been dismissed. Reset restores the sample trips and profile.

## Isolation and persistence

The public adapter replaces the source's Supabase browser client and API transport with a namespaced, versioned browser store. It contains only fictional people and unbookable, illustrative offers. No customer account, agency database, provider credentials or email service is connected. The adapter handles the real frontend's data contracts rather than allowing its writes to reach a production Supabase project.

The static build receives an explicit environment allowlist, without inherited portfolio/provider credentials. The iframe and HTTP Permissions Policy disable microphone, camera and geolocation. Its Content Security Policy blocks network connections; images, fonts and scripts are bundled locally. A small exact allowlist admits the bundled coastal illustration through the original offer-photo validation, clearly marked as illustrative destination art.

The demo disclosure remains visible below the app. Visitor changes are local to their own browser and can be reset; browser storage restrictions fall back to an in-memory session.

## Build and maintenance

`npm run build` first exports aBeam into ignored `public/embed/abeam`, then builds the portfolio. `npm run dev` prepares the same export before starting Next. `npm run build:abeam` rebuilds just the embedded app. No external SSD path or node_modules symlink is required to build a clean checkout.

The native app has its own strict TypeScript build. Parent TypeScript and ESLint exclude this independent source tree and generated export. Adapter tests verify local persistence, reset, filtering, native service contracts and blocked external requests. The source README identifies the limited portfolio adaptations.

Run `npm run test:abeam` for the 12 adapter checks. The full production build and parent ESLint passed. Browser verification covered contextual assistant answers, flight/hotel drawers, a destination-specific hotel search, original language settings, local folder creation and persistence across refresh, conversation bookmarks returning to the folder, nested Escape handling, and preserving state across project close/reopen and format changes. Responsive checks covered 1422px, 390px and 320px CSS widths, including a panned desktop view on a phone. The narrowest frame uses the app's native 320px minimum without adding an inner horizontal overflow. Proof captures are in `outputs/abeam-live-app/`.

Earlier screenshot provenance remains in `docs/abeam-asset-sources.md` and the source manifests in `work/mobile-product-review/`. Brief and Follow-up are no longer promoted as gallery slides; the expanded project now exposes the native application navigation.
