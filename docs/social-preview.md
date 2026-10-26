# Portfolio identity and link preview

The browser icon and Apple touch icon use `public/profile/ramon.jpg`. The tab icon is circular; the Apple icon is opaque so the operating system can apply its own mask. The old generated R icon has been removed.

The homepage uses a versioned, static 1200 × 630 PNG for both Open Graph and Twitter cards. Its composition uses the current portrait, aBeam desktop and voice screens, Tracer glass identity artwork, Nudge App Store artwork, and PushedWorld App Store artwork. All are existing portfolio assets, with no invented product UI.

Regenerate it with:

```sh
node scripts/generate-social-preview.mjs
```

When publishing a revised card, update the output filename in the script and the matching `shareImage.url` in `app/layout.tsx`. A new image URL avoids reusing the previous image cache. Sharing services may still cache the page's old metadata until they crawl the link again.

The canonical and image origins are fixed to `https://www.ramonjm.com`, including when a crawler reaches a preview hostname. The Shakepay study keeps its own noindex metadata and empty preview images.
