# UI/UX Overhaul 02 — Independent Pre-Implementation Review

**Verdict:** PASS WITH HARD CONSTRAINTS

The research supports a structural redesign rather than another cosmetic override. The proposed direction is appropriate, but the implementation can easily fail by becoming either a prettier dashboard or an overdecorated generic kids game. The following constraints are required.

## 1. Judge the redesign from screenshots, not code structure

The primary failure mode is visual/interaction hierarchy, not TypeScript correctness.

Before PR:

- capture the real production build at 390×844 portrait, 844×390 landscape and 1280×720 desktop;
- capture at minimum Choose and All Squishies;
- inspect screenshots independently;
- iterate if the toy, primary CTA or available/locked hierarchy is unclear.

CI success alone is not acceptance evidence for this pass.

## 2. Do not touch the accepted tactile core

No changes in this pass to:

- `SquishSurface` physics;
- shaders;
- paint coverage thresholds;
- shake thresholds;
- Mix thresholds;
- Mold progression/decay;
- content registry or recipe IDs;
- XP/rank math;
- save schema;
- platform runtime.

If a visual redesign appears to require interaction tuning, separate that into a later evidence-backed patch.

## 3. Avoid “kids UI = rainbow UI”

The target is a polished toy product, not a preschool worksheet.

Use:

- warm/light surfaces;
- strong recipe accents;
- chunky geometry;
- playful depth;
- very clear action hierarchy.

Avoid:

- every card having a different saturated background;
- decorative stickers/icons with no semantic role;
- confetti everywhere;
- excessive gradients competing with material rendering;
- babyish typography.

The squishy itself should supply much of the colour.

## 4. The hero must beat the chrome

At Choose and Result, the rendered squishy must remain the largest and highest-salience element.

A redesign that adds a large shelf, progress header and bottom controls around the same-sized hero is still a dashboard.

The test is simple: blur/squint at the screenshot. The first shape recognised should be the squishy, not a panel.

## 5. Do not add a second recipe system

The existing canonical collection/progression snapshot remains the source of recipe availability.

- reuse `getCollectionSnapshot()`;
- reuse `renderRecipeThumbnail()` or the same canonical shape-boundary data;
- do not create a parallel curated UI registry;
- do not create a separate home carousel with duplicated unlock rules.

A compact home preview may be derived from the canonical snapshot, but it must remain a projection, not another state model.

## 6. Collection cards must become toys, not larger records

Simply increasing card height while retaining status text + metadata + two buttons is not the redesign.

Default card information should be:

- visual toy;
- short name;
- one strong state cue.

Material/filling names should not be required for understanding. If Jelly/Holo/Pearls are not visually recognisable in the thumbnail, improve the thumbnail cue rather than reintroducing metadata.

## 7. Locked content must be aspirational

Current low-opacity/desaturated cards communicate “disabled”.

The redesign should communicate “coming soon”:

- visible silhouette/shape;
- clear lock symbol;
- simple star/level requirement;
- enough colour/lighting to create curiosity without pretending it is available.

Do not completely hide future toys.

## 8. Keep child-facing text extremely short

The main interaction layer should never require sentence reading.

Prefer one verb:

- `РАСКРАСЬ`
- `ПОТРЯСИ`
- `ТЯНИ`
- `ЖМЯКАЙ`
- `ПОЖМЯКАЙ!`

Longer instructions may exist as secondary help/accessibility text but should not be visually dominant.

## 9. Touch targets need an explicit contract

Current 32–40 px controls are unacceptable for the new target.

For player-facing primary/secondary actions on phone:

- aim for 52 px minimum;
- primary CTA 58–64 px;
- icon-only controls still need a 48–52 px hit area;
- avoid adjacent small controls that require precision.

Debug/QA controls are exempt because they are not player-facing and are excluded from Yandex.

## 10. Keep the QA panel usable on Pages

The production Pages build remains our manual testing surface.

The new shell must not cover or make the QA launcher unreachable. It may visually coexist as a developer-only floating control.

Yandex QA exclusion must remain intact.

## 11. Browser QA should evolve with semantics, not be weakened

The existing release suite is valuable.

If selectors change:

- update tests to the new player-facing semantics;
- preserve the real fresh-save craft path;
- preserve 24-recipe coverage;
- preserve RU/Yandex lifecycle assertions;
- preserve mobile viewport containment checks.

Do not keep obsolete UI solely to satisfy existing selectors.

## 12. Gesture cues must remain presentation-only

A gesture animation is useful only if it explains the real mechanic.

- `pointer-events: none`;
- no hidden progress;
- no auto-completion;
- no fake cursor that implies a different gesture;
- preferably stop/fade after meaningful player input.

If implementing input-aware cue dismissal materially complicates the first slice, stage-based looping cues are acceptable initially.

## 13. Protect the reward beat from ads

`reveal → squeeze → collect/ownership` should feel continuous.

Do not trigger an interstitial between reveal and ownership acknowledgement. If the existing post-loop gate currently fires too early relative to the new presentation, move only the request boundary, not the ad policy itself.

## 14. Do not solve character attachment prematurely

Faces/decorations are a credible product opportunity, but they are not required to evaluate the new shell.

First prove whether:

- bigger toy rendering;
- stronger silhouettes;
- material cues;
- shelf presentation;
- unlock aspiration

are enough to make the catalog desirable.

Only then decide whether a reusable face/decal layer earns its complexity.

## 15. Use one bounded visual layer, then consolidate later

A new `ui-ux-overhaul-02.css` imported last is acceptable for rapid screenshot iteration.

However, do not indefinitely stack override files. Once the visual direction is accepted on phone, schedule a consolidation pass that folds obsolete `release.css` / `ui-ux-pass-01.css` rules into a coherent final stylesheet without changing behavior.

## Recommended implementation order

1. Choose state hierarchy.
2. Collection/toy shelf.
3. Screenshot review and correction.
4. Craft chrome + gesture cues.
5. Result/ownership.
6. Full responsive screenshot review.
7. Release Check + Browser QA.
8. Phone acceptance.

## Stop conditions

Stop and rethink if:

- the redesigned screenshot still looks like a dashboard;
- card metadata is required to distinguish recipes;
- the hero gets smaller to make room for UI;
- a new navigation architecture duplicates progression state;
- new content/characters are being added to hide weak shell design;
- touch controls remain compact to “fit everything”;
- desktop becomes the design target instead of phone portrait.

**Conclusion:** proceed. The project now needs a visual/product hierarchy reset more than it needs any new gameplay feature.
