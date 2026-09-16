# Phaser preview on GitHub Pages

- Current game (original renderer): `https://danilah.github.io/squishy-squishes/`
- Isolated Phaser preview (same Library / V3 app, local web runtime): `https://danilah.github.io/squishy-squishes/phaser/`

The Pages workflow builds the current `dist/index.html` and a separate `dist/phaser/index.html`. The preview uses the Phaser 4 renderer and prefixed `squishy.phaser-pages-preview.*` localStorage keys, so opening it does not read or overwrite the current Pages save/settings. It does **not** load Yandex SDK, test real advertising, or validate player cloud storage. Preview rewarded ads use the non-Yandex runtime; do not interpret them as Yandex acceptance.

The deployment job runs `npm run pages:qa` against the staged Pages tree before pushing `gh-pages`; a failure blocks publication. Verify the actual Pages URL on a phone for touch controls, performance, audio unlock, interruptions/backgrounding, creation, save, and reload. The browser QA uses desktop Chromium with a mobile viewport and a software WebGL implementation; it does not replace a real phone check.

No change to the Yandex DRAFT upload or production renderer is implied. Keep the original Pages root intact until an explicit later switch is requested and accepted.
