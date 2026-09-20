# Documentation map — Squishy Squishes

**Updated 2026-09-20.** Start with [`../AGENTS.md`](../AGENTS.md) and current code/tests. A filename containing `PLAN`, `REVIEW` or `PASS` does **not** imply current scope or approval.

## Working on the current game

| Need | Read first | Boundary |
| --- | --- | --- |
| Freeform maker / saved toys | [`SANDBOX_PIVOT_01_MASTER_PLAN.md`](SANDBOX_PIVOT_01_MASTER_PLAN.md), [`SANDBOX_PIVOT_S2_LIBRARY.md`](SANDBOX_PIVOT_S2_LIBRARY.md) | SaveState V3; no recipe/XP content gating. Verify milestones against code/merged PRs. |
| Faces, stickers, accessories | [`SANDBOX_PIVOT_S3_DECOR.md`](SANDBOX_PIVOT_S3_DECOR.md), [`SANDBOX_PIVOT_01_ASSET_PLAN.md`](SANDBOX_PIVOT_01_ASSET_PLAN.md) | Player-created decor, not background mascots. |
| Authored art / Studio | [`RUNTIME_ASSETS.md`](RUNTIME_ASSETS.md), [`STUDIO_ENVIRONMENT_EXECUTION_V7.md`](STUDIO_ENVIRONMENT_EXECUTION_V7.md) | The v7 brief is historical execution guidance; compare with merged Studio implementation. Keep approved source/provenance and real-browser QA. |
| Technical decisions | [`PROJECT_DECISIONS.md`](PROJECT_DECISIONS.md), [`../AGENTS.md`](../AGENTS.md) | Phaser cutover is scoped, reversible and not an automatic Yandex release. |
| Phaser preview / migration | [`PHASER_LANDSCAPE_MIGRATION_PLAN.md`](PHASER_LANDSCAPE_MIGRATION_PLAN.md), [`PHASER_BOOTSTRAP_ADOPTION.md`](PHASER_BOOTSTRAP_ADOPTION.md) | The migration-plan filename is historical: a landscape redesign is **not** authorized by it. |
| QA / release | [`../README.md`](../README.md), [Release Check](../.github/workflows/release-check.yml), [browser QA](../.github/workflows/release-browser-qa.yml) | Browser CI is not real-phone or hosted Yandex DRAFT approval. |

## Historical material and recovery

The initial recipe/XP product was superseded by the freeform sandbox. [`PRODUCT.md`](PRODUCT.md), [`GAMEPLAY.md`](GAMEPLAY.md), [`CONTENT_AND_PROGRESSION.md`](CONTENT_AND_PROGRESSION.md), [`DECISIONS.md`](DECISIONS.md), [`ART_DIRECTION.md`](ART_DIRECTION.md), [`ASSET_PIPELINE.md`](ASSET_PIPELINE.md) and [`QA_AND_ACCEPTANCE.md`](QA_AND_ACCEPTANCE.md) are **early proposals, not current instructions**. In particular, the dark-lab art proposal is incompatible with the accepted warm Studio environment. [`IMPLEMENTATION_ROADMAP.md`](IMPLEMENTATION_ROADMAP.md) preserves evidence but its old S5/S6 labels are stale.

The old `PLAN → REVIEW → IMPLEMENTATION_REVIEW` chains for recipe catalog 7A/7B, art/audio, interaction passes, skeleton, renderer shape reuse, progression reviews, release candidate/QA, representative content reviews and two previous UI passes were removed from the current tree after a full-tree text-reference and Markdown-link audit. These **35 historical files are recoverable unchanged** in the [pinned pre-cleanup `docs/` tree](https://github.com/DanilaH/squishy-squishes/tree/223c84339c7700b0ae0d53749be86d13fb56f30f/docs); they were not rewritten as current product decisions. The four old UI Overhaul 02 visual reviews were summarized in [`UI_UX_OVERHAUL_02_VISUAL_REVIEW.md`](UI_UX_OVERHAUL_02_VISUAL_REVIEW.md); the two V2 Phone QA reviews were summarized in [`PHONE_QA_PANEL.md`](PHONE_QA_PANEL.md). The originals of those six files are available at the same pinned commit. This keeps unique historical findings retrievable without burdening an active agent with obsolete instructions.

## Editing policy

Keep one current contract per topic; prefer editing the relevant document over a routine new trio of plan/reviews. Preserve reviews with unresolved risks or evidence used by active workflows. Before any further deletion, inspect content, scan references throughout the **entire repo** (not only Markdown links), and pin its original commit for recovery. Do not change gameplay, art or release behavior in a docs-cleanup PR.
