# Interaction Pass 02 — micro-minigame craft beats

Date: 2026-09-14

## Goal

Improve the existing one-shape Vertical Slice 01 without expanding product scope. The craft should stop reading as a sequence of progress meters and instead ask for a different, tiny tactile action at each production beat.

Canonical loop remains:

```text
select
→ pour base
→ optional Foam Beads
→ mix / knead
→ form / mold
→ reveal
→ free squeeze
→ collect
```

This pass changes only the interaction grammar inside `pour`, `add`, `mix`, and `mold`. Reveal, result squeeze, collection, recipe count, progression, persistence, renderer architecture, and product scope stay unchanged.

## Requirements

### 1. Base pour — hold

- Keep the existing simple hold-to-pour interaction.
- Holding advances the fill and the material visibly fills bottom-up.
- Releasing early pauses the stage; progress is preserved.
- When full, the player releases to continue.
- Do not add aiming, failure, spill simulation, or fluid physics.

### 2. Foam Beads — shake to scatter

- Foam Beads must no longer read as one continuous bead stream.
- Replace the add-stage single-stream presentation with a small shaker and multiple visible falling bead cues.
- Input is a pointer/touch shake gesture: hold and move rapidly side-to-side or around the screen.
- A static hold contributes zero meaningful progress.
- Fast travel and direction reversals contribute more than slow dragging.
- As progress rises, new beads appear at stable random positions across the squishy rather than the entire bead layer merely fading in.
- No device-motion permission, gyroscope dependency, particle physics, or per-bead DOM spawning.
- Stage should normally take roughly 2–4 seconds of active shaking.

### 3. Mix — stretch, do not hold

- Reuse the proven real squish interaction.
- Progress only while the player is actively moving a meaningfully stretched/deformed squishy.
- A stationary press/hold must not be able to finish the stage.
- The player may pull in any direction; no prescribed gesture sequence.
- When the meter reaches full, releasing the squishy completes the stage.
- No additional overlay minigame or separate fake object.

### 4. Mold — tap moving pressure targets

- Replace push-and-hold molding with one visible pressure target at a time on top of the squishy.
- Tapping the active target increases mold progress.
- After a successful hit, the next target appears at a materially different random location.
- An unhit target relocates after a short beat so the stage has rhythm without a hard fail state.
- Mold progress continuously decays a little while the stage is active.
- Decay is the only pressure mechanic: no lives, combo loss, score, miss penalty, or failure screen.
- The existing rendered mold deformation tracks the same progress meter.
- Target size must remain comfortable on touch screens.
- Expected completion is roughly 7–9 successful taps depending on pace.

## Interaction and UX constraints

- Each beat must remain learnable from one short instruction line.
- No stage may require precision that is hostile to mobile touch.
- No stage may introduce a fail/restart loop.
- Active craft stages should stay short enough that repetition is still desirable.
- Sound ownership remains in `SquishyAudio`; reuse existing pour/tactile/stage-complete sounds for this pass.
- Hidden-tab / visibility changes must cancel held input and must not let timers silently finish a stage.
- Smooth recipes still skip Foam Beads entirely.

## Independent review

The requested direction is good, but four implementation choices are deliberately constrained after review:

1. **“Shake” is implemented as a pointer/touch shake, not physical phone motion.** DeviceMotion would add permission/browser variance, break desktop parity, and create test friction without proving more product value.
2. **Foam distribution stays shader-driven.** Spawning real DOM/physics beads for every shake would increase production and performance cost. Stable random reveal order in UV space gives the desired scattered read while still deforming with the squishy.
3. **Mix uses the accepted renderer rather than a new minigame layer.** The weakness is semantic progress, not the tactile core. Requiring motion + meaningful deformation fixes the stage without duplicating interaction systems.
4. **Mold targets create tempo but not punishment.** A relocating target plus gentle meter decay gives urgency. Timed failure, misses, lives, scores, or combos would make a short comfort loop unnecessarily demanding.

These choices preserve the project's asymmetric advantage: low implementation burden, strong tactile differentiation, and a fast repeatable loop.

## Acceptance checks

- `npm run build` is green.
- Smooth recipe: `select → pour → mix → mold → reveal → test → collect` still works.
- Foam recipe includes the add stage and cannot complete it by holding still.
- Add-stage presentation has no single continuous bead stream.
- Foam beads visibly populate different spatial cells as shake progress rises.
- Mix cannot complete from a stationary press; active stretch/motion is required.
- Mold shows one touch target, target positions change, meter visibly decays, and completion still reaches reveal.
- Leaving the tab while holding does not leave stale pour/bead audio or stale captured input.
- Mold target timer resumes safely after returning to the tab.
- Desktop pointer and mobile touch use the same interaction contract.

## Explicitly out of scope

- second shape;
- XP / rank / economy;
- new recipe catalog;
- final collection UI;
- ads / Yandex SDK;
- gyro / DeviceMotion;
- fluid or particle simulation;
- new framework or engine;
- reveal/test/collect redesign.
