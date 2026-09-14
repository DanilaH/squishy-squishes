# Representative Content 01 — material/filling proof before catalog scale

**Date:** 2026-09-14
**Status:** APPROVED FOR IMPLEMENTATION
**Branch:** `representative-content-01`
**Prerequisite:** Phase 5 progression/collection phone acceptance passed.

## 1. Goal

Prove that the production shell can create visibly stronger recipe novelty from reusable material/filling parameters before the project commits to broad catalog production or UI polish.

This pass must answer:

1. Can two materially different visual families reuse the current shader/deformation path?
2. Can one new filling family reuse the existing add/shake interaction?
3. Can representative premium recipes be launched from Collection without inventing a second craft flow?
4. Can old saves and all 12 existing durable recipe IDs remain valid while the canonical catalog grows?
5. Does the content architecture remain cheap enough that the next batch is primarily config/content work rather than bespoke mechanics?

## 2. Phase-5 closure

Phase 5 is accepted for structural/product purposes because the deployed phone build has been exercised successfully with:

- Lab XP / Lab Rank progression;
- deterministic unlocks;
- Collection locked/available/completed states;
- completed-item revisit/free squeeze;
- durable save/reset behavior;
- repeated production Pages validation.

`IMPLEMENTATION_ROADMAP.md` must mark Phase 5 complete and Phase 6 active in this pass.

## 3. Non-goals

Do **not** add here:

- a third shape;
- the final 24-recipe launch catalog;
- a recipe-browser redesign;
- final Collection card art;
- currency/shop/orders/quests;
- ads/analytics expansion;
- new physics or a second shader program;
- new craft stages;
- bespoke interactions per recipe;
- particle-heavy simulated fillings;
- final XP balance claims;
- final UI/UX polish.

Only change UI where required to reach/test new recipes.

## 4. Representative content set

Grow the canonical validation catalog from **12 to 16 recipes** while preserving the original 12 IDs exactly.

Add four explicit curated recipes:

| Rank | ID | Working recipe | Purpose |
| ---: | --- | --- | --- |
| 7 | `aqua-jelly-pearls` | Pearl Jelly Cube | jelly + pearl filling proof |
| 7 | `heart-aqua-jelly-smooth` | Aqua Jelly Heart | jelly reuse on second shape |
| 8 | `prism-holo-smooth` | Holographic Prism Cube | holo material proof |
| 8 | `heart-prism-holo-pearls` | Holographic Pearl Heart | holo + pearl reuse together |

These are representative production recipes, not promises about final launch names/order.

## 5. Curated registry rule

Stop deriving the canonical catalog from the full Cartesian product.

Required architecture:

- keep reusable registries for shapes, palettes, materials and fillings;
- keep the old component selector limited to the proven 12 legacy combinations for now;
- define `ALL_VARIANTS` as an explicit curated recipe registry;
- preserve old ID generation for the 12 legacy soft recipes;
- assign stable IDs to representative recipes;
- unknown mathematical combinations must not silently become canonical recipes.

This is required before later catalog production: launch recipes are curated content, not every possible combination.

## 6. Material vocabulary in code

Introduce a small reusable material profile layer rather than encoding premium effects as recipe-specific branches.

Required material profiles:

- `soft` — current opaque soft baseline;
- `jelly` — translucent/candy-like body with stronger internal light transmission/readability;
- `holo` — spectral/iridescent treatment layered over the same body shader.

The renderer still uses **one fragment shader program**. Material profiles feed bounded uniforms/parameters such as:

- translucency;
- iridescence;
- existing low/high/sheen/rim colors;
- material seed.

No recipe ID or shape ID may branch inside shader/deformation behavior.

## 7. Palette additions

Add only the palette data needed by the representative recipes:

- `aqua` — clear aqua/cyan family suitable for jelly;
- `opal` — pale neutral/spectral base suitable for holographic treatment.

The legacy component selector continues to expose only grape/strawberry/lime during this pass. Aqua/opal are reached through curated Collection recipes.

## 8. Pearl filling

Add `pearls` as one reusable filling family.

Rules:

- reuse the existing `add` stage and pointer-shake progression;
- reuse existing high-frequency add audio unless a tiny parameter change is sufficient;
- render pearls as a distinct larger/sparser/highlighted internal pattern compared with foam beads;
- no physics bodies;
- no per-pearl DOM nodes;
- no new mini-game.

The add-stage copy may become filling-generic so both Foam Beads and Pearls read correctly.

## 9. Renderer API

Extend the existing `SquishSurface` API only with bounded style state.

Expected direction:

- `SquishMaterialStyle` gains reusable material parameters such as `translucency` and `iridescence`;
- renderer owns one small filling-style state (`none` / `foam` / `pearl` or equivalent);
- uniforms are allocated once;
- no per-frame object creation is introduced for material/filling config;
- shape texture/deformation mesh remain unchanged.

## 10. Shader quality rules

### Jelly

Jelly must read as materially different from baseline without disappearing against the dark lab:

- preserve strong silhouette;
- use restrained alpha/transmission/internal glow;
- keep rim readable;
- filling remains visible;
- avoid washed-out flat transparency.

### Holographic

Holo must read through spectral variation, not a rainbow noise soup:

