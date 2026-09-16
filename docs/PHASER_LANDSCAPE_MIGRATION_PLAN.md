# Squishy Squishes → Phaser 4 + landscape: migration plan

**Status:** planning only; implementation and release are NOT approved by this document. 2026-09-16.  
**Source baseline:** `main` at `1c6f30e0e126ea2ffda96a85be04fc821a70a0cf`; isolated feasibility spike PR #31, `experiment/phaser4-squish-extern` at `495ed990a306eb163eb9742f0d3f1be31e200dc5`. Kit revision pinned at `797b5689767e9dc1059514e0446479e054bf1352`. **New product requirement:** landscape is the target for Squishy as well; the existing portrait layout is not the target UX. Recheck these refs before implementation; do not blindly merge PR #31.

## 1. Intent, boundaries, exact success claim

Deliver the current freeform Library → Shape → Paint → Mix-ins → Mix → Decorate → Finish/Save → Squeeze game under the common Yandex + Phaser startup/release pipeline, **in landscape**. Phaser 4.2.1 must own the game lifecycle, scene update, on-screen WebGL2 canvas/context and gesture routing. The production shape-field algorithm, shaders, tactile response, content IDs, save format, ad policies and actual player creations must survive. Adopt the kit bootstrap's production contracts rather than duplicating equivalent infrastructure under new names.

**Not this migration:** new economy, recipes/XP, new shapes or materials, UI-pack acquisition, visual redesign beyond a usable landscape reflow, retuning physics, changing ad cadence or save schema, importing Signal 2000's arbitrary render/asset budgets. Track later art polish separately. Legacy recipe/XP documents are historical; see `AGENTS.md` and `docs/SANDBOX_PIVOT_01_MASTER_PLAN.md` for product intent.

**Do not conflate:** one on-screen WebGL2 renderer with zero canvases anywhere. Offscreen Canvas 2D used for painting/texture baking is legitimate; the existing visible accessory and rigid-pearl Canvas 2D overlays must either be migrated to Phaser display objects or explicitly documented as a temporary bridge. No second concurrent WebGL game loop/canvas or second authoritative pointer pipeline.

**Definition of complete:** default Pages and Yandex build launch the Phaser version, landscape UI is usable on actual phones, original saves are read without rewriting their schema/IDs, all creation and library flows work, ads and platform events obey existing policy, both release gates pass, hosted Yandex DRAFT and real touch pass, and a rollback build remains usable with unchanged V3 data. Green spike CI alone is NOT release acceptance.

## 2. Verified starting state and unproved areas

| Component | Verified starting point | Migration seam / gap |
| --- | --- | --- |
| Squish GPU + physics | `src/squish/SquishSurface.ts`: 16×16 spring mesh, shape field, original GLSL, independent RAF, `getContext('webgl2')`, canvas pointer handlers, material/appearance uniforms. | Split deterministic simulation, coordinate projection and GPU ownership; move to Phaser frame/input and `Extern` without changing feel. |
| Feasibility spike | PR #31: Phaser 4.2.1 `Extern` renders the original GLSL/soft-square field on Phaser's single WebGL2 context. Three Chromium tests passed. | Physics is copied, one shape/material only; no appearance, real touch, landscape tests, actual DRAFT, advanced compositing. The “phone” test uses a **390×844 portrait viewport and Playwright mouse**. |
| Studio | `SandboxApp.ts` owns DOM workflow, painting via 2D texture canvas, UV hit/projection, mix-in and sticker placement, separate visible accessory/pearl canvases, own animation frames, audio. | Full material/texture/decor rendering and a single gesture owner per stage; landscape UI reflow. |
| Library | `SandboxLibraryApp.ts` owns cards, Ideas, new/open/delete/replace, eight slots and optional rewarded expansion to ten. | Preserve UX and data, make scene transitions and lifetime explicit. DOM library is allowed as a conscious accessible overlay, NOT an accidental second gameplay framework. |
| Platform | `src/platform/runtime.ts` already uses the kit's Yandex runtime/mock, activity, storage and Metrica; `src/app/bootstrap.ts` owns V3 save and ready. `releaseSession.ts` observes DOM stage mutations for analytics/interstitial. | Reuse one platform runtime, no duplicate Yandex SDK, move stage events to a typed controller; define actual gameplay desired state, semantic ready and teardown. |
| Release | `release:check`, browser QA, Pages/Yandex builds and 5 MiB Squishy-specific Yandex cap exist. | Maintain all current gates, add Phaser/landscape/device/DRAFT validation and verify bundle growth rather than relaxing the cap by default. |

