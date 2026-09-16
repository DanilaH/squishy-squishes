# Phaser preview on GitHub Pages

- Current game (original renderer): `https://danilah.github.io/squishy-squishes/`
- Isolated Phaser preview (same Library / V3 app, local web runtime): `https://danilah.github.io/squishy-squishes/phaser/`

The Pages workflow builds the current `dist/index.html` and a separate `dist/phaser/index.html`. The preview uses the Phaser 4 renderer and prefixed `squishy.phaser-pages-preview.*` localStorage keys, so opening it does not read or overwrite the current Pages save/settings. It does **not** load Yandex SDK, test real advertising, or validate player cloud storage. Preview rewarded ads use the non-Yandex runtime; do not interpret them as Yandex acceptance.

The deployment job runs `npm run pages:qa` against the staged Pages tree before pushing `gh-pages`; a failure blocks publication. The browser suite exercises the real Phaser canvas with mouse input, and additionally uses Chromium's browser-dispatched mobile touch input (touch start/move/end and taps) to paint, place a mix-in and sticker, finish Mix, save the full V3 record, reload/reopen it and verify the original save key remains untouched. These are automated Chromium tests using software WebGL, **not** tests on a physical phone.

An independent CI attempt with Playwright Firefox 155 on GitHub's headless Linux runner confirmed `document.createElement('canvas').getContext('webgl2') === null`, despite enabling WebGL preferences; the Phaser studio correctly reported `Phaser studio requires WebGL2.` Consequently this runner cannot validate Firefox game gestures and Firefox is not a green browser coverage claim. A real desktop Firefox/WebGL2 check and actual phone checks remain separate acceptance work. Do not disable the game's WebGL2 requirement or silently replace it with a different renderer to make this CI environment pass.

Verify the actual Pages URL on a phone for touch controls, performance, audio unlock, interruptions/backgrounding, creation, save, and reload. No change to the Yandex DRAFT upload or production renderer is implied. Keep the original Pages root intact until an explicit later switch is requested and accepted.
