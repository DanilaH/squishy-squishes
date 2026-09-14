# Squishy Squishes — Technical Direction

**Status:** ACTIVE PRODUCTION DIRECTION — current bounded implementation is `PRODUCTION_SKELETON_01.md`

## 1. Stack

Planned MVP baseline:

- **TypeScript** with strict compiler options;
- **Vite**;
- **raw WebGL2** for the hero tactile/material rendering path;
- **DOM/CSS** for lightweight HUD, recipe selection, collection and settings;
- **WebAudio** via shared kit primitives plus project-specific small one-shots;
- **Yandex Games SDK** through shared platform/runtime adapters;
- no backend.

Do not add Phaser, React, Pixi, Three.js, a physics engine, ECS or a second renderer absent concrete production evidence.

The feel probe already demonstrated that the risky hero mechanic works without them.

---

## 2. Shared-kit baseline

The probe is historical evidence on `mini-games-kit@2da5b501a7e47fbe4b3683069b34f8e252116963`.

The full game is planned against reviewed revision:

`d17ba31fce2a71335dcc3095f772c3fdd87fe97b`

Relevant public surfaces at that revision:

### Core

- continuous interaction progress/velocity semantics;
- presentation skip controller if later justified;
- durable pending transaction only if an actual exactly-once staged mutation needs it;
- gameplay RNG / weighted choice if deterministic gameplay later gains randomness;
- bounded value-transfer presentation;
- render-density helpers.

### Feel / audio

- pointer normalization/response helpers where useful;
- idle drift / parallax helpers;
- `ContinuousNoiseTexture`;
- `PresentationAudioMixer`;
- pitch/accumulation helpers.

### Platform / Yandex

- `GameplayActivityCoordinator`;
- visibility/orientation blockers;
- `ActionInterstitialGate`;
- `StorageAdapter`;
- `JsonStorageRepository`;
- Yandex runtime bootstrap;
- Yandex ads adapter;
- optional local-first Player Data mirroring;
- Metrica analytics adapter;
- mock platform runtime.

### Asset tooling

- generated-image cutout / transparent normalization / validation where generated 2D assets are used.

Project-specific policy stays local.

---

## 3. Rendering architecture

### One hero WebGL surface

Use one main WebGL2 canvas for:

- raw material;
- deformable squishy;
- mold/result hero;
- material shading;
- fillings/decals that need to deform with the surface;
- contact shadow or closely coupled hero effects.

Avoid stacking multiple canvas renderers for separate stages unless profiling proves it simpler.

### DOM overlay

Use DOM/CSS for:

- recipe selector/cards;
- Lab Rank/progress;
- collection UI;
- contextual hint text;
- settings/mute;
- debug panel;
- orientation gate if one is chosen;
- simple result labels/buttons.

This keeps text crisp, localization cheap and layout iteration fast.

---

## 4. Generic squish renderer

The existing probe code is a prototype, not the final API, but its production architecture should preserve these ideas:

```text
regular bounded mesh
+ shared deformation simulation
+ shape mask/SDF
+ material parameters
+ filling/decal parameters
+ pointer/press state
→ rendered squishy
```

### Mesh

Initial production baseline can remain around the validated 16×16 cell density and be tuned from representative devices.

Do not increase geometry density by habit. The mesh is only as dense as needed for silhouette/material quality.

### Shape representation

Preferred direction: one generic mesh clipped/shaded by a per-shape mask/SDF or another small data representation.

A shape definition may provide:

```ts
interface ShapeDefinition {
  id: ShapeId;
  mask: ShapeMaskReference;
  visualScale: number;
  visualOffset: readonly [number, number];
  softness?: number;
  bulge?: number;
  returnSpeed?: number;
  decorationAnchors?: readonly DecorationAnchor[];
}
```

The exact format may change after implementation experiments.

The invariant is stronger than the type: **same renderer/deformation model, data-driven silhouette differences.**

### Material representation

Use a bounded shader feature set rather than one shader per recipe.

Conceptual recipe material config:

```ts
interface MaterialStyle {
  baseColors: readonly string[];
  translucency: number;
  rimStrength: number;
  sheenStrength: number;
  sheenHueShift: number;
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
- deterministic seeded layout for a recipe instance if stable appearance matters;
- simple cosmetic drift/parallax/deformation coupling;
- no collision solver;
- no per-piece spring graph.

Surface decals should derive from object UV/local coordinates so they remain coherent while the mesh deforms.

---

## 6. Crafting architecture

Crafting should use an explicit small state machine, not a generalized workflow engine.

Conceptual app flow:

```ts
type CraftPhase =
  | 'idle'
  | 'pour'
  | 'add'
  | 'mix'
  | 'mold'
  | 'reveal'
  | 'finish'
  | 'test'
  | 'result';
