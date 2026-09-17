# Phaser jelly UI — icon intake and provenance

The `/phaser/` Pages preview retains native HTML buttons, EN/RU labels, keyboard focus, existing click handlers and touch targets. Icons supplement text; none is baked into a button background. The main/Yandex entrypoints are unaffected by this visual experiment.

## Integrated subset

The owner uploaded the Nieobie icon collection in `biba/no-padding` and `biba/padding` on `main` in commit [`0dbc735`](https://github.com/DanilaH/squishy-squishes/commit/0dbc7355664c2a7d6fbdc27263b6ea9f6c19d6b0). The preview references **nine** `biba/no-padding/128px/white` PNG alpha masks: plus (`New`), book (`Ideas`), house (`Home`), save, brush, eraser, undo, volume and mute. Their CSS masks are in `src/experiments/phaser/jellyIconPreview.css`; only those referenced images enter the build. `jellyUiPreload.ts` predecodes the reachable UI art and icons; text/CSS controls remain usable as fallback if decoding fails. All captions remain localized and accessible.

The icons are attributed to [Nieobie/game-icon-pack](https://github.com/Nieobie/game-icon-pack). Its [CC0 1.0 LICENSE](https://github.com/Nieobie/game-icon-pack/blob/b1a5fec8b68c99e7b46484db707610ab2414ad4c/LICENSE) and [README at the same revision](https://github.com/Nieobie/game-icon-pack/blob/b1a5fec8b68c99e7b46484db707610ab2414ad4c/README.md) are pinned for provenance. CC0 is a public-domain dedication with a fallback license that permits commercial reuse and modification; attribution is not a condition, but keep this source record. **The PNGs' byte-for-byte derivation from the upstream SVG source has not been independently established**; confirm the source of the exported archive before commercial release.

## Scope deliberately deferred

- Keep mix-ins, facial expressions, stickers, accessories, material orbs and shape silhouettes as their own visual representations. Do not replace meaningful toy art with generic symbols.
- The existing back arrows, clear/delete text and Continue/Play labels remain usable without new icons. Do not force an icon into a button when its caption or available width would suffer.
- Honey jelly background PNG and extracted WebP buttons have a separate owner-supplied origin; **the right to use and modify that art commercially is not yet documented here**. Obtain the original source/license/receipt and record it before Yandex release.

## Review and constraints

Check Cyrillic captions and icon alignment at 320px and 390px portrait, short landscape and desktop, including pressed, disabled and focus states. The preview's Playwright audit covers the full stage flow, DOM hit targets and overflow, but it does not replace a real-phone visual and touch review. The PR should stay draft until the owner approves the design; it is not an automatic Yandex cutover.
