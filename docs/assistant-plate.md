# Engraved assistant key

The case workspace uses a Blender-rendered silver key instead of a CSS metal surface. The rounded billet, bevels and recessed chat/sparkle mark are real geometry. Procedural brushed aluminium and neutral studio strip lights provide the material and reflections.

- Generator: `scripts/render-assistant-plate.py`
- Editable scene and lossless masters: `outputs/assistant-plate/`
- Website images: `public/showcase/case/assistant-plate.webp` and `assistant-plate-hover.webp`

Run with Blender in background mode:

```sh
blender --background --python scripts/render-assistant-plate.py
```

Rendered with Blender 4.5.3 / Cycles at 1024px, 96 samples and denoising. The script also exports aligned 512px lossless WebP images with transparency. The brushing direction uses an explicit tangent to keep the milled face uniform.

The two images share their geometry, camera and framing. The hover render changes the studio reflection. The website crossfades between them and adds a neutral shadow with a slight lift. The button has no colored glow, artificial metal gradients or painted icon overlay. Reduced motion disables the lift and transition; the assistant interaction and tooltip remain native buttons and text.
