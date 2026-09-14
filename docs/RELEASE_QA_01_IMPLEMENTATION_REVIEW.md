# Release QA 01 — Independent Implementation Review

**Verdict:** STRUCTURAL PASS — REAL-DEVICE PRODUCT ACCEPTANCE STILL PENDING

Release QA 01 achieved its engineering goal: a reproducible Chromium gate now exercises the actual Pages and Yandex production artifacts, including one complete fresh-save craft through the accepted player interaction path.

## Evidence

Validation run `34878254553` completed successfully on commit `a0c65bb422c6d45ff22dbbadb1047c2f92cbed7e`.

The run passed:

- strict TypeScript;
- Pages production build;
- Yandex production build;
- Yandex dist verification;
- all **6/6 Playwright release tests**.

Browser suite result: **6 passed (49.3s)**.

## What the browser gate now proves

### Pages artifact

- the real `dist` output boots successfully;
- the recipe-first shell is present;
- the old Shape / Color / Texture construction controls are absent;
- the Recipe Book contains exactly 24 canonical recipes and 24 generic recipe thumbnails;
- the Pages-only QA launcher is present;
- primary select controls remain inside the viewport at representative portrait, landscape and short-desktop sizes;
- no required browser resource/page failures occur in these checks.

### Yandex artifact

Against the real `dist-yandex` output and a deterministic pre-boot SDK stub:

- RU locale is selected from the SDK language;
- the QA launcher is absent;
- `LoadingAPI.ready()` is called exactly once;
- gameplay becomes active after bootstrap;
- opening the Recipe Book stops gameplay marking;
- closing it resumes gameplay marking;
- mute/settings persist across reload through the runtime storage path;
- no required browser resource/page failures occur in the tested flow.

### Full craft smoke

A fresh save now completes the default canonical recipe through real player-facing inputs:

`select → paint → mix/stretch → mold → reveal/test → collect → select`

The smoke then reloads the production artifact and verifies:

- collection UI still reports `1 / 24`;
- exactly one completed recipe exists;
- the completed recipe exposes both `Make again` and `Squeeze`.

No save seeding, private app-state mutation or test-only stage-completion hook is used.

## Failure investigation history

Two failed validation attempts were useful harness findings rather than product defects.

### 1. Animated mold target vs Playwright actionability

Initial failure:

- Playwright `locator.click()` waited for `.mold-target` to become geometrically stable;
- the production target intentionally animates/respawns;
- the click timed out even though the target and production handler were healthy.

Resolution:

- the test dispatches the same bubbling `pointerdown` consumed by the production mold-target listener;
- target timing and mold progress constants were not changed;
- no hidden completion API was added.

### 2. Overlong synthetic Mix gesture

Second failure:

- the harness held the pointer down across up to 72 Playwright/CDP mouse moves per burst;
- individual protocol moves are much slower than physical pointer samples;
- the test exhausted its timeout before releasing the pointer;
- production Mix transitions only after sufficient progress **and release**, so the harness was preventing its own transition.

Resolution:

- Mix now uses bounded normal stretch bursts;
- each burst contains real browser pointer travel, then releases and checks for the normal transition;
- the gesture remains comfortably above the accepted Mix compression threshold;
- production Mix thresholds, physics and stage semantics remain unchanged.

## Production-code integrity

Release QA 01 does **not** require changes to production `src/` code.

Specifically, it introduces no:

- `completeStage()` or other hidden test hook;
- private app-state exposure;
- threshold reduction;
- save/progression bypass;
- renderer/shader/physics change;
- alternate test-mode gameplay path.

This is the correct boundary: the harness adapts to real product behavior, not the reverse.

## Permanent CI shape

`Release Browser QA` is intentionally separate from the existing fast `Release Check` workflow.

It runs on:

- pull requests targeting `main`;
- pushes to `main`.

The browser workflow:

1. installs dependencies;
2. installs pinned Chromium through the pinned Playwright package;
3. runs the existing release build/verifier path;
4. serves `dist` and `dist-yandex` as separate production roots;
5. runs the six release-browser checks;
6. uploads Playwright traces/screenshots/reports only on failure.

This gives future release patches a repeatable integration gate without making ordinary packaging dependent on browser installation.

## What is still not proven

Automation does not prove product taste or real-device feel.

The following remain a hard manual product gate:

- portrait and landscape comfort on an actual phone;
- Mushroom and Paw hands-on shape/craft acceptance;
- representative Jelly reward presentation;
- representative Holo/Pearl showcase reward presentation;
- 3–5 consecutive crafts with sound enabled to judge fatigue;
- tactile responsiveness, frame pacing and thermal behavior on a real phone;
- Pages QA panel usability on the phone.

## Final decision

**Release QA 01 engineering passes.**

Do not reopen catalog architecture, progression or tactile tuning based on the QA harness. The next legitimate gate is hands-on phone acceptance. Any defect found there should become a small evidence-driven release patch rather than another broad feature phase.
