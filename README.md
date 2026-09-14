# Squishy Squishes

Compact tactile maker / collection game for Yandex Games.

**Current status:** tactile core PASS; full-loop slice PASS; interaction correction passes accepted; **Production Skeleton 01 is the active implementation gate**.

Current accepted loop:

`select → paint base → optional foam shake → stretch/mix → form with normal taps + crit targets → reveal → free squeeze → Collect → repeat`

## Active gate — Production Skeleton 01

The next job is architecture around the proven loop, not new gameplay.

Scope:

- app bootstrap boundary;
- mock/Yandex runtime seam;
- versioned save repository;
- separate versioned settings repository;
- legacy slice-save migration;
- typed RU/EN copy skeleton;
- aggregate activity/lifecycle wiring;
- DEV-only debug seam;
- remove direct storage/platform ownership from `VerticalSliceApp`;
- preserve current gameplay feel exactly.

Canonical implementation spec: `docs/PRODUCTION_SKELETON_01.md`.
Independent review: `docs/PRODUCTION_SKELETON_01_REVIEW.md`.

After this passes, the next gate is **exactly one materially different second shape** using the same deformation/material path. Only after that reuse test passes do we scale progression and catalog production.

## Product thesis

Make desirable soft collectibles through a short tactile lab ritual, reveal them, squeeze the finished result, collect them, and quickly expose the next visually different recipe.

The production bet is high content multiplication from:

`shape × material/palette × filling × decal/decoration × finish`

without bespoke gameplay code per recipe.

Working MVP direction remains approximately six reusable base shapes and around 24 curated recipes, with quality allowed to reduce the final count.

## Stack

- strict TypeScript;
- Vite;
- raw WebGL2 for the tactile hero;
- DOM/CSS for UI;
- WebAudio;
- `@danilah/mini-games-kit` pinned to `d17ba31fce2a71335dcc3095f772c3fdd87fe97b`;
- no backend;
- no React/Phaser/Pixi/Three.js/physics engine unless new evidence justifies it.

## Documentation

Current execution order:

- `docs/PRODUCTION_SKELETON_01.md` — active production-shell specification
- `docs/PRODUCTION_SKELETON_01_REVIEW.md` — independent review/corrections
- `docs/IMPLEMENTATION_ROADMAP.md` — full phase order
- `docs/TECHNICAL_DIRECTION.md` — long-term boundaries
- `docs/GAMEPLAY.md` — interaction grammar
- `docs/PRODUCT.md` — product thesis/scope
- `docs/CONTENT_AND_PROGRESSION.md` — later catalog/progression design
- `docs/ART_DIRECTION.md` — visual identity
- `docs/ANALYTICS_AND_MONETIZATION.md` — later analytics/ad posture
- `docs/QA_AND_ACCEPTANCE.md` — release validation

Historical evidence:

- `docs/SQUISH_FEEL_PROBE.md`
- `docs/PROBE_RESULT.md`
- `docs/VERTICAL_SLICE_01.md`
- `docs/PRODUCTION_PASS_01.md`
- `docs/INTERACTION_PASS_02.md`
- `docs/INTERACTION_PASS_03.md`
- `docs/INTERACTION_PASS_04.md`

## Run

Requirements: Node.js `>=20.19.0`.

```bash
npm install
npm run dev
```

Production build/typecheck:

```bash
npm run typecheck
npm run build
```

GitHub Pages phone build:

https://danilah.github.io/squishy-squishes/

## Scope rule

Do not turn the project into Cooking Mama, a shop/economy sim, or a physics sandbox.

Right now the goal is to make the accepted loop a clean production foundation, then prove renderer reuse on a second shape before scaling systems or content.
