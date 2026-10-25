# Business showcase asset audit

Inspected October 24, 2026. This audit covers Decision ROI / Equisoft, the independent Shakepay study, CryptoCroc, and a filename/provenance search for a personal portrait. Counts are media paths, including distinct archived copies; they are not claims of unique creative assets. Only curated, visually checked material is prepared for the homepage.

## Search coverage

The scan excluded node_modules, .git, .next, build/DerivedData/Index directories, package/runtime caches, hidden metadata files, sparse images/bundles, secrets and unrelated document contents. Broad archive scans were filename inventories; business assets were selected by project path and source references before inspection.

| Root                                                          | Media paths after exclusions | Outcome                                                                                |
| ------------------------------------------------------------- | ---------------------------: | -------------------------------------------------------------------------------------- |
| `/Volumes/codex-vault/Equisoft Elevate 2026 - Final Videos`   |                            8 | Eight final enterprise demos; held for separate public-media review.                   |
| `/Volumes/codex-vault/Equisoft Elevate 2026 - Final Videos 2` |                            8 | Eight final enterprise demos; held for separate public-media review.                   |
| `/Volumes/codex-vault/Equisoft Rebuild Workspace`             |                          263 | 263 source/previews/storyboards; enterprise material not imported into public assets.  |
| `/Volumes/codex-vault/Equisoft-Elevate-2026`                  |                            0 | No additional selected business media or verified personal portrait.                   |
| `/Volumes/codex-vault/Elevate 2026 Demos`                     |                           17 | 17 media files; enterprise material held for separate review.                          |
| `/Volumes/codex-vault/Crypto Inheritance Micro-Webapp`        |                           23 | 22 original character/brand images and one OG poster, plus actual app source.          |
| `/Volumes/codex-vault/Downloads-2026-09-28`                   |                           75 | Known Equisoft video copies, Shakepay film and study screenshot; no verified portrait. |
| `/Volumes/CodexWorkspaceStorage/Documents/Codex`              |                        9,186 | Older portfolio, native Shakepay study, business source and review media located.      |
| `/Volumes/CodexWorkspaceStorage/HomeData`                     |                          261 | Active-project media filenames inspected; caches excluded, no verified portrait.       |
| `/Volumes/CodexWorkspaceStorage/Codex-Offload-2026-10-23`     |                        4,680 | No additional selected business media or verified personal portrait.                   |
| `/Volumes/CodexBuildArchive`                                  |                          579 | Includes Offload-2026-10-17; no additional selected business/portrait material.        |

The vault root also contains 12 loose raster images. These are named product screenshots/generated artwork; none has verified personal-portrait provenance. Existing active portfolio public assets and source documentation were inspected as the public baseline.

## Curated homepage files

WebP derivatives use Sharp at quality 90, preserve the original aspect ratio and are never enlarged. Original screenshots are not relabelled as functioning live interfaces. No source pixels were inverted, repainted, or populated with invented financial balances.

| Homepage asset                        | Dimensions | Source                                                                                                         |
| ------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `/showcase/roi/prototype.webp`        | 1200 × 833 | `public/equisoft-labs/app-screenshot.jpg`                                                                      |
| `/showcase/roi/calculator.webp`       | 800 × 800  | `public/equisoft-labs/roi-calculator-hq.png`                                                                   |
| `/showcase/roi/elevate-booth.webp`    | 1200 × 800 | `public/equisoft-labs/elevate-booth-roi-clean.png`                                                             |
| `/showcase/shakepay/rewards.webp`     | 600 × 1304 | `private-media/rewards.jpg`                                                                                    |
| `/showcase/shakepay/potential.webp`   | 600 × 1304 | `private-media/potential.png`                                                                                  |
| `/showcase/shakepay/profile.webp`     | 600 × 1304 | `private-media/profile.png`                                                                                    |
| `/showcase/shakepay/compare.webp`     | 600 × 1304 | `private-media/compare.png`                                                                                    |
| `/showcase/crypto/brand-poster.webp`  | 1200 × 630 | `/Volumes/codex-vault/Crypto Inheritance Micro-Webapp/public/og.png`                                           |
| `/showcase/crypto/hang-glider.webp`   | 800 × 1200 | `/Volumes/codex-vault/Crypto Inheritance Micro-Webapp/src/assets/48aa055a639438611189d181d3a0ba4817f880ce.png` |
| `/showcase/crypto/treasure.webp`      | 800 × 800  | `/Volumes/codex-vault/Crypto Inheritance Micro-Webapp/src/assets/0f69860b49d353d279ca57503efc8f510ad2e9c6.png` |
| `/showcase/crypto/holdings.webp`      | 1100 × 820 | `/tmp/crypto-holdings-actual.png`                                                                              |
| `/showcase/crypto/beneficiaries.webp` | 1100 × 820 | `/tmp/crypto-beneficiaries-actual.png`                                                                         |
| `/showcase/crypto/practice.webp`      | 1100 × 820 | `/tmp/crypto-practice-actual.png`                                                                              |

### Decision ROI / Equisoft

- The 1200 × 833 prototype image already appears publicly on `/equisoft-labs`; it shows the original role selector, inputs and result panel. The glass calculator and booth concept are original portfolio illustrations, not event photographs.
- The new DecisionShowcase switches between original prototype and booth imagery. Its small native range input explores hours per week × 52 weeks and is labelled “Illustrative time scenario.” It does not recalculate the prototype’s financial model or make a return/savings claim.
- The vault final-video directories contain agent launch, case management, design configuration, AI Composer, AI Manager, Agentic Store, D2C journey and group-benefits films. A duplicate final-video set is present. These were discovered by path/name, not accepted as automatically public. The existing `/equisoft` page frames enterprise work as confidential/sanitized; no new enterprise film or internal UI is copied into `public/showcase`.
- The later Case Management portfolio study uses the user-specified `jmramons-coder/case-management-platform` repository at `d58b51fa981664a533a8c9fe135a4254e952275f`, a Supabase-backed demo/validation app. Its native demonstration-data captures and separate local financial-review study are documented in the [product analysis](case-management-product-analysis.md) and [capture sources](case-management-asset-sources.md). This source addition is separate from this drive audit and does not make the discovered enterprise films automatically public.

