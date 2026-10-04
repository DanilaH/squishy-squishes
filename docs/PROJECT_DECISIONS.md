# Squishy infrastructure decisions — 2026-10-01

## Current production — 1 October 2026

PR #59 (`1346f19`) switched normal web/Yandex to the accepted Hall/Studio profile and lazy Phaser maker. PR #60 (`8be5103`) tightened body follow, added tap/poke, placed sidewall behind the front, separated face from material lighting, fixed live first-stroke upload and made normal Studio entry await furniture decoding. Genuine asset failure still falls back. Save V3 and production storage keys are unchanged.

`src/main.ts` installs `reviewVisualProfile` and passes `reviewMakerLoader` to bootstrap. Historical `experiments`, `review` and `preview` names do not imply that these modules are isolated from production. Phaser remains outside initial Library JS. `/phaser/` and Yandex DRAFT retain separate storage namespaces; the appearance probe remains diagnostic.

Keep one authoritative physics implementation, the canonical shape boundaries, existing DOM controls and activity-coordinated WebAudio. Preserve portrait-first layout; landscape redesign and advanced appendage grabbing are separate decisions. Browser gates do not replace real-phone feel or hosted Yandex SDK acceptance. See `AGENTS.md` for current invariants.

## Historical engine-neutral integration (current production summary takes precedence)

This file originally adapted the reviewed `mini-games-kit` revision `797b5689767e9dc1059514e0446479e054bf1352` to an **existing raw WebGL2 game**. That was not, at the time, a Phaser migration.

| Bootstrap mechanism | Squishy decision and evidence / acceptance |
| --- | --- |
| Phaser 4.2.1 scene and sound wiring | **Now adopted for the production renderer.** Preserve existing deformation and activity-coordinated WebAudio; Phaser must not own a second sound lifecycle. |
| Strict TS/Vite and dual production builds | **Already present.** Keep Pages `base` separate from the relative Yandex base and run both in CI. |
| Real Yandex SDK vs local mock, activity blockers and ads | **Already present** in `src/platform/runtime.ts` and shared kit adapter. Do not replace project save/ad policy with template defaults. |
| Semantic Game Ready | Existing app creates the Library synchronously before `runtime.markReady()`. This integration records the shell construction and ready handoff with `StartupTimeline` but does **not** claim a real-device first-paint measurement. Defer readiness changes until hosted DRAFT/mobile evidence and tests are available. |
| Startup preload / diagnostic overlay | **Not copied without an asset wall.** Current hero/thumbnail art is procedural. Add authored UI images only with an explicit startup/session/deferred inventory and authored failure/loading behavior; do not display fake progress for no work. |
| Image production | **Adopted**: kit's guarded cutout/normalization, WebP validation, AVIF companions and format probe. `sharp` is dev-only. The CLI refuses overwrites without `--force` and keeps masters outside the output directory. No UI pack or shape PNG has been imported yet. |
| Format selection | **Opt-in** `src/app/runtimeAssets.ts`; only probes when an actual asset with a committed AVIF companion is queued. Keep stable canonical WebP keys; no speculative AVIF requests. |
| Image budgets | Current Yandex distribution cap stays Squishy-specific at 5 MiB. Choose per-asset dimensions, WebP/AVIF quality, decoded-pixel and startup budgets after testing actual generated art on mobile. Do not copy Signal 2000's image sizes/quality/concurrency. |
| Mobile orientation/viewport | Original Squishy is portrait-first DOM/CSS. The later Phaser migration **retains** that layout; do not copy the template's portrait gate or landscape-only sizing. Review viewport observer only for a demonstrated resize/visualViewport issue and keep matching device behavior. |
| Save/cloud conflict policy | Existing SaveState V3 and runtime adapters remain authoritative. Do not import a Signal-specific reconciliation decision or move persistent state into presentation callbacks. |
| Yandex upload-root audit | **Adopted** `assertYandexBuildDirectory`; retain project-specific relative URL, SDK presence, debug-code absence and 5 MiB checks. GitHub Actions still packages the directory *contents* at ZIP root. |
| Release acceptance | Existing PR Release Check + Browser QA + post-merge Pages gates remain. Hosted Yandex DRAFT, native ads callbacks and real-device feel are separate acceptance evidence, not implied by Pages CI. |

