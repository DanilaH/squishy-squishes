# Interaction Pass 03 — paint the base + corrective tuning

Date: 2026-09-14

## Goal

Keep the existing compact production loop, but make the first craft beat active instead of a hold-to-wait step and fix the two correctness issues found during the independent review of Interaction Pass 02.

Canonical loop after this pass:

```text
select
→ spread / paint base
→ optional Foam Beads shake
→ stretch to mix
→ tap mold targets
→ reveal
→ free squeeze
→ collect
```

This pass must not add economy, failure states, extra recipes, new shapes, or a new engine.

## Requirements

### 1. First craft step — paint / spread the base

- Replace hold-to-fill with a coverage interaction over the squishy silhouette.
- The player presses and drags across the squishy; only newly covered area advances progress.
- A stationary hold contributes no ongoing progress.
- Repainting already covered area contributes little or no new progress.
- Use a forgiving brush footprint and complete at roughly 82% coverage so the player does not have to scrub exact edges.
- The unpainted silhouette remains faintly visible as a guide.
- Painted areas visibly use the selected recipe color and accumulate continuously under the pointer.
- Completion is automatic once the coverage threshold is reached; no extra release gate.
- Target active duration: roughly 2–4 seconds.
- No fluid simulation, spill mechanic, precision tracing, fail state, or edge penalty.

### 2. Foam Beads corrective pass

- Foam reveal must be linear with actual shake progress, not eased toward completion early.
- A static pointer-down must not start the visual falling-bead animation.
- Falling-bead animation and bead sound start only after qualifying movement is detected.
- Keep the stable random UV-cell reveal pattern already implemented in the shader.
- Keep pointer/touch shake; do not add DeviceMotion permissions.

### 3. Mix corrective pass

- Keep the stretch interaction.
- Progress must depend on two simultaneous conditions:
  - the squishy is meaningfully stretched, not merely pressed;
  - the pointer is actually travelling across the screen recently.
- Stationary press, stationary stretch, and press/release tapping must not meaningfully advance the stage.
- Do not replace mix with another overlay minigame.

### 4. Mold

- Keep Interaction Pass 02 behavior unchanged unless a regression is found.
- One target at a time, moving target positions, gentle progress decay, no fail state.

## Technical constraints

- Keep the WebGL squishy renderer intact.
- Implement paint coverage as a small fixed-resolution coverage grid plus a lightweight 2D overlay canvas; do not add per-cell DOM nodes or a second physics system.
- Coverage calculations must be independent of frame rate and based on unique cells inside the squishy shape.
- Pointer/touch behavior must use the same interaction contract.
- Hidden-tab transitions must cancel held input/audio and must not silently complete a stage.
- Preserve strict TypeScript and current build tooling.

## Independent design review before implementation

The direction is accepted with these constraints:

1. **Coverage rather than literal drawing fidelity.** The player fantasy is spreading base across the form, not using a paint app. A coarse internal coverage grid is enough for progress while the overlay can be visually smooth.
2. **82% completion threshold.** Requiring 100% would create edge-scrubbing and make repeated loops tedious. A forgiving threshold preserves tempo.
3. **2D overlay rather than renderer rewrite.** The first stage is non-deforming, so a small overlay canvas is cheaper and safer than introducing a paint-mask texture into the WebGL material pipeline. The real WebGL squishy resumes immediately after completion.
4. **Mix motion is measured from actual pointer travel.** The previous use of `normalizedVelocity` measured compression change, not actual travel, so it could reject valid curved dragging and admit some press/release input. This pass tracks recent pointer movement in screen space instead.
5. **Foam reveal remains shader-driven but progress is linear.** The shader already assigns stable random reveal order to bead cells; easing the amount front-loaded the visual and made the second half feel dead.

## Independent implementation review

A second pass was done after implementation rather than assuming the first implementation was correct. It found and corrected three issues before merge:

1. **Shake feedback liveness.** The first implementation refreshed the shake idle timestamp on every pointer move, including movements too slow to earn progress. That could leave bead particles/audio running while the meter was not moving. The final implementation tracks the last *qualifying* shake separately.
2. **Paint feedback liveness.** The first implementation refreshed paint audio timing even when the pointer moved over already-covered cells. The final implementation refreshes paint feedback only when new coverage is actually added.
3. **Paint-path allocation.** Rebuilding the same 96-point clipping path for every brush dab was unnecessary work on the exact stage intended to improve mobile feel. The final implementation caches the `Path2D` once per app instance.

The review also rechecked the coverage geometry: with the current 16×16 eligible-cell grid and 0.14 UV brush radius, about four broad horizontal passes are enough to cross the 82% completion threshold. This is within the intended short-loop budget without requiring edge cleanup.

## Acceptance checks

- `npm run build` passes.
- Smooth recipe: `select → paint base → mix → mold → reveal → test → collect` completes.
- Foam recipe includes `paint base → shake beads → mix`.
- First stage cannot finish from holding still.
- Painting the same spot repeatedly does not substantially advance progress.
- Roughly four to six broad swipes can finish the first stage on phone-sized layouts.
- Foam visual does not animate on pointer-down alone.
- Foam bead population continues visibly through the full shake meter instead of saturating near halfway.
- Mix cannot advance from stationary press or stationary stretch.
- Mix does advance while a meaningfully stretched squishy is actively dragged.
- Mold still completes in the expected short target-tap loop.
- Visibility changes leave no stale pointer capture, audio, paint state, or target timer.
- GitHub Actions build + `gh-pages` publication remain green.

## Out of scope

- Device gyroscope input;
- fluid physics;
- paint score / accuracy rating;
- lives, misses, combos, or failure screens;
- second squishy shape;
- economy / XP / ads;
- reveal, collection, or recipe-selection redesign.
