# Squishy Squishes

A compact, touch-first freeform squishy maker for Yandex Games. [Play the GitHub Pages build](https://danilah.github.io/squishy-squishes/).

**Current baseline:** S0–S6 sandbox plus two polish passes are merged (PR #29). The next product tasks are more recognizable shapes and a more toy-like UI; neither is part of this infrastructure PR.

`Library → New Squishy → Shape → Paint → Mix-ins → Mix → Decorate → Finish/Save → Squeeze`

- Six freely available shapes and six materials; mix-ins, paint and surface/head decor.
- One raw WebGL2 deformable squishy surface; DOM/CSS interface and project WebAudio.
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

The kit is pinned to reviewed commit `797b5689767e9dc1059514e0446479e054bf1352` (not `main`). Its Phaser bootstrap is for **new Phaser projects**, not this existing WebGL2 game; we selectively integrate engine-neutral production mechanisms.

## Authored art

For a new **transparent UI/decor image** (not procedural squishy rendering):

```bash
npm run asset:prepare -- assets-src/ui/button.png public/assets/ui/button.webp --canvas=256 --padding=24
```

This uses the shared kit's guarded cutout/normalization and optional validated AVIF companion. No external art is imported by the infrastructure PR. Keep the master and licensing/provenance; determine actual canvas/codec budgets from real assets and mobile measurements. The lazy browser format seam is in `src/app/runtimeAssets.ts`. See `docs/RUNTIME_ASSETS.md` before integrating a UI pack, including the startup/session loading contract and Pages vs Yandex path prefixes.

## Current engineering source of truth

- `AGENTS.md` — active sandbox invariants and implementation rules.
- `docs/SANDBOX_PIVOT_01_MASTER_PLAN.md` — freeform sandbox product baseline.
- `docs/SANDBOX_PIVOT_01_ASSET_PLAN.md` and `docs/SANDBOX_PIVOT_S3_DECOR.md` — art and decor constraints.
- `docs/PROJECT_DECISIONS.md` — adopted kit infrastructure, justified bootstrap deviations.
- `docs/RUNTIME_ASSETS.md` — image production, format/loading policy and acceptance.
- `docs/IMPLEMENTATION_ROADMAP.md` and older recipe/XP documents retain historical decisions; some roadmap S5/S6 labels are outdated, so verify status against the shipped code and merged PRs.

Pages CI is not hosted Yandex DRAFT validation or a tactile real-phone acceptance test. Do not claim live Yandex ads, DRAFT performance or new art acceptance from the Pages build alone.
