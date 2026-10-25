# aBeam and Tracer showcase audit

Audited 24 October 2026. Genuine product captures and existing authored brand work are used; no generated interface mockups or invented results.

## Search coverage

A read-only, recursive metadata inventory covered these mounted roots. Counts include PNG/JPEG/WebP/SVG/GIF, MOV/MP4/WebM, PDF and Figma files. Project matches use `abeam`, `travel-conversation` or `tracer` in the path, so duplicate historical portfolio copies count separately.

| Root                             | Eligible files |      Media | Project-path media |
| -------------------------------- | -------------: | ---------: | -----------------: |
| `/Volumes/codex-vault`           |         88,633 |     18,623 |                 14 |
| `/Volumes/CodexWorkspaceStorage` |         62,158 |     14,994 |                108 |
| `/Volumes/CodexBuildArchive`     |         43,507 |        571 |                  0 |
| **Total**                        |    **194,298** | **34,188** |            **122** |

No directory read errors. Hidden folders, dependency/build/cache trees, app/framework/archive bundles, disk/sparse images and compressed archives were excluded. This is an indexed project-candidate audit, not a claim that every unlabelled image was visually inspected. Root's shared `work/asset-audit/media-files.txt` provides the broader portfolio inventory with a narrower media extension set.

The active aBeam repo at `/Users/codex/Documents/Codex/2026-10-11/let/work/ABeam` was also inspected: 422 eligible files and 29 media files outside hidden/dependency/build folders. Source at `184e20f` on `redesign/landing-page` is newer than the old main branch. All 92 aBeam image captures in the adjacent `outputs` directory were reviewed in dated contact sheets; selected sources were inspected individually and checked against current source. Archived duplicates in `CodexInternalActive-2026-10-05` resolve to the same active work; they are not independent versions.

## aBeam

The current grid card now uses the complete mobile captures documented below, replacing the earlier desktop detail crops. The top featured presentation remains the full desktop Explorer image; the aBeam project page is unchanged.

The current mark is the blue orb (`public/abeam/icon.svg`, sourced from app `public/abeam-icon.svg`). `app/abeam/shader-orb.tsx` supplies the animated form. The old square mark and loop videos are historical assets and are excluded from the current identity.

### Current mobile grid walkthrough

`AbeamShowcase` delegates to `app/abeam-mobile-showcase.tsx`. A single stationary phone cycles horizontally between three complete native mobile screenshots every 4.8 seconds. Clicking expands the same frame over blur, with aBeam branding and deliberate screen selectors. Choosing a screen holds that view for reading; closing resumes the grid sequence. Escape, X and outside click return to the grid while retaining the selected screen. Global pause, reduced motion, offscreen state and document visibility stop automatic advancement. Manual selectors remain usable.

| Public asset | Source in `/Users/codex/Documents/Codex/2026-10-11/let/outputs/` | Dimensions | Bytes |
| --- | --- | --- | --- |
| `/showcase/abeam/mobile-explorer.webp` | `explorer-centered-mobile.png` | 390 × 844 | 115,460 |
| `/showcase/abeam/mobile-flight.webp` | `abeam-explore-details-mobile.png` | 390 × 844 | 69,976 |
| `/showcase/abeam/mobile-hotel.webp` | `abeam-explore-hotel-panel-mobile.png` | 390 × 844 | 151,828 |

These are lossless WebP conversions at their original dimensions. Decoded RGB pixels match their source PNGs exactly; no UI was cropped or repainted. `work/mobile-product-review/selected-assets.json` records full source paths, dimensions, hashes and pixel checks. The screens are separate captured examples, with historical fares and availability; the portfolio carousel does not imply a live booking sequence. Older client-file screens and development-overlay captures were excluded. The earlier desktop crop table below remains source history.

Source capture directory: `/Users/codex/Documents/Codex/2026-10-11/let/outputs/`.

