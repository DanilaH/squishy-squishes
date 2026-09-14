# Squishy Squishes — Release QA 01

**Status:** ACTIVE BOUNDED SPEC

## Goal

Convert the highest-value release checks from `QA_AND_ACCEPTANCE.md` into a reproducible real-browser gate against the actual production builds.

This pass does not invent gameplay or polish. It builds confidence around the product that already exists and exposes concrete release defects to fix.

## Why now

The project already has:

- 6 production shapes / 24 canonical recipes;
- recipe-first UI;
- bounded reward presentation/audio;
- separate Pages and Yandex builds;
- platform lifecycle and ad seams.

The remaining engineering risk is integration under real browser behavior: responsive layout, runtime lifecycle, save/settings persistence, production packaging and one complete tactile loop.

## Tooling

Use Playwright Test with Chromium only for this first release gate.

Rationale:

- real WebGL/pointer/browser lifecycle instead of DOM-only unit simulation;
- mobile viewport emulation;
- console/page-error capture;
- deterministic Yandex SDK stub before application boot;
- one runner can exercise both `dist` and `dist-yandex`.

Do not add a broad cross-browser matrix until Chromium proves useful and stable.

## Production targets under test

### Pages build

Serve the actual `dist` output under `/squishy-squishes/`.

Validate:

- app boots with no page errors;
- recipe-first select shell is visible;
- old Shape / Color / Texture builder is absent;
- recipe browser contains exactly 24 canonical recipe cards;
- QA control remains available on the development/Pages artifact for phone testing;
- representative phone and short-landscape layouts keep primary controls in the viewport.

### Yandex build

Serve the actual `dist-yandex` output under a neutral path with relative assets.

Install a deterministic `YaGames` stub before app scripts execute.

Validate:

- app boots without loading external `/sdk.js` when `YaGames` already exists;
- `LoadingAPI.ready()` is called exactly once;
- `GameplayAPI.start()` becomes active after bootstrap;
- opening the Recipe Book stops gameplay marking;
- closing the Recipe Book resumes gameplay marking;
- QA control/module is absent;
- RU language is selected when SDK language is `ru`;
- mute/settings survive reload through SDK storage;
- no unexpected page errors.

## Full craft smoke

Automate one fresh-save standard recipe through the real accepted interaction path:

1. start the default canonical recipe;
2. cover the paint surface with pointer movement;
3. stretch/mix using real pointer travel;
4. hit mold targets until completion;
5. wait for reveal/test;
6. collect;
7. verify return to select;
8. verify collection/progression persistence after reload.

The test must interact with the same DOM/WebGL surfaces the player uses. Do not add test-only progression shortcuts to production gameplay for this smoke.

If the automated gesture proves fundamentally flaky because it depends on rendered physics timing, reduce only that assertion and document the remaining manual requirement; do not weaken production mechanics to satisfy the test.

## Responsive smoke

At minimum:

- phone portrait around 390×844;
- phone landscape around 844×390;
- desktop short-height around 1280×600.

Check that key visible controls/recipe dock stay within viewport bounds. This is geometry smoke, not screenshot-pixel approval.

## Failure policy

The browser gate fails on:

- uncaught page errors;
- failed required network resources;
- wrong recipe count;
- Yandex lifecycle contract break;
- QA leakage into Yandex build;
- primary controls outside viewport;
- full craft path unable to reach collect under deterministic input;
- save/settings persistence failure.

Console warnings may be captured separately but should not automatically fail unless they represent product defects.

## CI integration

Add a dedicated permanent `Release Browser QA` workflow on PRs and main.

Pipeline:

1. install dependencies;
2. install Chromium + required Linux dependencies;
3. run existing `release:check` to build/verify both production targets;
4. run Playwright browser suite against those exact outputs;
5. upload Playwright report/trace only on failure or as lightweight artifact.

Do not duplicate Yandex ZIP packaging logic already owned by `Release Check`.

## Explicit non-goals

- no visual-regression golden screenshots in this pass;
- no Firefox/WebKit matrix yet;
- no synthetic load/performance benchmark pretending to be phone performance;
- no ad impression against real Yandex inventory;
- no product-code hooks solely for tests;
- no gameplay/progression tuning to make tests easier.

## Exit

Structural exit:

- browser QA suite green in CI on a PR;
- permanent workflow present;
- Pages/Yandex boot/lifecycle/responsive/persistence smoke green;
- one real craft path green if deterministic browser input supports it.

Manual acceptance remains necessary for tactile feel, visual taste, audio fatigue and real-device performance. Automation reduces grinding; it does not replace product judgment.
