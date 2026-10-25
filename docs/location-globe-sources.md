# Location globe sources

The interactive globe in `app/location-globe.tsx` is drawn locally with Canvas 2D. It adds no mapping dependency, API key, runtime map request or visitor geolocation. Only the globe rotates; the card layout remains stationary.

## Geographic data

- [Natural Earth 1:110m land](https://www.naturalearthdata.com/downloads/110m-physical-vectors/110m-land/): real land polygons, including major islands. Retrieved October 24, 2026 from the [Natural Earth vector repository GeoJSON](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson). Original file SHA-256: `9e0729ee253ca7d7a5c4ae9395fb1902264c5377c52e224d13dd85010e2835d9`.
- [Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/): the map data is public domain and may be adapted for personal or commercial use.
- Quebec City marker: approximately **46.813819° N, 71.207997° W**, from the official Canadian Geographical Names Database’s **Québec / EHTWR** city record, [Natural Resources Canada](https://geogratis.gc.ca/services/geoname/en/geonames.html?q=Quebec&category=O). This is a city reference point, not a residence, office or live location.

## Local sampling and rendering

The source polygons were sampled offline using point-in-polygon tests, respecting polygon holes. A deterministic 9,000-point Fibonacci sphere uses `y = 1 − 2(i + 0.5)/9000`, latitude `asin(y)` and longitude `(i × π(3 − √5)) mod 2π − π`. The 2,594 land-point indices are embedded as a compact constant; the raw GeoJSON is not shipped to the browser. Continental silhouettes come from those geographic tests, not random dot patterns.

The renderer uses orthographic projection, depth shading and a projected city marker that disappears behind the globe when appropriate. Ambient rotation runs at about 30 frames per second and stops when paused, hovered, focused, dragged, offscreen, hidden or reduced motion is requested. The theme changes the globe palette without fetching new assets.

Drag horizontally to rotate; mouse dragging can also tilt. Vertical touch gestures remain available for page scrolling. Arrow keys rotate/tilt, Home resets, and visible west/reset/east buttons provide an alternative. Explicit controls work while ambient motion is paused. The canvas is decorative to assistive technology; its named interaction region and controls include keyboard instructions.

Targeted ESLint and isolated TypeScript checks passed for this component. Browser appearance and interaction should be checked in the integrated location card.
