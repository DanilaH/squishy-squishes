# Squishy Squishes — Implementation Roadmap

**Status:** PRE-DEVELOPMENT PROPOSAL  
**Rule:** do not start Phase 1 until `PREIMPLEMENTATION_REVIEW.md` is resolved.

The roadmap intentionally builds one complete vertical slice before producing the full catalog.

---

## Phase 0 — Pre-development lock

### Goal

Resolve the small set of product choices that materially affect architecture/scope.

### Required decisions

- responsive both orientations vs landscape-only;
- confirm 6-shape / 24-canonical-recipe MVP target;
- confirm no currency/shop/orders/customers;
- confirm Lab Rank progression direction;
- confirm deterministic recipes rather than random primary outcomes;
- confirm ad posture and rewarded XP candidate;
- confirm raw WebGL2 + DOM/CSS baseline;
- confirm full-game kit pin `d17ba31...`.

### Exit gate

`PREIMPLEMENTATION_REVIEW.md` has explicit answers and `DECISIONS.md` is updated.

---

## Phase 1 — Production skeleton

### Goal

Turn the successful probe repository into a clean production app shell without changing product feel yet.

### Work

- update/pin `mini-games-kit` full-game revision;
- solve private dependency install for local/CI;
- establish app/platform bootstrap;
- mock + Yandex runtime seam;
- settings repository;
- versioned game save repository;
- RU/EN typed i18n skeleton;
- activity lifecycle wiring;
- render-density setup;
- DEV-only debug panel skeleton;
- preserve a runnable squeeze sandbox as a regression/debug route or mode if useful.

### Explicit non-goal

Do not build all crafting stages/content yet.

### Exit gate

- app boots through mock runtime;
- save/settings round-trip;
- pause/visibility cleanup works;
- private kit works in CI or chosen validation environment;
- one production renderer screen displays the validated soft object;
- typecheck/build/tests green.

---

## Phase 2 — Production squish renderer + content schemas

### Goal

Convert probe code into a reusable renderer capable of multiple data-driven shapes/materials without recipe-specific behavior.

### Work

- separate deformation simulation from probe/debug shell;
- production renderer lifecycle/resize/DPR handling;
- shape mask/SDF representation;
- material parameter system;
- filling/decal representation;
- recipe/content registry validation;
- implement first two base shapes;
- implement first simple + first premium material;
- collection-card preview strategy;
- performance diagnostics preserved in DEV.

### Exit gate

At least four visually distinct test recipes run through the **same** renderer/deformation path with no per-recipe deformation code.

Hands-on check:

- core still feels at least as good as the probe;
- no material path breaks input responsiveness;
- small-card identity matches hero result.

If this gate fails, fix renderer/content architecture before adding stages.

---

## Phase 3 — First complete vertical slice

### Goal

Ship one end-to-end playable recipe with the actual product grammar.

Recommended slice: **Milk Mochi** or another simple starter confirmed in review.

### Work

- recipe select/entry;
- HOLD/DISPENSE pour;
- mix/squish using production renderer;
- mold/press;
- unmold reveal;
- test squeeze;
- result collect;
- durable first-completion write;
- Lab XP/progress visual placeholder using real domain state;
- minimal collection card;
- baseline ambience + stage/reveal audio;
- first contextual onboarding hints.

### Exit gate

One full loop is:

- understandable without a tutorial wall;
- responsive;
- restartable;
- interruption-safe;
- visually coherent;
- satisfying enough to repeat several times.

Perform repeated-use hands-on before proceeding.

Do not mass-produce content if the end-to-end loop feels weak.

---

## Phase 4 — Interaction grammar completion

### Goal

Prove the reusable stage library across materially different recipes.

### Work

- filling/add stage;
- DRAG/APPLY stage where genuinely useful;
- optional finish/decorate stage;
- stage variants/data config;
- safe cancel/pause transitions;
- reveal hierarchy by tier;
- result-exit/collection choreography;
- audio ownership/ducking across stages.

Use 3–4 representative recipes, including at least one filled/translucent premium result.

### Exit gate

The representative recipes feel different because of content/material/choreography, **not because each has bespoke mechanics**.

No recipe should require a fourth/fifth major interaction grammar without an explicit scope decision.

---

## Phase 5 — Progression + collection

### Goal

Create the “one more recipe” loop around the validated craft.

