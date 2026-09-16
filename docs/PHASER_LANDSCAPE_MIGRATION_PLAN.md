# Squishy Squishes → Phaser 4: current-layout migration plan

**Status:** revised implementation plan, not a completed migration or release approval. 2026-09-16. **Decision:** migrate the existing game to Phaser first, keeping its current responsive portrait-first appearance, interaction and UX; evaluate landscape separately after Phaser acceptance. This decision supersedes the earlier landscape-first proposal in this document. Critical review: [PHASER_LANDSCAPE_MIGRATION_REVIEW.md](PHASER_LANDSCAPE_MIGRATION_REVIEW.md).

**Source baseline:** working `main` at `1c6f30e0e126ea2ffda96a85be04fc821a70a0cf`; isolated proof PR [#31](https://github.com/DanilaH/squishy-squishes/pull/31) at `495ed990a306eb163eb9742f0d3f1be31e200dc5`; `mini-games-kit` pinned to `797b5689767e9dc1059514e0446479e054bf1352`. Verify refs before code edits. PR #31 is a technical reference, not a candidate for blind merge.

## 1. Goal, scope and honest completion claim

Migrate the existing `Library → New Squishy → Shape → Paint → Mix-ins → Mix → Decorate → Finish/Save → Squeeze` game to **Phaser 4.2.1's scene lifecycle, update/render loop, playfield pointer routing and one shared on-screen WebGL2 context**, with the kit's Yandex/Phaser startup and release contracts. Preserve current screen geometry, portrait-first responsive CSS, visible styling, localized copy, DOM Library/control panels, gameplay, current shaders and tactile feel. Landscape remains playable exactly to the extent it already is; **do not introduce a portrait-blocking rotation gate or redesign for landscape now**. Later landscape work has its own product decision, UX acceptance, PR and testing.

The original shape field, 16×16 spring mesh, six shapes and materials, appearance/decor data and IDs, audio character, SaveState V3/key, ad rules, rewarded 8→10 shelf expansion, analytics semantics and old-save compatibility are invariants. A Phaser sprite/screenshot instead of deformable GLSL is not a migration. No new art pack, new monetization, recipe/XP revival, UI makeover or physics tuning in this work.

**Precise ownership:** Phaser owns the game frame, GPU canvas and playfield input; the current DOM-based library, buttons and controls remain an intentional accessible UI presenter. Offscreen Canvas 2D appearance baking is allowed. Existing visible accessory and rigid-pearl Canvas 2D layers can remain for visual parity **if driven from the Phaser frame/update, not separate independently scheduled visible render loops**. Do not claim the whole UI is Phaser-rendered. If layering forces a different implementation, require comparison evidence and a separate, bounded change.

**Done means:** normal Pages and Yandex builds launch the new Phaser game at the existing URLs with substantially identical presentation and gestures on the same portrait, desktop and existing landscape viewports; full create/save/reopen/delete/reward flows and real platform behavior pass; actual phone touch and hosted Yandex DRAFT are accepted; old V3 saves are readable; rollback to the old build remains safe. A green 3-test spike is not sufficient.

## 2. Evidence, existing infrastructure and risks

| Source | Preserve / reuse | Gap before cutover |
| --- | --- | --- |
| `src/squish/SquishSurface.ts` | Original mesh, springs, GLSL, field, materials, UV, appearance, squeeze metrics. | Today it owns its own GL context, RAF, DOM pointer handlers and audio calls. Extract and rehome each responsibility without changing response. |
| `src/sandbox/SandboxApp.ts` + `SandboxLibraryApp.ts` | Entire current DOM experience, Paint/Decor 2D composition, UV overlays, library and localized text. | Swap `SquishSurface` behind an adapter and move playfield input/visible overlay scheduling into Phaser. Preserve DOM structure/CSS where possible. |
| `src/platform/runtime.ts`, `src/app/bootstrap.ts`, `src/platform/saveV3.ts` | Already use kit's Yandex runtime, activity, storage, Metrica, SaveState V3 and reward semantics. | Do not initialize a second runtime, change storage keys or overwrite user data with a bootstrap default. Adjust only lifecycle/readiness seams. |
| `src/platform/releaseSession.ts` | Existing ad eligibility and analytics tied to real stage/save events. | Its `MutationObserver` on DOM stages is fragile under scene transitions; capture traces before replacing with typed domain events. |
| Spike PR #31 | Phaser 4 `Extern` + real GLSL and field on one WebGL2 context. | Copies physics; only one shape/material, no appearance/save/audio; phone-size test is 390×844 **with Playwright mouse**, not touch hardware. Also tests no complex GL compositing. |
| Kit bootstrap | Yandex real/mock split, loading/readiness, activity, diagnostic/preload, runtime images, build audit and browser viewport mechanisms. | Its stock orientation policy blocks portrait and its landscape sizing is inappropriate for unchanged Squishy. Adapt/omit these *policies* explicitly while adopting shared mechanisms. |

Bootstrap generator requires an empty directory: generate a **temporary reference project**, compare its `BOOTSTRAP_MANIFEST.json` and behavior contract by contract, integrate into existing repo. Do not overwrite Squishy or import new project-owned save/ad defaults. The current `AGENTS.md` and `docs/PROJECT_DECISIONS.md` prohibit Phaser: a **scoped, reviewed migration exception in the implementation branch is required before code edits**, preserving all other safety rules; update canonical docs at final cutover.

## 3. Target technical topology

```text
Existing entry / kit-compatible startup
  ├─ one PlatformRuntime (activity, ads, analytics, storage, language)
  ├─ existing V3 repository and settings, same keys/codecs
  ├─ existing DOM Library, stages, controls and portrait-first CSS
  └─ Phaser.Game (one on-screen WEBGL2 context and frame/input owner)
       └─ SquishyScene
            ├─ SquishSimulation (mesh, springs, gesture state, UV projection)
            ├─ SquishExtern (original GLSL, field and appearance GPU resources)
            ├─ stage-aware Phaser pointer input → normalized playfield coordinates
            └─ existing accessory/rigid Canvas 2D presenters, updated in Phaser frame

Typed stage/save events → existing analytics and ad policy;
activity blockers → gesture cancellation + WebAudio mute + gameplay desired.
```

One on-screen **WebGL2** canvas does not mean literally one `<canvas>`: offscreen 2D baking and the existing accessory/pearl 2D overlays are permitted as specified above. Do not create a second concurrent WebGL game or its own animation loop. Preserve existing CSS canvas size/position and layer order; establish one consistent `client coordinates → Phaser pointer → simulation local/UV → CSS overlay` transform. Do not copy the spike's `pagehide` `{ once: true }` listener; bfcache must remain recoverable.

## 4. Dependency-ordered implementation with mandatory gates

### M0 — Freeze the current game and unblock repository instructions

1. On a dedicated implementation branch, explicitly approve **Phaser migration only**, not landscape, in `AGENTS.md`/`docs/PROJECT_DECISIONS.md`; preserve current runtime, save, ads and release safeguards. Keep production entry untouched until acceptance.
2. Capture anonymized V3 fixtures (empty, full 8, rewarded 10, painted/decorated, all shape/material IDs, Ideas, mute, V2→V3), before/after image/gesture/audio/UV baselines and current Pages/Yandex release output. Preserve current `squishy.save.v3`, IDs, timestamps, object order and reward IDs; do not use or clear real player data.
3. Define matched screenshot/input viewports: portrait mobile (including a short phone), desktop and the game's **current** landscape behavior. Include real phone touch, paint outside→inside, finish passthrough, overlays, save/reload, ad and activity traces. Measure frame times, startup and bundle size on comparable builds without inventing success numbers.
4. Establish a branch-addressed Yandex DRAFT test route and identify the exact archive/commit used. No need for new landscape layout or rotation gate fixture.

**Gate M0:** reproducible baseline tests/fixtures and scoped instructions exist; the old default game remains untouched and functional.

### M1 — Extract the single authoritative simulation with the old renderer still running

1. Extract mesh state, all current physics constants and integration, begin/move/end/cancel, shape hit-test, deformed-UV projection and squeeze metrics into a `SquishSimulation` with injected time/delta and normalized coordinates; no dependency on Phaser, DOM, WebGL or WebAudio.
2. Make existing `SquishSurface` use that module **first**. Keep GLSL, shape field, shader uniforms and current feel. Audio receives interaction metrics/callbacks instead of being owned by physics. Maintain the existing canvas and existing UI while checking parity.
3. Compare deterministic hold/drag/release traces, multiple shapes, stationary press, low FPS/resume, pointer cancel, render stills, hit/UV positioning and audio. Do not keep two active spring implementations; the copied spike algorithm is temporary reference code only.

**Gate M1:** original renderer and complete release/browser QA remain green with trace/visual parity. Revert extraction if it destabilizes the original game.

### M2 — Add an isolated, current-layout Phaser candidate

1. Generate temporary pinned bootstrap and build an adoption matrix (`adopt` / `adapt` / `already present` / `not applicable`) for every required mechanism. Keep one existing Yandex runtime, settings and V3 repository. Adopt preload/failure presentation only for real resources, semantic ready, startup diagnostics, runtime image selection and existing audit/build protections.
2. Create a separate candidate entry and script; do not replace production `index.html` or Pages/Yandex defaults. Explicitly require WebGL2 and render a clear unsupported-device message; avoid silent Phaser Canvas fallback. Review the spike's `context as CanvasRenderingContext2D` cast and isolate/test any necessary adapter against pinned Phaser 4.2.1.
3. **Keep existing portrait-first viewport and DOM/CSS geometry.** Use kit viewport observation only where it improves resize/visualViewport correctness; disable the bootstrap's portrait gate, landscape-only layout sizing and orientation activity blocker. Phaser canvas fills precisely the existing squishy stage, not the entire document. Document DPR, CSS-to-backing-store and Phaser coordinate mapping; preserve the current layout on phone and desktop.
4. Signal game presentable only after actual Library/control UI is usable and painted; call Yandex `LoadingAPI.ready()` exactly once; specify GameplayAPI desired state for menu versus gameplay. Guard async completions and `pagehide`/`pageshow` (including bfcache) against stale ownership.

**Gate M2:** candidate displays the **same existing layout** in mobile portrait/desktop, accepts real touch and survives resize/current landscape without a new rotation gate; no duplicate runtime, premature ready or regression in normal release builds.

### M3 — Complete original GLSL renderer on Phaser `Extern`

1. Replace the spike's copied physics with `SquishSimulation`; implement all six shape fields and six materials plus existing mold/fill/filling/wireframe/appearance uniforms. Reuse original GLSL and canonical shape boundary/UV rather than drawing an approximation. Keep the same on-screen dimensions and shader scaling as the old canvas.
2. Preserve `AppearanceDocumentV1`/`DecorDocumentV1` offscreen replay and texture uploads. Check `UNPACK_FLIP_Y_WEBGL`, pixel alignment, alpha/premultiplication, bindings, context-loss restore, destruction and deferred upload cancellation.
3. Test GL-state yield/rebind with any Phaser text/sprites both before and after the `Extern`, transparent overlays, stage transitions and resizing. The spike binds the default framebuffer; it does **not** prove effects/masks/multi-camera rendering. Support only features Squishy actually uses; no speculative engine abstractions or GL hacks.

**Gate M3:** all shape/material/appearance reference images and UV/hit tests match within agreed documented tolerances; no blank WebGL fallback, GL errors or leaked GPU resources; one visible WebGL2 renderer and Phaser frame loop.

### M4 — Preserve all existing UX and unify pointer/frame ownership

1. Introduce typed stage commands/events; keep DOM buttons in DOM, but route the playfield's gestures through Phaser with one stage-aware pointer owner. **Paint can start outside the silhouette and begins drawing upon entry**; never draw outside it. Squeeze begins only on a valid hit. Preserve paint capture, eraser/undo/clear, mix-in placement/spacing, distance-based Mix, sticker positioning and Finish-only pointer passthrough. Cover pointer IDs, multi-touch contention, cancel/upoutside/blur, `touch-action`, external blockers and overlay occlusion.
2. Keep the current accessory and rigid-pearl visual layers where they are, update their placement from Phaser's frame rather than separate visible RAF loops, and preserve deformed-UV anchors and layer ordering. Their 2D canvases must not become an alternative touch system. If this bridge fails visual parity, migrate only the failing layer to Phaser objects in a separate bounded change.
3. Preserve current Library, Ideas, New/Shape/Paint/Mix-ins/Mix/Decor/Finish/Squeeze, replace/delete/reward dialogs, RU/EN copy, CSS styling and responsive behavior. Limit CSS edits to necessary Phaser canvas positioning/focus/input compatibility; take before/after screenshots at identical viewports.

**Gate M4:** full painted/decorated creation→save→reopen→squeeze and all library operations pass with matching visuals and touch feel on a real phone, both locales and original responsive layouts; no duplicated/stuck gestures or independent visible render loop.

### M5 — Platform, persistence, advertising and lifecycle parity

1. Preserve `createSquishyPlatformRuntime` and the single kit `GameplayActivityCoordinator`. Yandex pause/resume, visibility, ads, audio mute and user mute must correctly cancel input and not double-resume/schedule audio. Menu rendered versus gameplay active must have intentional separate semantics.
2. Keep SaveState V3 key/schema, old decoder compatibility and grant IDs unchanged. Test seeded old saves, new saves read by the **old build**, V2 migration, 8/10 capacity, full-shelf replace/delete, write failures, reward retries/duplicate callbacks and local/cloud paths. The V3 loader may return defaults on corrupt reads: preserve original unreadable data rather than overwriting it in an incidental migration.
3. Capture old analytics/interstitial event traces before replacing DOM-mutation-derived signals with typed successful stage/save events. Keep the exact natural break and ad cadence; `finish → squeeze` counts only after a durable successful save, never during painting or mixing. Test rewarded close-without-grant and ad no-fill/error unblock.

**Gate M5:** old/new behavior parity for save/ads/analytics, same product language and audio, current orientation, both mock/stub and hosted Yandex DRAFT on the exact candidate.

### M6 — Release candidate, device/DRAFT acceptance and reversible cutover

1. Build a branch/commit-addressed candidate ZIP with real Yandex runtime and `index.html` at ZIP root; test **hosted Yandex DRAFT before merging the default entry** because `main` can deploy Pages. Verify ready once, GameplayAPI lifecycle, pause/resume, ads, storage, translations, presentable first frame and ordinary repeat sessions.
2. Run `npm run release:check`, `npm run qa:browser`, candidate Phaser/browser/touch QA and actual-device comparisons at **the same portrait, desktop and existing responsive landscape viewports**. Cover all stages, UV/decor/overlays, audio, context loss, scene/resource leaks, bfcache, V3 fixtures and ad traces. Check full uncompressed Yandex upload size against existing Squishy-specific **5 MiB cap** (Phaser adds bundle weight); do not relax cap by default.
3. Review final diff and actual ZIP independently. Update active `AGENTS.md`, `docs/PROJECT_DECISIONS.md`, README and release docs, remove raw renderer/spike only after candidate passes, keep known-good old archive and prove rollback reads current V3 data. Switch default entry, merge only after green checks, verify Pages post-merge and Yandex deployment separately.

**Gate M6:** no critical functional/visual/tactile regressions on same-layout devices, real DRAFT acceptance for exact artifact, and validated rollback. Do not claim shipping from CI alone.

## 5. PR topology, stopping conditions and deferred landscape

1. Scoped documentation exception + baseline fixtures + simulation extracted in old renderer.
2. Temporary bootstrap comparison + separate **portrait-first** Phaser entry with old DOM/CSS and real-phone check.
3. Complete GLSL/appearance `Extern` and GL-compositing parity.
4. Playfield input + all studio/library stages + overlays without visual redesign.
5. Platform/save/ad verification + branch DRAFT + reversible cutover.

Stop or change course if required GL composition needs unsafe hacks, real touch feel deteriorates, target devices lack WebGL2, release size/performance becomes unacceptable, hosted DRAFT access is blocked, V3 backward compatibility fails or rewards cannot be proven once-only. The working raw game is the fallback. PR #31 stays a draft feasibility reference; never merge it as production just because its three tests passed.

**Time:** earlier **14–25 person-day envelope included landscape rework and must not be reused as a new commitment**. The engine-only migration removes layout redesign, but full appearance/decor, input, GL and hosted testing remain substantial. Re-estimate after M2 and one complete saved/decorated toy in M3–M4; do not infer a completion date from the small spike.

**Post-migration landscape project (separate):** decide target screen aspect and shortest height, portrait rotation gate policy, kit viewport/orientation policy, landscape Library/studio/dialog layout, safe areas and real touch UX; implement/review/release separately with its own acceptance and regression tests. No landscape-specific code or UI restructuring is a prerequisite for engine migration.

## 6. Sources

Current game: [`AGENTS.md`](../AGENTS.md), [`PROJECT_DECISIONS.md`](PROJECT_DECISIONS.md), [`Sandbox pivot`](SANDBOX_PIVOT_01_MASTER_PLAN.md), [`SquishSurface`](../src/squish/SquishSurface.ts), [`SandboxApp`](../src/sandbox/SandboxApp.ts), [`V3`](../src/platform/saveV3.ts), [`releaseSession`](../src/platform/releaseSession.ts), [`release QA`](../tests/release/release.spec.ts).  
Spike: [PR #31](https://github.com/DanilaH/squishy-squishes/pull/31), [spike limitations](https://github.com/DanilaH/squishy-squishes/blob/experiment/phaser4-squish-extern/docs/PHASER_MIGRATION_SPIKE.md), [actual portrait mouse test](https://github.com/DanilaH/squishy-squishes/blob/experiment/phaser4-squish-extern/tests/phaser/phaser-spike.spec.ts).  
Kit: [API](https://github.com/DanilaH/mini-games-kit/blob/797b5689767e9dc1059514e0446479e054bf1352/docs/API.md), [bootstrap policy](https://github.com/DanilaH/mini-games-kit/blob/797b5689767e9dc1059514e0446479e054bf1352/docs/BOOTSTRAP.md), [reference entry](https://github.com/DanilaH/mini-games-kit/blob/797b5689767e9dc1059514e0446479e054bf1352/bootstrap/yandex-phaser/src/main.ts), [viewport](https://github.com/DanilaH/mini-games-kit/blob/797b5689767e9dc1059514e0446479e054bf1352/bootstrap/yandex-phaser/src/app/viewport.ts), [DRAFT playbook](https://github.com/DanilaH/mini-games-kit/blob/797b5689767e9dc1059514e0446479e054bf1352/docs/yandex/DRAFT_RELEASE_PLAYBOOK.md).