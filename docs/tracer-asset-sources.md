# Tracer case study assets

Original file: https://www.figma.com/design/5jhsbkFmJZG902wf3so71F/Tracer---Ecosystem
Page: 03_Presentations. Exported through the signed-in Figma desktop app on 2026-09-06.

| Web asset                             | Figma selection         | Original export  |
| ------------------------------------- | ----------------------- | ---------------- |
| public/tracer/brand-architecture.webp | Frame 6 — 1437:2        | 14400 × 7560 PNG |
| public/tracer/brand-guidelines.webp   | Group 1777 — 1304:3     | 5953 × 1080 PNG  |
| public/tracer/brand-campaign.webp     | Campaign image — 1304:4 | 3896 × 2597 PNG  |

Unmodified exports are retained in artifacts/tracer-originals locally. WebP copies preserve composition proportions. Guidelines link to the full image. Campaign artwork is presented as a concept, not evidence of an installed billboard.

## Live website embedding

Canonical site: https://tracersecurity.ca/
The site currently responds with `X-Frame-Options: SAMEORIGIN`, so the portfolio defaults to a working live-site link rather than an iframe that browsers will refuse to display.

Before setting `TRACER_EMBED_ENABLED=true` on the portfolio, deploy a narrowly scoped framing rule on the Tracer website and verify the live response. In the Tracer website's Next.js headers configuration, retain SAMEORIGIN on other routes and replace it on `/` with:

```js
{ key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://ramonjm.vercel.app" }
```

Merge this directive into any existing CSP rather than discarding other directives. Do not allow arbitrary origins or all vercel.app sites. Confirm `X-Frame-Options` is absent on `/`, the CSP explicitly permits the portfolio, and the actual embedded homepage renders before enabling the flag. Preview origins need their own explicit allowlist entry for iframe testing.

Prepared source change: https://github.com/jmramon-coder/tracer-website/pull/1 (draft). The connected Vercel account does not expose the project serving tracersecurity.ca; verify the source/deployment mapping before merging. Portfolio embedding remains disabled until the deployed policy is verified.

## Expanded art direction — 2026-09-06

- `logo-development.webp`: a dedicated slice (1597:3) around the original logo rationale on 03_Presentations, exported at 4818 × 2892. Flattened onto the original dark canvas color. `mark-eye.webp`, `mark-path.webp`, and `mark-shield.webp` are crops of the original symbols from that export, not reconstructed marks. The board remains available in an expandable section.
- `landscape.webp`: original landscape layer 1305:507, 2627 × 2627. The hero layers this artwork with the existing glass-logo PNG, reflecting the glass + nature exploration in Figma.
- `app-workspace.webp`: screenshot layer 1545:2, “Screenshot 2026-05-30 at 9.55.29 PM 1”, originally 1921 × 933. The bottom 75 pixels containing the signed-in account footer were cropped before publication. The remaining interface is unchanged; screenshot findings are not independently verified claims.
- `website.webp`: actual browser capture of https://tracersecurity.ca/ on 2026-09-06, 1280 × 720, with optional cookies declined. This is explicitly presented as a capture linking to the live site; framing remains disabled.
- Inter is loaded for the case study, matching the Figma typography exploration. #1D54B5 and #2557A5 are source palette labels; supporting light and dark page colors are portfolio presentation choices.
- No new generated imagery was added. Original source files remain local in `artifacts/tracer-originals/`.
