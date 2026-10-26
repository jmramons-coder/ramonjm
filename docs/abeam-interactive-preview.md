# aBeam native screen gallery

Updated 25 October 2026. The reconstructed Explorer prototype was rejected and removed. The portfolio shows captures of the real aBeam application, including a current native frontend frame with demonstration conversation data. It contains no rebuilt dashboard, simulated search, fake pricing or app iframe.

## Source and quality

The actual app is at `/Users/codex/Documents/Codex/2026-10-11/let/work/ABeam`, branch `redesign/landing-page`, commit `184e20f`. Explorer and offer-detail hierarchy was checked in `app/components/Explore.tsx`, `app/components/ExploreOffers.tsx` and `app/components/explore.css`.

Every image below is a lossless WebP derivative of its listed source PNG. The earlier Explorer/detail sources are in `/Users/codex/Documents/Codex/2026-10-11/let/outputs/`; the new voice frame is retained in `work/abeam-voice-capture/mobile-voice-session.png`. No interface content was repainted or resized after capture. The native aBeam orb `/abeam/icon.svg` is reused outside the screenshots.

| Format / view | Public asset | Original source PNG | Native pixels |
| --- | --- | --- | --- |
| Mobile Voice session | `/showcase/abeam/mobile-voice-session.webp` | Current original frontend in an isolated offline fixture; fictional discussion, native recording UI | 780 × 1687 |
| Mobile Explorer | `/showcase/abeam/mobile-explorer.webp` | `explorer-centered-mobile.png` | 390 × 844 |
| Mobile Flight details | `/showcase/abeam/mobile-flight.webp` | `abeam-explore-details-mobile.png` | 390 × 844 |
| Mobile Hotel details | `/showcase/abeam/mobile-hotel.webp` | `abeam-explore-hotel-panel-mobile.png` | 390 × 844 |
| Desktop Explorer | `/showcase/abeam/desktop-explorer.webp` | `explorer-centered-desktop.png` | 1440 × 960 |
| Desktop Search | `/showcase/abeam/desktop-search.webp` | `abeam-explore-controls-desktop.png` | 1440 × 960 |
| Desktop Flight details | `/showcase/abeam/desktop-flight.webp` | `abeam-explore-details-desktop.png` | 1440 × 960 |
| Desktop Hotel details | `/showcase/abeam/desktop-hotel.webp` | `abeam-explore-hotel-panel-desktop.png` | 1440 × 1000 |
| Desktop Brief | `/showcase/abeam/desktop-brief.webp` | `abeam-debrief-desktop-refined.png` | 1440 × 1000 |
| Desktop Follow-up | `/showcase/abeam/desktop-follow-up.webp` | `abeam-follow-up-full-width.png` | 1440 × 1000 |

The mobile derivative manifest is `work/mobile-product-review/selected-assets.json`; the desktop derivative manifest is `work/mobile-product-review/desktop-assets.json`. Both record original source hashes, native dimensions and pixel equality. Desktop conversions were verified with an exact decoded RGB difference check. The source originals retain their native pixels and aspect ratio.

The three earlier mobile Explorer/detail captures are 1× originals and remain capped at 390 CSS pixels. The new voice-session frame is a 2× native frontend capture, 780 × 1687 pixels, with its decoded pixels preserved. It uses the current source at `184e20fb010715b322c97e3725e9c2ceae269872`, unchanged session markup/styles and fictional local conversation data. No microphone, transcription, model, provider or database calls ran. The temporary fixture and patch provenance are retained under `work/abeam-voice-capture/`; `work/mobile-product-review/voice-session-asset.json` records image hashes and decoded RGB equality. The original aBeam repository was not modified. Desktop images are capped at their native 1440-pixel width and fit the available viewport height. At small phone widths, Desktop displays the complete screenshot scaled to fit; Mobile provides the readable phone composition.

## Presentation

The grid presents the real desktop Explorer in a floating desktop window, with the current mobile voice-session capture layered in front. The blue project scene matches the shared desktop project cards. Pointer movement gives the two devices a small opposing parallax response; global pause and reduced motion keep them still. Screens do not cycle or run an accelerated walkthrough.

Expanding starts in Desktop. A separate Mobile / Desktop control selects the format; changing format resets the gallery to its first screenshot. Re-selecting the active format preserves its current screenshot. Mobile starts with Voice session, then Explorer, Flight details and Hotel details. The voice frame is identified as an actual app UI capture with a demonstration conversation. Desktop currently shows four curated states: Explorer, Search, Flight details and Hotel details. Brief and Follow-up are omitted from the gallery for now; their source captures remain archived. Older duplicate layouts, landing pages, sign-in screens, empty folders and stress-test captures were excluded.

Both formats support manual horizontal scroll/swipe, labeled screen buttons and left/right arrow keys. Labeled selection changes immediately. Navigation labels scroll horizontally on narrow screens. The complete native aspect ratio is preserved throughout. The actual blue orb and aBeam name stay at the screen's upper left; X stays at the screen's upper right. Escape, X or a background click closes the gallery and returns focus to the grid opener. Opening/closing motion honors the portfolio pause setting and reduced motion.

Fares and availability visible in the October 2026 captures are historical screen content. The screenshots are independent captured states, not a claim that a particular offer leads to another frame. This gallery does not search, book, send or persist data. No authentication, provider API, model, private client record or database access is added.

## Verification

Production build and focused component ESLint passed on 25 October 2026. Browser verification followed the grid opener → format control → native image → labeled selection/scroll → close flow. All six desktop captures decoded at their declared 1440 × 960/1000 pixels and remained fully visible at their original aspect ratios. Switching from the final desktop screen back to Mobile now resets to Voice session. Format arrow keys and Home moved focus and selected the correct format; screenshot arrow keys and horizontal scrolling selected the corresponding screen. Closing with X restored focus to the grid opener; Escape also closed the dialog.

Checked CSS viewports of 1422 × 800, 390 × 800 and 320 × 800. The narrowest layout places the format toggle on a second row and keeps the six screen labels in a scrollable control without widening the dialog. No browser console errors were observed. Proof captures are in `outputs/abeam-screen-formats/`.

The updated layered-card pass also verified pointer-driven movement of both device layers, the global pause control, and reduced-motion static poses. Desktop opens first with four screen selectors; Mobile opens on Voice session with four selectors. The new voice image decoded at 780 × 1687. At a 320px CSS viewport, the page had no horizontal overflow, the phone stayed inside its card with 24px clearance below the copy, and the expanded voice frame and screen-level X remained within the viewport. Light mode uses the aBeam pale-blue scene. Escape returned focus to the grid opener. No portfolio console errors were observed. Current proof captures are in `outputs/abeam-desktop-and-voice/`.

On 26 October 2026, Brief and Follow-up were removed from the visible gallery at the owner’s request. Navigation, keyboard limits and slide counts derive from the four remaining desktop records. The asset inventory above retains the archived sources for provenance.
