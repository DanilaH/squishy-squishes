# Studio environment — Gate 1 measured result

This is evidence, not final asset approval. [The real Phaser Pages Chromium run](https://github.com/DanilaH/squishy-squishes/actions/runs/35385752294) succeeded on the existing UI, using `tests/phaser-pages/studio-environment-gate1.spec.ts`. [Geometry/screenshot artifact](https://github.com/DanilaH/squishy-squishes/actions/runs/35385752294/artifacts/10563273845). The screenshots show a **geometric placeholder**, not new art integrated in the game.

| Viewport | Shape stage Y | Canvas Y | Available desk depth *proxy* | Paint stage Y | Canvas Y | Available desk depth *proxy* |
| --- | --- | --- | ---: | --- | --- | ---: |
| 320×700 | 127.75–431 | 170.58–388.17 | 87.35px | 116–527 | 212.7–430.3 | 141.22px |
| 390×844 | 132–555 | 183.59–503.39 | 116.57px | 130–665 | 237.59–557.39 | 172.57px |
| 1440×900 | 146–611 | 163.5–593.5 | 104.5px | 134–717 | 210.5–640.5 | 163.5px |
| 1280×800 | 146–511 | 146–576 | **22px** | 134–617 | 160.5–590.5 | 113.5px |
| 844×390 | 49–361 | 102.7–352.3 | **0px** | same | same | **0px** |

**Crucial limitation:** `toyBottomProxy = canvas.top + canvas.height*0.8` is a temporary approximation, NOT the measured rendered squishy silhouette. The test verified controls remain hittable and found no horizontal scroll at these sizes. The scene cannot promise a full table at 1280×800 Shape or short landscape; show at most a small lip in the former and hide the desk in the latter without changing gameplay controls. Paint has a different controls DOM structure: use its actual `.sandbox-controls` bounds rather than the optional `.sandbox-panel` (zero width in the current capture).

The owner-approved source image is a flattened RGB illustration; seven independent image generations were rejected. A local seven-PNG, one-master **art candidate** has since been assembled from one redrawn canonical table, reconstructed repeatable bases, and cleaned standalone decor references. It has verified pixel-boundary matches, but the exact binaries are **not yet committed or loaded in the live game**. Do not mark Gate 4 complete, merge, or claim runtime DPR/touch QA before the actual assets are added and tested.
