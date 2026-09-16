# M3 — renderer parity gate (work in progress)

**Scope:** an isolated Phaser candidate, not the default game. Preserve current portrait-first UI, unchanged `index.html`/Yandex build and V3 persistence. Use the canonical `SquishSimulation`, original shaders and existing `AppearanceDocumentV1`/`DecorDocumentV1` replay; do not copy their algorithms.

- Feed original palette/material, mold/filling/fill progress, wireframe and appearance texture into the Phaser WebGL2 Extern.
- Bake paint/mix-ins/surface decor on the canonical 256×256 offscreen Canvas 2D, upload on document changes (not every frame), using the same Y-flip and alpha behavior as the current raw renderer. Avoid retaining a borrowed mutable canvas across async boundaries.
- Retain an explicit test-only fixture and prove changes in the actual rendered pixels, alongside UI/alpha, complete original browser QA and release checks. The fixture does **not** constitute the production Paint/Decor gesture UX.
- Check GL-state handoff, context-loss resource recreation, teardown and memory; document anything that remains unproven.

**Not in M3:** the real Library/stages and Save V3 wiring, real multitouch, Yandex DRAFT or switching the default entry. These are later gates. `preserveDrawingBuffer` is test-only and must be reconsidered before production acceptance.
