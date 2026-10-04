# Cozy workshop tabletop traces — 4 October 2026

Original SVG masters authored in this repository for Squishy Squishes; no external
pack or third-party artwork. Keep editable SVGs, not just encoded cutouts.
The palette follows the accepted cream/peach/lavender workshop, mint accents and
pink puffy bow. The little dumpling drawing is a trace of making toys, not a new
background character. Cat furniture, floor and desk remain the accepted masters.

Prepared with the pinned kit pipeline:

```
npm run asset:prepare -- assets-src/cozy-workshop/sketch.svg public/assets/room/cozy-sketch.webp --canvas=256 --padding=16 --webp-only
npm run asset:prepare -- assets-src/cozy-workshop/ribbon.svg public/assets/room/cozy-ribbon.webp --canvas=256 --padding=16 --webp-only
```

Both runtime files are 256×256 alpha WebP; AVIF companions intentionally absent.
Encoded bytes: sketch 7,942; ribbon 8,550. Combined decoded RGBA proxy: 524,288
bytes. Maximum display size 76 CSS px, giving headroom at phone DPR 2–3. They are
session-required and decoded together with Studio furniture before maker entry;
the existing retry/fallback policy covers failures. URLs use Vite BASE_URL for
Pages and Yandex. The mat and window light are CSS, not new downloaded artwork.
