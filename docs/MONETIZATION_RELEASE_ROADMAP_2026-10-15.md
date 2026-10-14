# Release monetization and scalable collection — 15 October 2026

Status: roadmap recorded at the owner's request. No runtime implementation or
release is established by this document. The collection work and monetization
direction were agreed in chat; the exact catalog split below is the recommendation
presented for review, not an already approved content restriction.

This is the current forward roadmap. Older recipe/economy and S5 documents are
historical evidence, not the current release contract.

## Product decisions

- New players: four free collection places, then one permanent place per completed
  voluntary rewarded view, without an artificial gameplay ceiling of 24. Device
  storage remains finite. Existing capacity and acquired content are retained.
- A full collection retains free confirmed replacement/deletion. Creating and
  squeezing do not require watching rewarded ads.
- Optional content uses permanent item ownership, free contextual preview and an
  explicit unlock action. No currency, separate shop, randomized rewards or paid
  purchases in this pass.
- Sticky banners may already be enabled by the Yandex Console. Verify the actual
  Console setting/hosted behavior first; absence of SDK calls does not mean no
  banner. Add API visibility control only where the selected policy requires it.
- Interstitial eligibility follows meaningful play and an explicit natural
  transition back to the collection, rather than requiring three new crafts.
  Keep a first-session grace period and cooldown; exact cadence remains a tuning
  parameter. A timer alone never interrupts active craft or squeeze input.

## Recommended first-release catalog

One rewarded completion unlocks **one named catalog item forever**, reusable on
all subsequent toys. A paired accessory unlocks both pieces together. Copies,
recoloring, rotation, mirroring and later reuse do not cost more views.

| Category | Free | Optional permanent rewarded unlocks |
| --- | --- | --- |
| Shapes | `soft-square`, `heart`, `mochi`, `peach`, `paw`, `dumpling`, `bun`, `donut` | `mushroom`, `strawberry`, `ice-cream`, `cupcake`, `watermelon`, `mochi-cat`, `mochi-bunny` |
| Materials | `soft`, `jelly`, `marshmallow` | `holo`, `pearl`, `chrome` |
| Accessories | `cat-ears`, `bunny-ears`, `horns`, `bow`, `crown`, `glasses`, `petal-flower`, `leaves`, `butterfly`, `cherry`, `heart-patch`, `antennae`, `eye-patch`, `bolt` | `headphones`, `bucket-hat`, `cream`, `handbag`, `wings`, `mushroom-hat`, `witch-hat`, `halo` |
| Faces, stickers, fillings | All existing items | None in this pass |
| Paint, colors, stamps, lighting and editing tools | All existing functions | None |
| Room items and palettes | All existing room content | None in this pass |

This provides 18 distinct optional openings from existing content, without a new
asset-production task. Strong silhouette, surface and outfit changes are the
reward hypothesis; conversion is not yet measured. Saved old toys must remain
renderable/editable with their contents. Define and test legacy ownership before
applying restrictions to any returning player; do not silently remove previously
available content. Initial tutorial/Ideas cannot require unavailable items without
a clear free path.

## R1 — Bound preview work by the viewport

- Render the visible catalog and a small adjacent-row buffer, not every saved toy.
  Keep the initial visible cards eager so opening does not flash empty placeholders.
- Release distant raster buffers. Bound any decoded-thumbnail cache and idle
  reactions to the same visible window. Preserve scroll return position, focus,
  selection, actions and confirmed replacement/deletion.
- Keep one existing renderer, no per-card WebGL instances. Raster work must be
  scheduled so one complicated toy cannot synchronously freeze a long catalog.

Acceptance: 100/500/1000-item catalogs have preview memory proportional to visible
cards, not total saved count, across phone/short landscape/desktop. Measure actual
raster counts, long tasks and time until the catalog responds.

## R2 — Incremental, compact persistence

- Separate collection metadata/ownership/capacity from individual toy payloads.
  Updating a toy writes that toy plus the necessary small index revision, rather
  than the complete artwork of all toys. Splitting keys does not increase quota.
- Add versioned compression with a readable fallback/compatibility policy. Never
  silently trim paint, fillings or decor to fit a budget.
- Migrate existing V3 transactionally: retain recoverable old bytes, write/verify
  new records, commit the manifest last. Check temporary space for migration and
  keep the old save usable if migration fails.