## Other useful kit primitives reviewed, deliberately not imported now

- `StartupResourceDiagnostics` and `StartupPreloadController`: use when a real authored-image loader exists, not for an empty resource queue.
- `trimCanonicalTransparentWebp` + logical-frame metadata: useful for larger sparse UI sprites, but UI/DOM positioning must correctly reconstruct the full logical canvas before enabling trimming; currently no such atlas exists.
- `inspectRuntimeImageBudget`: run after selecting real art and sizes; encoded bytes alone understate decoded RGBA memory.
- `DurablePendingTransactionSession`: existing rewarded capacity grant is idempotent and currently does not need a new transaction state machine.
- Phaser runtime loader, planar-depth and text-sharpness: were incompatible with the **original** WebGL2/DOM stack; re-evaluate only if the new Phaser implementation needs them.

Changes to these decisions require a concrete asset/UX need, evidence, and reviewable validation rather than a blanket bootstrap copy.

## Tactile toy sample — 2 October 2026

Owner requested a sweeter, more toy-like material/accessory presentation, starting
with one pink jelly + pearlescent stars + puffy bow sample. Retain all existing IDs,
V3 documents, canonical shapes, physics, progression and no-scroll controls.

The bow is generated transparent art, normalized with the approved asset pipeline;
master, exact prompt, provenance and measured format budgets live in
`assets-src/toy-polish/README.md`. It is startup-required for saved Hall toys, with
AVIF → WebP → procedural fallback. Tray, Studio/Squeeze and Hall use the same art.
Stars share a procedural beveled pearl renderer; Jelly varies their visual contrast
by deterministic existing placement bytes. This suggests depth but is not a claim
of volumetric particles or independent internal physics. Softbox gel reflections
remain in the existing parameterized shader. Short sprinkle/seat animations and
quiet one-shot audio are presentation only, bounded, reduced-motion aware and
cancelled on stage/activity/disposal. No second on-screen WebGL renderer.

This is a first playable art sample, not a completed catalog redesign. Owner phone
acceptance is still required before extending the style to other accessories or
claiming satisfaction/tactile feel. Browser screenshots establish appearance and
regressions, not real-phone sound/feel.

## Toy catalog and face polish — 2 October 2026

The owner accepted the bow/star sample and requested the existing catalog and
faces be brought to that quality. Four generated silicone accessories extend
the sample; no new catalog IDs, saving fields, physics constants or progression.
Shared procedural fillers distinguish foil glitter, foam beads, pearls, molded
hearts and satin confetti. Existing star pixels are retained. All fillers get
the bounded placement cue and all accessories the seat cue, with reduced-motion
and activity cancellation preserved. Face lines are thinner/cleaner and blush
is softly oval; UI previews use actual shared drawings.

Authored assets decode before the Hall and maker, independently falling back
AVIF → WebP → existing procedural accessory on failure. Masters and exact
prompts/budgets live in assets-src/toy-polish. Catalog tests capture unmasked
Hall/Squeeze samples in EN/RU and verify existing V3 collection is unchanged.
Real-phone tactile and taste acceptance remains the owner's next check.

Visual review: six Decor snapshots (EN/RU × 320/844/1440) were individually
inspected against the originals after replacing glyph previews with stable
Canvas 2D choice art. Other 24 snapshots are retained byte-for-byte; the
0.002 threshold is unchanged. The snapshot stylesheet now includes choice
canvases while continuing to hide the GPU surface. Full unmasked toy captures
are a separate catalog check. Compact hidden section labels have explicit
local anchors so they cannot enlarge tray scroll geometry. At ≤350px landscape
height, choice previews are 24px tall so both 44px rows and blush fit the
136px face tray (28px previews produced two 47.09px rows).

