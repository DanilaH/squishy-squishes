# Studio environment — Gate 1 measured result

> **Status update (2026-09-19):** The measurements below are the historical Gate 1 result, **not** the current integration status. The seven Studio v8 PNGs have since been uploaded and integrated in draft PR #56's isolated Phaser Pages Shape/Paint. [Live integration + resilience CI](https://github.com/DanilaH/squishy-squishes/actions/runs/35449655248) passed, including seven viewport/DPR cases, missing-PNG fallback, live resize, short-landscape heading, input hit targets and the existing full Pages flow. [Real-browser screenshots](https://github.com/DanilaH/squishy-squishes/actions/runs/35449655248/artifacts/10585637965). The original OpenRaster source/master and reproducible export/audit remain in the separately delivered `squishy-studio-v8-candidate.zip`, not committed to this branch; art/provenance and phone visual approval are still open. Do not merge to the UI branch or `main` without owner approval.

This is evidence, not final asset approval. [The original real Phaser Pages Chromium run](https://github.com/DanilaH/squishy-squishes/actions/runs/35385752294) succeeded on the existing UI, using `tests/phaser-pages/studio-environment-gate1.spec.ts`. [Geometry/screenshot artifact](https://github.com/DanilaH/squishy-squishes/actions/runs/35385752294/artifacts/10563273845). Those original screenshots show a **geometric placeholder**, not new art integrated in the game.

| Viewport | Shape stage Y | Canvas Y | Available desk depth *proxy* | Paint stage Y | Canvas Y | Available desk depth *proxy* |
| --- | --- | --- | ---: | --- | --- | ---: |
| 320×700 | 127.75–431 | 170.58–388.17 | 87.35px | 116–527 | 212.7–430.3 | 141.22px |
| 390×844 | 132–555 | 183.59–503.39 | 116.57px | 130–665 | 237.59–557.39 | 172.57px |
| 1440×900 | 146–611 | 163.5–593.5 | 104.5px | 134–717 | 210.5–640.5 | 163.5px |
| 1280×800 | 146–511 | 146–576 | **22px** | 134–617 | 160.5–590.5 | 113.5px |
| 844×390 | 49–361 | 102.7–352.3 | **0px** | same | same | **0px** |

**Crucial limitation:** `toyBottomProxy = canvas.top + canvas.height*0.8` is a temporary approximation, NOT the measured rendered squishy silhouette. The original test verified controls remain hittable and found no horizontal scroll at these sizes. The scene cannot promise a full table at 1280×800 Shape or short landscape; show at most a small lip in the former and hide the desk in the latter without changing gameplay controls. Paint has a different controls DOM structure: use its actual `.sandbox-controls` bounds rather than the optional `.sandbox-panel` (zero width in the original capture).

The owner-approved source image is a flattened RGB illustration; seven independent image generations were rejected. The Studio v8 set instead uses a single redrawn canonical desk, repeatable wall/floor and cleaned standalone decor candidates. The desk cuts passed pixel-boundary checks in the offline candidate audit, and the current integration workflow checks live-browser geometry, decode and input. Pixel-perfect toy-silhouette overlap and visual consistency of the reused decor are **not** certified by automated tests.
