# Feel / Art / Audio Pass 01 — Independent Pre-Implementation Review

**Verdict:** PASS WITH TIGHTENING

The pass attacks a real remaining product gap: the mechanics/catalog exist, but reward presentation still behaves like a vertical slice. The main risk is turning polish into a second gameplay/content system. Keep the following constraints explicit.

## 1. Presentation tier must stay cosmetic and tiny

A three-value derived tier is acceptable only if it remains a pure presentation helper. It must not become a new rarity taxonomy stored on recipes or used by progression.

Recommended derivation:

- `showcase` if material is `holo` or filling is `pearls`;
- `special` if material is `jelly` or filling is `beads`;
- otherwise `standard`.

This is intentionally simple. Do not score recipes or create hidden rarity math.

## 2. Do not touch shader/material formulas in this pass

Holo/jelly rendering has already been through representative acceptance work. Reward hierarchy can be produced by DOM/CSS environment light, object choreography and audio. A shader change would increase regression risk without being necessary to prove this pass.

## 3. Keep reveal timing close to current cadence

The current reveal transition is about one second. Do not grow it into a cinematic. The visual sequence may have anticipation inside the same envelope, but time-to-test should remain approximately current.

## 4. Prefer CSS/state data over more imperative animation code

Set one `data-presentation-tier` value alongside the existing shape/material/filling dataset and let CSS own reveal/result/collect differences. Do not add timers for decorative beats unless a state transition genuinely requires one.

## 5. Audio hierarchy should not equal volume hierarchy

Showcase should feel richer primarily through contour/layering, not simply louder gain.

- standard: compact low + soft confirmation tone;
- special: slightly wider interval/decay;
- showcase: restrained shimmer layer and broader contour;
- collect remains shorter than reveal.

Master/headroom should remain conservative.

## 6. Deterministic variation beats randomness for stage-complete fatigue

Use a tiny cycling pitch pattern rather than per-event random frequencies. This makes repeated sound less monotonous while staying testable and controlled.

## 7. Keep squeeze tactile audio untouched

The existing continuous tactile texture and release plop are high-frequency accepted interactions. Do not use this pass as an excuse to retune them. Material-specific squeeze audio can be a later evidence-driven micro-pass if hands-on testing says material identity still collapses after reveal.

## 8. Collect motion must not imply lost ownership

Moving the object toward the top-right collection/progression chrome is a better semantic direction than fading it upward generically. Keep the travel short enough that it reads as `added to collection`, not `object flew away`.

## 9. Prototype-copy cleanup is in scope, broader naming is not

Replace obvious test labels (`Production line · 01`, `CRAFT 01`). Do not rename the game/product or rewrite all instructional copy in this pass.

## Regression boundary

The diff should avoid changes to:

- `content.ts` recipe registry;
- `progression.ts`;
- save/storage/runtime/ads;
- `SquishSurface.ts`;
- shaders;
- shape boundaries;
- paint/add/mix/mold progress constants and handlers.

Expected implementation files are approximately:

- one small presentation-tier helper;
- `VerticalSliceApp.ts` only where tier is applied / reveal+collect audio methods are called;
- `SquishyAudio.ts` for bounded reveal/collect/stage-complete treatment;
- one dedicated CSS layer;
- RU/EN copy;
- main CSS import;
- docs.

If the implementation starts requiring recipe IDs, shader edits, state-machine expansion or new content metadata, stop and reduce scope.
