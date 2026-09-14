# Independent review — Progression + Collection 01

**Date:** 2026-09-14  
**Reviewed document:** `PROGRESSION_COLLECTION_01.md`  
**Review posture:** adversarial scope / persistence / UX / architecture check before implementation  
**Verdict after corrections:** **PASS FOR IMPLEMENTATION**

## 1. What is being validated

This review does not ask whether progression/collection are desirable in the abstract. It checks whether this bounded pass is the cheapest credible way to validate the already-approved Phase-5 question:

> can the accepted tactile loop produce a clear, durable “one more squishy” motivation without importing economy/meta complexity?

The answer is yes, with the corrections below.

## 2. Scope review

### PASS — no premature catalog production

Using the current 12 combinations is correct. New shapes/materials would confound the test by mixing progression quality with content-production novelty.

### PASS — no currency/shop layer

Lab XP is sufficient to expose unlock cadence. A spendable currency would create an unnecessary economy and a second tuning dimension.

### PASS — collection is a surface, not a second game

A single overlay plus free squeeze is enough. No router, inventory scene, duplicate system, card-rendering engine, or full-screen meta shell is justified.

## 3. Persistence review

### Finding A — migration must preserve effective access to already completed content

The initial spec derived V1 historical XP only from completion/repeat counts. That is insufficient in one edge case:

- Phase 4 allowed all 12 current variants to be crafted before progression existed;
- a player could have completed only a recipe that Phase 5 later assigns to Rank 5/6;
- simple `completedCount × 100` could migrate that player to Rank 2 while their completed recipe is nominally locked.

That creates contradictory durable truth.

**Correction:** V1→V2 migration must derive XP as the maximum of:

1. historical award-equivalent XP; and
2. the XP threshold required to unlock the highest-rank already-completed recipe.

This guarantees every migrated completion remains accessible under the new deterministic progression.

Legacy vertical-slice data only contains the old square combinations, but the same correction is harmless and should use the same helper.

### Finding B — V2 should not persist redundant unlock/rank arrays

Confirmed. `labRank` and unlocks remain derived. This reduces reconciliation and migration burden.

### Finding C — storage-key migration order is correct

Load order must be:

1. V2 canonical key;
2. V1 production key;
3. legacy slice key;
4. fresh default.

Do not merge several simultaneously present documents. Presence of the newest valid production document wins.

## 4. Completion transaction review

### Finding D — game UI should not own durable mutation rules

`VerticalSliceApp` currently owns local discovered presentation but bootstrap owns save persistence. Keep that direction.

Recommended contract:

- pure progression function computes collect result (`next state`, award, rank/unlocks/milestone deltas);
- bootstrap applies it synchronously to in-memory save state and starts repository write asynchronously;
- bootstrap returns a small presentation outcome to the app;
- app updates UI from that outcome.

This preserves immediate feedback without making animation or async storage the source of truth.

### Finding E — double-click / repeated Collect must not award twice

Current stage transition is synchronous after the handler, which already limits this risk, but Phase 5 should explicitly keep Collect one-shot:

- handler verifies `stage === 'test'`;
- first call switches stage immediately;
- subsequent activation cannot mutate again.

No transaction framework is needed.

## 5. Unlock UX review

### PASS — locked combinations may remain previewable

Keeping the current component selector avoids redesigning selection during this pass. Disabling Make and showing required rank is enough to validate gating.

### Finding F — there must always be an immediately craftable fresh-save selection

Default `soft-square / grape / smooth` is Rank 1 in the proposed table, so fresh boot remains actionable.

### Finding G — completed recipes must always read as completed, not locked

For collection card-state precedence:

`completed > available > locked`

Migration correction should make completed content unlocked anyway, but presentation should still use durable completion as the strongest state.

## 6. Free-squeeze review

### PASS — reuse `test` stage

A dedicated scene would violate the point of the pass. Reusing the existing test state with a small revisit-mode flag is appropriate.

