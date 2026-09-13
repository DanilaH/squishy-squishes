# Vertical Slice 01 — One Shape, Full Loop

**Status:** CONFIRMED / NEXT IMPLEMENTATION GATE  
**Date:** 2026-09-14

## Purpose

Build the smallest version of the **real game loop** on top of the validated feel-probe base, then test and polish that complete loop before paying for production architecture, catalog scale, progression, monetization or finished UI.

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

The purpose is not six pieces of authored content. It is to prove that a tiny data-driven material axis creates perceptible variety without new gameplay code.

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

`Smooth` may skip the explicit filling-add beat. Every path must still arrive at the same mix/mold/reveal/test/collect flow.

## Interaction budget

Use the current scene and a very small interaction grammar:

- **hold** for pour / filling dispense;
- **press / drag / squeeze** for mix;
- **press** for mold;
- **free squeeze** for result play;
- one button for Collect.

No new mini-game grammar is allowed for this slice.

## UI budget

UI is intentionally disposable/minimal.

Required only:

- 3 color swatches;
- Smooth / Foam Beads choice;
- Start / Collect affordance as needed;
- current short stage hint;
- small stage progress indication;
- tiny `made X/6` feedback is allowed;
- existing DEV metrics/mesh/mute controls may remain available but visually secondary.

Do not build the final recipe browser, collection screen, Lab Rank HUD, settings screen or polished navigation.

## Visual implementation rule

Build directly on the validated probe presentation.

Allowed cheap additions:

- simple vessel / mold frame;
- procedural or DOM/CSS pour stream;
- material color uniforms;
- procedural bead/filling treatment;
- short mold/reveal choreography;
- stage-specific shadow/light response;
- restrained completion/reveal FX.

Do not create an asset pipeline or authored background pack before the loop passes.

## Persistence

For slice testing, only tiny durable `made/discovered variant ids` state is useful.

Do not build the final save/cloud stack before the loop passes. Mid-craft reload may restart the current craft.

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
- renderer/framework migration;
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

The slice passes when the complete loop is already enjoyable enough that the obvious next work is **scale and productionization**, not inventing another mechanic or meta-system.

After PASS:

- polish remaining high-value loop defects;
- extract production boundaries from actual working code;
- move to reviewed `mini-games-kit` production revision;
- add platform/save/i18n/debug skeleton;
- prove renderer reuse on a second shape only then;
- lock progression using measured loop duration;
- scale content in small batches.

## FAIL / correction rule

If the loop is weak, fix the specific weak beat before adding systems.

Do not rescue it with XP, currency, customers, orders, random loot, extra rooms, a second shape or more UI.

This slice is deliberately small so a weak craft/reveal loop cannot hide behind product scope.