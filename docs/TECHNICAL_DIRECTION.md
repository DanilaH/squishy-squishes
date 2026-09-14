# Squishy Squishes — Technical Direction

**Status:** ACTIVE PRODUCTION DIRECTION — current bounded implementation is `PROGRESSION_COLLECTION_01.md`

## 1. Stack

MVP baseline:

- **TypeScript** with strict compiler options;
- **Vite**;
- **raw WebGL2** for the hero tactile/material rendering path;
- **DOM/CSS** for lightweight HUD, recipe selection, collection and settings;
- **WebAudio** via shared kit primitives plus project-specific small one-shots;
- **Yandex Games SDK** through shared platform/runtime adapters;
- no backend.

Do not add Phaser, React, Pixi, Three.js, a physics engine, ECS or a second renderer absent concrete production evidence.

The feel probe demonstrated that the hero mechanic works without them. Phase 4 now tests whether that same cheap path survives a materially different silhouette.

---

## 2. Shared-kit baseline

The probe is historical evidence on `mini-games-kit@2da5b501a7e47fbe4b3683069b34f8e252116963`.

The production game is pinned to reviewed revision:

`d17ba31fce2a71335dcc3095f772c3fdd87fe97b`

Relevant shared surfaces include:

### Core

- continuous interaction progress/velocity semantics;
- render-density helpers;
- presentation helpers only where real use justifies them.

### Platform / Yandex

- `GameplayActivityCoordinator`;
- visibility/orientation blockers;
- `ActionInterstitialGate`;
- `StorageAdapter`;
- `JsonStorageRepository`;
- Yandex runtime bootstrap;
- Yandex ads adapter;
- optional local-first Player Data mirroring;
- analytics adapter;
- mock platform runtime.

Project-specific recipe, progression, rendering and persistence policy stays local.

---

## 3. Rendering architecture

### One hero WebGL surface

Use one main WebGL2 canvas for:

- raw material;
- deformable squishy;
- mold/result hero;
- material shading;
- fillings/decals that need to deform with the surface.

Avoid stacking independent canvas renderers for separate stages unless profiling proves it simpler.

### DOM overlay

Use DOM/CSS for:

- recipe selection;
- Lab Rank/progress later;
- collection UI later;
- contextual hints;
- settings/mute;
- debug controls;
- simple result labels/buttons.

This keeps text crisp, localization cheap and layout iteration fast.

---

## 4. Generic squish renderer

The production direction is:

```text
bounded regular mesh
+ one shared deformation simulation
+ data-driven shape boundary / cached field
+ shared material parameters
+ shared filling parameters
+ pointer/press state
→ rendered squishy
```

### Mesh

Keep the validated bounded mesh density unless representative-device profiling justifies a change. Geometry density must not increase merely because more shapes exist.

### Shape representation — Phase 4 contract

The current canonical shape definition is deliberately small:

```ts
interface ShapePoint {
  readonly x: number;
  readonly y: number;
}

interface ShapeDefinition {
  readonly id: ShapeId;
  readonly label: string;
  readonly boundary: readonly ShapePoint[];
}
```

Boundary coordinates are normalized object-local coordinates:

```text
x: -1 left → +1 right
y: -1 bottom → +1 top
```

The same boundary drives:

- generic WebGL silhouette field generation;
- renderer pointer hit testing;
- Canvas2D paint clipping/coverage;
- mold press/target validation;
- future thumbnail generation.

The current renderer uses one cached one-channel signed-distance-like field per shape definition and one shared shader path.

**Hard invariant:** shape differences are silhouette data. No `shape.id` condition may alter spring stiffness, grab/press response, damping, bulge, release behavior, craft progress math, audio behavior or state transitions during the Phase 4 reuse test.

If the second shape needs bespoke deformation tuning to look acceptable, treat that as failed reuse evidence rather than hiding it in optional `softness`/`bulge` fields.

Later catalog evidence may justify additional shared shape metadata, but only after the second-shape gate passes and only when every relevant consumer applies it consistently.

### Material representation

Use a bounded shader feature set rather than one shader per recipe.

Conceptual future material config may include:

