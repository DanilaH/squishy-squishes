# Squishy Squishes — Project Decision Log

This file records product/architecture decisions that materially constrain implementation.

Statuses:

- **CONFIRMED** — explicit user decision or completed evidence gate.
- **DEFERRED** — intentionally waits for evidence.

---

## D-001 — Squishy thesis passes feel gate

**Status:** CONFIRMED  
**Date:** 2026-09-14

Build Squishy Lab / Maker rather than falling back to Custom Headphones.

The bounded WebGL2 probe produced positive hands-on feel without true soft-body physics. The first cheap implementation was already liked; tactile audio was explicitly judged appropriate; the single refinement pass made it slightly better without rescuing a weak core.

---

## D-002 — Preserve cheap 2D tactile core

**Status:** CONFIRMED

Use local 2D mesh deformation + shader/material response as the baseline. Do not adopt true soft-body physics or real-time 3D absent new evidence.

---

## D-003 — Art direction: premium tactile toy lab

**Status:** CONFIRMED at direction level

Dark plum/indigo studio, bright semi-gloss designer-toy squishies, material-rich presentation, kawaii-lite rather than childlike.

Exact font/palette tokens/store hero remain deferred.

---

## D-004 — Crafting ritual

**Status:** CONFIRMED at product level

Canonical product grammar:

`pour → add → mix/squish → mold → reveal → optional finish/decorate → test squeeze → collect`

Reuse a small interaction grammar rather than inventing a mini-game per step.

---

## D-005 — High-CMF content model

**Status:** CONFIRMED

Perceived content is built primarily from:

`shape × material/palette × filling × face/decal × decoration × finish`

Recipes should share deformation/gameplay code.

---

## D-006 — Launch catalog target

**Status:** CONFIRMED as target, not quota

Working launch target:

- about 6 base shapes;
- about 24 strong curated recipes;
- proposed families: Mochi/Dumpling, Soft Cube, Peach/Fruit Puff, Mushroom, Paw, Blob Creature;
- Cloud/Pillow and Capsule/Pebble remain reserve.

If production evidence says 18–20 excellent recipes beat 24 filler recipes, explicitly reduce scope.

---

## D-007 — Deterministic recipe creation

**Status:** CONFIRMED

The player intentionally chooses the result/recipe being made. Primary reward is transformation/material unlock, not random loot.

Presentation-only cosmetic microvariation is allowed.

---

## D-008 — Progression without currency economy

**Status:** CONFIRMED direction / Lab XP DEFERRED

Confirmed:

- no spendable currency;
- no ingredient inventory;
- no shop;
- no customers/orders;
- no machine-upgrade economy in MVP.

Leading later model remains one Lab XP / Lab Rank track with deterministic unlocks, but **do not implement it before Vertical Slice 01 passes**. Real loop duration/repeat desire should determine cadence.

---

## D-009 — Stack

**Status:** CONFIRMED

Strict TypeScript + Vite + raw WebGL2 hero + DOM/CSS UI.

Do not add Phaser/React/physics/3D by default. Escalation requires evidence that the simple stack became the dominant production burden.

---

## D-010 — Shared-kit production revision

**Status:** CONFIRMED for productionization / DEFERRED for slice

Full production work should move to:

`DanilaH/mini-games-kit@d17ba31fce2a71335dcc3095f772c3fdd87fe97b`

The accepted probe/slice may stay on its validated older pin until the full-loop gate passes. Do not introduce dependency churn merely to obtain platform/save utilities that the slice intentionally defers.

---

## D-011 — Previous-project reuse policy

**Status:** CONFIRMED

Reuse generic mechanisms from `mini-games-kit` and selected patterns from Signal 2000; do not port the old product architecture wholesale.

Useful references:

- pure collection read models;
- milestone priority resolver;
- DEV-only scenario panel;
- typed RU/EN dictionary;
- conservative result-boundary ad policy;
- disciplined content/art production.

Do not import CHIPS, pity, pouches, Overcharge, Hidden Pocket/Secrets, duplicate economy or Signal-specific scene orchestration.

---

## D-012 — Orientation

**Status:** CONFIRMED starting position

Support responsive desktop/mobile including portrait while composition remains good. If device evidence shows portrait is materially worse, use a simple orientation gate later.

---

## D-013 — Monetization posture

**Status:** CONFIRMED direction / implementation DEFERRED

Later:

- interstitial only after Collect / between loops;
- conservative first-session grace + craft-count/time gate;
- at most one rewarded progression offer if useful;
- no sticky banner over the tactile hero by default;
- no monetization-created currency/economy.

Do not implement monetization before the complete loop cadence is measured.

---

## D-014 — Mid-craft persistence

**Status:** CONFIRMED

Do not persist every short crafting gesture. Reload during unfinished craft may restart that craft. Persist meaningful completed result/progression truth only.

---

## D-015 — Freeplay/remix

**Status:** DEFERRED / OUT OF MVP

Component-mixing freeplay may be considered only after curated loop/content composability is proven.

---

## D-016 — Content-count truth

**Status:** CONFIRMED

24 is a target, not a production quota. Never ship weak filler merely to hit the count.

---

## D-017 — Vertical-slice-first implementation order

**Status:** CONFIRMED  
**Date:** 2026-09-14

Before production platform architecture, progression, final UI or catalog scale, build **one complete real loop on the existing probe base** and test/polish it repeatedly.

Exact slice:

- one current rounded soft-cube/superellipse shape;
- three palettes: Lavender/Grape, Strawberry/Pink, Lime/Mint;
- one binary filling modifier: Smooth / Foam Beads;
- six deterministic variants;
- minimal UI over the existing scene;
- no Lab XP, ads, Yandex integration, cloud save, second shape or final collection UI.

Loop:

`select → pour → optional filling → mix/squish → mold/press → reveal → free squeeze → Collect → repeat`

Acceptance is 5–10 complete loops and concrete hands-on correction. Do not scale content until the loop itself passes.

Canonical scope: `docs/VERTICAL_SLICE_01.md`.

---

## D-018 — Vertical Slice 01 UI is intentionally temporary

**Status:** CONFIRMED

The first complete loop should use only the UI required to operate and judge it: color swatches, filling choice, short stage hint/progress, Start/Collect, optional `made X/6`, and secondary DEV controls.

Do not make final navigation/collection/settings chrome before the loop earns it.