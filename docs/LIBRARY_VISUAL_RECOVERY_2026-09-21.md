# Library visual recovery — 21 September 2026

**Status:** execution plan, NOT visual acceptance. **Scope:** isolated `/phaser/` Pages preview on a feature branch; no automatic main/Yandex cutover. **Baseline:** `main@521f5ec9cb313bac5416badd88af75aceda79a46`. **Owner art:** commit [`Library` `223c843`](https://github.com/DanilaH/squishy-squishes/commit/223c84339c7700b0ae0d53749be86d13fb56f30f), seven source PNGs. Keep durable V3 saves, all library actions, and Studio unchanged.

## Observed defects (not assumptions)

- Current Hall mixes an independently reconstructed master wall/floor and newly drawn flat SVG props with a pedestal from the owner commit. `library-assets/sources.json` explicitly marks the original owner's PNG-derived `wall/floor/cabinet/shelf/plant.webp` as superseded. This is the wrong art lineage for the requested correction.
- `renderLibraryThumbnail` is a 256px Canvas2D image with a simple diagonal sheen; Studio squish is WebGL with material parameters, spatial light and deformation. The two presentations cannot be assumed to match.
- Real phone example shows a small, distant toy relative to a dominant podium, plus tiny line-art accessories. Current static Hall has no persistent idle state or meaningful save/paging transitions.
- Content quality (faces, stickers, accessories and per-shape placement) is **third**, not part of the first two gates. Do not disguise weak decor with light FX.

## Gate 0 — establish an honest baseline before edits

1. Pin the seven `Library` PNG source hashes/roles; verify which are actual in-scene images vs a reference/composite. Six known source-to-export mappings appear in `scripts/build-library-hall.mjs` and archived WebPs; validate PNG hash and actual source crop before switching runtime references. Do not infer an alpha sprite from a flattened mockup.
2. Archive screenshots from the deployed merged revision at empty/1/2 saved, page 1/page 2, 320×700, 390×844, 600×900, 768×1024, 1280×800, 1440×900, and 844×390. Record toy silhouette/podium ratio, toy baseline vs platform top, scroll/clipping/hit boxes, and asset import URLs. Keep reference screenshots clearly distinct from real browser output.
3. Record real per-material Studio captures for identical saved toy data; compare the same shape, paint and material rather than comparing unrelated screenshots.

**STOP** if the seventh source image or mapping is unclear; document it rather than silently selecting an alternate image. Historical aesthetic approval of other image variants is not permission to replace the `Library` commit.

## Gate 1 — source fidelity, toy presence, coherent volume

1. Restore Hall wall/floor/cabinet/shelf/plant from the verified owner-commit PNG exports, reuse the owner's pedestal. Remove the active hybrid imports and update `sources.json`/hash checks and source comments. Keep the old exports for rollback; do not delete art or change the non-Phaser entrypoint. Verify alpha/fringes, background continuity and responsive crops.
2. Measure and increase **visible toy silhouette** rather than enlarging only a padded 256×256 canvas. Preserve room for ears/other eventual accessories; anchor feet at the pedestal's actual top, not via a universal blind `translateY`. Tune podium/stand scale and positioning **together**; names/delete buttons and 44px tap targets must stay accessible. Empty stands must still fit.
3. Prototype a shared material presentation contract across Studio/WebGL and Library/Canvas2D: same base colors, normal-ish diffuse shading, soft shape-aware rim, bounded highlight and grounded contact shadow. Current Canvas gradient is not shader parity. Prefer a deterministic **static thumbnail render** with correctly mapped light response over N persistent Phaser/WebGL contexts. For material-specific exceptions (`jelly`, `chrome`, `holo`) verify actual color and translucency, not one universal white gloss; preserve the saved appearance under shading. Avoid changing Studio shader/physics as a shortcut.
4. Compare empty, undecorated and decorated toys on all six shapes; inspect pixel artifacts and top-accessory reserve at native 320px. Document which materials remain imperfect instead of claiming full parity.

**Gate 1 exit:** real side-by-side Studio/Library screenshots of the same toy; source-hash proof for every active image; 0/1/2 toy and page 2 screenshots; no visible clipping, floating or covered actions; responsive/interaction/SaveState tests green. A source-fidelity fix is NOT complete just because artwork filenames changed.

## Gate 2 — restrained, consistent scene feel

After Gate 1 visual review, preserve room/environment identity across page and state transitions. Add a tiny, asynchronous ambient layer that cannot intercept input; one semantic toy pose or save-arrival progress should drive bob/lean **and** highlight/contact shadow together. Stop idle during active interaction; animate an actual new save with a bounded arrival and settled presence; page changes receive a short bounded transition with no false asset re-creation, no camera shake, glitter spam or perpetual highlight sweep. Prefer composited CSS/Canvas animations and one shared update owner, with no extra per-card WebGL instances or uncontrolled RAFs. Respect `prefers-reduced-motion`, page visibility and game activity blockers. Signal 2000 is a reference for state ownership and hierarchy, **not** shader or neon preset reuse.

**Gate 2 exit:** 15–25s **real-browser video** capturing idle → save arrival → settled → page turn → return with two different toys, not a stitched mockup; compare 30s idle and repeated turns for stable positions/particle count; verify on portrait, desktop and short landscape, FPS/frame-time, memory/context count and no event leaks. A screenshot cannot validate feel. Device-in-hand testing and Yandex DRAFT are separate pending checks.

## Gate 3 — decorative content, only after Gates 1–2

Select one fully decorated benchmark toy in 320px Studio, Squeeze and the Hall. Replace low-quality face/sticker/accessory art coherently with actual alpha-clean authored assets and restrained forms; audit per-shape accessory anchors, side/top conflict zones and sticker exclusion/readability before expanding the catalog. Keep empty/old saved `decor` documents valid; retain compact V3 codec and IDs or explicitly migrate them without data loss. Do not redraw all categories or add new mechanics before the prototype passes the three scenes.

## Workflow / evidence / rollback

- Separate commits per gate and a **draft PR** based on current `main`; branch Pages output is **not** the public deploy. No merge until browser evidence and owner's visual review. Do not change main `/` or Yandex entrypoint in these passes.
- First pin baseline+assets, then change runtime imports and scale, then material prototype, then feel, then content. Run `npm run release:check`, `npm run qa:browser`, `npm run pages:qa`, and dedicated 11-viewport Library geometry/interaction QA on the exact head SHA. Record any unavailable command truthfully.
- Maintain a switchable previous Hall CSS/assets baseline for fast rollback. Recheck full V3 round-trip (create → save → reload → reopen → delete) and original Pages fallback when an image fails. No test-only fake saved skins or reduced motion thresholds to make tests pass.

## Independent adversarial review — corrections incorporated before implementation

1. **Wrong-source trap:** the accepted flattened master and later flat-SVG preview were previously mistaken for the owner's `Library` commit. Gate 0 now keys every runtime image to source file/hash; the seventh image is explicitly audited rather than assumed.
2. **Shader-overengineering trap:** mounting a live WebGL context per library toy violates mobile resource/maintenance expectations. Gate 1 requires evidence before considering GPU thumbnails and forbids renderer rewrites during art repair.
3. **Scale regression trap:** scaling a 256px canvas enlarges transparent padding and can bury a heart tip or block labels. Gate 1 measures actual silhouette/platform contact at the smallest viewport and accessory overhang, with responsive and pointer-hit checks.
4. **Animation-as-camouflage trap:** moving badly positioned toys/cheap decor makes defects more visible; feel is gated on accepted static composition, event state and 30s repeat budget.
5. **False-green trap:** prior 38/38 browser tests did not establish visual quality, the deployed hosted URL, real-device touch, Yandex or rights. This plan demands real visual/video evidence and calls remaining release gates out explicitly.
6. **Scope/compatibility trap:** content is deferred to third priority, with existing V3 IDs and saves intact through gates 1–2. A replacement art library is not permitted to mutate economy, sound, physics or authoring flows.

## 22 September addendum — resolution and volume benchmark (supersedes stale observations above)

**Owner feedback after the working parquet preview:** room approved; squishy still *flat and blurry*. The original observations above describe the starting point, not the current scene: original room art has been restored, the owner's new parquet is tiled in perspective, the saved-card bob has been removed, and a single demand-driven WebGL2 context already produces static snapshots using the real Studio shader. Do **not** restore old flat props, idle bob or the old floor. Preserve the owner's cabinet `top: 19%` and plant `top: 33%` in the current feature branch. Nothing in this addendum authorizes `main`, production Pages, or Yandex changes.

### Independently verified failure mechanisms

- **Raster resolution:** `libraryStudioThumbnail.ts` fixes its offscreen drawing buffer at 256×256 and `libraryThumbnail.ts` fixes the destination canvas at 256×256, while `libraryHallPolish.css` scales the visible canvas to 1.45–1.7×. The appearance texture is also 256×256. Upscaling can soften small eyes/stickers and edges; it does not prove that all perceived blur comes from this alone.
- **Form:** the shared Studio fragment shader uses gradients, shape-field edge/rim and highlights but does not represent explicit visible side thickness. A higher-resolution render by itself cannot fix that; a more convincing normal/height response might, or it might still read as a flat sticker. Do not claim a geometry model the code does not have.

### Ordered experiment and decision gate

1. In a Pages-only, query-gated visual lab, show the **same saved toy** at the **same final CSS dimensions**: current 256px Studio snapshot, a genuinely higher-resolution control, and an illuminated convex 2.5D prototype. Retain identical shape, paint, face, stickers, accessories and material; label any renderer/material differences explicitly. Include `soft-square`, `heart` and `paw`, a decorated toy and a plain one. This lab must not modify ordinary player saves.
2. For the higher-resolution control, the **actual source render and appearance/decor raster** must contain more pixels. Enlarging a 256px image into a 512px canvas is not a resolution fix. Check actual canvas backing dimensions, computed CSS dimensions and DPR, screenshot native pixels and inspect edge/detail crops. Clamp DPR for memory, reuse one GPU context, render on demand only.
3. For volume, derive a rounded normal/height response from the existing shape field, use a consistent upper-left light and an anchored contact shadow, and test a narrow visible sidewall only if the relief still looks flat. No per-card WebGL contexts, continuous RAF, cosmetic motion, or mass rewrite of the Studio shader/physics. Keep fallback and saved V3 shape/decor semantics.
4. Produce a real Chromium comparison screenshot at desktop and phone sizes, with source/render sizes and fallback status recorded. **Owner visual acceptance is required** before replacing the Hall renderer. If 2.5D fails the same-toy comparison, stop tuning gloss and prototype thickness; do not ship a full catalogue on a speculative effect.
5. Only after the chosen prototype reads convincingly, integrate it into the isolated Hall and rerun art hashes, `pages:qa`, release checks, save/reload/delete, responsive/accessory checks and 30-second idle. Do not imply CI is aesthetic acceptance or a real-phone GPU test.

**Independent adversarial review of this addendum:** A bigger canvas can still display a 256px source; SDF gradients can flatten at field saturation, create bright outlines at paw notches or obscure paint; duplicated accessory passes can shift anchors; an extra canvas per saved toy can recreate the prior mobile lag; adding a sidewall under decorated shapes risks wrong z-order; a prettier isolated synthetic toy can hide real V3 regression. Countermeasures: inspect backing resolutions, sample all three contours, compare identical V3 documents, reuse/destroy GPU resources, test clipping/order on real DOM cards, and require owner review before replacing the default. The lab is an experiment, not a release verdict.
