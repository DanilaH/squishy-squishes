# Documentation map — Squishy Squishes

**Updated 2026-10-01.** Start with [`../AGENTS.md`](../AGENTS.md) and current code/tests. A filename containing `PLAN`, `REVIEW` or `PASS` does **not** imply current scope or approval.

## Working on the current game

| Need | Read first | Boundary |
| --- | --- | --- |
| Freeform maker / saved toys | [`SANDBOX_PIVOT_01_MASTER_PLAN.md`](SANDBOX_PIVOT_01_MASTER_PLAN.md), [`SANDBOX_PIVOT_S2_LIBRARY.md`](SANDBOX_PIVOT_S2_LIBRARY.md) | SaveState V3; no recipe/XP content gating. Verify milestones against code/merged PRs. |
| Faces, stickers, accessories | [`SANDBOX_PIVOT_S3_DECOR.md`](SANDBOX_PIVOT_S3_DECOR.md), [`SANDBOX_PIVOT_01_ASSET_PLAN.md`](SANDBOX_PIVOT_01_ASSET_PLAN.md) | Player-created decor, not background mascots. |
| Authored art / Studio | [`RUNTIME_ASSETS.md`](RUNTIME_ASSETS.md), [`STUDIO_ENVIRONMENT_EXECUTION_V7.md`](STUDIO_ENVIRONMENT_EXECUTION_V7.md) | The v7 brief is historical execution guidance; compare with merged Studio implementation. Keep approved source/provenance and real-browser QA. |
| Technical decisions | [`PROJECT_DECISIONS.md`](PROJECT_DECISIONS.md), [`../AGENTS.md`](../AGENTS.md) | Production cutover merged in #59; #60 preserves six polish invariants. Hosted Yandex release acceptance is separate. |
| Phaser preview / migration | [`PHASER_LANDSCAPE_MIGRATION_PLAN.md`](PHASER_LANDSCAPE_MIGRATION_PLAN.md), [`PHASER_BOOTSTRAP_ADOPTION.md`](PHASER_BOOTSTRAP_ADOPTION.md) | Migration plans are historical; production now uses Phaser. A landscape redesign remains a separate product decision. |
| QA / release | [`../README.md`](../README.md), [build, browser QA and deployment](../.github/workflows/release-check.yml) | Browser CI is not real-phone or hosted Yandex DRAFT approval. |

## Current Library follow-up

[`LIBRARY_SHOWCASE_2026-10-06.md`](LIBRARY_SHOWCASE_2026-10-06.md) records the
owner-approved collection/table redesign and its pending acceptance. The earlier
free-craft atmosphere release does not establish completion of this new pass.

## Published free-craft scope

[`FREE_CRAFT_IMPLEMENTATION_CHECKLIST_2026-10-06.md`](FREE_CRAFT_IMPLEMENTATION_CHECKLIST_2026-10-06.md) records the published free crafting, new content, seven shapes including a real donut hole, and earlier Library atmosphere. It records implementation and verification separately; deferred ideas are not current tasks. The owner permits targeted internal scrolling in long catalogs/settings, with a fixed page/scene.

## Current improvement direction

[`PLAYFUL_POLISH_PLAN.md`](PLAYFUL_POLISH_PLAN.md) records the owner's 3 October
2026 discussion: reactive faces, sound, accessory motion, palettes and stamps
as the nearest iteration, plus the complete optional idea bank. This is a saved
product plan; the nearest iteration shipped in #69 and accessory depth was
corrected in #70. Reversible creation tools, editing saved toys and free painting shipped in #71–72.
The pastel workshop graphics pass shipped in #75. The owner authorized the
next tactile stage: press/hold/release shipped in #76; the remaining authorized
work shipped in #77: two-finger Squeeze, material response, stroking and sparse
idle blinks. Living-toy/contact/idle shipped in #78. The owner authorized the
next personality, audio, Hall life, decor-preview and workshop-response pass,
shipped in #79. On 5 October the owner authorized fixing scene consistency,
extreme pulls, loading, idle and the crowded editor; this shipped in #80.
Visible/returning surface grabs, local pressure, volume cues and release shipped
in #81. Strawberry silhouette/relief, side-aware facial response and stronger
material identity shipped in #82. Stiff Metallic, longer Jelly pulls and
full-viewport tracking of owned mouse/touch gestures shipped in #83.
Distinct press, hold, pull, pinch and return profiles for all six materials shipped
in #84. The owner authorized a follow-up to strengthen foam imprint, Pearl
rebound/compression, Holo tension and local Metallic pressure; its contract is
in PROJECT_DECISIONS.
The full optional
idea bank is not a release checklist.

## Latest independent review

[`PROJECT_REVIEW_2026-10-01.md`](PROJECT_REVIEW_2026-10-01.md) records the browser review, scoped polish, verification limits and improvement priorities. It is evidence and recommendations, not authorization for a redesign.

## Historical material and recovery

The initial recipe/XP product was superseded by the freeform sandbox. [`PRODUCT.md`](PRODUCT.md), [`GAMEPLAY.md`](GAMEPLAY.md), [`CONTENT_AND_PROGRESSION.md`](CONTENT_AND_PROGRESSION.md), [`DECISIONS.md`](DECISIONS.md), [`ART_DIRECTION.md`](ART_DIRECTION.md), [`ASSET_PIPELINE.md`](ASSET_PIPELINE.md) and [`QA_AND_ACCEPTANCE.md`](QA_AND_ACCEPTANCE.md) are **early proposals, not current instructions**. In particular, the dark-lab art proposal is incompatible with the accepted warm Studio environment. [`IMPLEMENTATION_ROADMAP.md`](IMPLEMENTATION_ROADMAP.md) preserves evidence but its old S5/S6 labels are stale.

The old `PLAN → REVIEW → IMPLEMENTATION_REVIEW` chains for recipe catalog 7A/7B, art/audio, interaction passes, skeleton, renderer shape reuse, progression reviews, release candidate/QA, representative content reviews and two previous UI passes were removed from the current tree after a full-tree text-reference and Markdown-link audit. These **35 historical files are recoverable unchanged** in the [pinned pre-cleanup `docs/` tree](https://github.com/DanilaH/squishy-squishes/tree/223c84339c7700b0ae0d53749be86d13fb56f30f/docs); they were not rewritten as current product decisions. The four old UI Overhaul 02 visual reviews were summarized in [`UI_UX_OVERHAUL_02_VISUAL_REVIEW.md`](UI_UX_OVERHAUL_02_VISUAL_REVIEW.md); the two V2 Phone QA reviews were summarized in [`PHONE_QA_PANEL.md`](PHONE_QA_PANEL.md). The originals of those six files are available at the same pinned commit. This keeps unique historical findings retrievable without burdening an active agent with obsolete instructions.

## Editing policy

Keep one current contract per topic; prefer editing the relevant document over a routine new trio of plan/reviews. Preserve reviews with unresolved risks or evidence used by active workflows. Before any further deletion, inspect content, scan references throughout the **entire repo** (not only Markdown links), and pin its original commit for recovery. Do not change gameplay, art or release behavior in a docs-cleanup PR.
