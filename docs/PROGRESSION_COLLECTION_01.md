# Progression + Collection 01 — bounded one-more-loop pass

**Date:** 2026-09-14
**Status:** IMPLEMENTED / STRUCTURAL PASS — PHONE ACCEPTANCE PENDING
**Branch:** `progression-collection-01`
**Prerequisite:** Renderer Reuse / Second Shape structurally passed and phone acceptance accepted.

## 1. Goal

Prove that the accepted tactile loop can support a clear **one-more-squishy** motivation without adding economy, shop, currencies, quests, or new production content.

This pass adds a lightweight durable progression layer and a compact collection surface around the already accepted craft loop.

The pass must answer:

1. Does completing a squishy visibly move the player toward something desirable?
2. Is the next unlock obvious without a tutorial wall?
3. Can the player understand locked / available / completed recipes quickly?
4. Can completed items be revisited for free squeeze without replaying the craft?
5. Can this be built as pure/domain state around the existing renderer rather than coupling progression to scene effects?

## 2. Non-goals

Do **not** add in this pass:

- a third shape;
- new materials, fillings, decals, finishes, or art families;
- final 24-recipe content production;
- currency, shop, crafting costs, inventory, duplicates, customers, orders, quests, dailies, energy, or upgrade stats;
- rewarded/interstitial ads;
- analytics beyond interfaces already planned;
- final XP balance claims;
- bespoke recipe gameplay;
- another renderer or state machine.

Current 12 deterministic combinations are enough to validate progression architecture and pacing.

## 3. Phase-4 closure

Phase 4 is considered accepted because:

- Soft Cube and Soft Heart both use the same deformation/material path;
- paint, hit testing, mold target validation and renderer silhouette share one shape definition;
- existing fillings/materials work on both shapes;
- phone hands-on was accepted by the project owner;
- no per-shape physics/state-machine fork was required.

Active project docs must be updated to mark Phase 4 complete and Phase 5 active.

## 4. Durable model

Introduce **SaveStateV2**.

```ts
interface SaveStateV2 {
  readonly version: 2;
  readonly completedVariantIds: readonly string[];
  readonly totalCrafts: number;
  readonly labXp: number;
  readonly updatedAt: number;
}
```

Rules:

- `labRank` is derived from `labXp`; do not persist it.
- `unlockedVariantIds` are derived from `labRank`; do not persist them.
- `completedVariantIds` remains the durable collection truth.
- `totalCrafts` counts accepted Collect actions including repeats.
- mid-craft state is still not persisted.
- settings remain a separate versioned document.

Storage key:

- new canonical key: `squishy.save.v2`;
- previous production key `squishy.save.v1` remains migration input only;
- legacy vertical-slice discovery key remains fallback migration input only when neither production save exists.

## 5. Save migration

### V1 → V2

When `squishy.save.v2` is absent and `squishy.save.v1` is valid:

- keep all valid completed IDs;
- keep `totalCrafts`;
- derive historical XP as if prior accepted crafts had already participated in the new model:
  - each unique completed recipe contributes first-completion XP;
  - `max(0, totalCrafts - uniqueCompletedCount)` contributes repeat XP;
- floor migrated XP to the threshold required by the highest-rank already-completed recipe, so Phase-4 completions never become effectively re-locked;
- write V2;
- remove V1 only after successful V2 write.

### Legacy slice → V2

If no V2/V1 production save exists:

- migrate valid legacy discovered IDs;
- set `totalCrafts = uniqueCompletedCount`;
- award first-completion XP for each migrated completion;
- apply the same highest-completed-required-rank XP floor;
- write V2;
- remove legacy key only after successful V2 write.

Malformed saves must still fail soft to a fresh default rather than blank the app.

## 6. Progression constants

For this validation pass:

- first completion: **+100 Lab XP**;
- repeat completion: **+25 Lab XP**.

These are tuning values, not a launch-balance commitment.

Rank thresholds:

