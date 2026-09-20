# UI/UX Overhaul 02 — consolidated visual review (historical)

**Historical status:** visually accepted for real-device review in the earlier recipe-first game. This is **not** an approval or design specification for the later freeform sandbox/Studio v8.

## Evidence and progression

The four successive production Pages / Chromium passes used 390×844 portrait, 844×390 short landscape, 1280×720 desktop and finally a real pointer-driven craft through result, Collect and post-Collect Choose.

1. **Iteration 01 — direction passed, fixes required.** The light, toy-first shell improved over the dark dashboard, but RU exposed technical English names, the collection looked like records, completed-card primary actions favored replay over squeeze, short-landscape copy overlapped the hero, late CSS overrode `[hidden]` on the craft recipe dock, craft showed progression chrome, dots made a wallpaper-like background, and the Collect state was too brief.
2. **Iteration 02 — layout and localization improved.** Short names, shelf hierarchy, landscape separation and hidden craft chrome improved. Remaining fixes were to remove player-facing reset (retain only Pages QA), sort locked cards by existing rank without changing IDs/progression, remove repeated `СКОРО`, strengthen the first paint silhouette, attach the gesture cue to the toy, and reduce redundant top chrome.
3. **Iteration 03 — general shell accepted, Collect blocked.** Result had a clear finished-toy/NEW/KEEP hierarchy. A CSS positioning conflict stretched XP feedback into a white receipt over the toy. The required correction was a visible ownership beat with a compact reward chip, no full unlock list, a subordinate locked marker and next available uncollected toy selected after Collect from the existing snapshot.
4. **Iteration 04 — visually accepted for device review.** The final capture verified the toy-first hierarchy, a compact ownership chip limited to Collect and hidden before the next Choose CTA, secondary locked metadata and next-toy selection. The browser suite and production build did not change physics, craft thresholds, XP, canonical IDs or save schema to force this outcome.

**Historical example:** `Grape Cube → NEW → KEEP IT → YOURS / compact reward → Berry Heart / MAKE` (with localized RU presentation). This was the **superseded recipe-first product**, not today's Library → freeform maker loop.

## What remains useful today

Screenshot review catches overlaps, CSS `[hidden]` regressions and mis-prioritized touch actions that builds/typechecks miss. The squishy should remain the visual focus; mobile/short-landscape/desktop need separate real-browser evidence. A simulated Chromium pass does not establish thumb comfort, tactile response, phone thermals, audio fatigue or final art taste.

## Original four reviews (immutable pre-cleanup revision)

- [Review 01](https://github.com/DanilaH/squishy-squishes/blob/223c84339c7700b0ae0d53749be86d13fb56f30f/docs/UI_UX_OVERHAUL_02_VISUAL_REVIEW_01.md)
- [Review 02](https://github.com/DanilaH/squishy-squishes/blob/223c84339c7700b0ae0d53749be86d13fb56f30f/docs/UI_UX_OVERHAUL_02_VISUAL_REVIEW_02.md)
- [Review 03](https://github.com/DanilaH/squishy-squishes/blob/223c84339c7700b0ae0d53749be86d13fb56f30f/docs/UI_UX_OVERHAUL_02_VISUAL_REVIEW_03.md)
- [Final visual review](https://github.com/DanilaH/squishy-squishes/blob/223c84339c7700b0ae0d53749be86d13fb56f30f/docs/UI_UX_OVERHAUL_02_VISUAL_REVIEW_04.md)

For the full implementation scope and test evidence, see [`UI_UX_OVERHAUL_02_IMPLEMENTATION_REVIEW.md`](UI_UX_OVERHAUL_02_IMPLEMENTATION_REVIEW.md).
