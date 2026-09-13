# Squish Feel Probe

## Purpose

Resolve one uncertainty: can a generic soft object feel satisfying under repeated pointer interaction without true soft-body physics, bespoke per-object deformation code, or product-scope expansion?

Canonical research/decision context lives in `DanilaH/decisions`:

- `Yandex Games/YANDEX_GAMES_DECISIONS.md`
- `Yandex Games/Research/2026-09-13-next-project-comparison.md`
- `Yandex Games/GAME_FEEL_DOCTRINE.md`

Pinned shared implementation revision:

- `DanilaH/mini-games-kit@2da5b501a7e47fbe4b3683069b34f8e252116963`

## Decision rule

At the end of one bounded implementation pass:

- **PASS** if the object remains pleasant after 20+ interactions, local deformation clearly reads as soft material rather than scale animation, spring-back is convincing, performance is stable, true soft-body physics is unnecessary, and the same deformation system could plausibly drive multiple future visual recipes.
- **FAIL** if convincing feel requires a real physics/constraint system, repeated object-specific fixes, product/meta systems, or if the interaction remains dull/mechanical after one bounded correction pass.

There is no product-scope `MAYBE` state.

## Hard scope

Build one centered generic non-IP soft object in one finished-looking scene.

Interaction:

`pointer down inside object -> local compression/grab -> drag/press -> continuous deformation -> release -> damped soft return`

Do not build menus, economy, progression, collection, ads, Yandex SDK, persistence, merge, mystery boxes, shops/orders/customers, multiple mini-games, multiple authored objects, or a full asset pipeline.

## Runtime

Use a minimal TypeScript + Vite browser app with one WebGL2 canvas.

Do not introduce Phaser/Pixi unless raw WebGL2 becomes the dominant implementation cost. The probe tests material response, not engine integration.

## Mesh

Start with a small regular mesh, approximately 10x10 vertices over a soft rounded silhouette.

Each vertex tracks rest position, current position, velocity, and UV coordinates.

Triangles are static. Only vertex positions change.

## Local deformation

On pointer down:

1. capture the pointer;
2. convert pointer coordinates into object-local normalized coordinates;
3. establish a soft grab center;
4. compute a bounded radial influence per vertex.

During drag/press:

- strongest movement is near the pointer;
- neighbors follow progressively less;
- distant silhouette remains mostly stable;
- maximum displacement is clamped;
- response is visible in the same rendered frame;
- vertices blend toward bounded targets rather than snapping directly to the pointer.

Use a smooth radial falloff. Avoid hard pinned corners and visible grid kinks.

## Pseudo-volume

A pure dent may read as cloth. Add one cheap bounded visual volume term: local compression may produce a subtle counter-bulge outside the grab zone, strongest away from the compression direction.

Do not implement an iterative pressure solver.

## Spring return

After input forces, integrate a damped spring toward rest positions with bounded dt.

Target feel:

- immediate return on release;
- soft rather than mechanical;
- a small overshoot is acceptable;
- oscillation settles quickly;
- no long wobble.

Initial tuning target: roughly 180-320 ms visual return half-life, adjusted by hands-on feel rather than by timer compliance.

## Material response

The object should read as a finished soft toy, not debug geometry.

Minimum treatment:

- soft base gradient;
- restrained edge darkening/rim;
- smoothed pointer/strain-reactive sheen;
- slight internal color variation;
- one cheap contact shadow that responds subtly to squash;
- no wireframe in normal mode.

Optional embedded beads/glitter are allowed only after silhouette/material response already works.

## Shared kit reuse

Project-specific pointer geometry and deformation remain local.

Derive normalized compression in `[0, 1]` and feed it into `sampleContinuousInteraction(...)` to obtain normalized velocity/activity semantics.

Use `ContinuousNoiseTexture` as the tactile audio base. Keep it low-fatigue and avoid harsh broadband startup noise. Stop/dispose audio deterministically on release/cancel/visibility change/teardown.

Audio may improve tactility but must not hide a weak visual/interaction core.

## Diagnostics

Provide a small toggleable overlay with:

- FPS;
- rolling p95 frame time;
- current compression;
- normalized velocity;
- maximum vertex displacement;
- active pointer state;
- squeeze/release count;
- mute toggle;
- optional wireframe toggle.

No analytics backend is needed.

## Performance target

Primary interaction must remain responsive. Target stable 60 FPS on a normal desktop browser with one mesh.

Avoid allocation-heavy per-frame churn. Reuse WebGL buffers and WebAudio nodes. Degrade optional decoration before degrading input responsiveness.

## Acceptance protocol

### Round A

Interact continuously for at least 60 seconds. Correct obvious latency, grid artifacts, mechanical spring, harsh audio, clipping, tearing, or runaway oscillation.

### Round B

Perform at least 20 deliberate squeezes/drags/releases at different speeds and directions.

Judge:

1. Do you still want to touch it again?
2. Does the response read continuously rather than only at start/end?
3. Does release read as material rather than canned easing?
4. Does audio increase tactility without fatigue?
5. Does the object stay visually coherent at allowed extremes?
6. Is it satisfying with no reward/meta layer?

### Round C

Verify the implementation did not quietly become a substantial physics system and remains plausibly reusable across future visual recipes.

One bounded correction pass is allowed after the first full acceptance run.

## Explicit stop conditions

Record FAIL if a credible local deformation cannot be achieved without a full physics/constraint system, ordinary interaction produces unsolved fold/self-intersection artifacts, responsiveness cannot stay immediate, or new product systems start appearing to compensate for weak feel.

Do not spend a second day rescuing the thesis without new evidence.

## Write-back

After acceptance, record:

- PASS/FAIL;
- exact probe revision;
- deformation model used;
- repeated-use observations;
- performance observations;
- failed tuning approaches worth preserving;
- whether the shared kit fit cleanly;
- any genuinely reusable lesson;
- resulting production-queue change in `DanilaH/decisions`.
