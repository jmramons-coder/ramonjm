# Desktop project presentation

Updated 25 October 2026. Reference: [Dann Petty](https://dannpetty.com/) and his [Reframe screenshot tool](https://reframeit.io/), inspected in the browser.

The useful MetaFab pattern is a strong headline, a restrained scene gradient and a large desktop screen anchored near the lower edge. Reframe offers screenshot layouts and backgrounds. This implementation uses native HTML/CSS framing so it can retain the portfolio's actual product content and interactive expanded views. No reference artwork or code is copied.

## Grid

`DesktopProjectCard` provides a shared rounded card, short product introduction, subtle window chrome, oversized floating screen, scroll arrival and hover response. The preview deliberately crops at the card edge; opening shows the complete interface. All three cards retain the existing masonry column width and gutter. Previews remain fully visible with motion stopped, and use the portfolio's real light/dark theme selector.

- Case management: “Agent-first. Data in context.” The same local `CaseWorkspace` renders inside the screen, at a 1040 × 690 desktop layout. The preview is inert; opening retains the existing responsive workspace and contextual record tabs. No enterprise identity or source data is added.
- CryptoCroc: “Don’t let your crypto die with you.” The original 1100 × 820 Beneficiaries capture is used in the grid. The live iframe loads only after opening, avoiding a tiny interactive website inside the masonry card. The separate original-artwork gallery is unchanged.
- Decision ROI: “The cost of missing data.” Uses the original 1200 × 833 JPEG, avoiding another image conversion. The original source is soft; generated calculator artwork is not substituted as application UI. The expanded view identifies it as an original prototype capture.

## Live prototype availability

On 25 October 2026, `https://www.equisoftlabs.com/` redirected to `/lander` and displayed a GoDaddy domain auction. It is not used for the Decision ROI gallery. No working local original ROI frontend or higher resolution UI capture was found in the targeted source audit. The existing separate `/equisoft-labs` case-study page has not been changed by this presentation work.
