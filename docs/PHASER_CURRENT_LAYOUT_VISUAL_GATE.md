# Phaser engine migration: current-layout visual parity gate

**Applies to M2–M4 of [the revised migration plan](PHASER_LANDSCAPE_MIGRATION_PLAN.md).** The existing portrait-first presentation and DOM/CSS stage must remain recognizable and functional; landscape redesign is out of scope.

## Newly identified high-priority mismatch

The raw production `SquishSurface` requests WebGL2 with `alpha: true`, `premultipliedAlpha: true`, `depth: false` and draws transparent background each frame. Its `.sandbox-canvas` sits in the existing DOM stage above a CSS glow and uses CSS `filter: drop-shadow(...)`; accessory and rigid-inclusion 2D canvases also occupy explicit z-layers. The isolated Phaser spike instead creates WebGL2 with `alpha: false`, `depth: true`, `stencil: true` and draws against a solid camera background. Copying that canvas configuration into the real game would risk a visible opaque rectangle, missing glow/drop-shadow, lost accessory layering and alpha fringes **even if the GLSL is unchanged**.

## Mandatory candidate checks before adopting the new renderer

1. Preserve the original `.sandbox-stage` DOM stacking/geometry and transparent-background look at identical portrait/desktop viewports. Prove Phaser/WebGL2 can render the transparent squishy correctly in that context; pin and test the exact Phaser version and alpha/premultiplication setup. Do **not** assume `transparent: true` or changing a config flag is sufficient without a rendered check.
2. Compare original and candidate screenshots **over the same nonuniform CSS background** and sample pixels outside the shape: CSS glow and background should remain visible, with no full-canvas opaque fill. Verify CSS drop-shadow and 2D accessory/pearl z-order in press, stretch, release, resize and stage changes. Include antialias/alpha fringe checks on all six silhouettes and representative materials.
3. Retain current DOM controls' pointer reachability, Paint outside→inside behavior, Finish-only passthrough and screen-reader semantics; the Phaser canvas cannot become an invisible full-page click-catching layer.
4. Confirm the actual production build still uses one on-screen WebGL2 renderer and correctly restores Phaser GL state after the external draw. If transparent alpha composition conflicts with `Extern`/Phaser render pipeline, stop and resolve with a bounded tested adapter or revisit the approach; do not ship an opaque approximation.

**Evidence threshold:** before/after viewport screenshots and gesture video on real phone plus automated transparent-background/overlap checks. Spike PR #31's solid-background screenshots do **not** satisfy this gate. No implementation or tests were run to validate transparency while authoring this note.
