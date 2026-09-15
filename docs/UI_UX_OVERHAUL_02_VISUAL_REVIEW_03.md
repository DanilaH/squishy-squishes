# UI/UX Overhaul 02 — Visual Review 03

**Evidence:** production Pages screenshots after iteration 03 plus a real end-to-end craft capture through `test` and `collect`.

**Verdict:** CHOOSE / SHELF / CRAFT / RESULT ACCEPTED AS DIRECTION; OWNERSHIP BEAT REQUIRED CORRECTION

Iteration 03 closed the remaining broad shell issues:

- Choose is toy-first in portrait and short landscape;
- the WebGL squishy is the dominant object rather than a dashboard illustration;
- player-facing reset/maintenance UI is gone from the shelf;
- locked recipes are ordered by existing unlock rank;
- repeated locked-state copy is removed;
- active craft removes progression/navigation chrome;
- the empty paint silhouette remains legible on the light playroom shell;
- the gesture cue is visually attached to the toy rather than to explanatory copy.

The real craft capture also validated the result state: the finished squishy, localized toy name, `NEW` ownership signal and one `KEEP / ЗАБРАТЬ` action form a clear hierarchy.

## Blocking defect found in Collect

The first Collect screenshot was not acceptable.

The progression feedback surface inherited both a top and bottom position from different CSS layers, stretching it into a large white receipt that obscured the squishy. More importantly, even without that CSS bug, repeating the complete XP / rank / unlock text in both the stage copy and a large feedback surface violates the toy-first product model.

Collect must be an ownership beat, not a report screen.

## Required ownership correction

- keep the just-finished squishy visible during the ownership beat;
- keep the primary stage message to `YOURS! / ТВОЙ!` plus one short ownership hint;
- reduce progression feedback to a compact chip such as `+100 · ★2 · NEW +3`;
- never list several unlocked recipe names across the hero scene;
- demote the locked-card padlock to secondary corner metadata so locked toys remain desirable;
- after the ownership beat, automatically select the next available uncollected recipe instead of returning to the same completed toy with `Again / Ещё раз` as the primary next experience.

The next-recipe behavior must use the existing collection/progression snapshot only. It must not add a new progression system, mutate canonical recipe order, change XP values, or alter save data.

## Final visual acceptance target

A fresh production capture must prove:

1. result remains toy-first;
2. collect keeps the squishy visible and uses only a compact reward chip;
3. locked shelf toys remain visible with a small secondary lock marker;
4. after collect timeout, Select presents the next available uncollected toy.

Only after this evidence is clean should the permanent Browser QA expectations be updated and the branch prepared for PR.
