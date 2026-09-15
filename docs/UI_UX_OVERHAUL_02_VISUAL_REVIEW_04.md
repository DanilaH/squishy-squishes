# UI/UX Overhaul 02 — Final Visual Review

**Status:** VISUALLY ACCEPTED FOR REAL-DEVICE REVIEW

**Evidence:** repeated production Chromium captures at 390×844, 844×390 and 1280×720, including a real pointer-driven craft through result, ownership and the post-collect next-toy state.

## Final verdict

The overhaul now reads as a toy-first squishy game rather than a dark utility/dashboard wrapped around a renderer.

Accepted player-facing hierarchy:

- the squishy is the dominant visual object;
- Choose has one obvious primary action and one shelf entry;
- the shelf reads as toys to own rather than recipe records to manage;
- locked toys remain visible and aspirational, with the lock demoted to secondary metadata;
- active craft removes progression/navigation chrome and uses short gesture-oriented verbs;
- Result keeps the finished toy, localized identity and one ownership action in focus;
- Collect is an ownership beat rather than an XP receipt;
- after Collect, the next available uncollected toy becomes the hero automatically.

## Screenshot-driven defects found and fixed

The visual gate caught defects that typecheck/build validation could not:

1. short-landscape select copy overlapped the hero;
2. a late CSS override made the recipe dock reappear during active craft;
3. the initial shelf still looked like a record list and exposed technical English names;
4. completed toys prioritised `Make again` over tactile revisit;
5. player-facing reset progress appeared in the child-facing shelf;
6. locked recipes appeared out of progression order and repeated unnecessary locked-state copy;
7. the initial paint silhouette was too faint on the bright shell;
8. the gesture cue taught above the toy rather than on the interaction object;
9. the first Collect composition stretched progression feedback into a large white receipt that obscured the toy;
10. the compact reward chip originally survived beyond Collect and covered the next Choose CTA.

Each issue was corrected without changing craft thresholds, renderer physics, shader behavior, catalog membership, XP values or save schema.

## Accepted ownership loop

Fresh-save standard craft now presents:

`Grape Cube → result / NEW → KEEP IT → YOURS + compact reward chip → Berry Heart / MAKE`

RU follows the same product grammar:

`Виноградный кубик → НОВЫЙ! → ЗАБРАТЬ → ТВОЙ! → Ягодное сердце / СДЕЛАТЬ`.

The reward chip is scoped to the ownership state and is hidden before the next Choose state. The next toy is selected from the existing progression snapshot; no new progression system was introduced.

## Remaining visual uncertainty

Desktop Chromium evidence is sufficient for structural acceptance, not taste acceptance on a real phone. The following remain intentionally manual:

- thumb reach and perceived control size;
- tactile comfort of paint/mix/mold on real touch input;
- actual device performance and thermal behavior;
- audio fatigue over several consecutive crafts;
- final aesthetic judgment for Mushroom, Paw, Jelly and Holo/Pearl results.

Do not reopen the shell from desktop preference alone. Convert real-device evidence into bounded follow-up patches.
