# PushedWorld case study assets

Updated September 6, 2026. Original artwork retrieved from https://www.pushedworld.com/ and reused for the portfolio with the owner's authorization.

- `buster-top.webp`, `buster-middle.webp`, `buster-bottom.webp`: website `assets/media/buster-pushup-{top,middle,bottom}.png` (600 × 396).
- `buster-mentor.webp`: `assets/media/ugc-buster-conversation.png` (512 × 768).
- `path-world.webp`: `assets/media/path-current/stone-start.jpg` (665 × 1330).
- `community.webp`: `assets/media/pushedworld-community-huddle.jpg` (1600 × 971).
- Existing app screenshots, app icon, session recording, and setup guides remain the sources for app demonstrations.

New images are WebP conversions without enlargement. The page uses original artwork, HTML typography, complete app screens, and muted videos with explicit pause/play controls. Reduced-motion users receive paused video posters by default.

The live product website supports the described counting, Path, reward, character, optional Game Center, and privacy features. No customer testimonials or measured business outcomes have been added.

## App Store screenshot refinement

Source: [Nudge — App Store, pushed-world page](https://www.figma.com/design/8etcylN9MNgzBL1UiswfBK/Nudge-%E2%80%94-App-Store?node-id=0-1). Seven original PushedWorld frames, each 1320 × 2868.

Original headline sizes ranged from approximately 128 to 228 px, with inconsistent line heights and left margins. The Path headline had a 1522 px text box inside a 1320 px frame.

Refinements made in the original Figma file:
- Main headlines: 160 px with 100% line height and a shared 140 px left margin.
- Supporting copy: 88 px with 110% line height.
- Main top-aligned headlines begin at 160 px; supporting copy begins at 520 px.
- The longer Path headline uses a deliberate 144 px, three-line treatment beneath its eyebrow, within the same 1040 px safe width.
- The Hall of Fame panel retains its lower title placement above the podium while adopting the shared scale and left margin.
- The complete celebration illustration group moves down 140 px to clear the headline.
- Original copy, imagery, colors, and product content are retained.

Figma exported the section at 1× (10377 × 3804). Each panel was extracted losslessly using its actual Figma bounds, not a screen capture: x=[309,1743,3151,4574,5944,7314,8748], y=468, width=1320, height=2868. Full-resolution PNG exports are in artifacts/world-figma/exports. Portfolio WebP versions are 990 × 2151 at quality 92, displayed at a maximum card width of 290 CSS pixels.

The case study adds all seven panels in a keyboard-focusable, responsive scroll-snap gallery with descriptive alt text and links to larger versions.

## Homepage App Store gallery — October 24, 2026

The former character artwork tile now uses the original seven `public/world/store-*.webp` panels. The completed-set panel with the woman doing push-ups is the initial preview. Clicking expands the same panel with adjacent artwork visible; native horizontal scrolling, touch swipes, mouse-wheel scrolling, arrow keys, adjacent-panel clicks and pagination center each panel. Scale and opacity follow its distance from center. X, backdrop and Escape return the selected panel to the grid; reduced motion skips the zoom and scale effect. The live website at https://www.pushedworld.com/ was reviewed for presentation context; its existing portfolio App Store exports remain unchanged.

## Clean Buster interaction — October 24, 2026

Swapped the Shakepay product and Case Management registry positions. Replaced the older multi-section PushedWorld prototype card with one interactive Buster composition. The vivid blue gradient, three original push-up poses and phone-camera prop follow the live product website’s hero. `hero-phone.webp` derives from `https://www.pushedworld.com/assets/media/hero-phone-aligned-stage.png?v=20260731-hero-blue1` (1200×968 transparent source), resized to 1000px wide. One click plays top/middle/bottom/middle/top over 850ms and increments a local demo count. Global pause and reduced motion update the number without movement. No actual camera tracking or workout storage occurs. The old prototype video remains in the repository but no longer appears in this clean interactive tile.
