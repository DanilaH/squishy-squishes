# Library squishy volume and resolution — independent review, 22 September 2026

Scope: **draft PR #59 Phaser Pages only**. The production root `/`, production `/phaser/`, the Yandex entrypoint, Studio physics, and saved V3 schema remain out of scope. This record extends `LIBRARY_VISUAL_RECOVERY_2026-09-21.md` and records decisions rather than declaring final aesthetic acceptance.

## Direct browser evidence already reviewed

- Four render paths of the exact same decorated sample, at the same CSS display size, were captured for `soft-square`, `heart`, and `paw` in [four-way Hall browser QA run 35699204449](https://github.com/DanilaH/squishy-squishes/actions/runs/35699204449). Captures are in its `library-hall-real-browser-review` artifact.
- 256px real Studio shader: material reads coherently, but the CSS enlargement softens the small face and stickers.
- 512px simplified flat control: facial detail and contour are crisper, but its lighting and materials are **not** Studio shader parity. Do not ship it as a replacement for all six materials.
- 512px SDF relief: deliberately reduced first-pass clipping and harsh edges; heart cleavage and paw finger lighting still read as manufactured normal-map effects, not reliably inflated mass.
- 512px pseudo-extrusion: a distinct right/down silhouette is visible, but in the real screenshots it reads like a displaced biscuit or cardboard backing. This is **not accepted as real squishy depth**. Do not change the Hall to this variant.

## Actual implementation follow-up: preserve shader, increase raster resolution

- Use the **existing real Studio material shader** at a 512×512 offscreen drawing buffer. It remains one demand-driven WebGL2 context, not one GPU instance per toy or a RAF loop.
- Render authoring-coordinate 256px saved V3 paint, face, stickers and accessories into 512px backing canvases via a 2× Canvas2D transform. Scale the destination context, not an already rasterized 256px image. Keep the exact existing material uniforms and visual identity for all six materials.
- The 256px control remains available only to the explicit `?volume-probe=1` comparison. Non-Pages/Yandex thumbnails remain 256×256.
- Verify 256 vs 512 *true Studio shader* on a phone and desktop with an actual saved and decorated V3 toy; check all six materials, empty/fallback WebGL, page turns, image orientation, grounding, accessories and shadow; watch GPU-context count and 30s idle stress. A larger file is not proof of better aesthetics.

## Decision gate / rollback

Only the sharper genuine shader is eligible for Hall rollout at this stage. Relief and pseudo-extrusion stay isolated to the query-only visual lab until a new geometry or material prototype clearly beats the current Hall across shapes without a displaced-layer look. If the 512px version has regressions in decor, performance, browser fallback, or Studio material parity, revert the Pages resolution change before release. Owner aesthetic approval and real-device checks are still pending; do not merge PR #59 on CI success alone.
