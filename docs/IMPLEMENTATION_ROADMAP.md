# Squishy Squishes — Implementation Roadmap

**Status:** ACTIVE PRODUCTION ROADMAP
**Current gate:** Phase 5 — Progression + Collection 01
**Previous gate:** Phase 4 — Renderer Reuse / Second Shape — COMPLETE

The tactile probe, complete vertical slice, production shell and two-shape renderer-reuse gate have passed. Soft Cube + Soft Heart share the same deformation/material/craft path and the merged phone build was accepted. The project is now validating the one-more-squishy progression/collection loop before representative content expansion.

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

## Phase 3 — Production Skeleton 01 — COMPLETE

### Goal

Put production boundaries around the accepted loop without changing its feel.

Canonical bounded spec:

- `PRODUCTION_SKELETON_01.md`
- `PRODUCTION_SKELETON_01_REVIEW.md`

### Completed work

- preserved reviewed `mini-games-kit@d17ba31fce2a71335dcc3095f772c3fdd87fe97b` pin;
- added app bootstrap boundary;
- added mock + explicit Yandex runtime seam;
- added versioned game save repository;
- added one-time legacy slice-save migration;
- added separate versioned settings repository;
- added typed RU/EN copy skeleton;
- routed platform/visibility blocking through aggregate activity lifecycle;
- added DEV-only debug seam;
- removed direct storage/platform ownership from `VerticalSliceApp`;
- preserved shared render-density path and accepted craft tuning.

### Exit result

Structural review passed, strict typecheck/build passed, the final production source was merged, and the main GitHub Pages pipeline successfully rebuilt/published the production shell.

---

## Phase 4 — Renderer Reuse / Second Shape — COMPLETE

### Goal

Prove the high-CMF technical thesis instead of assuming it.

Canonical bounded spec:

- `RENDERER_REUSE_SECOND_SHAPE.md`
- `RENDERER_REUSE_SECOND_SHAPE_REVIEW.md`

### Work

- preserve the existing rounded soft-square;
- centralize normalized silhouette data in one `ShapeDefinition` registry;
- add exactly one materially different second shape: Soft Heart;
- keep one spring mesh, one deformation path, one shader/material path and one craft state machine;
- use shared shape geometry for WebGL field masking, pointer hit testing, paint clipping/coverage and mold target validation;
- keep all three palettes and both fillings reusable on both silhouettes;
- expand deterministic selectable variants from 6 to 12;
- preserve the original six durable variant IDs and save schema V1;
- keep all Phase 3 runtime/save/settings/lifecycle boundaries intact;
- run strict typecheck/build and independent final diff review;
- deploy and perform a representative phone acceptance check.

### Structural exit gate

- two materially different shapes use the same deformation/material system;
- no `shape.id` branch exists in deformation physics, stage-progress math, audio behavior or craft transitions;
- existing IDs/save load without migration;
- build/typecheck green;
- no third shape, progression or final collection work leaks into the diff.

### Product exit gate

After deployment, phone hands-on confirms:

- heart edge/notch quality remains coherent while stretching;
- paint feels fair on the concave shape;
- selector/composition fits the phone surface;
- input responsiveness/performance remain acceptable.

Phone acceptance on the merged Pages build passed on 2026-09-14. The renderer/content reuse gate is closed; future shape work must preserve the same shared path.

---

## Phase 5 — Progression + Collection — ACTIVE

Canonical bounded spec:

- `PROGRESSION_COLLECTION_01.md`
- `PROGRESSION_COLLECTION_01_REVIEW.md`
- `PROGRESSION_COLLECTION_01_IMPLEMENTATION_REVIEW.md`

### Goal

Build the “one more recipe” layer only after multi-shape reuse is proven.

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
