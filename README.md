# Squishy Squishes

Compact tactile maker / collection game for Yandex Games.

**Current status:** feel thesis PASSED; full-game direction is locked; **Vertical Slice 01 is the active implementation gate**.

Immediate goal:

`select → pour → optional filling → mix/squish → mold/press → reveal → free squeeze → Collect → repeat`

The slice deliberately uses the existing validated shape and renderer before production architecture or catalog scale.

## Vertical Slice 01

Current content:

- one rounded soft-cube / superellipse shape;
- Lavender/Grape, Strawberry/Pink, Lime/Mint palettes;
- Smooth / Foam Beads modifier;
- six deterministic variants;
- minimal temporary UI over the current scene.

Canonical scope and acceptance: `docs/VERTICAL_SLICE_01.md`.

Do not add Lab XP, second shape, final collection UI, Yandex integration, ads, cloud save or mass content until this complete loop has been tested and polished over repeated runs.

## Product thesis

Make desirable soft collectibles through a short tactile lab ritual, reveal them dramatically, squeeze the finished result, collect them, and unlock the next materially different recipe.

Long-term loop:

`choose recipe → pour/add → mix/squish → mold → reveal → optional finish/decorate → test squeeze → collect → unlock`

The production bet is asymmetric: reusable shapes/interactions plus material/config combinations should create many desirable collectibles without bespoke mechanics.

## Art direction

**Premium tactile toy lab**:

- dark plum / indigo studio environment;
- bright semi-gloss designer-toy squishies;
- tactile materials and strong silhouette contrast;
- kawaii-lite rather than childlike;
- restrained UI;
- reveal hierarchy without generic mobile-game effect spam.

## Documentation

Start here:

- `docs/VERTICAL_SLICE_01.md` — active implementation scope and acceptance gate
- `docs/DECISIONS.md` — confirmed project decisions
- `docs/IMPLEMENTATION_ROADMAP.md` — vertical-slice-first execution order
- `docs/GAMEPLAY.md` — full intended loop and interaction grammar
- `docs/PRODUCT.md` — product thesis and scope
- `docs/CONTENT_AND_PROGRESSION.md` — future component/catalog/progression design
- `docs/ART_DIRECTION.md` — visual identity
- `docs/TECHNICAL_DIRECTION.md` — production architecture direction
- `docs/REUSE_AND_EXTRACTION_PLAN.md` — shared-kit / previous-project reuse
- `docs/ANALYTICS_AND_MONETIZATION.md` — later product analytics/ad posture
- `docs/ASSET_PIPELINE.md` — later content production rules
- `docs/QA_AND_ACCEPTANCE.md` — release-scale validation
- `docs/PREIMPLEMENTATION_REVIEW.md` — resolved pre-development review

Historical validation evidence:

- `docs/SQUISH_FEEL_PROBE.md`
- `docs/PROBE_RESULT.md`

## Validated tactile core

The runnable base came from the successful feel probe:

- raw WebGL2;
- 16×16 deforming grid;
- local press/drag deformation and pseudo-volume response;
- damped spring return / restrained rebound;
- procedural material sheen and responsive shadow;
- progress/velocity-driven tactile WebAudio;
- no soft-body solver, physics engine or 3D model.

## Shared production kit

The accepted probe / first slice base is pinned to:

`DanilaH/mini-games-kit@2da5b501a7e47fbe4b3683069b34f8e252116963`

Productionization after slice PASS is planned against:

`DanilaH/mini-games-kit@d17ba31fce2a71335dcc3095f772c3fdd87fe97b`

The dependency is private. Local installs / CI require GitHub credentials that can read it.

## Run

Requirements: Node.js `>=20.19.0` and GitHub authentication for the private kit.

```bash
npm install
npm run dev
```

Production build/typecheck:

```bash
npm run build
```

## Scope rule

Do not turn the project into Cooking Mama, a shop/economy sim or a physics sandbox.

Right now the only thing that matters is whether the tiny full loop remains fun across several complete crafts. If it does, productionize and scale. If it does not, fix the weak beat instead of adding systems.