| Selected output                                 | Dimensions | Source and treatment                                                                                                                                                                                                                        |
| ----------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/showcase/abeam/hotel-detail.webp`       | 552 × 532  | `abeam-resizable-explore-panel.png` (1440 × 900), crop `(864,90)–(1416,622)`. Genuine returned property photography, accommodation title and nightly fare. Current `ExploreOffers.tsx` still implements the hotel gallery/detail structure. |
| `public/showcase/abeam/flight-detail.webp`      | 686 × 646  | `abeam-explore-details-desktop.png` (1440 × 960), crop `(738,72)–(1424,718)`. Genuine supplier, fare, date, itinerary and source detail.                                                                                                    |
| `public/showcase/abeam/explorer-offers.webp`    | 815 × 502  | `abeam-explore-controls-desktop.png` (1440 × 960), crop `(610,108)–(1425,610)`. Trip idea and returned options.                                                                                                                             |
| `public/showcase/abeam/explorer-workspace.webp` | 1208 × 850 | Details capture, crop `(232,0)–(1440,850)`. Contextual UI with the signed-in shell omitted.                                                                                                                                                 |

All are high-quality WebP derivatives. The interface itself was not repainted or modified. The offers and detail are separate captured examples: offers show YUL–PUJ, detail shows YUL–FCO. Controls label them as separate views and do not imply one live offer opens the other. The card labels captures October 2026; displayed fares are capture content, not live prices.

Also inspected: home/cleanup, calendar controls, follow-up, older overview/journey and mobile captures. Older overview screenshots predate the current merged Travel plan and editable Before/During/After journey, so are excluded as current product evidence. The simplified homepage presents separate native Explorer examples without walkthrough or case-study CTA buttons. The existing `ProductDemo` remains available on the aBeam project page, with fictional clients and explicit demo disclosure.

Accuracy limits: Explorer opens supplier sources/copies links; it does not save Explorer offers into the client file. No booking, CRM writeback, automatic sending or success metric is claimed. Conversation bookmarks and a client file's editable recap/journey are distinct features.

## Tracer

Recovered originals: `/Volumes/CodexWorkspaceStorage/Documents/Codex/2026-09-06/let-s-work-on-my-portfolio/artifacts/tracer-originals/`.

Original Figma: [Tracer — Ecosystem](https://www.figma.com/design/5jhsbkFmJZG902wf3so71F/Tracer---Ecosystem), page `03_Presentations`; exports originally documented 6 September 2026. See `docs/tracer-asset-sources.md` for frame IDs and export history. No newer independent Tracer product source/capture was found in these project-path candidates.

| Selected output                             | Dimensions | Source and treatment                                                                                                                                       |
| ------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/showcase/tracer/workspace.webp`     | 1921 × 858 | Original `app-workspace.png` (1921 × 933), bottom 75px cropped to remove the signed-in account footer, matching prior public portfolio treatment.          |
| `public/showcase/tracer/report-detail.webp` | 1085 × 733 | Same original, crop `(710,125)–(1795,858)`, preserving the actual report interface and removing unrelated shell data. Available for a detail/gallery view. |

The main card pans the actual workspace at a fixed readable scale using a native range control. It does not simulate executing a screening or present the report contents as independently verified findings. Navigation, research source links, investigation sections and report export controls are visibly present in the source.

Strong secondary art, inspected visually and available to supporting widgets:

| Existing public asset                   | Dimensions  | Use                                                                                                                 |
| --------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `public/tracer/landscape.webp`          | 2200 × 2200 | Full-bleed nature scene. Original `landscape.png`, 2627².                                                           |
| `public/tracer/logo-glass.png`          | 523 × 478   | Transparent glass/chrome T, for nature/identity composition. Preserve its actual shape.                             |
| `public/tracer/brand-campaign.webp`     | 2400 × 1600 | Billboard **concept**, not evidence of an installed campaign. Original `campaign.png`, 3896 × 2597.                 |
| `public/tracer/logo-development.webp`   | 3000 × 1801 | Eye, movement, path and shield explorations, material and final mark. Original `logo-development.png`, 4818 × 2892. |
| `public/tracer/brand-guidelines.webp`   | 4800 × 871  | Brand book/purpose/primary mark. Original `guidelines.png`, 5953 × 1080.                                            |
| `public/tracer/brand-architecture.webp` | 2400 × 1260 | Blue identity + architectural image, original `architecture.png`, 14400 × 7560.                                     |

The tall June `tracer-security-screenshot.png` and September `website.png` were also inspected; the higher-quality original Figma exports and product capture are the stronger choices. Campaign, workspace, architecture, process, landscape, guidelines and both existing individual/organization image compositions were visually checked in contact sheets; the two selected product sources were inspected individually.

## Interaction and delivery

`app/desktop-showcase.tsx` exports `AbeamShowcase` and `TracerShowcase`, each accepting optional `paused`. All controls are native buttons/range/link elements with at least 44px target areas, visible focus and accessible labels. The range is keyboard operable and keeps vertical touch scrolling available. Modal previews load on request and return focus to the opener. The aBeam orb stops for global pause, reduced motion, hidden tabs and offscreen cards; UI controls remain usable with motion stopped. No outer grid motion or tilted device framing is used.

The earlier October 24 desktop iteration used a near-square capture stage, crossfading Hotels / Flights / Explorer every 6.8 seconds. The mobile walkthrough above supersedes that grid treatment. The separate animated identity tile and the full desktop Explorer image in the top presentation remain unchanged.

The initial source-audit task ran targeted ESLint and TypeScript; later integration verification is recorded below.

## Mobile presentation verification

The current mobile walkthrough passed the production build, TypeScript and targeted ESLint. Actual browser checks confirmed all three full mobile images load, automatic advancement, deliberate selection and retained selection on minimizing. A manually chosen hotel screen remained selected beyond 20 seconds. The phone fits at exact CSS viewport widths of 320 and 390px, with no horizontal overflow; the normal desktop preview was also inspected. Page pause and reduced motion stop automatic movement while manual selection remains available. Assets return HTTP 200 through both loopback and LAN. Pixel checks and hashes are in `work/mobile-product-review/selected-assets.json`; browser proof and HTTP results are in `outputs/mobile-project-refresh/`.
