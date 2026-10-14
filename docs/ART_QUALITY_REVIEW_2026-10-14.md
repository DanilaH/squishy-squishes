# Complete catalog artwork — 14 October 2026

The owner reported silhouette issues in cupcake/watermelon and a quality gap
between the original five authored accessories and seventeen code-drawn ones.
They accepted the first integrated sample and explicitly authorized completing
the remaining catalog in the same molded, glossy 2.5D style on 14 October.

## Implemented scope

| Catalog | Authored runtime sprites | First sample | Completed continuation |
| --- | ---: | ---: | ---: |
| Expanded accessories | 17 | 3 | 14 |
| Stickers | 13 | 2 | 11 |
| Fillings | 13 | 1 | 12 |

The original five authored accessories remain unchanged. The body, physical
deformation, face animation, save IDs and V3 schema retain their existing roles.
Procedural art remains a working failure fallback rather than the normal path.

Six initial masters live in `assets-src/art-quality-sample`; the remaining 37
and a subsequent headphone refinement live in `assets-src/art-quality-full`.
Pristine PNGs, exact prompts, source hashes and conversion settings are retained
outside the shipped directory. All 43 runtime IDs have a canonical WebP and an
explicitly measured, smaller AVIF companion. They are decoded inside the
existing required-art boundary before catalog/room access. Their combined WebP
and AVIF bytes are included in the unchanged 5 MiB upload-root audit.

Classic sticker palette variations and per-particle color/depth variations are
preserved. The unchanged accessory editor still handles color, mirroring,
placement, scale, rotation, selection and persistence.

## Composition corrections

- Cupcake has a smooth upper dome and a wrapper following the same normalized
  body boundary. Watermelon has a straight cut and continuous matching rind.
  Their relief and SVG icons use the same body normalization.
- Flatter room exhibits compensate from their lower contour using one shared
  baseline; the stand, body scale and tactile constants are unchanged.
- Leaves and wings retain measured left-piece roots, reconstructing the existing
  180×120 logical frame before its shared seat renderer splits/mirrors the pair.
- In-game review found the sample headphones touching the eyes. The retained
  style now has a wider opening between earcups (`headphones-v2.png`). No saved
  placement or scale is rewritten. The eyepatch uses the shared logical frame's
  left focal offset and eye row so its shield covers an eye instead of the nose.
- All sprite proportions and focal offsets belong to the asset's shared logical
  frame; there are no per-resolution sprite corrections.

## Local evidence and release boundary

The complete catalog passed 85 accessory/mold regressions and 21 focused
catalog, squeeze, alpha, save/reload and room scenarios, plus six interface
visual cases (thirty unchanged-baseline screenshots). Individual live crops of
all seventeen expanded accessories and the complete sticker/filling sets were
inspected. Fillings were checked on a dark body and stickers on lavender.

The eye-zone refinements additionally passed nine runtime-alpha, phone/desktop
and headphone/eyepatch squeeze/reload cases on three molds. The final alignment
and live-layer fix passed twelve cases, including the existing EN/RU expanded
customization journeys and three-mold checks. The room's eyepatch now shares
Studio's deliberate above-face layer; at that stage ordinary accessories retained
face priority. The owner-approved layer follow-up below replaces that exception
with consistent front/behind behavior.
The final release check passed: 149 upload-root files / 4,592,182 bytes under
the unchanged 5 MiB cap. All six final visual cases passed against unchanged
baselines. Current remote gate status belongs to draft PR #101.

The owner explicitly authorized remote work in PR #101. The original six-image
sample passed all five PR workflows; that result does not establish the final
expanded head's CI status. The full runtime/asset change must pass the current
PR gates before merging. This work does not claim native-phone feel acceptance,
hosted Yandex SDK/ads verification, a merge or a production deployment.

## Follow-up: headphone size and per-piece layer (14 October)

The owner asked to verify whether headphones could surround the whole toy and
approved one per-accessory front/behind toggle with sensible defaults. The
control is under Arrange → More (Править → Ещё), displays the current layer in
the sticky settings heading (including short landscape),
respects locking and participates in undo/redo. Copies retain their layer;
Reset restores the type default. Ears, horns, wings, antennae and halo default
to rear; every other type defaults to front. Existing saves omit the new optional
`depth` field and resolve to these same defaults without migration.

Front placement covers the face as well as the body, with identical behavior
for the type default and a manual selection. The eye patch defaults above
the face but obeys a manual rear override. The live scene and collection
thumbnails use the same resolution; rear thumbnail pieces preserve DOM stacking
order when composed with destination-over.

The size check exposed a pre-existing Studio/room mismatch: Studio overlays used
a fixed 160×107 frame while the room frame followed the body radius. Phaser now
uses the shared thumbnail frame (112×75 at radius 102.4) in every scene, independently
of the transparent interaction canvas size. Headphones alone can scale to 4
(previously 2.5); other accessory and face limits remain unchanged. Their default
size remains 1.8. This changes no physics parameters or source artwork.

Validation:

- Final `npm run release:check`: strict TS, tooling/asset smoke, both builds and
  Yandex audit passed. Upload root: **149 files / 4,593,431 bytes**, below 5 MiB.
- Twelve final focused cases passed: all type defaults and V3 validation,
  whole-toy headphone size on all fifteen molds, EN/RU 320/390/568/1440 editing,
  save/reload, undo/redo, locks, independent pair layers, copy/reset and face-zone
  art. The final sticky-heading refinement then passed seven focused UI reruns,
  including actual hit testing of the layer button before and after a click.
- Four content journeys passed, covering all fifteen molds across Hall, Squeeze,
  edit and reload, complete-craft framing and full-screen downward pulls. Updated
  the old face-priority assertion to the newly approved binary layer behavior.
- The 96-case existing accessory/editor/settings/customization/mold sweep had
  95 passes and one old-chunk 404 when the local dist was rebuilt during the run.
  The unchanged strawberry/bow case passed its isolated clean rerun (7.6s).
- All six final EN/RU visual cases / thirty screenshots passed unchanged
  baselines (37.7s). No snapshots were updated.

The full 477-case local attempt was interrupted after parallel runners collided
on their output directory. Subsequent targeted runs used separate output paths;
this is not a claim that the complete local suite passed. Full PR gates remain
required before merge. The follow-up is included in draft PR #101; not deployed.
