# UI/UX Overhaul 02 — Toy-First Product Shell

**Status:** implementation spec
**Scope:** player-facing information architecture, visual hierarchy and non-tactile navigation/reward presentation.
**Preserve:** accepted craft mechanics, renderer, 24-recipe catalog, save model, progression math, platform lifecycle.

## Product sentence

> Pick a squishy you want, make it with simple tactile gestures, enjoy the reveal, squeeze it, add it to your shelf, and immediately want the next one.

The interface must communicate this sentence without requiring the player to understand “lab rank”, exact XP math, recipe metadata or a dashboard.

## Primary audience hypothesis

Design first for approximately ages 6–12 and touch devices, while remaining visually acceptable to teens/adults who arrive through Yandex recommendations.

Principles:

1. object before chrome;
2. gesture before explanation;
3. visual progress before numeric progress;
4. one important action at a time;
5. large touch targets;
6. reward gets screen time;
7. locked content should create desire, not look disabled/dead;
8. no toddler aesthetic and no generic rainbow overload.

## New information architecture

### A. Home / Choose state

The current `select` stage becomes a toy showcase, not a recipe dashboard.

Hierarchy:

1. selected squishy hero (largest object);
2. selected squishy name;
3. one large primary CTA: `СДЕЛАТЬ` / `MAKE`;
4. visible compact shelf strip showing nearby available/completed/locked recipes;
5. `Все сквиши` / collection entry;
6. compact level/star progress and sound/settings controls.

Remove from primary visual hierarchy:

- exact XP fraction;
- `Ранг лаборатории` wording;
- 24 discovery dots;
- material/filling metadata under the selected recipe;
- explanatory `Выбранный рецепт` labels.

Internal progression data remains unchanged.

### B. Full collection / Toy shelf

Promote collection from a management overlay into a visually dominant full-screen shelf.

Mobile target:

- 2 or 3 columns depending width;
- cards dominated by the squishy thumbnail;
- name up to two lines;
- no material/filling metadata in the default card;
- completed = colourful/owned;
- available = bright `NEW`/make state;
- locked = readable silhouette + lock + level/star requirement, not low-opacity grey mush.

Actions:

- available: `Сделать`;
- completed: primary `Жмякать`, secondary replay affordance `Ещё` / repeat icon;
- locked: no button, only visual requirement.

The collection should answer three questions instantly:

1. What do I already own?
2. What can I make right now?
3. What cool thing is coming next?

### C. Craft states

During active craft (`pour`, optional `add`, `mix`, `mold`):

- hide collection/progression chrome;
- keep only a small safe top row for home/pause + sound if needed;
- keep the squishy/workbench as the largest visual region;
- replace long stage copy with a short action word;
- show an animated gesture cue until meaningful interaction starts;
- use the existing progress data, but present it as a large playful progress pill/ring rather than a thin dashboard bar.

Working RU verbs:

- pour/paint: `РАСКРАСЬ`;
- add: `ПОТРЯСИ`;
- mix: `ТЯНИ`;
- mold: `ЖМЯКАЙ`;
- reveal: no instruction, only anticipation;
- test: `ПОЖМЯКАЙ!`.

EN equivalent:

- `PAINT`;
- `SHAKE`;
- `STRETCH`;
- `PRESS`;
- `SQUEEZE!`.

Longer copy may remain in visually secondary accessible help, but should not dominate the screen.

### D. Reveal / Result

Reveal becomes a dedicated reward composition.

Hierarchy:

1. full hero squishy;
2. `НОВЫЙ!` / tier cue if first completion;
3. recipe name;
4. direct squeeze prompt;
5. large `ЗАБРАТЬ` button after/alongside the tactile result;
6. no collection dashboard or XP text competing with the object.

For completed revisit:

- skip “new” framing;
- preserve free squeeze;
- clear return action.

### E. Collect / Ownership

Current ~520 ms auto-return is too brief.

New ownership beat:

- hold long enough to perceive collection addition;
- show compact visual reward: `+XP` may exist, but level-up/new-unlock is the hero information;
- if something unlocked, show one strong next-toy preview;
- then return to Choose or offer `СДЕЛАТЬ СЛЕДУЮЩИЙ` if the next recipe is immediately available.

Do not introduce currency, loot boxes, orders or shops.

## Navigation model

Player-facing top-level destinations:

- Choose / current toy;
- All Squishies / collection;
- Sound/settings.

No permanent nav bar is required. Use context-sensitive controls.

During craft, collection navigation is hidden to avoid accidental exits. If a home/back control is added, exiting an active craft must require a clear confirmation or preserve progress; do not allow accidental loss from a stray child tap.

## Visual direction

### Theme

**Soft toy workshop / playroom**, not dark sci-fi lab.

Base palette:

- warm cream / very pale sky background;
- white or lightly tinted UI surfaces;
- recipe accent colour used for CTA glow, shelf card frame and workspace halo;
- dark purple/navy typography rather than white-on-black everywhere.

Avoid:

- glassmorphism as the dominant language;
- tiny uppercase metadata;
- thin grey borders;
- excessive neon/rainbow gradients;
- corporate dashboard geometry.

### Shape language

