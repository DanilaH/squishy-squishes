# Studio v8 — integrated asset set (draft)

The **seven** PNGs in this directory are used by the isolated `/phaser/` Pages preview on `feat/studio-environment-v1` (draft PR #56, based on draft UI PR #54). This is no longer an upload inbox. `main`, Yandex entrypoints, mechanics and saves remain untouched.

- `studio-wall.png` — horizontally tiled cream wall.
- `studio-floor.png` — horizontally tiled wooden floor with lavender baseboard.
- `studio-desk-left.png`, `studio-desk-middle.png`, `studio-desk-right.png` — source cuts of one canonical desk. At startup the preview decodes all three, draws them at **integer source-pixel positions** on a temporary, non-DOM 1237×435 Canvas2D, and displays the resulting PNG as **one image**. It does not mount three independently scaled layers: their CSS/GPU boundaries caused visible vertical seams. The present 421:435:381 aspect ratio does not require repetition of the middle.
- `studio-decor-left.png`, `studio-decor-right.png` — one non-repeating prop group per side.

`studioEnvironmentPreview.ts` predecodes all seven files before mounting passive Shape/Paint layers. Decode or desk-composition failure leaves the original UI in place. On desktop the tabletop is allowed behind the controls beyond the stage clipping boundary, while the original desk's purple legs are cropped at the wooden apron to avoid intrusive fragments; side props retain their own stage clipping. On narrow phones the complete miniature side vignettes are grounded at the stage's lower edges. The desk stays hidden on short landscape. No gameplay canvas, controls, saves, or source PNG files are moved or modified.

The [Studio integration Actions workflow](https://github.com/DanilaH/squishy-squishes/actions/workflows/studio-environment-integration.yml) checks TypeScript/Pages build, 1280×800 substantive tabletop depth, phone prop alignment, input and resize, missing-asset fallback, full Pages gameplay flow, and publishes actual Chromium screenshots and a source/build review bundle. Pixel-perfect visual quality on a physical phone is **not** certified by CI.

**Not production-approved:** the simplified desk and decor still need the owner's visual sign-off, and a real-phone check is outstanding. The source OpenRaster master, build scripts, seam/alpha audit and detailed provenance are in the separately delivered `squishy-studio-v8-candidate.zip`. The decor was adapted from earlier AI-generated candidates rather than cut from the approved flattened reference. Do not merge PR #56 or present this as a commercial-release asset pack before rights/provenance and visual approval are resolved.
