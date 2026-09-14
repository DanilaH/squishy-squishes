# Release Candidate 01 — independent implementation review

**Date:** 2026-09-14
**Base:** `main@c990d442b94a3b7982655866b96962ac3dae100c`
**Verdict:** STRUCTURAL PASS — EXTERNAL PUBLICATION GATES REMAIN

## Scope review

The RC01 production diff does not touch catalog content, progression, shapes, renderer, shaders, spring physics, craft timing, audio or save schema.

The implementation is limited to:

- release presentation CSS;
- bootstrap/runtime release wiring;
- a session observer for lifecycle/analytics/ad eligibility;
- Yandex-specific build configuration;
- release verification/CI;
- current source-of-truth documentation.

This matches the scope lock: productize the accepted game rather than reopen gameplay architecture.

## Presentation — PASS

`src/release.css` is an override layer on top of the accepted craft UI. It improves product chrome, Collection/catalog presentation and mobile density without changing craft geometry or interaction math.

The Yandex release presentation hides internal engineering/reset controls. The Pages build retains the phone QA progression convenience for later hands-on inspection.

## Platform lifecycle — PASS

RC01 continues to use the pinned `mini-games-kit` Yandex runtime. No second SDK wrapper was added.

Collection visibility is observed outside `VerticalSliceApp` and calls `runtime.activity.setGameplayDesired(false/true)`. Review of the pinned `GameplayActivityCoordinator` confirms this changes GameplayAPI start/stop markup without emitting an external blocked-state event, so opening Collection does not recursively close or disable itself.

Visibility, platform pause and ad blockers remain on the separate `setBlocked` path and continue to disable gameplay input through the existing app subscription.

## Analytics — PASS

The release session tracks a deliberately small funnel:

- session ready;
- catalog open/close;
- craft start;
- craft collect;
- catalog recipe start;
- recipe revisit;
- mute toggle;
- interstitial request/result.

Optional `VITE_METRICA_COUNTER_ID` enables the pinned kit's Yandex Metrica adapter. Missing or invalid configuration falls back safely and never blocks app boot.

## Interstitial policy — PASS

Interstitial requests are Yandex-only and can only be evaluated after the state machine transitions from `collect` back to `select`.

Local eligibility additionally requires:

- 120 seconds initial session grace;
- three completed craft loops between requests;
- 150 seconds local request cooldown;
- Collection closed;
- no ad already in flight.

The pinned ads adapter owns fullscreen blocking through the shared activity coordinator. No rewarded or sticky ad path is introduced.

## QA / internal tooling — PASS

The phone QA panel is now dynamically imported only when the build is not Yandex, unless explicitly overridden with `VITE_ENABLE_QA=1` for testing.

The Yandex dist verifier scans the emitted release and rejects the build if the QA storage marker is present. Validation proved that the normal Yandex build excludes the QA module from the bundle.

## Build / packaging — PASS

Validation run `34861660115` executed the exact RC01 source transform and passed:

- `git diff --check`;
- dependency installation;
- strict TypeScript;
- normal production build;
- Yandex production build;
- Yandex dist verifier;
- validated-source artifact export.

The validated source artifact was then committed back to the branch unchanged.

The Yandex verifier confirms:

- `dist-yandex/index.html` exists;
- GitHub Pages base path does not leak into the archive build;
- asset references are not absolute-root paths;
- `/sdk.js` is present for Yandex archive runtime boot;
- phone QA code is absent;
- encoded dist remains below the bounded 5 MiB budget.

Permanent `Release Check` CI repeats the full release validation on PR/main and packages `squishy-squishes-yandex.zip` with the dist contents at archive root.

## Documentation — PASS

README and implementation roadmap now describe the actual state:

- Phase 7 engineering complete at 6 shapes / 24 recipes;
- catalog frozen pending release evidence;
- RC01 is the active release contract;
- Phase 7B manual phone review is deferred, not silently marked accepted;
- Yandex console/upload/moderation remain external gates.

## Remaining external gates

Repository engineering cannot truthfully complete:

- representative final phone smoke;
- optional production Metrica counter selection;
- Yandex project metadata/store assets;
- upload to Yandex DRAFT;
- moderation outcome;
- live ad behavior observation.

These should produce a bounded RC02 only if real evidence requires one.

## Final verdict

**STRUCTURAL PASS — EXTERNAL PUBLICATION GATES REMAIN.**

RC01 converts the completed game into a reproducible dual-target release build without reopening validated gameplay/content systems.