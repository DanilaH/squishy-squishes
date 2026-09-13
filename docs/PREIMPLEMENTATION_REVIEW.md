# Squishy Squishes — Pre-Implementation Review

**Status:** RESOLVED  
**Date:** 2026-09-14  
**Next gate:** `docs/VERTICAL_SLICE_01.md`

The tactile thesis is PASS and the full-product direction is accepted. The user explicitly confirmed the proposed package, then tightened the implementation order: **before productionizing the whole game, build one complete craft → reveal → squeeze → collect loop on the existing probe base and polish that loop hands-on.**

---

## Confirmed product direction

- Build Squishy Lab / Maker; Headphones remains reserve.
- Keep the cheap 2D WebGL tactile core; no true soft-body or real-time 3D baseline.
- Premium tactile toy-lab direction: dark studio, bright semi-gloss squishies, material-rich rather than childlike presentation.
- Deterministic curated results rather than primary random loot.
- High-CMF content model: `shape × material/palette × filling × decal/face × decoration × finish`.
- Long-term launch target remains roughly **6 shapes / ~24 strong curated recipes**, with quality allowed to reduce the final count.
- No currency/shop/orders/customers/ingredient economy in MVP.
- Raw WebGL2 hero + DOM/CSS UI remains the preferred stack.
- Responsive desktop/mobile, including portrait while it remains visually good.
- Conservative between-loop monetization later; no ads during tactile/reveal/result play.
- Mid-craft reload may restart the current short craft.
- Freeplay/remix remains out of MVP.

---

## Important implementation-order correction

The original roadmap put production platform/save/debug scaffolding before the first real craft loop.

That order is now superseded.

The immediate implementation must stay deliberately close to the successful probe and answer the higher-value product question first:

`choose → make → reveal → squeeze → collect → repeat`

Do **not** spend the next block of work on Yandex bootstrap, cloud save, final i18n, final collection UI, Lab Rank or catalog production.

Those become worthwhile only after the complete tiny loop itself passes hands-on.

---

## Vertical Slice 01 — locked content

Use the current rounded soft-cube / superellipse shape only.

Variants:

- Lavender / Grape
- Strawberry / Pink
- Lime / Mint

Filling modifier:

- Smooth
- Foam Beads

Total: **6 deterministic variants from one geometry**.

Loop:

`select → pour → optional add filling → mix/squish → mold/press → reveal → free squeeze → Collect → repeat`

UI should be minimal and laid directly over the current base. Three swatches, one modifier choice, short stage hint/progress, Collect, and optional `made X/6` feedback are enough.

The exact acceptance protocol and stop rules live in `VERTICAL_SLICE_01.md`.

---

## Progression decision

The no-currency direction is confirmed.

**Lab XP / Lab Rank is intentionally deferred until after Vertical Slice 01**, despite remaining the leading progression candidate for the full product.

Reason: loop duration and repeat desire should determine progression cadence. Implementing XP before those measurements would be speculative plumbing and would contaminate the slice test.

---

## Shared-kit decision

The full production game should later move to reviewed:

`DanilaH/mini-games-kit@d17ba31fce2a71335dcc3095f772c3fdd87fe97b`

But the vertical slice should not churn the dependency merely to gain platform/persistence utilities it does not yet need. Preserve the validated probe base through the loop test; upgrade when productionization begins after PASS.

---

## Deferred until the slice passes

- second shape;
- full 24-recipe catalog;
- Lab XP values/ranks/unlock table;
- production collection screen;
- final save/cloud policy;
- Yandex SDK/ads;
- full typed RU/EN surface;
- final art/asset pipeline;
- final font;
- mass content production;
- renderer framework escalation;
- freeplay/remix.

---

## Development start

The review is complete.

Workflow:

1. merge this planning/spec pass;
2. create the Vertical Slice 01 implementation branch;
3. implement the smallest full loop on the existing probe base;
4. run hands-on over 5–10 complete loops;
5. polish only concrete high-value loop defects;
6. only after PASS, productionize architecture and scale content.

This sequence is now canonical and supersedes any older roadmap ordering that places infrastructure before the first complete loop.