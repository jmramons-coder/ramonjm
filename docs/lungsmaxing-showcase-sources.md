# Lungsmaxing showcase sources

Inspected October 24, 2026. The interactive portfolio card adapts the product website’s [illustrative impact calculator](https://lungsmaxing.com/#impact). It remains in the existing archive-card position and retains a separate gallery of historical native app captures.

## Public source and local correspondence

Source files are under `/Volumes/codex-vault/lungsmaxing-project/website/`:

- `index.html:387–427`: range defaults, example labels and baseline disclosure.
- `assets/site.js:556–652`: calculation, rounding, duration labels, accessible value and handle positioning.
- `assets/styles.css:4014–4225,5834–5835`: visual reveal and current scene assets. The final overrides use the same stone-Path image under dark and bright treatments, replacing the older valley backgrounds.

Fresh HTTPS retrievals of the public homepage, `assets/site.js` and `assets/styles.css` matched these local files **byte for byte**. The local checkout has working-tree changes, so its Git HEAD is not claimed as the deployed source revision. Observed SHA-256 values:

| File                | SHA-256                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `index.html`        | `42a3081445e152400c05bf6d1cddae9229f0eb87b32ef88ec6386d5aedcdf09a` |
| `assets/site.js`    | `7a1ed3713eba04c3ca90e775abf84fb8dc18b85ceaf37253d237588eab8ab6a7` |
| `assets/styles.css` | `0d03135b9cacfada1f15d3e3173a4ee11d3792668b2e015f6f160346f63b2ebd` |

## Exact website calculation

The native HTML range is **0–100**, **step 0.1**, **default 50**. For value `v`:

```js
const progress = Math.min(1, Math.max(0, v / 100));
const days = Math.round(7 + 358 * progress);
const money = Math.round((days / 7) * 50);
const moments = Math.round((days / 7) * 5);
```

Currency uses `Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })`. Default results are **186 days, CAD $1,329 and 133 moments**. Endpoints are **7 days / CAD $50 / 5 moments** and **365 days / CAD $2,607 / 261 moments**. Monetary and moment estimates are calculated from the rounded day count.

Duration labels match the website:

- Below 14 days: the integer day count.
- Below 60 days: `Math.round(days / 7)` weeks.
- Below 330 days: months use `days / 30.4375`; round to one decimal below four months and an integer thereafter. Format with `en-CA`; singular only when the rounded result equals one.
- From 330 through 364 days: rounded months using the same divisor.
- At 365 days: `1 year`.

The source labels these outputs as estimated money kept, estimated use moments back and days on the Path. Its explicit assumption is **5 use moments and CAD $50 spending per week**. The card preserves this as a visible example baseline and in its accessible range description. Moments are not cigarette counts or hours. This is illustrative arithmetic, not observed savings, elapsed abstinence or a personal forecast.

The website reveal clips the bright layer from the left at the range percentage. The handle follows `10 + (v / 100) * (sceneWidth - 20)`. The portfolio keeps a native, keyboard-operable range and `touch-action: pan-y`, adapting the composition to a compact card. Its reveal edge shares the native handle coordinate; an 18px glass handle and inset focus treatment stay inside the scene at both endpoints.

## Original artwork and derivatives

All three assets come from the product website, with no generated or repainted artwork:

| Portfolio asset                                                   | Original, relative to website root              | Treatment                                                                                                                          |
| ----------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `public/showcase/lungsmaxing/impact-scene.webp` — 887 × 1774, RGB | `assets/media/current-path-scene.webp`          | Unchanged byte copy. SHA-256 `034c4f049d46d0c745e37280a1e15785c71114a4521d9b7a4a7fa9d23d86a61c` matches source and output.         |
| `public/showcase/lungsmaxing/ember-vape.webp` — 720 × 720, RGBA   | `assets/media/finale-vape-burn.png` — 720 × 720 | Pillow WebP derivative, quality 94; original transparency retained. Depicts Ember destroying a vape, matching the live calculator. |
| `public/showcase/lungsmaxing/icon.webp` — 96 × 96, RGB            | `assets/app-icon.png` — 512 × 512               | Resized and encoded with Pillow as WebP, quality 94.                                                                               |

The gallery still uses `public/showcase/editorial/lungs-path.webp`, `lungs-dashboard.webp` and `lungs-ember.webp`. Its captions distinguish historical native UI captures from character artwork. Gallery sources remain documented in [the portfolio asset audit](portfolio-asset-audit.md) and [playground source record](playground-asset-sources.md).

## Adaptation boundaries

`app/lungs-showcase.tsx` and `app/lungs-showcase.module.css` adapt the website’s continuous, reversible preview. The native app’s `Lungsmaxing/OnboardingView.swift:1390–1513,2133–2247` instead steps through five horizons and commits onboarding when released at progress ≥ 0.84. That commit-on-release behavior is intentionally not used in the portfolio card.

No physiological outcome is calculated. Do not present the reveal as measured lung repair, recovery percentage, lifespan gained, or personal medical improvement. No reclaimed-time estimate is calculated either. The numeric outputs are baseline money, use moments and the selected illustrative day count. Runtime and visual QA are recorded separately.


## Portfolio verification

The optimized production preview on port 3001 was checked October 24, 2026. `npm run build` (including TypeScript), targeted ESLint and `git diff --check` passed. Browser checks confirmed the initial 186-day estimate, Home/End endpoints, PageDown arithmetic, pointer dragging and actual phone touch input. The visual reveal handle follows the native value and remains inside the scene at both endpoints.

At 280, 320, 390, 600, 768, 1024, 1440 and 1680px there was no page/card horizontal overflow or missing card image. Dark and light compositions were visually reviewed. The slider retains its label, baseline description, numeric value text, visible focus and vertical touch scrolling behavior. It remains interactive with global motion paused and reduced motion enabled; no timed or background animation is required.

The separate gallery opens, advances, closes with Escape and returns focus to its button, without being triggered by dragging. All sixteen existing portfolio pieces remain. No browser runtime errors occurred. Results and screenshots are in `outputs/lungsmaxing-showcase/qa.json` and adjacent PNGs. The existing in-app tab was refreshed and focused on the calculator. Local and same-network homepage requests returned HTTP 200. The temporary development server was stopped and the production preview remains running on `0.0.0.0:3001`. No public deployment or Git commit was made.

## Slider character reveal — October 25, 2026
The dark side now uses the original `assets/media/ember-death-scythe.png` (unchanged copy at `public/showcase/lungsmaxing/ember-skull.png`). The existing laser/burning-vape artwork is clipped to the revealed percentage, with the skull-mask artwork clipped to the remaining percentage. At zero there are no lasers or burning vape; at 100 the active scene is fully visible. Both artworks share the slider value without timed animation.
