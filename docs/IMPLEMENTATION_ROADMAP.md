# Squishy Squishes — Implementation Roadmap

**Status:** UI/UX OVERHAUL 02 ENGINEERING COMPLETE / REAL-DEVICE PRODUCT ACCEPTANCE
**Current gate:** merge/deploy the validated toy-first shell, then perform hands-on phone feel / visual / audio / performance review
**Catalog target:** 6 production shapes / 24 canonical recipes — ENGINEERING COMPLETE

The repository now has a stable tactile core, reproducible Pages/Yandex release pipeline, permanent production-browser QA and a screenshot-reviewed toy-first product shell. Automation has reached the point where the remaining high-value evidence must come from an actual phone: thumb comfort, tactile feel, aesthetic taste, audio fatigue and device performance.

Do not interpret this gate as permission to add more catalog or systems. Any issue found now should become a bounded evidence-driven product patch.

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

### 7B — Mushroom + Paw — ENGINEERING COMPLETE / REAL-DEVICE ACCEPTANCE PENDING

Added Mushroom + Paw and four curated recipes with zero new palettes/materials/fillings and no renderer/shader/physics/audio/save changes.

Result:

- **6 production shapes**;
- **24 canonical recipes**.

Manual phone inspection of Mushroom/Paw is part of the current real-device product gate.

**Catalog freeze:** do not automatically add Blob Creature, more recipes, new finishes or new gameplay systems before release evidence.

Canonical docs: `CATALOG_PRODUCTION_7A*.md`, `CATALOG_PRODUCTION_7B*.md`.

---

## RC01 — Release infrastructure / platform hardening — COMPLETE

RC01 established a reproducible shipping foundation:

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

## UI/UX Pass 01 — Recipe-first shell — SUPERSEDED BY OVERHAUL 02

This pass removed the old Shape / Color / Texture builder and proved that the 24 canonical recipes could be browsed from the existing Collection surface without creating a second catalog.

Its information architecture and dark lab presentation were later judged insufficient for the target product/audience. Preserve its useful architectural decisions — canonical recipe browser, shared geometry thumbnails, completed revisit path — but treat Overhaul 02 as the current player-facing design.

Canonical docs: `UI_UX_PASS_01*.md`.

---

## Feel / Art / Audio Pass 01 — ENGINEERING COMPLETE / REAL-DEVICE ACCEPTANCE PENDING

Delivered a bounded cosmetic reward hierarchy without changing gameplay semantics:

- reusable `standard | special | showcase` presentation tiers derived only from existing material/filling choices;
- reveal anticipation/environment/halo/result settle choreography;
- tier-sensitive reveal/collect WebAudio contours;
- showcase results gain richness through layering rather than simply higher volume;
- deterministic stage-complete tone variation to reduce repetition fatigue;
- shader, renderer, spring physics, tactile squeeze, catalog, progression and save unchanged.

The toy-first shell now composes around these reward mechanics. Audio fatigue and material taste remain part of real-device acceptance.

Canonical docs: `FEEL_ART_AUDIO_PASS_01*.md`.

---

## Release QA 01 — ENGINEERING COMPLETE

Release QA established permanent real-browser production validation against actual `dist` and `dist-yandex` artifacts.

Core coverage includes:

- Pages and Yandex production boot;
- phone portrait, phone landscape and short-desktop containment;
- Yandex RU locale and QA exclusion;
- LoadingAPI / GameplayAPI lifecycle;
- settings persistence;
- one complete fresh-save craft through real pointer-driven paint, WebGL Mix, mold, reveal and Collect;
- collection persistence after reload.

No hidden stage-completion API, save seeding, private app-state mutation, gameplay threshold reduction or test-only production path was introduced.

`Release Browser QA` remains a permanent CI workflow on PRs to `main` and pushes to `main`, separate from the faster `Release Check` packaging workflow.

Canonical docs: `RELEASE_QA_01*.md`.

---

## UI/UX Overhaul 02 — TOY-FIRST PRODUCT SHELL — ENGINEERING COMPLETE

Overhaul 02 was triggered by competitor/audience research and direct visual evidence that the previous interface still behaved like a polished utility/dashboard rather than a kids-oriented tactile toy.

### Product model

Working audience hypothesis: approximately ages **6–12**, touch-first and low-reading-dependency, while remaining visually acceptable to teens/adults arriving through Yandex recommendations.

New player-facing loop:

`desired squishy → one clear action → tactile craft → big reveal → squeeze → ownership → next desired squishy`

Principles:

- object before chrome;
- gesture before explanation;
- one important action at a time;
- visual progress before exact numeric progress;
- large touch targets;
- reward gets screen time;
- locked content creates desire rather than looking dead;
- no toddler aesthetic or generic rainbow overload.

### Delivered shell

