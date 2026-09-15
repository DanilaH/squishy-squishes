# Sandbox Pivot S4 — Ideas / Recipes + Humorous Titles

**Status:** implementation specification
**Base:** `main@87855d4c0483e9b0ccdc38130d0fde88a0ee3eeb`
**Product role:** optional inspiration + light meta only

## Goal

Add a lightweight Ideas layer on top of the existing sandbox without restoring recipe-gated progression.

Target loop:

`Library → Ideas (optional) → same Maker → Save → Idea completion (if matched) → Library`

Core sandbox remains unchanged and fully usable without Ideas.

## Non-negotiable product rules

- Ideas never lock shapes, paint colors, mix-ins, materials, Decor, saving or squeezing.
- Starting an Idea must reuse `SandboxApp`; no second crafting implementation.
- A player may deviate from an Idea and still save normally.
- Completion is metadata-based, not image/pixel recognition.
- Exact XP is not exposed. Titles derive from distinct completed Ideas only.
- No currency, shop, streak, daily system, loot, ad gate or reward economy in S4.
- Existing SaveState V3 remains the persistence boundary; no V4.

## S4 MVP content

Use the existing 24 canonical variant IDs as stable Idea IDs and source material, but translate them into sandbox-native requirements.

Each Idea has:

- stable `id` equal to the canonical variant ID;
- EN/RU display name;
- required shape;
- suggested target paint color from the six current sandbox swatches;
- required material;
- optional required mix-in when legacy filling maps cleanly to one (`beads → foam`, `pearls → pearls`);
- a compact visual card/checklist.

`smooth` filling produces no required mix-in. The Idea should never require the absence of mix-ins.

Palette → sandbox paint mapping is explicit and stable:

- grape → `0xd58cff`
- strawberry → `0xff79a8`
- lime → `0x92df83`
- aqua → `0x63e6e2`
- peach → `0xffa46f`
- milk → `0xffdc70`
- prism → `0xd58cff` for S4 MVP; material `holo` carries the prism identity.

## Completion contract

An Idea completes on successful save only when all required metadata match:

- saved `shapeId` equals target shape;
- saved `materialId` equals target material;
- at least one paint stroke uses the target color in paint mode (`m === 0`);
- if the Idea requires a mix-in, at least one persisted placement resolves to that mix-in ID.

Decor is deliberately not required in S4 MVP. It may be shown as optional inspiration later, but completion must not become fragile merely because S3 exists.

Completion is idempotent: the same Idea can be recreated indefinitely, but its ID appears only once in `completedRecipeIds`.

## Persistence

Keep SaveState V3.

`completedRecipeIds` remains the canonical completed-Idea set. Existing V2→V3 migration credit therefore remains useful and does not need another migration.

Add one bounded state helper:

`completeRecipeIdea(state, ideaId, updatedAt?)`

Rules:

- unknown IDs rejected;
- duplicate completion returns an equivalent state without duplicating the ID;
- library semantics and `totalCrafts` remain independent.

The saved squishy does not need to store `ideaId`; completion is awarded transactionally during the same save operation using the active Idea context and the final `SandboxDraft`.

## Domain modules

Add `src/sandbox/ideas.ts` for:

- idea definitions derived from existing canonical variants;
- palette→sandbox-color mapping;
- filling→mix-in mapping;
- localized labels;
- `matchIdea(draft, idea)`;
- completed-count/title derivation helpers or a separate `titles.ts` if separation improves clarity.

Prefer a separate `src/sandbox/titles.ts` for the title ladder.

`SandboxApp` receives an optional read-only Idea context and renders only a lightweight checklist/status layer. It does not own completion persistence.

`SandboxLibraryApp` owns Library ↔ Ideas navigation and passes the selected Idea into the same maker.

`bootstrap.ts` owns completion persistence because it already owns SaveState V3 writes.

## Ideas UI

Library gains one secondary `IDEAS` / `ИДЕИ` action near the heading/status area, never more prominent than `NEW SQUISHY`.

