# Production cutover — 2026-09-29

## Decision

The owner explicitly authorized finishing the reviewed Squishy Squishes work in `main`. The production cutover therefore promotes the already owner-reviewed visual/interaction profile instead of leaving it limited to PR Pages and the isolated Yandex DRAFT.

## Production behavior after cutover

- `src/main.ts` installs the shared owner-reviewed Hall/Studio visual profile for the normal web build and the normal Yandex build.
- Hall saved-toy thumbnails use the accepted static 512px volume renderer with one reusable offscreen WebGL2 context and Canvas2D fallback.
- Maker entry lazily imports `PhaserSquishSurface`; Phaser is not pulled onto the first Library JS path merely by opening the game.
- The live craft/Finish/Squeeze surface uses the accepted deformable volume profile, including viewport pointer-follow and stage recentering.
- The accepted workshop/Hall authored environment and decor/material presentation are shared with production.
- Production continues to use the normal `squishy.save.v3` / settings storage contract. No V3 schema or canonical shape/material IDs are changed by the cutover.
- The isolated Yandex DRAFT remains storage-isolated under `squishy.phaser-yandex-draft.*`.
- `?appearanceProbe=1` remains an explicit diagnostic path and intentionally bypasses the production visual profile.

## Failure and lifecycle behavior

- Transient lazy maker chunk/art failures remain retryable rather than poisoning later maker opens.
- A maker renderer initialization failure restores the originating Library/Ideas screen and surfaces the existing retryable error.
- Hall/profile renderer resources are installed/disposed symmetrically; WebGL contexts are explicitly released on failure/final disposal.
- Optional authored art has bounded startup preparation and cannot indefinitely block Library interaction.

## Merge gate

The final feature SHA must satisfy the production and review evidence already used during owner review:

1. Release Check.
2. Release Browser QA, including `tests/release/production-cutover.spec.ts`.
3. Phaser Pages QA.
4. Library Hall real-browser QA.
5. Phaser M2 Candidate QA.
6. Phaser Yandex DRAFT.
7. Library cross-scene V3 parity review.
8. Review Pages deployment.

PR #59 should be squash-merged so its long experimental/review history does not become hundreds of production commits. After merge, `main` is the source of truth; the PR remains useful as review/evidence history.
