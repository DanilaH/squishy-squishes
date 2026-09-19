# Squishy Squishes — Studio environment production v7

**Status:** implementation brief, not an approval of existing generated assets. **Goal:** a real responsive room assembled from seven compatible files, rather than seven individually generated pictures.

## Context and sources

- Work only on isolated Phaser Pages preview, starting from the UI candidate in draft PR #54; branch `feat/studio-environment-v1` is based on its head. Keep main/Yandex entrypoints, gameplay mechanics, save data, localization and interactions unchanged. Follow `AGENTS.md`.
- Owner-approved **artistic reference**: `wide_cozy_pastel_cartoon_illustration_of_a_cute.png`, RGB 1536×1024, SHA-256 `3dfe0ad333b3ec1cf14f9ce3d825231cc746790da64a43bca265912a696cf334`. This image is supplied in the *separate handoff bundle* as `reference/approved-studio-art.png` and **is not in this Git branch**. The executor must obtain it from the owner/bundle before the art-production gate. Do not guess its appearance or represent it as an editable source.
- The seven independently generated candidates in the handoff's `rejected-candidates/` are examples of failure, **not approved deliverables**. Especially, the desk left/middle/right use inconsistent constructions. Do not reuse them unchanged or claim they are seamlessly compatible.
- The v3 offline Shape/Paint composites and audit are diagnostic only; 1440×900 was a proxy, not a browser render. No successful live prototype or seam validation has been established.

## Production invariant

**First live layout proof, then one editable master scene, then the seven exports, then real browser QA.** Do not generate left/middle/right desk pieces independently or assert that a tile is seamless merely because its generated filename says so. Other helper layers, masks and procedural source files are allowed; the seven-file limit is for final game PNGs only.

## Gate 1 — live geometry proof (before drawing)

1. Start the actual existing `/phaser/` Pages UI from the #54 code. Capture Shape and Paint in a **real browser** at 320×700, 390×844, 1440×900; additionally examine 1280×800 and short landscape.
2. Use `getBoundingClientRect()` and actual canvas bounds to record title, stage, visible squishy, panel, cards, tools and primary CTA in `layout.json`. Do not infer coordinates from a concept illustration or use `top:60%` magic placement.
3. Insert temporary rectangle/outline placeholders for wall, floor, desk and two decor groups. Place the desk relative to the **visible squishy bottom** and the panel bounds. Preserve squishy position, controls, click/touch/drag/scroll and safe zones. Background must not intercept pointer events and stays underneath UI/canvas.
4. If a short mobile screen cannot accommodate the desk's legs, crop/hide the legs or simplify that presentation; do not shrink/move existing gameplay to fit decoration. On desktop reveal extra room at the sides, not a narrow portrait tube or a scaled-up mobile screenshot.

**Pass:** browser screenshots, geometry records and evidence that actual Shape and Paint remain usable. If not, stop and report concrete bounds/screenshots before making art.

## Gate 2 — one editable master / source-derived objects

Create `studio-scene-master.svg` or equivalent real layered Figma/Krita/Affinity source in a unified coordinate system, sRGB and palette. Separate layers: `wall`, `floor+baseboard`, `desk-left`, `desk-middle`, `desk-right`, `decor-left`, `decor-right`; additional source layers permitted.

**Wall:** calm cream surface only; no furniture, floor, baseboard, local window or plant cast shadows, posters or unique decoration embedded in the tile. Any subtle pattern must have exactly periodic horizontal edges. Optional broad lighting may be a non-repeating overlay (not an extra required PNG).

**Floor:** wood floor and exactly one lavender baseboard in this layer, repeatable along X. Use controlled horizontal plank rows or repeatable texture; do not bake central perspective, large unique knots or nonperiodic sunlight into the tile. Continue lower view with a compatible background color rather than repeating the entire room vertically.