Ideas screen:

- same visual language as Library;
- title + current humorous status;
- progress as `N / 24 ideas`, not XP;
- 24 compact cards in a responsive grid;
- completed cards visibly marked;
- card displays shape, target color, material and optional mix-in cue;
- tapping a card starts the ordinary maker with that Idea active;
- clear Back to Library.

No dashboard chrome, sorting, filters or tabs in S4.

## Maker guidance

When an Idea is active, show one compact non-blocking goal strip above/below the stage copy:

- Idea name;
- checklist items relevant to current/final state;
- completed/missing state may update live from the draft;
- no disabled controls;
- no forced navigation;
- no modal failure if the result does not match.

On successful matching save, briefly surface a completion beat and derived title if it changed, but do not delay first Squeeze materially.

For S4 MVP, a compact status line/data attribute is sufficient if a larger celebration harms the ownership beat.

## Humorous titles

Titles derive only from count of distinct completed Ideas.

Thresholds for 24 Ideas:

- 0: `Новичок` / `Rookie`
- 2: `Молодой сквишер` / `Young Squisher`
- 5: `Жмякатель` / `Squisher`
- 8: `Сквиш-стилист` / `Squishy Stylist`
- 12: `Крутой сквишер` / `Cool Squisher`
- 16: `Сквишер-могер` / `Squish Mogul`
- 20: `Мастер жмяка` / `Squish Master`
- 24: `Верховный сквишер` / `Supreme Squisher`

The exact jokes are content, not access control. No title may affect availability.

## QA requirements

Permanent Browser QA must prove at least:

1. ordinary `New Squishy` still works with zero Ideas interaction;
2. Ideas screen exposes all 24 Ideas and returns to Library;
3. starting an Idea enters the same maker and preselects the required shape only as a starting state, without disabling alternatives;
4. non-matching save succeeds normally and does not complete the Idea;
5. matching save completes exactly one stable ID;
6. repeating the same Idea does not duplicate completion;
7. title thresholds derive correctly at 0/2/5/8/12/16/20/24;
8. completion survives reload;
9. migrated/completed IDs still decode through bounded V3 rules;
10. all six shapes remain available in Idea mode;
11. phone portrait, short landscape and desktop Ideas UI remain contained;
12. Yandex lifecycle/build verification and previous S0–S3 regressions remain green.

Use real UI actions and persisted readback. Do not inject completion when claiming UI completion.

## Visual acceptance

Capture and inspect:

- empty/low-progress Library with title + Ideas secondary action;
- Ideas grid on phone;
- completed + incomplete Idea cards together;
- active Idea guidance during maker;
- post-save matched Idea / first Squeeze ownership beat;
- short-landscape Ideas screen;
- desktop Ideas screen.

Acceptance criteria:

- `New Squishy` remains primary;
- Ideas feel inspirational, not mandatory progression;
- cards are legible without becoming tiny spreadsheet tiles;
- title reads as playful status, not rank gate;
- Idea guidance does not crowd the tactile toy;
- completion state is clear but not louder than the authored squishy.

## Stop / reassess conditions

Stop if S4 requires:

- restoring rank/XP unlock checks;
- a second maker implementation;
- storing screenshots or rendered images for Ideas;
- pixel/color coverage recognition;
- shape-specific renderer changes;
- SaveState V4 solely for Ideas;
- mandatory Decor criteria to make legacy recipes fit;
- large recipe dashboard architecture;
- ad/reward economy work before S5;
- UI that makes the sandbox feel gated or task-driven.

## Implementation order

1. domain + title derivation + pure matching tests;
2. bounded Save V3 completion helper;
3. Library title + Ideas navigation;
4. Ideas screen/cards;
5. same-maker Idea context + lightweight guidance;
6. transactional completion on successful save;
7. permanent Browser QA + payload/regression checks;
8. visual review;
9. cleanup + independent final diff review;
10. PR → green CI → merge → Pages verify.
