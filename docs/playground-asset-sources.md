# Playground asset sources

Updated October 24, 2026. The current homepage gallery contains **18 pieces across eleven named projects: nine primary product cards, seven identity/art cards and two archive studies**. These are distinct compositions drawn from genuine product captures and original project artwork; they are not the earlier set of 15 static preview derivatives listed below.

## Current implementation and audit trail

[ProjectPlayground](../app/project-playground.tsx) composes the pieces and provides All work, Products, Identity & art and Archive filters. The introductory personal board and its featured presentation remain above this gallery.

| Implementation                                                      | Current scope                                                                                                     | Source audit                                                        |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [desktop-showcase.tsx](../app/desktop-showcase.tsx)                 | aBeam and Tracer product cards; `/showcase/abeam` and `/showcase/tracer`                                          | [Desktop showcase audit](desktop-showcase-audit.md)                 |
| [mobile-showcase.tsx](../app/mobile-showcase.tsx)                   | Nudge and PushedWorld product cards; `/showcase/nudge` and `/showcase/world`                                      | [Mobile showcase audit](mobile-showcase-audit.md)                   |
| [business-showcase.tsx](../app/business-showcase.tsx)               | CryptoCroc, Decision ROI and the independent Shakepay study                                                       | [Business showcase audit](business-showcase-audit.md)               |
| [case-management-showcase.tsx](../app/case-management-showcase.tsx) | Correct application task/requirement/Galia crops, source-labelled full-screen gallery and `/case-management` link | [Case Management capture sources](case-management-asset-sources.md) |
| [editorial-showcase.tsx](../app/editorial-showcase.tsx)             | Six identity/art compositions and two archive studies; `/showcase/editorial` plus shared project art              | [Portfolio asset audit](portfolio-asset-audit.md)                   |
| [studio-gallery.tsx](../app/studio-gallery.tsx)                     | Shared native image-inspection dialog, source captions and optional existing project link                         | [Interaction reference](portfolio-interaction-reference.md)         |

[Grok Safe showcase](../app/grok-safe-showcase.tsx) adds the anti-scam concept as a ninth product card and a scenario-opening row in the written portfolio. The complete original walkthrough prepared for X plays once, with Play/Pause, seeking and Restart scenario controls; inspection opens a larger whole-phone player. Its source and earlier anonymous still captures are documented in [Grok Safe capture sources](grok-safe-asset-sources.md).

The audits record search coverage, selected original paths, dimensions, crops, privacy treatment and distinctions between product UI, campaign illustration and historical footage. Their path counts use different exclusions and overlap through archived copies/aliases; they are not unique-asset totals to add together. Prepared media are local, appropriately sized derivatives. Product screenshot pixels are not inverted or repainted for the portfolio theme.

## Nine primary product cards

