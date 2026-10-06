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

Owner screenshot follow-up: move the wall/floor junction behind the entire
pedestal and give the pedestal a neutral cream/gray finish, preserving its
original illustration and toy placement. Wall, floor and pedestal remain a
neutral base for later customization. Review this adjustment through local
phone/desktop screenshots only; no CI wait or publication at this stage.

Local evidence: eight localized room flow cases cover 1440×900, 390×844,
320×568 and 844×390. They check actual gestures, Studio promotion/cancel,
byte-identical saves, return focus and exact departure scroll, viewport bounds,
44px controls and identical pedestal bounds between exhibit and Squeeze.
The original six visual cases / thirty stage snapshots passed without updating
baselines or tolerances. The browser's focus/scroll-into-view can move a partial
card before a click; the return test records the actual departure position.
Full release/browser/Pages gates remain a PR requirement before merging.

## Local customization panel review

The owner approved a room-scene “Style room” button and a contextual editor:
right-hand panel on desktop, bottom panel on portrait phones. Only the panel
content scrolls. On the same day the owner replaced independent wall/floor/
pedestal color controls with **curated whole-room palettes**. Do not restore
three separate color pickers. The palette cards preview coordinated wall,
floor and pedestal colors; the current six options are Quiet morning,
Strawberry cream, Lavender cloud, Mint cookie, Sea foam and Peach tea.

The opt-in local interaction supports instant palette preview, Cancel/Escape
rollback and Done for the current app session. It does not persist room
preferences across a reload and does not change V3 toy storage. The Decor tab
shows category navigation and fixed left/right/wall/rug placement targets;
its item catalog is empty. No new furniture assets have been added.
Screenshots and local interaction checks are this stage's review deliverable;
the owner explicitly deferred CI/publication while iterating on the UI.

Owner refinement: palette choices are compact gradient swatches in three
columns with names and a selected checkmark, retaining at least 44px hit
areas. Each curated palette includes coordinated pedestal top/rim/side colors.
The original pedestal image supplies the unchanged silhouette, linework and
shading; full-size masked tint layers share the same bounding box and SVG
object-bounding-box clips. No independently positioned furniture pieces or
new raster assets are introduced by this pedestal treatment.

Palette refinement: use sixteen coordinated palettes in the same flat list,
without group headings or extra tabs. The set spans calm, pastel, moderate and
vivid saturation/contrast. Rim accents complement the sidewall; the top is
selected for each composition and may be darker. Masked part regions do not
overlap, and multiply compositing retains source shading while respecting
chosen color lightness (the previous color blend could only change hue).
Keep the panel's current scroll position when choosing a palette.

Floor/baseboard follow-up: all sixteen palettes now include visibly distinct
floor hues/lightness (milk, pink, lavender, mint and darker wood/blue variants)
and an explicit coordinated baseboard color. Soft-light blending preserves
parquet linework without replacing the palette's luminance with the original
beige texture. Baseboard highlight/shadow remains independent of its hue.
Pedestal clips now trace sampled source seams in the actual 460×262 art frame
instead of approximate curves; the display aspect ratio matches that frame.
Local EN/RU checks cover sixteen palette selections, exact departure scroll
preservation, Cancel rollback, shared part bounds and unchanged toy storage
across four viewport sizes. Actual phone/desktop screenshots were reviewed.

Texture correction after owner screenshot review: soft-light washed out the
parquet grain/seams. Replace it with one grayscale texture plane multiplied
onto the palette floor, with bounded brightness/contrast and opacity. The
original source, tiling and perspective remain; the color is supplied by the
floor beneath it. Inspect actual bright and dark floor captures, not only
palette variables or geometry. This supersedes the soft-light choice above.

Wall/baseboard texture polish: add a subtle static tiled SVG grain to the wall
and faint grain to the painted baseboard. The baseboard has an upper highlight,
a narrow profile groove and a lower contact shadow; its palette color remains
unchanged. This is scoped CSS/vector presentation, with no new raster asset,
network request or animation. Local phone/desktop captures and strict TS/diff
checks passed; publication remains deferred for screenshot review.

