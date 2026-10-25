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
