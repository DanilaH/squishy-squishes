# Phaser jelly UI — small icon intake contract

This is an **integration checklist**, not a request for a new UI kit. The `/phaser/` preview already has working HTML buttons, localized labels, focus and touch targets. Keep all of that: icons are supplementary visual elements, never baked-in English text, and no icon asset is required to keep a control usable.

## What to look for

**One coherent icon family**, not individual images from unrelated packs. Start with these ten concepts; reuse a single undo/clear icon across stages:

| Icon | Existing control / integration hook | Display target |
| --- | --- | --- |
| New / plus | `[data-library-new]`, `[data-action="new"]` | 20–24 CSS px |
| Ideas / lightbulb | `[data-library-ideas]`, `[data-ideas-back]` | 20–24 CSS px |
| Library / shelf or home | `[data-action="home"]` | 20–24 CSS px |
| Back arrow | `[data-action="stage-back"]`, `[data-action="finish-back"]` | 18–20 CSS px |
| Brush | `[data-paint-tool="paint"]` | 20–24 CSS px |
| Eraser | `[data-paint-tool="erase"]` | 20–24 CSS px |
| Undo | `[data-action="paint-undo"]`, `mixin-undo`, `decor-undo` | 18–20 CSS px |
| Clear / bin | `[data-action="paint-clear"]`, `mixin-clear`, `decor-clear`, `[data-library-delete-id]` | 18–20 CSS px |
| Save / check | `[data-action="save"]` | 20–24 CSS px |
| Sound on/off pair | `[data-action="mute"]`, `[data-library-mute]` | 18–20 CSS px |

**Optional only if already in the chosen pack:** brush-size dots, rewarded ad / extra shelf slots. Mix-in glyphs, face parts, stickers, accessories and material orbs already have distinct visual content: don't replace them with a random icon family in this pass. Continue/Play can stay text-only on their wave-shaped buttons.

## Source and export

- Preferred source: separate, editable SVGs sharing one `viewBox` convention (ideally `0 0 24 24`), stroke width and corner style. Flat, readable silhouettes with no embedded text, external references, scripts, fonts or CSS imports. A transparent PNG is acceptable at **at least 96×96 actual pixels per icon** for a 24 CSS px target at DPR 3–4. Do not upsample 32px raster files.
- On honey buttons: ivory/white icon with a restrained amber outline or shadow, matching the approved button caption. On pale cards / tool tiles: dark plum. Prefer icons that can be recolored from one source; do not hunt separate art for every pressed/disabled state.
- Keep source masters outside runtime assets. Once a pack is approved, optimize only the selected icons into the same build-aware `/phaser/` asset path as the jelly controls. Batch/predecode any immediately reachable image icons with `preloadJellyUi` before setting `data-jelly-ui-ready`; retain a text-only fallback if one fails. See `docs/RUNTIME_ASSETS.md`. Do not silently defer these downloads until after Game Ready.
- Keep button elements and `aria-label` / visible EN/RU text. Integrate through the **existing selectors above**; do not redesign stage markup, add an icon framework, or change the main/Yandex entrypoints just to place an icon.

## What to send me

Put the original files in `assets-inbox/ui-icons/` (or upload one original archive), plus the original source URL, creator, license text / receipt and whether commercial-game use, editing and attribution are allowed. A screenshot of the pack without separate files or rights evidence is not integration-ready. I'll choose the smallest consistent subset, check actual phone-size readability and record provenance before including any new asset in a release.
