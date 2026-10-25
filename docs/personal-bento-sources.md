# Personal bento sources

Design reference: [Dann Petty](https://dannpetty.com/), observed October 24, 2026. The useful pattern is a personal profile beside a large presentation, supported by smaller interactive, location and client widgets. This portfolio adapts that hierarchy with a default dark palette, an optional light theme, existing project imagery and restrained motion; it does not reuse the reference’s personal content or assets.

## Verified content

- `app/portfolio-content.ts`: Ramon JM; senior product designer and AI-native builder; seven years across fintech and insurance; interests in architecture, industrial design and daily product/media experiments.
- `app/cv-drawer.tsx`: explicitly “Based in Quebec City”; current senior product designer at Equisoft, with AI committee experience. The clock uses `America/Toronto`, the timezone shared by Quebec City, and labels the display as local time.
- `app/page.tsx` and `app/cv-drawer.tsx`: four current/past collaborators—Equisoft, FolksHR, PetalMD and Peak Media. Equisoft is current; the others are earlier collaborations.
- `app/site-header.tsx`: existing public contact links are `mailto:jmanuelr.99@gmail.com` and `https://www.linkedin.com/in/jmanuelr`. No new availability claim or social account is inferred.
- The checklist in `app/personal-bento.tsx` is an interactive set of personal design reminders. Its checked states are a visitor interaction, not a product roadmap or evidence of completed work.

## Existing assets and behavior

- The profile no longer uses `public/portfolio-r-glass.png`. `ProfileCard` accepts an optional `portraitSrc` for a verified, user-supplied public portrait and renders it as a 72px circle with alt text “Ramon JM.” A portrait is still pending; until supplied, a restrained circle contains the initials RJ. It does not depict or claim to be a photograph. Missing or failed portrait images return to this initials fallback; no stock or generated face is substituted.
- `public/client-equisoft.svg`, `public/client-folks.svg`, `public/client-petalmd.svg` and `public/client-peak-wordmark.svg`: existing collaborator logos.
- `public/equisoft-ai-avatar.png`, `.webp` and `.mp4`: an illustrated headset avatar associated with AI work, not a personal portrait.
- Existing project assets supply the top featured presentation and the individual stationary work cards below it. `docs/playground-asset-sources.md` records the project preview sources and independent Shakepay study disclosure.
- `app/cv-drawer.tsx` supplies the existing CV interaction; no downloadable résumé file is claimed.
- Profile email copying only writes the already-public `jmanuelr.99@gmail.com` address to the clipboard after a visitor clicks Copy. A polite status reports success or failure; the existing mailto and LinkedIn links remain available.
- The Equisoft card uses native expandable details for the CV-verified domains: policy administration, customer relationships, digital insurance tools, case management, and agentic solutions/AI integrations. The expanded card links to the existing `/equisoft` practice page. It adds no client metrics or confidential product screenshots.
- Collaborator logos remain in a loop inside their own card. Original logos are native buttons that reveal descriptions taken from the existing CV/page: Equisoft senior product design across fintech/insurance/AI; FolksHR HR product design; PetalMD Quebec healthcare research; Peak Media museum experience design. The duplicate loop is decorative, hidden from assistive technology and pointer interaction. Hover/focus exposes static, scrollable originals for selection.
- To-do checkboxes remain visitor-controlled design reminders. Reset appears only while their states differ from the initial state, restores the original checks, announces the reset and returns keyboard focus to the first checkbox. No project goals or completion claims are introduced.
- The location card embeds `LocationGlobe`, supplied by the separate location component. It retains Quebec City, Canada and the Eastern-time clock; no home address or precise personal location is published.
- Reduced motion, the global motion toggle and hidden/offscreen states stop ambient logo/globe animation. The optional `TodoCard` paused prop also suppresses its check/progress transitions when supplied by the home composer.

## Theme and visual system

The October 24 refinement follows the reference’s black canvas, flat charcoal cards, faint borders, 20px card corners and desktop gutters, restrained shadows, 12px labels and 14px body copy. The top board retains the profile, large featured presentation, to-do, current work, clients and location. A separate project-only masonry grid sits below it, with equal-width columns, consistent gutters and varied card heights. Both sections collapse to a single column on phones. Project screenshots retain their original colors.

The home/list theme is selected with an accessible light/dark button and stored in the `portfolio-theme` preference cookie. The server reads this preference for the first render. Root CSS scopes the palette to the homepage, including the body-mounted CV drawer and contact menu; project case studies keep their own palettes.
