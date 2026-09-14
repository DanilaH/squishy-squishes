# Release Candidate 01 — independent pre-review

Date: 2026-09-14
Verdict: PASS WITH SCOPE LOCK

## Why this shape of pass

The game already has the content/interaction proof. The remaining risk is productization, not invention. RC01 should therefore wrap and harden the existing loop rather than reopen renderer, craft tuning, or progression.

## Architecture

Use the existing shared-kit `PlatformRuntime` as the single platform seam. It already owns Yandex SDK boot, LoadingAPI, GameplayAPI, pause/resume, ads, storage, and analytics contracts. Do not duplicate SDK handling in app code.

Add release telemetry/monetization as an observer around the existing DOM state machine. This avoids adding analytics/ad branches inside `VerticalSliceApp`.

## Monetization rule

Fullscreen ads are valid only after a completed craft has fully returned to `select`. Add local session grace, minimum craft count, and cooldown. The Yandex adapter already blocks gameplay activity while the ad is open.

No timer-driven ad calls, rewarded ads, or sticky banners in this pass.

## UI rule

Prefer a final CSS/product chrome layer over a rewrite of the 60KB craft class. Hide internal tools in Yandex production. Preserve the existing Collection data model and make it read as the recipe browser through presentation.

## Release rule

Yandex archive assets must be relative. Pages keeps the repository subpath. Build both variants in CI and verify the Yandex output rather than relying on manual packaging.

## Stop rules

Stop if the pass requires:

- renderer/physics changes;
- save migration;
- new gameplay state;
- a second Yandex SDK wrapper;
- ad calls during tactile stages;
- new content just to make the UI feel complete.
