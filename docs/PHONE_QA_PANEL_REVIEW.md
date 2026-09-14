# Phone QA Panel — independent pre-implementation review

**Date:** 2026-09-14
**Verdict:** PASS WITH CONSTRAINTS

## Main risk

The dangerous implementation would mutate `VerticalSliceApp` progression state directly or create a parallel debug save format. That would make QA convenient while invalidating the exact persistence/progression path being tested.

## Required correction

Keep the panel outside the gameplay class. It should mutate only canonical `SaveStateV2`, flush the existing repository, and reload. Bootstrap then recreates the game from the same source of truth used on a normal launch.

This intentionally trades a tiny reload for substantially lower state-divergence risk.

## Specific checks

1. **Lowering rank:** do not silently delete completed recipes. Rank/XP and completion flags are independent QA controls.
2. **Completed recipe integrity:** accept only IDs from `ALL_VARIANTS` / `ALL_VARIANT_IDS`; never accept free-form IDs.
3. **Craft accounting:** when QA adds completions, keep `totalCrafts >= completedVariantIds.length` so the save remains internally sane.
4. **Writes:** await `write()` and `flush()` before reload; otherwise a queued write could race navigation.
5. **Reset:** route through `resetProgressSave()` rather than duplicating key deletion, preserving the migration-source/pending-write hardening already reviewed.
6. **UI collisions:** attach the launcher to the existing debug control strip, but render the panel as its own high-z-index fixed/absolute QA surface.
7. **Phone repetition:** preserve panel-open state in session storage so each mutation does not force the tester to reopen it.
8. **Release leakage:** document explicit removal/disablement before the Yandex release candidate.

## Scope judgement

Rank/XP and recipe completion controls are sufficient for the current Phase 6/7 phone gates. Stage skipping, shader sliders, arbitrary save editing, or craft auto-completion would expand this from a QA accelerator into a second toolchain and should not be added now.

## Final implementation contract

Implement exactly one temporary production QA module plus bootstrap plumbing. Do not change interaction constants, renderer code, progression formulas, save schema, or Collection behavior.
