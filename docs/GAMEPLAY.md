# Squishy Squishes — Gameplay Specification

**Status:** PRE-DEVELOPMENT PROPOSAL

This document defines the intended gameplay grammar and state choreography. It deliberately avoids inventing seven bespoke mini-games around the word “crafting.”

---

## 1. Canonical loop

```text
LAB IDLE / RECIPE SELECT
→ PREPARE MATERIAL
→ MIX / SQUISH
→ MOLD / PRESS
→ UNMOLD / REVEAL
→ OPTIONAL FINISH / DECORATE
→ TEST SQUEEZE
→ COLLECT / PROGRESSION
→ LAB IDLE
```

Not every recipe needs every optional presentation beat. The loop should feel like one coherent tactile process.

---

## 2. Reusable interaction grammar

MVP should be built from **three primary continuous grammars** plus short reveal/accept beats.

### A. HOLD / DISPENSE

Used for:

- pouring base material;
- adding pigment;
- adding beads/filling;
- applying a liquid finish when appropriate.

Input:

`pointer down / hold → bounded continuous progress → release/cancel`

Feel:

- immediate start response;
- visible flow/accumulation;
- progress/velocity-sensitive sound where useful;
- completion beat when target amount is reached;
- continuing to hold after completion must not create uncontrolled overflow or state corruption.

This is not a fluid simulator. The visual may use a procedural stream, mask fill, particles/blobs and a deterministic progress model.

### B. DRAG / APPLY

Used for:

- spreading pigment or finish;
- scattering/placing simple decoration;
- pulling material into a mold region where appropriate.

Input:

`pointer down → drag over target area → coverage/progress → completion`

Feel:

- visible trail/coverage;
- no pixel-perfect tracing requirement;
- forgiving completion threshold;
- large pointer/touch target;
- no fail state for “messy” input in MVP.

### C. PRESS / SQUISH

Uses the validated probe technology.

Used for:

- mixing soft material;
- kneading;
- pressing material into mold;
- testing the finished collectible;
- collection revisit interaction.

Input:

`press/grab → local dent/deformation → drag/stretch if desired → release → damped return`

Feel:

- continuous local response;
- tactile audio follows progress/velocity;
- no true soft-body requirement;
- bounded pseudo-volume and return;
- finished collectible remains enjoyable even when no progression reward is attached.

### D. SHORT REVEAL / ACCEPT

Used for:

- opening/lifting mold;
- confirming/collecting result;
- moving to next loop.

This is presentation choreography rather than a separate skill game.

---

## 3. Recipe stage composition

A recipe is data describing which stage variants are used and how they are themed.

Example starter recipe:

```text
Milk Mochi
1. pour milk base
2. short mix/squish
3. press into mochi mold
4. unmold reveal
5. test squeeze
6. collect
```

Example higher-tier recipe:

```text
Aquarium Cube
1. pour translucent aqua base
2. add small bead/bubble filling
3. mix/squish
4. press into cube mold
5. unmold reveal
6. apply glossy finish / decal
7. test squeeze
8. collect
```

Higher visual value may add one optional stage, but progression must not make every later craft materially longer.

---

## 4. Duration and pacing targets

These are tuning targets, not stopwatch laws.

### First craft

Target roughly **25–40 seconds** from first meaningful input to first result squeeze.

The first reveal should arrive before onboarding becomes a commitment.

### Normal craft

Target roughly **30–50 seconds** depending on recipe complexity.

### Stage length

Most tactile stages should resolve in a few seconds. A stage that requires prolonged repetitive scrubbing without changing the visual state is a pacing failure.

### Reveal

Strong but short. The player should never wait through a long animation merely to restart the loop.

Presentation skip/fast-forward should only be added if hands-on testing proves repeated reveal timing becomes annoying.

---

## 5. First-session flow

### Boot

- initialize platform/storage/settings;
- present lab immediately after ready;
- no splash/tutorial sequence longer than necessary.

### Starter state

The first starter recipe is already selected or visually obvious.

Player should learn through affordance:

1. vessel/mold/material visibly invite interaction;
2. first hold gesture demonstrates pour;
3. first squish demonstrates tactile core;
4. mold press transforms state;
5. reveal introduces collection;
6. result squeeze is immediately available;
7. Collect transitions to first progression unlock.

Text guidance should be contextual and short. Avoid modal instruction cards before the player touches anything.

---

## 6. Main lab state

The main lab should keep the hero object/material central.

Persistent minimal UI may include:

- current Lab Rank / progress;
- Collection entry;
- sound/settings control;
- current recipe name/preview;
- stage hint only when useful.

The UI must not visually compete with the tactile object.

After a result is collected, next-recipe affordance should be obvious and fast.

---

## 7. Recipe selection

MVP proposal:

- unlocked recipes appear as desirable cards/thumbnails;
- locked recipes show enough silhouette/material tease to create anticipation without exposing every detail;
- player selects any unlocked recipe;
- newly unlocked recipe receives one clear acknowledgement;
- no material inventory or ingredient cost.