| Rank | XP required |
| ---: | ---: |
| 1 | 0 |
| 2 | 100 |
| 3 | 200 |
| 4 | 300 |
| 5 | 400 |
| 6 | 500 |

This intentionally makes early progress highly legible. The catalog is only a 12-item validation catalog.

## 7. Deterministic unlock table

Use the existing durable variant IDs.

### Rank 1 — starters

- `grape-smooth` — Soft Cube · Lavender Grape · Smooth
- `heart-strawberry-smooth` — Soft Heart · Strawberry Cream · Smooth

### Rank 2

- `strawberry-smooth`
- `heart-grape-smooth`

### Rank 3

- `grape-beads`
- `heart-lime-smooth`

### Rank 4

- `lime-smooth`
- `heart-grape-beads`

### Rank 5

- `strawberry-beads`
- `heart-strawberry-beads`

### Rank 6

- `lime-beads`
- `heart-lime-beads`

Rules:

- every canonical current variant must appear exactly once;
- unlock order is deterministic;
- locked recipes remain visible in Collection as teases;
- current recipe selector may preview a locked combination but **Make** must be disabled until its required rank is reached;
- domain helpers, not DOM state, decide whether a variant is unlocked.

## 8. Progression domain API

Create a small pure module, e.g. `src/game/progression.ts`, owning:

- `FIRST_COMPLETION_XP`;
- `REPEAT_COMPLETION_XP`;
- rank thresholds;
- unlock table;
- `getLabRank(xp)`;
- `getRankProgress(xp)`;
- `getUnlockedVariantIds(xp)`;
- `getRequiredRank(variantId)`;
- `isVariantUnlocked(variantId, xp)`;
- `getCompletionXpAward(state, variantId)` or equivalent pure rule;
- collection snapshot derivation;
- milestone resolution.

No storage, DOM, renderer, audio, or platform calls in the progression module.

## 9. Collection read model

Build a pure snapshot from:

- current `labXp`;
- current completed IDs;
- canonical current variant registry.

Each card state is exactly one of:

```ts
type RecipeCardState = 'locked' | 'available' | 'completed';
```

Snapshot should expose enough data for UI without UI recomputing progression policy:

- overall completed / total;
- current rank;
- XP toward next rank;
- recipes grouped by shape;
- each recipe ID, label, required rank, state;
- whether the card may enter free squeeze.

## 10. Collection UI

Add one compact collection overlay/panel reachable from the top bar.

Requirements:

- usable in portrait mobile and desktop;
- no route/router/framework;
- grouped by shape;
- clear state difference between locked, available-unmade, completed;
- locked card shows required rank;
- completed card exposes a clear **Squeeze** action;
- close/back returns to the lab without losing selected recipe;
- overlay must not mutate progression truth itself.

Visual direction:

- preserve premium dark lab language;
- cards may use CSS accent/palette treatment rather than new image assets;
- do not build final collection art/card renderer in this pass.

## 11. Revisit / free squeeze

Completed recipes can be opened from Collection directly into the existing finished-object test state.

Rules:

- reuse the same renderer and selected variant config;
- no craft stages are replayed;
- no XP is awarded;
- no collection mutation occurs;
- Collect button becomes a **Back to lab** action in revisit mode;
- exit returns to select/lab state;
- lifecycle blocking must work exactly as in normal test squeeze.

No separate freeplay scene or renderer is allowed.

## 12. Craft eligibility

The current component selector remains for this pass.

When the selected combination is locked:

- preview remains visible;
- Make is disabled;
- UI communicates the required Lab Rank;
- pointer/keyboard activation must not start the craft.

When unlocked:

- Make behaves exactly as before;
- no craft tuning values change.

## 13. Collect transaction

Collect remains the accepted durable completion boundary for this bounded pass.

On Collect:

1. determine whether the recipe is first completion or repeat from pre-mutation state;
2. compute XP award;
3. add recipe to completed set if new;
4. increment total crafts;
5. add XP;
6. derive previous and next rank/unlock state;
7. persist updated save through bootstrap repository;
8. update in-memory app progression/collection presentation;
9. show concise XP/unlock feedback;
10. continue to select state.