```ts
interface MaterialStyle {
  baseColors: readonly string[];
  translucency: number;
  rimStrength: number;
  sheenStrength: number;
  pearlescence: number;
  holoStrength: number;
  internalTint: string;
}
```

Keep expensive features optional and degradable before input responsiveness.

---

## 5. Fillings and decorations

Internal beads/bubbles/stars are presentation elements, not simulation bodies.

Preferred implementation:

- bounded count;
- deterministic seeded layout where stable appearance matters;
- cosmetic deformation coupling;
- no collision solver;
- no per-piece spring graph.

Surface decals should derive from object UV/local coordinates so they remain coherent while the mesh deforms.

---

## 6. Crafting architecture

Crafting uses an explicit small state machine, not a generalized workflow engine.

Current accepted sequence:

```text
select → pour/paint → optional add → mix → mold → reveal → test → collect
```

A later recipe registry may select from a bounded set of supported stage definitions. Do not build an arbitrary recipe scripting language.

The second-shape gate must reuse the exact current stage path; a shape-specific state sequence is a blocker.

---

## 7. Ownership boundaries

Current production boundaries:

```text
main.ts
  → app/bootstrap.ts
      → platform/runtime.ts
      → save/settings repositories
      → typed copy
      → VerticalSliceApp
          → content + shape definitions
          → SquishSurface
          → SquishyAudio
```

Ownership rules:

- content definitions are data;
- `VerticalSliceApp` owns current craft/presentation state, not browser/platform persistence;
- renderer does not mutate save/progression;
- UI does not own durable progression truth;
- platform adapters do not know Squishy recipe semantics;
- bootstrap wires domain events to persistence/runtime;
- animation callbacks do not invent durable rewards.

Do not prematurely split the current compact files into a framework-shaped directory tree. Extract additional modules only when the next real consumer makes the boundary valuable.

---

## 8. Save model

The currently implemented save is intentionally smaller than the eventual progression model:

```ts
interface SaveStateV1 {
  readonly version: 1;
  readonly completedVariantIds: readonly string[];
  readonly totalCrafts: number;
  readonly updatedAt: number;
}
```

Settings are separate:

```ts
interface SettingsV1 {
  readonly version: 1;
  readonly muted: boolean;
}
```

Phase 4 does not bump the schema. Original six variant IDs remain durable; the second shape extends the accepted ID set through the project-local content registry.

When progression/collection lands, introduce only the next fields actually required and migrate deliberately.

Use shared `JsonStorageRepository` for JSON mechanics/write ordering while validation/migration/domain invariants remain Squishy-local.

---

## 9. Mid-craft persistence

Do **not** persist every crafting gesture.

If the tab closes during a short unfinished craft, restarting the craft remains acceptable until evidence says otherwise.

Persist durable truth only:

- completed/collected result;
- later progression/unlock state;
- total craft count;
- settings.

This avoids transaction complexity without a failure mode that justifies it.

---

## 10. Current completion boundary

In the accepted implementation, **Collect** is the semantic event that updates durable variant completion and `totalCrafts`. Presentation updates immediately and persistence is asynchronous so storage latency cannot block the loop.

Do not move ownership into tween/reveal callbacks merely to make persistence look earlier.

Phase 5 may revisit the exact completion point if progression/reload evidence shows that losing a revealed-but-uncollected result is materially harmful. If random staged outcomes are introduced later, then evaluate stronger pending-transaction semantics. Do not preemptively add them now.

---

## 11. Platform bootstrap

The application has one platform-agnostic bootstrap shape around the shared runtime.

Production/Yandex mode:

- initialize Yandex runtime explicitly;
- attach platform pause/resume through shared runtime;
- obtain safe storage;
- load settings/save;
- start app;
- mark LoadingAPI ready once playable.

Development/GitHub Pages mode:

- matching mock runtime;
- browser localStorage behind `StorageAdapter`;
- no fake Yandex globals scattered through game code.

Yandex remains an explicit build/runtime selection; GitHub Pages remains the fast phone-testing surface.

---

## 12. Activity lifecycle

`GameplayActivityCoordinator` aggregates external blockers such as:

- Yandex pause/resume;
- document visibility;
- ad ownership;
- optional orientation blocker later.

When blocked:

