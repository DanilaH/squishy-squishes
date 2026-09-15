# Sandbox Pivot S1 — Implementation Review

**Phase:** S1 — Sandbox Core
**Branch:** `sandbox-pivot-s1-core`
**Base:** `main@b4bfcbe9aee5950be0d2af88a401bd3b56302bed`
**Final reviewed branch state:** `0d59f20e27edc00b7288d00be02d78085163a9b6`
**Verdict:** **PASS — ENGINEERING COMPLETE**

This review is intentionally narrower than a release sign-off. S1 proves the production sandbox lifecycle and its persistence contract. It does **not** claim real-phone/manual acceptance, S2 multi-slot library completion, store readiness or Yandex publication readiness.

---

## 1. What S1 actually changes

The normal player bootstrap is no longer recipe/rank-first. The production path is now:

`Shape → Free Paint → Mix-ins → Mix & Stretch → Finish → Save → Squeeze`

After reload, one saved custom toy opens as:

`Home → Squeeze / New Squishy`

S1 deliberately keeps the lifecycle to one authored toy. The V3 schema already uses a `library` envelope, but production writes exactly one toy until S2 proves multi-slot behavior.

Delivered:

- dedicated production `SandboxApp` rather than layering sandbox semantics into `VerticalSliceApp`;
- all six production shapes available immediately;
- free paint with multiple colors, three brush sizes, soft overlap, eraser, Undo and Clear;
- no paint coverage threshold;
- six procedural mix-in families without physical-particle simulation;
- existing real pointer-travel Mix/stretch interaction reused as a required tactile beat;
- Soft / Jelly / Holo finish selection;
- compact authored appearance persisted through SaveState V3;
- V2 → V3 migration;
- one saved toy reopens with shape, material, paint and mix-ins intact;
- restored toy uses the real generic squeeze/deformation surface;
- Yandex runtime lifecycle retained;
- post-loop interstitial request moved outside the Save → Squeeze ownership beat;
- responsive player shell for phone portrait, short landscape and desktop;
- permanent release browser coverage rewritten around the sandbox product contract.

Not delivered by S1:

- multi-slot personal library UI;
- deletion/replacement UX for multiple toys;
- decorative face/accessory system;
- ideas/recipes meta;
- humorous titles/meta progression;
- rewarded monetization;
- expressive accessory physics;
- real-device/manual acceptance.

Those remain later phases by design.

---

## 2. Architecture review

### PASS — product state is separated from the old recipe state machine

S1 introduces a dedicated sandbox state machine rather than trying to mutate the old recipe-first `VerticalSliceApp` into two incompatible products.

This is the correct cut because the old app owned assumptions that are no longer valid product rules:

- recipe identity;
- rank/XP gating;
- mold stage;
- recipe completion semantics;
- collection/revisit semantics.

The new player bootstrap therefore has one coherent product model instead of conditionals scattered through the old flow.

### PASS — renderer remains generic

The existing `SquishSurface` remains the single deformation/rendering surface. S1 does not add:

- per-shape render branches;
- bespoke deformation physics;
- bitmap-save rendering;
- recipe-specific material code;
- simulated physical mix-in particles.

Authored appearance is still an RGBA texture sampled in stable squishy UV space, so paint and mix-ins remain attached during deformation.

### PASS — pointer ownership is stage-bounded

Paint and Mix-ins author appearance while renderer deformation interaction is disabled. Mix and Squeeze enable the real renderer interaction.

This avoids competing pointer consumers and preserves the existing tactile deformation path instead of layering authoring gestures on top of squeeze physics.

### PASS — production does not depend on probe/debug code

The S0 probe remains a Pages-only regression surface. Production sandbox appearance logic lives under `src/sandbox/` and the Yandex verifier continues to exclude the appearance probe bundle.

---

## 3. Persistence review

### SaveState V3 contract

V3 stores authored squishies as the primary object rather than treating recipe completion as the main player state.

Important hard bounds are enforced during decode:

- max library capacity: **24**;
- unique saved-toy IDs;
- known production shape IDs only;
- known material IDs only;
- bounded IDs/strings;
- known historical recipe IDs only for migrated legacy metadata;
- max **96** appearance strokes;
- max **160** mix-in placements;
- max **1,024 chars** per compact stroke point payload.

Player authoring also refuses to append appearance data once the serialized appearance would exceed the established **6,000-byte target**.

### PASS — V2 migration is conservative

Migration intentionally creates:

- `library: []`;
- preserved known completed recipe IDs as legacy/meta data;
- preserved `totalCrafts`;
- no fabricated authored toy.

This is correct. A V2 recipe completion did not contain free-painted appearance, so inventing custom toys during migration would create false player data.

The V2 storage key is removed only after the migrated V3 repository has successfully written and flushed. If V3 persistence fails, the old key is not deliberately destroyed.

### PASS — S1 remains single-toy by construction

`saveSingleS1Squishy` replaces the V3 library contents with the newly saved toy. That is intentional S1 scope, not the final S2 library behavior.

The existing saved toy is not removed merely by choosing `NEW SQUISHY`; replacement occurs only after the player completes and saves another authored toy.

### Non-blocking S2 requirement