Reference kit: `mini-games-kit/docs/BOOTSTRAP.md`, `docs/API.md`, `bootstrap/yandex-phaser/BOOTSTRAP.md` and `BOOTSTRAP_MANIFEST.json` at the pinned SHA. **Generator refuses a nonempty destination**; generate a temporary clean reference project to diff contracts, then integrate reviewed pieces into this existing repository. Do not run it over the game or copy its placeholder scene, save/ad semantics, landscape numbers or branding wholesale.

## 3. Target ownership model

```text
src/main.ts
  └─ startup coordinator: real Yandex or local mock + image-format selection + error/preload shell
      ├─ one PlatformRuntime: activity, ads, analytics, storage, language
      ├─ one V3 SaveRepository and settings repository (same keys/codecs)
      └─ Phaser.Game (WEBGL/WebGL2 explicit; one visible GPU canvas)
           ├─ Library scene / UI presenter (semantic first usable frame)
           └─ Studio scene: stage controller + Phaser input + scene update
                ├─ SquishSimulation (pure state / mesh / UV projection, no DOM/GL/audio)
                ├─ SquishExtern (GL resources, shaders, shape/appearance textures)
                ├─ appearance/decor baking (offscreen 2D texture source)
                └─ foreground accessories and rigid inclusions (Phaser objects)

Typed domain events → analytics/interstitial policy; activity blockers → gesture cancel + audio mute/pause.
```

Phaser is the owner of rendered playfield and input. **UI policy:** temporarily keep the existing accessible DOM Library and control panels as a presenter to reduce risk, but reflow them for landscape and bridge through typed commands/events. This does not imply the bootstrap requires Phaser-drawn buttons. By final acceptance, explicitly record whether DOM controls are the supported permanent UI boundary or replace them with Phaser UI if actual product/asset evidence warrants it. Do not claim a fully Phaser-rendered interface while DOM remains. One offscreen 2D appearance canvas is fine; remove redundant *visible* animation loops where Phaser can update overlays.

## 4. Work packages, dependencies and gates

Each package is a bounded PR or reviewable sequence. Changes to the old production entrypoint remain behind a candidate entry/flag until cutover. Merge only coherent, green increments into `main`; PR #31 stays a reference, not a production merge.

### M0 — Freeze reference and acceptance fixtures (must precede engine edits)

- Inventory active files, generated artifacts, launch URLs and actual stage transitions. Mark legacy docs as historical when encountered; use `AGENTS.md` for active product truth.
- Preserve representative V3 saves **without private user data**: empty; painted+mix-ins+decored creation; six shape IDs/six materials; library at 8 and unlocked 10; optional Ideas; existing V2→V3 fixture; settings mute. Check encoding/decoding, IDs, timestamps, ordering and library capacity. Keep fixture copies separate from real user storage. Never reset or rename `squishy.save.v3` to make tests pass.
- Capture before/after baselines of hero still/gesture positions, hit-testing and UV round-trip, paint exit/re-entry, accessory/pearl attachment, shader material differences, audio response and release/ad events; record p95 frame time, first usable frame and build bytes on matched devices/builds. Pin comparison method instead of inventing fixed performance targets.
- List landscape target viewports (real phone landscape including short height/notch/safe area, desktop; portrait becomes a rotation gate), precise UI reflow acceptance and minimum touch-target/legibility checks. Establish an actual phone + hosted Yandex DRAFT path before cutover.
- **Gate M0:** baseline fixture tests and reproducible screenshots/videos exist; known exceptions documented. No gameplay refactor until this foundation can detect regressions.

