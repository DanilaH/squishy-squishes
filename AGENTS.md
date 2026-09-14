# Squishy Squishes — Agent Contract

The tactile thesis, Vertical Slice 01, interaction correction passes 02–04, Production Skeleton 01 and Renderer Reuse / Second Shape have **PASSED**. The active gate is now **Progression + Collection 01**.

Read first:

1. `docs/PROGRESSION_COLLECTION_01.md`
2. `docs/PROGRESSION_COLLECTION_01_REVIEW.md`
3. `docs/PROGRESSION_COLLECTION_01_IMPLEMENTATION_REVIEW.md`
4. `docs/IMPLEMENTATION_ROADMAP.md`
5. `docs/CONTENT_AND_PROGRESSION.md`
6. `docs/TECHNICAL_DIRECTION.md`
7. `docs/GAMEPLAY.md`
8. `docs/DECISIONS.md`
9. `docs/PRODUCT.md`

Production Skeleton 01 remains the architecture baseline and the two-shape reuse gate is accepted evidence. Older probe/slice documents remain evidence, not active instructions.

## Current task invariant

Prove that the accepted tactile loop creates a clear durable “one more squishy” motivation without importing an economy or new content-production burden.

Accepted loop becomes:

`select unlocked recipe → tactile craft → reveal → squeeze → Collect → XP/unlock feedback → next visible goal → repeat`

Current Phase 5 scope:

- keep exactly the current two shapes and 12 combinations;
- add one derived Lab XP / Lab Rank track;
- deterministic unlock table;
- SaveState V2 with V1/legacy migration;
- collection read model with locked / available / completed states;
- one compact collection overlay;
- completed-item revisit through the existing test/squeeze state;
- pure edge-triggered milestone resolution;
- concise post-Collect feedback.

Do not add currency, shop, crafting costs, ads, third shape, new materials/fillings, quests, duplicate systems, a router, another renderer, or bespoke per-recipe gameplay.

## Review blocker rule

Progression truth must remain domain-derived rather than scattered through DOM handlers. `labRank` and unlock arrays are derived from XP and must not be persisted redundantly. Collection cards must not create WebGL renderer instances. Revisit/free-squeeze must not mutate XP/save.

Save migration must preserve effective access to every previously completed recipe, including Phase-4 completions that now have a higher required rank.

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

Phase 5 bumps production save to V2 only to add `labXp`. Original square and heart variant IDs remain stable. Rank and unlocked IDs stay derived rather than persisted.

## Lifecycle discipline

`PlatformRuntime.activity` remains the aggregate blocker source. Progression/collection work must not create a second visibility policy.

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
