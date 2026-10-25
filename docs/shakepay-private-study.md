# Shakepay study

The study and its allowlisted media routes are public as of September 26, 2026. No access code or session cookie is required. The independent-work and non-affiliation disclosures remain visible. Search indexing remains disabled.

Media remains in the legacy `private-media/` folder outside Git and is uploaded by the Vercel CLI. Deploy from this workspace; the build guard prevents incomplete deployments. Keep the media route allowlist and video range support intact.

## Portfolio presentation

The portfolio is grid-only. The Shakepay Rewards interaction tile opens a scrolling exploration over the blurred grid, with Rewards, Potential, and Profile recordings together, followed by the original study sequence. On narrow screens the three opening recordings form a horizontal scroll region. `/shakepay` remains available as the only standalone study; the other retired study URLs redirect to the grid.

`app/shakepay/study-content.tsx` shares the story between the standalone page and expanded tile. Expanded mode opens all supporting sections, starts the film muted, and respects the portfolio motion setting. The launch-video tile remains separate. Existing media allowlists, byte-range support, disclosures, and music credits are retained.
