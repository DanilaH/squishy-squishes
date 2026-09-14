# Squishy Squishes — Implementation Roadmap

**Status:** ACTIVE PRODUCTION ROADMAP
**Current gate:** Phase 3 — Production Skeleton 01
**Next gate:** Phase 4 — Renderer Reuse / Second Shape

The tactile probe, complete vertical slice, production renderer pass, and evidence-backed interaction corrections have passed. The project is now moving from a proven loop into production architecture and then into content-scale validation.

---

## Phase 0 — Product/spec lock — COMPLETE

Confirmed:

- compact tactile maker / collection game;
- cheap 2D WebGL deformation core;
- deterministic curated recipes;
- premium tactile toy-lab direction;
- no currency/shop/orders/customers;
- high-CMF content thesis;
- raw WebGL2 + DOM/CSS baseline;
- responsive desktop/mobile baseline;
- conservative between-loop monetization later.

---

## Phase 1 — Vertical Slice 01 — COMPLETE

Validated one complete loop:

`select → paint/pour → optional filling → mix/stretch → form → reveal → free squeeze → Collect → repeat`

Validated slice content:

- one rounded soft-cube / superellipse geometry;
- three palettes;
- Smooth / Foam Beads modifier;
- six deterministic variants.

The slice answered the core product question: the tiny loop is worth productionizing.

Historical acceptance evidence remains in `VERTICAL_SLICE_01.md` and `PRODUCTION_PASS_01.md`.

---

## Phase 2 — Full-loop correction — COMPLETE

Interaction Passes 02–04 applied only hands-on, high-frequency corrections:

- first beat became surface paint/coverage;
- paint duration/readability and visual bleed improved;
- foam became shake/scatter rather than a single stream;
- foam presentation quality improved;
- mix requires real pointer motion + stretch;
- active craft beats were lengthened;
- forming now uses normal taps + stronger persistent crit targets;
- lifecycle/pointer/audio edge cases were reviewed repeatedly.

No additional mechanic invention is required before production architecture.

---

## Phase 3 — Production Skeleton 01 — ACTIVE

### Goal

Put production boundaries around the accepted loop without changing its feel.

Canonical bounded spec:

- `PRODUCTION_SKELETON_01.md`
- `PRODUCTION_SKELETON_01_REVIEW.md`

### Work

- preserve reviewed `mini-games-kit@d17ba31fce2a71335dcc3095f772c3fdd87fe97b` pin;
- app bootstrap boundary;
- mock + explicit Yandex runtime seam;
- versioned game save repository;
- one-time legacy slice-save migration;
- separate versioned settings repository;
- typed RU/EN copy skeleton;
- aggregate activity lifecycle wiring;
- DEV-only debug seam;
- remove direct storage/platform ownership from `VerticalSliceApp`;
- preserve the already-working shared render-density path;
- preserve all accepted craft tuning.

### Exit gate

- accepted six-variant slice still behaves equivalently;
- strict typecheck/build green;
- save/settings round-trip;
- legacy discoveries migrate safely;
- platform blocking releases active interaction/audio and resumes without dt jumps;
- GitHub Pages remains playable on phone;
- final diff contains no hidden gameplay tuning or speculative framework layer.

---

## Phase 4 — Renderer Reuse / Second Shape — NEXT

### Goal

Prove the high-CMF technical thesis instead of assuming it.

### Work

- extract/data-drive shape representation only as much as the second shape requires;
- keep one shared deformation/material path;
- add exactly one materially different second shape;
- verify existing materials/fillings still work without bespoke per-shape gameplay;
- establish preview/card rendering strategy;
- measure representative mobile performance.

### Exit gate

Two materially different shapes and several recipes use one deformation/material system without bespoke physics or a separate state machine.

If this fails, repair the renderer/content boundary before adding more shapes.

---

## Phase 5 — Progression + Collection

### Goal

Build the “one more recipe” layer after multi-shape reuse is proven.

Leading model:

- one Lab XP / Lab Rank track;
- strong first-completion progress;
- smaller repeat progress;
- deterministic unlock table;
- no spendable currency.

Also:

- collection read model;
- locked / unlocked-unmade / completed cards;
- revisit completed items for free squeeze;
- a few meaningful milestone celebrations;
- debug state seeding;
- save migration tests.

### Exit gate

Fresh save reaches several desirable unlocks at a cadence supported by measured loop timing.

---

## Phase 6 — Interaction/content expansion

### Goal

Prove optional content variation without turning the product into a mini-game collection.

Possible additions only where content needs them:

- richer filling/add variants;
- selected DRAG/APPLY finish/decor behavior;
- one restrained finish/decor beat if justified;
- premium reveal hierarchy.

Use only a few representative recipes before catalog scale.

### Exit gate

Most novelty comes from material/content/choreography rather than bespoke mechanics.

---

## Phase 7 — Catalog production

### Goal

Scale through the validated high-CMF system.

Working launch target:

- about 6 base shapes;
- about 24 strong curated recipes;
- quality may explicitly reduce the count.

Produce in small batches and review in-game between batches. No filler to satisfy a quota.

---

## Phase 8 — Platform, analytics, monetization

Finish platform behavior after real craft/session cadence exists.

- production Yandex runtime configuration;
- cloud policy only if justified;
- compact analytics contract;
- conservative interstitial eligibility only after Collect;
- grace/cooldown/craft-count gates;
- at most one rewarded progression offer if useful;
- ad/activity/audio lifecycle stress.

No ad may interrupt tactile craft, reveal, or result squeeze.

---

## Phase 9 — Full feel/art/audio correction

Prioritize repeated-use evidence:

- high-frequency craft beats;
- reveal/result stability;
- exit/restart speed;
- sound-off readability;
- audio/visual fatigue;
- material hierarchy;
- target-device performance.

Do not spend equal effort on low-frequency settings chrome.

---

## Phase 10 — Release hardening / Yandex DRAFT

Validate the exact release revision:

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
- inspect conservative ad behavior;
- write material lessons back to portfolio decisions;
- extract additional shared code only with real second-consumer evidence;
- prefer content additions over new systems when content demand is the bottleneck.

---

# Cross-phase stop rules

Stop and reassess if:

- the complete craft/reveal loop stops being fun under repetition;
- raw WebGL becomes the dominant production burden;
- multiple shapes require bespoke deformation code;
- recipes require new mini-games merely to feel different;
- progression starts demanding currency/shop complexity;
- performance fails on representative mobile conditions;
- scope is being added to hide weak tactile/reveal feel;
- catalog production burden is materially worse than the high-CMF thesis predicted.

A failed assumption is evidence. Fix the assumption or reduce scope; do not hide it with more systems.
