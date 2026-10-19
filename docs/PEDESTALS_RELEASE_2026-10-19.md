# Rewarded pedestal release

The owner approved twelve authored stands and publication of the complete content set on 17 October, and resumed recovery on 19 October. Intermediate work is retained on `checkpoint/rewarded-pedestals`; the release goes through PR #103 and the existing main/Pages workflow.

Standard stays free and palette-tinted. UFO, seashell, mushroom stump, aquarium, cake, witch's cauldron, pumpkin, ghost, amethyst, ice, donut and throne cushion keep their own authored colors. No new color picker, currency, rarity, physics or animation system.

## Player and storage contract

Style room → Pedestals → free in-place preview → video icon plus explicit “Unlock for an ad” → permanent named ownership → Done saves the room selection. Closing/unavailable ads do not grant ownership. Cancel restores the room but retains an already earned reward. Remove preview restores the previous owned stand. Both the editor and bootstrap persistence guard reject an unpaid preview.

The existing RewardGrants journal handles duplicate callbacks and storage failures; retrying an earned reward does not show a second ad. Twelve `pedestal:` keys append to the catalog. The original legacy entitlement covers only the original 22 keys. Room v1 gains an optional pedestal ID; unknown/omitted IDs use Standard. Startup discards an unowned stored selection without changing other room settings. Existing V3 toy records and capacity remain intact.

## Authored assets

`assets-src/pedestals/source-manifest.json` retains exact prompts and provenance. The built-in OpenAI generator uses the original pedestal as a camera/silhouette reference. Run `node scripts/prepare-pedestal-assets.mjs` to retain the connected sprite, discard disconnected alpha speckles, invoke the mandatory shared image pipeline, then fit a common transparent 640×364 frame. Masters stay outside runtime roots. The runtime manifest records source/runtime hashes, dimensions, bytes and no AVIF companions.

The original table, landing plane, labels and furniture camera remain in place at all viewport sizes. Authored images bypass palette tints. Twelve decoded 640×364 RGBA images have an 11,182,080-byte proxy; this is not measured phone GPU memory. Required images decode before the Library becomes interactive; failure uses Standard and exposes an explicit asset retry.

## Validation and release

`tests/release/pedestals.spec.ts` covers all twelve entitlements, duplicate callbacks, earned-journal recovery, old room compatibility, normalized alpha, EN/RU at portrait/short landscape/desktop, no automatic ads, closed/error/earned callbacks, free retries, cancel/save/reload and unchanged toy data. It checks primary action bounds, 44px targets and actual hit testing during preview. Failed image loading has a separate retry scenario.

Keep the unchanged 5 MiB upload budget. Strict TypeScript, release tooling, shared asset smoke, both builds, full browser/visual/Pages checks and post-merge hosted smoke remain required. SDK stubs and Pages do not establish real hosted Yandex ad or tactile phone acceptance.
