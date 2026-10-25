# aBeam project page

The project page reflects the aBeam application on `redesign/landing-page` at commit `184e20f` (October 14, 2026), rather than the older main branch. Product behavior was checked against the conversation workspace, client-folder overview, trip journey, follow-up editor, and Explore implementation.

- `public/abeam/icon.svg`: current static blue orb, copied from the application's `public/abeam-icon.svg`.
- `app/abeam/shader-orb.tsx` and its CSS: application's current local WebGL orb implementation. Blue palette and smooth edge match the product; the existing `AbeamVideo` export wraps it for compatibility. Offscreen, hidden-tab, and reduced-motion behavior is retained.
- `public/abeam/explore.webp`: actual Explore screen and TAP flight detail drawer, converted from the application's October 13 `abeam-explore-details-desktop.png` capture to 1440 × 960 WebP. The account is illustrative. This is a screenshot, not an interactive offer.
- `ProductDemo`: responsive, reconstructed product walkthrough based on current application behavior. Maya and Alex, their Japan trip, transcript, preferences, questions, journey and email are fictional. Replay is a text demonstration, not microphone recording or audio playback. Copy draft only copies the editable example; nothing is sent.

The older square mark and transparent videos remain in public assets for history, but no current aBeam portfolio UI references them. The homepage uses the static new orb; the project page and project carousel use the animated orb.
