# Sandbox Player Feedback Polish 01

Status: IMPLEMENTATION COMPLETE — awaiting release gates

This pass addresses issues observed during manual Pages testing after S6. It intentionally does not add the proposed physical table/background asset; that remains a later art/material pass.

## Included

- Decor layout containment on medium-height desktop viewports so the squishy workbench no longer visually collides with the Face / Stickers / Head controls.
- Extreme deformation containment: normal motion is unchanged, while the final clip-space margin gains progressive resistance so the toy remains visible and recoverable during aggressive pulls.
- Jelly material cleanup: removes the blown-out white wash, preserves authored colour, adds a denser gel rim/caustic cue, and updates the material selector preview. A future physical background can provide stronger transparency/refraction context.
- Paw silhouette revision: replaces the old scalloped/crown-like top with four rounded toe lobes and a broader palm. Further reference-driven shape art can follow once target PNGs are supplied.
- Rigid pearl projection: pearls are excluded from the deforming appearance texture in the live sandbox and instead projected from their UV anchors onto a lightweight overlay. Their positions follow the existing deformation field, but the beads remain circular rather than stretching with the skin. This is a read-only projection, not a second physics system. Static thumbnail rendering keeps the existing baked appearance path.

## Explicitly deferred

- Physical table / workbench background asset.
- Stronger scene-aware Jelly transparency/refraction that depends on that background.
- Dumpling silhouette/texturing. The current codebase has no unambiguous `dumpling` shape identifier, and the requested visual target has not yet been supplied; do not guess which existing shape should be rewritten.
- General S7 expressive-polish expansion beyond issues found in the manual test.

## Visual evidence

Temporary browser visual QA was run at the reported desktop sizes and at an aggressive drag state. The accepted run verified:

- Decor controls and the squishy no longer overlap.
- Jelly no longer presents as a full white exposure pass.
- Extreme pulls keep the toy on-canvas.
- Pearl beads remain circular while their UV anchors move with the stretched surface.
- The revised paw silhouette renders through the shared shape boundary and the existing generic 16×16 deformation grid.

Temporary visual workflow/test files were removed after inspection and are not part of the permanent change set.