The visual feedback must not be the source of truth.

## 14. Feedback / one-more beat

After Collect, show enough information to answer “what did I get / what opened?” without creating a modal reward ceremony.

Minimum:

- `+100 Lab XP` or `+25 Lab XP`;
- current Lab Rank;
- if rank increased, say so;
- if recipes unlocked, surface at least the names/count of newly unlocked recipes.

The feedback should be readable during the existing collect beat and may persist into select briefly if needed.

No chest, currency burst, loot animation, or long blocking celebration.

## 15. Top-bar progression

Replace/extend the current tiny collection summary with:

- `Lab Rank N`;
- compact XP progress to next rank (or MAX at current validation cap);
- collection count `X / 12`;
- Collection button.

Keep the header small enough for portrait mobile.

## 16. Milestones

Implement pure milestone detection for these current-catalog milestones:

- first completed squishy;
- first completed full shape set (all six current combinations for either current shape);
- half current catalog (6/12);
- full current catalog (12/12).

Priority when several become true on one Collect:

`full catalog > full shape > half catalog > first squishy`

Only the highest-priority newly crossed milestone may be presented.

Presentation can be one short line/badge. Do not add a ceremony system.

## 17. i18n

Add RU/EN typed copy for:

- Lab Rank / XP;
- Collection open/close;
- locked / available / completed labels;
- required-rank text;
- Squeeze / Back to lab;
- XP award feedback;
- rank-up/new-unlock feedback;
- milestone labels.

Do not hard-code new user-facing English strings into game logic.

## 18. Debug support

Extend DEV-only debug tooling only where it materially accelerates this pass:

- current save already visible;
- optional helper to set XP or seed representative progression state is allowed if small;
- no production query-string backdoors.

Do not turn debug tooling into an admin framework.

## 19. Acceptance criteria

### Domain

- fresh save is rank 1 and exposes exactly the two starters;
- first completion awards 100 XP;
- repeat awards 25 XP;
- each rank deterministically derives the intended unlocks;
- all 12 variants appear exactly once in unlock config;
- card states are correctly derived;
- migration from valid V1 preserves completions/craft count and derives XP;
- old square durable IDs remain valid;
- malformed save still fails soft.

### Gameplay

- locked selected recipe cannot start;
- unlocked recipe crafts with unchanged paint/shake/mix/mold tuning;
- Collect updates XP, collection and unlock availability exactly once per click;
- completed Collection card enters free squeeze;
- revisit mode gives no XP and no collection mutation;
- Back to lab exits revisit cleanly.

### UI

- collection overlay works in representative portrait mobile and desktop;
- top-bar progression remains legible;
- locked / available / completed states are visually distinguishable;
- newly unlocked content is visible enough to create a next target;
- no new long modal or navigation friction is introduced.

### Engineering

- strict typecheck passes;
- production build passes;
- no second renderer/state machine;
- no per-recipe bespoke gameplay;
- no new dependency/framework;
- no interaction tuning constants changed unless separately justified;
- final diff independently reviewed before merge;
- merged Pages build is checked and then handed to phone acceptance.

## 20. Stop rules

Stop and repair before catalog expansion if:

- unlock eligibility becomes scattered across DOM handlers;
- save begins persisting redundant rank/unlock state unnecessarily;
- collection needs bespoke renderer instances per card;
- free squeeze duplicates the craft/test renderer path;
- the selector becomes harder to understand than a recipe list would be;
- progression feedback obscures tactile gameplay;
- existing craft feel changes as collateral damage;
- adding the next recipe already requires progression-specific one-off code.

## 21. Exit gate

Phase 5 passes when the deployed two-shape build demonstrates this loop cleanly:

```text
craft unlocked recipe
→ Collect
→ XP visibly advances
→ next recipe/rank becomes clear
→ Collection reflects durable state
→ completed item can be reopened and squeezed
→ player can immediately choose another goal
```

Only then proceed to representative content/material expansion before mass catalog production.