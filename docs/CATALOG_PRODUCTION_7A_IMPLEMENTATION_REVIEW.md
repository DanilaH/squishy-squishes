# Catalog Production 7A — independent implementation review

**Date:** 2026-09-14
**Branch:** `phase-7a-mochi-peach`
**Base:** `main@0b2310c0fc8036fad446fa99ce4c94467ecd31a6`
**Verdict:** STRUCTURAL PASS — PHONE CONTENT ACCEPTANCE PENDING

## Review scope

The final source diff was reviewed after the bounded implementation, selector hardening, strict branch validation and removal of temporary patch/validation tooling.

Validation run `34856949079` passed:

- bounded selector patch application;
- dependency install;
- strict `npm run typecheck`;
- production `npm run build`;
- commit of the exact validated selector source.

The final compare against `main` contains only:

- `src/game/shapes.ts`;
- `src/game/content.ts`;
- `src/game/progression.ts`;
- `src/game/VerticalSliceApp.ts`;
- Phase 7A / roadmap documentation.

No renderer, shader, audio, save, platform or shared-kit file changed.

## 1. Batch size — PASS

The implementation adds exactly four canonical recipes, taking the catalog from 16 to 20 rather than prematurely filling the working ~24-recipe target.

This leaves room to evaluate later silhouette candidates before the catalog becomes structurally committed to only Cube/Heart/Mochi/Peach.

## 2. Shape architecture — PASS

Two production shapes were added through the existing `ShapeDefinition` boundary representation:

- `mochi`;
- `peach`.

Both are generated as normalized polygon boundaries and therefore automatically reuse:

- shape-field generation;
- renderer masking;
- pointer hit testing;
- paint eligibility/clipping;
- mold target validation;
- the existing spring mesh/deformation path.

No `mochi`/`peach` branch was added to `SquishSurface`, shaders, stage math, audio or interaction constants.

A separate boundary inspection confirmed the two silhouettes are materially distinct from each other and from the existing Heart: Mochi is a low rounded bun, while Peach is a broad fruit body with a shallow upper cleft rather than the Heart's deep concavity and pointed lower half.

## 3. Curated-catalog isolation — PASS

The pre-review found the main architecture trap: deriving legacy variants from every production shape would silently create a Cartesian catalog.

The implementation prevents this with `SELECTOR_SHAPES`, limited to Soft Cube + Soft Heart. Legacy variants continue to derive only from:

`selector shapes × legacy palettes × legacy fillings`

Mochi and Peach exist only through four explicit curated entries.

The original 16 canonical IDs remain unchanged.

## 4. Legacy selector hardening — PASS

The temporary component selector still renders only Cube + Heart.

After a Collection-launched Mochi/Peach recipe returns to Select, touching a legacy color or filling control now also normalizes hidden shape state back to `soft-square`, alongside the existing premium material/palette/filling normalization.

This prevents hidden curated shapes from combining with arbitrary legacy selector components into non-canonical states.

## 5. Palettes — PASS

Only two cheap reusable palettes were added:

- `milk` / Warm Milk;
- `peach` / Peach Cream.

No new material family, filling family, texture asset, decal or effect system was added.

## 6. Recipes — PASS

Canonical Phase 7A recipes:

- Rank 2 — `mochi-milk-soft-smooth` — Milk Mochi;
- Rank 3 — `peach-peach-soft-smooth` — Peach Milk Puff;
- Rank 7 — `peach-strawberry-jelly-smooth` — Sakura Jelly Peach;
- Rank 8 — `mochi-prism-holo-pearls` — Galaxy Pearl Mochi.

The batch deliberately exercises:

- opaque soft on both new silhouettes;
- accepted jelly on Peach;
- accepted holo + pearls on Mochi;
- new palettes without new behavior.

## 7. Progression — PASS

Lab Rank remains 1–8 with unchanged thresholds and unchanged first/repeat XP awards.

The four recipes are inserted into existing Rank 2/3/7/8 buckets. The exact-coverage invariant now covers all 20 canonical recipe IDs once.

No balance claim is made beyond validation pacing.

## 8. Save compatibility — PASS

`SaveStateV2` is unchanged.

The catalog registry simply learns four additional canonical IDs. Existing completion IDs remain valid; no migration is required.

Reset behavior and historical XP/access-floor logic are untouched.

## 9. Renderer / tactile scope — PASS

No changes were made to:

- `SquishSurface.ts`;
- shader sources;
- spring constants;
- release behavior;
- paint tuning;
- shake tuning;
- mix tuning;
- mold tuning;
- tactile/reveal audio.

This is the desired production-burden result: the next silhouettes/content batch did not require a renderer or mechanic pass.

## 10. Temporary tooling — PASS

A temporary branch-only selector patch script/workflow was used because the GitHub connector exposes full-file replacement rather than text patch writes for the large `VerticalSliceApp.ts` file.

It caught one unused import on the first attempt. The corrected run passed strict typecheck/build and committed the exact validated source. Both temporary files were then deleted.

Neither temporary file remains in the final compare against `main`.

## 11. Remaining product gate

Structural validation cannot establish whether the new silhouettes are desirable and readable under real touch deformation.

After deployment, phone QA must check:

1. **Milk Mochi** — clearly a rounded mochi/bun, not a flattened Cube; paint/mold feel fair.
2. **Galaxy Pearl Mochi** — holo + pearls remain coherent while stretching and during spring release.
3. **Peach Milk Puff** — reads as a fruit puff and does not collapse visually into Heart.
4. **Sakura Jelly Peach** — shallow cleft and body silhouette remain readable through jelly/translucency.
5. **Regression** — Cube/Heart, old premium recipes, input and FPS remain unchanged.

## Final verdict

**STRUCTURAL PASS — PHONE CONTENT ACCEPTANCE PENDING.**

Phase 7A has achieved the engineering objective: two new silhouettes, two cheap palettes and four curated recipes were added through the existing generic content/render/progression machinery with no bespoke renderer, shader, physics, interaction or persistence work.

Do not start Phase 7B until the deployed Mochi/Peach batch passes the phone gate.