**Desk:** take the **whole desk** in the approved room as a silhouette and palette reference. Trace/redraw/restore it as **one canonical object including both supports**, not three independent generated sources. Pick two vertical cut lines within truly straight portions, away from rounded ends, supports, braces and perspective side bevels. Align upper contour, tabletop thickness, lower apron, alpha profile and color on every cut. Export fixed left and right caps with respective legs; export a straight, legless, quiet-grain middle from the same source. Middle must repeat or 3-slice-stretch horizontally without a pattern or edge jump; never stretch caps, legs or depth. If the original perspective makes this impossible, redraw the entire desk more frontally as one object first.

**Decor:** one independently movable left/right group each. Only extract clearly visible objects; reconstruct obscured geometry in the master with controlled drawing, not an unjustified huge AI inpaint. Remove upper plants/lamp from mobile header safe zone; unify saturation, shadows, outline and size to canonical desk. Unique decor must never repeat across desktop width. Soft shadows belong in each RGBA object layer; remove halo/fringing.

**Pass:** editable source assembles as one room, no holes after toggling any layer, documented compatible desk cut sections. Do not proceed on mismatched caps.

## Exactly seven final game PNGs

| File | Content | Alpha | X behavior |
|---|---|---|---|
| `studio-wall.png` | clean wall only | opaque | repeat-x |
| `studio-floor.png` | floor + baseboard | opaque | repeat-x |
| `studio-desk-left.png` | left desk end + leg | RGBA | fixed cap |
| `studio-desk-middle.png` | straight top + apron, no legs | RGBA | repeat-x preferred, or controlled 3-slice stretch |
| `studio-desk-right.png` | right desk end + leg | RGBA | fixed cap |
| `studio-decor-left.png` | left unique group | RGBA | movable, no repeat |
| `studio-decor-right.png` | right unique group | RGBA | movable, no repeat |

All seven exported from the **same master** in sRGB and same scale factor. Derive output dimensions from Gate 1 display sizes and required DPR; don't invent asset dimensions before layout measurement. Minimize transparent padding, preserve correct edge RGB for filtered alpha. Additional `sources.json` (provenance, SHA-256, rights, state, size/mode), `layout.json`, scripts, previews and tests do **not** count as game PNGs.

## Gate 3 — objective technical and real-browser acceptance

- Decode all seven PNGs and verify alpha is truly present for the five foreground files, backgrounds opaque. Inspect transparent-edge fringing against cream, lavender and dark checker backgrounds.
- Tile wall and floor 3× horizontally and compare first/last columns throughout height. For final pixel export, per-channel edge delta must be <=2 sRGB levels except explicitly documented AA; compare profiles and render actual browser 3×3 repeat as well. Exact pixel match alone is not proof against fractional-scale GPU seams.
- Compose desk `left + 1×middle + right` and `left + 4×middle + right`; match edge alpha/RGB, tabletop contour, apron thickness, wood grain and leg geometry. Verify at DPR 1 and 2 under fractional CSS scaling.
- Integrate only in isolated Phaser Pages preview on a new draft PR; use CSS repeat-x or Phaser 4.2.1 `TileSprite` where appropriate; use horizontal three-part desk instead of vertically stretching the whole object. Background below existing canvas/UI, pointer-events none. Asset decode failure must fall back to existing pastel gradient without breaking controls. Preload only selected assets and report transfer size.
- Get **genuine browser** Shape/Paint screenshots at 320×700, 390×844, 1440×900 (six minimum), plus 1280×800/short landscape. Test touch/click/drag/scroll/resize; title, squishy, card tray, paint tools and CTA may not be obscured, and unique decor may not repeat.
- Run applicable typecheck/build/Playwright suites and report what actually ran; do not make up CI or screenshots. No merge without owner's visual sign-off.

**Deliverable:** `studio-assets-v1.zip` containing exactly seven finished game PNGs plus editable master, `sources.json`, `layout.json`, reproducible build/validation scripts, alpha/seam report and previews, six real browser screenshots, draft PR and CI links. The full v7 handoff bundle provided separately includes previous audit and image reference.

**STOP conditions:** If reference isn't available, Gate 1 can proceed but Gate 2 cannot. If desk cannot be made geometrically compatible or cannot fit the 320×700 UI, produce exact screenshot and change the canonical desk/layout—not another randomly generated set of three. Never label the previous rejected PNGs as final or merge to main.