| Project         | Current interaction                                                                                                                | Evidence and limits                                                                                                                                                                                                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| aBeam           | Watch full mobile Explorer, flight and hotel screens slide inside a phone; expand and choose a screen to inspect. | Complete native mobile captures, converted losslessly without cropping. Separate captured examples with historical fares; no live search, booking or sending occurs. |
| Nudge           | Watch the phone-only native recording; click to expand with Nudge branding and playback controls. | Genuine native app demonstration with fictional household data. No visible header, demo caption or playback control appears in the grid; campaign artwork remains in its separate editorial card. |
| Case Management | Select The task, The requirement and Galia; inspect full captured workspaces.                                                      | Actual `case-management-platform` UI with demonstration data. Current Supabase-backed source selects a model-backed assistant with deterministic fallback. The separate local study reveals missing personal statements, prepares two demo requirement rows and shows an attributed simulated receipt. |
| Grok Safe       | Play/restart the original X-sharing walkthrough: conversation, shield scan, safety review, link warnings and protection replay; expand the whole-phone player. | Independent SwiftUI concept, originally called Grok Protect. The original video's recreated conversation and source identity are retained at the user's request; analysis is simulated. No live X, Grok or reputation service is connected. See [capture sources](grok-safe-asset-sources.md). |
| PushedWorld     | Play/pause a real early-prototype excerpt; try/reset five illustrative reps.                                                       | Genuine historical camera/pose-tracking footage is explicitly labelled early prototype. Current Path and Buster artwork are separate from that recording. The local rep button does not access a camera, detect exercise or save a workout.                                                            |
| Tracer          | Pan across the actual workspace using a native range control; inspect the broader product/identity gallery.                        | Actual source workspace with its signed-in footer cropped out. No screening or new research finding is generated. The billboard is a campaign concept.                                                                                                                                                 |
| Decision ROI    | Switch original prototype/booth views and adjust an illustrative time scenario.                                                    | Actual existing prototype screenshot plus original calculator/booth concept art. Arithmetic is `hours per week × 52 weeks`, not the prototype's financial model or a promised return.                                                                                                                  |
| Shakepay        | Inspect Rewards, Potential and Profile; play/pause the silent Rewards recording.                                                   | Original working SwiftUI study with fictional data. The recording is the existing approved silent loop, not a new derivative of the scored launch film. Independent/unaffiliated disclosure remains visible.                                                                                           |
| CryptoCroc      | Switch character/planner views and inspect Holdings, People and Practice.                                                          | Original character library plus actual empty app captures from the public product. No wallet, beneficiary details, recovery secret or transaction is collected by the portfolio.                                                                                                                       |

## Six identity/art pieces and two archive studies

| Piece                                | Assets and treatment                                                                                                                                                                                                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tracer — glass artwork               | Original green landscape and transparent glass mark, with no visible labels or captions. The whole image expands into a centered, blurred-backdrop preview and returns to its tile on close. |
| Tracer — design process              | Original observation/eye, path and shield studies plus the logo-development board. Source symbols are presented as identity studies.                                                                                                                                          |
| Nudge — art direction                | Original dimensional tablet scene and App Store voice/upcoming campaign panels. The tablet scene is illustration, not a device capture.                                                                                                                                       |
| PushedWorld — characters and rewards | Original crew artwork, reward character and collection campaign; current native Path capture is separately identified.                                                                                                                                                        |
| aBeam — identity in motion           | The current blue ShaderOrb and quiet product link, using global motion preferences. The old square mark is not used as the current identity.                                                                                                                                  |
| CryptoCroc — character               | Original glider, treasure and complete brand poster from the recovered product source.                                                                                                                                                                                        |
| Next Player — archive                | Original controller-handoff and onboarding illustrations recovered from `/Volumes/codex-vault/Nextplayer`. Labelled archived native iOS work; opens its media gallery without inventing a case-study route.                                                                   |
| Lungsmaxing — archive                | Website outcome slider from `/Volumes/codex-vault/lungsmaxing-project/website`: estimated money kept and use moments avoided, using CAD $50 and five use moments weekly. Historical native captures remain in a separate gallery; the product name links to the real website. |

The editorial preparation manifest is `work/asset-audit/editorial-manifest.json`; its source mapping script is `work/asset-audit/prepare-editorial.cjs`. See the [portfolio asset audit](portfolio-asset-audit.md) for the cross-project inventory and archive provenance, and [Tracer](tracer-asset-sources.md), [Nudge](nudge-asset-sources.md) and [PushedWorld](world-asset-sources.md) for the original export history.

## View and motion behavior

Playground remains the default; the header can switch to the written List view. Explicit URL choices, browser-session preference and existing list-section/back links remain supported. The personal board contains the introduction, featured presentation, to-do, current work, clients and location.

Below it, equal-width CSS columns form a stationary vertical masonry layout with consistent gutters and varied card heights, from five columns on wide screens to one on phones. Each piece is rendered once. Filters change which pieces are visible. There are no horizontally travelling rows or repeated card groups.

