# Squishy Squishes — Implementation Roadmap

**Status:** ACTIVE PRODUCTION ROADMAP
**Current gate:** Production Skeleton 01. Vertical Slice 01 and interaction correction passes are complete; the next gate is one materially different second shape.

The successful feel probe already answered the isolated deformation question. The highest-value next evidence is whether the entire tiny product loop is worth repeating.

---

## Phase 0 — Product/spec lock — COMPLETE

Confirmed:

- Squishy is the active next project;
- cheap 2D deformation remains the core;
- deterministic curated recipes;
- premium tactile toy-lab direction;
- no currency/shop/orders/customers;
- long-term high-CMF content target;
- raw WebGL2 + DOM/CSS baseline;
- responsive desktop/mobile starting assumption;
- conservative between-loop monetization later;
- mid-craft reload may restart the current short craft.

Immediate implementation scope is locked in `VERTICAL_SLICE_01.md`.

---

## Phase 1 — Vertical Slice 01: one shape, full loop — COMPLETE

### Goal

Build the smallest honest version of the game directly on the validated probe base.

Loop:

`select → pour → optional filling → mix/squish → mold/press → reveal → free squeeze → Collect → repeat`

Content:

- current rounded cube/superellipse geometry only;
- three color palettes;
- Smooth / Foam Beads filling modifier;
- six deterministic results total.

UI:

- minimal overlays only;
- no final recipe browser/collection shell;
- preserve DEV metrics/mute/mesh only as secondary tools.

### Work

- add small stage controller;
- add material palette configuration to the existing renderer;
- add procedural filling treatment;
- add cheap hold-to-pour beat;
- add optional hold-to-add-filling beat;
- use the actual squish engine for mix;
- use press/deformation input for mold progress;
- add short unmold/reveal choreography;
- allow unrestricted result squeeze;
- add Collect → next-loop transition;
- optionally persist discovered variant ids only;
- keep stage progress deterministic and bounded.

### Explicit non-goals

Do not build yet:

- production platform bootstrap;
- Yandex SDK;
- cloud save;
- Lab XP;
- ads;
- final i18n;
- second shape;
- final collection screen;
- mass asset/content pipeline.

### Exit gate

Hands-on 5–10 complete loops.

PASS when the obvious next task is scale/productionization rather than inventing another mechanic/meta system.

If a beat is weak, correct that beat before adding scope.

---

## Phase 2 — Full-loop correction pass — COMPLETE

### Goal

Polish the high-frequency loop exposed by real repeated play.

Correct only evidence-backed issues such as:

- pour response/readability;
- stage length;
- weak mix completion feedback;
- mold causality;
- reveal anticipation/settle;
- result squeeze transition;
- Collect exit latency;
- audio fatigue;
- modifier readability;
- mobile composition/performance.

### Exit gate

A repeated-use run has no obvious high-value loop correction remaining.

Do not use this phase to add progression, more shapes or prettier menus.

---

## Phase 3 — Production Skeleton 01 — ACTIVE

### Goal

Productionize code **after** the loop has proven what needs to exist.

### Work

- preserve the already-pinned reviewed `mini-games-kit@d17ba31fce2a71335dcc3095f772c3fdd87fe97b` production dependency;
- app/platform bootstrap;
- mock + Yandex runtime seam;
- settings repository;
- versioned game save repository;
- typed RU/EN skeleton;
- activity lifecycle wiring;
- render-density setup;
- DEV-only scenario/debug panel;
- separate renderer/stage/domain boundaries from temporary slice shell;
- preserve the accepted slice behavior during refactor.

### Exit gate

- accepted slice still feels the same or better;
- build/typecheck/tests green;
- save/settings round-trip;
- lifecycle cleanup works;
- no speculative framework layer introduced.

---

## Phase 4 — Renderer reuse + second-shape gate

### Goal

Prove the high-CMF technical thesis rather than assuming it.

### Work

- data-driven material palettes/fillings/finishes;
- clean recipe registry;
- shape representation beyond current superellipse;
- add exactly one materially different second shape;
- card/preview strategy;
- performance diagnostics.

### Exit gate

Two shapes and several recipes use the same deformation/material path without bespoke per-recipe physics/gameplay code.

If this fails, fix the renderer/content boundary before producing six shapes.

---

## Phase 5 — Progression + collection

### Goal

Build the “one more recipe” layer using measured full-loop duration.

Leading model:

- one Lab XP / Lab Rank track;
- strong first-completion progress;
- smaller repeat progress;
- deterministic unlock table;
- no spendable currency.

Also:

- collection read model;
- locked/unlocked/completed cards;
- item revisit squeeze;
- small milestone celebrations;
- debug state seeding;
- save migration tests.

### Exit gate

Fresh save reaches several desirable unlocks at a cadence supported by real loop timing.

---

## Phase 6 — Interaction/content expansion

### Goal

Prove optional stage variation without creating a mini-game collection.

Possible additions only where content needs them:

- richer filling/add variants;
- DRAG/APPLY for selected finishes/decor;
- one restrained decorate/finish beat;
- premium reveal hierarchy.

Use 3–4 representative recipes before mass catalog work.

### Exit gate

Variety comes mainly from material/content/choreography, not bespoke mechanics.

---

## Phase 7 — Catalog production

### Goal

Scale through the validated high-CMF system.

Working launch target:

- about 6 base shapes;
- about 24 strong curated recipes;
- quality may explicitly reduce the count.

Produce in small batches and review in-game between batches.

No filler to satisfy a numeric quota.

---

## Phase 8 — Platform, analytics, monetization

Finish product behavior only after real craft/session cadence exists.

- Yandex production runtime;
- cloud policy if justified;
- compact analytics contract;
- interstitial only at post-Collect boundaries with grace/cooldown/craft-count gate;
- at most one rewarded progression offer if still useful;
- ad/activity/audio lifecycle stress.

No ad may interrupt an active tactile/reveal/result beat.

---

## Phase 9 — Full feel/art/audio correction

Use repeated-use evidence and the portfolio polish acceptance doctrine.

Prioritize:

- high-frequency craft beats;
- reveal/result stability;
- exit/restart speed;
- sound-off readability;
- audio/visual fatigue;
- premium material hierarchy;
- target-device performance.

Do not spend equal effort on low-frequency settings chrome.

---

## Phase 10 — Release hardening / Yandex DRAFT

Validate exact release revision:

- production build;
- desktop/mobile real-browser checks;
- orientation behavior;
- fresh/existing save;
- lifecycle/reload/ad recovery;
- RU/EN;
- asset/network failures where relevant;
- Yandex DRAFT/moderation;
- store assets;
- encoded size/performance.

---

## Phase 11 — Ship / learn

After release:

- observe activation/repeat funnel;
- inspect recipe/shape engagement;
- inspect ad behavior conservatively;
- write material lessons back to `DanilaH/decisions`;
- extract shared code only with real second-consumer evidence;
- prefer content additions over new systems if content demand is the bottleneck.

---

# Cross-phase stop rules

Stop and reassess if:

- complete craft/reveal loop is not fun enough to repeat;
- raw WebGL becomes the dominant production burden;
- multiple shapes require bespoke deformation code;
- recipes need new mini-games merely to feel different;
- progression starts demanding currency/shop complexity;
- performance fails on representative mobile conditions;
- scope is being added to hide weak tactile/reveal feel;
- catalog production burden is materially worse than the high-CMF thesis predicted.

A failed assumption is evidence. Do not hide it with scope.