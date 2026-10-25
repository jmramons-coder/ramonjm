# Riffle river transfer study

Replaces the earlier Stillwater photo-led study within Arcera's expanded anatomy. Portfolio-only concept. The interface, fish mark, lettering, parallax, cloud drift, depth separation and entry/journal handoff are coded. This is a layered 2.5D composition, not a realtime 3D scene.

Generated with the built-in image_gen tool, one call per asset, then saved as 1000px WebP derivatives while preserving alpha:

- `public/showcase/arcera/river-world.webp` — opaque background plate; original `exec-a5ff4d2e-6507-4857-b4a4-21cad59517f9.png`.
- `public/showcase/arcera/river-foreground.webp` — transparent pine/stone framing plate; original `exec-13222c36-90ab-4c80-90cd-ac2f50374108.png`.
- `public/showcase/arcera/river-clouds.webp` — transparent cloud/mist plate; original `exec-b1466669-485d-41da-86ce-a87efae26cc9.png`.

All originals remain in `/Users/codex/.codex/generated_images/01a15fa0-ee7f-7e51-a86f-ea36a7d2da7c/`. The earlier `fishing-dawn.webp` is preserved but no longer rendered.

## Exact prompts

### River world

Use case: stylized-concept. Asset type: portrait 2:3 layered mobile fishing app scene, background plate. Primary request: a richly dimensional art-directed river world at sunrise, with a split-level view showing both the world above water and clear underwater river depth. Style: premium tactile 3D illustration with sculptural rounded forms, vivid luminous color and polished game-opening art, NOT photography. Composition: river winds from a distant misty forest into foreground. Waterline around lower half; below it, beautiful jade/turquoise water, smooth sculpted river stones, light rays and a few small elegant fish silhouettes. Above: layered pine woods, distant rocky riverbanks, warm peach sunrise, pale lilac-blue sky and sculptural pearl clouds. Keep the central upper third calm and uncluttered for a coded app wordmark, lower centre legible for a coded entry button. Perspective and depth: distant world soft, middle river crisp, underwater foreground close and immersive. Palette: deep ink teal, bright mineral turquoise, moss green, warm coral/amber light, pearl clouds. Constraints: no people, rods, text, typography, logo, UI, device frame, border or watermark. The scene must feel like an inviting 3D miniature world, not a flat photo or a poster collage. One cohesive full-bleed portrait environment.

### Foreground

Use case: stylized-concept. Asset type: genuinely transparent portrait 2:3 foreground layer for a vivid 3D illustrated fishing app river scene. Primary request: a near-camera framing layer of lush sculptural pine branches and a few smooth mossy river stones. Premium tactile miniature-world 3D illustration, rounded sculptural forms, luminous teal and moss greens with warm coral sunrise rim light. Composition: foliage enters ONLY from upper left and upper right corners and the outermost side edges; a few small stones and fern fronds enter the bottom left and bottom right corners. The entire central 70 percent must remain EMPTY TRANSPARENT so a river background and app typography can show through. Floating cutout foreground elements, cohesive light from upper centre/right. Do not paint a river, sky, clouds, full forest, landscape background or ground plane. No text, logo, UI, phone frame, border or watermark. Actual alpha transparency around and between every foreground object. Keep the visual weight in the corners, like foreground scenery in a layered pop-up book.

### Clouds

Use case: stylized-concept. Asset type: genuinely transparent portrait 2:3 atmosphere layer for an illustrated 3D river-world fishing app. Primary request: sculptural pearl clouds and delicate river mist as separate floating cutouts, no landscape. Premium polished tactile 3D miniature-world style, softly rounded cloud volumes, cool lavender-blue shadows with warm coral and pale gold sunrise rims. Composition: thin clusters of clouds across the top 15 percent, with clear empty transparent centre; one very delicate wispy horizontal mist bank across the lower-middle around 57 percent of image height. Keep most of the canvas transparent. No trees, sun, water, land, ground, text, logo, UI, phone frame or watermark. Actual alpha transparency, not a colored or checkerboard backdrop. Light, airy and restrained enough to layer above a vivid turquoise river landscape and behind readable app branding.

## Refined controls and fish emblem

The journal handoff was removed at the user's request. The primary button now gives a brief visual shake only; it does not navigate or change content. Both Riffle and Arcera use local layer icon buttons with tooltips and continuous depth sliders. River separation uses the same 52° X / −27° Z orientation as Arcera; Arcera's default plane dimensions increased from 200×435 to 240×522.

New generated emblem: `public/showcase/arcera/riffle-fish.webp`, using the built-in image_gen tool with transparent background. Original preserved at `/Users/codex/.codex/generated_images/01a15fa0-ee7f-7e51-a86f-ea36a7d2da7c/exec-b6f9a308-6278-43de-a7aa-48fd7190b600.png`.

Exact prompt:

> Use case: logo-brand. Asset type: one isolated premium fish emblem for the Riffle fishing-app welcome screen, actual transparent background. Primary request: a clean, beautifully proportioned stylized river trout icon seen in profile, flowing gently to the right. Minimal sculptural relief, smooth continuous silhouette, subtle carved fin and gill detail, one small eye, refined balanced tail, polished warm ivory material with restrained pale gold edge light and cool teal shaded underside. Modern outdoor brand mark, readable at 44 pixels, simple and elegant rather than cartoonish or photoreal. Composition: one fish centered, landscape 3:2 emblem footprint within square canvas, generous transparent padding. Constraints: no scene, water, splashes, circles, badge, fishing hook, lettering, wordmark, text, border or watermark. True alpha transparency, not a colored background.

## Living environment pass

The lower river is composited a second time through a localized SVG displacement filter, updated at a maximum of 25 Hz while visible and motion-enabled. Procedural light glints drift across the water. The transparent foreground is split with CSS masks so upper pine branches sway while bottom rocks stay fixed. Cloud drift remains separate. Reduced Motion stops these effects; the water update also pauses offscreen or when the document is hidden. Fish are still part of the base artwork and are not independently animated.
