# Squishy Squishes — Agent Contract

This repository has passed its bounded Squish Feel Probe and is now in **pre-development full-game planning** for Squishy Lab / Maker.

Do not start broad implementation until `docs/PREIMPLEMENTATION_REVIEW.md` is explicitly resolved with the user.

## Required startup reading

Read local project truth first:

1. `docs/PRODUCT.md`
2. `docs/GAMEPLAY.md`
3. `docs/CONTENT_AND_PROGRESSION.md`
4. `docs/ART_DIRECTION.md`
5. `docs/TECHNICAL_DIRECTION.md`
6. `docs/REUSE_AND_EXTRACTION_PLAN.md`
7. `docs/IMPLEMENTATION_ROADMAP.md`
8. `docs/DECISIONS.md`

Then consult the canonical portfolio guidance in `DanilaH/decisions` when relevant, especially:

- `Yandex Games/YANDEX_GAMES_DECISIONS.md`
- `Yandex Games/GAME_FEEL_DOCTRINE.md`
- `Yandex Games/FEEL_PATTERNS.md`
- `Yandex Games/POLISH_ACCEPTANCE.md`
- `Yandex Games/REUSABLE_MECHANICS.md`
- `Yandex Games/MINI_GAMES_KIT_CURRENT_STATUS.md`

Before reimplementing production/platform/feel infrastructure, inspect the current pinned `DanilaH/mini-games-kit` API documentation.

## Product invariant

The product is a compact tactile maker/collection game, not a general crafting simulator.

Target loop:

`choose recipe → pour/add → mix/squish → mold → reveal → finish/decorate → test squeeze → collect → unlock next desirable recipe`

The loop must reuse a small grammar of tactile interactions. Do not create a different mini-game for every crafting stage.

The validated squeeze core is cheap 2D deformation. Preserve that advantage. True soft-body physics, real-time 3D, bespoke deformation code per collectible, backend services, ECS, character systems, orders/customers, shop economy, quests and unrelated meta systems are out of MVP unless new evidence explicitly justifies them.

## Production strategy

Optimize for **perceived quality / complete production burden**, not feature count.

- Keep the hero interaction immediate and pleasant under repetition.
- Spend polish budget on the high-frequency tactile loop, reveal and result exit before secondary UI.
- New content should be primarily config/component driven.
- A recipe that needs bespoke gameplay code is a warning that the content system is failing.
- Presentation never owns durable gameplay truth.
- Gameplay RNG and cosmetic randomness remain separate if gameplay randomness is introduced later.
- Input responsiveness and frame stability outrank decorative richness.
- Do not mask a weak stage with particles, ads, progression or extra mechanics.

## Technical baseline

Planned full-game baseline is strict TypeScript + Vite + raw WebGL2 for the tactile hero and DOM/CSS for lightweight UI.

Do not add Phaser, React, a physics engine or another rendering framework merely because the previous project used one. The probe already proved the hero interaction without them. A framework change requires concrete evidence that the current approach has become the dominant production cost.

The validated probe remains historical evidence in:

- `docs/SQUISH_FEEL_PROBE.md`
- `docs/PROBE_RESULT.md`

Do not rewrite that history to match later implementation.

## Shared-kit rule

The validated probe used `mini-games-kit@2da5b501a7e47fbe4b3683069b34f8e252116963`.

The full game is planned against the newer reviewed revision `d17ba31fce2a71335dcc3095f772c3fdd87fe97b`, subject to the pre-development review. Consume only fitting subpaths and keep game policy local.

If an experimental kit API is close but wrong, record the friction. Correct the shared primitive only when the smallest general change is justified by this real consumer; do not silently fork an expensive generic mechanism inside the game.

## Development discipline

Use branches and reviewable PRs. Keep domain logic in pure modules where practical and renderer/orchestration code non-authoritative for persistence/progression.

Every material scope or architecture change belongs in `docs/DECISIONS.md`. Every reusable production lesson supported by hands-on evidence should be written back to `DanilaH/decisions` after review.

Before declaring production-ready, apply the repeated-use and lifecycle checks in the canonical polish acceptance document on representative desktop/mobile conditions.
