# Independent Review — Renderer Reuse / Second Shape

**Date:** 2026-09-14
**Reviewed artifact:** `docs/RENDERER_REUSE_SECOND_SHAPE.md`
**Review posture:** treat the proposal as external work and try to falsify the claimed renderer reuse rather than optimize for shipping a second silhouette.

## Verdict

**PASS WITH REQUIRED CORRECTIONS.** A soft heart is a stronger gate than another convex primitive, and the proposed shared-mask direction is appropriate. Four details must be tightened before implementation so the pass does not accidentally create multiple shape coordinate systems or hide per-shape behavior behind convenience fields.

## 1. One shape-local coordinate system is mandatory

The proposal correctly centralizes the boundary, but it does not explicitly lock coordinate semantics.

Without that, WebGL UV space, pointer local coordinates and Canvas2D coordinates can each apply different Y direction/scale rules and produce a renderer that looks correct while paint/hit/mold semantics disagree near the heart notch.

**Correction:** `ShapeDefinition.boundary` is always normalized object-local space:

```text
x: -1 left → +1 right
y: -1 bottom → +1 top
```

All shape predicates operate in that space. UV/Canvas conversion happens only at the consumer boundary.

The same `isPointInsideShape()` helper must be used by renderer pointer acquisition, paint eligibility and mold press/target validation.

## 2. Remove per-shape visualScale/visualOffset from this gate

`visualScale` and `visualOffset` look harmless, but they create an easy route to visual/semantic disagreement: the fragment silhouette can move while pointer/paint/mold geometry stays in untransformed coordinates.

They are also unnecessary for exactly two normalized shapes.

**Correction:** omit both fields from the Phase 4 `ShapeDefinition`. Normalize each boundary once when it is created. If later catalog evidence proves per-shape framing is required, add one explicit shared transform that all consumers use.

This keeps the second-shape gate honest.

## 3. The generic mask must preserve edge information, not only occupancy

A binary mask is enough for discard but not enough to preserve the existing material edge/rim treatment. Reconstructing edge distance in the shader from many neighbor samples would move unnecessary work into every frame.

**Correction:** generate a small signed-distance-like field once per shape and upload it as one-channel texture data. Encode a bounded inside/outside distance around the boundary so the fragment shader can derive discard, edge darkening and rim from one texture sample.

Generation may be CPU-side because it happens only on first use of each shape. Cache by `ShapeId` for the renderer lifetime. No per-frame polygon traversal or mask regeneration.

The field does not need mathematically exact Euclidean SDF precision; it needs stable monotonic distance near the silhouette edge.

## 4. Keep persistence compatibility explicit in the content API

Preserving the original six IDs is the correct choice for this bounded gate, but this compatibility exception should not leak into call sites.

**Correction:** `variantId(choice)` owns the compatibility rule:

- `soft-square` → existing `${palette}-${filling}`;
- `heart` → `heart-${palette}-${filling}`.

No UI/save code should manually assemble IDs.

Likewise, `ALL_VARIANT_IDS` must be produced only through `variantId()` across the shape/palette/filling product.

## 5. The heart must not create hidden tuning branches

A visually convincing heart may tempt implementation to add heart-only grab radius, mesh stiffness, paint threshold or mold gains.

That would defeat the gate even if the code remains in one class.

**Review rule:** any condition on `shape.id` inside deformation physics, stage progress math, audio or craft transitions is a blocker. Shape-specific logic is allowed only in shape-boundary construction/selection and generic mask/path generation.

## 6. Selection-stage behavior should preserve the current fast loop

Adding a third option group increases vertical UI pressure on phones.

**Correction:** reuse the compact option-row style and do not add explanatory copy, modal selection or preview cards. The shape selector is a bounded two-choice control. The final card/collection layout remains Phase 5 work.

## 7. Manual evidence remains necessary

Typecheck/build can validate architecture and compilation, but they cannot prove:

- the heart edge is visually smooth;
- the notch remains coherent while stretched;
- paint feels fair on the smaller concave region;
- the extra option row does not hurt phone composition;
- input latency/FPS remain acceptable on an actual phone.

The branch may be merged after code review + green build if no structural blocker remains, but the Phase 4 product gate should not be marked fully complete until the deployed build is exercised on phone.

## Corrected implementation contract

```text
ShapeDefinition
  id
  label
  boundary[]   // normalized object-local x/y, y-up

boundary
  → isPointInsideShape()       // renderer + paint + mold semantics
  → Path2D conversion          // paint clip
  → cached one-channel field   // WebGL discard/edge/rim
  → future thumbnail source

VariantChoice
  shape + palette + filling
  → variantId() owns compatibility mapping

SquishSurface
  one mesh
  one physics path
  one shader
  one shape-field texture input
```

With these corrections the work remains a real reuse test rather than a second hard-coded renderer hidden behind a selector.
