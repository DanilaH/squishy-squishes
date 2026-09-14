# Squishy Squishes

Compact tactile maker / collection game for Yandex Games.

**Current status:** core loop, reusable renderer, progression/Collection, representative materials and catalog production are structurally complete. The project is in **Release Candidate 01** productization/hardening.

Current loop:

`select recipe → paint base → optional filling shake → stretch/mix → form → reveal → free squeeze → Collect → progression/unlock → repeat`

## Current release candidate

The working MVP catalog is now:

- **6 reusable shapes:** Soft Cube, Soft Heart, Mochi, Peach Puff, Mushroom, Paw;
- **24 curated canonical recipes**;
- one shared WebGL2 deformation path;
- reusable soft / jelly / holographic material vocabulary;
- reusable smooth / foam / pearl filling vocabulary;
- Lab XP / Rank progression and Collection;
- no spendable currency/shop/order system.

Phase 7B phone review was deliberately deferred by the product owner. It remains a pre-publication smoke check, not an engineering gate.

RC01 scope is locked to:

- final presentation/UI cleanup around the proven craft loop;
- Collection/catalog presentation;
- Yandex lifecycle integration through the pinned shared runtime;
- compact analytics funnel;
- conservative between-loop interstitial policy;
- Yandex-specific archive build and automated verification;
- permanent release CI and packaged Yandex artifact.

No new content, mechanics, ranks, save schema, renderer/physics architecture or shared-kit upgrade belongs in RC01.

Canonical RC contract:

- `docs/RELEASE_CANDIDATE_01.md`
- `docs/RELEASE_CANDIDATE_01_REVIEW.md`
- `docs/IMPLEMENTATION_ROADMAP.md`

## Product thesis

Make desirable soft collectibles through a short tactile lab ritual, reveal them, squeeze the finished result, collect them, and quickly expose the next visually different recipe.

The production bet is high perceived novelty from a small reusable base. Catalog production has now demonstrated that later recipes/shapes can be added without new renderer, physics or craft-state implementations.

## Stack

- strict TypeScript;
- Vite;
- raw WebGL2 for the tactile hero;
- DOM/CSS for UI;
- WebAudio;
- `@danilah/mini-games-kit` pinned to `d17ba31fce2a71335dcc3095f772c3fdd87fe97b`;
- no backend;
- no React/Phaser/Pixi/Three.js/physics engine unless new evidence justifies it.

## Run

Requirements: Node.js `>=20.19.0`.

```bash
npm install
npm run dev
```

Normal production build:

```bash
npm run typecheck
npm run build
```

Full release validation:

```bash
npm run release:check
```

Yandex build only:

```bash
npm run build:yandex
npm run verify:yandex
```

The Yandex build is emitted to `dist-yandex/` with relative asset paths and `VITE_PLATFORM=yandex`. The permanent `Release Check` GitHub Actions workflow packages it as `squishy-squishes-yandex.zip`.

GitHub Pages QA build:

https://danilah.github.io/squishy-squishes/

The phone QA progression panel remains available on the Pages build for testing. It is excluded from the normal Yandex release bundle.

## Documentation

Current execution/source-of-truth:

- `docs/RELEASE_CANDIDATE_01.md` — active release contract;
- `docs/IMPLEMENTATION_ROADMAP.md` — phase status and remaining external gates;
- `docs/CONTENT_AND_PROGRESSION.md` — catalog/content principles;
- `docs/TECHNICAL_DIRECTION.md` — architecture boundaries;
- `docs/GAMEPLAY.md` — interaction grammar;
- `docs/PRODUCT.md` — product thesis/scope;
- `docs/ART_DIRECTION.md` — visual identity;
- `docs/ANALYTICS_AND_MONETIZATION.md` — analytics/ad posture;
- `docs/QA_AND_ACCEPTANCE.md` — release validation principles.

Historical implementation specs/reviews under `docs/` remain evidence of completed phases and should not be treated as the active gate.

## Scope rule

Do not turn the project into Cooking Mama, a shop/economy sim, or a physics sandbox. At this stage, new content and systems require post-release evidence. The priority is a clean, stable, measurable Yandex release of the already-proven loop.
