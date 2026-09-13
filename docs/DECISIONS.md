# Squishy Squishes — Project Decision Log

This file records product/architecture decisions that materially constrain the implementation. It is not a running task log.

Statuses:

- **CONFIRMED** — supported by explicit user decision or completed evidence gate.
- **PROPOSED** — recommended default awaiting pre-development confirmation.
- **DEFERRED** — intentionally not decided until evidence exists.

---

## D-001 — Squishy thesis passes feel gate

**Status:** CONFIRMED  
**Date:** 2026-09-14

Decision:

Build the full Squishy Lab / Maker product rather than falling back to Custom Headphones.

Evidence:

- bounded WebGL2 2D deformation probe worked without true soft-body physics;
- original hands-on reaction was positive;
- tactile audio was explicitly judged appropriate;
- one bounded refinement pass made the result slightly better without rescuing a weak initial core;
- `docs/PROBE_RESULT.md` records the exact evidence and limitations.

Consequence:

The project can spend effort on the complete crafting/reveal/collection product rather than more isolated squeeze R&D.

---

## D-002 — Preserve cheap 2D tactile core

**Status:** CONFIRMED

Decision:

Use 2D mesh deformation + shader/material response as the baseline. Do not adopt true soft-body physics or real-time 3D absent new evidence.

Reason:

The cheap path already passed the risky feel test; complexity now has to justify itself against a known-good simpler solution.

---

## D-003 — Art direction: premium tactile toy lab

**Status:** CONFIRMED at direction level

Decision:

Use a dark plum/indigo premium studio/lab environment with bright semi-gloss designer-toy squishies, kawaii-lite rather than childlike, restrained translucent UI and material-rich unlocks.

Still open:

- exact font;
- exact palette tokens;
- final store-thumbnail hero recipe;
- amount of face/decal usage.

---

## D-004 — Crafting ritual

**Status:** CONFIRMED at concept level

Decision:

Core ritual:

`pour → add → mix/squish → mold → reveal → decorate/finish → test squeeze → collect`

Not every recipe must contain every optional step.

Hard constraint:

Reuse a small interaction grammar instead of building a separate mini-game per step.

---

## D-005 — High-CMF content model

**Status:** CONFIRMED at model level

Decision:

Content is built primarily from:

`shape × material/palette × filling × face/decal × decoration × finish`

One generic deformation/render path should support the catalog.

Still open:

- exact launch count;
- exact recipe names;
- exact component combinations.

---

## D-006 — MVP catalog target

**Status:** PROPOSED

Decision proposal:

Launch target: **6 base shapes × 4 curated recipes = 24 canonical squishies**.

Proposed shapes:

- Mochi/Dumpling
- Soft Cube
- Peach/Fruit Puff
- Mushroom
- Paw
- Blob Creature

Reserve Cloud/Pillow and Capsule/Pebble for later.

Reason:

Enough collection variety to prove the high-CMF thesis without turning launch into asset production.

---

## D-007 — Deterministic recipe creation

**Status:** PROPOSED

Decision proposal:

Primary craft result is the recipe the player intentionally selected, not a random loot roll.

Reason:

- preserves maker fantasy;
- differentiates portfolio from chest/unboxing project;
- avoids duplicate/pity/economy complexity;
- lets visual unlocks carry progression.

Random cosmetic microvariation may remain presentation-only.

---

## D-008 — Progression without currency economy

**Status:** PROPOSED

Decision proposal:

Use one lightweight Lab XP / Lab Rank track. First-time recipe completion gives strong progress; repeats give smaller progress. Rank deterministically unlocks new recipes/components.

Explicitly omit in MVP:

- spendable currency;
- ingredient inventory;
- shop;
- customers/orders;
- machine upgrades.

Exact XP thresholds are DEFERRED until vertical-slice craft timing exists.

---

## D-009 — Stack: TypeScript + Vite + raw WebGL2 + DOM/CSS

**Status:** PROPOSED, strongly recommended by probe evidence

Decision proposal:

Keep raw WebGL2 for tactile/material hero rendering and use DOM/CSS for lightweight UI.

Do not add Phaser/React/physics/3D by default.

Framework escalation requires evidence that current approach has become a dominant production burden.

---

## D-010 — Full-game shared-kit pin

**Status:** PROPOSED

Decision proposal:

Move full-game work to reviewed `DanilaH/mini-games-kit@d17ba31fce2a71335dcc3095f772c3fdd87fe97b`.

The validated probe stays historically associated with `2da5b501...`.

Reason:

The newer revision adds reviewed JSON persistence + Yandex runtime/bootstrap/browser blocker utilities needed by the full product.

---

## D-011 — Previous-project reuse policy

**Status:** CONFIRMED as planning policy

Decision:

Reuse shared production mechanisms from `mini-games-kit` and adapt a few proven patterns from Signal 2000; do not port the old product architecture wholesale.

Useful local pattern references:

- pure collection snapshots;
- milestone priority resolver;
- DEV-only scenario panel;
- typed RU/EN dictionary;
- conservative result-boundary ad policy;
- art production discipline.

Explicitly reject importing CHIPS, pity, pouches, Overcharge, Secrets, duplicate economy and Signal-specific scene orchestration.

---

## D-012 — Orientation support

**Status:** PROPOSED / OPEN

Proposal:

Support responsive desktop/mobile layouts including portrait if composition remains good, rather than inheriting landscape-only behavior from Signal 2000.

Reason:

The core is one centered tactile object with sparse UI, so portrait is structurally plausible.

Fallback:

If hands-on/device evidence shows portrait is materially worse, use shared orientation blocker and rotate gate.

---

## D-013 — Monetization posture

**Status:** PROPOSED

Proposal:

- interstitials only at natural post-collect boundaries;
- conservative initial grace + craft-count/time gate;
- at most one MVP rewarded offer, likely optional Lab XP bonus;
- no sticky banner over the hero tactile scene by default;
- no monetization-created currency/economy.

Exact cadence/reward values remain open until actual craft timing exists.

---

## D-014 — Mid-craft persistence

**Status:** PROPOSED

Proposal:

Do not persist every 5–15 second crafting gesture. On reload during an unfinished craft, restarting the craft is acceptable in MVP.

Persist meaningful durable progression/result truth only.

Reason:

Do not pay transaction/recovery complexity for tiny transient state without evidence of user value.

---

## D-015 — Freeplay/remix

**Status:** DEFERRED / OUT OF MVP

A component-mixing freeplay mode is architecturally plausible but should not be implemented until the curated 24-recipe loop has proved fun and the content system is actually composable.

---

## D-016 — Content-count truth

**Status:** CONFIRMED as scope-control rule

The number 24 is a target, not a quota that justifies filler.

If runtime production evidence shows 18 excellent recipes are stronger than 24 repetitive ones, revise the catalog explicitly rather than shipping weak content.
