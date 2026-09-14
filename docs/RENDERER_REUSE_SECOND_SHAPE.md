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

- clearly different from the rounded square;
- vertically asymmetric;
- contains a concave top notch, so scale/aspect-ratio tricks cannot fake the result;
- still a single connected body without a hole/topology change;
- plausible final-catalog content;
- stresses silhouette masking without forcing a new mechanic.

Do not substitute circle/capsule/rectangle unless the heart proves technically invalid. Those would provide weaker reuse evidence.

## 3. Hard scope

### In

- `ShapeId = 'soft-square' | 'heart'`;
- one central shape registry;
- renderer shape switching through one generic shape-field boundary;
- pointer hit testing driven by the selected shape;
- paint coverage/mask driven by the selected shape;
- mold target placement constrained by the selected shape;
- one compact shape selector in the existing recipe panel;
- both fillings and all three palettes on both shapes;
- 12 deterministic variants total;
- legacy-compatible IDs for the original six variants;
- existing save/settings/runtime/lifecycle behavior unchanged;
- existing performance diagnostics reused.

### Out

- third shape;
- progression/Lab XP;
- final collection/cards;
- new fillings/material features;
- per-shape physics constants;
- per-shape craft stage sequences;
- per-shape audio logic;
- new renderer/framework/library;
- SVG/PNG shape assets;
- heart-only deformation code;
- arbitrary recipe scripting.

## 4. Shape representation

