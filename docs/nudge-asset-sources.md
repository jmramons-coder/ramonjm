# Nudge portfolio case study

Added September 6, 2026. Source website: `/Users/codex/Documents/Codex/2026-08-21/we-have-a-todo-ios-app`, published at https://nudge-launch.vercel.app/.

The case study uses the current website's reviewed native captures and brand artwork. Copied assets are converted to WebP at quality 93 without cropping or upscaling.

| Portfolio asset | Website source under assets/ |
| --- | --- |
| app-icon.webp | nudge-app-icon.png |
| mark.webp | nudge-mark.png |
| home.webp | app/recordings/nudge-native-outcome-v3.jpg |
| household.webp | app/optimized/nudge-household-web-v3.avif |
| timer.webp | campaign/timer-native-v2.webp |
| voice.webp | campaign/voice-person-v1.webp |
| family.webp | campaign/focus-scene-v1.webp |
| medal.webp | campaign/medal-3d-v1.webp |
| broom.webp | campaign/broom-3d-v1.webp |
| demo.mp4 | app/recordings/nudge-native-flow-v3.mp4 (unchanged) |

The video uses a fictional household and an illustrative voice-capture sequence rendered by the native app. It now loops silently in the hero while visible, with a pause control. Reduced-motion preferences suppress automatic playback; visitors can still start it explicitly. Playback pauses offscreen and when the tab is hidden. Campaign artwork is identified separately from app captures. Phone frames are CSS presentation around the unmodified screenshot proportions.

Product framing is grounded in current website copy and the September 6 launch review in `/Users/codex/Documents/Codex/2026-09-05/le/outputs/nudge-launch-polish/ANALYSIS.md`. No user-research outcomes, adoption metrics, or public App Store availability are claimed. The link goes to the beta website.

## App Store campaign

The seven `store-*.webp` panels come from `/Users/codex/Documents/Codex/2026-09-05/le/outputs/nudge-dimensional-campaign/exports/iphone/`, matching the reviewed files listed in `outputs/nudge-release-63/screenshot-upload-manifest.json`. Each 1320 × 2868 source was proportionally resized to 990 pixels wide and encoded as WebP at quality 91. Full compositions are retained, presented as original App Store launch artwork, and linked to full-size copies.

## Homepage sticker tile — October 24, 2026

The former “Little things. Lighter days.” campaign slot now hosts the native task-creation demo. Its previous grid slot is a clean interactive sticker composition. Original `sticker-medal.png` and `sticker-sparkle-check.png` from `/Users/codex/Documents/Codex/2026-10-15/nudge-1.0.2-review/recovered-ios/Nudge/Assets.xcassets` were converted losslessly to `public/showcase/nudge/sticker-*.webp`, retaining transparency. CSS supplies the vivid background and restrained pointer movement; click/tap adds a short wiggle. Global pause and reduced motion disable movement. No duplicate demo was added; gallery totals remain 18 / 9 products / 7 art / 2 archive.

## Video-first expanded gallery — October 24, 2026

The Nudge grid remains the native interaction video without controls. Expansion now opens a horizontal scroll-snap gallery with that video first, followed by all seven existing `public/nudge/store-*.webp` App Store panels. The centered panel grows while neighboring panels remain visible, matching the PushedWorld gallery. The video pauses when a screenshot becomes selected, and its controls disappear. The compact single-row player includes play/pause, replay, seeking and elapsed/total time; position returns to the grid on close. The shared Grok Safe/Shakepay launch control bar was also reduced to a single row with the same action/seek/time layout. Verified video pause, screenshot selection, control hiding and mobile overflow.
