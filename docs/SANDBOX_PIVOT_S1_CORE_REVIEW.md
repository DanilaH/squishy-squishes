# Sandbox Pivot S1 Core — Independent Pre-Implementation Review

**Verdict:** PASS WITH HARD CONSTRAINTS

## What S1 is actually proving

S1 should not be judged by amount of UI or content produced. It has one product/architecture proof:

> Can the accepted tactile renderer become the substrate for a real authored toy whose player-created state survives the complete create → save → reload → squeeze lifecycle?

The proposed scope is sufficient to answer that without pulling S2–S4 forward.

## Strong decisions

### Separate `SandboxApp`

This is the correct cut. `VerticalSliceApp` already contains recipe selection, rank/progression, coverage painting, mold, reveal, collection and QA-era concerns. Adding sandbox stages there would create conditional product modes throughout a monolith and make later retirement harder.

S1 should build the new player path beside it, then bootstrap the new path as normal production behavior once validated.

### Promote appearance out of `debug/`

S0 proved the codec, but its current location is intentionally experimental. SaveStateV3 must depend on a production sandbox module. The probe can depend downward on that module; the dependency must never point from production into `debug/`.

### Separate V3 persistence from legacy progression semantics

Do not mutate SaveStateV2 until it vaguely resembles V3. V3 has different product meaning: the persisted objects are authored toys, not completion counters. Migration should be explicit and one-way.

### Keep S1 to one saved custom toy

This avoids accidentally implementing S2. A library-shaped V3 schema is justified now because it is the stable persistence envelope, but the S1 UI only needs the newest/sole authored toy plus `New Squishy`.

## Hard constraints before implementation

1. **No legacy progression callback leakage.** `SandboxApp` must not receive `labXp`, `completedVariantIds`, `onVariantCollected` or rank-gate state.
2. **No coverage logic reuse.** S0 UV painting can be promoted; legacy `PAINT_COMPLETE_COVERAGE`, eligible grids and auto-complete semantics must not come with it.
3. **No fake Mix completion.** Browser QA must use pointer movement on the real surface. Product code must not expose test-only completion hooks.
4. **Bound mix-ins.** Use compact deterministic UV placements, not DOM particles as canonical state and not physics objects.
5. **Material is finish, not a recipe dimension.** Existing material shader styles may be reused, but S1 must not reconstruct `VariantChoice`/canonical recipe IDs merely to render a custom toy.
6. **Migration is conservative.** Preserve what is semantically preservable (`totalCrafts`, known completion IDs for future recipes), but never synthesize custom saved toys from recipe history.
7. **Old V2 must remain recoverable until V3 write succeeds.** Remove V2 only after a successful persisted V3 migration.
8. **Do not implement S2 capacity UX.** `libraryCapacity: 8` belongs in schema; full-slot UX, delete/replace selection and rewarded expansion do not.
9. **No S3 decor under another name.** Mix-ins are the only authored non-paint visual extras in S1.
10. **No renderer branching by shape.** S1 must work through the existing generic `setShape` + shared UV/shape field model.
11. **Yandex remains first-class.** The sandbox cannot be a Pages-only feature. Only S0 debug probe remains Pages-only.
12. **Normal boot must flip only after the S1 path is browser-proven.** During implementation a temporary branch-only route is acceptable for validation, but the final PR should make the production sandbox path the normal app.

## Main implementation risks

### Pointer ownership conflict

Paint/mix-in authoring and `SquishSurface` squeeze physics use the same canvas. Stage code must explicitly control `surface.setInteractive(...)` so only the intended interaction owns a pointer at each stage. Avoid parallel handlers fighting over capture.

### Texture update cost

S0 already showed 256×256 uploads are viable for representative painting. S1 should still batch texture uploads to `requestAnimationFrame`; do not upload on every raw pointer event synchronously.

### Save decoder trust boundary

Appearance commands become persistent player data. V3 decoding therefore needs bounds: known shape/material/mix-in IDs, bounded stroke/placement counts, bounded point payloads and finite timestamps. Do not accept arbitrary unbounded JSON just because it came from our storage adapter.

### UI rewrite breadth

S1 is a product-shell rewrite, but visual polish is not the proof. Keep the object large, controls touch-first and stages obvious. Do not spend this phase reproducing every UI_UX_OVERHAUL_02 flourish while the lifecycle is still being proven.

## Required final-review questions

Before PR, independently answer:

- Does default production bootstrap instantiate `SandboxApp` without recipe progression state?
- Does SaveStateV3 round-trip one authored toy with bounded decoded data?
- Does V2 migration preserve history without fabricating a toy?
- Can all six shapes be selected on real UI?
- Can Paint and Mix-ins be skipped without failure?
- Does Mix require actual movement?
- Is Mold absent from the sandbox path?
- After reload, do shape/material/paint/mix-ins visibly reconstruct?
- Does real squeeze remain renderer-driven?
- Does the final diff contain no temporary workflow and no production import from `debug/`?

If any answer is no, S1 is not complete even if typecheck/build are green.