```

A recipe provides a sequence of supported stage definitions. The orchestrator owns phase transitions; each stage implementation owns its local semantic progress and presentation.

Do not build an arbitrary scripting language for recipes.

---

## 7. Domain/data boundaries

Recommended project structure after full-game implementation begins:

```text
src/
  app/
    bootstrap.ts
    gameController.ts
  content/
    shapes.ts
    materials.ts
    fillings.ts
    finishes.ts
    recipes.ts
    progression.ts
  game/
    craft/
      craftState.ts
      stages/
        pourStage.ts
        applyStage.ts
        squishStage.ts
        moldStage.ts
      progression.ts
      collection.ts
      milestones.ts
    render/
      SquishRenderer.ts
      deformation.ts
      materials.ts
      fillings.ts
      shaders/
    audio/
      gameAudio.ts
    ui/
      labUi.ts
      collectionUi.ts
  platform/
    runtime.ts
    saveCodec.ts
    settingsCodec.ts
    analytics.ts
    monetization.ts
  debug/
    createDebugPanel.ts
    debugScenarios.ts
  i18n/
    en.ts
    ru.ts
    index.ts
  main.ts
```

Exact filenames may evolve. Keep these ownership boundaries:

- content definitions are data;
- domain progression/collection rules are pure where practical;
- renderer does not mutate save/progression;
- UI does not own economy/progression truth;
- platform adapters do not know Squishy recipe semantics;
- scene/stage choreography may visualize committed truth but does not grant it from tween callbacks.

---

## 8. Save model

MVP save should remain small and versioned.

Conceptual state:

```ts
interface SaveStateV1 {
  version: 1;
  labXp: number;
  completedRecipeIds: string[];
  unlockedRecipeIds: string[];
  totalCrafts: number;
  selectedRecipeId: string | null;
  tutorialComplete: boolean;
  updatedAt: number;
}
```

Whether `unlockedRecipeIds` is persisted or derived from XP is a local design choice; prefer deriving redundant state when it keeps migration/reconciliation simpler.

Use shared `JsonStorageRepository` for JSON mechanics/write ordering with a Squishy-local codec/migration/validation layer.

Settings live separately:

```ts
interface SettingsV1 {
  version: 1;
  muted: boolean;
}
```

Language normally follows platform language; any development override is not production save truth.

---

## 9. Mid-craft persistence

Do **not** persist every crafting gesture in MVP.

If the tab closes during a 5–15 second stage, restarting the unfinished craft is acceptable unless hands-on/user evidence demonstrates meaningful frustration.

Persist only meaningful durable truth such as:

- completed recipe;
- progression award;
- unlock state;
- total craft count;
- settings.

This avoids importing transaction complexity without a failure mode that justifies it.

---

## 10. Result commit boundary

For a deterministic recipe, result identity is already known before crafting begins.

Recommended approach:

1. player completes final semantic crafting requirement;
2. compute deterministic progression/collection delta;
3. write durable result;
4. reveal/test/collect presentation visualizes that owned result;
5. final Collect action exits/banks visually but does not become the only place where ownership can be lost on reload.

The exact commit point should be chosen to avoid replay exploits and lost completion while preserving a natural presentation.

If later design introduces random secret outputs/rewarded mutation where exact staged outcome must survive reload, evaluate `DurablePendingTransactionSession` then. Do not preemptively use it now.

---

## 11. Platform bootstrap

Target one platform-agnostic app entry shape around shared runtime.

Production:

- bootstrap Yandex runtime early;
- attach pause/resume listeners before async boot completes via shared runtime;
- obtain safe storage;
- optionally enable Player Data mirroring with Squishy-specific reconciliation policy;
- load settings/save;
- start app;
- call LoadingAPI readiness once playable.

Development:

- use matching mock runtime with localStorage;
- no fake Yandex globals scattered through game code.

---

## 12. Activity lifecycle

`GameplayActivityCoordinator` should aggregate:

- Yandex pause/resume;
- document visibility;
- ad ownership;
- optional orientation blocker.

When blocked:

- stop semantic input acquisition;
- cancel/release pointer capture;
- pause/quiet owned continuous audio;
- pause expensive animation loop if appropriate;
- do not accidentally resume while another blocker remains.

Activity transitions should be testable outside the renderer.

---

## 13. Orientation/layout

**Proposal awaiting confirmation:** support responsive desktop and mobile with the hero centered, rather than hard-locking landscape from the start.

Reasons:

- core interaction is one centered object;
- DOM UI is sparse;
- portrait is not structurally impossible;
- broader playable surface may be valuable on Yandex.

If implementation shows portrait composition materially weak or moderation/device behavior favors landscape, use the shared orientation blocker and render a simple rotate gate.

Do not inherit Signal 2000's landscape rule automatically; it was a product-specific decision.

---

## 14. Performance targets

Performance is a feel requirement.

Initial production targets:

- stable perceived 60 FPS on representative desktop and mainstream mobile browsers during primary interaction;
- same-frame pointer response where browser scheduling permits;
- bounded dt to avoid explosive spring recovery;
- DPR/backing-store cap via shared render-density helper;
- no per-frame DOM mutations except throttled diagnostics/debug;
- avoid per-frame allocations in deformation hot path;
- reuse typed arrays/WebGL buffers;
- bounded filling/decor count;
- optional visual richness degrades before input responsiveness;
- no continuous hidden-tab work.

Record actual target-device measurements before release; do not call desktop dev-machine FPS proof of mobile readiness.

---

## 15. Audio architecture

Use `PresentationAudioMixer` for ownership of baseline ambience and foreground reveal states where that model fits.

Use `ContinuousNoiseTexture` for tactile continuous stages such as squish/mix.

Project-local audio may include:

- pour/dispense loop or texture;
- short additive filling cues;
- mold press/release;
- reveal one-shots by presentation tier;
- collection/progression cue;
- quiet UI feedback.

Repeated cues should use bounded pitch variation/accumulation helpers rather than identical machine-gun repetition.

Do not create AudioContexts/nodes without deterministic teardown.

---

## 16. Analytics boundary

Game code calls one small analytics interface/event vocabulary. No PII.

Do not put Metrica-specific calls into crafting/render modules.

See `ANALYTICS_AND_MONETIZATION.md`.

---

## 17. Ads boundary

Ads own activity blocking/audio interruption through the shared adapter.

Interstitial eligibility remains local product policy around `ActionInterstitialGate`.

Reward grants are durable domain mutations executed from the rewarded callback; animation is secondary.

Do not show an ad from a background timer. Requests should remain causally tied to an explicit user transition where Yandex timing/moderation behavior remains valid.

---

## 18. i18n

Initial languages: RU + EN.

Use a typed dictionary pattern similar to the previous project:

- one language object defines key shape;
- other languages must satisfy that recursive string shape;
- no runtime string concatenation that makes localization brittle;
- no user-facing text baked into art.

---

## 19. Debug tooling

A DEV-only panel is a production accelerator, not optional polish.

It should support at least:

- select/force any recipe;
- unlock all / set representative progression states;
- seed empty/half/full collection;
- jump to craft phases where safely possible;
- reset save/settings;
- RU/EN debug switch;
- toggle mesh/perf diagnostics;
- force representative tier/reveal states;
- test interstitial/rewarded adapter behavior;
- test visibility/activity interruption where feasible.

Hard-gate internal controls with `import.meta.env.DEV`; query-string switches alone are insufficient for production isolation.

---

## 20. Tests

Prioritize pure/system contracts and lifecycle failure modes.

Minimum expected areas:

- recipe/content registry validity;
- unlock/progression derivation;
- save codec/migrations;
- collection snapshots/milestones;
- stage completion exactly once;
- pause/cancel/release semantics;
- monetization gate policy;
- rewarded grant exactly once per earned callback contract;
- platform/mock runtime integration seams;
- deterministic content IDs;
- no locked recipe can be selected through domain APIs;
- final collection/progression state remains valid after reload.

Renderer math with meaningful invariants may be unit-tested, but screenshot/perceptual feel still requires browser/hands-on acceptance.

---

## 21. CI / private dependency

Because `mini-games-kit` is private, CI must explicitly receive credentials that can read it or use another deliberate installation strategy.

Do not silently vendor shared code or weaken CI to avoid solving authentication.

This is an implementation setup task before the first production PR, not a reason to publish the kit publicly.

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

Implement the smallest structure that cleanly supports this product. Extract only after real second-consumer evidence identifies an expensive reusable boundary.
