# Squishy Squishes

A compact, touch-first freeform squishy maker for Yandex Games. [Play the GitHub Pages build](https://danilah.github.io/squishy-squishes/).

**Current production:** freeform sandbox with the accepted Library Hall, warm Studio and lazy Phaser 4 maker (PR #59), followed by Squeeze, first-paint and furniture-preload polish (PR #60). Production web/Yandex retain Save V3; `/phaser/` review and Yandex DRAFT are isolated test entrypoints. Modules under `src/experiments/phaser/` include production dependencies despite their historical names.

`Library → New Squishy → Shape → Paint → Mix-ins → Mix → Decorate → Finish/Save → Squeeze`

- Six freely available shapes and six materials; mix-ins, paint and surface/head decor.
- One deformable WebGL2 squishy renderer; DOM/CSS interface and project WebAudio.
- Personal SaveState V3 Library: eight free slots, optional single rewarded upgrade to ten, delete/replace without forced ads.
- Ideas are optional inspiration. No XP/rank, currency, recipe gating or required advertisement.
- Real Yandex SDK runtime separated from local mock, shared activity blockers, Pages QA and Yandex archive builds.

## Development

Node.js 24 (CI baseline; manifest minimum >=20.19.0):

```bash
npm ci
npx playwright install --with-deps chromium
npm run dev
npm run release:check
npm run qa:browser
npm run qa:visual
```

`release:check` runs strict TypeScript, the authored-image tooling smoke test, a Pages build, a Yandex build and the shared-kit upload-root audit plus Squishy-specific SDK/debug/base-path checks. GitHub Actions runs the release and browser QA gates on PRs. `npm run build:yandex && npm run verify:yandex` produces/checks `dist-yandex/`; CI packages the *contents* at the ZIP root.

`qa:visual` compares 30 reviewed Linux Chromium UI snapshots (Library, Ideas, Paint, Decor and Finish; RU/EN; 320px portrait, 844px landscape and 1440px desktop). Canvas rendering is hidden only during snapshot capture so physics/GPU noise cannot hide UI regressions; existing functional/renderer tests still verify the toy itself. Use the locked Playwright version, wait for self-hosted fonts and keep reduced motion enabled. Review actual/diff images before intentionally regenerating via `npm run qa:visual:update`; never update baselines merely to silence a failure. Visual comparison runs in Release Browser QA CI. Initial cross-machine CI verification is separate from local validation.

The maker keeps all stage controls visible without page or nested-tray scrolling. Shared control/theme/type/room-motion styles live in `src/app/styles`; old jelly CSS entrypoints are compatibility imports.

The kit is pinned to reviewed commit `797b5689767e9dc1059514e0446479e054bf1352` (not `main`). Its Phaser bootstrap is for **new Phaser projects**, not a drop-in replacement for this existing game; engine-neutral production mechanisms were adopted selectively, and the existing game now uses the production Phaser maker while retaining its own platform, save and audio contracts.

## Authored art

For a new **transparent UI/decor image** (not procedural squishy rendering):

```bash
npm run asset:prepare -- assets-src/ui/button.png public/assets/ui/button.webp --canvas=256 --padding=24
```

This uses the shared kit's guarded cutout/normalization and optional validated AVIF companion. Keep the master and licensing/provenance; determine actual canvas/codec budgets from real assets and mobile measurements. The lazy browser format seam is in `src/app/runtimeAssets.ts`. See `docs/RUNTIME_ASSETS.md` before integrating a UI pack, including the startup/session loading contract and Pages vs Yandex path prefixes.

## Documentation — start here

[`docs/README.md`](docs/README.md) is the **short map of current contracts vs historical plans**; [`AGENTS.md`](AGENTS.md) contains implementation invariants. In particular:

- `docs/SANDBOX_PIVOT_01_MASTER_PLAN.md` — freeform sandbox product baseline; older status labels are historical.
- `docs/SANDBOX_PIVOT_01_ASSET_PLAN.md` and `docs/SANDBOX_PIVOT_S3_DECOR.md` — art and player decor constraints.
- `docs/PROJECT_DECISIONS.md` — adopted infrastructure and scoped Phaser migration decisions.
- `docs/RUNTIME_ASSETS.md` and `docs/STUDIO_ENVIRONMENT_EXECUTION_V7.md` — authored art contracts and Studio environment implementation evidence.
- `docs/IMPLEMENTATION_ROADMAP.md` and older recipe/XP documents retain historical evidence only; do not restore their retired product model or use the old dark `ART_DIRECTION.md` as the current Studio visual specification.

Pages CI is not hosted Yandex DRAFT validation or a tactile real-phone acceptance test. Do not claim live Yandex ads, DRAFT performance or new art acceptance from the Pages build alone.
