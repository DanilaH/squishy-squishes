# Squishy Squishes — Agent Contract

The tactile thesis and Vertical Slice 01 have **PASSED**. Interaction correction passes 02–04 are accepted. The active gate is now **Production Skeleton 01**.

Read first:

1. `docs/PRODUCTION_SKELETON_01.md`
2. `docs/PRODUCTION_SKELETON_01_REVIEW.md`
3. `docs/IMPLEMENTATION_ROADMAP.md`
4. `docs/TECHNICAL_DIRECTION.md`
5. `docs/GAMEPLAY.md`
6. `docs/DECISIONS.md`
7. `docs/PRODUCT.md`

Historical probe/slice documents remain evidence, not active instructions.

## Current task invariant

Productionize the accepted loop **without changing its feel**:

`select → paint base → optional foam shake → stretch/mix → form with normal taps + crit targets → reveal → free squeeze → Collect → repeat`

Production Skeleton 01 owns only the shell around that loop:

- app bootstrap;
- mock/Yandex runtime seam;
- versioned save;
- separate settings;
- typed RU/EN copy skeleton;
- aggregate activity lifecycle;
- DEV-only debug seam;
- removal of direct browser persistence/platform ownership from `VerticalSliceApp`.

Do not use this pass to retune paint/shake/mix/mold/reveal/squeeze values.

## Next gate after this pass

**Renderer Reuse / Second Shape.** Add exactly one materially different shape using the same deformation/material path. Do not begin six-shape or 24-recipe production until that gate passes.

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

Production Skeleton 01 introduces the first real product persistence boundary.

- save and settings are separate versioned documents;
- game modules do not call localStorage directly;
- platform adapters do not know Squishy recipe semantics;
- mid-craft gestures/stages are not persisted;
- every Collect may update durable product state, but persistence must not block presentation;
- malformed preferences may fall back safely;
- malformed production save must not blank the app;
- legacy slice discovery data migrates only when the production save key is absent.

## Lifecycle discipline

`PlatformRuntime.activity` is the aggregate blocker source. Game code must not create a second competing visibility policy.

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

These explain how the current loop was validated and tuned.

## Development discipline

Use a feature branch and reviewable PR. Run strict typecheck/build before merge. Independently inspect the final diff for gameplay-tuning drift and architecture overreach.

After Production Skeleton 01 passes, move directly to the second-shape reuse gate rather than adding progression or mass content first.
