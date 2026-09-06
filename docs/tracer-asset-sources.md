# Tracer case study assets

Original file: https://www.figma.com/design/5jhsbkFmJZG902wf3so71F/Tracer---Ecosystem
Page: 03_Presentations. Exported through the signed-in Figma desktop app on 2026-09-06.

| Web asset | Figma selection | Original export |
| --- | --- | --- |
| public/tracer/brand-architecture.webp | Frame 6 — 1437:2 | 14400 × 7560 PNG |
| public/tracer/brand-guidelines.webp | Group 1777 — 1304:3 | 5953 × 1080 PNG |
| public/tracer/brand-campaign.webp | Campaign image — 1304:4 | 3896 × 2597 PNG |

Unmodified exports are retained in artifacts/tracer-originals locally. WebP copies preserve complete compositions and proportions; guidelines remain horizontally scrollable on small screens with a full-image link. Campaign artwork is presented as a concept, not evidence of an installed billboard.

## Live website embedding

Canonical site: https://tracersecurity.ca/
The site currently responds with `X-Frame-Options: SAMEORIGIN`, so the portfolio defaults to a working live-site link rather than an iframe that browsers will refuse to display.

Before setting `TRACER_EMBED_ENABLED=true` on the portfolio, deploy a narrowly scoped framing rule on the Tracer website and verify the live response. In the Tracer website's Next.js headers configuration, retain SAMEORIGIN on other routes and replace it on `/` with:

```js
{ key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://ramonjm.vercel.app" }
```

Merge this directive into any existing CSP rather than discarding other directives. Do not allow arbitrary origins or all vercel.app sites. Confirm `X-Frame-Options` is absent on `/`, the CSP explicitly permits the portfolio, and the actual embedded homepage renders before enabling the flag. Preview origins need their own explicit allowlist entry for iframe testing.

Prepared source change: https://github.com/jmramon-coder/tracer-website/pull/1 (draft). The connected Vercel account does not expose the project serving tracersecurity.ca; verify the source/deployment mapping before merging. Portfolio embedding remains disabled until the deployed policy is verified.
