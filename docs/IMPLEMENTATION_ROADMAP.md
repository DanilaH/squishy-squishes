# Squishy Squishes — Implementation Roadmap

**Status:** ACTIVE PLAYER-FACING POLISH
**Current gate:** UI/UX Pass 01 — recipe-first shell
**Catalog target:** 6 production shapes / 24 canonical recipes — ENGINEERING COMPLETE

RC01 was an important release-infrastructure milestone, not product completion. It proved reproducible Pages/Yandex builds, platform lifecycle, analytics/ad seams and packaging. The remaining work is deliberately player-facing: recipe browsing, feel/art/audio/reward hierarchy, repeated-use QA and only then Yandex DRAFT/publication.

Phase 7B phone review remains explicitly deferred by owner decision. Do not convert that deferral into a false acceptance claim.

---

## Phase 0 — Product/spec lock — COMPLETE

Locked product thesis:

- compact tactile maker / collection game;
- deterministic curated recipes;
- high-CMF content multiplication;
- raw WebGL2 hero + DOM/CSS UI + WebAudio;
- no currency/shop/orders/customers;
- no bespoke minigame per recipe.

---

## Phase 1 — Vertical Slice 01 — COMPLETE

Validated:

`select → paint/pour → optional filling → mix/stretch → form → reveal → free squeeze → Collect → repeat`

The core tactile loop was accepted as worth productionizing.

Historical evidence: `VERTICAL_SLICE_01.md`, `PRODUCTION_PASS_01.md`.

---

## Phase 2 — Full-loop interaction correction — COMPLETE

Accepted interaction grammar includes:

- unique-coverage paint rather than hold progress;
- motion-driven filling shake;
- real pointer travel + stretch for Mix;
- normal mold taps + stronger crit targets;
- no fail/lives/combo punishment;
- corrected pointer/audio/lifecycle edge cases.

Do not reopen interaction tuning without hands-on evidence.

---

## Phase 3 — Production Skeleton 01 — COMPLETE

Delivered:

- app bootstrap boundary;
- mock + Yandex runtime seam;
- versioned game/settings repositories;
- legacy save migration;
- typed RU/EN copy;
- aggregate gameplay activity lifecycle;
- debug seam;
- pinned `mini-games-kit@d17ba31fce2a71335dcc3095f772c3fdd87fe97b`.

Canonical docs: `PRODUCTION_SKELETON_01.md`, `PRODUCTION_SKELETON_01_REVIEW.md`.

---

## Phase 4 — Renderer reuse / second shape — COMPLETE

Soft Cube and Soft Heart proved one generic spring/deformation/shader/craft path and one shared shape-boundary representation for render mask, hit testing, paint and mold validation.

No shape-specific physics branch was required.

---

## Phase 5 — Progression + Collection — COMPLETE

Delivered:

- Lab XP / derived Lab Rank;
- +100 first completion / +25 repeat validation tuning;
- deterministic unlock table;
- locked / available / completed states;
- completed-item free squeeze revisit;
- compact milestone feedback;
- SaveState V2;
- hardened reset behavior.

No spendable currency was introduced.

Canonical docs: `PROGRESSION_COLLECTION_01*.md`.

---

## Phase 6 — Representative Content 01 — COMPLETE

Validated reusable content vocabulary:

- `soft`, `jelly`, `holo` material profiles in one shader path;
- Smooth / Foam / Pearl filling styles;
- premium recipes through the same craft loop;
- explicit curated recipe registry rather than a Cartesian canonical catalog.

PR #12 fixed one shared spring-release visual snap without material-specific code.

Canonical docs: `REPRESENTATIVE_CONTENT_01*.md`.

---

## Phase 7 — Catalog production — ENGINEERING COMPLETE

### 7A — Mochi + Peach — COMPLETE

Added Mochi + Peach Puff, two reusable palettes and four curated recipes without renderer/physics/audio/save changes.

### 7B — Mushroom + Paw — ENGINEERING COMPLETE / MANUAL QA DEFERRED

Added Mushroom + Paw and four curated recipes with zero new palettes/materials/fillings and no renderer/shader/physics/audio/save changes.

Result:

- **6 production shapes**;
- **24 canonical recipes**.

Manual phone inspection of Mushroom/Paw was explicitly deferred by owner decision. It remains part of later representative smoke QA.

**Catalog freeze:** do not automatically add Blob Creature, more recipes, new finishes or new gameplay systems before release evidence.

Canonical docs: `CATALOG_PRODUCTION_7A*.md`, `CATALOG_PRODUCTION_7B*.md`.

---

## RC01 — Release infrastructure / platform hardening — COMPLETE

RC01 established a reproducible shipping foundation:

