# UI/UX Overhaul 02 — Visual Review 02

**Evidence:** production Pages screenshots at 390×844, 844×390 and 1280×720 after the first screenshot-driven corrections.

**Verdict:** STRONG DIRECTION / FINAL SHELL CORRECTIONS REQUIRED

Iteration 02 materially improved the product fit:

- phone portrait Choose reads as a toy game rather than a utility dashboard;
- the selected squishy is clearly the hero;
- RU presentation names remove technical English catalog leakage;
- short landscape no longer overlaps the hero and action cluster;
- active craft correctly hides the recipe dock and progression chrome;
- the collection now reads much closer to a shelf of toys than a list of records.

The pass is close enough to preserve the direction, but three issues remain before PR.

## Required correction 1 — remove maintenance UI from the child-facing shelf

`Сбросить прогресс` is a QA/maintenance capability, not a normal player action. It competes with the shelf title and risks destructive accidental taps.

Decision:

- hide it from the player-facing collection completely;
- retain progress reset through the Pages-only QA panel;
- do not remove/reset repository functionality itself.

## Required correction 2 — make locked progression read in the real order

Canonical recipe registry order is not the same as unlock order, so locked cards can show a ★3 recipe before a ★2 recipe within the same shape group. This weakens the “what comes next?” promise.

Decision:

- derive collection display order from existing `requiredRank` only;
- do not change canonical IDs, content registry or progression rules;
- sort recipes ascending by required rank for presentation.

The lock icon + ★ requirement already communicates the state. Repeating `СКОРО` on every locked card is unnecessary visual noise and should be hidden.

## Required correction 3 — make the first craft beat legible on the bright shell

The initial paint silhouette is too faint against the new light background, and the animated gesture cue currently floats above the squishy instead of teaching on the interaction object.

Decision:

- strengthen the existing paint-outline presentation with the selected palette accent;
- keep coverage math, brush radius and completion threshold unchanged;
- move the presentation-only gesture cue down onto/near the hero object;
- retain `pointer-events: none` and zero influence on progress.

## Additional cleanup

- remove the redundant top collection-count chip from the main game surface; collection progress remains visible inside the shelf;
- make the normal sound toggle visually icon-like while retaining accessible button text;
- preserve the clean landscape layout introduced in iteration 02.

## Iteration 03 acceptance target

The third production screenshot set should show:

- Choose: almost no system chrome beyond ★ progress and sound;
- Collection: no reset button, no repeated `СКОРО`, locked recipes ordered by ★ requirement;
- Craft: stronger visible empty paint silhouette and gesture cue visually connected to the toy;
- no regression in portrait, short landscape or desktop hierarchy.

If this passes, the next screenshot evidence must cover the end of a real craft (`test` and `collect`) before the overhaul can be considered structurally complete.
