# Squishy infrastructure decisions — 2026-09-16

This file adapts the reviewed `mini-games-kit` revision `797b5689767e9dc1059514e0446479e054bf1352` to an **existing raw WebGL2 game**. It does not retroactively treat the Phaser project generator as a mandatory migration.

| Bootstrap mechanism | Squishy decision and evidence / acceptance |
| --- | --- |
| Phaser 4.2.1 scene and sound wiring | **Not adopted.** Squishy has one existing WebGL2 deformable surface and project WebAudio; migration adds bundle/runtime complexity without player value. Preserve the existing renderer and activity-coordinated sound. |
| Strict TS/Vite and dual production builds | **Already present.** Keep Pages `base` separate from the relative Yandex base and run both in CI. |
| Real Yandex SDK vs local mock, activity blockers and ads | **Already present** in `src/platform/runtime.ts` and shared kit adapter. Do not replace project save/ad policy with template defaults. |
| Semantic Game Ready | Existing app creates the Library synchronously before `runtime.markReady()`. This integration records the shell construction and ready handoff with `StartupTimeline` but does **not** claim a real-device first-paint measurement. Defer any change to readiness timing until hosted DRAFT/mobile evidence and tests are available. |
| Startup preload / diagnostic overlay | **Not copied without an asset wall.** Current hero/thumbnail art is procedural. Add authored UI images only with an explicit startup/session/deferred inventory and authored failure/loading behavior; do not display fake progress for no work. |
| Image production | **Adopted**: kit's guarded cutout/normalization, WebP validation, AVIF companions and format probe. `sharp` is dev-only. The CLI refuses overwrites without `--force` and keeps masters outside the output directory. No UI pack or shape PNG has been imported yet. |
| Format selection | **Opt-in** `src/app/runtimeAssets.ts`; only probes when an actual asset with a committed AVIF companion is queued. Keep stable canonical WebP keys; no speculative AVIF requests. |
| Image budgets | Current Yandex distribution cap stays Squishy-specific at 5 MiB. Choose per-asset dimensions, WebP/AVIF quality, decoded-pixel and startup budgets after testing actual generated art on mobile. Do not copy Signal 2000's image sizes/quality/concurrency. |
| Mobile orientation/viewport | Squishy has portrait-first DOM/CSS and responsive canvas, unlike the template's landscape portrait gate. Do not copy that gate or the Phaser-specific canvas refresh. Examine kit's viewport observer only when reproducing a concrete rotation/visualViewport defect, then test device behavior. |
| Save/cloud conflict policy | Existing SaveState V3 and runtime adapters remain authoritative. Do not import a Signal-specific reconciliation decision or move persistent state into presentation callbacks. |
| Yandex upload-root audit | **Adopted** `assertYandexBuildDirectory`; retain project-specific relative URL, SDK presence, debug-code absence and 5 MiB checks. GitHub Actions still packages the directory *contents* at ZIP root. |
| Release acceptance | Existing PR Release Check + Browser QA + post-merge Pages gates remain. Hosted Yandex DRAFT, native ads callbacks and real-device feel are separate acceptance evidence, not implied by Pages CI. |

## Other useful kit primitives reviewed, deliberately not imported now

- `StartupResourceDiagnostics` and `StartupPreloadController`: use when a real authored-image loader exists, not for an empty resource queue.
- `trimCanonicalTransparentWebp` + logical-frame metadata: useful for larger sparse UI sprites, but UI/DOM positioning must correctly reconstruct the full logical canvas before enabling trimming; currently no such atlas exists.
- `inspectRuntimeImageBudget`: run after selecting real art and sizes; encoded bytes alone understate decoded RGBA memory.
- `DurablePendingTransactionSession`: existing rewarded capacity grant is idempotent and currently does not need a new transaction state machine.
- Phaser runtime loader, planar-depth and text-sharpness: incompatible with the present WebGL2/DOM stack.

Changes to these decisions require a concrete asset/UX need, evidence, and reviewable validation rather than a blanket bootstrap copy.
