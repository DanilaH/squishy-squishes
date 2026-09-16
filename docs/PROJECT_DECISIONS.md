# Squishy infrastructure decisions — 2026-09-16

## Scoped migration decision — approved after the original engine-neutral integration

The user explicitly approved moving the **existing Squishy game** to Phaser 4 first and considering landscape **later**. The earlier no-Phaser decision below describes the reviewed raw-WebGL baseline; it is **superseded only on dedicated Phaser migration branches**, not automatically on production `main`. Read the [reviewed current-layout migration roadmap](https://github.com/DanilaH/squishy-squishes/blob/docs/phaser-landscape-migration-plan/docs/PHASER_LANDSCAPE_MIGRATION_PLAN.md) and its independent-review companion before implementing. Its historical filename must not be interpreted as a landscape mandate.

- Preserve portrait-first UI, existing DOM controls, transparent squishy canvas/CSS effects, gameplay, UV and decor layers. No forced rotation gate, fixed landscape sizing, UI pack or visual redesign. Landscape is a subsequent product project.
- Phaser owns the single visible WebGL2 squishy renderer, scene/frame update and playfield input. Reuse original shaders and one authoritative physics implementation; keep offscreen Canvas 2D baking. Existing visible 2D accessory/pearl overlays may remain only with explicit ownership and Phaser-frame updates.
- Generate the pinned `bootstrap/yandex-phaser` into an **empty temporary reference project** and compare its contracts. Reuse existing Yandex runtime, activity coordinator, storage V3, ad policy, analytics and current 5 MiB build audit; do not duplicate them or import the template's portrait gate / landscape-only policy.
- Do not merge experimental PR #31 as a complete migration. Keep the old production entrypoint until parity tests, real touch and hosted Yandex DRAFT on the exact candidate pass. Preserve a rollback build and old V3 readability.

## Historical engine-neutral integration decisions (still applicable except the scoped engine prohibition above)

This file originally adapted the reviewed `mini-games-kit` revision `797b5689767e9dc1059514e0446479e054bf1352` to an **existing raw WebGL2 game**. That was not, at the time, a Phaser migration.

| Bootstrap mechanism | Squishy decision and evidence / acceptance |
| --- | --- |
| Phaser 4.2.1 scene and sound wiring | **Originally not adopted; superseded for the approved migration only.** Preserve existing deformation and activity-coordinated WebAudio; Phaser must not own a second sound lifecycle. |
| Strict TS/Vite and dual production builds | **Already present.** Keep Pages `base` separate from the relative Yandex base and run both in CI. |
| Real Yandex SDK vs local mock, activity blockers and ads | **Already present** in `src/platform/runtime.ts` and shared kit adapter. Do not replace project save/ad policy with template defaults. |
| Semantic Game Ready | Existing app creates the Library synchronously before `runtime.markReady()`. This integration records the shell construction and ready handoff with `StartupTimeline` but does **not** claim a real-device first-paint measurement. Defer readiness changes until hosted DRAFT/mobile evidence and tests are available. |
| Startup preload / diagnostic overlay | **Not copied without an asset wall.** Current hero/thumbnail art is procedural. Add authored UI images only with an explicit startup/session/deferred inventory and authored failure/loading behavior; do not display fake progress for no work. |
| Image production | **Adopted**: kit's guarded cutout/normalization, WebP validation, AVIF companions and format probe. `sharp` is dev-only. The CLI refuses overwrites without `--force` and keeps masters outside the output directory. No UI pack or shape PNG has been imported yet. |
| Format selection | **Opt-in** `src/app/runtimeAssets.ts`; only probes when an actual asset with a committed AVIF companion is queued. Keep stable canonical WebP keys; no speculative AVIF requests. |
| Image budgets | Current Yandex distribution cap stays Squishy-specific at 5 MiB. Choose per-asset dimensions, WebP/AVIF quality, decoded-pixel and startup budgets after testing actual generated art on mobile. Do not copy Signal 2000's image sizes/quality/concurrency. |
| Mobile orientation/viewport | Original Squishy is portrait-first DOM/CSS. The later Phaser migration **retains** that layout; do not copy the template's portrait gate or landscape-only sizing. Review viewport observer only for a demonstrated resize/visualViewport issue and keep matching device behavior. |
| Save/cloud conflict policy | Existing SaveState V3 and runtime adapters remain authoritative. Do not import a Signal-specific reconciliation decision or move persistent state into presentation callbacks. |
| Yandex upload-root audit | **Adopted** `assertYandexBuildDirectory`; retain project-specific relative URL, SDK presence, debug-code absence and 5 MiB checks. GitHub Actions still packages the directory *contents* at ZIP root. |
| Release acceptance | Existing PR Release Check + Browser QA + post-merge Pages gates remain. Hosted Yandex DRAFT, native ads callbacks and real-device feel are separate acceptance evidence, not implied by Pages CI. |

## Other useful kit primitives reviewed, deliberately not imported now

- `StartupResourceDiagnostics` and `StartupPreloadController`: use when a real authored-image loader exists, not for an empty resource queue.
- `trimCanonicalTransparentWebp` + logical-frame metadata: useful for larger sparse UI sprites, but UI/DOM positioning must correctly reconstruct the full logical canvas before enabling trimming; currently no such atlas exists.
- `inspectRuntimeImageBudget`: run after selecting real art and sizes; encoded bytes alone understate decoded RGBA memory.
- `DurablePendingTransactionSession`: existing rewarded capacity grant is idempotent and currently does not need a new transaction state machine.
- Phaser runtime loader, planar-depth and text-sharpness: were incompatible with the **original** WebGL2/DOM stack; re-evaluate only if the new Phaser implementation needs them.

Changes to these decisions require a concrete asset/UX need, evidence, and reviewable validation rather than a blanket bootstrap copy.