- final release CSS layer around the existing craft surface;
- Yandex runtime lifecycle integration;
- compact analytics seam with optional Metrica transport;
- conservative post-loop interstitial policy;
- separate GitHub Pages and Yandex archive builds;
- Yandex dist verification;
- Yandex QA-module exclusion;
- permanent Release Check CI producing `squishy-squishes-yandex.zip`;
- successful main Pages deployment.

RC01 did **not** prove final player-facing UI, repeated-use feel, final reward presentation or store readiness. Those remain active work below.

Canonical docs: `RELEASE_CANDIDATE_01*.md`.

---

## UI/UX Pass 01 — Recipe-first shell — STRUCTURAL PASS / MANUAL QA DEFERRED

Canonical docs:

- `UI_UX_PASS_01.md`;
- `UI_UX_PASS_01_REVIEW.md`;
- `UI_UX_PASS_01_IMPLEMENTATION_REVIEW.md`.

Goal: replace the validation-era component builder with a finished recipe-first collectible flow.

Delivered structurally:

- legacy Shape / Color / Texture builder removed from the player-facing select surface;
- selected canonical recipe + metadata shown directly in the lab;
- one Recipes/Browse control opens the existing Collection surface;
- Collection promoted into the primary canonical recipe browser;
- all 24 recipes represented from the existing progression snapshot;
- completed recipes expose both `Make again` and `Squeeze`;
- generic card thumbnails derive from canonical `ShapeDefinition.boundary` geometry;
- material/filling thumbnail cues remain generic/reusable;
- available / completed / locked hierarchy strengthened;
- RU/EN copy updated;
- no content/progression/save/renderer/audio/tactile changes.

Validation run `34874484160` passed diff check, strict TypeScript, Pages build, Yandex build and Yandex dist verification.

Manual phone visual acceptance remains deferred by owner decision and must not be silently marked complete.

---

## Feel / Art / Audio Pass 01 — NEXT

### Goal

Turn the accepted mechanics and recipe browser into a coherent premium tactile toy product under repetition.

Bounded focus:

- remove remaining prototype/internal-tool presentation residue;
- improve reveal anticipation, impact and stable-result ownership;
- create a bounded reward hierarchy for ordinary vs premium material/filling results;
- improve Collect causality instead of abrupt disappearance;
- add material-sensitive audio nuance without making every recipe a bespoke sound design project;
- reduce repetition fatigue across stage-complete/reveal/collect sounds;
- preserve sound-off readability;
- preserve the same craft state machine and 24-recipe catalog.

Explicit non-goals:

- no new recipes/shapes/material systems;
- no new craft stage;
- no shop/economy;
- no particle spam masking weak material rendering;
- no per-recipe animation/audio branches unless evidence proves a real exception.

Exit: structural validation + deployed representative visual/audio review, with manual acceptance allowed to remain explicitly deferred if owner chooses to continue.

---

## Repeated-use / release QA — AFTER FEEL PASS

Run the actual ship-acceptance work from `QA_AND_ACCEPTANCE.md`:

- single-recipe repetition stress;
- fresh-save progression run;
- mixed-catalog run;
- completed-item revisit run;
- lifecycle interruption matrix;
- representative performance checks;
- phone portrait/landscape + desktop short-height;
- RU/EN clipping/readability;
- Yandex ad pause/resume behavior;
- fresh/existing save and reload boundaries.

Functional success is not sufficient. This gate looks for fatigue, friction and lifecycle defects under repetition.

---

## Yandex DRAFT / store / moderation — EXTERNAL FINAL GATE

Repository engineering can prepare the artifact but cannot truthfully complete:

- Yandex Games project metadata;
- icon/cover/screenshots/store copy;
- final archive upload;
- DRAFT runtime/ad validation;
- moderation result;
- production platform observations.

Any discovered defect should become a bounded RC patch, not an excuse to reopen catalog architecture by default.

---

## Ship / learn — AFTER PUBLICATION

Observe:

- activation and craft completion;
- first-completion vs repeat behavior;
- recipe/shape engagement;
- recipe browser opens/revisits/recrafts;
- result squeeze behavior;
- interstitial request/show behavior;
- retention signals available from the platform.

Prefer content/presentation fixes backed by evidence. Add systems only when evidence says content reuse is no longer enough.

---

# Cross-phase stop rules

Stop and reassess if:

- raw WebGL becomes the dominant production burden;
- shapes require bespoke deformation code;
- recipes require new minigames merely to differ;
- progression starts demanding currency/shop complexity;
- target-device performance fails;
- scope is added to hide weak tactile/reveal feel;
- monetization can interrupt tactile gameplay;
- polish starts changing unrelated validated interaction/content code;
- final presentation relies on particle quantity rather than material/readability.

A failed assumption is evidence. Fix the assumption or reduce scope; do not hide it with more systems.
