# Documentation map — Squishy Squishes

**Updated 2026-09-20.** Start with [`../AGENTS.md`](../AGENTS.md) and the current code/tests. The `docs/` directory retains historical planning evidence alongside active contracts; a filename containing `PLAN`, `REVIEW` or `PASS` does **not** imply current scope or approval.

## Working on the current game

| Need | Read first | Important boundary |
| --- | --- | --- |
| Product loop and saved toys | [`SANDBOX_PIVOT_01_MASTER_PLAN.md`](SANDBOX_PIVOT_01_MASTER_PLAN.md), [`SANDBOX_PIVOT_S2_LIBRARY.md`](SANDBOX_PIVOT_S2_LIBRARY.md) | Freeform maker and SaveState V3, **not** recipe/XP gating. Validate status against code and merged PRs; old milestone labels may be stale. |
| Faces, stickers, accessories | [`SANDBOX_PIVOT_S3_DECOR.md`](SANDBOX_PIVOT_S3_DECOR.md), [`SANDBOX_PIVOT_01_ASSET_PLAN.md`](SANDBOX_PIVOT_01_ASSET_PLAN.md) | Real player-created decorations, not background mascots. |
| New authored image/assets | [`RUNTIME_ASSETS.md`](RUNTIME_ASSETS.md), [`STUDIO_ENVIRONMENT_EXECUTION_V7.md`](STUDIO_ENVIRONMENT_EXECUTION_V7.md) | Keep source/provenance and split-art/QA evidence; consult actual merged Studio implementation. |
| Current technical decisions | [`PROJECT_DECISIONS.md`](PROJECT_DECISIONS.md), [`../AGENTS.md`](../AGENTS.md) | Phaser migration is scoped, portrait-first and reversible; no automatic Yandex/main cutover. |
| Phaser migration and preview | [`PHASER_LANDSCAPE_MIGRATION_PLAN.md`](PHASER_LANDSCAPE_MIGRATION_PLAN.md), [`PHASER_BOOTSTRAP_ADOPTION.md`](PHASER_BOOTSTRAP_ADOPTION.md) | The roadmap filename is historical; **landscape redesign is not authorized** by it. See current preview workflows/tests. |
| QA/release | [`../AGENTS.md`](../AGENTS.md), [`../README.md`](../README.md), [release-check workflow](../.github/workflows/release-check.yml), [release browser QA workflow](../.github/workflows/release-browser-qa.yml) | The old `QA_AND_ACCEPTANCE.md` is an early proposal, not a current test plan. Browser CI is not physical-phone or hosted Yandex DRAFT signoff. |

## Historical material: read as evidence, never as a current instruction

The initial recipe-first/XP product was superseded by the freeform sandbox. In particular [`PRODUCT.md`](PRODUCT.md), [`GAMEPLAY.md`](GAMEPLAY.md), [`CONTENT_AND_PROGRESSION.md`](CONTENT_AND_PROGRESSION.md), [`DECISIONS.md`](DECISIONS.md), [`ART_DIRECTION.md`](ART_DIRECTION.md), [`ASSET_PIPELINE.md`](ASSET_PIPELINE.md) and [`QA_AND_ACCEPTANCE.md`](QA_AND_ACCEPTANCE.md) reflect early proposals. `ART_DIRECTION.md` explicitly proposes a **dark lab**, contrary to the subsequently integrated warm Studio environment. Do not use it as an image-generation reference. [`IMPLEMENTATION_ROADMAP.md`](IMPLEMENTATION_ROADMAP.md) preserves useful evidence but still labels S5/S6 as future; those labels are not current status.

The many named `*_REVIEW.md` and `*_IMPLEMENTATION_REVIEW.md` documents record specific historical gates, not standing requirements. The four UI/UX Overhaul 02 visual review iterations have been consolidated into [`UI_UX_OVERHAUL_02_VISUAL_REVIEW.md`](UI_UX_OVERHAUL_02_VISUAL_REVIEW.md). The two Phone QA Panel review documents have been folded into [`PHONE_QA_PANEL.md`](PHONE_QA_PANEL.md), explicitly marked as a historical V2-only tool. Both consolidated docs link to exact pre-cleanup files in Git history for full traceability.

## Editing policy

Keep one current contract per topic; add new decisions to the relevant current document instead of making a new `PLAN → REVIEW → IMPLEMENTATION_REVIEW` trio for routine fixes. Preserve independent reviews only when they contain unresolved risks or unique evidence needed by an active workflow. Before deleting another doc, inspect its content, grep links/code/workflows and record its historical permalink. Avoid refactoring source/game behavior as part of documentation cleanup.