### M1 — Extract `SquishSimulation` without behavior changes

- Move mesh state, physics constants/integration, gesture begin/move/end/cancel, UV mapping from deformed vertices, squeeze metrics and fixed-delta handling out of `SquishSurface`. Inject delta/time and normalized coordinates; the simulation must not import DOM, GL, Phaser or WebAudio. Keep original shaders and shape definitions unchanged.
- Adapt **existing raw WebGL build** to use the extracted simulation first, so production behavior is exercised before Phaser depends on it. Keep audio as a subscriber to simulation interaction metrics, not as an internal physics dependency.
- Deterministic unit traces compare before/after vertex states, compression, release impulse, squeeze count, hit/projection and time-clamp behavior for identical inputs; browser parity checks on representative shapes/materials.
- **Gate M1:** raw renderer still passes complete release QA; no duplicated spring algorithm survives in production migration code. Spike copy may remain isolated until removed.

### M2 — Establish the kit-compliant landscape Phaser shell

- Generate an isolated clean bootstrap from pinned kit and make a **contract-diff checklist** for every manifest file: adopted as-is, adapted with evidence, already implemented, or intentionally not applicable. Put decisions in `docs/PROJECT_DECISIONS.md`; do not fork common Yandex helpers without a demonstrated gap.
- Create a separate candidate entry/preview and `Phaser.Game` with explicit WebGL2 support/error fallback policy; reuse kit's preload/failure shell, runtime image-format probe, startup timeline, hosted-iframe-safe debug, production/debug mode and audit semantics. Preserve Squishy-specific analytics adapter, V3 storage, reward/ad policy and both base paths.
- Use shared `BrowserViewportWatcher`/bootstrap orientation blocker and resize strategy, **landscape required**. Reflow Library + controls for safe areas, narrow/short landscape and desktop; confirm orientation gate is outside gameplay, does not accidentally count playtime or leave audio running. Resolve Phaser pixel/scale/camera/pointer mapping with a single documented coordinate transform and DPR cap chosen from measured devices.
- Emit semantic presentable only after the actual library/control frame is drawn; await paint settling, call `markReady()` exactly once, set gameplay desired only for appropriate interactive stages (document stage policy), and ignore stale async completion after teardown. No fake preload progress when resource queue is empty.
- **Gate M2:** candidate can launch/rotate/recover on a physical landscape phone without stealing production routes; no double runtime, no incorrect ready call, no phone UI overflow. Both current release builds remain green.

### M3 — Full WebGL2 `Extern` + appearance parity

- Build production `SquishExtern` using the same simulation, 6 canonical shape fields and original shaders/uniform meanings: all 6 materials, sheen/rim/press/compression, filling modes, mold/fill progress, wireframe diagnostic and appearance texture. No silent substitution by Phaser graphics/sprites for deformable surface.
- Port appearance upload: use the existing normalized UV document and offscreen 2D replay; handle `UNPACK_FLIP_Y_WEBGL`, `UNPACK_ALIGNMENT`, texture units, texture disposal, async upload after shutdown and lost/restored context. Verify transparent edges, stencil/clip and consistent scaling/UV under landscape camera resize.
- Make GL state interop explicit. The spike binds the base framebuffer and sets viewport/blend/depth/stencil/scissor; test Phaser sprites/text and masks **before and after** the Extern plus multi-scene transitions. Confirm which state `YieldContext/RebindContext` guarantees at pinned Phaser 4.2.1; never assume arbitrary cameras, FX, render textures or other pipelines work. Either implement the needed compositing correctly or document unsupported features and avoid them.
- Remove the spike's `context as CanvasRenderingContext2D` cast from production unless a narrowly isolated, pinned and browser-tested adapter proves unavoidable. Explicit WebGL2 unsupported UI is preferable to a successful Canvas fallback that renders an invisible squishy.
- **Gate M3:** pixel/gesture/UV comparison on all shape/material representatives, no GL errors or corrupted Phaser UI, context loss/restore and scene churn survive; one visible WebGL2 renderer, not a private RAF.