## Traditional molds and decoration seats — 2 October 2026

The owner requested a pinched dumpling, a more recognizable paw and additional
traditional toy shapes, with correctly seated accessories. Add `dumpling` and
`strawberry`; retain all six legacy IDs and improve the `paw` contour. Eight free
choices fit two rows of four, without paging/scrolling or reduced touch targets.
Ideas, rewards, saves and tactile constants are unchanged. Existing saved paws
use the improved mold while retaining their exact paint, filler and decor data.

Contours remain in `src/game/shapes.ts` and drive the same generic deformation,
hit testing, field and preview geometry. The dumpling has a rounded body and
top pinch with four folded grooves; the paw has four plump toes and pads; the
strawberry has a tapered body, small calyx and seeds. Original procedural vectors
in `shapeRelief.ts` share body UVs across Hall, Studio, Squeeze and choice icons;
these molded details are never extra saved strokes. They deform with the same
surface and do not create separate appendage physics or another renderer.

Paired gear uses the upper contour at both shoulders. Centered crown/bow keep
their own seats; the dumpling/strawberry bow sits off-center to leave the pinch
or calyx readable. Face placement leaves room for folds/pads. Review unmasked
resting and dragged screenshots for each new mold × all five existing accessories,
plus EN/RU 320px portrait, short landscape and desktop choice containment. Existing
visual baselines remain unless an actual reviewed UI capture requires a change.

