# Squishy Squishes — Implementation Roadmap

**Status:** RELEASE CANDIDATE
**Current gate:** RC01 engineering + external Yandex publication
**Catalog target:** 6 production shapes / 24 canonical recipes

The tactile loop, reusable renderer, progression/Collection, representative materials and bounded catalog production are complete. New gameplay/content work is frozen unless post-release evidence justifies it.

Phase 7B phone review was explicitly deferred by the product owner. It remains a pre-publication smoke check, not an engineering blocker.

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

Soft Cube and Soft Heart proved one generic:

- spring mesh;
- deformation path;
- shader/material path;
- craft state machine;
- shape boundary representation for render mask, hit testing, paint and mold validation.

No shape-specific physics branch was required.

Phone acceptance passed on 2026-09-14.

---

## Phase 5 — Progression + Collection — COMPLETE

Delivered:

- Lab XP / derived Lab Rank;
- +100 first completion / +25 repeat validation tuning;
- deterministic unlock table;
- locked / available / completed Collection cards;
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

Phone QA accepted the material/filling proof. PR #12 fixed one shared spring-release visual snap without material-specific code.

Canonical docs: `REPRESENTATIVE_CONTENT_01*.md`.

---

## Phase 7 — Catalog production — COMPLETE

### 7A — Mochi + Peach — COMPLETE

Added:

- Mochi;
- Peach Puff;
- two reusable palettes;
- four curated recipes;
- no renderer/physics/audio/save changes.

Deployed phone acceptance passed on 2026-09-14.

Canonical docs: `CATALOG_PRODUCTION_7A*.md`.

### 7B — Mushroom + Paw — ENGINEERING COMPLETE

Added:

- Mushroom;
- Paw;
- four curated recipes;
- zero new palettes/materials/fillings;
- no `VerticalSliceApp`, renderer, shader, physics, audio or save changes.

Result:

- **6 production shapes**;
- **24 canonical recipes**.

This is sufficient evidence for the high-CMF thesis: the final batch was cheaper than earlier content batches.

Manual phone inspection of Mushroom/Paw was deferred by owner decision. Treat it as a release smoke check, not an excuse to expand or rewrite the catalog.

Canonical docs: `CATALOG_PRODUCTION_7B*.md`.

**Catalog freeze:** do not automatically add Blob Creature, more recipes, new finishes or new gameplay systems before release evidence.

---

## RC01 — Presentation + platform + release hardening — RELEASE CANDIDATE

Canonical docs:

- `RELEASE_CANDIDATE_01.md`;
- `RELEASE_CANDIDATE_01_REVIEW.md`;
- `RELEASE_CANDIDATE_01_IMPLEMENTATION_REVIEW.md`.

RC01 consolidates the old Phase 8–10 engineering work into one bounded release pass.

### Presentation

- keep the proven craft DOM/renderer intact;
- apply a final release presentation layer;
- make Collection read as the primary curated catalog;
- improve mobile/short-landscape density;
- remove internal-tool presentation from the Yandex build;
- keep Pages QA tooling available for development/testing.

### Platform lifecycle

- use the existing pinned Yandex runtime only;
- `LoadingAPI.ready()` remains owned by runtime `markReady()`;
- `GameplayAPI.start/stop` remains owned by `GameplayActivityCoordinator`;
- Collection/menu state marks gameplay undesired without creating a fake external block;
- visibility, platform pause and ad blocking continue through the existing blocker path.

### Analytics

Compact events only:

- session ready;
- catalog open/close;
- craft start;
- craft collect;
- catalog recipe start;
- completed-recipe revisit;
- mute toggle;
- interstitial request/result.

Yandex Metrica is optional through `VITE_METRICA_COUNTER_ID`. Missing/invalid configuration falls back safely and never blocks gameplay.

### Monetization

RC01 uses only conservative fullscreen interstitials:

- Yandex runtime only;
- only after a completed craft returns from `collect` to `select`;
- never during paint/add/mix/mold/reveal/test;
- local 120-second session grace;
- minimum 3 completed loops between requests;
- local 150-second request cooldown;
- ad lifecycle blocks gameplay through the existing activity coordinator.

Deferred:

- rewarded ads;
- sticky banners;
- ad-driven progression economy.

### Release build

Two production targets are explicit:

1. GitHub Pages: `/squishy-squishes/` base, QA convenience retained.
2. Yandex archive: relative `./` assets, `VITE_PLATFORM=yandex`, QA panel excluded.

`npm run release:check` validates both targets and verifies the Yandex dist.

Permanent `Release Check` GitHub Actions CI packages `squishy-squishes-yandex.zip` with `index.html` at archive root.

### Engineering exit condition

RC01 engineering is complete when:

- strict TypeScript passes;
- Pages production build passes;
- Yandex production build passes;
- Yandex dist verifier passes;
- QA code is absent from the Yandex bundle;
- final diff review passes;
- release CI passes;
- main Pages deployment succeeds.

---

## External publication gate — PENDING OUTSIDE REPOSITORY

These items cannot be truthfully completed by repository code alone:

- one representative phone smoke pass (Mushroom, Paw, one legacy recipe);
- optional Yandex Metrica counter ID configuration;
- Yandex Games console/project metadata and store assets;
- upload of the generated Yandex ZIP;
- Yandex DRAFT/moderation result;
- production ad behavior observation after platform approval.

Failures here should produce a small RC02 patch. They do not justify reopening catalog architecture by default.

---

## Ship / learn — AFTER PUBLICATION

Observe:

- activation and craft completion;
- first-completion vs repeat behavior;
- recipe/shape engagement;
- catalog opens/revisits;
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
- a release fix starts changing unrelated validated interaction/content code.

A failed assumption is evidence. Fix the assumption or reduce scope; do not hide it with more systems.
