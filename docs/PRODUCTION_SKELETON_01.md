# Production Skeleton 01 — production boundaries without gameplay drift

**Date:** 2026-09-14  
**Status:** APPROVED FOR IMPLEMENTATION  
**Branch:** `production-skeleton-01`  
**Supersedes as active gate:** `VERTICAL_SLICE_01.md`, `PRODUCTION_PASS_01.md`, `INTERACTION_PASS_02.md`–`04.md`

## 1. Why this pass exists

The tactile probe and full craft loop have passed hands-on correction. The next risk is no longer whether one squishy can feel good; it is whether the codebase can become a real product without destroying that accepted feel or creating speculative framework complexity.

This pass turns the accepted slice into a small production shell. It does **not** scale the catalog yet.

Canonical accepted loop remains unchanged:

```text
select
→ spread / paint base
→ optional foam-bead shake
→ stretch to mix
→ form with normal taps + target crits
→ reveal
→ free squeeze
→ collect
→ repeat
```

## 2. Primary objective

Create explicit production boundaries around the existing behavior:

- app bootstrap;
- platform/runtime seam;
- versioned save repository;
- separate versioned settings repository;
- typed RU/EN localization skeleton;
- activity/lifecycle ownership;
- DEV-only scenario/debug seam;
- project-local app contract that keeps `VerticalSliceApp` away from browser storage/platform details.

The accepted renderer, stage timings and interaction semantics are **not** being redesigned in this pass.

## 3. Scope

### 3.1 App bootstrap

`src/main.ts` becomes a tiny entry point only.

A production bootstrap module owns:

1. runtime creation;
2. save/settings repository creation;
3. state loading and migration;
4. app construction;
5. lifecycle wiring;
6. `markReady()` after the game is playable;
7. deterministic teardown / repository flush on page exit when practical.

A startup failure must render a small recoverable fatal message rather than leave a blank page.

### 3.2 Platform/runtime seam

Use `mini-games-kit` production surfaces already pinned in `package.json`.

Development / GitHub Pages default:

- `createMockPlatformRuntime()`;
- `WebStorageAdapter(window.localStorage)`;
- document-visibility blocker owned by the runtime.

Yandex seam:

- expose one explicit runtime factory path using `bootstrapYandexPlatformRuntime()`;
- do **not** enable Yandex by default on GitHub Pages;
- select Yandex only through an explicit build/runtime signal (`VITE_PLATFORM=yandex` or equivalent bounded configuration);
- no fake `YaGames` globals and no SDK calls inside game modules.

Cloud mirroring, ads and production analytics policy remain later-phase work. The seam must permit them without another app rewrite.

### 3.3 Save model

Introduce a Squishy-owned versioned save document.

For this production-skeleton pass, save only durable truth that already exists:

```ts
interface SaveStateV1 {
  version: 1;
  completedVariantIds: string[];
  totalCrafts: number;
  updatedAt: number;
}
```

Rules:

- `completedVariantIds` contains only currently known deterministic variant IDs;
- duplicate IDs are removed during decode;
- unknown IDs are dropped, not treated as fatal corruption;
- negative / non-finite counters are rejected or normalized by the codec according to one explicit policy;
- no mid-craft gesture/stage persistence;
- no XP/unlocks yet;
- result completion remains user-driven by the existing Collect action for this pass; moving the durable commit boundary earlier belongs to the progression pass where ownership semantics become meaningful.

The repository uses `JsonStorageRepository` over the platform `StorageAdapter`.

### 3.4 Legacy migration

The current slice wrote discovered IDs directly to:

`squishy.vertical-slice.discovered.v2`

Production bootstrap must migrate that legacy array once when no new save exists:

- read legacy key through the runtime storage adapter;
- validate IDs against current content;
- initialize `SaveStateV1`;
- persist the production save;
- remove the legacy key only after the new write succeeds.

Existing phone/browser progress should therefore survive the architecture pass.

### 3.5 Settings model

Separate non-gameplay preferences from save truth:

```ts
interface SettingsV1 {
  version: 1;
  muted: boolean;
}
```

Use a separate `JsonStorageRepository` key and codec.

Settings decode may use best-effort `loadOrDefault()` because a malformed mute preference must never block play.

The app receives initial muted state and reports mute changes through a callback. `VerticalSliceApp` must not call localStorage directly.

### 3.6 `VerticalSliceApp` contract

Keep the existing class during this pass; do not rewrite the entire stage controller yet.

Change its ownership boundary so it accepts a small options object, conceptually:

```ts
interface VerticalSliceAppOptions {
  completedVariantIds: readonly string[];
  muted: boolean;
  onCompletedVariantIdsChange(ids: readonly string[]): void | Promise<void>;
  onMutedChange(muted: boolean): void | Promise<void>;
}
```

Additional lifecycle hooks are allowed only if needed to pause/release active input deterministically.

Inside the app:

- remove direct save/localStorage reads/writes;
- initialize collection/discovery from injected state;
- persist through callbacks;
- initialize audio/renderer mute from injected settings;
- notify setting changes through callback;
- keep gameplay behavior and current UI unchanged.

