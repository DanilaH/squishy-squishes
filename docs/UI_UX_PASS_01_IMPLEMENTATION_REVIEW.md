# UI/UX Pass 01 — Implementation Review

**Verdict:** STRUCTURAL PASS — MANUAL PHONE VISUAL QA DEFERRED

## What changed

The validation-era component selector was removed from the player-facing select shell and replaced with a canonical recipe-first flow.

Implemented:

- one selected canonical recipe at the bottom of the lab;
- compact recipe metadata instead of Shape / Color / Texture construction controls;
- one Browse Recipes control opening the existing Collection overlay;
- the existing Collection overlay promoted into the primary recipe browser;
- all canonical recipes rendered from the existing progression snapshot;
- completed recipes now expose both `Make again` and `Squeeze`;
- generic card thumbnails generated from the canonical `ShapeDefinition.boundary` data;
- reusable soft / jelly / holo and foam / pearl thumbnail cues;
- stronger available / completed / locked hierarchy;
- responsive recipe dock/card layout;
- RU/EN copy updated for recipe-first terminology.

## Actual diff boundary

Changed files at final structural review:

- `docs/UI_UX_PASS_01.md`
- `docs/UI_UX_PASS_01_REVIEW.md`
- `src/game/VerticalSliceApp.ts`
- `src/i18n/en.ts`
- `src/i18n/ru.ts`
- `src/main.ts`
- `src/ui-ux-pass-01.css`

No changes to:

- `src/game/content.ts`;
- `src/game/progression.ts`;
- `src/game/shapes.ts`;
- `src/game/SquishyAudio.ts`;
- `src/squish/SquishSurface.ts`;
- shaders;
- save/storage/runtime semantics;
- paint / shake / mix / mold constants or handlers;
- Lab XP/rank tuning;
- canonical recipe IDs.

## Navigation correctness

The pass deliberately reuses the existing Collection surface instead of introducing another modal/router/state model.

`Make` / `Make again` use the existing canonical launch path:

1. resolve `VariantSpec` by id;
2. verify current unlock state;
3. assign the canonical `VariantChoice`;
4. update the shared renderer selection;
5. close the browser;
6. enter the existing `pour` stage.

`Squeeze` keeps the existing completed-item revisit path into the finished `test` state.

This closes the previous reachability asymmetry where premium/new-shape recipes depended on Collection as a temporary seam while completed recipes primarily exposed only revisit.

## Thumbnail architecture

No bespoke recipe images were introduced.

Each card derives its silhouette from the same `ShapeDefinition.boundary` used by runtime shape systems, then applies generic palette/material/filling presentation. This preserves the high-CMF production thesis and prevents a second shape-art source of truth.

## Validation

Temporary assert-backed patch tooling was used only to safely modify the large legacy class through GitHub Actions and was removed from the final branch.

Validation run `34874484160` passed:

- patch application;
- `git diff --check`;
- clean dependency install;
- strict TypeScript validation;
- GitHub Pages production build;
- Yandex production build;
- Yandex dist verifier;
- commit of the exact validated source;
- removal of temporary patch/workflow files.

A final CSS review also corrected inherited two-row collection-card grid geometry before the validated source was committed.

## Deferred manual visual gate

The owner explicitly deferred phone/manual checking while asking development to continue. Therefore this pass must not be described as visually accepted yet.

When the manual check happens, verify at minimum:

- recipe dock does not cover or shrink the hero excessively on phone portrait;
- Recipes / Make controls remain comfortably tappable;
- all six shape silhouettes read correctly at card size;
- jelly/holo/foam/pearl thumbnail cues are useful rather than noisy;
- completed cards clearly offer both recraft and revisit;
- locked cards remain legible/aspirational;
- scroll behavior inside the recipe browser does not leak into the WebGL interaction surface;
- RU recipe/action labels do not clip;
- desktop short-height and mobile landscape remain usable.

## Next product gate

This structural pass does **not** finish the product.

Next bounded work should address full feel / art / audio / reward presentation:

- remove remaining prototype/internal-tool presentation residue;
- improve reveal anticipation and stable-result ownership;
- create bounded reward hierarchy across ordinary vs premium material/filling results;
- add material-sensitive audio nuance without fatigue;
- strengthen Collect causality and progression acknowledgement;
- preserve the accepted interaction state machine and catalog.
