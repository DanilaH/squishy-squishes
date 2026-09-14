# Catalog Production 7B — independent pre-implementation review

**Date:** 2026-09-14
**Spec:** `CATALOG_PRODUCTION_7B.md`
**Verdict:** PASS WITH SCOPE LOCK

## 1. Why Mushroom + Paw

The project currently has four accepted silhouettes and 20 recipes. Adding Mushroom + Paw with two recipes each reaches the working MVP target of six shapes / 24 recipes without inventing additional content systems.

Both silhouettes are useful generic-path tests:

- Mushroom introduces a strong cap-to-stem width transition and concave shoulders;
- Paw introduces four small repeated lobes that stress small-screen silhouette readability and the existing coarse spring mesh.

This is a better final catalog proof than adding more Mochi/Peach recipes now.

## 2. Why not Blob Creature

Blob is deferred deliberately.

The current working Blob recipes depend on face/decal, bubbles, galaxy/cyber internals or other accents for identity. With today's primitives, a plain Blob risks being visually generic; making it desirable would likely pull a reusable decoration/internal-detail subsystem into a pass whose purpose is cheap catalog production.

Do not add a weak Blob merely to preserve an old candidate list.

## 3. Recipe review

Accepted recipes:

- Vanilla Mushroom = existing milk + soft + smooth;
- Grape Glow Mushroom = existing grape + jelly + smooth;
- Milk Paw = existing milk + soft + smooth;
- Aurora Paw = existing prism + holo + pearls.

This is intentionally cheaper than 7A: **zero new palettes and zero new material/filling features**.

Names are working content labels. No localization/content naming subsystem is added.

## 4. Progression review

Keep Rank 1–8.

Place the first Mushroom at Rank 4 and first Paw at Rank 5. This creates a clean early shape cadence:

- Rank 2 — Mochi;
- Rank 3 — Peach;
- Rank 4 — Mushroom;
- Rank 5 — Paw.

Second recipes at Rank 6 and Rank 8 add material escalation without changing XP thresholds.

No Rank 9/10 is justified while progression values are still validation tuning.

## 5. Mushroom geometry risk

Mushroom should be represented as one simple closed outline with a wide cap and narrow stem. The main risk is an overly sharp shoulder/neck creating unfair paint coverage or mold-target sampling.

Correction rule: soften the neck transition in the boundary. Do not add special paint/mold code.

A separate cap/stem mesh or two-tone render path would fail the phase objective.

## 6. Paw geometry risk

Paw is the highest-risk silhouette in 7B because four toe lobes may become noisy or disappear on the existing 17×17 spring mesh.

The correct response is not higher mesh density. Use a deliberately simplified toy-paw outline: four broad rounded lobes plus one broad palm.

If the result only reads as Paw when tiny internal pad marks are added, reject or simplify the shape rather than adding decals in this pass.

## 7. Curated-catalog / selector safety

7A already separated production `SHAPES` from `SELECTOR_SHAPES`. 7B must preserve that architecture unchanged.

Mushroom/Paw must not appear in the old component selector and must not expand `LEGACY_VARIANTS`.

No additional selector code should be necessary.

## 8. Expected production diff

Production code should be limited to:

- `src/game/shapes.ts`;
- `src/game/content.ts`;
- `src/game/progression.ts`.

Roadmap/content docs may be updated.

`VerticalSliceApp.ts` should not need another functional change. Renderer, shaders, audio, save repositories and platform code must remain untouched.

## 9. Stop rules

Stop before merge if:

- Mushroom requires separate cap/stem rendering;
- Paw requires pad decals to be recognizable;
- either shape needs renderer/physics branching;
- the mesh must be densified specifically for Paw;
- new palettes/materials/fillings are introduced just to make these four recipes work;
- catalog IDs or save schema change unnecessarily.

## 10. Verdict

Proceed with exactly two shapes and four recipes.

If the implementation stays within three production files and passes phone silhouette checks, the high-CMF catalog thesis has enough evidence to stop expanding content architecture and move into the next product phase.