Reference research: common bao/dumpling and fruit toy categories in the independent
[Squishy Dumpling catalog](https://squishy-dumpling.com/products/dumpling-squishy-bun-mystery-toy)
and [strawberry listing](https://dumplingsquishy.co/fr/products/strawberry-squishy).
These are category/silhouette references, not measured popularity rankings or
copied art. All contours and molded detail vectors are authored in this repository.


## Shared CI builds and gated Pages publication — 2 October 2026

Release Check owns the production build, Yandex audit and staged Pages preview.
Its immutable `release-build` artifact contains both tested roots in a tar archive,
with the workflow source SHA and SHA-256 checksum. `browser-qa` and `pages-preview`
restore that exact artifact by its producer job output ID in parallel; the latter runs the unchanged Pages
Playwright suite without rebuilding. Production browser and visual commands,
all assertions, baselines, retries and single-worker settings are unchanged.
The check job names remain `release-check`, `browser-qa` and `pages-preview`.

`build-and-deploy` is a dependent job in that same workflow. Fresh builds require
all three jobs to succeed; the verified-PR reuse path below carries their successful
evidence for the exact same source tree. It runs only for main push/manual dispatch, verifies the
artifact identity/checksum, and publishes its exact `dist` without Node, Chromium
or another test/build pass. A main-head guard prevents rerunning an older source
from overwriting a newer release. It retains the existing gh-pages publication
mechanism and `Deploy <source SHA>` provenance; write permission is job-local.

Build archives use an attempt-specific name and immutable artifact ID. Failed-job
reruns consume the successful producer's output; full reruns produce a new ID.
Existing diagnostic/distribution names overwrite their previous copy within that
same run, avoiding upload-name collisions without selecting a different build.

The separate duplicate browser, Pages QA and deploy workflows are superseded by
this dependency graph. Candidate, Yandex DRAFT and path-filtered Hall review
remain unchanged. Local `release:check`, `pages:qa`, `qa:browser` and `qa:visual`
remain available. This reduces duplicate runner work; wall-clock improvement
must be measured because the old duplicate jobs also ran concurrently.


## Owner Decor corrections — 2 October 2026

Owner phone review exposed live Paint covering paw pads, then restoring them
on the next appearance replay. Production now keeps molded detail in the
existing clean face UV layer, above live pigment, with no saved strokes added.
Head gear is composited above the body in Studio/Squeeze and every Hall renderer,
including lost-WebGL fallback. Shared per-mold seats put bows on a tilted upper
shoulder and seat each ear/horn separately. The right piece mirrors the same
left authored piece; both roots follow their own projected surface point. No
new art IDs, save fields, physics or renderer lifecycle.

Sticker hues vary deterministically from existing placement bytes, so a saved
sticker keeps its color on reload. Flower choice is mint; the pearl/gold and
pink objects retain their molded highlights. Decor tabs share one content grid
slot; invisible panels reserve the largest content size, so tab/CTA/playfield
geometry remains steady without scrolling or smaller 44px controls.

Visual review caught a floating dumpling crown in the first passed capture.
Its final root sits inside the pinched contour; strawberry crown also uses
an interior root. The seat test includes crown containment for all eight molds.
The four initial Decor snapshot failures were hidden-panel art exposed by the
snapshot stylesheet's forced visibility. Inheriting panel visibility preserves
all 30 existing baselines; no image or comparison threshold was changed.

## Playful toy direction — 3 October 2026 (owner local date)

The owner approved the direction and asked to preserve all brainstormed ideas.
[`PLAYFUL_POLISH_PLAN.md`](PLAYFUL_POLISH_PLAN.md) is the current source for this
topic: nearest iteration is reactive faces, pleasant audio, bounded accessory
motion, coordinated palettes and stamps. Subsequent creation/collection polish
and the complete optional idea bank are recorded separately. This documentation
does not start implementation or make every idea an outstanding release task.
Audit existing features before adding them. Runtime, tactile, save, progression
and no-scroll contracts remain; ideas needing new persisted data or interaction
require a separate compatibility decision.


## Playful feedback implementation — 3 October 2026

The owner requested development of the nearest iteration. Reactive faces and
accessory sway read existing metrics on the Phaser update tick. Face texture
uploads occur only at quantized expression changes; relief and stickers remain
in the clean front layer. Reduced motion/activity blockers suppress reactions.
Material audio reuses SquishyAudio and the existing ContinuousNoiseTexture.

The selected Brush button opens a compact focus-trapped tools dialog. Four
themes reorder/highlight the same 18 colors without recoloring the document.
Heart/flower/star/dot stamps each produce one existing pigment stroke, with the
same budget, eraser, Undo and V1/V3 serialization; there are no new saved IDs.
Rainbow strokes and the optional idea bank remain deferred. No physical
constants, progression, slot limits or renderer architecture change.

Actual first browser captures passed nine new tool/reaction cases. Visual review
inspected both failed Paint actual/diff pairs (EN 320, RU 844): the Brush menu
indicator and small text raster differences, with unchanged geometry. Only those
two baselines are aligned; 28 remain unchanged and the threshold is retained.
The mobile stamp chooser uses two rows to avoid splitting Russian words. Review
also caught and fixed eraser segments being suppressed after choosing a stamp.


## Accessory depth correction — 3 October 2026

The owner corrected the earlier all-front direction: cat/bunny ears and horns
belong behind the body; bow and crown remain in front. Shared accessory depth
drives both live Studio/Squeeze layers and Hall composition, including shader
and lost-WebGL fallback. Rear Hall gear uses destination-over on the transparent
toy snapshot, without changing the body renderer. Rear roots overlap the contour
slightly more, with per-mold angles and separate upright bunny/spread horn seats.
Paired art remains one mirrored ear/horn with independently projected roots;
existing bounded sway and exact attachment pivots are retained. No save fields,
physical parameters or layout changes. All eight molds and five accessories
are covered by depth assertions and unmasked Hall/Squeeze captures.

Actual first-pass captures exposed a low forehead crown on heart/peach and a
small bunny-root gap on the heart lobes. Crown roots were raised inside the
contour and heart rear roots inset further; approved bow seats remain unchanged.
The heart crown also shares a shallower art pivot in Hall/Studio, so its base
meets the cleft instead of extending down onto the forehead.


## Reversible creation and saved redecorating — 3 October 2026

The owner authorized the independent review's next iteration: Undo after Clear
for pigment/mix-ins/stickers, single-tap Brush menu with an explicit palette/stamp
hint, an individual sticker eraser and redecorating saved toys. Collection histories
are bounded in-memory snapshots and reset on loading/saving/starting another toy;
no history is persisted. Sticker erasing projects the existing placement into CSS
pixels, removes the topmost touched item and retains all remaining placement bytes
and therefore their colors. Erasing and Clear are undoable.

Saved edits use a separate update operation, preserving ID, createdAt, slot, total
crafts, capacity and reward/Idea state; saving an edit never opens the full-shelf
replacement chooser. Discard/failure leaves the durable toy unchanged. Returning
to Mix on a saved toy retains completion, while physical input stays in the same
gesture router. V3 and Appearance/Decor V1 codecs remain unchanged. New Squishy
still creates a new craft. No tactile constants, renderers or progression added.

Release face-reaction QA now records animation frames before pointer release and
checks the same transient delight state plus eventual rest, avoiding a polling
gap without weakening the reaction assertion.

First runner comparison checked all 30 UI baselines. Only three Paint images
failed: RU 320, EN 320 and EN 844. Their full expected/actual/diff images were
reviewed: the explicit palette/stamp hint and previously stale Brush menu glyph,
with intact geometry and button hierarchy. Only these three captures are aligned;
the other 27 baselines, masks, thresholds and retries remain unchanged. Initial
focused checks reached successful edit/Undo/save in all six locales/viewports,
then exposed a test expectation comparing compact persisted Decor with decoded
objects; the test now decodes V3 before asserting unchanged toys and content.

Diff review also caught the session's Finish-to-Squeeze counter treating an edit
as a new craft. Save kind now distinguishes edits before the transition, so
redecorating never advances craft analytics or interstitial eligibility. Existing
new-craft cadence stays unchanged; failure/retry and repeated-edit checks cover it.

## Free painting and larger sticker allowance — 4 October 2026

The owner requested a substantial sticker increase and removal of drawing limits.
Decor allows 128 stickers instead of 12, retaining individual erase/Undo and compact
V1 placement tuples. Pigment no longer stops at 96 strokes, 6 KB or 320 points per
gesture. The V1 UV-pair format and V3 identity/schema remain unchanged; decoding
accepts longer valid strokes without truncating old or new drawings. The 160
mix-in placement cap is independent and never disables Paint, Fill or Eraser.
Undo history remains bounded to 160 actions, not the drawing itself. Storage
failures retain the existing retry/discard behavior; available device storage is
still finite. No physics, progression, layout or baseline changes.

Coverage includes 1000 existing strokes plus new touch/long-gesture paint, full
mix-ins, 128 stickers, Clear/Undo, individual erase/Undo and save/reload in EN/RU.
The historical payload fixture assertions remain unchanged; the former quota UI
case now checks continued drawing beyond 96 strokes and 6 KB.


## Reuse exact successful PR releases after merge — 4 October 2026

The owner requested shorter CI after observing two serial full QA passes. PRs
still run all release/browser/visual/Pages gates. A main push can reuse the
immutable archive of a completed successful Release Check from its merged PR
in this repository. The resolver requires matching merged/head/run identities,
successful producer/browser/Pages jobs and the current attempt's unexpired build.
The downloaded archive must have an identical whole Git tree, a GitHub-verified
source commit descended from that PR head, and the original SHA-256 checksum.
This includes workflow/config/dependency/test/doc files, not only application code.
Only then are the duplicate main browser/Pages jobs skipped; the exact tested
archive is republished with current-main identity and retained PR provenance.
Missing, older, expired, unavailable or mismatched evidence falls back to the
unchanged full build and QA path. Manual dispatch always runs full QA. The
current-main publication guard remains. Candidate/DRAFT/Hall checks remain.

Hosted smoke is now part of the release workflow: wait for live HTML to reference
the tested entry and verify the public JS bytes against the checked artifact,
then run EN/RU touch painting, sticker editing and durable save/reload directly
against Pages, without serving a local rebuilt app. Failures remain visible in
CI with source proof and browser diagnostics. The fast path is validated after
merging this PR; measured durations belong in its release record.

## Cozy workshop graphics — 4 October 2026

The owner authorized a graphics pass strictly within the accepted pastel cartoon
workshop. Warm passive window light unifies Hall/Studio; dust stays sparse near
the light, and only the separate Hall plant sways. Existing activity pause and
reduced-motion rules cover both animations. Studio gets a stitched lavender mat,
a little dumpling drawing and ribbon/beads, attached to the existing desk anchor
without moving UI/canvas/control tracks. Editable original SVGs and preparation
provenance live in assets-src/cozy-workshop; their two alpha WebP exports join
session-required Studio decode with the existing usable failure fallback.

A strain-led gel reflection shift and soft material-dependent press halo reuse
the existing generic shader uniforms. No physics, gesture routing, saves, IDs,
progression or accessory depth/positions change. Unmasked before/after art
captures complement the strict UI baselines; changed baselines require inspecting
the actual images before acceptance. Release verification is recorded in the PR.

Unmasked material review also exposed translucent face ink on Jelly: the shared
front shader now keeps eyes/blush/stickers/relief opaque using the actual face
texture alpha, preserving antialiased edges. Gel body alpha is denser while still
transmitting the room; pigment and expressions should read as a pastel toy rather
than a transparent glass ornament. Side geometry and simulation remain unchanged.

The first art capture showed a rectangular light edge and washed landscape
headings. Stage light now fades at every edge and headings have their own higher
stacking level. All six short-landscape baselines remain unchanged. Only twelve
reviewed phone/desktop captures are aligned from run 37189515892: EN/RU Library
and Paint at 1440, and Library/Paint/Decor/Finish at 320. Full expected/actual
images and original diff sets were inspected, alongside unmasked full scenes;
no threshold, mask, retry or existing gate is relaxed.

The final single-runner Pages job hit its 15-minute job budget at scenario 82/83,
with no assertion failure before cancellation (run 37190245614). The same entire
suite now uses two Playwright shards on separate runners, each with the unchanged
one-worker/retry/timeout configuration and immutable source-checked build. A
stable pages-preview aggregate requires the whole matrix result to be success;
publish and exact-PR reuse still require that gate. Shard diagnostics have unique
names. No test is excluded and no limit or comparison is weakened. Local test
collection must prove the disjoint union equals the full suite before pushing.

The 18 new unmasked camera cases run once in their dedicated art-review config,
instead of repeating inside the 116-case functional release suite. The art gate
covers PRs changing any src/art asset, visual baseline, camera test or related
config. Before/after evidence and assertions remain intact. Local collection
verifies the disjoint 116 + 18 union equals the original 134 cases. The camera
has zero retries; the existing functional/Pages retry policy is unchanged.


## Press/hold/release feedback — 4 October 2026

The owner authorized the next tactile stage after PR #75. This first slice fixes
observed feedback mismatches: stationary holding saturated the face almost at
once; every stationary release was a poke regardless of duration; and Phaser
queried simulation.snapshot(), whose tactileActive is deliberately false, so the
continuous audio update was never reached. The adapter now retains the actual
advance() sample and preserves immediate pointer ownership. Existing audio gain,
material identities, automatic idle decay, mute and activity lifecycle remain.

Presentation receives explicit begin/release/cancel callbacks from the existing
stage router: a cancelled pointer never gets release delight or sway. Face hold
strength grows within a bounded range, pulling stays stronger, and release delight
is proportional. Eight expression levels keep texture uploads finite. The spring
coefficients, radii, mesh, body travel and canonical shape boundaries are unchanged;
only poke classification adds a 220 ms duration bound. Save V3, progression,
accessory seats/layers and UI geometry are unchanged. Multi-touch and material
physics are separate later prototypes, not bundled into this fix.
