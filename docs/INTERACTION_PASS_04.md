# Interaction Pass 04 — pacing, paint bleed, foam polish, mold crits

Date: 2026-09-14

## Goal

Tune the current compact craft loop after phone feedback. The loop structure stays unchanged; this pass improves duration, visual continuity, and the target-tap forming step.

Canonical loop remains:

```text
select
→ spread / paint base
→ optional Foam Beads shake
→ stretch to mix
→ form with normal taps + target crits
→ reveal
→ free squeeze
→ collect
```

## User feedback translated into requirements

### 1. Paint should last longer and finish visually fuller

Current completion feels premature: the stage can finish while a visibly large portion of the shape is still uncovered.

Required behavior:

- Increase required unique coverage substantially.
- Slightly reduce the logical brush footprint so broad swipes still work but completion needs more deliberate coverage.
- Finish only when the shape reads as nearly filled, while still avoiding pathological edge-scrubbing.
- Target: about 4–6 seconds of active painting on a phone rather than the current very short pass.

### 2. Painted regions should flow into one another

- Keep the existing coverage-grid progress logic.
- Improve the visual paint layer so neighboring painted blobs softly expand / bleed into one another instead of reading as isolated stamped circles.
- Do not add fluid simulation.
- Use a soft outer spread around each brush pass, clipped to the squishy shape, plus interpolated path samples.
- The visible spread must remain bounded by the squishy silhouette.

### 3. Foam / bead pouring needs a quality pass

- Remove the coarse large falling-dot look that reads as low-quality or artifacted.
- Use more, smaller particles with softer edges and more varied size/drift/timing.
- Avoid hard white discs and visible aliasing.
- Keep the shader-driven stable bead reveal on the squishy itself.
- Keep the shaker implementation cheap: no physics engine and no DOM particle spawning during play.

### 4. All active mini-games should be slightly longer

Tune durations without making the loop tedious:

- Paint: longer via higher coverage requirement and slightly smaller logical brush.
- Foam: require more total qualifying shake path.
- Mix: reduce semantic progress gain so active stretch must be sustained longer.
- Forming: reduce per-action gains so the step takes more interactions overall.

Target active durations are roughly 4–6 seconds per craft beat, not exact timers.

### 5. Forming step: normal taps + critical target taps

The user described this as the step with points; this pass treats it as the existing `mold` / forming stage.

Required behavior:

- A tap anywhere inside the squishy shape grants a small amount of form progress.
- Tapping the visible target grants a larger `critical` amount of progress.
- Target taps should feel materially more valuable than ordinary taps.
- The target must NOT relocate on a lifetime timer.
- A target remains in place until the player actually taps it.
- After a successful critical hit, a new target appears at a materially different position after a short visual beat.
- Ordinary taps do not relocate the target.
- Keep gentle progress decay so there is still some tempo pressure.
- No fail state, lives, combo loss, score, or miss penalty.

## Tuning values for this pass

These are implementation defaults, not product constants:

- Paint completion coverage: ~92%.
- Paint logical brush radius: ~0.115 UV.
- Foam full-progress shake path: ~3000 px of qualifying travel.
- Mix progress multiplier: reduced from the current pass by roughly 20–25%.
- Mold normal tap: ~0.035 progress.
- Mold critical target tap: ~0.105 progress.
- Mold decay: gentle, around 0.035 progress / second.

The exact feel should be validated on phone after deployment.

## Independent design review before implementation

The requested direction is coherent. The following constraints prevent scope or UX regressions:

1. **Do not require 100% paint coverage.** That would turn the first beat into edge-cleanup work. ~92% is high enough to look substantially full while retaining forgiveness.
2. **Paint bleed is visual, not simulation.** A clipped soft outer halo and denser interpolated brush path can create the read of material flowing together without adding fluid state or expensive per-frame processing.
3. **Foam quality should come from art direction, not particle count alone.** Smaller semi-soft particles with varied timing are preferable to simply multiplying the existing large opaque dots.
4. **Normal mold taps must be weak enough that ignoring targets is clearly suboptimal.** Critical targets remain the dominant action; normal taps prevent dead clicks from feeling wasted.
5. **Persistent targets are better than timed relocation here.** Since ordinary taps already advance the meter, a target that waits for a deliberate crit gives the player a stable goal instead of visual churn.
6. **Longer does not mean slower feedback.** Every gesture should still react immediately; only the amount of total successful interaction required increases.

## Acceptance checks

- `npm run build` passes under strict TypeScript.
- Paint cannot finish with roughly one-third of the visible shape still empty during normal broad-swipe play.
- Paint regions visually merge / bleed at close distances and remain clipped to the squishy shape.
- Repainting the same area does not meaningfully increase logical progress.
- Foam falling particles no longer read as coarse hard circles; no obvious clipping / alias artifacts are introduced.
- Foam and mix take noticeably longer than Interaction Pass 03 while staying responsive.
- Mold ordinary taps inside the squishy add a small amount of progress.
- Mold target taps add a clearly larger amount of progress.
- Mold target does not move unless hit.
- Ordinary taps do not move the target.
- Mold still completes without a fail state and still has gentle decay.
- Hidden-tab handling leaves no stale pointer / audio / target state.
- GitHub Actions build and `gh-pages` publication remain green.

## Out of scope

- fluid physics;
- gyroscope input;
- new shapes or recipes;
- economy / XP / ads;
- score, combo, lives, failure screens;
- reveal / collect redesign;
- engine or framework migration.
