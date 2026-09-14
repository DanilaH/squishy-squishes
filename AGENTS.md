# Squishy Squishes — Agent Contract

The tactile thesis, Vertical Slice 01, interaction correction passes 02–04 and Production Skeleton 01 have **PASSED**. The active gate is now **Renderer Reuse / Second Shape**.

Read first:

1. `docs/RENDERER_REUSE_SECOND_SHAPE.md`
2. `docs/RENDERER_REUSE_SECOND_SHAPE_REVIEW.md`
3. `docs/IMPLEMENTATION_ROADMAP.md`
4. `docs/TECHNICAL_DIRECTION.md`
5. `docs/GAMEPLAY.md`
6. `docs/DECISIONS.md`
7. `docs/PRODUCT.md`

Production Skeleton 01 remains the accepted architecture baseline. Older probe/slice documents remain evidence, not active instructions.

## Current task invariant

Prove that a materially different second silhouette can use the accepted loop and renderer without bespoke physics or a second state machine.

Accepted loop remains:

`select → paint base → optional foam shake → stretch/mix → form with normal taps + crit targets → reveal → free squeeze → Collect → repeat`

Current Phase 4 scope:

- preserve `soft-square`;
- add exactly one second shape: `heart`;
- centralize silhouette data in `ShapeDefinition`;
- use that same geometry for WebGL field masking, pointer acquisition, paint clipping/coverage and mold validation;
- preserve one spring mesh and one deformation/material path;
- expand the selectable deterministic set from 6 to 12 combinations;
- preserve the original six durable variant IDs exactly;
- preserve save schema V1 and Production Skeleton lifecycle/runtime boundaries.

Do not add a third shape, progression, final collection UI, new filling/material feature, per-shape physics values, per-shape stage flow or heart-only gameplay.

## Review blocker rule

Any condition on `shape.id` inside deformation physics, stage-progress math, audio behavior or craft-state transitions is a blocker.

Shape-specific logic is allowed only where shape boundaries are authored/selected. Generic consumers must operate on `ShapeDefinition` data.

The renderer must remain:

- one WebGL program;
- one spring mesh;
- one physics path;
- one material/filling path;
- one cached generic shape-field mechanism.

If the heart needs dedicated deformation tuning or a second renderer, the reuse thesis has failed and catalog expansion must stop.

## Product invariant

The eventual product is a compact tactile maker/collection game, not a general crafting simulator.

Long-term grammar:

`choose recipe → tactile make → mold → reveal → squeeze/play → collect → visible next unlock`

Content novelty should come mainly from reusable shape/material/filling/finish composition. A recipe that needs bespoke gameplay code is a warning.

## Technical baseline

- strict TypeScript;
- Vite;
- raw WebGL2 hero renderer;
- DOM/CSS UI;
- project-local WebAudio over reviewed shared-kit primitives;
- `@danilah/mini-games-kit` pinned to reviewed production revision `d17ba31fce2a71335dcc3095f772c3fdd87fe97b`.

No Phaser, React, Pixi, Three.js, physics engine, ECS or general soft-body framework without new evidence.

## State discipline

Production Skeleton 01 remains authoritative:

- save and settings are separate versioned documents;
- game modules do not call localStorage directly;
- platform adapters do not know Squishy recipe semantics;
- mid-craft gestures/stages are not persisted;
- every Collect may update durable product state, but persistence must not block presentation;
- malformed production save must not blank the app;
- legacy slice discovery data migrates only when the production save key is absent.

Phase 4 does **not** bump the save schema. Original variant IDs remain valid; new heart IDs extend the accepted set.

## Lifecycle discipline

`PlatformRuntime.activity` remains the aggregate blocker source. Shape work must not create a second visibility policy.

On block/pause:

- release owned input;
- stop continuous stage audio;
- prevent semantic progress;
- reset timing before resume;
- preserve stable stage state where practical.

## Historical evidence — do not rewrite

- `docs/SQUISH_FEEL_PROBE.md`
- `docs/PROBE_RESULT.md`
- `docs/VERTICAL_SLICE_01.md`
- `docs/PRODUCTION_PASS_01.md`
- `docs/INTERACTION_PASS_02.md`
- `docs/INTERACTION_PASS_03.md`
- `docs/INTERACTION_PASS_04.md`
- `docs/PRODUCTION_SKELETON_01.md`
- `docs/PRODUCTION_SKELETON_01_REVIEW.md`

These explain how the current loop and production boundaries were validated.

## Development discipline

Use a feature branch and reviewable PR. Run strict typecheck/build before merge. Independently inspect the final diff for gameplay-tuning drift, shape-specific forks, durable-ID regressions and architecture overreach.

Code-level structural PASS is not the full Phase 4 product gate: after deployment, exercise both shapes on a phone before marking Phase 4 complete. Only then move to progression/collection.
