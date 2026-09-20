# Squishy Squishes — agent contract

## Current product and entrypoints (20 September 2026)

Squishy Squishes is a freeform, touch-first squishy maker, **not** the retired recipe/XP progression game. The S0–S6 sandbox and polish work are complete; later Phaser Pages, jelly UI and warm Studio changes have also been merged as **isolated preview work** (PRs #54 and #56). Do not confuse the `/phaser/` Pages preview with an approved replacement of the original production/Yandex entrypoints, and do not restore recipe-gated progression.

Player path: `Library → New Squishy → Shape → Paint → Mix-ins → Mix → Decorate → Finish/Save → Squeeze`.

Start with [`docs/README.md`](docs/README.md) to distinguish current source-of-truth documents from historical evidence. Read `docs/SANDBOX_PIVOT_01_MASTER_PLAN.md`, `docs/SANDBOX_PIVOT_01_ASSET_PLAN.md`, `docs/SANDBOX_PIVOT_S3_DECOR.md`, `docs/PROJECT_DECISIONS.md` and `docs/RUNTIME_ASSETS.md` as needed. `docs/IMPLEMENTATION_ROADMAP.md` is historical and its S5/S6 status labels are stale; do not use its timeline as the active backlog. The former dark-lab `docs/ART_DIRECTION.md` predates the accepted warm Studio environment and is **not** the current art reference. Use the actual approved Studio source/merged sprites and real-browser evidence for new art; never treat a generated presentation or a candidate PNG as a tested game asset. Historical recipe/XP documents are evidence only.

## Scoped Phaser migration authorization

The user approved migration of the **existing** game to Phaser 4 first, **without** changing its portrait-first responsive layout, graphics or gameplay as part of the engine cutover. Landscape redesign and a portrait rotation gate are separate future decisions. The reviewed roadmap is `docs/PHASER_LANDSCAPE_MIGRATION_PLAN.md` (filename historical). This authorization permits Phaser work in isolated migration/preview entrypoints; neither the old experimental PR #31 nor later merged preview art/UI automatically authorizes a production/Yandex cutover.

Required order: freeze regression fixtures and visual/interaction baselines; extract the single physics implementation while the old renderer still runs; build a separate Phaser candidate; port original GLSL/shape fields/appearance, gestures and full sandbox; validate saves, audio, analytics, ads and Yandex DRAFT; then cut over reversibly. Phaser owns the visible WebGL2 render context, scene frame loop and playfield input. Existing DOM Library/controls, portrait-first CSS, offscreen appearance baking and existing visible 2D decor layers may remain with explicit ownership; visible overlay updates must ultimately follow the Phaser frame, not an independent RAF. Preserve transparent compositing and drop shadows.

Do not copy the bootstrap's landscape-only viewport preset or portrait gate. Generate its reference into an empty temporary directory, compare and adopt kit contracts selectively, reuse **one** existing Yandex platform runtime and V3 repository. Do not merge #31 wholesale, add a second game renderer, duplicate physics, change save/ad semantics or treat browser emulation as proof of real-device touch. Prior to a production switch, verify the exact candidate on a real phone and hosted Yandex DRAFT; retain a rollback build that reads unchanged V3 data.

## Non-negotiable runtime boundaries

- Strict TypeScript, Vite, one deformable WebGL2 renderer, a single parameterized shader and generic deformation; do not introduce React, per-shape physics or a second on-screen WebGL game. On `main` before cutover, keep the existing raw `SquishSurface` and its entrypoint unchanged apart from independently gated refactors. Phaser integration is permitted only under the scoped migration workflow above.
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
