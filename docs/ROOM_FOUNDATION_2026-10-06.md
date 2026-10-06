# Custom room foundation — 6 October 2026

## Owner-approved direction

The owner accepted the exhibit/catalog navigation, but rejected the generated
plush/photoreal room styling. Build on the existing illustrated puffy pastel
game assets. The next foundation is deliberately an empty room: wall, floor,
ground contact and the original display pedestal. It must look coherent before
adding furniture. Do not treat the old generated concept as an approved asset.

- Exhibit: one selected squishy on the pedestal, arrow navigation through saves,
  click the squishy to Squeeze. Browsing does not load the maker.
- All collection: a separate internally scrolling catalog. Click a toy to
  Squeeze; return to the same selected toy and scroll position.
- One shared Squeeze renderer and existing Studio editing. No different
  physics for room, library or Finish, and no new toy save schema.
- Fixed page, visible primary actions and 44px targets; portrait phone and
  wide desktop use intentional compositions. No forced landscape.
- Later room customization uses fixed furniture positions with responsive
  coordinates: center pedestal/toy, rear wall shelves, side furniture and floor
  rug. Same chosen furniture across screen sizes. Furniture, wall/floor color
  selection and durable room preferences are a later implementation stage.

## Initial implementation / review boundary

`?roomReview=1` opts into the initial real-game foundation. Normal entry retains
the published Library while the owner evaluates the new room composition.
The original owner wall, floor, pedestal and ground-shadow sources are reused;
no generated raster art is imported. CSS colors are named independently for a
future room palette, not persisted preferences or an implemented color picker.
The stage grounds the original pedestal at the floor and preserves its aspect
ratio. Catalog and Squeeze retain the existing durable save callbacks, renderer
loading, modal blocking, editing promotion and activity lifecycle.

No additional names/favorites, furniture catalog, free dragging, new shapes,
materials, progression or reward policy are included in this foundation.

## Acceptance

- [x] Strict release check, including both builds and asset/upload audit.
- [x] EN/RU empty/full room, exhibit arrows, catalog scroll/return, Squeeze
  gesture, delete cancellation, editor return and unchanged saves.
- [x] Review actual desktop, portrait and short landscape captures.
- [x] Original production visual comparisons retain unchanged baselines.
- [ ] Full browser/PR gates and diff review before any merge.
- [ ] Owner visual review before making this the default Library.

This document records an implementation stage, not a published release.

Local evidence: eight localized room flow cases cover 1440×900, 390×844,
320×568 and 844×390. They check actual gestures, Studio promotion/cancel,
byte-identical saves, return focus and exact departure scroll, viewport bounds,
44px controls and identical pedestal bounds between exhibit and Squeeze.
The original six visual cases / thirty stage snapshots passed without updating
baselines or tolerances. The browser's focus/scroll-into-view can move a partial
card before a click; the return test records the actual departure position.
Full release/browser/Pages gates remain a PR requirement before merging.