### Shakepay

- The approved source set is `/Volumes/CodexWorkspaceStorage/Documents/Codex/2026-09-19/read-shakepay-swiftui-codex-handoff-md/work/ramonjm/private-media/`.
- Rewards, Potential, Profile and Compare are exact original fictional native-prototype screens. Their routes are already allowlisted by `app/shakepay/media/[asset]/route.ts` and used on the existing public study. The current homepage card offers only Rewards, Potential and Profile screen choices. Compare remains in the source inventory and existing study; it is not a current card control.
- The current card presents the native phone screen on a neutral surface, with a quiet Shakepay title link and three 44px screen buttons. The earlier blue circle, caption overlay, explanatory rows and Explore footer are removed. A compact “Independent study · Fictional data. Not affiliated with Shakepay.” disclosure remains below the screen.
- `public/showcase/shakepay/rewards-loop.mp4` is a byte-for-byte copy of the existing approved silent `rewards-loop.mp4`, approximately 505 KB. It is not a derivative of the scored launch film. Playback stops offscreen, in hidden tabs, with the global pause control and for reduced motion. A native 44px local Play/Pause button now sits in the card header while Rewards is selected, leaving the recorded interface unobscured. Its explicit choice survives scrolling, tab visibility changes and switching study views; explicit Play can start the recording with reduced motion enabled, while global pause always takes precedence.
- On root-agent authorization, the complete eleven-file allowlisted set was restored unchanged into the ignored `private-media/` folder from the verified source: film, poster, home, rewards, potential, profile, compare and the four original loops. No route, guard, Vercel exception or video range handling was changed. The `private-media/film.mp4` deployment guard remains intact.
- See `docs/shakepay-private-study.md`. Do not create or publish a new film derivative from this audit.

### CryptoCroc

- SSD source: `/Volumes/codex-vault/Crypto Inheritance Micro-Webapp/`. The original character system contains 22 illustrations; `public/og.png` is the branded 1200 × 630 poster.
- Treasure artwork is source `src/assets/0f69860b49d353d279ca57503efc8f510ad2e9c6.png`; hang-glider artwork is `src/assets/48aa055a639438611189d181d3a0ba4817f880ce.png`. Both are referenced by the real home-page component, not newly generated illustrations.
- Actual Holdings, Beneficiaries and Practice views were captured from the public `https://crypto-inheritance.xyz/` app in a fresh isolated headless Chrome session at 1100 × 820. No shared browser UI or signed-in profile was used. Only Start and existing workflow navigation were clicked; fields were left empty, no wallet/beneficiary secrets were entered, no transaction/export was performed, and the isolated browser was closed.
- The source components `holdings-step.tsx`, `beneficiaries-step.tsx`, `test-transaction-step.tsx` and `App.tsx` were read to verify workflow labels and asset provenance. The homepage gallery shows actual empty app captures, rather than a fabricated financial text panel.

## Supporting art recommendations

1. `/showcase/crypto/hang-glider.webp`: strong portrait-format original character illustration, useful as a separate visual card.
2. `/showcase/crypto/brand-poster.webp`: original complete brand poster. Keep its aspect ratio so the wordmark is not clipped.
3. `/showcase/roi/elevate-booth.webp`: landscape concept illustration. Label it “Booth concept,” not an actual event photo.
4. `/showcase/roi/calculator.webp`: transparent glass calculator object, useful on a pale-blue surface.
5. `/showcase/shakepay/profile.webp` and `/showcase/shakepay/compare.webp`: original product-study UI. Profile is a current homepage screen choice; Compare is retained supporting material used by the existing study, without a Compare control in the current card. Preserve the independent-study and fictional-data context wherever these images appear.

## Portrait result

No verified Ramon portrait was found in the targeted drive/media filename and source-provenance search. Product avatars, PushedWorld avatar frames, generated people and household stock/lifestyle images are not substitutes. Existing contact links identify a LinkedIn profile, but no public portrait URL or user-confirmed portrait file was supplied to this audit. The explicit user-supplied portrait path remains pending.

## Verification

- All curated images were opened and visually inspected, or are same-pixel resizes of already-inspected original portfolio sources. Brand poster, two additional CryptoCroc illustrations, actual three app screens, Shakepay Rewards/Profile and existing ROI UI were inspected directly.
- Native controls remain separate from project links. Cards use shared 20px radius, dark/light tokens, minimum-width-safe compositions, and reduced/pause handling.
- Before the Shakepay composition simplification, isolated headless Chrome at `http://localhost:3002` verified the 600px business interactions: local recording pause survives scroll, study-view changes and a real background/foreground tab transition; explicit Play works with reduced motion; global pause overrides it. The ROI view switch and keyboard range update work. CryptoCroc stays 330px tall when switching character/planner at 280, 320, 500, 600 and 639px viewport widths, with no page overflow. View buttons and range targets are 44px high; workflow buttons are 66px high. These checks record the earlier browser pass; the playback state logic is unchanged by the later move to the header.
- After the Nudge/Shakepay composition simplification, targeted ESLint, full TypeScript (`--noEmit --incremental false`) and Prettier checks passed. Every widget media path exists. This task did not run a production build.
