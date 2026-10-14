# Full authored catalog — 14 October 2026

The owner approved the first integrated sample and authorized completing all
remaining 14 accessories, 11 stickers and 12 fillings in the same style. Combined
with the first six sprites, this covers all 17 expanded accessories, 13 sticker
IDs and 13 filling IDs. The original five authored accessories remain unchanged.

The integrated review additionally found the sample headphones touching the
eyes. `headphones-v2.png` retains the approved materials with a wider earcup gap;
it supersedes the initial sample source for the unchanged `headphones` runtime
ID. The initial PNG remains available for provenance. The eyepatch's logical
focal offset is retained so its shield covers an eye instead of the nose.

Every pristine PNG is generated specifically for this project with the built-in
OpenAI image_gen tool. The original bow and approved butterfly are style
references only. `generation-plan.json` retains the exact final prompt set;
individual `.source.json` files retain source hashes and conversion settings.
No external art pack, third-party license or save-schema change is introduced.

Prepare each PNG with `npm run asset:prepare -- <master> <runtime.webp>
--canvas=<size> --padding=<padding> --background=preserve`. Accessories use
512px/24px, stickers 384px/24px and filling particles 128px/12px. Defaults are
WebP quality 88 and optional AVIF quality 65; keep only smaller AVIF companions.
Pristine PNGs stay outside the shipped public directory.

Run `node scripts/measure-quality-art.mjs` after conversion to record measured
ink crops, actual format availability and the left-piece roots for leaves and
wings. Their consumer reconstructs the existing 180×120 logical frame before
the unchanged paired-seat renderer separates, mirrors and attaches each piece.

All catalog and saved-toy art is startup-required and decoded through the shared
existing preload boundary. Existing procedural renderers remain error fallbacks.
Classic sticker color variants, per-particle variants, accessory recoloring,
mirroring, placement, scale and rotation continue using the existing save data.
