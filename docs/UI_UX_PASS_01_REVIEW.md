# UI/UX Pass 01 — Independent Pre-Implementation Review

**Verdict:** PASS WITH CORRECTIONS

The direction is correct: the validation-era component selector is now the largest navigation mismatch in the product. However, the implementation must remain smaller than a full shell rewrite.

## Corrections

### 1. Do not create a second browser

The existing Collection overlay already owns canonical recipe states and progression. Promote it into the primary recipe browser instead of adding a new modal, route or state machine.

Both the top-level Collection/Recipes entry and the select-screen Browse control should open the same overlay.

### 2. Preserve craft state machine untouched

Recipe browsing may assign `selected: VariantChoice`, close the overlay and call the existing `setStage('pour')`. It must not add a parallel craft-launch path or duplicate stage logic.

### 3. Completed cards need two distinct intentions

A completed recipe has two valid jobs:

- `Make again` — run the full craft loop and earn repeat XP;
- `Squeeze` — enter the existing revisit/test state without crafting.

Do not overload one action or hide recrafting behind the old component selector.

### 4. Generic thumbnail must reuse shape data

Do not hand-author six CSS silhouettes. Generate an inline SVG polygon/path from `ShapeDefinition.boundary` so the card preview stays coupled to the same canonical silhouette data used by the renderer/paint/mold system.

Material/filling cues should be generic presentation classes/data attributes only.

### 5. Avoid a large `VerticalSliceApp` refactor

This pass may remove legacy selector DOM/query/event code, but it should not split or rewrite the interaction state machine. The highest-risk code in paint/shake/mix/mold/reveal is already accepted and should remain byte-for-byte untouched where practical.

### 6. Do not overbuild filters yet

Twenty-four recipes grouped across six shapes are small enough to validate one scrollable grouped browser. Do not add search, tabs, sorting controls or filter persistence before phone evidence says they are necessary.

### 7. Selected recipe presentation must be canonical

The select shell should show the canonical recipe label and compact material/filling descriptors. It must never imply that arbitrary shape/palette/material/filling combinations are editable.

### 8. Locked aspiration needs contrast, not disabled soup

Locked cards should retain visible silhouette/color/material identity and show required rank. Reduce emphasis on their actions, not on the entire recipe to the point that the next reward is unreadable.

## Recommended implementation shape

- small generic `recipeThumbnail` helper or method;
- targeted `VerticalSliceApp` changes only around imports, select-shell markup, selector bindings, selection presentation and collection card rendering;
- CSS layer for recipe dock/card states;
- RU/EN copy additions for Recipes, Browse, Make again and descriptors;
- existing progression snapshot remains authoritative;
- existing Collection overlay remains the one browser surface.

## Regression boundary

The diff should not modify:

- `SquishSurface.ts`;
- shaders;
- `SquishyAudio.ts`;
- progression thresholds/awards;
- content registry;
- save/storage code;
- paint/shake/mix/mold constants or handlers.

If implementation pressure reaches those modules, stop and reduce UI scope rather than expanding the pass.
