# Squishy Squishes — Product Specification

**Status:** ACTIVE MVP SPEC
**Decision state:** tactile core + full loop + Production Skeleton PASS; Renderer Reuse / Second Shape active
**Primary platform:** Yandex Games  
**Product strategy:** low complete production burden × strong tactile/reward payoff × high content multiplication

---

## 1. Product statement

Squishy Squishes is a compact tactile maker / collection game where the player creates visually desirable soft toys through a short hands-on lab ritual, reveals the finished result, squeezes it, adds it to a collection, and quickly unlocks the next materially different recipe.

The player fantasy is not “manage a business” and not “simulate real manufacturing.” It is:

> **I make a beautiful weird soft thing, touch it, reveal it, keep it, and immediately want to see the next one.**

The game should be understandable from a few seconds of interaction and from one strong screenshot/thumbnail.

---

## 2. Why this product exists

The portfolio decision was based on an asymmetric opportunity: direct/adjacent Yandex evidence, broader tactile/squishy demand, high visual gameability and unusually high Content Multiplication Factor all point in the same direction.

The risky part was feel. That risk has now been cheaply tested.

`docs/PROBE_RESULT.md` records a PASS: a simple 2D mesh, local deformation, damped return, material response and tactile audio were already enjoyable without true soft-body physics. The refinement pass improved the result only incrementally, which is evidence that the core did not need effect stacking or meta systems to become viable.

The full game should preserve that economic advantage.

---

## 3. Core player promise

Every short loop must deliver three things:

1. **Tactility** — the object reacts continuously and pleasantly to the player.
2. **Transformation** — the player clearly sees raw material become a finished collectible.
3. **Desire for the next result** — the next recipe/material/shape is visually different enough to create anticipation.

If one of these is weak, adding economy or more screens is not the fix.

---

## 4. Core loop

Canonical high-level loop:

```text
choose recipe
→ pour / add material
→ mix / squish
→ mold / press
→ unmold reveal
→ optional finish / decorate
→ test squeeze
→ collect
→ progression / next unlock
→ choose next recipe
```

The player should experience at least two strong reward beats:

- **unmold / reveal** — “what did I make?”
- **finished-object squeeze / collection** — “this thing is mine and feels good.”

The loop should not become seven unrelated mini-games. Individual stages are composed from a small reusable interaction grammar defined in `GAMEPLAY.md`.

---

## 5. MVP pillars

### 5.1 Tactile-first

The squeeze engine is the hero capability. Pouring, mixing, pressing and test-squeezing should feel related rather than like separate casual-game widgets.

### 5.2 Strong visible progression

Progress should mostly unlock **new visible material states**, not numerical upgrades.

Good rewards:

- new shape;
- translucent material;
- filling/beads;
- pearlescent finish;
- aquarium/galaxy/holographic treatment;
- new face/decal/decor family.

Weak MVP rewards:

- +5% speed;
- invisible production efficiency;
- currencies whose only purpose is another currency loop.

### 5.3 High-CMF content

The content model is:

`shape × palette/material × filling × decal/face × decoration × finish`

MVP target: roughly **6 base shapes and 24 curated recipes**, with one shared deformation system.

The recipes are curated combinations, not a promise that every mathematical combination is player-facing in v1.

### 5.4 Premium-toy identity

The game should look like a tactile designer-toy studio, not a preschool app and not generic white-background DIY mobile slop.

### 5.5 Short loop, low friction

The main loop should restart quickly. Collection and progression support the loop; they do not become the main activity.

---

## 6. Target player behavior

Desired first-session behavior:

```text
understand object in seconds
→ complete first craft without reading a tutorial wall
→ squeeze result voluntarily
→ collect it
→ notice next unlock
→ start another craft
```

The strongest success signal is repeated voluntary loop continuation, not time spent navigating meta screens.

The game should work for players who primarily enjoy:

- tactile/ASMR interaction;
- transformation and reveal;
- collecting;
- visually rich unlocks;
- short low-cognitive-load sessions.

No narrative comprehension is required.

---

## 7. Session shape

### First minute

- immediate playable object/material;
- one guided starter recipe;
- minimal or no modal tutorial;
- first reveal quickly;
- first test squeeze immediately after reveal;
- collection/progression introduced only after the player has experienced the core reward.

### Normal session