### Work

- Lab XP/rank pure domain model;
- deterministic unlock table;
- first-time vs repeat award;
- collection read model;
- locked/unlocked/completed cards;
- collection detail squeeze/revisit;
- collection milestones;
- durable save migration tests;
- debug scenario seeding.

### Exit gate

A fresh save can play through several unlocks with no manual state edits.

Check specifically:

- meaningful unlocks are frequent;
- collection does not become menu work;
- repeat craft is not required excessively to reach new content;
- first session exposes shape/material variety early.

Only after this gate should exact XP thresholds be treated as real balance rather than placeholder values.

---

## Phase 6 — Catalog production

### Goal

Produce the MVP catalog through the validated content system.

### Work

- all 6 canonical shape masters;
- all planned material/filling/finish components needed by launch catalog;
- ~24 curated recipe configs;
- final working names → RU/EN display names;
- card previews;
- catalog ordering/unlock mapping;
- recipe visual acceptance;
- asset/source logs.

### Production rule

Work in small batches, e.g. 4–6 recipes, then compare in-game before producing the next batch.

### Exit gate

- 24 recipes integrated or scope explicitly revised based on production evidence;
- no weak filler recipes merely to hit a number;
- no recipe-specific gameplay forks;
- encoded/runtime asset cost remains reasonable.

---

## Phase 7 — Platform, analytics, monetization

Some platform wiring begins in Phase 1; this phase finishes product behavior after real loop cadence exists.

### Work

- final Yandex production runtime configuration;
- local/cloud reconciliation policy if Player Data mirroring is enabled;
- LoadingAPI readiness verification;
- compact analytics event contract;
- interstitial eligibility with measured craft cadence;
- one rewarded XP offer if still approved;
- ad/activity/audio lifecycle stress;
- real moderation-safe trigger timing;
- analytics debug verification.

### Exit gate

- no ad interrupts an active tactile/reveal beat;
- rewards are durable before visual transfer;
- no-fill/error does not spam requests;
- pause/resume + visibility + ad overlap cannot stick input/audio;
- first-session grace is preserved.

---

## Phase 8 — Full feel / art / audio correction

### Goal

Move from functionally complete to finished under repetition.

Use the canonical `DanilaH/decisions/Yandex Games/POLISH_ACCEPTANCE.md` as the external checklist.

### Work by evidence

- input acknowledgement;
- continuous response;
- stage completion impacts;
- reveal anticipation/settle;
- result stability;
- collection exit;
- idle environment life;
- sound-off readability;
- repeated audio fatigue;
- repeated visual fatigue;
- premium hierarchy;
- UI compactness;
- target-device performance.

### Rule

Polish the high-frequency loop first. Do not spread equal effort across settings/collection chrome while craft feel still has clear problems.

### Exit gate

Repeated-use session passes without identifiable high-value correction remaining.

---

## Phase 9 — Release hardening / Yandex DRAFT

### Goal

Validate the exact release tree externally.

### Work

- production build;
- desktop/mobile real-browser checks;
- orientation policy checks;
- fresh-save / existing-save migration;
- reload during each meaningful state;
- visibility/background recovery;
- ad lifecycle;
- RU/EN;
- asset/network failures where relevant;
- Yandex DRAFT/moderation behavior;
- store thumbnail/screenshots;
- final encoded size/performance profile.

### Exit gate

Exact candidate release revision is accepted hands-on and no release-blocking defect remains.

---

## Phase 10 — Ship / learn

After release:

- observe real activation/repeat funnel;
- inspect recipe/shape engagement;
- inspect ad behavior without overreacting to tiny samples;
- write material lessons back to `DanilaH/decisions`;
- extract shared code only if Squishy provides new second-consumer evidence;
- prefer small content additions over new systems if content demand is the bottleneck.

---

# Cross-phase stop rules

Stop and reassess before continuing if:

- raw WebGL becomes the dominant production cost rather than a cheap renderer;
- multiple shapes demand bespoke deformation code;
- a recipe needs a new mini-game to be visually distinct;
- progression requires a currency/shop to remain understandable;
- performance cannot hold under a representative premium recipe;
- new product scope is being added to compensate for weak crafting feel;
- catalog production burden is much higher than the high-CMF thesis predicted.

A failed assumption is useful evidence. Do not hide it by expanding scope.