- light soft-toy workshop/playroom replaces the dark lab as the player-facing visual language;
- WebGL squishy is the dominant visual object;
- Choose reduces to localized toy identity, `MAKE / СДЕЛАТЬ`, `All squishies / Все сквиши`, compact star progress and sound;
- exact XP and technical material/filling metadata leave the primary hierarchy;
- all 24 recipes keep their canonical IDs but receive short RU/EN presentation names;
- Collection becomes a toy shelf, reusing the existing canonical collection snapshot rather than creating a second catalog;
- cards sort by existing required rank for an understandable coming-next sequence;
- locked toys stay visible with secondary lock/star metadata;
- player-facing destructive progress reset is removed from the shelf and remains available through Pages QA;
- completed toys prioritise tactile `Squeeze / Жмякать`, with replay secondary;
- active craft removes progression/navigation chrome and uses short verbs plus presentation-only gesture cues;
- result remains focused on the finished toy and one ownership action;
- Collect is a perceived ownership beat with a compact reward chip rather than an XP receipt;
- reward feedback is scoped to Collect and cannot overlap the next Choose CTA;
- after ownership, the next currently available uncollected recipe becomes the hero automatically using the existing progression snapshot.

### Screenshot-driven review

Repeated production Chromium captures at **390×844**, **844×390** and **1280×720** were used as an explicit visual gate. The review caught and corrected landscape overlap, hidden-surface CSS regression, technical naming leakage, weak paint silhouette, maintenance UI in the shelf, incorrect locked ordering, oversized Collect receipt behavior and reward feedback leaking into the next CTA.

Final visual evidence accepts:

`Choose → Shelf → Craft → Result → Ownership → Next toy`.

Canonical docs:

- `UI_UX_OVERHAUL_02.md`;
- `UI_UX_OVERHAUL_02_RESEARCH.md`;
- `UI_UX_OVERHAUL_02_REVIEW.md`;
- `UI_UX_OVERHAUL_02_VISUAL_REVIEW_01..04.md`;
- `UI_UX_OVERHAUL_02_IMPLEMENTATION_REVIEW.md`.

### Permanent QA contract after Overhaul 02

The production Browser QA now protects product invariants as well as integration:

- toy-first Choose + 24-card shelf;
- player-facing reset hidden;
- shelf ordering follows required rank;
- active craft hides recipe/navigation chrome;
- Yandex lifecycle/locale/settings remain correct;
- real full craft still uses production pointer handlers;
- ownership reward exists only during Collect;
- first completion advances the hero to the next available uncollected toy;
- completed-card action priority is `Squeeze`, then `Again`;
- collection persistence survives reload.

Branch validation run **34942213823** passed strict TypeScript, Pages build, Yandex build/verifier and **6/6 Chromium tests**.

### Explicitly not added

- no faces/decal system yet;
- no new recipes/shapes;
- no currency/shop/orders;
- no mystery-box RNG;
- no new craft minigame;
- no renderer/physics rewrite;
- no save migration;
- no shared-kit upgrade.

Faces/decor may be tested later only if real-device/post-launch evidence says stronger character identity is needed after the shell itself is accepted.

---

## Real-device product acceptance — CURRENT HARD GATE

Automation and desktop visual review are complete enough. The next evidence must come from an actual phone running the deployed Overhaul 02 Pages build.

Use the Pages-only QA panel for fast representative seeding. The player-facing shelf itself must remain free of reset/debug controls.

Representative acceptance matrix:

1. **Phone portrait + landscape shell**
   - hero, toy name and primary CTA feel obvious without reading instructions;
   - `Все сквиши` shelf is comfortable to browse and cards feel tappable;
   - controls remain easy to reach;
   - no meaningful clipping/overlap or accidental browser scrolling.

2. **Fresh first craft / repeat desire**
   - short action verbs and gesture cues teach the loop adequately;
   - Result feels rewarding;
   - `ТВОЙ!` ownership beat is perceptible but not slow;
   - next uncollected toy appearing after Collect creates a clear reason to continue.

3. **Mushroom full Make**
   - silhouette reads immediately;
   - paint/mix/mold work naturally on the shape;
   - result does not look like a broken generic mask.

4. **Paw full Make**
   - toes/palm remain readable during deformation;
   - interaction does not expose awkward boundary artifacts.

5. **Representative Jelly recipe**
   - material remains dense/readable rather than washed out;
   - reveal tier feels meaningfully richer than standard without visual noise.

6. **Representative Holo + Pearl recipe**
   - showcase reveal/settle/ownership feels premium;
   - holo remains broad/stable rather than flickery rainbow noise;
   - pearls stay readable through deformation.

7. **Three to five consecutive crafts with sound enabled**
   - stage-complete sounds do not become irritating;
   - reveal/collect hierarchy is noticeable but not obnoxious;
   - tactile audio remains pleasant under repetition.

8. **Real-phone performance / thermal feel**
   - no obvious frame collapse during Mix or showcase reveal;
   - no escalating stutter after several loops;
   - no concerning thermal/battery behavior during a short session.

**Exit condition:** owner hands-on acceptance or a concrete defect list converted into bounded product patches.

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
- shelf opens / recipe selections;
- second-craft start rate after ownership;
- recipe/shape engagement;
- completed-toy squeeze revisits;
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
