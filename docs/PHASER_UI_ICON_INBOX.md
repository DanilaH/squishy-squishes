# Phaser jelly UI — icon intake and provenance

The isolated `/phaser/` Pages preview retains native HTML buttons, EN/RU labels, keyboard focus, existing click handlers and touch targets. Icons supplement text; none is baked into a button background. This document is an asset-source and rights record, **not** a mandate to move the Yandex entrypoint.

## Integrated icon subset

The owner uploaded a large PNG icon collection in `biba/no-padding` and `biba/padding` in commit [`0dbc735`](https://github.com/DanilaH/squishy-squishes/commit/0dbc7355664c2a7d6fbdc27263b6ea9f6c19d6b0). The preview uses **nine** `biba/no-padding/128px/white` alpha masks: plus (New), book (Ideas), house (Home), save, brush, eraser, undo, volume and mute. Their CSS masks are in `src/experiments/phaser/jellyIconPreview.css`; `jellyUiPreload.ts` decodes the same nine paths. Only referenced masks enter the compiled bundle; text/CSS controls remain fallback.

For repository hygiene, unused padded exports, 64px/256px sets and the black 128px set were removed from the **current worktree**. The referenced white 128px set remains at unchanged paths. The complete original icon pack is recoverable unchanged from the pinned [`0dbc735` source commit](https://github.com/DanilaH/squishy-squishes/tree/0dbc7355664c2a7d6fbdc27263b6ea9f6c19d6b0/biba). Do not silently restore 9,000+ unused files for one new icon: copy only the required asset after checking its source, license and runtime need.

Possible original source: [Nieobie/game-icon-pack](https://github.com/Nieobie/game-icon-pack). Its [CC0 1.0 LICENSE](https://github.com/Nieobie/game-icon-pack/blob/b1a5fec8b68c99e7b46484db707610ab2414ad4c/LICENSE) and [README](https://github.com/Nieobie/game-icon-pack/blob/b1a5fec8b68c99e7b46484db707610ab2414ad4c/README.md) are pinned for comparison. **The uploaded PNGs have not been independently proven to derive from that repository.** Verify the real export/source before asserting commercial rights.

## Jelly UI source sheets and master recovery

The five honey/red WebP button assets are derived by `scripts/build-jelly-ui.mjs` from the retained owner-supplied `biba/ChatGPT Image Sep 17, 2026, 04_27_10 PM.png`, guarded by an explicit SHA-256. Keep that PNG and the compiled button assets: they are used by source/tooling. Three owner-supplied colourway PNG atlases (`biba/game ui jelly {green,honey,purple}.png`) also remain because [draft PR #53](https://github.com/DanilaH/squishy-squishes/pull/53) uses them for selective extraction.

The three large `biba/game ui jelly {green,honey,purple}.eps` files are **not read by the current build or tests**, but may be the only editable source artwork for their respective colourways. **Retain these EPS masters** until their provenance and a safe external archival destination are independently established; do not treat lack of runtime references as grounds to discard an editable original. The seven duplicate `biba/studio-*.png` files were removed only after exact blob matches were confirmed at `src/experiments/phaser/studio-assets/`; the **playable Studio sprites remain unchanged**. Full prior source files also remain in the [exact pre-cleanup `biba/` tree](https://github.com/DanilaH/squishy-squishes/tree/223c84339c7700b0ae0d53749be86d13fb56f30f/biba). Removing an unused copy is not proof of commercial rights.

## Boundaries and acceptance

Keep facial expressions, stickers, accessories, mix-ins and shape silhouettes as their own product visuals, not generic toolbar icons. Existing Back/Clear/Delete controls are usable without decorative icon additions. Retain RU/EN, 320/390 portrait, short landscape and desktop tap/focus/disabled states and real-phone acceptance. The honey jelly source art's commercial and derivative rights remain unverified independently of the icon collection.
