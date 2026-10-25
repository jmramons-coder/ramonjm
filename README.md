# Ramon JM — Portfolio

A Next.js portfolio for product design, development and visual identity. The homepage is grid-only, with a dark default theme and an optional light theme. The theme preference is stored in a cookie. The former List view is retired.

## Homepage

The introduction contains the profile, a fixed aBeam presentation, personal milestones, current work, clients and Quebec City location. The profile includes the owner-provided portrait, email-copy and LinkedIn controls, and a CV drawer.

The stationary masonry gallery contains **19 cards**:

- **9 products:** aBeam, Nudge, Contextual workflows, CryptoCroc, Shakepay Rewards, PushedWorld's interactive Buster, Decision ROI, Grok Safe and Arcera Rise Daily.
- **8 identity and art cards:** Nudge stickers, Tracer identity, Decision ROI artwork, PushedWorld App Store screens, CryptoCroc artwork, aBeam identity, Midjourney video artwork and the Shakepay launch film.
- **2 archive cards:** Next Player and Lungsmaxing.

All work, Products, Identity & art and Archive filters select the cards. Equal-width columns adapt from five on wide screens to one on phones. Motion happens inside the cards; the grid itself does not scroll horizontally. Expanded galleries use the blurred portfolio as their backdrop, with screen-level close controls and keyboard dismissal.

aBeam uses actual desktop and mobile application captures, including the native voice-session interface with fictional demonstration content. Its grid card layers the mobile screen over a desktop view; the expanded gallery has separate Desktop and Mobile formats. The featured aBeam section is fixed, without a project carousel. The screenshots do not perform live searches or bookings.

Contextual workflows is an agnostic, fictional, browser-local case-workspace study. Its tables, tasks, requirements, documents and contextual assistant demonstrate retained object navigation. No source application, customer record, live model or backend is connected. The original branded case-management frontend is not presented as the portfolio study.

Shakepay Rewards opens three native prototype recordings—Rewards, Potential and Profile—together above the full exploration. On phones the recordings scroll horizontally. The original study sequence continues below them, including the film, opportunity, prototype walkthroughs and process. Independent-work disclosures and film credits remain visible. The launch-film card is separate.

Other cards include Nudge's recording and App Store gallery, Buster's local rep interaction, PushedWorld screens, Tracer's identity exploration, CryptoCroc's live website iframe, Decision ROI captures, layered Arcera/Riffle explorations and Lungsmaxing's illustrative outcome calculator. Grok Safe is an independent anti-scam concept; its recorded scenario does not connect to X or Grok. Media controls appear in expanded players where applicable.

Autoplay and ambient motion respect reduced-motion preferences, viewport visibility and hidden tabs. There is no header motion control. Intentional gallery and demo controls remain available.

`/shakepay` is the only retained standalone case study. The retired `/abeam`, `/nudge`, `/world`, `/tracer`, `/crypto-inheritance`, `/equisoft-labs`, `/case-management` and `/case-workspace` study routes redirect to the project grid. Legacy List query parameters do not enable the former view.

## Local development

Requires **Node.js 22.13 or newer**.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For the existing portfolio preview port:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3001
```

```bash
npm run lint
npx tsc --noEmit
```

## Production

```bash
npm run build
npm start
```

Stop an existing production preview before rebuilding its `.next` output, then restart it after the build.

The public Shakepay study uses the legacy, Git-ignored `private-media/` directory. Its media is intentionally served through an allowlisted route with video byte-range support. Deploy from the portfolio workspace with the verified media included; a Git-only checkout does not contain it. The Vercel build guard prevents deployment when the film is missing. Preserve the media allowlist, range support, independent-study disclosures and music credits. See [Shakepay media requirements](docs/shakepay-private-study.md).

## Component map

| Files | Responsibility |
| --- | --- |
| `app/page.tsx`, `app/home-view.tsx` | Server theme preference and grid-only homepage composition. |
| `app/site-header.tsx`, `app/cv-drawer.tsx` | Header and CV, including Independent projects. |
| `app/personal-bento.tsx`, `app/location-globe.tsx` | Profile, milestones, employment, clients and location. |
| `app/featured-presentation.tsx` | Fixed aBeam presentation above the grid. |
| `app/project-playground.tsx` | Nineteen-card registry and category filters. |
| `app/desktop-project-card.tsx` | Shared desktop-card framing and device movement. |
| `app/abeam-mobile-showcase.tsx` | Layered desktop/mobile aBeam card and native screenshot galleries. |
| `app/nudge-phone-showcase.tsx`, `app/nudge-store-gallery.tsx` | Nudge recording and App Store screenshots. |
| `app/case-workspace-showcase.tsx`, `app/case-context-tabs.tsx`, `app/case-panel-stack.ts` | Fictional case workspace and retained contextual object navigation. |
| `app/case-assistant-chat.tsx`, `app/case-panel-resize.tsx` | Local example assistant and resizable side panel. |
| `app/shakepay-clean-showcase.tsx`, `app/shakepay/study-content.tsx` | Three opening interactions and shared expanded/standalone study content. |
| `app/shakepay-launch-showcase.tsx` | Separate Shakepay launch-video card. |
| `app/grok-safe-showcase.tsx`, `app/grok-safe-scenario.tsx` | Grok Safe concept and recorded scenario player. |
| `app/buster-showcase.tsx`, `app/world-store-showcase.tsx` | Buster rep interaction and PushedWorld App Store gallery. |
| `app/crypto-clean-showcase.tsx`, `app/decision-art-showcase.tsx` | CryptoCroc desktop/artwork views and Decision ROI capture/artwork viewers. |
| `app/tracer-glass-showcase.tsx`, `app/tracer-process-showcase.tsx` | Tracer identity gallery, individual logo elements and interactive color swatches. |
| `app/arcera-loading-showcase.tsx`, `app/arcera-exploration.tsx` | Arcera video and layered Arcera/Riffle studies. |
| `app/nudge-stickers.tsx`, `app/midjourney-showcase.tsx`, `app/next-player-showcase.tsx`, `app/lungs-showcase.tsx` | Stickers, video artwork, Next Player artwork and Lungsmaxing calculator. |
| `public/showcase/` | Curated artwork, captures, posters and short recordings. |

The application uses Next.js 16, React 19 and TypeScript. Scoped CSS, native dialogs, browser animation APIs and local CSS/WebGL provide the interactions without a separate motion library.

## Sources and maintenance

Current implementation notes: [responsive audit](docs/responsive-audit.md), [aBeam native captures](docs/abeam-interactive-preview.md), [desktop framing](docs/desktop-project-framing.md), [contextual workflows](docs/case-workspace-concept.md), [Tracer identity sources](docs/tracer-gallery-sources.md), [Lungsmaxing sources](docs/lungsmaxing-showcase-sources.md) and [Shakepay media](docs/shakepay-private-study.md).

The [portfolio asset audit](docs/portfolio-asset-audit.md) records source discovery and provenance. Older audit sections describe earlier iterations and are not the current card registry. Keep native captures intact, fictional examples labelled and artwork distinct from actual product screens. Working checkouts, raw capture outputs, credentials and confidential enterprise material do not belong in the deployed public assets.