Persistence failures must not crash the current craft. Report them from the bootstrap layer and keep the local in-memory state responsive.

### 3.7 Activity lifecycle

Use `PlatformRuntime.activity` as the aggregate lifecycle source.

Minimum behavior:

- mark gameplay desired after app construction;
- when blocked, release owned active pointer/craft interaction state and stop continuous stage audio;
- hidden-tab handling must not duplicate independent visibility listeners that fight the runtime blocker;
- on unblocked/resume, reset frame timestamps before continuing so dt does not jump;
- destroy runtime listeners on teardown.

Do not hard-lock portrait in this pass.

### 3.8 Localization skeleton

Introduce typed `en` and `ru` dictionaries and a tiny translator accessor.

This pass does **not** need every historical/debug string translated. It must establish the production contract and move the highest-frequency player-facing shell copy first:

- recipe-selection heading/hints;
- craft-stage title/hint strings;
- Collect / start actions;
- result/new-material labels;
- mute control labels;
- fatal startup message.

Requirements:

- `en` defines the key shape;
- `ru` must satisfy the same recursive string shape at compile time;
- no platform-specific localization code inside `VerticalSliceApp`;
- language comes from the platform runtime;
- DEV override may be added later; no production language setting persistence yet.

### 3.9 DEV-only debug seam

Do not build the final debug console yet. Establish a production-safe seam:

- debug bootstrap code must only load/run under `import.meta.env.DEV`;
- support at minimum reset save, reset settings and log current runtime/save state;
- no debug controls in production bundles via ordinary query-string-only gates;
- existing visible `Metrics / Mesh / Mute` controls may remain for now, but this pass should make it possible to move internal tooling out of the player surface later.

### 3.10 Render density / renderer

Current `SquishSurface` already consumes the reviewed shared render-density helper from the production kit. Preserve it.

No renderer rewrite, shape abstraction or second-shape work belongs in this pass.

## 4. File/ownership target

Target structure for this pass:

```text
src/
  app/
    bootstrap.ts
  platform/
    runtime.ts
    save.ts
    settings.ts
  i18n/
    en.ts
    ru.ts
    index.ts
  debug/
    installDebugTools.ts
  game/
    VerticalSliceApp.ts
    SquishyAudio.ts
    content.ts
  squish/
    ...accepted renderer...
  main.ts
```

This is deliberately smaller than the long-term architecture sketch in `TECHNICAL_DIRECTION.md`. Do not split every stage into its own module until the second-shape / content-reuse work proves that boundary is useful.

## 5. Data/error policy

### Save corruption

Game save is durable product truth, so decoding is strict enough to avoid silently accepting structurally invalid roots.

Policy:

- missing save → default;
- valid V1 → normalize known IDs and counters;
- malformed root/version/type → log error and start a fresh in-memory default for this pass, without deleting the bad payload automatically;
- later migration versions must be explicit switch branches.

### Settings corruption

Malformed settings → report + default `{ muted: false }`.

### Persistence write failure

- keep the current session playable;
- log/report the failure at bootstrap boundary;
- do not roll UI state backward mid-animation;
- no retry loop in this pass.

## 6. Explicit non-goals

Do not add in Production Skeleton 01:

- second shape;
- Lab XP / Lab Rank;
- unlock table;
- final collection screen;
- new recipes/material families;
- Yandex ads;
- Metrica event vocabulary;
- Player Data/cloud reconciliation;
- rewarded flow;
- orientation blocker UI;
- final debug panel;
- stage-module framework;
- recipe scripting system;
- React/Phaser/Pixi/Three.js;
- physics engine;
- asset pipeline expansion.

## 7. Acceptance criteria

### Behavior preservation

- current six variants are still craftable;
- paint, foam, mix, mold, reveal, squeeze and Collect feel/behave as before;
- no new transition delay is introduced by persistence;
- GitHub Pages build remains usable on phone.

### Persistence

- current completed/discovered variants load through the new save repository;
- legacy `squishy.vertical-slice.discovered.v2` progress migrates once;
- Collect updates production save asynchronously without blocking the visual transition;
- mute survives reload through settings repository;
- malformed settings do not prevent boot;
- malformed save does not blank the app.

### Lifecycle

- document hide / platform block cancels active continuous interaction/audio;
- resume does not cause a large dt jump;
- teardown disposes app + runtime and flushes queued repository writes best-effort.

### Architecture

- no direct `localStorage` in `VerticalSliceApp`;
- no Yandex API in game modules;
- runtime/save/settings/i18n are isolated project boundaries;
- no speculative generic framework introduced.

### Validation

- `npm run typecheck` passes;
- `npm run build` passes;
- production GitHub Pages workflow remains green;
- independent diff review finds no gameplay-tuning drift hidden inside the refactor.

## 8. Exit gate

Production Skeleton 01 is complete when the accepted slice runs through the new runtime/persistence/localization shell with equivalent feel and deterministic lifecycle cleanup.

The **next** product gate is then Renderer Reuse / Second Shape: add exactly one materially different shape using the same deformation/material path before scaling the catalog.
