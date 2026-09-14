# Independent Implementation Review — Renderer Reuse / Second Shape

**Date:** 2026-09-14
**PR:** #7
**Review posture:** inspect the final implementation as hostile evidence. The question is not whether a heart appears; it is whether the second silhouette actually reuses the production renderer/content path without hidden per-shape gameplay or physics forks.

## Verdict

**PASS — STRUCTURAL + PHONE PRODUCT ACCEPTANCE.**

The implementation satisfies the architectural purpose of Phase 4. The second silhouette is represented as data, all semantic silhouette consumers share that data, the renderer remains one mesh/program/physics path, durable IDs remain compatible, and strict typecheck/build pass.

The merged GitHub Pages build was subsequently exercised on phone and accepted by the project owner on 2026-09-14. Phase 4 is therefore complete; remaining visual tuning is ordinary later polish, not a reuse-gate blocker.

## What was verified

### 1. One shared shape source of truth

`src/game/shapes.ts` owns normalized boundaries for `soft-square` and `heart`.

The same `ShapeDefinition` feeds:

- `SquishSurface` pointer acquisition;
- WebGL shape-field generation;
- Canvas2D paint path;
- paint coverage eligibility;
- mold normal-press validation;
- mold crit-target placement.

No second heart-specific geometry predicate was introduced.

### 2. Renderer reuse is real

`SquishSurface` still has one 16×16 spring mesh and one `updatePhysics()` path.

The shape change adds:

- one `ShapeDefinition` field;
- one cached CPU shape-field per `ShapeId`;
- one WebGL `R8` texture;
- one `uShapeField` sampler in the existing shader.

There is no `shape.id` branch in deformation physics, stiffness, damping, grab/press response, bulge, release impulse or render-stage progress.

### 3. Craft flow reuse is real

The craft state machine remains:

`select → pour → optional add → mix → mold → reveal → test → collect`

Shape selection is restricted to `select`. There is no heart-specific stage, timing, audio cue, completion threshold or progress gain.

### 4. Durable ID compatibility is preserved

`VariantChoice` gains `shape`, but `variantId()` owns the compatibility exception:

- `soft-square` keeps the original `${palette}-${filling}` IDs;
- `heart` uses `heart-${palette}-${filling}`.

`ALL_VARIANT_IDS` is generated from the shape × palette × filling product through `variantId()`. Existing save schema V1 therefore accepts the original IDs unchanged and extends the known set to the six heart variants without a migration.

### 5. Shape-field cost is bounded

The signed-distance-like field is generated only on first use of a shape and cached as a `Uint8Array`. Switching shape uploads the cached 128×128 one-channel field; frame rendering performs a texture lookup rather than polygon traversal.

The spring vertex count and deformation hot path are unchanged.

## Findings corrected during implementation review

### A. Mold fallback could silently violate the shape contract

The first implementation sampled 16 random crit positions and defaulted to `(0, 0)` if all attempts failed. `(0, 0)` happens to be valid for the current two shapes, but that fallback was implicit and could also repeat too close to the previous target.

**Correction applied:** failed random sampling now performs a bounded deterministic grid search over points that pass the same shared `isPointInsideShape()` predicate and chooses the farthest valid candidate. If no valid point exists, no target is spawned rather than inventing an outside point.

### B. Active documentation still described Phase 3 as current

README, agent contract, roadmap, product status and technical direction still framed Production Skeleton 01 as active.

**Correction applied:** active docs now make Phase 3 complete, Phase 4 current, and explicitly preserve the phone acceptance gate.

### C. Technical direction still contained a speculative per-shape physics-shaped interface

The long-term technical document proposed `softness`, `bulge`, `returnSpeed`, `visualScale` and `visualOffset` on each shape. That contradicted the current falsification test by making per-shape tuning the path of least resistance.

**Correction applied:** current technical direction now documents the actual small boundary-only `ShapeDefinition` and treats any per-shape deformation tuning as failed reuse evidence unless future measured evidence justifies a shared transform/metadata extension.

### D. Unrelated shader rationale comment disappeared during the initial replacement

The bead reveal-order explanation was removed even though bead behavior did not change.

**Correction applied:** restored the existing rationale so the final diff does not erase unrelated implementation context.

## Validation evidence

Branch validation after the behavioral implementation and mold-fallback correction:

- `git diff --check` — PASS;
- `npm install` — PASS, 0 vulnerabilities reported by that run;
- `npm run typecheck` — PASS;
- `npm run build` — PASS;
- Vite 8.2.2 production build — PASS;
- 43 modules transformed;
- built JS approximately 77.47 kB / 22.48 kB gzip in the recorded run.

Subsequent changes were documentation cleanup plus restoration of a shader comment; no runtime behavior changed after the last green build.

## Remaining product evidence

CI/review cannot validate these perceptual questions:

- does the heart notch read cleanly at real phone resolution;
- does the notch remain convincing under aggressive stretch;
- does the generic rim/edge treatment look as good as the original soft-square;
- is 92% paint coverage fair on the heart lobes/notch;
- does the extra selector row fit comfortably on representative portrait phones;
- does shape-field rendering preserve tactile responsiveness on device.

These are the only remaining Phase 4 acceptance items. If they pass on the deployed build, Phase 4 can close and Phase 5 progression/collection becomes the next authorized gate.
