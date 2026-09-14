# Renderer Reuse / Second Shape Gate

**Status:** ACTIVE BOUNDED IMPLEMENTATION
**Phase:** 4
**Primary question:** can one materially different silhouette use the existing deformation/material/gameplay path without bespoke physics or a second craft state machine?

## 1. Goal

Prove the high-CMF renderer thesis before progression/catalog work begins.

The accepted rounded soft-square remains the baseline. Add exactly one materially different second shape and make both shapes flow through the same renderer, material, filling, craft stages, lifecycle, persistence and reveal path.

This pass is an architecture/content-reuse test, not a content expansion sprint.

## 2. Chosen second shape

Use a **soft heart** as the second shape.

Why this is the right gate:

- it is clearly different from the rounded square at a glance;
- it is vertically asymmetric;
- it contains a concave top notch, so a simple width/height scale variant cannot fake the result;
- it is still a single connected soft body with no hole/topology change;
- it is commercially/content-wise plausible for the final catalog;
- it stresses silhouette masking without forcing a new gameplay mechanic.

Do not substitute circle/capsule/rectangle unless the heart proves technically invalid. Those shapes would provide weaker reuse evidence because they remain convex and too close to the current silhouette.

## 3. Hard scope

### In

- `ShapeId = 'soft-square' | 'heart'`;
- one central shape registry;
- renderer shape switching through one generic shape-mask boundary;
- pointer hit testing driven by the selected shape;
- paint coverage/mask driven by the selected shape;
- mold target placement constrained by the selected shape;
- shape selector in the existing recipe panel;
- both current fillings and all three current palettes on both shapes;
- 12 selectable deterministic variants total;
- legacy-compatible IDs for the original six variants;
- existing save/settings/runtime/lifecycle behavior unchanged;
- representative performance diagnostics through the existing metrics path.

### Out

- a third shape;
- progression/Lab XP;
- final collection screen/cards;
- new fillings/material features;
- per-shape physics constants;
- per-shape craft stage sequences;
- per-shape audio logic;
- new renderer/framework/library;
- SVG/PNG shape assets;
- bespoke heart-only deformation code;
- arbitrary recipe scripting.

## 4. Shape representation

Create a project-local shape module, expected as `src/game/shapes.ts`.

A shape definition owns data needed by all silhouette consumers:

```ts
export type ShapeId = 'soft-square' | 'heart';

export interface ShapePoint {
  readonly x: number;
  readonly y: number;
}

export interface ShapeDefinition {
  readonly id: ShapeId;
  readonly label: string;
  readonly boundary: readonly ShapePoint[];
  readonly visualScale: number;
  readonly visualOffset: readonly [number, number];
}
```

`boundary` is one ordered normalized polygon sampled densely enough to look smooth at the existing hero size.

The registry may generate those points procedurally once at module initialization. Runtime consumers must then use the resulting boundary data rather than reimplementing separate heart/superellipse predicates.

Required helpers:

- `getShape(id)`;
- `isPointInsideShape(shape, x, y)`;
- `createShapePath(shape, size)` or equivalent Path2D builder;
- a bounded helper for sampling/encoding the shape mask for WebGL.

The exact helper names may differ. The invariant is one project-domain silhouette definition feeding renderer hit testing, paint clipping and mold placement.

## 5. Renderer contract

`SquishSurface` gains one shape API:

```ts
setShape(shape: ShapeDefinition): void
```

The existing spring mesh and deformation constants remain shared.

The fragment path must no longer hard-code the superellipse as the only visible silhouette. Preferred implementation is one small mask/SDF texture generated from `ShapeDefinition.boundary` and sampled in the existing fragment shader.

Requirements:

- one shader/program for both shapes;
- one spring simulation for both shapes;
- no shape switch inside `updatePhysics()` that changes stiffness, grab, press, damping, bulge or release constants;
- shape mask updates only when shape changes;
- mask resolution bounded (target 96–160 px; 128 px is the default starting point);
- mask texture created once and reused/cached per shape for the life of the renderer;
- mask filtering should preserve a smooth edge at current mobile/desktop hero sizes;
- existing material/filling uniforms stay shared.

The current soft-square should remain perceptually equivalent. Minor edge-shading differences caused by the generic mask are acceptable only if the silhouette/feel is not visibly degraded.

## 6. Interaction geometry

Every semantic silhouette check must use the selected shape.

### Renderer pointer acquisition

`SquishSurface` pointer-down hit testing uses the active `ShapeDefinition`, not a hard-coded superellipse predicate.

### Paint stage

The paint canvas clip/mask is rebuilt when the selected shape changes. Coverage cells are eligible only when their centers lie inside the active shape.