### Required constraints

- no XP/collect callback in revisit mode;
- result badge should not say NEW;
- primary exit says Back to lab;
- returning to lab must clear revisit mode before normal crafting;
- lifecycle blocker continues to disable renderer interaction exactly as normal test mode.

## 7. Progression cadence review

The proposed 100/25 award and 100-XP rank spacing are intentionally aggressive but acceptable for this validation catalog.

Why it is acceptable:

- the goal is not launch economy balance;
- each first-time craft should visibly change state;
- the pass needs enough unlock transitions to test in one short phone session;
- repeat XP still makes favorite replays non-dead without competing with discovery.

**Constraint:** docs/UI must not present these values as final launch balance.

## 8. Unlock-table review

The 12 current IDs are covered once each and the table alternates shape/material novelty reasonably for a test catalog.

Important implementation requirement:

- validate uniqueness and completeness programmatically in the progression module or a small invariant function;
- do not hand-maintain a second independent canonical recipe array in UI code.

## 9. Collection-card representation review

### Finding H — no per-card WebGL canvases

Twelve live renderers would be absurd for this pass and would invalidate the production-burden thesis.

Cards should use:

- text;
- CSS color/accent derived from existing palette specs;
- shape label/state iconography;
- optional simple CSS silhouette treatment if cheap.

The hero renderer remains single-instance.

## 10. Milestone review

Pure milestone resolution is acceptable because it is tiny and gives us the future boundary without a ceremony system.

Milestones must be derived by comparing previous vs next collection state. Do not fire “half catalog” every time the player crafts after 6/12.

Priority remains:

`full catalog > full shape > half catalog > first squishy`.

## 11. UI/mobile review

The largest UX risk is not progression math; it is overloading the already-tight mobile composition.

Required mitigation:

- top-bar progression remains one compact cluster;
- Collection opens as an overlay above the lab rather than pushing/reflowing the craft workspace;
- overlay scrolls internally;
- recipe panel must not grow vertically from progression controls;
- collection cards may use a 2-column mobile grid only if readable; one column is acceptable on narrow widths.

## 12. Architecture review

Recommended new bounded files:

```text
src/game/progression.ts
```

Optional separate UI file is **not required** yet. The collection DOM can remain inside the current app while policy stays pure in `progression.ts`.

Do not use this pass as an excuse to fully decompose `VerticalSliceApp`. That can happen when there is evidence the UI orchestration file itself is blocking production.

## 13. Test/validation review

Current repository has build/typecheck but no dedicated test runner. Do not add a test framework solely for this pass.

Instead require:

- pure invariant checks callable during development/build or explicit small assertion helper;
- `git diff --check`;
- strict `npm run typecheck`;
- production `npm run build`;
- independent final diff review;
- deployed phone hands-on for pacing/collection UX.

A later production test suite can cover progression codec/pure rules when test infrastructure is introduced for broader domain logic.

## 14. Corrections applied to implementation contract

Implementation must therefore include these corrections even where the primary spec is terse:

1. migration XP is floored to the highest required rank among already-completed recipes;
2. card-state precedence is `completed > available > locked`;
3. Collect mutation is computed outside presentation and applied exactly once;
4. no per-card WebGL renderers;
5. milestone events are edge-triggered from previous→next state;
6. free squeeze reuses test stage and cannot mutate save/XP;
7. fresh default selection remains unlocked;
8. unlock config validates complete/unique coverage of all 12 current IDs.

## 15. Final verdict

**PASS FOR IMPLEMENTATION.**

The pass remains bounded, directly tests the next product risk, preserves the accepted tactile core, and does not prematurely commit to final economy/catalog architecture.

The only material persistence contradiction found — pre-progression completions that would migrate below their future required rank — is resolved by the migration XP floor above.

Implementation should proceed on `progression-collection-01`, followed by independent diff review before merge.