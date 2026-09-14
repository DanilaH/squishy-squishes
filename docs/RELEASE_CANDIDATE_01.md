# Release Candidate 01

Date: 2026-09-14
Status: ACTIVE BOUNDED SPEC

## Goal

Turn the 6-shape / 24-recipe build into a release candidate without adding content, gameplay systems, save changes, or renderer/physics work.

Manual phone review of Phase 7B is deferred. It remains a smoke check before publication, not an engineering blocker.

## Scope

- Final release presentation layer around the proven craft DOM.
- Collection becomes the visually primary recipe catalog.
- Hide engineering/reset/QA controls in Yandex production while preserving Pages QA.
- Reuse the pinned shared-kit Yandex runtime, ads, analytics, and activity coordinator.
- Mark Collection/menu time as non-gameplay.
- Small analytics funnel: ready, catalog open, craft start, collect, revisit, mute, ad result.
- Optional environment-configured Yandex Metrica; missing counter never blocks play.
- Interstitial only after a completed loop returns to select, with grace period, craft-count gate, and cooldown.
- No rewarded ads or sticky banner in RC01.
- GitHub Pages keeps its repository base path.
- Yandex archive build uses relative assets and VITE_PLATFORM=yandex.
- Add automated Yandex dist verification and permanent release CI.

## Non-goals

No new recipes, shapes, materials, fillings, ranks, progression tuning, save migration, cloud-save rollout, leaderboards, rewarded economy, shared-kit upgrade, or renderer rewrite.

## Engineering acceptance

- strict typecheck green;
- normal build green;
- Yandex build green;
- relative Yandex asset paths verified;
- Yandex build does not activate QA/debug/reset UI;
- Collection uses the existing gameplay activity coordinator;
- ads cannot fire during active craft stages;
- final diff independently reviewed;
- Pages deployment green after merge.
