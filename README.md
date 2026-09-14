# Squishy Squishes

Compact tactile maker / collection game for Yandex Games.

**Current status:** tactile core PASS; full-loop slice PASS; interaction correction passes PASS; Production Skeleton 01 PASS; **Renderer Reuse / Second Shape is the active gate**.

Current accepted loop:

`select → paint base → optional foam shake → stretch/mix → form with normal taps + crit targets → reveal → free squeeze → Collect → repeat`

## Active gate — Renderer Reuse / Second Shape

The current job is to prove the high-CMF renderer thesis before progression or catalog scale.

Bounded scope:

- preserve the accepted rounded soft-square;
- add exactly one materially different second silhouette: **Soft Heart**;
- drive both silhouettes from one shared shape definition boundary;
- keep one spring mesh, one deformation path, one shader/material path and one craft state machine;
- use the same shape geometry for WebGL masking, pointer hit testing, paint clipping/coverage and mold target validation;
- keep the original six durable variant IDs intact and add six heart variants;
- no new physics tuning, gameplay stages, progression, collection redesign or third shape;
- strict typecheck/build plus an independent diff review before merge;
- deployed phone check before Phase 4 is marked fully complete.

Canonical implementation spec: `docs/RENDERER_REUSE_SECOND_SHAPE.md`.
Independent review: `docs/RENDERER_REUSE_SECOND_SHAPE_REVIEW.md`.

Production Skeleton 01 is complete and remains the architecture baseline. Its save/settings/runtime/lifecycle boundaries must not be bypassed by shape work.

## Product thesis

Make desirable soft collectibles through a short tactile lab ritual, reveal them, squeeze the finished result, collect them, and quickly expose the next visually different recipe.

The production bet is high content multiplication from:

`shape × material/palette × filling × decal/decoration × finish`

without bespoke gameplay code per recipe.

Working MVP direction remains approximately six reusable base shapes and around 24 curated recipes, with quality allowed to reduce the final count. That scale is not authorized until the current two-shape reuse gate passes.

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

- `docs/RENDERER_REUSE_SECOND_SHAPE.md` — active Phase 4 implementation contract
- `docs/RENDERER_REUSE_SECOND_SHAPE_REVIEW.md` — independent challenge/corrections
- `docs/IMPLEMENTATION_ROADMAP.md` — full phase order and gates
- `docs/TECHNICAL_DIRECTION.md` — long-term boundaries
- `docs/GAMEPLAY.md` — interaction grammar
- `docs/PRODUCT.md` — product thesis/scope
- `docs/CONTENT_AND_PROGRESSION.md` — later catalog/progression design
- `docs/ART_DIRECTION.md` — visual identity
- `docs/ANALYTICS_AND_MONETIZATION.md` — later analytics/ad posture
- `docs/QA_AND_ACCEPTANCE.md` — release validation

Completed production-boundary evidence:

- `docs/PRODUCTION_SKELETON_01.md`
- `docs/PRODUCTION_SKELETON_01_REVIEW.md`

Historical tactile/slice evidence:

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

Right now the goal is to falsify or confirm reusable multi-shape rendering with one second shape. If the heart needs bespoke physics, stages or a separate renderer path, stop catalog expansion and fix the renderer/content boundary before progression work.
