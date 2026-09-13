# Vertical Slice 01 — Production Pass 01

**Date:** 2026-09-14  
**Branch:** `feat/vertical-slice-01`  
**Status:** IMPLEMENTED / PENDING HANDS-ON

## Goal

Make the already-working full-loop slice materially closer to the intended production path **without expanding product scope**.

The slice remains:

`select → pour → optional beads → knead → mold → reveal → free squeeze → Collect → repeat`

Still only one rounded-cube shape and six deterministic variants.

## What changed

### 1. Production runtime is separated from probe evidence

The validated `src/probe/*` implementation remains intact as historical/regression evidence.

The playable slice now uses a separate production-oriented `SquishSurface` under `src/squish/` rather than continuing to mutate the probe class.

### 2. Material variants are real shader inputs

The first slice used CSS hue filters for color variants. That was sufficient for a cheap loop check but weak evidence for the planned high-CMF material system.

The production pass adds typed palette data and WebGL material uniforms for:

- low/high body color;
- sheen color;
- rim color;
- deterministic material seed.

Three palettes now use the same renderer without CSS hue filtering.

### 3. Foam Beads moved inside the squishy renderer

The first pass used a DOM bead overlay that only followed coarse object motion and could never match the deformed silhouette exactly.

Foam Beads are now procedurally generated in object UV space inside the fragment shader. Because they are shaded on the same deforming mesh, they naturally follow squeeze/stretch deformation and stay clipped to the actual object.

This is still intentionally cheap. It is not particle physics.

### 4. Pour now visually fills the object

The first pass mainly scaled the already-complete object during pouring.

The production pass adds a shader fill-progress boundary with a small procedural meniscus, so the material visibly fills the silhouette from bottom to top while the dispenser stream runs.

### 5. Mold progress affects the rendered geometry

Mold progress now applies a bounded stage squash/bulge in the vertex shader while the normal local deformation remains active. This makes the mold stage visually distinct from ordinary free squeezing without adding collision or soft-body physics.

### 6. Audio has one owner

Instead of adding a second independent AudioContext for stage sounds, the production pass introduces one project-local `SquishyAudio` owner for:

- existing continuous tactile texture;
- release plop;
- base pour;
- bead pour;
- stage completion;
- reveal;
- Collect.

Async pour startup is request-token guarded so a quick press/release cannot start a stale looping source after the pointer has already left.

### 7. Orchestration is no longer in `main.ts`

`main.ts` is now only bootstrap/dispose.

Vertical-slice DOM/state/input ownership lives in `VerticalSliceApp` and uses one `AbortController` for listener cleanup. Content definitions live in `game/content.ts`.

This is deliberately not a generalized game framework.

### 8. Shared kit moved to the reviewed production revision

The runtime now targets:

`@danilah/mini-games-kit@d17ba31fce2a71335dcc3095f772c3fdd87fe97b`

The exact revision was inspected before the change. The used `core` and `audio` exports are present there.

The new surface also consumes the shared render-density helpers instead of keeping a second local DPR policy.

## Independent review of the first slice

Before making this pass, the first implementation was reviewed again as if it were someone else's code.

The main weaknesses were not the core tactile mechanic. They were production shortcuts around it:

- CSS color filtering was not a real material system;
- the DOM bead layer could not actually deform with the mesh;
- pour read partly as whole-object growth rather than material accumulation;
- mold presentation did too little to distinguish itself from normal squeezing;
- app orchestration had grown directly inside `main.ts`;
- stage audio ownership had no clean production seam;
- runtime still pinned the old probe-era kit revision.

Those are the issues this pass addresses. It intentionally does **not** add progression, a second shape, final collection UI, ads, Yandex SDK, cloud save, or extra mini-games.

## Static validation performed

- strict TypeScript was run against the production-pass sources with local declarations matching the exact imported `mini-games-kit` APIs;
- the reviewed kit revision was inspected for the imported `core` and `audio` exports;
- listener/audio/pointer teardown paths were reviewed;
- the async looping-audio race found during review was fixed before commit;
- the validated probe implementation remains available for feel comparison.

## Still unverified until hands-on

The following cannot be honestly claimed from static review:

- full `npm install && npm run build` in this tool environment, because the private GitHub dependency is not available to shell/npm credentials here;
- shader appearance on the user's actual browser/GPU;
- whether the new pour/mold/reveal pacing feels better under 5–10 repeated loops;
- mobile-size composition and touch feel;
- audio fatigue.

Those remain the next gate. Do not add more scope before that hands-on pass.