- stop semantic input acquisition;
- release owned pointer capture;
- stop/quiet continuous audio;
- prevent craft progress;
- reset timing before resume;
- do not resume while another blocker remains.

Game/render/shape code must not create a competing direct visibility policy.

---

## 13. Orientation/layout

Current baseline remains responsive desktop + mobile with a centered hero rather than a hard landscape lock.

The second-shape selector must fit the phone composition without introducing a separate mobile UI system.

If representative Yandex/device evidence later shows portrait composition is materially weak, use the shared orientation blocker and one simple rotate gate. Do not inherit another game's orientation rule without evidence.

---

## 14. Performance targets

Performance is a feel requirement.

Targets:

- stable perceived 60 FPS on representative desktop and mainstream mobile browsers during primary interaction;
- same-frame pointer response where browser scheduling permits;
- bounded dt;
- DPR/backing-store cap via shared render-density helper;
- no per-frame polygon traversal for shape masking;
- shape field generation only on first use / shape changes, never each frame;
- avoid per-frame allocations in deformation hot path;
- reuse typed arrays/WebGL buffers;
- bounded filling/decor count;
- optional richness degrades before input responsiveness;
- no continuous hidden-tab work.

Desktop CI/build success is not mobile acceptance. Phase 4 remains product-gated on a deployed phone check.

---

## 15. Audio architecture

Continuous tactile audio remains project-local over reviewed shared-kit primitives.

Potential later audio includes:

- pour/dispense texture;
- filling cues;
- mold press/release;
- reveal one-shots;
- collection/progression cues;
- quiet UI feedback.

Repeated cues should use bounded variation rather than identical machine-gun repetition. Audio nodes/contexts require deterministic teardown.

Shape selection must not create per-shape audio behavior in the current reuse gate.

---

## 16. Analytics boundary

Game code calls one small analytics vocabulary. No PII and no Metrica-specific calls inside crafting/render modules.

See `ANALYTICS_AND_MONETIZATION.md`.

---

## 17. Ads boundary

Ads own activity blocking/audio interruption through the shared adapter.

Interstitial eligibility remains local product policy around `ActionInterstitialGate` and must stay causally tied to explicit between-loop transitions.

No ad may interrupt craft, reveal or result squeeze.

---

## 18. i18n

Initial languages: RU + EN.

Use the current typed dictionary pattern:

- one language object defines key shape;
- other languages satisfy the recursive string shape;
- no user-facing text baked into art;
- content labels may later move into typed content localization when the final recipe registry is built.

---

## 19. Debug tooling

DEV-only diagnostics are production accelerators.

Current baseline includes state/reset diagnostics and renderer metrics/mesh controls. Expand only as upcoming phases need it, for example:

- seed progression/collection states in Phase 5;
- force representative recipe/reveal states when catalog production needs it;
- test ad/runtime interruptions before platform hardening.

Hard-gate internal controls with `import.meta.env.DEV`; query-string switches alone are insufficient.

---

## 20. Tests and acceptance

Prioritize contracts/failure modes that can regress silently:

- deterministic content IDs;
- save codec/migrations;
- shape registry validity;
- lifecycle block/release/resume semantics;
- stage completion exactly once;
- future progression derivation and monetization gates when those phases exist.

Renderer geometry can have pure invariant tests where useful, but perceptual silhouette/deformation quality still needs real-browser hands-on acceptance.

For the current second-shape gate, strict typecheck/build + independent diff review are the structural checks; deployed phone play is the product check.

---

## 21. CI / dependency installation

`mini-games-kit` is consumed at an explicit reviewed Git revision. CI must keep that install deterministic and must not silently vendor shared code to avoid dependency setup.

Current GitHub Actions installation/build path is already proven on the production repository. Preserve it unless the dependency distribution strategy intentionally changes.

---

## 22. Architecture stop rules

Do not generalize:

- recipe scripting language;
- animation framework;
- component ECS;
- generic scene manager;
- soft-body library;
- inventory/economy abstractions;
- live-ops config service.

Stop and repair the current boundary if multiple shapes require bespoke deformation code.

Implement the smallest structure that cleanly supports this product. Extract shared code only after real second-consumer evidence identifies an expensive reusable boundary.
