# Representative Content 01 — independent implementation review

**Date:** 2026-09-14
**Branch:** `representative-content-01`
**Base:** `main@3f06cb926b8351ad2c45a65c5440500621098b26`
**Verdict:** STRUCTURAL PASS — PHONE VISUAL ACCEPTANCE PENDING

## Review scope

The final production diff was reviewed independently after implementation and after temporary patch/workflow tooling was removed. Review covered the curated content registry, durable IDs, progression coverage, selection safety, Collection launch path, renderer API, GLSL structure, filling cell math, save compatibility and scope boundaries.

Validation run `34842830719` passed:

- `git diff --check`;
- dependency install;
- strict `npm run typecheck`;
- production `npm run build`.

The first validation attempt caught two unused imports after selector extraction; they were removed before the successful validation run.

## 1. Catalog / durable IDs — PASS

The canonical catalog is now explicit and contains exactly 16 recipes:

- the original 12 legacy recipes are still generated only from the proven legacy selector subsets;
- four representative recipes are appended explicitly;
- runtime assertions reject duplicate canonical IDs and mismatches between recipe ID and recipe choice.

Legacy ID semantics are preserved exactly:

- Soft Cube remains `{palette}-{filling}`;
- Soft Heart remains `heart-{palette}-{filling}`;
- adding `material: 'soft'` does not change any previous durable ID.

This keeps existing SaveState V2 documents compatible without a schema migration.

## 2. Cartesian explosion prevention — PASS

Adding aqua/prism palettes, jelly/holo materials and Pearl filling does **not** multiply into every mathematical combination.

`SELECTOR_PALETTES` and `SELECTOR_FILLINGS` keep the current component selector on the original three palettes/two fillings, while `ALL_VARIANTS` is the curated canonical registry.

This is the correct production boundary for later catalog work.

## 3. Premium-selector safety — PASS

The pre-implementation review identified the main state trap: a Collection-selected premium recipe contains palette/material/filling values absent from the legacy component selector.

The implementation repairs this correctly. Touching any legacy shape/color/filling control normalizes the selection back to:

- `material: 'soft'`;
- a legacy palette (premium palette falls back to grape where required);
- a legacy filling (Pearl falls back to smooth where required).

The resulting component choice is canonical before progression lookup. The Start button also refuses non-canonical selections defensively.

No `getRequiredRank()` call is reachable from an invalid selector combination in the reviewed paths.

## 4. Collection launch path — PASS

Available Collection cards now expose **Make**. The action:

1. resolves a canonical recipe;
2. verifies unlock eligibility;
3. assigns its existing `VariantChoice`;
4. updates the existing renderer/config;
5. closes Collection;
6. enters the existing `pour` stage.

There is no second craft state machine, route, scene or renderer. Completed cards still use the existing `test` free-squeeze path.

## 5. Material architecture — PASS

Material novelty is represented by reusable `MaterialSpec` parameters rather than recipe-specific code.

Current profiles:

- `soft`;
- `jelly`;
- `holo`.

`SquishSurface` remains one renderer with one shader program and receives generic scalar uniforms for translucency and iridescence. Palette remains responsible for color values. No recipe ID or shape ID branch was added to deformation or shader behavior.

## 6. Jelly implementation — STRUCTURAL PASS / VISUAL CHECK REQUIRED

Jelly uses restrained translucency plus internal/rim light shaping rather than a separate transparency renderer. Alpha remains deliberately high enough to preserve the silhouette on the dark lab background.

This is structurally appropriate and cheap, but TypeScript/build validation cannot establish whether the exact alpha/light balance looks premium on a real phone. Phone acceptance remains required.

## 7. Holographic implementation — STRUCTURAL PASS / VISUAL CHECK REQUIRED

Holo uses one broad static spectral field mixed with existing base shading and compression. It adds no animation clock, render pass or recipe branch.

The implementation avoids high-frequency procedural noise/flicker by design. Exact taste/readability is still a visual product gate.

## 8. Pearl filling — PASS WITH PHONE QUALITY CHECK

Pearls reuse the existing add/shake interaction and filling-progress uniform. There are no physics bodies or runtime DOM particles.

Pearl occupancy is larger/sparser than foam. Critically, occupancy/reveal and shading derive from the same style-dependent density/offset cell transform, so the earlier foam grid/shading mismatch class of artifact is not reintroduced.

Visual size/highlight quality still needs phone inspection.

## 9. Existing craft feel — PASS

The reviewed diff does not change the accepted interaction constants for:

- paint coverage;
- shake path/speed/reversal progress;
- stretch/mix progress;
- mold normal/critical hits and decay.

A non-smooth filling simply selects the already existing add stage. Premium content therefore changes content presentation rather than tactile rules.

## 10. Progression — PASS

Ranks 1–6 and their previous unlock IDs/thresholds are unchanged.

The table extends only with:

- Rank 7 at 600 XP → two jelly recipes;
- Rank 8 at 700 XP → two holo recipes.

The existing exact-coverage invariant now checks all 16 canonical variants. Existing first/repeat XP values remain validation tuning.

## 11. Save/reset compatibility — PASS

SaveState V2 remains unchanged and stores opaque canonical IDs. The known-ID set expands from the canonical registry, so old completed IDs remain valid and new representative IDs can be persisted.

Historical XP/access-floor logic remains data-driven through required rank. The previously hardened reset flow is untouched.

## 12. Milestones — PASS

Half/full/shape-set milestone behavior remains derived from `ALL_VARIANTS` and per-shape recipe membership. No new hardcoded 8/16 milestone rules were introduced in production logic.

## 13. Scope — PASS

The diff does not introduce:

- a third shape;
- final catalog production;
- final recipe-browser UX;
- currency/shop/quests;
- analytics/ads;
- a new mini-game;
- a second shader program/renderer;
- large texture assets or simulated filling objects.

The only UI expansion is the minimum Collection **Make** plumbing required to reach curated recipes outside the legacy component selector.

## 14. Remaining product gate

Before Phase 7 catalog production is approved, the deployed phone build must answer three visual questions:

1. Does jelly read immediately as a different tactile material rather than washed-out transparency?
2. Does holo look premium rather than rainbow/noise-like?
3. Do Pearl beads look clearly larger/richer than foam without visible cell/grid artifacts?

Also confirm that old Soft Cube/Soft Heart recipes still feel unchanged while squeezing.

## Final verdict

**STRUCTURAL PASS.**

The high-CMF architecture survived the first representative material/filling expansion: 16 curated recipes, two new material families and one new filling family all fit the existing deformation/craft/runtime/save paths without bespoke recipe mechanics.

Do **not** declare Phase 6 product-complete until jelly/holo/pearls are visually accepted on the deployed phone build. If accepted, proceed to bounded catalog production rather than another architecture pass.