S1 proves the per-toy appearance budget and bounded V3 envelope, but does not pretend to prove the final eight-/24-slot payload because multi-slot persistence is not implemented yet.

S2 must measure real serialized V3 size with representative multi-slot libraries before raising the slot ceiling or monetizing extra slots.

---

## 4. Product-behavior review

### PASS — core content is open

All six existing production shapes are selectable with no rank requirement:

- Soft Square;
- Heart;
- Mochi;
- Peach;
- Mushroom;
- Paw.

The permanent browser test clicks every shape and verifies reachability rather than merely counting six buttons.

### PASS — painting is genuinely freeform

The player can continue with zero, little or extensive paint. There is no coverage/completion threshold.

Available authoring operations:

- six colors;
- three brush sizes;
- soft paint blending;
- soft eraser;
- Undo;
- Clear.

### PASS — mix-ins are lightweight authored appearance

Mix-ins are UV-space authored placements, not simulated bodies. This preserves the product value — visible combinations — without introducing hundreds-of-particles production burden.

Current reusable set:

- glitter;
- stars;
- foam;
- pearls;
- hearts;
- confetti.

### PASS — Mix still requires real movement

The Mix stage cannot be completed by a static hold or a test-only bypass. Progress accumulates real bounded pointer travel and the CTA remains disabled until the motion budget is met.

### PASS — ownership beat is preserved

Saving immediately enters Squeeze with the authored toy still present. The Yandex ad lifecycle does not insert an interstitial between Save and first ownership/squeeze interaction.

---

## 5. Permanent QA evidence

The permanent browser suite now protects the sandbox product contract rather than obsolete recipe-first selectors.

Final temporary branch gate using the same production command:

- workflow run: **34958564795**;
- command: `npm run qa:release`;
- result: **8 / 8 passed**.

It covers:

1. Pages production boot into Sandbox S1;
2. all six shapes reachable and ungated;
3. phone portrait containment;
4. phone landscape containment;
5. short desktop containment;
6. deterministic V2 → V3 migration without fabricated toy;
7. Yandex SDK lifecycle, RU copy, QA exclusion and settings persistence;
8. real authored Paw → paint → hearts → real Mix → Holo → Save V3 → reload → Squeeze flow;
9. preserved S0 appearance-probe regression.

Playwright reports eight tests because responsive containment is parameterized; the coverage bullets above describe the protected behaviors.

The full craft test uses real pointer/mouse input. It does not seed private app state, lower mechanics thresholds or expose test-only gameplay hooks.

The authored appearance in the full craft is asserted at or below the **6 KB** target before save.

---

## 6. Build / platform evidence

Final branch validation run:

- workflow run: **34958564679**;
- result: **success**.

Passed:

- strict TypeScript typecheck;
- Pages production build;
- Yandex production build;
- Yandex distribution verifier.

The Yandex build still excludes Pages-only probe/debug output.

The pinned shared kit remains unchanged:

`DanilaH/mini-games-kit@d17ba31fce2a71335dcc3095f772c3fdd87fe97b`

No shared-kit upgrade was needed to implement the pivot.

---

## 7. Visual review evidence

Production screenshot lifecycle was captured after the real authored flow at:

- phone portrait: Shape, Paint, Mix-ins, Mix, Finish, Squeeze, Home;
- phone landscape: Shape;
- desktop: Shape.

First review found one presentation issue: the squishy hero was too small relative to the available workbench.

A bounded scale correction increased the hero approximately 15–20% without changing renderer logic, mechanics, persistence or controls.

Second production visual capture:

- workflow run: **34958564725**;
- result: **success**;
- verdict: **PASS**.

Final visual judgment:

- toy remains the dominant object;
- phone portrait no longer feels under-scaled;
- short landscape keeps a readable object/action split;
- desktop reads as a game surface instead of a tiny demo widget;
- controls do not cover the interaction object;
- Holo Finish / Squeeze / Home provide a credible ownership payoff;
- the shell remains intentionally clean rather than filling empty space with dashboard chrome.

---

## 8. Independent final findings

### Blocking findings

**None.**

### Accepted debt / next-phase work

1. **Single saved toy only.** Correct for S1; S2 owns multi-slot library behavior.
2. **Full multi-slot V3 payload not measured.** Per-toy appearance is bounded now; S2 must measure real eight-/24-slot envelopes.
3. **No player delete/replace management UI yet.** S2.
4. **No identity/decor layer yet.** S3.
5. **Legacy recipe/meta fields remain in V3 for migration continuity.** They must not regain gating authority.
6. **Real-phone/manual touch acceptance is still outstanding.** Browser emulation and production screenshots do not substitute for physical-device acceptance.

---

## 9. Exit decision

S1 has answered its blocking product/engineering question:

> Can the existing WebGL/tactile foundation become a real open sandbox where a player authors one unique squishy, saves it compactly, reloads it and physically squeezes the same creation?

**Yes.**

S1 is therefore **engineering complete** and the next development phase may proceed to **S2 — Personal Library**.

This does **not** authorize claiming release readiness or Yandex publication readiness. Real-device acceptance remains an external/manual release gate, and S2 must prove multi-slot persistence before the library becomes the retention backbone.