# Squishy Squishes → Phaser 4 + landscape: reviewed migration plan

**Status:** reviewed implementation plan, **not an implemented migration or release approval**. 2026-09-16.  
**Reference:** working `main` commit `1c6f30e0e126ea2ffda96a85be04fc821a70a0cf`; isolated Phaser spike PR [#31](https://github.com/DanilaH/squishy-squishes/pull/31) at `495ed990a306eb163eb9742f0d3f1be31e200dc5`; kit exact ref `797b5689767e9dc1059514e0446479e054bf1352`. Recheck all refs at implementation start.  
**New authoritative user requirement:** Squishy is becoming a **landscape** game. Portrait is a rotation-gate state, not an alternate fully playable layout. This supersedes the old portrait-first architectural choice **for the migration only**. Independent critical second pass: [PHASER_LANDSCAPE_MIGRATION_REVIEW.md](PHASER_LANDSCAPE_MIGRATION_REVIEW.md).

## A. Goal and non-negotiables

Move the **existing sandbox** `Library → New → Shape → Paint → Mix-ins → Mix → Decorate → Finish/Save → Squeeze` onto the common Yandex + Phaser 4.2.1 boot, lifecycle, orientation, startup, diagnostics and release pipeline. Phaser owns the game scene, one visible WebGL2 context/canvas, render frames and playfield input. Keep the production 16×16 spring behavior, original GLSL, shape field, all current six shapes/materials, content IDs, UV-authored appearance/decor, tactile audio, user creations and the kit-backed Yandex services. **Never substitute a screenshot/sprite for the deformable toy.**

Do **not** fold in UI-pack procurement, new appearance art, visual style overhaul, recipe/XP economy, new progression, new material physics, save format change or ads monetization changes. Landscape requires real usability/layout work, not a gratuitous full art redesign. Existing `docs/SANDBOX_PIVOT_01_MASTER_PLAN.md` and `AGENTS.md` define current sandbox intent; historical recipe/XP plans do not.

**Definitions:** one visible *WebGL* game renderer does not ban offscreen Canvas 2D for appearance baking. Existing visible accessory/rigid-pearl 2D overlays and independent RAF loops should be replaced by Phaser display objects; an exception must be named, tested and accepted, not left behind under “where feasible.” DOM Library/controls may remain an intentionally supported accessible presenter: this is still a Phaser **engine/platform** migration, not a claim that every UI button is Phaser-rendered. Decide that boundary explicitly by M2; a fully Phaser-drawn HUD would be a separate scope decision.

## B. Evidence and gaps (do not inflate the spike)

| Existing source | What exists | What has NOT been proven |
| --- | --- | --- |
| `src/squish/SquishSurface.ts` | One raw WebGL2 canvas, its own RAF/pointer handlers, 16×16 spring mesh, shape-field texture, shaders, material/appearance uniforms and metrics. | Engine-independent simulation, parity under Phaser's frame timing and external GL state. |
| `SandboxApp.ts`, `SandboxLibraryApp.ts`, `sandbox-core.css` | DOM stage control, paint offscreen canvas + UV, mix-ins, rigid pearl and accessory *visible* canvas overlays, library/Ideas/delete/replace, portrait-first layout with limited landscape CSS. | Complete landscape controls, Phaser pointer ownership, overlay compositing after rotation. |
| `platform/runtime.ts`, `app/bootstrap.ts`, `platform/saveV3.ts`, `platform/releaseSession.ts` | Already use shared kit Yandex runtime/mock, activity, analytics/storage, V3 save and rewarded expansion; ad/analytics milestones currently inferred from DOM mutations. | A single new startup owner, semantic presentable/GameplayAPI boundaries, stage event parity, rollback with old V3 reader. |
| PR #31 | Original shaders/soft-square field inside Phaser `Extern` sharing one WebGL2 context; 3 green Chromium tests (render/drag desktop, render/drag “phone”, teardown). | **Phone test is 390×844 portrait with Playwright MOUSE.** Physics copied, one shape/material, no paint/decor/save/audio, no real touch, landscape, hosted Yandex or complex Phaser GL compositing. |

**Template rule:** kit `bootstrap/yandex-phaser` is the mandatory source of Phaser/Yandex contracts for new projects. Its generator refuses a nonempty folder; generate a temporary clean reference and **diff every manifest contract** against Squishy. Port/adapt the *mechanisms* into the existing repo, do not overwrite it with a fresh placeholder or silently inherit Signal 2000's asset, layout, storage or ads policy. Use kit `docs/API.md`, `docs/BOOTSTRAP.md`, `bootstrap/yandex-phaser/BOOTSTRAP.md`, `BOOTSTRAP_MANIFEST.json` and hosted DRAFT playbook at the exact pinned SHA.

## C. Intended ownership

```text
App entry / startup: kit preload + real Yandex-or-mock + image format + fatal/debug
  ├─ ONE PlatformRuntime(activity, ads, analytics, language, storage)
  ├─ ONE SaveStateV3 repository + settings (unchanged keys/codecs)
  └─ ONE Phaser.Game: WEBGL2, scene lifecycle, frame loop and playfield input
       ├─ Library / landscape presenter + first usable-frame signal
       └─ Studio scene + typed stage controller
            ├─ SquishSimulation: deterministic physics, mesh, UV/projection (no GL/DOM/audio/Phaser)
            ├─ SquishExtern: own shader/program/texture resources in Phaser's context
            ├─ offscreen 2D appearance/decor baker → texture upload
            └─ Phaser accessory + rigid inclusion display objects

Typed domain events → analytics and interstitial eligibility. One activity coordinator
→ cancel active gesture, mute/resume WebAudio, pause play and gate Phaser input.
```

`Library` and control panels can be DOM **presentation only** behind typed commands; no DOM MutationObserver as the gameplay event source and no second competing pointer owner. The scene must remain renderable and input-safe through resize, rotate, foreground/background and `pagehide`/bfcache. Do not import the spike's `pagehide { once: true }`: a persisted bfcache navigation can consume the one-shot listener and prevent later teardown.

## D. Dependency-ordered packages (reviewable PRs with exit gates)

### M0 — Authoritative exception, reference fixtures and landscape proof

1. On a dedicated implementation branch **first update its `AGENTS.md` and `docs/PROJECT_DECISIONS.md`** with the user-approved Phaser/landscape exception; the existing blanket “do not introduce Phaser” is stale for this migration. Keep current `main`/production safety instructions until cutover. Record what the kit replaces, what remains product-owned, and why portfolio-wide unification matters.
2. Inventory active routes, scripts, fields, CSS, audio callbacks and actual stage transitions. Capture anonymized deterministic V3 fixtures: empty; paint+mix-ins+decor; each shape/material ID; 8-capacity full shelf; rewarded 10-capacity shelf; completed Ideas; mute settings; V2→V3 migration. Preserve ID/timestamp/order/content values, exact storage key `squishy.save.v3` and grant ID. Never use real user data in fixtures or clear real storage.
3. Build before/after parity harness: the old renderer's input trace → vertex/UV/compression/squeeze trace; before/after screenshot/gesture/material/paint/decor comparison; session/reward/ad event traces; current Pages/Yandex uncompressed ZIP, FPS/p95, first usable frame and touch responsiveness on matched test hardware. Define measurement method and tolerances from baseline, not invented benchmark constants.
4. Prototype **landscape screen composition early** with actual available viewport heights, safe areas/notch, browser chrome and readable touch targets: e.g. 568×320/740×360 short landscape, desktop, and portrait gate. Validate real-phone/browser access and branch-addressed hosted Yandex DRAFT upload workflow before relying on it for release.

**Gate M0:** fixtures/traces and landscape wireframe or functional proof are reproducible; scoped docs exception exists; candidate can be reviewed without endangering `main`. If target device/WebGL2 or hosted DRAFT access is unavailable, document the blocker rather than announcing migration success.

### M1 — Extract reusable physics while the old game still works

1. Extract the **single authoritative** `SquishSimulation`: mesh generation/state; current constants, press/grab/release physics; begin/move/end/cancel; shape hit-test; deformed UV ↔ playfield projection; gesture/audio metrics; delta clamp. Inject elapsed time and normalized coordinates. It imports neither Phaser, browser DOM, GL nor audio.
2. Wire the existing `SquishSurface` to this same module **before** introducing it into the production Phaser version. WebAudio becomes a subscriber to metrics/interaction events, not physics-owned global state. Keep original shader source and shape data untouched.
3. Compare deterministic input traces and rendering across several shapes and drag/hold/release timings. Test very low FPS, tab resume, canceled pointer and repeated mount/unmount; old release QA stays green. The spike's copied physics remains reference-only and is deleted on cutover.

**Gate M1:** no physical constants duplicated in active old/new code; raw game still behaves as before. A green typecheck without interaction parity is insufficient.

### M2 — Kit-compliant landscape Phaser candidate (do not swap the default game yet)

1. Generate the pinned bootstrap in an **empty temporary folder**; inventory required files and make an adoption matrix: `adopt`, `adapt`, `existing equivalent`, `not applicable` with validation for every deviation. Reuse Squishy's one existing platform runtime/Metrica/V3/ad service; integrate preload/failure view, startup timeline, AVIF/WebP runtime-image selection, hosted iframe diagnostics, Yandex real/mock split, production/debug builds and upload-root audit. No second SDK initializer or invented loader progress.
2. Add a separate Phaser candidate entry and build/preview route. Require WebGL2 for `Extern` and display an intentional unsupported-device screen instead of silently using Phaser Canvas fallback. Do not carry the spike's `context as CanvasRenderingContext2D` cast into production unexamined: prefer a supported GL setup; if an isolated adapter is unavoidable, pin Phaser and test it across browsers with a documented rollback.
3. Apply kit `BrowserViewportWatcher`/orientation blocker **for landscape**. Use a documented mapping `client/touch → Phaser input → playfield normalized coordinates → simulation UV`, not separate DOM and Phaser scaling guesses; handle DPR/backing-store size, viewport visual changes, camera position, safe-area insets and rotate cycles. Keep the landscape geometry flexible; the kit's 2:1 preset is an option, **not an automatic product decision**.
4. Show actual Library/control UI before emitting `GAME_PRESENTABLE_EVENT`; after real paint settling call Yandex `LoadingAPI.ready()` **once**. Define GameplayAPI desired-state for menus vs active gameplay explicitly and use activity blockers. Guard ready, image probe, storage and GL callbacks against disposal. Use idempotent `pagehide`/`pageshow` handling including persisted bfcache pages (no one-shot pagehide listener). Choose whether DOM Library/HUD remains the deliberate final UI presenter before expanding stage implementation.

**Gate M2:** functional landscape prototype on a **real** phone, portrait gate/recovery, browser touch-emulation, correct safe-area/short-height layout, one platform runtime, no premature ready or double sound, no regressions in existing release builds. `main` default entry remains old game.

### M3 — Production Phaser Extern (all six shapes/materials and textures)

1. Replace spike physics copy with `SquishSimulation`. Implement all original `SquishSurface` feature flags/uniform values: six shapes, six materials, filling style/amount, mold/fill progress, strain/sheens/rim, appearance enabled/disabled and debug wireframe. Reuse *original GLSL and canonical shape field*. Preserve geometry, hit testing and UV under Phaser/landscape resize.
2. Replay existing AppearanceDocumentV1/DecorDocumentV1 onto the offscreen 2D texture and upload to Extern. Verify `UNPACK_FLIP_Y_WEBGL`, alignment, alpha/premultiplication, texture units, active bindings, viewport/scissor/depth/stencil/framebuffer state, and cleanup. Prevent a deferred `requestAnimationFrame`/upload from touching destroyed GL; handle context loss/restore and scene replacement.
3. Audit exactly what Phaser 4.2.1 `Extern` `YieldContext/RebindContext` restores. The spike explicitly draws to the **base framebuffer**; this does not prove masks, render textures, effects or stacked cameras. Test Phaser text/sprites before **and after** Extern, overlapping foreground/back items, resize and repeated scene switches. Support only compositing features the real game needs; if they fail, stop/limit scope rather than layering renderer hacks.

**Gate M3:** golden-image/UV/input parity on representative all-shape/all-material/paint/decor fixtures; no GL errors, blank Canvas fallback, FPS cliff or context-resource leak. Exactly one *visible WebGL* renderer; offscreen Canvas 2D is permitted.

### M4 — Full studio gestures, attached decorations and landscape screens

1. Move stage transitions to typed commands/events. Phaser owns playfield pointers/capture with stage policies; DOM controls (if retained) own only button UI. Preserve source behavior: **Paint may start with pointerdown outside the silhouette and begins drawing upon entry**, never paints beyond the shape; Squeeze/Mix grab requires a valid hit to begin. Cover pointer identity, outside→inside crossing, exiting/reentering, multiple touch pointers, cancel/upoutside/blur, overlaid buttons and touch-action conflicts. Finish-only pointer passthrough must not break Paint/Decor.
2. Keep brush sizes/colors, eraser/undo/clear, max stroke/bytes; mix-in placement/spacing/limits; *real travel* Mix completion; sticker/face placements; all six shapes/materials. Tie rigid pearls and accessory graphic anchors to **deformed** UV; replace their visible 2D RAF canvases with Phaser render objects, preserving front/back depth. Any remaining DOM overlay requires named ownership, acceptance tests and a removal decision.
3. Reflow every screen: Library, optional Ideas, New/Shape/Paint/Mix-ins/Mix/Decor/Finish/Squeeze, replace/delete/reward confirmation and sound. RU/EN strings and controls must be readable, tappable, not clipped behind safe areas or overflowing at the shortest supported landscape height. UI pack and styling overhaul stay independent.

**Gate M4:** completed authored toy including paint/decor saves/reopens with identical visual data, actual-phone tactile acceptance, landscape rotate cycles, both languages, no duplicate/stuck gestures, no second visible RAF render loop.

### M5 — Preserve exact platform and durable behavior

1. Keep existing kit-based `createSquishyPlatformRuntime` and single `GameplayActivityCoordinator`. On SDK pause, ads, visibility/orientation and `pagehide`, cancel any pointer and coherently mute/pause existing `SquishyAudio`; on resume honor user mute and desired play state without spawning duplicate nodes. A ready Library frame and GameplayAPI active game are **not** automatically the same state.
2. **Do not rename/rewrite the V3 save schema/key/IDs.** Test decode/encode and live-compatible old-build read from the candidate's produced V3, seeded old saves, V2 migration, full-shelf replacement, deletion, save failure/retry, failed write, local/cloud storage and reward interruption/duplicate callback. Current V3 load can fall back to defaults on corrupt data: do not overwrite the unreadable original as an incidental migration/recovery strategy; report/retain it for controlled recovery. Rewarded close without grant changes nothing; granted 8→10 expansion remains exactly once.
3. Replace DOM `MutationObserver` in `releaseSession.ts` with typed stage/save events **only after** capturing the old event trace. Preserve existing interstitial natural-break/grace/interval/action counts and actual ad callbacks. No interstitial while painting, mixing, decorating or squeezing; failures/no-fill must unblock. Check language and Metrica without duplicating SDK setup.

**Gate M5:** old/new behavioral parity matrix for saves, analytics, ads, gameplay desired, mute/visibility/reorientation in local stub **and** real hosted Yandex DRAFT. In particular, `finish → squeeze` must count only a successful durable save, not a UI transition alone.

### M6 — Candidate acceptance, safe cutover and rollback

1. Build the **branch/commit-addressed candidate ZIP** with real Yandex runtime and `index.html` at ZIP root; upload to hosted **Yandex DRAFT before merging the default Phaser entry**, because merging `main` may deploy Pages automatically. Verify exact hash/commit, `LoadingAPI.ready()`, actual GameplayAPI pause/resume, ads/reward callbacks, storage, RU/EN, rotation, cold start and repeated session loops. Mock SDK tests are only a prerequisite.
2. Run existing `npm run release:check` and `npm run qa:browser` plus Phaser candidate tests: touch-emulated landscape sizes, real device browser/WebView, all stages, overlays, UV, audio block/resume, context loss, scene/resource/RAF/listener leak cycles, V3 fixtures, ad event parity and before/after p95/latency/startup/memory. Keep the **existing 5 MiB uncompressed Yandex cap** unless a separate evidence-based decision changes it. Spike's ~1.4 MB minified Phaser JS chunk is only a warning, not a full-build measurement.
3. Independently review the final implementation diff and produced artifacts, update `AGENTS.md`, `docs/PROJECT_DECISIONS.md`, README and active architecture. Remove obsolete raw renderer and spike entry only after successful candidate; ensure debug/probe code does not leak into the Yandex upload. Preserve a known-good archive and prove the **old V3 reader** can still load candidate saves for rollback. Switch default entry, merge with green checks, verify actual post-merge Pages deployment and Yandex upload separately.

**Gate M6:** documented full functional/visual/tactile parity and landscape acceptance, real DRAFT evidence for the exact release candidate, no unresolved critical regressions, clear rollback instructions. Do not equate green CI or a merged PR with a shipped Yandex game.

## E. Suggested PR topology and explicit stop rules

1. Contract exception + baseline fixtures + pure simulation in old renderer.
2. Landscape bootstrap contract mapping + independent candidate entry and actual-phone layout proof.
3. Full Extern and appearance/GL compositing parity.
4. Unified gestures, attached/rigid objects, all stages and landscape DOM/Phaser UI contract.
5. Platform/ads/save typed events, candidate QA, hosted DRAFT and final cutover.

Keep `main` playable between PRs, and keep the spike PR #31 as an isolated **draft reference**, not a production-ready cherry-pick bundle. Before M2/M3, re-evaluate whether shared-kit upgrade drift warrants a separately pinned revision; do not float dependency to `main` implicitly.

**Stop or change course if:** `Extern` cannot support *required* blending/layering without risky GL hacks; real-device input/feel is noticeably worse; WebGL2 coverage of the target Yandex audience is insufficient; combined build or decoded texture cost becomes unacceptable; real DRAFT access is blocked; V3 backward compatibility or reward once-only semantics cannot be demonstrated. A functioning raw-WebGL baseline remains the fallback, with engine-neutral kit adapters if necessary.

## F. Planning envelope, unresolved product decisions

A loose **14–25 engineering person-day scope envelope**, **not** a completion/date promise; landscape redesign beyond minimal reflow, full Phaser-drawn UI and inaccessible hosted testing can expand it. Re-estimate after M2 phone landscape proof and M3 one **fully painted+decorated saved toy**, not after a simple single-shape spike. The earlier 5–10-day informal figure was too narrow for this full scope.

Decide explicitly: smallest supported landscape height and safe-area plan; DOM presenter vs fully Phaser UI; WebGL2 unsupported-device behavior; performance tolerances from baseline; actual target devices and hosted DRAFT process. These are product/acceptance choices, **not** permission to change the save, ads or physics gratuitously.

## G. Provenance

Current files: [`AGENTS.md`](../AGENTS.md), [`PROJECT_DECISIONS.md`](PROJECT_DECISIONS.md), [`Sandbox pivot`](SANDBOX_PIVOT_01_MASTER_PLAN.md), [`SquishSurface`](../src/squish/SquishSurface.ts), [`SandboxApp`](../src/sandbox/SandboxApp.ts), [`V3`](../src/platform/saveV3.ts), [`releaseSession`](../src/platform/releaseSession.ts), [`release QA`](../tests/release/release.spec.ts).  
Spike: [PR #31](https://github.com/DanilaH/squishy-squishes/pull/31), [spike notes](https://github.com/DanilaH/squishy-squishes/blob/experiment/phaser4-squish-extern/docs/PHASER_MIGRATION_SPIKE.md), [actual 390×844 test](https://github.com/DanilaH/squishy-squishes/blob/experiment/phaser4-squish-extern/tests/phaser/phaser-spike.spec.ts).  
Kit: [API](https://github.com/DanilaH/mini-games-kit/blob/797b5689767e9dc1059514e0446479e054bf1352/docs/API.md), [bootstrap policy](https://github.com/DanilaH/mini-games-kit/blob/797b5689767e9dc1059514e0446479e054bf1352/docs/BOOTSTRAP.md), [bootstrap entry](https://github.com/DanilaH/mini-games-kit/blob/797b5689767e9dc1059514e0446479e054bf1352/bootstrap/yandex-phaser/src/main.ts), [viewport](https://github.com/DanilaH/mini-games-kit/blob/797b5689767e9dc1059514e0446479e054bf1352/bootstrap/yandex-phaser/src/app/viewport.ts), [hosted DRAFT playbook](https://github.com/DanilaH/mini-games-kit/blob/797b5689767e9dc1059514e0446479e054bf1352/docs/yandex/DRAFT_RELEASE_PLAYBOOK.md).