### M4 — Gesture ownership, paint/mix/decor and landscape UX

- Introduce a stage controller with typed transitions/commands. Phaser owns pointer down/move/up/outside/cancel on the playfield, capture and stage-specific gesture policy; DOM buttons remain normal accessible DOM events while they exist. On switching stage or a platform blocker, cancel the active gesture and flush/abort its transient operations deterministically.
- Preserve outside-to-inside Paint semantics, UV clipping, brush/eraser/undo/clear, max appearance bytes/strokes, mix-in spacing/limits, distance-based Mix completion, sticker coordinates and finish-only passthrough. `pointerdown` started outside the shape must not suddenly become a paint stroke; distinguish deliberate outside-to-inside Paint from squeeze hit-testing. Test pointer-id identity, repeated taps, cancel/blur, multi-touch contention, rotated phone and DOM overlay occlusion.
- Replace visible accessory/rigid-pearl canvas RAF overlays with Phaser scene objects where feasible, preserving front/back layering, head anchors, rest/deformed UV projection and appearance across resize. If a DOM bridge is temporarily needed, give it explicit ownership, teardown and an exit criterion rather than two simultaneous hit-test systems.
- Reflow landscape Library, New/Shape/Paint/Mix-ins/Mix/Decor/Finish/Squeeze and confirmation dialogs. Maintain RU/EN labels; no truncated destructive action, no below-fold main controls, no inaccessible touch zones on short landscape. Do not purchase/import the UI kit as a hidden dependency of engine migration.
- **Gate M4:** full creation cycle, save/reopen/squeeze, Ideas, replace/delete/8→10 reward, both locales and landscape rotations pass browser + actual touch; before/after tactile comparison is accepted on device.

### M5 — Platform, audio, persistence and business-policy parity

- Keep a single `createSquishyPlatformRuntime` and single activity coordinator. Connect kit orientation/visibility/Yandex/ad blockers to Phaser update/input and the existing `SquishyAudio` WebAudio mixer; avoid double mute systems. Ensure resume never restarts a stale gesture, duplicate audio nodes or gameplay after a foreground ad. Preserve user mute setting.
- Preserve the V3 codec/key, V2 migration, saved IDs, content IDs, capacity, existing reward ID and exact-once grant, append/replace/delete and serialized flush. Test save failure/retry, app close during grant/write, cloud/local reconciliation where supported; **do not clear storage as part of migration**. Audit old-build read compatibility before any new writes so rollback cannot strand data.
- Replace DOM `MutationObserver` as the source of ad/analytics truth with typed stage/save events while preserving the old action/interstitial grace/interval counts and natural-break-only policy. Review gameplay desired-state policy explicitly: ready on usable Library frame, GameplayAPI active only for eligible play, blocked during ads/orientation/visibility; mock/stub checks do not constitute hosted Yandex proof.
- **Gate M5:** parity matrix for save/ads/analytics/pause/resume/language in both builds, including rewarded close-without-reward=0, reward callback exactly once and no interstitial in painting/mixing/squeezing; hosted DRAFT verification of real SDK behavior.

### M6 — Release candidate, validation and reversible cutover

- Keep `release:check` and browser QA; add candidate landscape QA and build-root checks, plus shader/GL tests, representative save fixtures, scene/texture/listener leak cycles, startup readiness timing, real phone browser/WebView rotation, and Yandex DRAFT boot/ads/storage/hosted diagnostics. Identify **the exact archive** by commit/hash. Test full RU/EN flow on desktop and phone landscape; portrait gate should recover on return to landscape.
- Compare matched baseline and candidate on startup, actual input latency/feel, memory/context loss and p95 frame time. Investigate regressions instead of applying arbitrary FPS/DPR/asset numbers. Keep current **5 MiB uncompressed Yandex cap** unless a separately evidenced and reviewed product-specific decision changes it; Phaser spike alone produced a ~1.4 MB minified JS chunk before the complete game.
- Complete an independent diff + artifact review and refresh `AGENTS.md`, README, source-of-truth architecture/decisions; remove stale blanket “no Phaser” instructions, spike-only entry and unused raw renderer only **after** candidate acceptance. Ship Yandex DRAFT before public upload. Retain last known-good build and verify old V3 reader compatibility for a straightforward rollback.
- **Gate M6:** all listed gates green, DRAFT + real-device evidence recorded, no unresolved P0/P1 regressions, explicit cutover/rollback checklist. Only then replace production `index.html` and release candidate. Post-merge check actual Pages deployment and uploaded Yandex build; a merged PR alone is not a released game.

