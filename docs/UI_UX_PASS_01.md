# Squishy Squishes — UI/UX Pass 01

**Status:** ACTIVE BOUNDED SPEC

## Goal

Replace the validation-era component selector with a recipe-first player shell now that the launch-scale catalog is fixed at 6 shapes / 24 curated recipes.

This pass changes discovery/navigation/presentation only. It must not change tactile gameplay, recipe data, progression math, renderer physics, shader behavior, audio tuning or save schema.

## Product problems to fix

1. The bottom selector still exposes only Cube + Heart, three legacy palettes and two legacy fillings even though the canonical catalog contains 24 curated recipes across six shapes.
2. Premium/new-shape recipes are reached through Collection as a temporary implementation seam rather than a deliberate primary browse flow.
3. Completed recipes primarily expose `Squeeze`; a completed premium recipe needs an obvious `Make again` path as well.
4. Collection cards communicate mostly via color swatches and labels; silhouette/material aspiration is weak.
5. The select screen reads like an internal recipe-construction tool rather than a finished collectible game.

## Scope

### A. Recipe-first select shell

- Remove the legacy Shape / Color / Texture controls from the player-facing select surface.
- Keep one selected canonical recipe as the hero preview.
- Show selected recipe name plus compact material/filling metadata.
- Provide an obvious `Recipes` / browse control beside the primary `Make` CTA.
- `Make` starts the currently selected canonical recipe through the existing craft loop.
- Do not expose arbitrary noncanonical combinations.

### B. Recipe browser / collection

Reuse the existing overlay and collection read model rather than creating another navigation system.

For every canonical recipe:

- locked: readable aspiration + required Lab Rank;
- available/unmade: `Make`;
- completed: both `Make again` and `Squeeze`;
- clicking Make selects the exact canonical `VariantChoice` and starts the existing `pour` stage;
- Squeeze preserves the existing finished-object revisit flow.

Keep grouping by shape for this pass unless implementation evidence shows it becomes unusable on phone.

### C. Generic recipe thumbnail

Cards need a real silhouette cue without introducing 24 bespoke image assets.

- derive thumbnail silhouette from the existing `ShapeDefinition.boundary`;
- use generic SVG/CSS presentation;
- palette drives card accent;
- material/filling add restrained reusable cues;
- no recipe-specific branches or raster thumbnail pipeline in this pass.

### D. Progression readability

- keep Lab Rank / XP visible;
- available-unmade cards must visually outrank completed cards as the next action;
- locked cards remain aspirational rather than nearly invisible;
- keep `completed / total` visible;
- do not add currency, quests, daily rewards or another progression system.

### E. Responsive/accessibility

- desktop and phone portrait/landscape must retain clear Make/Browse controls;
- touch targets >= practical mobile size;
- overlay scrolling must not interfere with the WebGL interaction surface;
- selected/locked/completed states cannot depend on hover alone;
- preserve RU/EN typed copy.

## Explicit non-goals

- no new recipes/shapes/materials/fillings;
- no progression rebalance;
- no store/economy;
- no new craft stage;
- no renderer/shader/audio changes;
- no Yandex SDK changes;
- no final reveal/VFX/audio polish yet;
- no bespoke card art production yet.

## Acceptance

Structural:

- all 24 canonical recipes reachable from the recipe browser;
- completed recipe supports both recraft and revisit;
- no legacy arbitrary-combination selector remains player-facing;
- no changes to content/progression/save/renderer/audio semantics;
- strict typecheck + Pages build + Yandex build verifier green.

Product:

- select screen reads as `choose desirable recipe → make it`, not `configure internal parameters`;
- new/available content is obvious;
- locked content creates a visible next goal;
- cards communicate shape at small size;
- phone layout remains usable without grind/debug tools.

## Follow-up after this pass

UI/UX Pass 01 is not ship completion. Next gates remain:

1. full feel/art/reveal/reward hierarchy pass;
2. material-specific audio and repetition-fatigue pass;
3. repeated-use / lifecycle / performance QA;
4. Yandex DRAFT, store assets and moderation fixes.
