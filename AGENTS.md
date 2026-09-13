# Squishy Squishes — Agent Contract

The feel thesis has PASSED. The current implementation task is **Vertical Slice 01**, not broad full-game productionization.

Read `docs/VERTICAL_SLICE_01.md` first. Then read:

1. `docs/GAMEPLAY.md`
2. `docs/DECISIONS.md`
3. `docs/IMPLEMENTATION_ROADMAP.md`
4. `docs/PRODUCT.md`
5. `docs/ART_DIRECTION.md`
6. `docs/TECHNICAL_DIRECTION.md`
7. `docs/REUSE_AND_EXTRACTION_PLAN.md`

Canonical portfolio guidance in `DanilaH/decisions` remains relevant, especially the Yandex decision ledger and feel/polish doctrine, but do not reopen broad market research.

## Current task invariant

Build the smallest complete product loop directly on the validated probe base:

`select → pour → optional filling → mix/squish → mold/press → reveal → free squeeze → Collect → repeat`

Current slice content is locked:

- one existing rounded soft-cube/superellipse geometry;
- Lavender/Grape, Strawberry/Pink, Lime/Mint palettes;
- Smooth / Foam Beads modifier;
- six deterministic variants;
- minimal temporary UI.

Do not add a second shape, Lab XP, final collection UI, Yandex SDK, ads, cloud save, final i18n, a production asset pipeline or mass content before the slice passes repeated-use hands-on.

## Product invariant

The eventual product is a compact tactile maker/collection game, not a general crafting simulator.

Long-term grammar:

`choose recipe → tactile make → mold → reveal → squeeze/play → collect → visible next unlock`

Reuse a small interaction grammar. A recipe that needs bespoke gameplay code is a warning that the content system is failing.

## Technical baseline

Use strict TypeScript + Vite + raw WebGL2 for the tactile hero and DOM/CSS for lightweight UI.

The current slice should preserve the validated probe dependency and rendering path unless a concrete defect requires change. The planned production upgrade to `mini-games-kit@d17ba31fce2a71335dcc3095f772c3fdd87fe97b` happens **after** the slice passes; do not churn the dependency just to obtain platform/persistence utilities that are intentionally deferred.

No Phaser, React, physics engine, real-time 3D or general soft-body framework without new evidence.

## Feel discipline

The existing squeeze interaction is accepted evidence. Do not keep tuning it in isolation.

Spend correction effort on the complete high-frequency loop:

- immediate stage response;
- causal visual change during pour/add/mix/mold;
- short satisfying reveal;
- frictionless transition into free squeeze;
- fast Collect → next craft exit;
- sound that survives repetition;
- mobile/desktop stability.

Do not mask a weak stage with particles, progression or extra mechanics.

## State discipline

For the vertical slice:

- stage progress can be in-memory;
- mid-craft reload may restart the craft;
- tiny discovered-variant persistence is allowed;
- presentation callbacks must not double-complete a stage;
- pointer cancel / visibility change must release owned input/audio cleanly.

Full save/cloud/progression truth boundaries are deferred until productionization after slice PASS.

## Historical evidence

Do not rewrite:

- `docs/SQUISH_FEEL_PROBE.md`
- `docs/PROBE_RESULT.md`

They record the original decision experiment.

## Development discipline

Use branches and reviewable PRs. Material scope/architecture changes belong in `docs/DECISIONS.md`.

The current acceptance gate is 5–10 complete loops from creation through Collect. Only after that loop passes should architecture/content scale expand.