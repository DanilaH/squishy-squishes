# Release QA 01 — Independent Pre-Implementation Review

**Verdict:** PASS WITH CONSTRAINTS

The project now benefits more from a reproducible browser gate than from another feature pass. The proposed QA scope is appropriate if it stays focused on integration failures and does not distort production code.

## 1. Test both built artifacts, not dev server behavior

The suite must run against `dist` and `dist-yandex` produced by the normal release commands. Dev-server success is not release evidence.

## 2. Keep the Yandex SDK stub minimal and observable

The stub should expose only the SDK contract currently consumed by the pinned runtime:

- environment language;
- LoadingAPI ready;
- GameplayAPI start/stop;
- pause/resume listeners;
- storage;
- ad methods.

Record call counters/state on `window` for assertions. Do not create a fake platform framework.

## 3. QA exclusion must be behavioral as well as static

The existing dist verifier checks the Yandex bundle for the QA marker. Browser QA should additionally assert that no visible QA launcher exists in the Yandex runtime.

## 4. Full-craft automation is worth attempting but must not become a product hack

The real pointer-driven craft smoke is high value. However:

- do not add hidden `completeStage()` hooks;
- do not lower craft thresholds in test mode;
- do not expose private app state to Playwright;
- allow robust loops/retries around mold target timing;
- if WebGL physics timing remains flaky, keep a narrower browser smoke and preserve the real-device manual gate.

## 5. Avoid screenshot approval pretending to be design review

Use geometry assertions for viewport containment and functional state transitions. Screenshot artifacts may aid debugging, but no pixel golden baseline is required yet.

## 6. Browser console policy should be precise

Fail on `pageerror` and failed required resource responses. Capture console errors, but avoid failing on known browser/platform informational warnings unless they correlate with broken behavior.

## 7. Persistence should cover the real repository/storage path

Settings persistence is easy and useful: toggle mute, reload, verify state.

For progression persistence, the strongest evidence is collecting through the real loop then reloading and observing collection/progression UI. Do not seed the save just to claim this path is tested.

## 8. One Chromium target is enough initially

Current release platform risk is predominantly browser/runtime integration and mobile layout, not cross-engine compatibility. Chromium-only keeps CI cost bounded. Add WebKit/Firefox only if release evidence justifies it.

## 9. Pin the test dependency

Use the current stable Playwright Test release rather than floating `latest` in package.json/CI. Browser install should use the package-pinned CLI.

## 10. CI should remain separable from build packaging

Keep `Release Check` responsible for typecheck/build/Yandex archive verification and add `Release Browser QA` as a distinct workflow/job. This makes failures easy to classify and prevents browser installation cost from contaminating simple packaging checks.

## Expected repository impact

Reasonable files:

- `package.json`;
- browser-test config;
- `tests/release/*.spec.ts`;
- small local static-server script;
- `.github/workflows/release-browser-qa.yml`;
- QA docs.

Production `src/` should ideally remain untouched. Any source-code change requested by the tests is a red flag unless it fixes an independently valid product defect.
