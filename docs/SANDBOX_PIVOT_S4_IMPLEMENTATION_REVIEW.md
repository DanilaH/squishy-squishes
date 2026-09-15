# Sandbox Pivot S4 — Final Implementation Review

**Status:** PASS / ENGINEERING COMPLETE
**Base:** `main@87855d4c0483e9b0ccdc38130d0fde88a0ee3eeb`
**Scope:** optional Ideas / Recipes + humorous titles
**External release gate:** physical-phone/manual touch acceptance remains outstanding

## Verdict

S4 is ready to merge from an engineering and production-browser perspective.

The implementation stays inside the sandbox-first product thesis: Ideas provide optional inspiration and lightweight meta progress, while the Library and `New Squishy` remain the primary product path. No Idea, completion count or title controls access to shapes, paint, mix-ins, materials, Decor, saving or squeezing.

## What shipped

- 24 optional Ideas derived from the existing canonical variant IDs and metadata;
- explicit palette → sandbox paint-color translation;
- explicit filling → sandbox mix-in translation (`smooth → none required`, `beads → foam`, `pearls → pearls`);
- metadata-only matching over final `SandboxDraft`;
- the existing `SandboxApp` reused for Idea mode, with only the suggested shape preselected as a starting state;
- successful-save-only completion persisted through existing SaveState V3 `completedRecipeIds`;
- idempotent completion with no duplicate credit;
- no Idea ID persisted on `SavedSquishy`;
- humorous titles derived from distinct completed-Idea count rather than persisted rank/XP;
- Library status + secondary Ideas action;
- responsive Ideas cards with authored-color shape previews, material/mix-in cues and completed state;
- non-blocking active-Idea guidance during creation;
- a small completion beat that replaces the active guide after a matching save without delaying the first Squeeze ownership state.

## Architecture review

The final ownership boundaries remain clean:

- `src/sandbox/ideas.ts` owns Idea derivation, localization metadata and pure matching;
- `src/sandbox/titles.ts` owns pure count → title derivation;
- `src/platform/saveV3Ideas.ts` owns bounded/idempotent completion mutation;
- `SandboxLibraryApp` owns Ideas navigation, active Idea context and presentation;
- `SandboxApp` remains the single maker and receives only an optional initial shape;
- `bootstrap.ts` owns transactional completion at the same persistence boundary as the saved toy.

No SaveState V4, second maker, recipe-specific renderer branch, title persistence, currency, shop, ad gate or S5 reward system was introduced.

## Completion semantics

An Idea completes only when a successfully saved draft matches all required metadata:

- exact target shape;
- at least one paint-mode stroke using the target sandbox color;
- exact target material;
- required mapped mix-in when one exists.

`smooth` means no mix-in is required; it does not forbid extra creative mix-ins. Decor remains optional. This keeps Ideas suggestive rather than task-gating.

## Visual acceptance

Final production capture run **34988213046** passed. The final artifact set was inspected at phone portrait, short landscape and desktop sizes.

Accepted states include:

- Library with playful derived title while `New Squishy` remains primary;
- Ideas grid with completed and incomplete cards together;
- active Idea guidance that no longer overlaps the maker heading/subtitle or blocks controls;
- matching-save completion notice that stays subordinate to the authored squishy;
- four-column short-landscape Ideas layout with no horizontal overflow;
- desktop Ideas layout that reads as an inspiration gallery rather than a dense recipe dashboard.

The visual pass caught and rejected two intermediate designs before the accepted state: an overly spreadsheet-like card treatment, then an Idea guide placement that crowded/interfered with the maker. Neither rejected state is part of the final implementation.

## Clean-tree QA evidence

Final cleanup validation run **34988760225** passed end-to-end after removing temporary S4 workflows, patch scripts, screenshot transport and the visual-only Playwright spec.

Validated on the clean implementation tree:

- `git diff --check` — PASS;
- TypeScript typecheck — PASS;
- Pages production build — PASS;
- Yandex production build — PASS;
- Yandex dist verifier — PASS (`3 files`, `225574 bytes` in that run);
- Browser release suite — **27 / 27 PASS**.

The permanent Browser QA proves:

- ordinary sandbox remains usable without touching Ideas;
- all 24 Ideas are reachable and navigation returns safely to Library;
- all six shapes remain enabled in Idea mode;
- choosing a different shape still saves normally and awards no false completion;
- completion occurs only after a matching successful save;
- completion persists after reload;
- repeating a completed Idea does not duplicate credit;
- title thresholds are deterministic at 0/2/5/8/12/16/20/24;
- migrated/completed credit feeds the derived Library title;
- phone portrait, short landscape and desktop Ideas surfaces remain horizontally contained;
- previous S0–S3 and Yandex regressions remain green.

A cleanup-only `package-lock.json` generated by `npm install` in CI was removed afterward because the repository did not previously track one; it was environment churn, not an S4 product dependency change.

## Final diff review

After cleanup, the branch contains only permanent S4 product/docs/QA changes relative to `main`:

- S4 specification + reviews and roadmap update;
- Idea/title domain modules;
- Save V3 Idea completion helper;
- additive Library/bootstrap/maker integration;
- Ideas presentation CSS;
- permanent `s4-ideas.spec.ts` regression coverage.

No temporary S4 workflows, patch scripts, screenshot artifacts, review transport files or visual-only test remain.

## Remaining external gate

Browser automation and screenshot review do not prove physical-device touch feel, browser chrome behavior, thermal behavior, real audio output or Yandex portal runtime on an actual phone.

Those remain release/moderation gates and are not being relabeled as completed by S4.

## Decision

**PASS / ENGINEERING COMPLETE.** Proceed to PR → permanent CI → merge. The next development phase is S5 rewarded monetization, subject to its own scope review and without weakening the free sandbox/library loop.
