# Catalog Production 7A — independent pre-implementation review

**Date:** 2026-09-14
**Spec:** `CATALOG_PRODUCTION_7A.md`
**Verdict:** PASS WITH BOUNDED CORRECTIONS ALREADY APPLIED

## 1. Main finding

The initial instinct to add 6–8 recipes in the first catalog batch was too aggressive.

The current canonical catalog already contains 16 recipes. Adding eight immediately would hit the working 24-item target while only four silhouettes exist, creating pressure either to exceed the target or retire previously durable content before Mushroom/Paw/Blob candidates are evaluated.

Correction: 7A adds **four recipes total, two per new shape**, growing the catalog to 20 and preserving room for later shape decisions.

## 2. Curated-catalog risk

`content.ts` currently derives `LEGACY_VARIANTS` from all `SHAPES`. Therefore simply adding Mochi/Peach would silently generate a Cartesian set of legacy combinations and violate the Phase 6 architecture.

Required correction:

- introduce `SELECTOR_SHAPES = [Soft Cube, Soft Heart]` through data filtering;
- derive `LEGACY_VARIANTS` from `SELECTOR_SHAPES`, not `SHAPES`;
- keep Mochi/Peach only in explicit curated entries.

This is a necessary architecture correction, not scope expansion.

## 3. Legacy selector state risk

`VerticalSliceApp` currently renders shape controls from `SHAPES`, and palette/filling controls normalize premium material/palette/filling state but preserve `selected.shape`.

After Collection launches a hidden Mochi/Peach recipe, returning to select and touching an old palette/filling control could leave a hidden new shape combined with legacy components, producing a non-canonical disabled choice.

Required correction:

- render shape buttons from `SELECTOR_SHAPES`;
- when any legacy component selector control is touched, normalize a non-selector shape back to `soft-square`.

## 4. Shape complexity review

Mochi should be low risk because a rounded, flattened parametric boundary is convex and should work naturally with the generic mesh, paint coverage and mold target validation.

Peach is the more valuable test. It should use a mild radial top-cleft / lower-point silhouette, not a softened copy of the existing heart formula. If the cleft causes paint/hit-test holes or deformation collapse, reduce silhouette severity rather than adding per-shape renderer code.

## 5. Recipe/content review

Accepted four recipes:

- Milk Mochi — new `milk` palette + soft/smooth;
- Galaxy Pearl Mochi — existing prism/holo/pearls;
- Peach Milk Puff — new `peach` palette + soft/smooth;
- Sakura Jelly Peach — existing strawberry/jelly/smooth.

This is a good bounded matrix because it exercises all accepted material/filling families across new silhouettes without adding a new subsystem.

Do not implement the working-plan `Black Oil`, `Candy Confetti` or `Chrome Sunset` names yet: current primitives do not honestly support those identities.

## 6. Progression review

Do not add Rank 9/10. Existing XP is explicitly validation tuning, and a rank expansion would create unnecessary UI/QA/balance work.

Adding one recipe to ranks 2, 3, 7 and 8 preserves thresholds while making new shapes visible across early and late progression. Existing Rank 8 saves naturally receive access to the full 7A batch.

## 7. Save compatibility review

No schema bump is justified. `completedVariantIds` already stores string IDs and canonical normalization is registry-driven. Adding known IDs is compatible.

Old IDs must remain byte-for-byte unchanged.

## 8. Production-burden stop rule

The implementation should touch only the minimum content/shape/selector/progression/doc surfaces. If Mochi or Peach requires shader changes, renderer branches, new interaction constants, special paint logic, special mold logic, or custom spring behavior, 7A fails its purpose and should stop before merging.

## 9. Expected implementation diff

Production code should be limited approximately to:

- `src/game/shapes.ts`;
- `src/game/content.ts`;
- `src/game/progression.ts`;
- `src/game/VerticalSliceApp.ts` only for selector-shape filtering/normalization.

No `SquishSurface.ts`, `shaders.ts`, audio, save repositories, platform runtime or styles should need functional changes.

## 10. Final pre-implementation verdict

Proceed.

The corrected batch is small enough to test the high-CMF thesis honestly: two silhouettes + two cheap palettes + four explicit recipes, while preserving the shared renderer and leaving room for later catalog decisions.