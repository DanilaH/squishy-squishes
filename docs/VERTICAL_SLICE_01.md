# Vertical Slice 01 — One Shape, Full Loop

**Status:** IMPLEMENTED / PENDING HANDS-ON  
**Date:** 2026-09-14  
**Implementation branch:** `feat/vertical-slice-01`  
**PR:** `#3`  
**Production pass:** `docs/PRODUCTION_PASS_01.md`

## Purpose

Build the smallest version of the **real game loop** on top of the validated feel-probe base, then test and polish that complete loop before paying for catalog scale, progression, monetization or finished product UI.

The question is no longer whether squeezing works. It is:

> Does `choose → make → reveal → squeeze → collect → repeat` feel good as one continuous product loop?

## Locked scope

### Shape

Use the current validated rounded soft-cube / superellipse shape only.

Do not create a second silhouette for this slice.

### Variants

Use three color/material palettes and one binary filling modifier:

- Lavender / Grape
- Strawberry / Pink
- Lime / Mint

Filling:

- Smooth
- Foam Beads

This gives **6 deterministic results** from one shape.

The purpose is not six pieces of authored content. It is to prove that a tiny material axis creates perceptible variety without new gameplay code.

### Loop

```text
variant select
→ pour base
→ add filling when selected
→ mix / squish
→ mold / press
→ unmold / reveal
→ free test squeeze
→ Collect
→ variant select / repeat
```

`Smooth` skips the explicit filling-add beat. Every path arrives at the same mix/mold/reveal/test/collect flow.

## Current implementation

The slice still preserves the validated tactile constants/behavior, but the playable path has now received one bounded production pass rather than continuing to stack temporary presentation hacks on the probe class.

Implemented:

- 3 typed palette choices driving actual WebGL material uniforms;
- Smooth / Foam Beads choice;
- Foam Beads generated procedurally in object UV space so the filling follows the deforming mesh;
- hold-to-pour stage with a real shader fill boundary/meniscus rather than whole-object growth;
- optional hold-to-add-beads stage;
- mix progress driven by real squish metrics;
- mold progress driven by real press/compression metrics and a bounded mold-specific render deformation;
- short mold/unmold/reveal choreography;
- unrestricted finished-object squeeze;
- Collect → repeat;
- tiny local `Made X / 6` discovered-variant persistence;
- unified project-local audio owner for tactile sound, pour, beads, stage completion, reveal and Collect;
- existing metrics / mesh / mute diagnostics retained as secondary controls;
- production slice runtime separated from the untouched `src/probe/*` validation evidence;
- reviewed `mini-games-kit@d17ba31fce2a71335dcc3095f772c3fdd87fe97b` used for shared interaction/audio/render-density primitives.

Still intentionally cheap:

- no fluid simulation;
- no embedded-bead physics;
- no general mold collision/soft-body solver;
- no authored environment asset pack;
- no final recipe browser/collection navigation;
- no full product save/platform stack.

The purpose of the production pass is to remove shortcuts that would distort the hands-on verdict while keeping the decision experiment small. See `PRODUCTION_PASS_01.md` for the independent review and exact implementation changes.

## Interaction budget

Use one scene and a very small interaction grammar:

- **hold** for pour / filling dispense;
- **press / drag / squeeze** for mix;
- **press** for mold;
- **free squeeze** for result play;
- one button for Collect.

No new mini-game grammar is allowed for this slice.

## UI budget

UI remains intentionally compact and secondary to the object.

Required only:

- 3 color swatches;
- Smooth / Foam Beads choice;
- Start / Collect affordance;
- current short stage hint;
- small stage progress indication;
- tiny `Made X / 6` / discovery feedback;
- existing DEV metrics/mesh/mute controls visually secondary.

Do not build the final recipe browser, collection screen, Lab Rank HUD, settings screen or full navigation before the loop passes.

## Persistence

For slice testing, only tiny durable `made/discovered variant ids` state is used.

Do not build the final save/cloud stack before the loop passes. Mid-craft reload restarts the current craft.

## Explicitly deferred

Until this slice passes repeated-use hands-on:

- second shape;
- 24-recipe catalog;
- Lab XP / Lab Rank;
- final progression/unlock cadence;
- production collection UI;
- Yandex SDK integration;
- ads;
- cloud save;
- full typed i18n;
- final art-production pipeline;
- production asset batch;
- freeplay/remix.

## Acceptance protocol

Do not judge from one successful craft.

Hands-on should include:

- all 6 variants at least once if practical;
- at least 5–10 complete loops;
- Smooth and Foam Beads paths;
- repeated pour/mix/mold/reveal transitions;
- voluntary squeezing after reveal;
- Collect → next craft transition;
- sound on and off;
- desktop and at least one mobile-sized viewport if available.

Evaluate:

1. Does creation feel causal rather than like clicking through labels?
2. Is any stage boring enough that the player wants it removed?
3. Does reveal pay off the craft?
4. Does the finished object invite voluntary squeezing?
5. Is Collect → next loop fast enough?
6. Do color/filling variants feel meaningfully different for their implementation cost?
7. Is the total loop still pleasant after several repetitions?

## PASS

The slice passes when the complete loop is already enjoyable enough that the obvious next work is **scale and product integration**, not inventing another mechanic or meta-system.

After PASS:

- polish only remaining high-value loop defects found hands-on;
- retain the reviewed shared-kit production revision unless a concrete incompatibility appears;
- add the platform/save/i18n/debug product skeleton around the accepted loop;
- prove renderer/content reuse on a second shape only then;
- lock progression using measured loop duration;
- scale content in small batches.

## FAIL / correction rule

If the loop is weak, fix the specific weak beat before adding systems.

Do not rescue it with XP, currency, customers, orders, random loot, extra rooms, a second shape or more UI.

This slice is deliberately small so a weak craft/reveal loop cannot hide behind product scope.
