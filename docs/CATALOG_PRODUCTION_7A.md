# Catalog Production 7A — Mochi + Peach

**Date:** 2026-09-14
**Status:** ACTIVE BOUNDED SPEC
**Branch:** `phase-7a-mochi-peach`
**Prerequisite:** Phase 6 representative material/filling content accepted on phone after the spring-release visual correction.

## 1. Goal

Prove that catalog production is now cheaper than the representative-content phase by adding two materially different silhouettes and four curated recipes through the existing shared renderer, craft loop, progression and Collection plumbing.

This batch must answer:

1. Can Mochi and Peach/Fruit Puff exist as `ShapeDefinition` data only?
2. Can both shapes reuse paint, add/shake, mix/stretch, mold, reveal and free squeeze without shape-specific mechanics?
3. Can four desirable recipes reuse the accepted soft/jelly/holo/pearls vocabulary with only cheap palette additions?
4. Can the catalog grow from 16 to 20 without reopening save architecture or rank thresholds?
5. Does the old component selector remain a bounded Cube/Heart validation surface rather than accidentally exposing a Cartesian catalog?

## 2. Product scope

Add exactly two shapes:

- `mochi` — rounded low-profile bun/mochi silhouette;
- `peach` — round fruit-puff silhouette with a readable top cleft and slightly weighted lower point.

Add exactly four canonical recipes:

| Rank | ID | Working recipe | Main proof |
| ---: | --- | --- | --- |
| 2 | `mochi-milk-soft-smooth` | Milk Mochi | new silhouette + cheap opaque palette |
| 3 | `peach-peach-soft-smooth` | Peach Milk Puff | second new silhouette + cheap warm palette |
| 7 | `peach-strawberry-jelly-smooth` | Sakura Jelly Peach | accepted jelly reused on Peach |
| 8 | `mochi-prism-holo-pearls` | Galaxy Pearl Mochi | accepted holo + pearls reused on Mochi |

Catalog total after this pass: **20 canonical recipes**.

This is intentionally four recipes, not eight. The project already has 16 canonical recipes; filling the 24-item working target immediately on only four shapes would create future catalog pressure before Mushroom/Paw/Blob candidates are evaluated. Small-batch review is the point of Phase 7.

## 3. Palette additions

Add only two reusable palettes:

- `milk` — warm cream/ivory soft body;
- `peach` — warm peach/coral body.

Do not add new material families, filling families, decals, particles, chrome, confetti or oil in 7A.

`Galaxy Pearl Mochi` uses existing `prism + holo + pearls`.
`Sakura Jelly Peach` uses existing `strawberry + jelly + smooth`.

## 4. Shape implementation rule

Both shapes must use the existing normalized polygon boundary representation.

Allowed:

- new boundary generator functions;
- point-count constants;
- registration in `SHAPES`;
- shared selector filtering metadata/helper.

Forbidden:

- `if (shape.id === 'mochi')` or `if (shape.id === 'peach')` in renderer physics;
- per-shape spring constants;
- per-shape pointer behavior;
- per-shape craft-stage timing;
- separate shader paths;
- hand-authored vertex physics;
- decorative sub-meshes.

If either silhouette needs a bespoke deformation fix, stop and repair the generic shape representation instead.

## 5. Curated catalog safety

Adding shapes must **not** make `LEGACY_VARIANTS` Cartesian over all shapes.

Required structure:

- `SHAPES` contains every production shape used by Collection/rendering;
- `SELECTOR_SHAPES` contains only `soft-square` and `heart` for the temporary legacy component selector;
- legacy 12 variants continue to derive only from `SELECTOR_SHAPES × legacy palettes × legacy fillings`;
- Mochi/Peach recipes exist only as explicit curated entries;
- all previous 16 IDs remain unchanged.

The legacy selector must also normalize hidden curated shape/material/palette/filling state back to a valid legacy combination when the user touches old selector controls.

## 6. Progression

Keep:

- `LabRank` 1–8;
- thresholds 0/100/200/300/400/500/600/700 XP;
- +100 first completion;
- +25 repeat completion;
- `SaveStateV2`.

Add recipes to existing ranks only:

- Rank 2 → Milk Mochi;
- Rank 3 → Peach Milk Puff;
- Rank 7 → Sakura Jelly Peach;
- Rank 8 → Galaxy Pearl Mochi.

Do not claim this is final launch pacing.

## 7. Collection / QA behavior

Collection must automatically expose four shape groups and 20 recipes from the existing pure read model.

The existing production QA panel remains available and should automatically see all 20 canonical recipe IDs. No new QA architecture is needed.

No recipe-browser redesign in this pass.

## 8. Persistence

Keep `SaveStateV2` unchanged.

Requirements:

- previous completed IDs remain valid;
- new IDs become known canonical IDs;
- historical XP/access-floor behavior remains valid;
- no migration required merely because registries expanded;
- reset progress remains unchanged.

## 9. Rendering / interaction acceptance

Mochi:

- visually distinct from Soft Cube at idle and during stretch;
- broad rounded silhouette, no accidental square corners;
- jelly/holo/pearls remain coherent under squeeze;
- paint coverage and mold target remain fair.

Peach:

- top cleft remains readable but does not collapse into a Heart clone;
- lower silhouette stays rounded/fruit-like under squeeze;
- jelly remains readable against the dark lab;
- no concavity hit-test/paint holes.

Shared:

- spring release remains visually coherent after the Phase 6 correction;
- no input/FPS regression;
- same mesh/shader/craft state machine for all four shapes.

## 10. Non-goals

Do not add:

- Mushroom/Paw/Blob yet;
- more than four new recipes;
- new rank numbers or XP rebalance;
- final recipe browser;
- final Collection art;
- new material/filling mechanics;
- decals/faces/leaves;
- new sound families;
- Yandex/ads/analytics work;
- save-version changes;
- shared-kit upgrade;
- broad UI polish.

## 11. Engineering acceptance

- exactly four production shapes registered;
- legacy selector exposes exactly Cube + Heart;
- exactly 20 unique canonical recipe IDs;
- original 16 IDs unchanged;
- progression table covers all 20 exactly once;
- no shape-specific physics/material branch;
- strict typecheck passes;
- production build passes;
- temporary validation tooling removed;
- final diff independently reviewed;
- Pages deployment succeeds.

## 12. Phone gate

Before any 7B work, manually check on the deployed phone build:

1. Milk Mochi — silhouette/readability/paint/mold/squeeze.
2. Galaxy Pearl Mochi — holo + pearls under stretch/release.
3. Peach Milk Puff — Peach silhouette is not a Heart clone.
4. Sakura Jelly Peach — cleft + jelly remain readable during squeeze.
5. Old Cube/Heart — no regression.

Only after this gate decide whether the next batch should deepen Mochi/Peach recipes or add the next silhouette candidate.