# Art-quality sample — 14 October 2026

First review batch for the owner's approved quality pass. Style acceptance is
pending; the remaining accessories, stickers and fillings are subsequent work.

The six pristine PNGs were generated specifically for this project with the
built-in OpenAI image_gen tool. The existing project bow and crown were supplied
as style references only and remain unchanged. No external asset pack or third
party source was introduced. Each `.source.json` retains its exact prompt,
source SHA-256, reference paths and preparation settings.

Runtime derivatives are in `public/assets/art-quality`. Accessories use 512px
canvases, stickers 384px and the heart filling 128px, according to their display
size. Prepare through `npm run asset:prepare` with preserved alpha; the default
WebP quality is 88 and AVIF quality 65. Keep an AVIF companion only when smaller
than its WebP fallback. Padding is 24px except the 128px filler, which uses 12px.
`src/sandbox/qualityArtManifest.json` records measured alpha crops and actual
companion availability. Re-measure crops after replacing any master.

All six images are startup-required: an existing saved toy or an immediately
accessible catalog can use any of them. Decode them inside the existing toy-art
preload boundary. On failure, retain the original procedural rendering and
allow retry at the next maker/library preload. Catalog icons and placed objects
share the same decoded source. No new save IDs or schema fields are introduced.

The sample replaces three of the seventeen previously code-drawn accessories
(headphones, butterfly, cherry), two of thirteen sticker designs (strawberry,
planet), and one of thirteen filling designs (hearts). Custom-colored procedural
heart stickers retain their established palette variants.
