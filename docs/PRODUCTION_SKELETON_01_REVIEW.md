# Independent Review — Production Skeleton 01

**Date:** 2026-09-14  
**Reviewed artifact:** `docs/PRODUCTION_SKELETON_01.md`  
**Review posture:** treat the proposed pass as external work; challenge ownership boundaries, migration safety, lifecycle semantics, and scope.

## Verdict

**PASS WITH CORRECTIONS.** The production-skeleton direction is the right next step, but four design details must be tightened before implementation to avoid leaking persistence semantics back into the UI/controller.

## Findings and corrections

### 1. The app callback should report a domain event, not an entire save-shaped collection

The draft options contract proposed:

```ts
onCompletedVariantIdsChange(ids)
```

That would make `VerticalSliceApp` effectively own the durable collection state and leaves nowhere clean to increment `totalCrafts` for repeats.

**Correction:** inject initial completed IDs for presentation, but emit a narrow semantic event:

```ts
onVariantCollected(variantId: string): void | Promise<void>
```

The bootstrap/domain persistence layer owns deduplication, `totalCrafts`, `updatedAt`, and the repository write. The app may still update its local `Set` immediately for responsive UI.

### 2. Lifecycle must work for platform/ad pauses, not only `document.hidden`

The current slice owns a direct `visibilitychange` handler. Merely adding `PlatformRuntime.activity` without changing the app would duplicate visibility ownership and would still fail to block interaction when Yandex pauses gameplay while the document remains visible.

**Correction:** remove the direct visibility listener from `VerticalSliceApp` and expose:

```ts
setActivityBlocked(blocked: boolean): void
```

The bootstrap subscribes once to `runtime.activity.onBlockedChange()` and forwards aggregate state. When blocked, the app must stop continuous audio, release owned pointer state, hide/disable transient mold target interaction and disable renderer interaction. When unblocked, it resets timing baselines and restores interaction appropriate to the current stage.

All input handlers that can mutate semantic progress must reject input while blocked.

### 3. Localization should be injected as player-facing copy, not looked up from platform state inside the app

If `VerticalSliceApp` imports a global translator tied to runtime language, the game controller becomes coupled to application/platform state again.

**Correction:** bootstrap resolves language and creates a typed `GameCopy` object. The app receives that copy. This keeps rendering testable and makes a future DEV language switch an app-recreation or explicit copy-update concern rather than hidden global state.

### 4. Corrupt production save and legacy migration need an explicit precedence rule

The draft said legacy migration occurs when no new save exists, while malformed new save falls back to default. That distinction is correct but must be explicit in code so stale legacy data cannot silently resurrect after a malformed production payload.

**Correction:** first inspect whether the production save key exists. Only if it is physically absent may the legacy key seed V1. If the production key exists but decode fails, report the error and use a fresh in-memory default for this session; do not consult legacy state.

A later successful Collect may overwrite the corrupt production save with a valid V1 state. This is acceptable for this compact local-first game and should be deliberate, not accidental.

## Additional implementation constraints

### Persistence writes must never gate stage transitions

Collect should update in-memory presentation immediately and fire persistence asynchronously. A slow/failing adapter must not delay the `collect → select` transition.

### `totalCrafts` counts repeats

Every successful Collect increments `totalCrafts`, even when the variant was already completed. `completedVariantIds` remains deduplicated.

### Settings writes are independent

Mute changes write the settings repository only. Save and settings queues must not share one repository instance or one JSON document.

### Yandex must remain opt-in in this pass

GitHub Pages is the active phone-testing surface. The default runtime must remain mock/local storage even in a production Vite build. Yandex bootstrap is selected only by an explicit build signal.

### No gameplay tuning in the architecture diff

Any change to paint coverage, shake distance, mix gain, mold gains/decay, shader feel parameters, reveal timing, or squeeze response is out of scope. If such a diff appears during review, remove it unless required to fix a production-skeleton regression.

## Final implementation contract

After review, the intended boundary is:

```text
main.ts
  → bootstrapSquishyApp()
      → createPlatformRuntime()
      → create save/settings repositories
      → load/migrate state
      → resolve typed copy
      → new VerticalSliceApp(root, {
           completedVariantIds,
           muted,
           copy,
           onVariantCollected,
           onMutedChange,
         })
      → activity.onBlockedChange(app.setActivityBlocked)
      → runtime.markReady()
```

`VerticalSliceApp` owns only current craft/presentation state. Repositories own serialized documents. Bootstrap owns wiring. Runtime owns platform/visibility aggregation. Content IDs remain project-domain data.

With these corrections the pass is bounded, reversible, and appropriate before the second-shape gate.