Interaction and motion stay inside cards. The top four-project presentation keeps one fixed charcoal background, minimal product identity and no CTA footer. aBeam shows the complete original Explorer screenshot with no internal view switches. Featured projects advance after 7.8 seconds. Hover/focus, global pause, reduced motion and hidden/offscreen states stop automatic motion. The lower aBeam card also crossfades its separate captures every 6.8 seconds until manual selection; the masonry grid itself stays stationary. Ambient layers and inline recordings respect their documented visibility/pause rules; a deliberate local Play may start a recording under reduced motion, while global pause takes precedence. Native image dialogs support Escape, close/backdrop dismissal, keyboard image navigation and source captions.

Case Management uses three manually selected crops in a fixed 350px stage, with 44px controls and quiet connecting-dot decoration. Its decoration also pauses during inspection. The correct source is `jmramons-coder/case-management-platform`, pinned at `d58b51fa981664a533a8c9fe135a4254e952275f` and stored locally at `work/case-management-platform/`. Full captures use `/case-management-platform/`; homepage crops use `/showcase/case-management-platform/`. The unrelated `CM-Multicase_SANDBOX-EQ-JMR` source and earlier `/case-management/` media directory are superseded.

The `/case-management` page contains `CaseScreens` for native application captures and `CaseJourney` for a separate fictional buy-sell financial-review explanation. Company evidence is received; two partners' personal statements are missing and have no request rows yet. Prepare demo requirements creates exactly two local rows and a simulated AI Administrator receipt. The review and case remain open. This study does not connect to the source backend or make the assistant perform an order. See the [product analysis](case-management-product-analysis.md) and [capture-source record](case-management-asset-sources.md). The repository addition does not revise the existing 33,730-path drive inventory. Historical Equisoft films remain separate evidence; the requested repository study does not make them automatically public.

The simplified top PushedWorld presentation uses the current native Path capture and original Buster artwork. The lower product card retains `/showcase/world/prototype-loop.mp4`, a genuine early-prototype excerpt, with its historical disclosure. See the [mobile audit](mobile-showcase-audit.md) for rejected marketing composites and the verified recording source.

## Shakepay independent study

