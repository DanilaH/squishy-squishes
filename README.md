# Squishy Squishes

Compact tactile maker / collection game for Yandex Games.

**Current status:** tactile core PASS; full-loop slice PASS; interaction correction passes PASS; Production Skeleton 01 PASS; Renderer Reuse / Second Shape PASS; **Progression + Collection 01 is the active gate**.

Current accepted loop:

`select → paint base → optional foam shake → stretch/mix → form with normal taps + crit targets → reveal → free squeeze → Collect → visible progression → repeat`

## Active gate — Progression + Collection 01

The current job is to prove the “one more squishy” layer on the already accepted two-shape renderer before representative content expansion.

Bounded scope:

- keep Soft Cube + Soft Heart and the current 12 deterministic combinations;
- introduce derived Lab Rank / Lab XP progression with deterministic unlocks;
- migrate production save V1 to V2 without losing access to previously completed content;
- add a compact locked / available / completed collection overlay;
- let completed items reopen the existing finished-object squeeze state;
- award stronger first-completion XP and smaller repeat XP;
- surface concise rank/unlock/milestone feedback after Collect;
- no currency, shop, ads, third shape, new material family or bespoke recipe gameplay;
- strict typecheck/build plus independent final diff review before merge;
- deployed phone check before Phase 5 is marked fully complete.

Canonical implementation spec: `docs/PROGRESSION_COLLECTION_01.md`.
Independent review: `docs/PROGRESSION_COLLECTION_01_REVIEW.md`.

Renderer Reuse / Second Shape is complete: Soft Cube and Soft Heart share one shape/deformation/material/craft path, and the merged phone build was accepted on 2026-09-14.

## Product thesis## Product thesis

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

- `docs/PROGRESSION_COLLECTION_01.md` — active Phase 5 implementation contract
- `docs/PROGRESSION_COLLECTION_01_REVIEW.md` — independent pre-implementation challenge/corrections
- `docs/IMPLEMENTATION_ROADMAP.md` — full phase order and gates
- `docs/CONTENT_AND_PROGRESSION.md` — active supporting progression/content direction
- `docs/TECHNICAL_DIRECTION.md` — long-term boundaries
- `docs/GAMEPLAY.md` — interaction grammar
- `docs/PRODUCT.md` — product thesis/scope
- `docs/ART_DIRECTION.md` — visual identity
- `docs/ANALYTICS_AND_MONETIZATION.md` — later analytics/ad posture
- `docs/QA_AND_ACCEPTANCE.md` — release validation

Completed production/reuse evidence:

- `docs/PRODUCTION_SKELETON_01.md`
- `docs/PRODUCTION_SKELETON_01_REVIEW.md`
- `docs/RENDERER_REUSE_SECOND_SHAPE.md`
- `docs/RENDERER_REUSE_SECOND_SHAPE_REVIEW.md`
- `docs/RENDERER_REUSE_SECOND_SHAPE_IMPLEMENTATION_REVIEW.md`

Historical tactile/slice evidence remains under `docs/` and is not the active implementation contract.

## Run## Run

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
