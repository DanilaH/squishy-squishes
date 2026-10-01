# Squishy Squishes — agent contract

## Current product and entrypoints (1 October 2026)

Squishy Squishes is a freeform, touch-first squishy maker. Production Phaser cutover was merged in PR #59 (`1346f19`); PR #60 (`8be5103`) added Squeeze, first-paint and Studio-preload polish. Normal web and Yandex entrypoints now install the accepted Hall/Studio profile through `src/main.ts`, `reviewVisualProfile.ts` and `reviewMakerLoader.ts`. Despite their historical `experiments/review/preview` names, these modules are production dependencies.

Player path: `Library → New Squishy → Shape → Paint → Mix-ins → Mix → Decorate → Finish/Save → Squeeze`. Do not restore recipe/XP gating.

Phaser loads on maker intent, outside the initial Library JS path. It owns the visible WebGL2 renderer, frame loop and playfield input. Reuse `SquishSimulation`, original shape boundaries and the existing platform runtime; offscreen appearance baking and frame-coordinated 2D overlays remain. Preserve portrait-first responsive layout, transparent compositing and drop shadows. No forced rotation gate or second renderer.

Production retains `squishy.save.v3`. `/phaser/` review and Yandex DRAFT use separate storage namespaces. `?appearanceProbe=1` is an isolated diagnostic route, not the production visual profile. A local or CI Yandex DRAFT test does not establish hosted SDK/ads or real-phone acceptance.

## Current polish invariants

- Squeeze follows the pointer modestly; retain bounded whole-body travel and local tap/poke rebound.
- Draw volume sidewall backing before the front surface to avoid stretch stripes.
- Composite eyes/mouth/blush after body material lighting.
- The first Paint stroke must render before pointer-up, including live uncommitted appearance content.
- Normal Studio entry waits for decoded furniture. Genuine asset failure retains a usable fallback.
- Hall thumbnails are eager. Do not restore the obsolete `data-library-rendered` marker.

Start with `docs/README.md` and current code/tests. Historical migration plans describe the path to cutover, not an outstanding migration. `docs/IMPLEMENTATION_ROADMAP.md` and old recipe/dark-lab art documents are historical. Keep new fixes scoped to observed behavior; advanced appendage grabbing and source-art margin cleanup are deferred ideas, not release blockers.

## Non-negotiable runtime boundaries

- Strict TypeScript, Vite, one deformable WebGL2 renderer, a single parameterized shader and generic deformation; do not introduce React, per-shape physics or a second on-screen WebGL game. Production uses the lazy Phaser maker; the raw `SquishSurface` remains for diagnostic/legacy paths. Do not revert production to it.
- `src/game/shapes.ts` owns the canonical boundary used by hit testing, field, UV rendering and previews. Content remains free to create; optional Ideas never gate it.
- SaveState V3 and existing IDs/migration are durable. Library has 8 free slots and one optional rewarded expansion to 10. Do not alter save, reward or ad cadence for an infrastructure/asset task.
- `PlatformRuntime.activity` remains the sole source of aggregated blockers. New audio/input/loading code must respect it.
- Preserve the reviewed tactile constants and Finish-only disabled-canvas pointer passthrough; global `.sandbox-canvas.is-disabled { pointer-events: none }` breaks Paint/Decor.

## Shared-kit contract

Dependency: `@danilah/mini-games-kit` pinned to exact reviewed revision `797b5689767e9dc1059514e0446479e054bf1352`; do not track `main`. Start a kit review at `mini-games-kit/docs/API.md` and `docs/BOOTSTRAP.md` before adopting more exports.

`bootstrap/yandex-phaser` is mandatory **for new Phaser games** and the reference contract for this approved migration; it must not overwrite this nonempty repository. Keep existing platform, storage, activity, QA and deploy wiring until replacements pass behavioral equivalence. Document intentional deviations in `docs/PROJECT_DECISIONS.md`.

Use `npm run asset:prepare -- <source> <public/assets/name.webp> [options]` for *new authored transparent art* (not procedural squishy surfaces). Retain masters and source/licensing metadata; record AVIF availability explicitly. Read `docs/RUNTIME_ASSETS.md` before adding any art. The browser-safe image-format helper in `src/app/runtimeAssets.ts` is an opt-in asset-loading seam, **not** permission to fetch session-required UI art after Game Ready.

## Review and release

Create a feature branch and PR; independently inspect the diff. Run `npm run release:check` (includes asset smoke, strict TS, both builds and upload-root audit) and `npm run qa:browser`. Check EN/RU, portrait/short-landscape/desktop, outside-to-inside Paint, saved toy reload and Finish click-through. Merge only after passing PR gates; verify post-merge workflows and actual Pages deployment before claiming the new version is live. A browser QA pass does not replace the player's tactile phone acceptance.