- Keep quota/read/write failure handling explicit and preserve the current draft.
  Confirm actual Yandex safeStorage behavior separately from a localStorage probe.
  Current production has safeStorage but does not enable the kit cloud option.

Acceptance: migrate existing saves and capacities; edit/delete/reload large
collections; inject failures at every migration/commit step; verify no partial
manifest, missing toy or accidental reset. Track compressed/uncompressed bytes.

## R3 — Safe repeatable capacity rewards

- Remove the 24-item decoder ceiling only together with R1/R2 safeguards; validate
  finite safe metadata integers and data sizes instead of accepting arbitrary data.
- Separate a durable granted-place count from the old one-time +2 reward ID.
  Preserve old 8/10 capacities and old grants. Repeated SDK reward callbacks must
  not duplicate a place; cancellation/error does not grant one.
- Check storage headroom before offering an expansion. Do not sell a place known
  to be unusable. Handle later storage failures while preserving both earned
  entitlement and the current unsaved creation.

Acceptance: repeated unlocks beyond 24, double callbacks, close/reload during a
reward, unavailable ads and full storage. Test the existing free replacement path.

## R4 — Content previews and permanent ownership

- Add a shared ownership seam for category/item IDs, initially apply only to the
  reviewed shapes/materials/accessories. Existing content IDs stay stable.
- Mark optional items before selection. Preview on the player's real draft;
  confirm opening or restore the prior committed draft without touching history
  or saved ownership incorrectly.
- Permit only one unresolved catalog preview at a time. Do not let a player build
  a creation containing several undisclosed locked choices and discover a chain
  of mandatory ad requests on Save. Already owned combinations remain unrestricted.
- Ordinary Save stays free and predictable; unresolved preview has explicit
  Open/Restore actions. Reward only on the SDK earned callback and persist ownership
  before reporting success. Locks/undo/reload/asset failure must remain usable.

Acceptance: cancel, choose another item, switch tabs/shapes, undo, save, exit,
reload, failed ad, failed save, duplicate callbacks and legacy-content preservation.

## R5 — Hosted ad placement and measurement

- Inspect Console sticky settings and test genuine banner show/hide/viewport
  resize in the hosted Yandex draft. Keep craft controls and touch gestures clear.
- Interstitials only at an explicit natural break; do not stack an unsolicited
  interstitial immediately after a rewarded view. Pause input/audio through the
  existing runtime activity coordinator and resume on all terminal outcomes.
- Measure preview → unlock offer → earned view → use, capacity offers/results,
  interstitial results, storage failures, revenue/player, session length and returns.
  Do not optimize request counts as if they were successful paid impressions.

## Evidence and boundaries

A diagnostic copy of commit `4e52ff3` raised only the save count guard to 1000.
Local headless Chromium/SwiftShader, viewport 390×844, single runs, not real-phone
or hosted Yandex acceptance:

| Simple saved toys | Catalog open | Catalog RGBA buffer lower bound | Visible cards |
| --- | --- | --- | --- |
| 24 | 648 ms | 24 MiB | 8 |
| 100 | 4276 ms | 100 MiB | 8 |
| 250 | 9644 ms | 250 MiB | 8 |

All card canvases were 512×512 even offscreen. The buffers are calculated from
actual canvas dimensions, not a measurement of total process RAM. A 100-decorated
UI case did not finish within over 120 seconds and was stopped; no timing or pass
is claimed for that case. A decorated storage fixture used 20 strokes ×64 points,
40 fillings, 24 stickers and 8 accessories per toy: 500 toys encoded to 3,301,408
bytes and wrote successfully; 1000 to 6,602,911 bytes exceeded that browser's
localStorage quota. This is not a universal device quota or a guaranteed capacity.
Original production validation rejected 25 toys; this was not changed in the game.

Official references checked on 14 October:
- https://yandex.ru/dev/games/doc/ru/sdk/sdk-adv
- https://yandex.ru/dev/games/doc/ru/requirements/4/4
- https://yandex.ru/dev/games/doc/ru/concepts/requirements (rewarded §4.5)
- https://yandex.ru/dev/games/doc/ru/sdk/sdk-player

No implementation, merge, hosted SDK acceptance or publication is claimed here.
