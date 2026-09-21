# Private Shakepay study

`/shakepay` checks server-side access before rendering case-study content. Media stays outside public/ and is served only by an authenticated, no-store route. Search engines are instructed not to index the study.

Set STUDY_ACCESS_CODE to a long random invitation code and STUDY_SESSION_SECRET to an independent random secret in Vercel. Neither belongs in Git. Rotating the secret revokes all seven-day signed sessions. Missing configuration fails closed.

Place film.mp4 and potential.png in private-media/ when deploying via CLI. These branded assets are deliberately excluded from this public repository. A Git-only deployment needs those private assets injected securely before building; do not move them into public/.

The browser-native demo is pending Appetize setup. No fake demo button is displayed.

Validate unauthorized page and media access, incorrect code, correct code, video range requests, and logout before publishing. Native source is a separate private handoff.

The canonical source now lives in the portfolio repository. Production builds deliberately fail when private media is absent, preserving the last working deployment. Deploy from this workspace via Vercel CLI so private-media is uploaded outside the public repository. Never deploy an older workspace over this one.
