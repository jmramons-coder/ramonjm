# Responsive portfolio audit

Verified locally on 25 October 2026 using the production build on port 3001.

- All 19 grid cards stay within the page at CSS widths 320, 390, 640, 767, 1024, 1440, 1680 and 1920; no page horizontal overflow.
- Lungsmaxing totals use the card's own width, including compact grid columns. Expanded landscape uses the available width and height rather than shrinking the whole preview; the drag handle and all three metrics remain visible.
- Tracer's wide logo construction diagram scrolls inside its own region instead of widening the gallery.
- Arcera and Riffle phone studies keep a readable size in short viewports; separated layers scale inside narrow stages.
- CryptoCroc's live iframe uses the mobile dialog height, with space reserved for its header and close control.
- Nudge, PushedWorld, aBeam and Grok Safe use a separate control rail in short landscape. Gallery padding uses the remaining viewport width so tracks do not extend beyond the dialog. Nudge's portrait media, navigation and App Store controls have separate rows.
- Profile action tooltips stay inside narrow columns; the mobile theme control and case-workspace close control have 44px targets. Safe-area offsets are included in the affected viewers.

Browser checks covered mobile grid and expanded Lungsmaxing, Tracer diagram containment, CryptoCroc iframe sizing, Arcera/Riffle layers, case task panel, Shakepay study, Nudge portrait/landscape, Grok Safe landscape, PushedWorld landscape and both aBeam formats. Existing horizontal screen carousels and desktop table scroll areas remain intentional.

Validation: production build and TypeScript pass; lint on changed TSX passes; git whitespace check passes. Proof and the viewport results are in `outputs/responsive-audit/`.

## Balanced project grid — 26 October 2026

The fixed desktop column breaks grouped the 19 tiles into columns of 3, 5, 3 and 8 at a 1422px viewport. The final column ended at 4109px while another ended at 1478px. Removing the forced breaks alone still kept several late projects together, so the gallery now uses measured CSS Grid row spans to place each next tile into the earliest available column.

A single ResizeObserver watches the grid and each card's natural inner height. CSS remains the source of the 640/980/1320/1680px column breakpoints. The same keyed components and DOM nodes stay mounted when resizing; mobile retains its original single-column order. Normal grid rows provide visible content and a stable first row before hydration. The measured mode has no layout animation. Used row sizes and floating-point card heights account for browser zoom, preventing accumulated subpixel rounding from shrinking the gutters.

At 1422px, the rebalanced grid is 2507px high and its column bottoms differ by 205px, compared with 2631px before. Next Player is now in the first column, Lungsmaxing in the second, and Shakepay's launch video in the third at that width; Arcera remains in the fourth. Project positions adapt to the available space.

Browser checks covered actual CSS widths 320, 390, 638, 640, 978, 980, 1318, 1320, 1678, 1680 and 1920. All 19 tiles were present with no overlaps or horizontal overflow. Vertical gutters measured 20–21px on desktop and 12–13px in compact layouts, including the browser's 90% zoom. Products, Identity & art, Archive and All work filters repacked correctly. Buster's rep count survived resizing through desktop, tablet and mobile. No console errors were observed. Build, TypeScript, scoped ESLint and whitespace checks passed. Measurements and proof captures are in `outputs/balanced-project-grid/`.
