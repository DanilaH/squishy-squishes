# Squishy Squishes — Implementation Roadmap

**Status:** REAL-DEVICE PRODUCT ACCEPTANCE
**Current gate:** hands-on phone feel / visual / audio / performance review
**Catalog target:** 6 production shapes / 24 canonical recipes — ENGINEERING COMPLETE

RC01 established release infrastructure, then UI/UX Pass 01, Feel / Art / Audio Pass 01 and Release QA 01 closed the remaining broad engineering passes. The project is now at a deliberately manual product gate: automation can prove production integration, but it cannot prove tactile quality, visual taste, audio fatigue or real-phone performance.

Do not interpret this gate as permission to add more catalog or systems. Any issue found now should become a bounded evidence-driven release patch.

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

### 7B — Mushroom + Paw — ENGINEERING COMPLETE / MANUAL QA PENDING

Added Mushroom + Paw and four curated recipes with zero new palettes/materials/fillings and no renderer/shader/physics/audio/save changes.

Result:

- **6 production shapes**;
- **24 canonical recipes**.

Manual phone inspection of Mushroom/Paw was previously deferred. It is now part of the current real-device product gate.

**Catalog freeze:** do not automatically add Blob Creature, more recipes, new finishes or new gameplay systems before release evidence.

Canonical docs: `CATALOG_PRODUCTION_7A*.md`, `CATALOG_PRODUCTION_7B*.md`.

---

## RC01 — Release infrastructure / platform hardening — COMPLETE

RC01 established a reproducible shipping foundation:

- release presentation layer around the existing craft surface;
- Yandex runtime lifecycle integration;
- compact analytics seam with optional Metrica transport;
- conservative post-loop interstitial policy;
- separate GitHub Pages and Yandex archive builds;
- Yandex dist verification;
- Yandex QA-module exclusion;
- permanent Release Check CI producing `squishy-squishes-yandex.zip`;
- successful main Pages deployment.

RC01 was infrastructure, not final product acceptance.

Canonical docs: `RELEASE_CANDIDATE_01*.md`.

---

## UI/UX Pass 01 — Recipe-first shell — ENGINEERING COMPLETE / MANUAL QA PENDING

Delivered:

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

Validation and permanent release checks passed, and the pass is deployed on main Pages.

Canonical docs:

- `UI_UX_PASS_01.md`;
- `UI_UX_PASS_01_REVIEW.md`;
- `UI_UX_PASS_01_IMPLEMENTATION_REVIEW.md`.

Manual phone visual acceptance remains part of the current gate.

---

## Feel / Art / Audio Pass 01 — ENGINEERING COMPLETE / MANUAL QA PENDING

Delivered a bounded cosmetic reward hierarchy without changing gameplay semantics:

- reusable `standard | special | showcase` presentation tiers derived only from existing material/filling choices;
- reveal anticipation/environment/halo/result settle choreography;
- clearer Collect ownership choreography;
- tier-sensitive reveal/collect WebAudio contours;
- showcase results gain richness through layering rather than simply higher volume;
- deterministic stage-complete tone variation to reduce repetition fatigue;
- prototype copy residue removed;
- shader, renderer, spring physics, tactile squeeze, catalog, progression and save unchanged.

Validation, PR Release Check, main Release Check and Pages deployment all passed.

Canonical docs:

- `FEEL_ART_AUDIO_PASS_01.md`;
- `FEEL_ART_AUDIO_PASS_01_REVIEW.md`;
- `FEEL_ART_AUDIO_PASS_01_IMPLEMENTATION_REVIEW.md`.

Visual taste and audio fatigue are intentionally still subject to the current hands-on gate.

---

## Release QA 01 — ENGINEERING COMPLETE

Release QA 01 converts high-value integration checks into a permanent real-browser production gate.

### Permanent browser coverage

Against the actual built artifacts:

- Pages production boot;
- recipe-first UI and exactly 24 canonical recipe cards;
- Pages-only QA availability;
- phone portrait, phone landscape and short-desktop viewport containment;
- Yandex RU locale;
- Yandex QA exclusion;
- `LoadingAPI.ready()` contract;
- `GameplayAPI.start/stop` around Recipe Book state;
- settings persistence after reload;
- one complete fresh-save standard craft through real pointer-driven paint, WebGL Mix, mold, reveal and Collect;
- collection persistence after reload;
- completed-recipe `Make again` + `Squeeze` actions.

Validation run `34878254553` passed the normal release build/verifier path and **6/6 Chromium tests**.

The full-craft smoke uses production event handlers and real browser pointer input. No hidden stage-completion API, save seeding, private app-state mutation, gameplay threshold reduction or test-only production path was introduced.

`Release Browser QA` is a permanent CI workflow on PRs to `main` and pushes to `main`, separate from the faster `Release Check` packaging workflow.

Canonical docs:

- `RELEASE_QA_01.md`;
- `RELEASE_QA_01_REVIEW.md`;
- `RELEASE_QA_01_IMPLEMENTATION_REVIEW.md`.

---

## Real-device product acceptance — CURRENT HARD GATE

Automation is complete enough. The next evidence must come from an actual phone.

Use the Pages build and the Pages-only QA panel:

`QA → Rank 8 → Снять все → Рецепты`

Representative acceptance matrix:

1. **Phone portrait + landscape shell**
   - Recipe Book and recipe dock feel comfortable;
   - no meaningful clipping/overlap;
   - controls remain easy to reach;
   - no accidental browser scrolling/selection during craft.

2. **Mushroom full Make**
   - silhouette reads immediately;
   - paint/mix/mold work naturally on the shape;
   - result does not look like a broken generic mask.

3. **Paw full Make**
   - toes/palm remain readable during deformation;
   - interaction does not expose awkward boundary artifacts.

4. **Representative Jelly recipe**
   - material remains dense/readable rather than washed out;
   - reveal tier feels meaningfully richer than standard without visual noise.

5. **Representative Holo + Pearl recipe**
   - showcase reveal/settle/collect feels premium;
   - holo remains broad/stable rather than flickery rainbow noise;
   - pearls stay readable through deformation.

6. **Three to five consecutive crafts with sound enabled**
   - stage-complete sounds do not become irritating;
   - reveal/collect hierarchy is noticeable but not obnoxious;
   - tactile audio remains pleasant under repetition.

7. **Real-phone performance / thermal feel**
   - no obvious frame collapse during Mix or showcase reveal;
   - no escalating stutter after several loops;
   - no concerning thermal/battery behavior during a short session.

8. **Pages QA panel usability**
   - rank/completion controls work comfortably on phone;
   - progress manipulation does not corrupt normal craft/reload behavior.

**Exit condition:** owner hands-on acceptance or a concrete defect list that can be converted into bounded release patches.

Do not mark this section complete from desktop automation.

---

## Yandex DRAFT / store / moderation — AFTER REAL-DEVICE ACCEPTANCE

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
- final presentation relies on particle quantity rather than material/readability;
- test infrastructure starts changing production mechanics merely to become green.

A failed assumption is evidence. Fix the assumption or reduce scope; do not hide it with more systems.