- one broad spectral field/band treatment;
- subtle response to compression/strain is allowed;
- preserve base form shading and tactile sheen;
- avoid high-frequency flicker;
- no time-driven animation required in this pass.

### Pearls

- larger and sparser than foam beads;
- soft bright body + compact highlight/iridescent tint;
- use the exact same cell transform for occupancy and shading to avoid the bead-grid artifact already fixed in earlier passes.

## 11. Selection / Collection reachability

The old component selector remains a legacy validation surface and should not grow new material controls yet.

Collection becomes the test launcher for curated premium recipes:

- `available` cards get a **Make** action;
- pressing Make selects that recipe and starts the existing craft flow;
- `completed` cards retain **Squeeze**;
- `locked` cards retain required-rank tease;
- no new route/scene/state machine.

This small behavior is functional plumbing, not the final recipe-browser UX.

## 12. Craft behavior

For every representative recipe:

- paint/pour remains unchanged;
- any non-smooth filling uses the existing add/shake stage;
- mix remains unchanged;
- mold remains unchanged;
- reveal/test/collect remain unchanged;
- material/filling presentation must survive free squeeze.

No tactile tuning constants from Interaction Pass 04 change unless a regression forces a separately documented correction.

## 13. Progression extension

Extend validation progression to ranks 7–8 only:

- Rank 7 threshold: **600 XP**;
- Rank 8 threshold: **700 XP**.

Unlocks:

- Rank 7 → Pearl Jelly Cube + Aqua Jelly Heart;
- Rank 8 → Holographic Prism Cube + Holographic Pearl Heart.

Keep +100 first completion / +25 repeat unchanged for this validation pass.

These remain temporary pacing values.

## 14. Durable-save compatibility

Keep `SaveStateV2`.

Requirements:

- all 12 previous IDs remain known and unchanged;
- existing V2 saves load without migration;
- newly added IDs become valid completed IDs;
- historical-XP/access-floor behavior remains valid;
- reset-progress behavior continues clearing V2 + migration sources safely.

Do not bump save version merely because the known-content registry expanded.

## 15. Collection/milestones

The Collection total becomes 16 automatically from canonical content.

Existing pure milestone rules remain data-driven:

- half catalog becomes 8/16;
- full shape set uses the actual curated recipe count for that shape;
- full catalog becomes 16/16.

No milestone-specific hardcoded counts may be added.

## 16. i18n/content copy

Add typed RU/EN UI copy only where behavior changes (for example Collection Make and generic add-stage copy).

Working recipe/palette/material names can remain production content labels as the existing project currently does; do not start a content-localization subsystem in this pass.

## 17. Performance constraints

- still one WebGL2 program;
- still one 17×17 spring mesh;
- no extra render pass;
- no runtime particle simulation;
- no large textures/assets;
- representative phone performance must remain comparable to current build.

## 18. Acceptance criteria

### Content/domain

- canonical catalog contains exactly 16 unique IDs;
- original 12 IDs are byte-for-byte unchanged;
- canonical registry is explicit/curated, not Cartesian;
- two new material profiles are reused across both current shapes;
- Pearl filling is reused by at least two representative recipes;
- rank table covers all 16 variants exactly once.

### Rendering

- jelly reads visibly different from soft;
- holo reads visibly different from soft/jelly;
- pearls read visibly different from foam beads;
- no new bead/grid seam artifacts;
- all effects deform with the same mesh and survive squeeze;
- no shape/recipe-specific shader branch.

### Gameplay

- Collection Make can launch an available representative recipe;
- non-smooth representative recipes use the existing shake stage;
- no interaction tuning regression on old 12 recipes;
- completed premium recipes can be reopened through Squeeze.

### Persistence/progression

- existing V2 saves load;
- old completed recipes remain completed;
- rank 7/8 unlock deterministically;
- reset-progress still yields a fresh rank-1 state.

### Engineering

- strict typecheck passes;
- production build passes;
- final diff independently reviewed;
- temporary implementation tooling removed before merge;
- Pages deploy succeeds before phone handoff.

## 19. Independent-review questions

Before implementation, explicitly challenge:

1. Are we accidentally building the final recipe browser?
2. Are material features generic or recipe-specific?
3. Does explicit catalog conversion risk changing old IDs?
4. Can hidden premium palette/filling choices leave the legacy selector in an invalid state?
5. Does new filling logic create another mini-game branch?
6. Can alpha/translucency produce unreadable results on the current dark background?
7. Does progression expansion preserve old saves and access floors?
8. Are the four recipes visually distinct enough to justify the added code?

## 20. Stop rules

Stop and repair before catalog production if:

- premium recipes require bespoke shader branches by recipe ID;
- jelly/holo require separate renderers;
- Pearl needs simulated objects to look acceptable;
- old IDs change;
- Collection launch duplicates craft state;
- representative content makes the current shader unreadable/unmaintainable;
- performance regresses materially on phone;
- new content still looks like palette swaps rather than material novelty.

## 21. Exit gate

Phase 6 passes when the deployed build demonstrates:

```text
old 12 recipes still work
→ rank 7/8 reveal four curated premium recipes
→ Collection Make launches them through the same craft loop
→ jelly / holo / pearls read as distinct reusable content families
→ completed premium recipes survive revisit/free squeeze
→ no bespoke recipe mechanics or renderer fork was needed
```

Only after this product check should broad catalog/shape production begin.