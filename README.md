# Squishy Squishes

Compact tactile maker / collection game for Yandex Games.

**Current status:** feel thesis **PASSED**; full-game specification is prepared for pre-development review. Implementation beyond the validated probe should not begin until `docs/PREIMPLEMENTATION_REVIEW.md` is resolved.

## Product thesis

Make desirable soft collectibles through a short tactile lab ritual, reveal them dramatically, squeeze the finished result, add it to a visible collection, and unlock the next materially different recipe.

Core loop:

`choose recipe → pour/add → mix/squish → mold → reveal → finish/decorate → test squeeze → collect → unlock`

The production bet is asymmetric: a small set of reusable shapes and interaction grammars should create many visibly distinct collectibles through material/config combinations rather than bespoke mechanics.

## Art direction

**Premium tactile toy lab**:

- dark plum / indigo studio environment;
- bright semi-gloss designer-toy squishies;
- tactile materials and strong silhouette contrast;
- kawaii-lite rather than childlike;
- restrained translucent UI;
- reveal hierarchy without generic mobile-game effect spam.

## Documentation

Start here:

- `docs/PRODUCT.md` — product thesis, scope and player promise
- `docs/GAMEPLAY.md` — complete loop and interaction grammar
- `docs/CONTENT_AND_PROGRESSION.md` — component system, initial 24-recipe catalog and unlock model
- `docs/ART_DIRECTION.md` — visual identity and presentation rules
- `docs/TECHNICAL_DIRECTION.md` — architecture, state boundaries and performance strategy
- `docs/REUSE_AND_EXTRACTION_PLAN.md` — what comes from `mini-games-kit` and Signal 2000, and what must stay local
- `docs/ANALYTICS_AND_MONETIZATION.md` — compact event contract and ad principles
- `docs/ASSET_PIPELINE.md` — low-burden content production rules
- `docs/IMPLEMENTATION_ROADMAP.md` — phased execution and gates
- `docs/PREIMPLEMENTATION_REVIEW.md` — decisions to confirm before coding
- `docs/DECISIONS.md` — local project decision log

Historical validation evidence:

- `docs/SQUISH_FEEL_PROBE.md`
- `docs/PROBE_RESULT.md`

## Validated tactile core

The current runnable code is the successful feel probe:

- raw WebGL2;
- 16×16 deforming grid;
- local press/drag deformation and pseudo-volume response;
- damped spring return / restrained rebound;
- procedural material sheen and responsive shadow;
- progress/velocity-driven tactile WebAudio;
- no soft-body solver, physics engine or 3D model.

This is evidence to build on, not a requirement to keep the probe's file structure unchanged.

## Shared production kit

The probe itself is pinned to:

`DanilaH/mini-games-kit@2da5b501a7e47fbe4b3683069b34f8e252116963`

Full-game planning targets the newer reviewed kit revision:

`DanilaH/mini-games-kit@d17ba31fce2a71335dcc3095f772c3fdd87fe97b`

The dependency is private. Local installs / CI require GitHub credentials that can read it.

## Run the existing probe

Requirements: Node.js `>=20.19.0` and GitHub authentication for the private kit.

```bash
npm install
npm run dev
```

Production build/typecheck:

```bash
npm run build
```

## MVP rule

Do not turn this into Cooking Mama, a shop/economy sim or a physics sandbox.

The first release should prove that a polished sequence of a few reusable tactile interactions + a high-CMF collectible system is enough. If a new feature does not strengthen the high-frequency craft/reveal/squeeze/collect loop enough to justify its complete production burden, leave it out.