The coverage threshold remains `0.92`. Do not retune it per shape in this pass.

### Mold stage

Random crit targets must spawn inside the active shape. The same separation rule remains. A bounded retry/fallback is required so the heart notch cannot create a dead loop.

Normal mold presses also reject points outside the active shape.

No new heart-only gameplay rule is allowed.

## 7. Content and IDs

Extend `VariantChoice` with `shape: ShapeId`.

Default selection is `soft-square`.

The original six IDs are durable compatibility IDs and must not change:

```text
grape-smooth
grape-beads
strawberry-smooth
strawberry-beads
lime-smooth
lime-beads
```

Heart variants use:

```text
heart-grape-smooth
heart-grape-beads
heart-strawberry-smooth
heart-strawberry-beads
heart-lime-smooth
heart-lime-beads
```

This deliberately avoids a save migration in the renderer-reuse gate. A later recipe-domain migration may normalize ID structure when Phase 5 introduces the final recipe registry.

`ALL_VARIANT_IDS` must contain all 12 IDs and existing V1 saves must decode unchanged.

Variant labels should include the shape so the two silhouettes are distinguishable in the result UI.

## 8. UI

Add one `Shape` option group to the existing recipe panel.

Use the same low-cost DOM control style already used for texture selection. Do not design the final collection-card system here.

Required behavior:

- shape can change only in `select` stage;
- selecting a shape updates renderer silhouette immediately;
- selected shape participates in preview/result label and variant ID;
- palette/filling behavior remains unchanged;
- collection counter becomes `/ 12`;
- no horizontal layout regression on phone.

## 9. Preview/card strategy

This phase only needs to establish the reusable source of truth for future previews.

Decision:

- future collection thumbnails should derive from the same `ShapeDefinition.boundary`;
- do not author independent PNG/SVG silhouettes;
- do not build final cards in this pass.

If a small selector icon is useful, generate it from the same boundary/path helper. Text-only selector controls are also acceptable for this gate.

## 10. Performance gate

The mask/SDF path is accepted only if shape switching does not add per-frame CPU work proportional to mask resolution.

Expected runtime cost:

- one-time/cached mask generation on shape selection;
- one extra texture sample (plus bounded neighbor samples only if needed for edge shading) in the fragment shader;
- no per-frame polygon traversal;
- unchanged spring vertex count.

Existing metrics remain the baseline. Build must remain comfortably interactive on the GitHub Pages phone surface. A catastrophic FPS/input regression blocks merge.

## 11. Persistence compatibility

No save schema version bump in this phase.

`SaveStateV1.completedVariantIds` simply accepts the expanded `ALL_VARIANT_IDS` set.

Existing saves containing original IDs remain valid. New heart completions persist as the new prefixed IDs.

`totalCrafts` semantics do not change.

## 12. Lifecycle

The Phase 3 activity contract remains authoritative.

Shape changes must not bypass:

- `activityBlocked` input rejection;
- pointer release on pause;
- audio stop/quiet behavior;
- dt reset on resume.

No direct `document.hidden` logic may be reintroduced into shape code or renderer code.

## 13. Implementation sequence

1. Add shape registry + pure geometry helpers.
2. Add generic renderer shape mask and `setShape()`.
3. Replace renderer hard-coded hit test with shape helper.
4. Add shape to `VariantChoice`, IDs, labels and `ALL_VARIANT_IDS`.
5. Wire selected shape through `VerticalSliceApp`.
6. Replace paint eligibility/path checks with shape helpers.
7. Replace mold target/press checks with shape helpers.
8. Add minimal shape selector UI.
9. Update active docs only where Phase status/current gate changed.
10. Run strict typecheck/build.
11. Independent diff review for accidental per-shape physics/gameplay forks and compatibility regressions.
12. Merge only if the second-shape exit gate passes.

## 14. Acceptance criteria

PASS requires all of the following:

- both `soft-square` and `heart` are selectable and visibly materially different;
- all 12 combinations complete the same craft flow;
- Smooth and Foam Beads render on both shapes;
- pointer-down outside the active silhouette does not acquire the squish;
- paint coverage cannot be completed by painting only outside the active silhouette;
- mold crit targets do not spawn outside the active silhouette;
- no shape-specific branch exists in deformation physics or craft state transitions;
- existing six durable variant IDs remain unchanged;
- existing save loads without migration;
- typecheck and production build pass;
- phone build remains responsive enough for tactile play;
- no third shape/progression/final collection scope enters the diff.

## 15. Failure interpretation

If the heart needs dedicated deformation constants, dedicated stages or a second renderer path, do not paper over it.

That is a failed reuse assumption. Stop catalog expansion and repair the renderer/content boundary before Phase 5.