Player can complete several crafts in sequence. The design should support a comfortable “one more recipe” rhythm rather than require a long commitment.

### Long-term / completion motivation

- fill the collection;
- unlock increasingly unusual materials/finishes;
- revisit favorite squishies;
- optionally replay recipes for progression after first completion.

MVP does not require endless progression.

---

## 8. Progression philosophy

The current proposal uses one lightweight **Lab Rank / Lab XP** progression track rather than a currency economy.

Principles:

- first-time recipe completion gives the strongest progress;
- repeats may give smaller progress so favorite recipes are not dead content;
- rank unlocks recipes/components frequently;
- progression should expose desirable content, not gate basic comfort;
- no shop is required;
- no crafting costs are required;
- no energy system is required.

Exact XP numbers/unlock thresholds are intentionally provisional until the pre-development review.

See `CONTENT_AND_PROGRESSION.md`.

---

## 9. Collection

The collection is a compact visual destination, not a second game.

MVP requirements:

- show all canonical recipes as cards/slots;
- distinguish locked / unlocked-unmade / completed;
- make completed recipes visually satisfying to revisit;
- let the player open a completed item and squeeze it again;
- communicate global completion progress;
- optionally celebrate a small number of meaningful milestones.

Do not add duplicate inventories, trading, inventory capacity, item stats or collection currencies in MVP.

---

## 10. Monetization posture

Monetization must sit **between** tactile loops rather than interrupting them.

Current proposed policy:

- conservative interstitial eligibility only after a completed result is accepted/collected;
- initial grace period;
- multiple meaningful crafts between requests;
- rewarded ad candidate: optional Lab XP multiplier/bonus after a completed craft;
- no content required for basic progression should be permanently ad-locked;
- no banner should obscure the hero tactile scene.

Exact rewarded offer and ad intervals remain review items. See `ANALYTICS_AND_MONETIZATION.md`.

---

## 11. MVP scope

### In

- one main lab experience;
- one compact collection surface;
- settings/mute/language essentials;
- 6 reusable base shapes;
- about 24 curated canonical recipes;
- reusable pour/add, drag/apply, squish/press interaction grammar;
- mold/reveal choreography;
- finished-object test squeeze;
- deterministic recipe completion / collection;
- lightweight Lab Rank progression;
- RU + EN;
- local-first save with Yandex integration;
- analytics needed to understand the craft funnel;
- conservative Yandex ads;
- desktop + mobile browser support subject to final orientation decision;
- debug/scenario tools for production.

### Out

- real soft-body physics;
- real-time 3D;
- backend;
- accounts beyond platform identity/storage;
- multiplayer/social;
- characters/customers/orders;
- shop/currency economy;
- quests/dailies/battle-pass-like systems;
- merge mechanics;
- random chest opening as the primary reward grammar;
- narrative campaign;
- dozens of handcrafted mini-games;
- bespoke code per recipe;
- user-generated designs;
- procedural infinite content;
- live ops required for launch.

---

## 12. Product anti-goals

### Do not become Cooking Mama

A recipe is not permission to invent a new mechanic at every step. Reuse the small tactile grammar.

### Do not become a business sim

No customers, order queue, prices, upgrades or staff are needed to validate this product.

### Do not become a physics tech demo

The player judges whether the object feels good, not whether the solver is physically correct.

### Do not become a loot-box clone

Collection can be strong without reusing the previous project's random-opening grammar. Deterministic recipe creation diversifies the portfolio.

### Do not solve boredom with meta

If crafting becomes boring after repetition, fix pacing/content/feel before adding another progression layer.

---

## 13. MVP success questions

The first release should answer:

1. Do players complete the first craft and immediately understand the product?
2. Do they continue into another recipe?
3. Does the tactile interaction remain pleasant after repeated crafts?
4. Do material/shape unlocks create visible desire to continue?
5. Does the content system actually make additional recipes cheap to produce?
6. Can ads fit between loops without damaging the tactile flow?
7. Does the game remain stable and responsive on representative Yandex desktop/mobile conditions?

We should not add new systems merely because these questions are hard to answer.

---

## 14. Ship philosophy

A compact project is finished when the high-frequency loop is responsive, visually coherent, low-fatigue under repetition, the reveal/result/collection exit is satisfying, target performance is acceptable, lifecycle cleanup is deterministic and remaining ideas are mostly marginal.

A longer feature list is not a completion criterion.