Pedestal seam correction: the cap clip previously extended to the entire art
frame above its lower seam, tinting the exposed rear corners of the upper rim.
Bound the cap to its own left/right silhouette and trace the body's vertical
edges and lower corners more closely. The rim remains the exact complementary
clip, so all region coordinates still scale in the same source frame. Review
high-contrast Pop art at 3× capture scale, including an unobstructed pedestal.

## Furniture implementation — local owner review

This supersedes the empty Decor catalog/session-only settings described above.
The approved catalog now has 22 illustrated items: dresser, craft cart, pouf,
plant, basket, side table, tulip lamp, paw pouf; four shelves (fillers, ribbons,
stickers, mini squishies); picture, mood board, flower mirror, organizer;
oval/flower/cloud/donut rugs; garland and gift box. Preserve generated PNG masters,
source records and explicit WebP-only runtime metadata in `assets-src/room`.

Seven fixed places allow left/right furniture, one shelf, one wall decoration,
one rug, a top garland and a small floor detail simultaneously. Positions use
the same measured pedestal foot as the existing scene; furniture never accepts
drag input. Catalog categories scroll horizontally and item choices vertically;
Cancel/Done stay visible. Each place has Remove and instant preview.

Room palette and item IDs persist through the platform storage adapter in the
separate `squishy.room.v1` key. V3 toy saves and their migration remain unchanged.
Cancel/Escape restores the room as it was when the panel opened. A write failure
keeps the editor open with a retry message; missing assets leave a usable room,
disable unavailable choices and offer explicit loading retry. All 22 sprites
decode before the opt-in room opens. The normal Library does not request them.

Remain opt-in behind `roomReview=1` until owner review of actual game captures.
No CI wait, merge or publication is authorized for this screenshot iteration.

Local verification: release:check passes both builds, image pipeline smoke and
the unchanged 5 MiB upload budget. The 22 runtime sprites total 260,774 bytes;
masters remain outside public. Eleven browser cases pass: EN/RU room/catalog/
Squeeze/Studio return across four sizes, persistent choices, Cancel, load retry
and failed-write retry. Additional real-game captures exercise all seven places,
44px controls, fixed page bounds, unchanged V3 bytes and the normal Library's
absence of new furniture requests. No visual baseline was overwritten.

Composition review moved rugs under the pedestal, reserved header space to
prevent an exhibit/Squeeze jump, kept category/place navigation outside the
scrolling item grid, and added calm label backings for dark floor palettes.
The small phone uses a taller contextual panel to keep one usable item row and
both final actions visible. Owner screenshots are still the visual acceptance
step; this work has not been published.

Owner scale review: remove individual viewport-width sizing and phone-specific
scale overrides for furniture. Each item keeps a fixed ratio to the pedestal's
shared scene scale (dresser width 0.6, paw pouf 0.525). Floor slots are anchored
outside the pedestal's left/right edges, with a proportional floor gap. Narrow
viewports may crop outer furniture; do not shrink it independently to fit or
put poufs under the stand. The scene can scale uniformly with the editor camera.
Remove the furniture-triggered mobile pedestal shrink, and let the rug share
the same scale without a separate viewport-width cap. Local captures check the
same furniture proportions and non-overlapping side bounds at four sizes.

Owner placement follow-up: move the exhibit arrow row into the reserved lower
space, clear of side furniture. The selected toy name and compact tap hint now
sit within the pedestal's front wall, positioned from its measured art frame
with local container sizing. Keep both captions visible on short landscape;
the published default Library caption is unchanged. Rug centers share the
measured center of the bottom pedestal ellipse, rather than aligning each
rug's bottom edge. Different rug aspect ratios now remain centered consistently.
Local phone/short portrait/landscape/desktop checks verify caption bounds,
visible hint, rug centers, furniture/arrow separation, fixed page and 44px areas.

Pages publication follow-up: the first complete PR run exposed the unchanged
Yandex DRAFT initial-entry budget (361,080 bytes against 350,000). Load the room
repository, catalog and editor only for the explicit roomReview route; pass a
typed editor factory into the Library rather than eagerly importing its class.
The resulting DRAFT entry is 345,742 bytes and the original upload/entry audits
pass. Room asset preloading still completes before room readiness, and retry,
Cancel, persistence and default Library behavior keep the same contracts.
