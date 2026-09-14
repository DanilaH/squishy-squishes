# Catalog Production 7B — Mushroom + Paw

**Date:** 2026-09-14
**Status:** ACTIVE BOUNDED SPEC
**Branch:** `phase-7b-mushroom-paw`
**Prerequisite:** Phase 7A Mochi + Peach accepted on deployed phone build.

## 1. Goal

Finish the current working MVP catalog target by proving two more materially different silhouettes through the same generic shape/render/craft/progression system.

This batch should take the game from:

- 4 production shapes → **6 production shapes**;
- 20 canonical recipes → **24 canonical recipes**.

The important result is not hitting a number. The important result is that recipes #21–24 remain cheaper than the earlier representative-content work and require no new rendering/gameplay subsystem.

## 2. Shape scope

Add exactly two shapes:

- `mushroom` — broad rounded cap, narrow central stem, readable under squash;
- `paw` — rounded palm silhouette with four visible toe lobes.

Both must remain a single normalized closed boundary and reuse the existing `ShapeDefinition` path.

Do not add Blob Creature in 7B. With the current primitives, Blob's planned identity depends too heavily on face/decal/internal cyber accents; adding it now would either look generic or smuggle in new systems. Keep Blob as reserve/post-MVP until evidence justifies a reusable decoration family.

## 3. Curated recipes

Add exactly four canonical recipes:

| Rank | ID | Working recipe | Main proof |
| ---: | --- | --- | --- |
| 4 | `mushroom-milk-soft-smooth` | Vanilla Mushroom | Mushroom silhouette with existing opaque palette |
| 5 | `paw-milk-soft-smooth` | Milk Paw | Paw silhouette with existing opaque palette |
| 6 | `mushroom-grape-jelly-smooth` | Grape Glow Mushroom | accepted jelly reused on Mushroom |
| 8 | `paw-prism-holo-pearls` | Aurora Paw | accepted holo + pearls reused on Paw |

No new palette, material, filling, decal, particle or audio family is allowed in this pass.

Catalog total after this pass: **24 canonical recipes**.

## 4. Shape implementation rules

Allowed:

- new boundary generator functions in `src/game/shapes.ts`;
- bounded helper math local to shape construction;
- registration in the existing production shape registry.

Forbidden:

- shape-specific branches in renderer physics;
- shape-specific spring constants;
- shape-specific interaction timing;
- special paint or mold logic;
- shader changes just to rescue a silhouette;
- secondary meshes for mushroom cap/stem or paw pads;
- DOM/SVG decorative overlays.

If Mushroom or Paw needs bespoke runtime behavior, stop and reduce/repair the boundary instead.

## 5. Mushroom quality rule

Mushroom must read from silhouette alone:

- broad cap;
- visible cap overhang/shoulder;
- narrower stem;
- rounded lower stem;
- no detached parts or internal cap line.

The neck concavity must remain paintable and fair for mold targets.

## 6. Paw quality rule

Paw must read from silhouette alone:

- four toe lobes visible at normal phone size;
- broad rounded palm/body;
- toes must remain rounded rather than spikes;
- no separate pad decals in this phase.

If four toes become unreadable on the 17×17 deformation mesh, simplify the boundary rather than increasing mesh density.

## 7. Progression

Keep Lab Rank 1–8 and all thresholds/XP awards unchanged.

Placement:

- Rank 4 → Vanilla Mushroom;
- Rank 5 → Milk Paw;
- Rank 6 → Grape Glow Mushroom;
- Rank 8 → Aurora Paw.

This gives fresh progression a new silhouette at Rank 2 (Mochi), Rank 3 (Peach), Rank 4 (Mushroom), and Rank 5 (Paw) without inventing Rank 9/10.

Existing Rank 8 saves receive access to the entire 7B batch automatically.

## 8. Selector / Collection

The temporary component selector remains Cube + Heart only.

Mushroom and Paw are curated Collection recipes exactly like Mochi/Peach. No recipe-browser redesign is included.

Collection should automatically expand to six shape groups and 24 recipes from existing data-driven code.

## 9. Persistence

Keep `SaveStateV2` unchanged.

Requirements:

- previous 20 canonical IDs remain unchanged;
- four new IDs become known canonical IDs;
- no migration;
- reset behavior unchanged;
- historical XP/access-floor behavior remains valid.

## 10. Non-goals

Do not add:

- Blob Creature;
- more than four recipes;
- Rank 9/10;
- XP rebalance;
- new materials/fillings/palettes;
- mushroom two-tone cap/stem rendering;
- paw-pad decals;
- stars/sparkles/circuit motifs;
- final recipe browser;
- broad Collection/UI polish;
- platform/ads/analytics work;
- shared-kit upgrade.

## 11. Engineering acceptance

- exactly six production shapes registered;
- temporary selector still exposes exactly Cube + Heart;
- exactly 24 unique canonical recipe IDs;
- previous 20 IDs unchanged;
- progression covers all 24 exactly once;
- no renderer/shader/audio/save changes;
- strict typecheck passes;
- production build passes;
- final diff independently reviewed;
- Pages deploy succeeds.

## 12. Phone gate

Before moving out of catalog production, manually check:

1. Vanilla Mushroom — unmistakable Mushroom silhouette; neck paint/mold fair.
2. Grape Glow Mushroom — jelly still preserves cap/stem readability under squeeze/release.
3. Milk Paw — four toes visible at idle and under moderate stretch; no spiky look.
4. Aurora Paw — holo + pearls remain coherent across toe lobes and spring return.
5. Regression — Cube/Heart/Mochi/Peach still behave normally.

If all five pass, Phase 7 can close at the working **6 shapes / 24 recipes** target and the project should move to presentation/UI/platform work rather than automatically adding more catalog.
