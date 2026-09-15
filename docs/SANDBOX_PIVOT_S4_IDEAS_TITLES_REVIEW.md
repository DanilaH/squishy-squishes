# Sandbox Pivot S4 — Independent Pre-Implementation Review

**Status:** PASS WITH HARD CONSTRAINTS
**Reviewed spec:** `SANDBOX_PIVOT_S4_IDEAS_TITLES.md`
**Base:** `main@87855d4c0483e9b0ccdc38130d0fde88a0ee3eeb`

## Verdict

Proceed with S4, but keep the implementation materially smaller than the old recipe-first product.

The existing SaveState V3 already contains `completedRecipeIds`, and the canonical 24 variants already provide stable IDs and useful metadata. Reusing those boundaries is justified. Reusing the old recipe-first UI, rank gates, XP model or selector authority is not.

## Hard constraints

1. **One maker only.** Idea mode must pass context into the same `SandboxApp`. No duplicate stage machine.
2. **No unlock authority.** Completed Ideas and titles cannot affect shape/material/decor availability.
3. **No SaveState V4.** `completedRecipeIds` is sufficient.
4. **No toy↔Idea ownership coupling.** Do not persist an Idea ID on `SavedSquishy` in S4.
5. **Completion only after successful save.** A matching unsaved draft earns nothing.
6. **Loose metadata matching only.** Shape + used paint color + material + optional mapped mix-in is enough. Never compare rendered pixels or coverage.
7. **Smooth means no required mix-in, not “must contain zero mix-ins”.** Creative deviation must remain legal.
8. **Decor remains optional.** Do not force S3 content into migrated legacy recipes merely to make recipe matching look richer.
9. **Library remains primary.** Ideas is secondary to `New Squishy` and saved toys.
10. **No S5 leakage.** No rewarded unlocks, extra slots, premium packs or interstitial changes in this phase.

## Architecture review

Recommended ownership:

- `ideas.ts`: canonical Idea derivation + matching;
- `titles.ts`: pure completed-count → title derivation;
- `SandboxApp`: render read-only guidance from an optional Idea; expose no persistence;
- `SandboxLibraryApp`: Ideas navigation and active Idea selection;
- `bootstrap.ts`: transactional save + completion persistence;
- `saveV3.ts`: bounded idempotent completion helper.

This is preferable to placing progression logic in `SandboxApp` or inflating `SavedSquishy`.

## Matching review

The proposed mapping from legacy palette to current six sandbox paint swatches is acceptable because it is explicit product translation, not visual recognition.

A paint requirement should be considered satisfied when at least one persisted paint-mode stroke has the exact target sandbox color. Do not require a minimum coverage percentage or arbitrary point count; the sandbox explicitly permits minimal creative marks.

Mapped fillings:

- `smooth → null`;
- `beads → foam`;
- `pearls → pearls`.

This preserves recognizable intent without inventing physics or unavailable content.

## Title review

The 0/2/5/8/12/16/20/24 thresholds are monotonic and fit the 24-Idea source set. Titles are derived state and should not be persisted separately. This prevents save drift and makes migrated completion credit deterministic.

## UI review

Avoid a 24-card spreadsheet. Cards should communicate only:

- visual/shape cue;
- name;
- target color/material;
- optional mix-in;
- completed state.

No filters, categories, pagination, detail pages or progress bars in S4.

In-maker guidance should be a compact strip/chip cluster, not a side panel. The toy must remain the dominant visual object.

## QA review

Permanent QA must distinguish three truths:

- ordinary sandbox still works without Ideas;
- Idea context does not constrain creation;
- completion occurs only when a successfully saved draft matches.

At least one Browser QA path must deliberately choose a different shape from the suggested one and still save, proving Ideas are non-gating.

## Stop conditions

Stop/reduce scope if implementation starts requiring:

- another navigation shell inside the maker;
- substantial changes to WebGL/appearance/decor rendering;
- title persistence;
- recipe-specific save schemas;
- more than a small additive extension to Library UI;
- recipe-specific branches through every maker stage.

## Decision

**Proceed.** The slice is justified if it remains a thin optional layer over the already-proven sandbox/library product.
