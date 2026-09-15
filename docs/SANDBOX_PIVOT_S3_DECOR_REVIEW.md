# Sandbox Pivot S3 — Independent Pre-Implementation Review

**Status:** PASS WITH HARD CONSTRAINTS
**Reviewed spec:** `SANDBOX_PIVOT_S3_DECOR.md`
**Base:** `main@4454d2f72e9df490d93e03dc40fe149e9ae6fdcb`

## Verdict

The S3 slice is architecturally justified and bounded enough to implement.

The key reason to proceed is that S2 already proved a real product gap: authored toys are distinguishable on the shelf but still have weak character identity. S3 addresses that directly without requiring more shapes, more recipes or new tactile mechanics.

The proposed split is also technically sound:

- face + stickers can reuse the already-proven UV appearance path and therefore inherit mesh deformation;
- only silhouette-breaking accessories need an overlay;
- one read-only generic mesh projection seam is materially cheaper and safer than accessory-specific physics or geometry.

Proceed only under the constraints below.

---

## 1. Do not mutate paint/mix-in persistence to encode decor

`AppearanceDocumentV1` already has a clear, bounded paint/mix-in command contract and is covered by S0/S2 regressions.

S3 should **compose** decor after `replayAppearanceDocument(...)`; it should not smuggle face/sticker commands into paint strokes or mix-ins and should not rename/re-version the proven appearance codec merely because decor exists.

Required composition helper should conceptually be:

```ts
replayAppearanceDocument(context, appearance);
renderSurfaceDecor(context, decor, shape);
```

Every code path that uploads or thumbnails a toy must use the same ordering.

---

## 2. Keep `DecorDocumentV1` separate from SaveState versioning

Adding `decor` to `SavedSquishy`/`SandboxDraft` is preferable to rewriting `AppearanceDocumentV1`.

Hard compatibility rule:

- old V3 toy with missing `decor` → decode as empty decor;
- malformed present `decor` → reject the malformed save through the existing bounded V3 decoder path rather than silently accepting arbitrary catalog values;
- newly written toys always contain canonical `decor`.

No V4.

This is a compatible extension of the authored-toy record, not a change to library semantics.

---

## 3. Face placement must be shape-generic, but not naïvely fixed UV

A single fixed pair of face UV coordinates is too fragile across Soft Square, Heart, Mochi, Peach, Mushroom and Paw.

Use a generic **face frame derived from the selected shape boundary bounds**:

- center from min/max X/Y;
- eye baseline as a bounded fraction of shape height above center;
- eye spacing as a bounded fraction of shape width;
- mouth below the eye baseline;
- blush outside the mouth/eye centerline.

This remains generic data math, not six renderer branches.

If one shape later needs art-direction tuning, allow declarative decor anchor metadata outside the renderer rather than `if (shape === ...)` branches in `SquishSurface`.

---

## 4. Accessory projection must be read-only and affine

Do not expose vertex arrays or renderer internals directly to `SandboxApp`.

One bounded public projection API is acceptable:

```ts
projectUvToCanvas(u, v)
```

Implementation should bilinearly sample the existing 17×17 deformed grid and map it through the current `scaleX/scaleY` and CSS canvas bounds.

The overlay should sample a small local UV basis around the generic top anchor and derive a bounded affine transform. This is better than driving accessories from coarse `SquishMetrics`, because metrics publish at a lower cadence and do not describe local mesh deformation.

Hard constraints:

- no spring constants change;
- no shader change;
- no pointer behavior change;
- no accessory enters the WebGL mesh;
- overlay `pointer-events: none`;
- clamp pathological visual scale/skew if a very large squeeze produces an ugly transform.

---

## 5. One head accessory slot is the right S3 limit

Do not make accessories an arbitrary placement array yet.

One exclusive head slot:

- avoids stacking ears + horns + crown into visual noise;
- keeps the UI large/touch-friendly;
- keeps payload trivial;
- makes later rewarded cosmetic packs easy to add;
- avoids premature z-order/editor controls.

Surface stickers remain the only repeatable decor placement array in S3.

---

## 6. Sticker input should reuse the real squishy hit-test

Decor sticker placement should call the existing `SquishSurface.clientPointToUv(...)` while the Decor stage is non-interactive for squeeze physics.

This gives:

- actual shape clipping;
- normalized UV persistence;
- no separate DOM hit map;
- no arbitrary sticker coordinates outside the squishy.

Do not add drag handles, resize handles or rotation gestures in S3.

A deterministic small rotation/scale variation can be derived from placement index/type if visual variety is needed while keeping persistence compact.

---

## 7. Accessory live rendering must not leak into Library architecture

The real gameplay surface may use one lightweight overlay canvas/SVG for the selected accessory.

The Library must continue using its single cheap per-card 2D thumbnail canvas. It should **draw** the accessory into that thumbnail; it must not mount live accessory overlays or WebGL surfaces per card.

This protects S2's successful performance/complexity boundary.

---

## 8. Protect player-facing complexity

The proposed catalog is already near the sensible S3 upper bound.

Do not expose 3 + 3 + blush + 4 stickers + 5 accessories as one dense 16-item flat toolbar.

Use large category rows/segmented trays, for example:

- Face: Eyes / Mouth / Blush;
- Stickers;
- Head.

The currently edited category can own the horizontal item tray. Continue stays visually dominant.

If the implementation needs tiny labels, nested dropdowns or scrollable inspector panels to fit, the UI architecture is wrong.

---

## 9. Save-size risk is low but still must be measured

S2's 24-toy stress envelope is 79,333 B. Decor should be tiny compared with strokes.

The S3 `<100 KB` stress target is sensible, but do not game the fixture with empty decor. The representative stress toy should include:

- selected eyes;
- selected mouth;
- blush;
- 12 stickers;
- one accessory.

Measure the whole V3 JSON exactly as S2 does.

---

## 10. QA must prove deformation attachment, not only persistence

A test that sees `decor` in localStorage is insufficient.

Permanent QA should also prove:

- surface decor is present on the same appearance texture path used during Squeeze;
- accessory overlay moves when the underlying mesh is pulled;
- accessory overlay does not intercept the pointer;
- after reload/reopen the same saved decor returns.

A deterministic debug dataset attribute for rendered decor counts/IDs is acceptable if it reflects real production state and is not a test-only hook.

---

## 11. Scope guard

Do not use S3 to add:

- face animation states;
- eyes following pointer;
- physics ears;
- sticker transform editor;
- accessory inventory/unlock UI;
- ad gates;
- recipe matching;
- titles;
- additional materials;
- additional shape data unless a concrete generic-anchor failure proves it necessary.

---

## Final decision

**Proceed.**

Implementation order should be:

1. decor domain + decoder/backward compatibility;
2. shared surface-decor renderer;
3. Library thumbnail composition;
4. generic `SquishSurface` UV projection proof;
5. one accessory overlay prototype under real squeeze;
6. only if that projection remains attached, wire the full Decor stage/catalog;
7. update permanent QA and payload evidence;
8. production visual review;
9. final diff review/cleanup/PR.

The critical S3 stop condition remains accessory attachment. If the generic projection visibly detaches under ordinary squeeze, stop and reassess before building out the rest of the accessory catalog.
