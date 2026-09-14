# Phone QA Panel — production test utility

**Date:** 2026-09-14
**Status:** IMPLEMENTED / STRUCTURAL PASS
**Scope:** temporary production QA surface for deployed phone testing during Phase 6/7.

## Goal

Let the tester reach progression/content states immediately on GitHub Pages without replaying the normal grind.

The panel edits the same persisted `SaveStateV2` used by the game. It is not a second progression system and does not require DEV mode.

## Controls

- set Lab Rank directly to any currently defined rank;
- adjust total Lab XP by `-100`, `-25`, `+25`, or `+100`;
- mark any canonical recipe completed/uncompleted;
- complete all recipes;
- clear completed recipes without changing XP;
- full progress reset through the existing hardened reset path;
- show the current rank, total XP, and completion count.

## Persistence model

QA mutations write a valid `SaveStateV2` through the existing save repository and flush it before applying the new runtime state.

To avoid creating another live progression owner, the production QA panel reloads the page after a successful mutation. The normal bootstrap then reloads the exact persisted state through the canonical migration/codec path.

The panel keeps only its open/closed UI preference in `sessionStorage`; game/progression data remains exclusively in the canonical save repository.

## State rules

- XP is clamped to a non-negative integer;
- completed IDs come only from the canonical recipe registry;
- direct rank selection sets XP to that rank's canonical minimum threshold;
- completion flags and rank/XP remain independently editable so locked/completed edge cases can be exercised deliberately;
- `totalCrafts` never becomes lower than the number of completed recipes;
- settings such as mute are untouched.

## UI rules

- one `QA` launcher sits beside the existing Metrics/Mesh/Mute controls;
- the panel is compact and scrollable for phone screens;
- Collection and the main selector are unchanged;
- controls are clearly separated as QA-only tooling;
- panel-open state survives the automatic reload so repeated edits are practical.

## Non-goals

- no stage skipping;
- no renderer/material tuning controls;
- no arbitrary localStorage editor;
- no save-schema bump;
- no new route/state machine;
- no permanent release/admin system.

## Removal rule

This is a temporary testing utility. Release hardening must remove or explicitly disable the production QA panel before a shipping Yandex build.

## Validation

GitHub Actions run `34849890352` passed strict typecheck and production build after one DOM typing correction found by the first run.

## Acceptance

- rank 1–8 can be reached in one tap;
- Rank 8 immediately exposes the Phase 6 premium recipes through normal Collection rules;
- XP +/- controls persist after reload;
- individual/all/none completion edits persist after reload;
- full reset still clears migration-source saves through the existing reset implementation;
- old gameplay/craft tuning is untouched;
- strict typecheck and production build pass.