The earlier Rewards and Potential previews were retrieved October 22, 2026 from the already-public Ramon JM portfolio. Both source routes returned HTTP 200 and were visually inspected. The study and its allowlisted media routes have been public since September 26, 2026; see [the study's media notes](shakepay-private-study.md).

The study is independent work, not commissioned, endorsed by or affiliated with Shakepay. Existing brand/interface references belong to Shakepay. Current cards keep the disclosure visible and link to the existing `/shakepay` study. The expanded current source set and unchanged allowlisted-media restoration are documented in the [business audit](business-showcase-audit.md); its deployment guard remains in place.

## Historical static preview derivatives

This earlier set comprised 15 static WebP previews, about 587 KB combined when prepared. Sharp quality 88 preserved aspect ratio and avoided enlargement: phone screens at 384px wide, app/brand screens at 900–1000px and transparent illustration at 640px. These source mappings remain useful for the existing featured-presentation artwork and historical implementation; they do not describe the current 16-piece gallery. The earlier fifteen-piece production QA remains dated separately in the [portfolio audit](portfolio-asset-audit.md).

| Preview                                | Source                                         | Dimensions |
| -------------------------------------- | ---------------------------------------------- | ---------- |
| `/playground/nudge-home.webp`          | `/nudge/home.webp`                             | 384 × 835  |
| `/playground/nudge-household.webp`     | `/nudge/household.webp`                        | 384 × 834  |
| `/playground/nudge-timer.webp`         | `/nudge/timer.webp`                            | 384 × 834  |
| `/playground/world-path.webp`          | `/world/path-current.jpg`                      | 384 × 834  |
| `/playground/world-league.webp`        | `/world/league-current.jpg`                    | 384 × 834  |
| `/playground/world-session.webp`       | `/world/session-poster.jpg`                    | 384 × 683  |
| `/playground/shakepay-rewards.webp`    | `https://ramonjm.com/shakepay/media/rewards`   | 384 × 835  |
| `/playground/shakepay-potential.webp`  | `https://ramonjm.com/shakepay/media/potential` | 384 × 835  |
| `/playground/tracer-workspace.webp`    | `/tracer/app-workspace.webp`                   | 1000 × 447 |
| `/playground/tracer-campaign.webp`     | `/tracer/brand-campaign.webp`                  | 1000 × 667 |
| `/playground/tracer-identity.webp`     | `/tracer/brand-architecture.webp`              | 1000 × 525 |
| `/playground/abeam-explore.webp`       | `/abeam/explore.webp`                          | 900 × 600  |
| `/playground/decision-app.webp`        | `/equisoft-labs/app-screenshot.jpg`            | 900 × 625  |
| `/playground/decision-calculator.webp` | `/equisoft-labs/roi-calculator-hq.png`         | 640 × 640  |
| `/playground/cryptocroc-mascot.webp`   | `/crypto-inheritance/mascot.png`               | 640 × 640  |

The former project-card implementation in `app/project-previews.tsx` and `app/nudge-preview.tsx` is **historical**. Its Context/Explorer, Work/Identity and Legacy/Security mini-previews were replaced in the current grid by the showcase modules above. Retaining these files or `/playground` derivatives does not make them the active gallery architecture.

## Midjourney video artwork — October 24, 2026

User-provided `/Users/codex/Downloads/ZPDy5fRSOAFJuGCm.mp4`, copied unchanged to `/showcase/midjourney/june-19-2025.mp4`: 1080×1080, 24 fps, 5.208 seconds, video only. Poster extracted from the first frame. Full-frame, muted looping grid tile; expanded label is user-specified “Midjourney · June 19 2025”. Playback pauses offscreen, when the document is hidden, or under the global motion pause; reduced motion shows the poster until explicitly expanded. Native dialog supports X, outside click and Escape with focus restoration.

## Lungsmaxing artwork card — October 24, 2026

The Path scene and original Ember artwork now fill the entire card. A compact orange banner and glass control island retain the existing continuous 7–365 day illustrative calculator (CAD $50 and five use moments per week), with short saved/avoided labels. The slider remains a separate native input; clicking the surrounding art opens the same interactive composition in a native modal with zoom/return, blur, X, outside click and Escape. Slider state is shared with the grid and preserved on close. Baseline and estimate semantics remain accessible without the former long visible footer. The native-capture gallery was removed from this particular tile; original source assets remain available in the repository.

## CryptoCroc clean presentations — October 24, 2026

The primary card now shows only the complete 1100×820 original desktop captures, crossfading through Holdings, People and Practice every 3.8 seconds when visible, document-visible and motion-enabled. No character/planner toggle, caption or CTA surrounds it. Expansion retains the same captures, with only the original logo upper left and X upper right of the viewport. The separate artwork card shows the original glider on a pale background without added decorations or copy; its expanded gallery includes glider, treasure and original mascot artwork with previous/next controls. Source screenshots and illustrations are unchanged. Both support blur, zoom/return, outside click, Escape and focus restoration.

## Arcera Rise Daily launch — October 24, 2026

Added the original native launch preview from `/Volumes/CodexWorkspaceStorage/Codex-Offload-2026-10-23/2026-10-10/cre/outputs/Arcera-Sunrise/Arcera-sunrise-motion.mp4`. The accompanying README and native `ArceraLaunchView.swift` confirm this is the manual-entry painted sunrise opening with cloud layers, sun, birds and wordmark glint. Web derivative: 804×1748, H.264, 30 fps, 11.8667 seconds, silent, approximately 1.5 MB; the complete framing and timing are retained. Poster is a genuine frame at approximately two seconds. The clean tile loops while visible and motion-enabled, with expanded playback via the shared native dialog. PushedWorld’s App Store preview now fits within about 420px without cropping; Lungsmaxing is 400px tall. The gallery has 18 pieces after the prior Tracer product preview removal and this Arcera addition.

## Single featured aBeam sneak peek — October 24, 2026

The intro presentation now features only aBeam. Removed the carousel, its timer, other project media and picker/navigation controls. The existing Explorer capture is displayed at 90% of the panel width with its natural aspect ratio, rounded upper corners and a bottom mask; the upper interface rises from the lower panel edge as a deliberate sneak peek. The blue shader orb retains visibility, global-pause and reduced-motion behavior. The separate grid projects remain available.

### CryptoCroc manual navigation refinement

The desktop preview no longer advances automatically. Holdings, People and Practice tabs are available in the grid and expanded view; horizontal swipes also change the selected capture without wrapping at the ends. The expanded header includes the readable CryptoCroc name beside its logo. Captures keep their full original 1100×820 framing with `object-fit: contain` and a small inset; this does not invent content beyond the existing source captures.

### Arcera live artwork refinement

Replaced the launch video player with a web composition made from the original six transparent/opaque Arcera sunrise layers. These were converted to WebP without changing their artwork. CSS supplies continuous alternate cloud drift, sun breathing, lettering glow and animated gulls; no video or playback controls are mounted. The decorative artwork keeps its click-to-expand interaction and honors global pause and reduced motion. The source recording remains retained as historical media, but is no longer requested by this tile. Native entry-button UI is omitted from the decorative composition.

## Shakepay clean interaction gallery and launch film — October 24, 2026

The primary tile now shows only the native Rewards phone recording. Clicking expands a whole-phone gallery with the icon/name in the viewport’s upper left and X upper right. Horizontal swipes or Rewards/Potential/Profile controls select the recording; only the selected recording plays. Potential and Profile use original `outputs/x-article/assets/11-calculator-interaction.mp4` and `12-profile-to-rewards.mp4` from the September 19 Shakepay workspace on CodexWorkspaceStorage. These are independent fictional prototype recordings. The separate launch tile uses the final `outputs/promo-signed/Shakelab-Launch-English.mp4` (65s, 1080×1920), encoded to 720×1280 H.264 at 30fps, silent for muted portfolio autoplay. All 65 seconds and original framing are retained. Poster is a genuine source frame at three seconds. Launch loops while visible and motion-enabled; expansion uses the existing artwork zoom/return interaction. Current gallery count: 19 pieces, 9 product cards, 8 identity/art cards, 2 archive cards.

### Arcera recording restored

At the owner’s request, Arcera again uses the complete original 11.8667-second looping native launch recording rather than the CSS reconstruction, preserving the actual bird and cloud behavior. No playback bar is shown. Arcera, Midjourney, Tracer glass and the Shakepay launch artwork now place their close button outside the animated content panel, fixed in the viewport’s upper-right corner.

### Expanded-only video controls

Shakepay’s launch film now uses the same floating play/pause, restart, elapsed time and seek bar as Grok Safe, with a film-specific 9:16 frame that preserves its original composition. Both grid tiles hide playback controls; each expanded modal retains them. Playback position is preserved when moving between tile and modal.

## Portfolio entrance — October 24, 2026

New unqualified visits default to Playground, independent of a saved List preference; explicit `?view=list` and existing written-portfolio anchors remain supported. A brief 2.2-second decorative entrance presents the owner’s portrait/name, a subtle drifting dark aura, three section outlines, headline reveal and a shallow perspective settle. It runs once per session, skips direct section links and reduced-motion preferences, and never captures pointer input or delays data loading. Verified default grid, completed entrance removal, no replay on refresh, explicit List links, and reduced-motion mobile layout without horizontal overflow.

## Shared phone-frame sizing

All primary aBeam, Nudge, Grok Safe and Shakepay phone previews now share a 270px grid width, 32px corner radius, 2px dark border and common shadow through global `--mockup-phone-*` tokens. Their expanded sizing uses the same viewport limits. PushedWorld App Store panels use the same preview width and corner radius. Wide desktop captures and full-frame films retain their own aspect ratios. Browser measurements verified all four primary phone frames at exactly 270px wide with 32px corner radii.
