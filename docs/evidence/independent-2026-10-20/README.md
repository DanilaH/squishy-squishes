# Independent audit evidence — 20 October 2026

Target: production main `f4d97c47453a7f6c55b70498981200215593c704`.
All saves are synthetic fixtures. No production runtime was changed.

`scenario-results.json` consolidates the latest corrected result per scenario from the final, followup, confirm and touch-timing runs. Earlier harness selector/storage-decoding failures were corrected and superseded. Failing audit assertions are intentional reproductions, not a passing release suite. AUDIT-10 desktop is an intermittent software-renderer performance observation, not a confirmed physical-device bug.

Run diagnostics with `QA_CHROMIUM_PATH=/path/to/chromium AUDIT_OUTPUT_DIR=/tmp/squishy-audit npx playwright test --config=playwright.audit.config.ts`. A WebGL2-capable browser is required. The test runner uses isolated synthetic browser storage. Tests under `tests/audit` are outside the standard release suite.

Screenshots and JSON use matching descriptive prefixes. The sticker screenshots intentionally place every sticker to inspect object names; this is not a suggested toy composition. `simulation-108.json` records the deterministic 18-shape × 6-material stress matrix. `material-profiles.json` contains viewport/frame-dependent displacement observations, not physical material measurements. `ideas-timing.json` uses Chromium 153, SwiftShader, 1440×900, hasTouch=true; it is not a phone benchmark.

Supplementary unchanged regression tests passed: donut hole (2), audio (1), living-toy touch/pause/alignment (3), personality/Hall/decor preview (3), 1000-item catalog raster budget (1), capacity-ad cancel/free replacement (1), earned-reward journal retry (1). `npm run release:check` passed. Hosted Yandex real ads, physical phones and native-GPU FPS were not verified in this audit.
