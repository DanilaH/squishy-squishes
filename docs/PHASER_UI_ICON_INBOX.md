# Phaser jelly UI — icon intake and provenance

The `/phaser/` Pages preview retains native HTML buttons, EN/RU labels, keyboard focus, existing click handlers and touch targets. Icons supplement text; none is baked into a button background. The main/Yandex entrypoints are unaffected by this visual experiment.

## Integrated subset

The owner uploaded the Nieobie icon collection in `biba/no-padding` and `biba/padding` on `main` in commit [`0dbc735`](https://github.com/DanilaH/squishy-squishes/commit/0dbc7355664c2a7d6fbdc27263b6ea9f6c19d6b0). The preview references **nine** `biba/no-padding/128px/white` PNG alpha masks: plus (`New`), book (`Ideas`), house (`Home`), save, brush, eraser, undo, volume and mute. Their CSS masks are in `src/experiments/phaser/jellyIconPreview.css`; only those referenced images enter the build. `jellyUiPreload.ts` predecodes the reachable UI art and icons; text/CSS controls remain usable as fallback if decoding fails. All captions remain localized and accessible.

The uploaded icon collection is attributed to [Nieobie/game-icon-pack](https://github.com/Nieobie/game-icon-pack). Its [CC0 1.0 LICENSE](https://github.com/Nieobie/game-icon-pack/blob/b1a5fec8b68c99e7b46484db707610ab2414ad4c/LICENSE) and [README at the same revision](https://github.com/Nieobie/game-icon-pack/blob/b1a5fec8b68c99e7b46484db707610ab2414ad4c/README.md) are pinned as upstream evidence. CC0's text permits commercial reuse and modification under the waiver/fallback, with no mandatory attribution; retain this source record nevertheless. **The uploaded PNGs' derivation from that upstream source has not been independently established**. Confirm the actual export/archive source before relying on this license for commercial release.

## Scope deliberately deferred

- Keep mix-ins, facial expressions, stickers, accessories, material orbs and shape silhouettes as their own visual representations. Do not replace meaningful toy art with generic symbols.
- The existing back arrows, clear/delete text and Continue/Play labels remain usable without new icons. Do not force an icon into a button when its caption or available width would suffer.
- The extracted honey jelly WebP buttons and their original source sheet were separately owner-supplied; **their commercial-use and modification rights are not established by the icon pack's CC0 license**. Record the source/license/receipt before shipping those buttons in the Yandex release.

## Review and constraints

Check Cyrillic captions and icon alignment at 320px and 390px portrait, short landscape and desktop, including pressed, disabled and focus states. The preview's Playwright audit covers the full stage flow, DOM hit targets and overflow, but it does not replace a real-phone visual and touch review. The PR should stay draft until the owner approves the design; it is not an automatic Yandex cutover.
