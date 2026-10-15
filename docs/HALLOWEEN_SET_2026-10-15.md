# Halloween content set — 15 October 2026

Owner-approved seasonal content, implemented on `feat/halloween-set`; publication is separate.

- Molds: ghost, bat, pumpkin. The existing canonical boundary, field, previews and generic deformation own their geometry; pumpkin ribbing is surface artwork.
- Accessories: cobweb, toy scythe, monster hat, paired bat wings. Wings default behind the body; existing layer, transform, undo and per-piece attachment controls apply.
- Faces: frightened eyes, one stitched eye, toothy grin.
- Bone sticker and bones/candies fillings. Existing stars and candy sticker are reused.
- Room: pumpkin lamp in the detail slot and ghost picture on the wall. Existing furniture slots and responsive geometry remain.
- Four permanent rewarded openings: bat and pumpkin molds, monster hat, bat wings. Existing preview, explicit advertisement action and ownership flow apply. All other new items are free.

Legacy catalog entitlement covers the original 22 reward keys. New seasonal rewards require explicit ownership even for returning players; old capacity and previous ownership remain. Shape IDs, eye/mouth IDs and appended sticker/filling codes retain V3 compatibility.

## Artwork and reproduction

Eight original masters and exact prompts: `assets-src/halloween/source-manifest.json`.
Generated with the built-in OpenAI image generation tool. Green production mattes are extracted deterministically, including enclosed cobweb holes; the existing shared `prepare-image.mjs` pipeline normalizes runtime images. Run `node scripts/prepare-halloween-assets.mjs` from the repo root. The bone master supplies both sticker and filling; the left wing is mirrored into independent pieces. Room conversion supports an optional list of catalog IDs without rewriting unrelated images.

Nine runtime WebP files total 110,264 bytes; no AVIF companions. Original masters stay outside public runtime roots. Runtime hashes, sizes and source hashes are in `assets-src/halloween/runtime-manifest.json`.

## Validation

Clean `npm run release:check` passed: strict TypeScript, CI contract tests, shared image pipeline tests, both production builds and unchanged 5 MiB upload audit. Yandex output: 159 files, 4,731,662 bytes. Local rebuild audits encountered obsolete hashed JS files in the output root. Output cleanup is explicit in Vite configuration; final local size validation uses freshly removed generated roots, and CI independently validates cold roots. The upload budget is unchanged.

`tests/release/halloween.spec.ts` covers stable old codes, contour/attachment validity, runtime alpha/matte checks, EN/RU at 320×568, 568×320 and 1440×900, save/edit/reload and an explicit rewarded opening for a returning player. Local Chromium uses a temporary longer readiness expectation because this environment starts software WebGL slowly; committed readiness assertions remain unchanged. The new multi-toy scenario has a five-minute overall budget after the first desktop EN run exhausted three minutes. A returning-player reward test exposed a legacy-entitlement shortcut in RewardGrants; it now calls the same ownership predicate as the editor, with idempotent opening coverage for all four seasonal rewards.

The required release browser matrix retains every test. Both authored-art files now run in the existing dedicated art group; all other tests remain in eight ordinary shards. Test discovery confirms a disjoint split of 16 art tests and 530 ordinary tests. No tests were removed or skipped for this set.

Real-phone tactile acceptance and hosted Yandex advertisement acceptance are separate from browser regression evidence.

Desktop face choices now use ten columns: all ten eye choices and nine mouth choices fit without a clipped partial row, retaining at least 44 px hit areas. The two changed desktop Decor baselines were regenerated from the actual application and visually reviewed; other baselines remain unchanged. The new desktop content journey explicitly checks panel bounds and hit areas.

Selecting a new rewarded accessory exposed a four-pixel mobile action-row shift when the preview banner appeared. Normal and preview controls now share one action-row CSS variable: 48 px in phone portrait, 44 px in short landscape and 52 px on desktop. In short landscape the existing contextual preview panel scrolls internally; a real touch gesture verifies it, and the reachability audit now traverses that allowed scroll container as well as its inner catalogs. Catalog geometry assertions remain exact. The two full desktop Decor sweeps have a 60-second overall budget for the expanded catalog. All button, hit-area and layout assertions remain, as do the three distinct panel captures; an initially captured Face image that was overwritten on return is omitted. Global assertion timing is unchanged. CI traces showed completed geometry checks and captures before the previous 45-second limit expired during teardown. The canonical migration ID baseline explicitly includes the three appended molds.

Reward-preview captions now read the item label before the empty art-canvas wrapper. The catalog journey asserts the selected accessory name in both languages. The short-landscape preview panel is aligned to its scroll origin, so its category controls are reachable above the object settings rather than centered into negative overflow.
