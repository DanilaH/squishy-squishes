# Independent Review — Production Skeleton 01

**Date:** 2026-09-14
**Reviewed artifact:** `docs/PRODUCTION_SKELETON_01.md`
**Review posture:** treat the proposed pass as external work; challenge ownership boundaries, migration safety, lifecycle semantics, and scope.

## Pre-implementation verdict

**PASS WITH CORRECTIONS.** The production-skeleton direction is the right next step, but four design details had to be tightened before implementation to avoid leaking persistence semantics back into the UI/controller.

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

The current slice owned a direct `visibilitychange` handler. Merely adding `PlatformRuntime.activity` without changing the app would duplicate visibility ownership and would still fail to block interaction when Yandex pauses gameplay while the document remains visible.

**Correction:** remove the direct visibility listener from `VerticalSliceApp` and expose:

```ts
setActivityBlocked(blocked: boolean): void
```

The bootstrap subscribes once to `runtime.activity.onBlockedChange()` and forwards aggregate state. When blocked, the app stops continuous audio, releases owned pointer state, hides/disables transient mold target interaction and disables renderer interaction. When unblocked, it resets timing baselines and restores interaction appropriate to the current stage.

All input handlers that can mutate semantic progress reject input while blocked.

### 3. Localization should be injected as player-facing copy, not looked up from platform state inside the app

If `VerticalSliceApp` imported a global translator tied to runtime language, the game controller would become coupled to application/platform state again.

**Correction:** bootstrap resolves language and creates a typed `GameCopy` object. The app receives that copy. This keeps rendering testable and makes a future DEV language switch an app-recreation or explicit copy-update concern rather than hidden global state.

### 4. Corrupt production save and legacy migration need an explicit precedence rule

The draft said legacy migration occurs when no new save exists, while malformed new save falls back to default. That distinction is correct but had to be explicit in code so stale legacy data cannot silently resurrect after a malformed production payload.

**Correction:** first inspect whether the production save key exists. Only if it is physically absent may the legacy key seed V1. If the production key exists but decode fails, report the error and use a fresh in-memory default for this session; do not consult legacy state.

A later successful Collect may overwrite the corrupt production save with a valid V1 state. This is acceptable for this compact local-first game and is deliberate.

## Additional implementation constraints

### Persistence writes must never gate stage transitions

Collect updates in-memory presentation immediately and fires persistence asynchronously. A slow/failing adapter must not delay the `collect → select` transition.

### `totalCrafts` counts repeats

Every successful Collect increments `totalCrafts`, even when the variant was already completed. `completedVariantIds` remains deduplicated.

### Settings writes are independent

Mute changes write the settings repository only. Save and settings queues do not share one repository instance or one JSON document.

### Yandex remains opt-in in this pass

GitHub Pages is the active phone-testing surface. The default runtime remains mock/local storage even in a production Vite build. Yandex bootstrap is selected only by an explicit build signal.

### No gameplay tuning in the architecture diff

Paint coverage, shake distance, mix gain, mold gains/decay, shader feel parameters, reveal timing and squeeze response remain unchanged.

## Final implementation contract

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

`VerticalSliceApp` owns current craft/presentation state. Repositories own serialized documents. Bootstrap owns wiring. Runtime owns platform/visibility aggregation. Content IDs remain project-domain data.

## Post-implementation independent review

**Verdict: PASS after two corrective fixes.**

The final PR was reviewed again against `main` after implementation rather than assuming the pre-implementation design was sufficient.

### Corrective fix A — remove the last direct visibility dependency

The first implementation removed the old visibility listener but one `spawnMoldTarget()` guard still consulted `document.hidden`. That would have made Yandex/platform pauses and browser visibility pauses behave differently.

It was replaced with the aggregate `activityBlocked` state. The final game controller no longer owns an independent visibility policy.

### Corrective fix B — DEV tooling must not be statically loaded into production bootstrap

The first implementation statically imported the debug installer and merely no-op'd it outside DEV. That met the runtime behavior requirement but was weaker than the documented production-bundle boundary.

The final bootstrap now dynamically imports the debug tooling only under `import.meta.env.DEV`. Repository flush also happens before runtime teardown.

### Final diff checks

- Gameplay tuning constants in `VerticalSliceApp` are unchanged from `main`.
- No shader/material feel parameters changed.
- `SquishSurface` changes are lifecycle-only: duplicate visibility ownership was removed and a timing reset hook was added.
- Save migration consults legacy state only when the new production key is physically absent.
- Save and settings use independent `JsonStorageRepository` instances and write queues.
- Collect updates presentation immediately and persistence asynchronously.
- Unknown legacy/current variant IDs are filtered against the canonical current content registry.
- Temporary patch scripts and feature-branch validation workflows are absent from the final PR diff.
- Final strict `npm run typecheck` and `npm run build` both passed after the production source corrections.

No additional framework extraction, gameplay system, progression, second shape, catalog expansion, ads, or cloud reconciliation leaked into this pass.

Production Skeleton 01 is therefore suitable to merge. The next engineering/product gate remains exactly one materially different second shape using the same deformation/material path.
