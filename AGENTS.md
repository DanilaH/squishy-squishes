# Squishy Squishes — agent contract

## Current product (16 September 2026)

This project is a freeform, touch-first squishy maker, **not** the retired recipe/XP progression game. The accepted S0–S6 sandbox plus two polish passes are merged; PR #29 is the baseline. The active product work is recognizable new shapes and a more toy-like UI, not new progression, economy or physics systems.

Player path: `Library → New Squishy → Shape → Paint → Mix-ins → Mix → Decorate → Finish/Save → Squeeze`.

Read `docs/SANDBOX_PIVOT_01_MASTER_PLAN.md`, `docs/SANDBOX_PIVOT_01_ASSET_PLAN.md`, `docs/SANDBOX_PIVOT_S3_DECOR.md`, `docs/IMPLEMENTATION_ROADMAP.md` (its S5/S6 status labels are historical), `docs/PROJECT_DECISIONS.md`, and `docs/RUNTIME_ASSETS.md`. Historical recipe/XP documents are evidence only; do not treat their instructions as active.

## Non-negotiable runtime boundaries

- Strict TypeScript, Vite, DOM/CSS interface and one raw WebGL2 `SquishSurface` with one parameterized shader and generic deformation. **Do not introduce Phaser**, React, another renderer or per-shape physics to adopt the kit's Phaser template.
- `src/game/shapes.ts` owns the canonical boundary used by hit testing, field, UV rendering and previews. Content remains free to create; optional Ideas never gate it.
- SaveState V3 and existing IDs/migration are durable. Library has 8 free slots and one optional rewarded expansion to 10. Do not alter save, reward or ad cadence for an infrastructure/asset task.
- `PlatformRuntime.activity` remains the sole source of aggregated blockers. New audio/input/loading code must respect it.
- Preserve the reviewed tactile constants and Finish-only disabled-canvas pointer passthrough; global `.sandbox-canvas.is-disabled { pointer-events: none }` breaks Paint/Decor.

## Shared-kit contract

Dependency: `@danilah/mini-games-kit` pinned to exact reviewed revision `797b5689767e9dc1059514e0446479e054bf1352`; do not track `main`. Start a kit review at `mini-games-kit/docs/API.md` and `docs/BOOTSTRAP.md` before adopting more exports.

`bootstrap/yandex-phaser` is mandatory **for new Phaser games**, not a migration instruction for this existing WebGL game. Keep existing platform, storage, activity, QA and deploy wiring. Adapt compatible infrastructure only and document intentional deviations in `docs/PROJECT_DECISIONS.md`.

Use `npm run asset:prepare -- <source> <public/assets/name.webp> [options]` for *new authored transparent art* (not procedural squishy surfaces). Retain masters and source/licensing metadata; record AVIF availability explicitly. Read `docs/RUNTIME_ASSETS.md` before adding any art. The browser-safe image-format helper in `src/app/runtimeAssets.ts` is an opt-in asset-loading seam, **not** permission to fetch session-required UI art after Game Ready.

## Review and release

Create a feature branch and PR; independently inspect the diff. Run `npm run release:check` (includes asset smoke, strict TS, both builds and upload-root audit) and `npm run qa:browser`. Check EN/RU, portrait/short-landscape/desktop, outside-to-inside Paint, saved toy reload and Finish click-through. Merge only after passing PR gates; verify post-merge workflows and actual Pages deployment before claiming the new version is live. A browser QA pass does not replace the player's tactile phone acceptance.