Create `src/game/shapes.ts`.

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
}
```

### Coordinate contract

`boundary` always uses normalized object-local coordinates:

```text
x: -1 left → +1 right
y: -1 bottom → +1 top
```

No per-shape visual scale/offset exists in this gate. Each boundary is normalized once when created. Consumer-specific UV/Canvas transforms happen only at the consumer boundary.

The registry may generate boundary points procedurally once at module initialization. Runtime consumers use those boundary points rather than reimplementing independent heart/superellipse predicates.

Required shared helpers:

- `getShape(id)`;
- `isPointInsideShape(shape, x, y)`;
- `createShapePath(shape, size)` or equivalent Path2D builder;
- bounded one-channel signed-distance-like field generation from the boundary for WebGL.

The same `isPointInsideShape()` helper must drive renderer pointer acquisition, paint eligibility and mold press/target validation.

## 5. Renderer contract

`SquishSurface` gains:

```ts
setShape(shape: ShapeDefinition): void
```

The current spring mesh/deformation constants remain shared.

The fragment path must stop hard-coding the superellipse as the sole silhouette. Generate a small one-channel signed-distance-like field from `ShapeDefinition.boundary`, upload it as a texture and sample it in the existing shader.

Requirements:

- one WebGL program for both shapes;
- one spring simulation for both shapes;
- no `shape.id` branch in deformation physics;
- no shape-specific stiffness/grab/press/damping/bulge/release constants;
- shape field changes only when shape changes;
- 128×128 default field resolution, bounded to the 96–160 range if implementation evidence requires adjustment;
- field generated only on first use of each shape and cached by `ShapeId` for renderer lifetime;
- no per-frame polygon traversal or field regeneration;
- field carries stable inside/outside distance around the edge, not binary occupancy only;
- fragment shader derives discard, edge darkening and rim from that one field sample;
- material/filling uniforms remain shared.

The soft-square must remain perceptually equivalent. Minor edge differences are acceptable only if silhouette and tactile feel are not visibly degraded.

## 6. Interaction geometry

Every semantic silhouette check uses the active `ShapeDefinition`.

### Renderer pointer acquisition

Pointer down uses `isPointInsideShape()`.

### Paint

The Canvas2D clip/path rebuilds when selected shape changes. Coverage cells are eligible only if their center lies inside the active shape.

Keep `PAINT_COMPLETE_COVERAGE = 0.92`; no per-shape threshold.

### Mold

Normal presses reject points outside the active shape. Crit targets use the same inside predicate plus the existing separation rule and a bounded retry/fallback so the heart notch cannot cause a dead loop.

No heart-only gameplay rule is allowed.

## 7. Content and durable IDs

Extend `VariantChoice` with `shape: ShapeId`. Default is `soft-square`.

The original six IDs remain unchanged:

```text
grape-smooth
grape-beads
strawberry-smooth
strawberry-beads
lime-smooth
lime-beads
```

Heart IDs:

```text
heart-grape-smooth
heart-grape-beads
heart-strawberry-smooth
heart-strawberry-beads
heart-lime-smooth
heart-lime-beads
```

`variantId(choice)` owns this compatibility mapping. No UI/save call site manually assembles IDs.

`ALL_VARIANT_IDS` is generated only by applying `variantId()` across the shape × palette × filling product.

This avoids a save migration in Phase 4. Phase 5 may normalize recipe-domain IDs if the final registry justifies it.

Variant labels include the shape so the two silhouettes are distinguishable.

## 8. UI

Add one compact `Shape` option group to the existing recipe panel.

Requirements:

- shape changes only during `select`;
- selection updates renderer silhouette immediately;
- selected shape participates in preview/result label and variant ID;
- palette/filling behavior unchanged;
- collection counter becomes `/ 12`;
- reuse compact existing control styling;
- no explanatory modal, preview cards or collection redesign;
- no phone layout regression.

## 9. Preview/card strategy

This phase only establishes the source of truth:

- future collection thumbnails derive from `ShapeDefinition.boundary`;
- no independent PNG/SVG silhouette asset;
- no final cards in this pass.

If selector icons are useful, derive them from the same boundary/path helper. Text-only controls are acceptable.

## 10. Performance gate

Expected runtime cost:

- one-time/cached field generation on first shape use;
- one shape-field texture sample in the fragment shader;
- no per-frame shape polygon work;
- unchanged spring vertex count.

A catastrophic FPS/input regression blocks merge. Phone hands-on remains required before Phase 4 is marked fully complete because CI cannot prove tactile latency, notch quality or mobile composition.

## 11. Persistence compatibility

No save schema bump.

`SaveStateV1.completedVariantIds` accepts the expanded `ALL_VARIANT_IDS` set. Existing original IDs remain valid; heart completions persist as the new IDs. `totalCrafts` semantics do not change.

## 12. Lifecycle

Phase 3 activity ownership remains authoritative.

Shape work must not bypass:

- `activityBlocked` input rejection;
- pointer release on pause;
- audio stop/quiet behavior;
- dt reset on resume.

Do not reintroduce direct `document.hidden` ownership into shape or renderer code.

## 13. Review blocker rule

Any condition on `shape.id` inside:

- deformation physics;
- stage progress math;
- audio behavior;
- craft state transitions;

is a blocker.

Shape-specific logic is allowed only in boundary creation/selection. Generic hit/path/field consumers operate on `ShapeDefinition` data.

## 14. Implementation sequence

1. Add shape registry + geometry helpers.
2. Add cached generic shape field + `SquishSurface.setShape()`.
3. Replace renderer hard-coded hit test.
4. Add shape to `VariantChoice`, IDs, labels and `ALL_VARIANT_IDS`.
5. Wire selected shape through `VerticalSliceApp`.
6. Replace paint geometry checks/path with shape helpers.
7. Replace mold geometry checks with shape helpers.
8. Add compact shape selector.
9. Update active docs for Phase 3 complete / Phase 4 active.
10. Run strict typecheck/build.
11. Independently review the final diff for per-shape physics/gameplay forks, ID regressions and accidental scope growth.
12. Merge only if structural gate passes; deploy and then hands-on-check phone before marking Phase 4 product gate complete.

## 15. Acceptance criteria

Structural PASS requires:

- `soft-square` and `heart` selectable and materially different;
- all 12 combinations use the same craft flow;
- Smooth/Foam Beads work on both;
- outside-silhouette pointer acquisition is rejected;
- paint eligibility follows active shape;
- mold presses/targets follow active shape;
- no shape-specific branch in physics or craft transitions;
- original six durable IDs unchanged;
- existing save loads without migration;
- typecheck and production build pass;
- no third shape/progression/final-collection scope enters the diff.

Final Phase 4 product PASS additionally requires a deployed phone check for visual edge quality, heart-notch deformation, paint fairness, composition and responsiveness.

## 16. Failure interpretation

If the heart needs dedicated deformation constants, dedicated stages or a second renderer path, stop catalog expansion and repair the renderer/content boundary before Phase 5.