We should not require the player to manually choose five component dropdowns for normal progression. Curated recipes keep the loop fast and keep art direction controlled.

A remix/freeplay surface may be considered only after the canonical collection loop works and content reuse proves valuable.

---

## 8. Craft stage state contract

Every interactive stage should expose a small semantic state rather than make presentation callbacks authoritative.

Conceptually:

```ts
type CraftStageStatus = 'idle' | 'active' | 'complete';

interface CraftStageProgress {
  stageId: string;
  status: CraftStageStatus;
  progress: number; // 0..1
}
```

The exact implementation can differ, but invariants are:

- progress is bounded;
- cancel/release leaves a valid state;
- presentation may interpolate toward state but cannot invent durable completion;
- stage completion fires once;
- accidental multi-pointer input cannot double-complete;
- visibility/ad pause cannot leave pointer/audio ownership orphaned.

---

## 9. Mixing / squish semantics

Do not equate “progress” with distance dragged once.

For mixing, progress should reward a small amount of meaningful deformation over several gestures while remaining quick.

Candidate semantic input:

- compression/deformation amount;
- cumulative bounded interaction energy;
- direction changes or distinct squeeze releases only if needed to prevent one long hold completing instantly.

The target is “I kneaded it a little,” not an exercise counter.

The game should not force exactly N squeezes if the interaction already feels complete visually.

---

## 10. Mold / press

The mold stage should look more transformative than ordinary free squeeze.

Cheap implementation direction:

- current material object aligns with mold;
- press input increases semantic mold progress;
- object visibly compresses/spreads toward target silhouette;
- mold closes or target boundary owns the final shape transition;
- final result geometry may switch to the recipe's canonical shape once completion is reached.

Do not attempt general collision or physically accurate material filling.

The player only needs a convincing causal sequence.

---

## 11. Reveal choreography

Target state chain:

```text
mold complete
→ brief visual quiet / anticipation
→ mold separates / lifts
→ finished squishy expands/settles
→ recipe identity + material tier appears
→ stable result state
```

Rules adapted from proven portfolio feel patterns:

- reveal treatment is additive; environment does not disappear;
- higher-value recipes may use more perceived mass/density, not just more particles/loudness;
- stable result remains alive after impact;
- baseline ambience may duck briefly under premium result ownership;
- result presentation must have a clean exit into test squeeze / collection.

---

## 12. Test squeeze

After reveal, the result becomes fully interactive with the validated squeeze engine.

Requirements:

- no mandatory long test quota;
- first touch should be immediately possible;
- player can squeeze several times voluntarily;
- Collect remains clearly available;
- collection should not auto-advance so fast that the player cannot enjoy the result;
- result should remain comfortable if left on screen for at least 30 seconds.

Analytics may record first result interaction, but never every pointer move.

---

## 13. Collect / exit

Collect is a semantic transition, not an object vanishing.

Proposed flow:

```text
player taps Collect
→ durable completion/progression already known or committed
→ object acknowledges collection
→ optional short transfer toward collection/progress destination
→ rank/unlock acknowledgement if earned
→ next lab idle / recipe choice
```

Any value/XP flight visualizes owned state. Animation callbacks must not own the durable grant.

---

## 14. Collection revisit

Completed squishies can be reopened from the collection and squeezed with the same engine.

Collection revisit is intentionally simple:

- select card;
- item expands to hero view;
- squeeze/play;
- close/back.

No separate stats, item leveling or inventory actions in MVP.

---

## 15. Failure and interruption policy

There is no skill-failure state in normal crafting.

On pointer cancel / tab hide / platform pause / ad:

- stop continuous input ownership;
- quiet/release owned audio;
- preserve semantic stage progress if already committed in memory;
- resume in a valid non-stuck state.

On full reload:

- persisted progression/collection must recover;
- it is acceptable for an unfinished non-durable craft-in-progress to restart from the beginning in MVP unless later evidence shows that mid-craft persistence is valuable.

Do not add a transaction system merely to recover five seconds of pouring.

---

## 16. Input / accessibility basics

- Pointer Events for mouse/touch.
- Large interaction surfaces.
- No precision drawing requirement.
- Avoid gestures that depend on hover.
- Important state remains readable with sound off.
- Mute persists separately from gameplay progress.
- Text is not baked into game art.

Keyboard-specific crafting controls are not an MVP requirement unless Yandex/device evidence justifies them.

---

## 17. What gameplay must not grow into before launch

Do not add:

- customers/orders;
- timed failures;
- recipe ingredient inventory;
- shop/currency economy;
- machine upgrades;
- multiple rooms;
- daily missions;
- boosters;
- random loot opening;
- item stats;
- competitive scores;
- dozens of interaction grammars.

If the core loop needs those systems to remain interesting, re-evaluate the product instead of silently expanding it.