- rounded, chunky controls;
- thick visual states;
- soft 2–3 layer shadow rather than subtle 1px outlines;
- primary CTA 56–64 px tall on phone;
- secondary touch targets minimum 52 px where practical;
- collection cards feel like toy packaging/shelf slots rather than database rows.

### Typography

No new font binary required for this pass.

Use a rounded system-first stack where supported (`ui-rounded`, rounded platform fallbacks, system sans). Short display labels can use heavier weight. Body/help copy remains highly legible.

## Gesture teaching

Add one reusable gesture-cue element driven by `data-stage`:

- paint: hand dot sweeps side-to-side over the squishy;
- add: shaker/hand rocks left-right;
- mix: hand drags outward and changes direction;
- mold: fingertip pulse appears over target region;
- test: short squeeze pulse.

Rules:

- cue is visual support, not the actual control;
- cue fades after meaningful interaction begins if implementation cost is low;
- cue never blocks pointer events;
- sound is not required to understand it.

## Progression presentation

Keep existing XP/rank math and save format.

Player-facing transform:

- `Ранг лаборатории 4` → `⭐ 4`;
- exact `50 / 100 XP` becomes hidden/secondary;
- show one simple progress fill toward the next star/level;
- collection completion remains `x / 24`, preferably attached to the shelf/collection entry;
- newly unlocked recipe preview is more important than the XP number that caused it.

No new ranks and no new economy.

## Recipe identity

Default card contents:

- reusable shape-derived visual thumbnail;
- recipe name;
- status state.

Hide by default:

- `Soft / Jelly / Holo` text;
- `Smooth / Foam / Pearl` text;
- palette name.

Those qualities must be visible in the thumbnail/render. If they are not visually readable, improve visual representation rather than adding metadata back as a crutch.

## Responsive contract

### Phone portrait — primary design target

- hero occupies roughly 45–55% of usable height on Choose/craft;
- primary CTA reachable near the lower thumb zone;
- no required player action smaller than 52 px tall/wide where practical;
- collection shelf 2–3 columns;
- text never needs horizontal marquee/ellipsis for the primary action.

### Phone landscape

- hero shifts to left/center;
- controls/actions form one compact right/bottom cluster;
- avoid vertical stacks that force scrolling during craft;
- collection may use 4–5 columns.

### Desktop

- preserve the same toy-first hierarchy; do not revert to dashboard density just because space exists;
- cap content width and keep the hero large;
- pointer hover is enhancement only, never required.

## Accessibility / child-readability

- important state must not rely on colour alone;
- button press state must be obvious;
- touch actions use familiar tap/drag gestures;
- sound cues have visual equivalents;
- locked state uses lock icon/shape + requirement, not only desaturation;
- avoid long all-caps sentences; all caps reserved for one-word action verbs/reward labels.

## Ads / platform contract

Preserve Yandex ad/lifecycle integration.

Change the emotional boundary:

`reveal → squeeze → collect/ownership` is protected reward space.

If fullscreen interstitial remains eligible after a completed loop, request it only after the ownership beat / transition away from the result, never between reveal and collecting the toy.

No ad UI should visually resemble a toy/reward card.

## Analytics to preserve/add

Preserve existing funnel events. Add/ensure events that can validate the redesign:

- choose screen shown;
- collection opened;
- recipe selected from shelf;
- locked recipe inspected (if interaction exists);
- craft started;
- each craft stage completed;
- result first squeeze;
- collect;
- next unlock shown;
- replay from completed recipe;
- squeeze revisit.

Post-launch questions:

1. Does collection open rate rise without hurting craft starts?
2. Does first craft completion improve?
3. Do users start a second craft more often?
4. Are completed toys revisited?
5. Does time-per-player improve without increasing confusion/drop-off?

## Explicit non-goals for Overhaul 02

- no new recipe/content count;
- no faces/decal system yet;
- no freeform creative mode yet;
- no shop/currency/orders;
- no mystery-box RNG;
- no renderer/physics rewrite;
- no new craft minigame;
- no save migration;
- no shared-kit upgrade.

## Implementation sequence

### Slice 1 — Choose + collection shelf

Rebuild select/home hierarchy and collection cards first. This is the largest IA correction and can be judged from screenshots without touching craft mechanics.

### Slice 2 — Craft chrome

Replace verbose stage presentation with short verbs + gesture cue + child-readable progress while preserving all existing handlers and thresholds.

### Slice 3 — Result + ownership

Strengthen result and collect choreography; show next unlock visually; protect reward beat from ads.

### Slice 4 — responsive / RU / EN / QA

Run production Chromium screenshots and existing release browser QA. Then perform real-device acceptance before Yandex DRAFT.

## Definition of done

Overhaul 02 is structurally successful when:

- a first-time player can identify the primary next action from every screen without reading a paragraph;
- selected/finished squishy is the largest and most salient object;
- collection reads as a toy shelf, not a list of records;
- locked recipes create aspiration;
- craft chrome does not compete with tactile interaction;
- all primary mobile targets meet the new size contract;
- RU/EN fit phone portrait/landscape;
- existing craft mechanics, save compatibility and release/browser QA remain green;
- manual phone review says the product finally feels like a kids-oriented squishy game rather than a polished prototype tool.