## 5. Delivery topology and stop conditions

Suggested PR slices: (1) parity fixtures + simulation extraction; (2) bootstrap contract map + landscape candidate shell; (3) production Extern/texture parity; (4) stage input + overlays + landscape controls; (5) platform/save/events + release validation/cutover. Narrower PRs are fine; do not force all risk into a single giant diff. Keep `main` playable at each step. Candidate entry must not leak dev diagnostics or `phaser-spike.html` into Yandex upload ZIP. The existing spike PR #31 remains a **draft technical reference**, not something to squash-merge wholesale.

**Stop/reconsider:** Phaser GL state cannot coexist reliably with required UI; real-phone feel/input latency materially regresses; observed memory or asset/runtime cost exceeds supported budget; WebGL2 availability on target Yandex devices is inadequate; missing DRAFT access blocks verification; save backward compatibility cannot be guaranteed. At a stop gate, keep/restore working raw-WebGL production and consider kit-compatible engine-neutral adapters rather than pretending a green CI is enough.

## 6. Scope estimate, dependencies and open decisions

Planning envelope: **roughly 14–25 engineering person-days** for a focused migration with landscape reflow, excluding optional visual redesign, UI-pack import and unpredictable external DRAFT/moderation waiting. Not a delivery promise. M0/M1/M3/M4 dominate uncertainty; adjust after extracting physics and running one full decorated save in the candidate. Prior informal 5–10-day estimate did not account for landscape, full appearance/overlays or hosted QA.

Must decide from evidence before final implementation: (a) landscape composition and smallest supported usable height, not blindly a Signal-specific fixed canvas size; (b) whether accessible DOM Library/HUD remains an intentional final presenter or a separately funded full Phaser-UI conversion; (c) supported WebGL2 fallback/error copy; (d) metric/performance tolerances from matched baseline and target hardware; (e) hosted DRAFT access and real devices. None justify modifying save/economy/ads by default.

## 7. Links / provenance

- [Active product and agent contract](../AGENTS.md), [current infrastructure decisions](PROJECT_DECISIONS.md), [Sandbox pivot](SANDBOX_PIVOT_01_MASTER_PLAN.md), [release test suite](../tests/release/release.spec.ts).
- [Prototype PR #31](https://github.com/DanilaH/squishy-squishes/pull/31), [experiment limits](https://github.com/DanilaH/squishy-squishes/blob/experiment/phaser4-squish-extern/docs/PHASER_MIGRATION_SPIKE.md), [spike tests](https://github.com/DanilaH/squishy-squishes/blob/experiment/phaser4-squish-extern/tests/phaser/phaser-spike.spec.ts).
- [Kit bootstrap policy](https://github.com/DanilaH/mini-games-kit/blob/797b5689767e9dc1059514e0446479e054bf1352/docs/BOOTSTRAP.md), [bootstrap entry](https://github.com/DanilaH/mini-games-kit/blob/797b5689767e9dc1059514e0446479e054bf1352/bootstrap/yandex-phaser/src/main.ts), [viewport](https://github.com/DanilaH/mini-games-kit/blob/797b5689767e9dc1059514e0446479e054bf1352/bootstrap/yandex-phaser/src/app/viewport.ts), [Yandex DRAFT](https://github.com/DanilaH/mini-games-kit/blob/797b5689767e9dc1059514e0446479e054bf1352/docs/yandex/DRAFT_RELEASE_PLAYBOOK.md).
