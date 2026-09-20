# Squishy Squishes

A compact, touch-first freeform squishy maker for Yandex Games. [Play the GitHub Pages build](https://danilah.github.io/squishy-squishes/).

**Product baseline:** S0–S6 freeform sandbox plus two polish passes (PR #29). Phaser Pages UI/Studio work was subsequently merged in PRs #54 and #56 as an **isolated preview**, not an automatic Yandex entrypoint cutover. Check the current source and preview workflows for the exact running implementation; old phase-plan status labels are historical.

`Library → New Squishy → Shape → Paint → Mix-ins → Mix → Decorate → Finish/Save → Squeeze`

- Six freely available shapes and six materials; mix-ins, paint and surface/head decor.
- One deformable WebGL2 squishy renderer; DOM/CSS interface and project WebAudio.
- Personal SaveState V3 Library: eight free slots, optional single rewarded upgrade to ten, delete/replace without forced ads.
- Ideas are optional inspiration. No XP/rank, currency, recipe gating or required advertisement.
- Real Yandex SDK runtime separated from local mock, shared activity blockers, Pages QA and Yandex archive builds.

## Development

Node.js >=20.19.0:

```bash
npm install
npm run dev
npm run release:check
npm run qa:browser
```

`release:check` runs strict TypeScript, the authored-image tooling smoke test, a Pages build, a Yandex build and the shared-kit upload-root audit plus Squishy-specific SDK/debug/base-path checks. GitHub Actions runs the release and browser QA gates on PRs. `npm run build:yandex && npm run verify:yandex` produces/checks `dist-yandex/`; CI packages the *contents* at the ZIP root.

The kit is pinned to reviewed commit `797b5689767e9dc1059514e0446479e054bf1352` (not `main`). Its Phaser bootstrap is for **new Phaser projects**, not a drop-in replacement for this existing game; engine-neutral production mechanisms were adopted selectively, and the existing game has a separately gated Phaser migration.

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
