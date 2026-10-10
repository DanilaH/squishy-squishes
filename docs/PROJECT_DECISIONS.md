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


## Remaining tactile stage — 4 October 2026

After the published #76 slice, the owner explicitly authorized the remaining
tactile work together. Squeeze alone enables two-pointer stretch/compression,
slow short stroking, and generic material response: soft retains the reviewed
constants; jelly lowers damping/rest response; marshmallow lowers rest response
and increases damping. This is an intentional, owner-authorized extension of
the tactile-constant contract, not per-shape physics. Mesh topology, canonical
hits, displacement/body bounds and default/Finish/Mix/legacy behavior remain.
One pointer lifting transfers ownership without resetting mesh or crediting
a release; cancellation/stage change/activity clears both without reward.
Phaser matches changedTouches by identifier and allocates two touch pointers.
The existing face/audio path handles stroke delight and stretch expression;
sparse idle blinking uses the existing frame clock and quantized reactions.
Reduced motion/activity disable presentation reactions; mute still guards audio.
No storage, progression, accessory placement or layout changes are authorized.


## Living Squeeze presentation — 4 October 2026

The owner authorized contact volume/shadow, inclusion lag, gentle stroke
reversals, localized edge grabs, a first-action gesture hint, and sparse idle
rotation/skew/jiggle/stretch with the chosen face. A bounded pure ToyPose
transforms the existing front/backing and UV projections; inverse hit conversion
lets the first touch claim the visible toy before cancelling presentation.
No idle pose enters simulation positions, velocities, squeeze counts or saves.
The Phaser frame clock owns quiet time; interruptions, active gestures, unsettled
body, reduced motion and activity blockers suppress idle. Accessories use the
same projected basis, with a tiny secondary sway. Existing contact shadow
variables preserve their default values outside Squeeze.
Quiet elapsed time is sampled with performance.now inside that frame callback:
Phaser's smoothed/clamped delta must not slow idle delays on low-FPS renderers.
Activity transitions and long frame gaps reset it; springs retain their delta.

Slow stroke classification tolerates a brief reversal; Squeeze edge grabs use a
narrower generic influence radius, while default/Finish/Mix constants remain.
In Squeeze, existing authored inclusions reuse the existing Canvas2D overlay
and bounded lag, clipped to the projected silhouette. Returning to creative
stages rebakes their normal appearance; V3 coordinates/IDs never change.
Procedural filling uses the same drift via a shared shader uniform (zero by
default). Face ink stays after material lighting, above the sidewall backing.

Browser QA in #77 approached its 15-minute job budget. The unchanged full suite
now uses two one-worker shards and a stable browser-qa aggregate; shard 1 also
performs the complete strict visual suite. Matrix failure/cancellation fails the
aggregate; deploy and exact-PR build reuse keep requiring that aggregate.
Existing retry/time budgets and masks/thresholds are unchanged.


## Toy personality and workshop response — 5 October 2026

The owner authorized all seven follow-up ideas: gesture-specific character,
more distinct material release, weighted accessories, gesture sound, sparse
Hall life, clearer decoration placement/erase/Undo, and subtle workshop response.
ToyPersonality is transient state driven only by actual input and the existing
Phaser clock. Three short taps produce brief surprise; sustained slow strokes
relax the chosen eyes; strong release briefly jiggles the shared presentation.
Entering Squeeze gives a silent greeting. All reset on cancellation/blocking and
respect reduced motion. They cannot change saved decor or credit a squeeze.
Squeeze-only Jelly/marshmallow parameters are more distinct; strong two-pointer
pinch retains its existing stabilizing damping and generic mesh bounds.
Accessory motion rotates around the existing shape-specific seats: bow softness,
mirrored ear lag, small crown hop. The existing audio graph owns quiet stroke and
stretch noise envelopes, material timbre, mute/blocking and disposal; idle is silent.

Decor uses an optional preview seam in the existing gesture router. Down/move
preview one placement; only a valid normal up edits the existing V3 document.
Cancel/outside up/stage changes discard it. Legacy callers without the seam keep
their existing down behavior. Erase preview and commit share the exact topmost
44px CSS-pixel hit test. Preview reuses procedural sticker art, not new bitmaps.

The Hall has one sparse timer and animates only one visible saved toy at a time.
It snapshots that card's exact pixels, reuses the existing shared offscreen
renderer for one closed-eye frame, then restores the snapshot. No per-card RAF,
perpetual filter, new WebGL context or storage mutation. Maker/modal/activity/
visibility/reduced-motion guards stop it and restore pixels. Workshop release
moves only the existing passive dust pseudo-layer and softly changes its light;
furniture, game canvas and controls stay still. Existing pastel art is preserved.

Tap duration/burst spacing use the native input timestamp forwarded by the
Phaser bridge. Display decay still starts at the current Phaser clock: delayed
event delivery must neither turn a short hardware tap into a hold nor expire
its face response before rendering it. The browser test injects the explicit
65ms native touch sequence; rendering/trace overhead cannot change its input
duration. Physics/release credit and their clocks are unchanged.

## Unified toy and editor repair — 5 October 2026

The owner reported face occlusion, extreme-pull artifacts, crowded Decor,
different Finish physics and Hall appearance, stage scale jumps, decoration
crossing the table, missing Hall furniture, and abrupt Hall idle motion. This
explicitly authorizes the shared presentation and editor changes below.

Production Hall and Studio now use the same front material shader, sidewall,
logical texture resolution and layer baking: pigment, inclusions, then relief,
stickers and face ink. Existing V3 inclusions are drawn under expressions;
the production path no longer places a rigid inclusion canvas above the eyes.
The shared mold transform also applies to projected accessories and inverse hits.
Hall retains one reusable offscreen renderer, disposed on entering the maker.

Finish enables the existing Squeeze material/two-pointer/presentation path.
Creative stages and the raw diagnostic path retain their stage behavior.
Extreme mesh inversions are prevented by bounding only an invalid residual;
modern tactile stages stop downward displacement at the common mold floor.
Canonical boundaries, normal spring parameters and saved coordinates are intact.

All Studio stages share one canvas centre, resting radius and desk ratio.
Header navigation uses a symmetric three-column grid; Decor has fixed tab,
content and action rows, separate eyes/mouth rows and a compact blush toggle.
Secondary choices use calm surfaces; primary actions keep gold artwork.
No page/tray scroll or reduced Paint touch targets is introduced.

Hall furniture/podium CSS consumes the decoded pixels from readiness, avoiding
a second asset request. Transient preload failures have bounded retries and
retain the usable fallback. Hall idle reuses the same bounded ToyPose as Squeeze,
composed onto the existing thumbnail transform without moving its base seat.
One sparse timer launches one short frame burst; interruptions restore the
exact snapshot and transform. Visibility, activity and reduced-motion guards
remain. Save V3, slot limits, rewards and progression are unchanged.

## Visible-surface grabbing and tactile mesh — 5 October 2026

The owner confirmed that the visible edge and returning protrusions could not
be caught, and authorized the nearest tactile iteration: reliable grabbing,
local pressure/volume cues and a pleasant release. Other optional ideas remain
outside this iteration; no vertex-count increase or new renderer is required.

Finish/Squeeze physical down events invert the current GPU triangles and mold,
pose and viewport containment. A bounded approximately 8 CSS-pixel edge allowance
snaps to the visible canonical contour. Paint, stickers and mix-in authoring keep
their existing canonical coordinates. Grab anchors retain material UVs and the
caught local deformation; pointer handoff snapshots the current field without
resetting vertices, velocities, saved content or crediting an extra release.

The same 289 vertices now share a weak, previous-frame elastic field in tactile
stages. Local pressure is narrower with a surrounding bulge; pulls narrow their
transverse section. Pinch uses an inverse-square-root transverse scale as a
bounded volume cue in the existing 2D solver, not a physical 3D volume simulation.
A tap uses one local rebound rather than adding two release kicks. Original raw
and Mix constants, limits, floor/fold guards and material profiles remain.
No changes to art, UI layout, save V3, progression, rewards or storage namespaces.

## Strawberry and tactile character — 5 October 2026

The owner accepted the current grabbing and authorized the next scoped pass:
repair the heart-like strawberry, add smooth location-aware face reactions and
make existing materials feel more distinct. Extra gesture/audio proposals are
still optional; this is not authorization to expand the whole idea bank.

The canonical strawberry boundary has a shallow shoulder and rounded tip. Five
separate padded leaves, fold highlights and smaller tilted recessed seeds share
one procedural relief definition across Studio, Hall and selector SVG. No bitmap
pipeline, per-shape physics or new renderer. Selecting a new, empty strawberry
starts with a normal pink body-fill stroke that can be undone, cleared and painted
over. Existing pigment and saved toys are never recoloured automatically.

The existing ToyPersonality reads the material grab position and pressure: the
caught side gently squints, and the chosen mouth tilts slightly. The response
attacks/decays smoothly, updates the ink only at bounded quantized changes, and
never replaces saved eyes/mouth IDs. Finish/Squeeze share it; two-pointer gestures
stay symmetric. Cancel, activity/modal/stage guards and reduced motion clear it.

Soft retains its solver constants. Jelly has a less damped, springier return;
Marshmallow briefly retains 28% of the caught field after a hold over 350ms, with
a 550ms exponential decay. This transient field clears on cancellation, stage or
material changes and never persists in save V3. Floor/fold/displacement bounds,
289 vertices, pinch damping, grab anchors, squeeze credit and progression remain.

## Material travel and captured viewport gestures — 5 October 2026

The owner authorized a stiff, locally dentable Metallic (existing `chrome` ID),
longer Jelly tethers and continuous tracking outside the original playfield.
This intentionally replaces the shared tactile travel ceiling: Metallic has a
short resisted pull and faster damped recovery; Jelly has a long progressively
resisted pull, with a monotone axial field to prevent the extended mesh folding.
Other tactile materials gain a smooth resistance knee. Raw/Mix limits remain.
Whole-body travel stays bounded; generic floor/triangle guards, canonical shapes,
289 vertices, saves, rewards, pinch damping and release credit are preserved.

A captured gesture extrapolates the viewport inverse smoothly instead of entering
its asymptote. Initial hits still invert the actual rendered mesh; per-pointer
offsets keep returning-surface and posed grabs continuous. Mouse down captures
the native pointer even when Phaser supplies its compatibility MouseEvent.
Phaser 4.2.1 discards touchmove over other DOM elements despite implicit touch
capture. The bridge therefore extends its existing TouchManager listener only
for already-owned Finish/Squeeze pointers outside the canvas. It restores that
listener on disposal; no second input router, renderer or frame loop is added.
Normal authoring, two-pointer ownership, interruption/activity cancellation and
UI click-through remain under the existing stage router. Toy/table layout,
no-scroll controls and 44px Paint zones are unchanged. Short landscape expands
the draw buffer with a computed CSS seat length, preserving the original pixel
radius and center across stages while avoiding a flat cut at the old canvas edge.
Long visible deformation
still respects the playfield projection and desk floor; tracking covers the
viewport, not movement outside the browser window.

## Six tactile material profiles — 5 October 2026

The owner authorized all six materials as one tactile set. The existing shared
solver uses a typed parameter table for resisted travel, local pressure/ring,
rest response, damping, release/poke and bounded pinch. Soft returns calmly and
relaxes slightly during a hold; Marshmallow dents more deeply, stretches less
and retains a stronger temporary imprint after a longer hold; Pearl resists
earlier, bulges more at the sides and returns with a compact rebound; Holo has
a free initial pull followed by a shorter tension ceiling and brisk recovery.
Jelly and Metallic retain the accepted long/short pull and return parameters.
Metallic's pinch is also short to avoid a stiff material becoming freely
stretchable with two fingers. Foam memory decays over 900ms and is discarded
on cancellation, material or stage changes; it is never saved.

These owner-approved tactile parameters supersede the earlier default-only
constants in Finish/Squeeze. Raw/Mix constants, common pinch damping, floor/fold
guards, 289 vertices, visible-surface grabs, full-viewport capture, faces/decor,
layout, save V3, material IDs, slots, rewards and progression remain unchanged.
Tests compare actual local dents, held/released fields and observable material
signatures, stress all six materials on all eight shapes, and open saved
materials in both Finish and Squeeze. Automated distinction is evidence for
physical behaviour; the owner's phone feel remains the final product judgment.

## Stronger tactile contrast — 5 October 2026

After testing #84 the owner found Jelly the clearest contrast and authorized
another focused pass. Soft remains the baseline and Jelly keeps its accepted
travel, tether and recovery. Marshmallow has a wider/deeper hold dent
and an up-to-65% transient imprint with 1.4s exponential decay measured against the host clock,
independently of the bounded spring step. Recovery is tuned to settle before
the first idle blink even on slow frames; idle timing/gates are unchanged.
Pearl has denser rest response, a visible compact rebound and stronger bounded
two-finger compression/side growth. Holo reaches tension sooner with a shorter
travel reserve and brisk recovery. Metallic has narrower but clearer local
pressure while retaining its stiff pull and short pinch.

The existing profile table and generic solver remain; no new gesture, mesh,
renderer, appearance, save, audio or interface system. Raw/Mix constants, Soft
and Jelly profiles, common pinch damping, displacement/floor/fold guards and
release credit stay unchanged. Regression checks measure actual local dents,
foam residual after release, Pearl overshoot and settling, Holo free/taut gain
and transverse pinch growth, alongside the full eight-shape/material stress
matrix and existing real-browser gesture tests. Phone acceptance remains with
the owner; numerical distinctions do not establish subjective satisfaction.

## Editor panel centering — 5 October 2026

The owner's desktop screenshot exposed a 50px left offset: controls are centered
at 720px while their 620px panel remained start-aligned. Shared editor panels
now use auto inline margins, keeping their existing width, vertical placement,
contents and touch zones. Short landscape centers within its existing right
controls column; it does not move that column or the toy/table.

RU/EN checks traverse Shape, Paint, Mix-ins, Mix, every Decor tab and Finish on
320px portrait, 844px short landscape, 1440px desktop and the screenshot's 1892px
width. Only four desktop Decor/Finish UI baselines were changed after inspecting
each actual/diff image: the panel moves 50px right with no other scene changes.
The other 26 baselines remain. No material, physics, save or progression changes.

## Browser CI capacity after panel centering — 5 October 2026

The 212-case suite's first two-way shard contained 122 cases plus the visual
comparison. It twice hit the unchanged 15-minute job budget without assertion
failures (PR case 116/122 and main case 122/122). Release browser QA now uses
three shards of the same complete suite. Pages keeps its two shards; all-shard
aggregation, visual comparisons, shared build/checksums, retries, test/job
timeouts and exact-tree/latest-attempt reuse stay unchanged. No tests are
removed. This addresses the observed publication blocker without changing
materials, interface behaviour or deployment acceptance.


## Release CI latency — 5 October 2026

The owner requested the fastest reliable CI after the panel release. Run
37353469564 measured Pages shards at 621s and 317s, browser test shards at
352–372s plus 79s of sequential visual comparisons on the first browser runner.
Dependency installation and Chromium setup cost about 40–50s per runner, so
adding a browser cache is not the principal latency fix.

Release browser and Pages suites now each use four isolated runners. Visual QA
runs independently against the same immutable, source-identified shared build;
the browser aggregate requires both every browser shard and visual QA. The
separate candidate suite uses three runners; the independent Hall/stress gate
uses four. All existing required aggregate names, tests, stress environment,
screenshot evidence, assertions, baseline files, retries and timeout budgets
remain. Each runner still has one Playwright worker to avoid the previously
observed WebGL contention. More shards are not added indiscriminately: a source
PR can also trigger art review and independent gates, consuming runner capacity.

A conservative shared classifier allows only nonempty changes to README.md,
AGENTS.md or Markdown under docs/ to omit builds, browser suites and deployment.
Documentation-only PRs still emit successful required aggregate checks after
scope validation; they never produce reusable release artifacts. Any runtime,
asset, test, package, workflow, script, non-Markdown document, unknown path,
missing/shallow history, empty comparison or manual run requires full QA.
Git comparison disables rename detection so moving a runtime input into docs
cannot hide its deletion. Scope rules and a real Git rename regression are
included in release:check. Exact whole-tree/provenance/checksum/latest-attempt
release reuse and live Pages source/touch/save/reload acceptance are unchanged.

This infrastructure pass changes no game source, physics, materials, controls,
saves or progression. No slow gesture/idle test is shortened simply to lower
its runtime; its behavioral coverage remains in the complete shard partition.

Production and candidate screenshot artifacts are collected after all shards
pass. A shard
containing only input/geometry tests need not invent screenshots; the aggregate
requires the original production portrait/desktop/landscape frames and candidate
desktop, portrait, landscape, compositing and real-studio captures across the complete partition instead of a per-runner any-PNG check.


### Verified CI measurements

Run 37357410489 passed all 212 production browser cases, all 82 ordinary Pages
cases, 31 candidate cases, 35 independent Hall/stress cases and 30 unchanged UI
baselines. One Hall material capture used the existing retry after a 60s timeout.
The slowest Pages test step fell from 621s to 354s; the slowest candidate runner
including setup took 123s. Browser steps ranged from 109s to 439s, so the complete
pipeline is still governed by its longest runner rather than the shard count.
This run also incurred a 265s system/Chromium installation on one runner and
about five minutes of queueing for the final Pages aggregate. These network and
runner delays must be reported separately from test execution; the measurements
are not a guaranteed end-to-end budget. No tests or baselines were removed.


## Free craft scope and selective scrolling — 6 October 2026

The owner approved the complete scope in
[FREE_CRAFT_IMPLEMENTATION_CHECKLIST_2026-10-06.md](FREE_CRAFT_IMPLEMENTATION_CHECKLIST_2026-10-06.md).
It includes object transforms/combinations/locks/mirroring, face transforms,
local mix-in editing, movable/preset lighting, try-on, contextual UI, eleven
accessory groups (wings are a left/right pair), the agreed mix-ins/color variants,
seven forms including a real donut hole, and four Library atmosphere directions.
Implementation and evidence are tracked separately; recording this scope ships
no game feature. Preserve old V3 saves, material feel and the pastel volume style.
Existing hearts/confetti must be audited and improved where needed rather than
assigned duplicate content IDs. The later traditional-shape list supersedes
the initial cloud/flower/drop proposal. Selectable stands and toy names remain
deferred; they are not part of the approved Library subset.

The former global no-scroll instruction is superseded: the page and game scene
stay fixed, while long catalogs/settings may scroll internally when appropriate.
Primary actions, undo and stage navigation stay visible with touch gesture
ownership and 44px Paint targets. The donut authorizes minimal shared geometry
changes for an actual hole in rendering, hits and paint; it does not authorize
per-shape physics or another renderer. No liquids/heating/experimental simulator
is included. Publication still requires the final head's PR checks and actual
hosted acceptance, not a deadline or a successful local build.

### Free-craft implementation boundaries — 6 October 2026

Optional V1 decor placement/face fields and appearance light/brush fields retain
V3 and exact old compact encoding. Existing filler ordinals stay fixed. Paired
pieces share authored art and independent transforms; the complete face remains
above front gear through the same projected mesh. History stores immutable drafts
and coalesces pointer/slider gestures into one action; cancelled placement restores
the original document. It replaces the former separate per-tool history arrays.

The canonical shape definition now supplies inner contours. SDF, hit tests,
authoring masks, SVG previews and front/back rim strips all use that definition;
the donut retains the generic 289-vertex simulation. An observed interpolated
watermelon contour crossed the generic floor by 0.00528 after mesh ordering. A
residual rigid mesh translation corrects contact without changing triangle areas
or any reviewed material spring/response constants. The 90 form/material extreme
reversal matrix passed locally after that correction.

Historical candidate entrypoints import the shared editor layout so catalog growth
also remains usable in their fallback UI. Long catalogs/settings alone may scroll;
button reachability tests visit every item through those trays while preserving
page overflow and 44px checks. Static Hall snapshots frame enlarged free gear as
one composition, retaining the ordinary toy camera when its art already fits.
No per-card GPU context or persistent frame loop is added for this framing/props.


### Long capture cases after catalog expansion

Observed PR CI exceeded the unchanged 60s test budget in the English desktop
full-flow audit and the six-material Hall/Studio capture. Caption/viewport/hit
checks now run in one browser evaluation, still scrolling and inspecting each
catalog element. Material evidence is split into the numerical/phone comparison
and two desktop pairs, all derived from one genuinely created/saved Studio toy
in beforeAll. All six material comparisons, images, labels, paging and
Hall/Studio transitions remain; test/job timeouts and retries are unchanged.
This changes test organization only, not runtime, materials or visual thresholds.


## Collection showcase follow-up — 6 October 2026

The owner rejected the atmosphere props/two-podium layout and approved the
common collection shelf, one selected table toy, contextual actions and
coherent pastel furniture. The completed scope and publication evidence are in
[LIBRARY_SHOWCASE_2026-10-06.md](LIBRARY_SHOWCASE_2026-10-06.md).
Selection reuses the existing lazy maker in a contained workbench; editing
promotes that same instance to Studio. Keep Save V3, material constants,
activity blockers, eight/optional-ten slots and reward cadence unchanged.

## Custom room foundation — 6 October 2026

The owner subsequently approved exhibit arrow navigation, a separate scrolling
collection and click-to-Squeeze from both, preserving selected toy/catalog
position on return. Start with an empty room and original illustrated pedestal;
future furniture and wall/floor palettes customize that room using fixed slots,
with portrait and desktop compositions. No forced landscape or plush photoreal
style. [ROOM_FOUNDATION_2026-10-06.md](ROOM_FOUNDATION_2026-10-06.md) records the
initial opt-in review stage and deferred room customization; the published
showcase remains the default until owner visual acceptance.

## Free Squeeze room — 7 October 2026

The owner authorized explicit Unpin / On pedestal controls in Squeeze. Normal
pinned tactile behavior remains unchanged. Free mode translates the existing
Phaser toy in viewport pixels: central grab carries, release transfers hand
velocity, edge grab deforms, and a second finger can stretch during carry.
There is no extra deformable renderer or replacement material simulation.

The live canonical outer contour collides with the playfield edges, protected
control bands and the illustrated pedestal/Studio desk. Swept held travel and
substeps prevent quick gestures from crossing the obstacle. Collision impulses
feed the existing elastic mesh; rebound differs across all six materials.
Whole-body idle rotation pauses during free travel. Face, accessories, fillings
and sidewall share the same translated UV projection. Return rises, moves home
and lands before restoring pinned input; resize resets the transient mode.
Activity blocking pauses travel and interrupted gestures lose throw momentum.

This is presentation state only: Save V3, room storage, rewards, slots and
reviewed tactile profiles are unchanged. `tests/release/free-squeeze.spec.ts`
covers swept collision, mouse carry/return at three viewports, touch carry plus
second-finger deformation, attachment sizes, cancellation, unchanged saves and
stationary Studio furniture. Publication requires the normal PR and Pages gates.

## Physical free Squeeze follow-up — 7 October 2026

The owner authorized the complete follow-up: preserve the room composition
through Squeeze/Unpin, use the pedestal footing as the room floor, point-based
inertial grab with rotation and centrifugal stretch, and material-dependent
contact flattening, rebound and brief wall adhesion/sliding. The room remains
opt-in; no new save schema, furniture placement rules or renderer is authorized.

The free body owns translation/angular momentum and a spring at the grabbed
point. Its transformed live contour supplies collision support; substeps bound
fast travel. Off-center grip transfers torque, release retains spin, and catch
preserves the current body pose. Force/rotation load and contact pressure feed
the existing SquishSimulation spring targets, with bounded material compliance.
Jelly is most compliant; Chrome least. Contact impulses use the local normal;
wall adhesion has a finite duration and a cooldown, followed by falling. Floor
support produces squash and lateral bulge; it does not simulate a flowing liquid.

Physical rotation shares front/back skin projection and its inverse input
mapping. Foreground face, accessory anchor/basis and rigid inclusion positions
follow that projection. Free accessories allow full rotation; pinned accessory
limits remain unchanged. Material constants for the existing pinned tactile
profiles, Save V3, ads/rewards and the default Library are preserved.

In the opt-in room, floor height is the measured pedestal bottom ellipse center
(the same 0.85 art-frame ratio used by rugs). The workbench retains its CSS size
container during Unpin. The room footer retains its layout space in Squeeze;
the short-landscape heading has a fixed row height across font readiness and
preview-to-live handoff. The exhibited thumbnail stays visible until the live
Phaser surface is ready and reaches its first render frame, avoiding a blank
room during startup.
The original Studio desk remains anchored; its existing free-space floor is
unchanged. Turning orientation returns to the pinned seat.

Local verification (7 October 2026): `npm run release:check` passed, including
strict TypeScript, web/Yandex builds and the unchanged upload size limit. The
six visual scenarios (30 EN/RU baseline comparisons) passed without changing
snapshots or tolerances. New cases cover three-size room geometry/floor/return,
decorated Jelly/Chrome real pointer spin/contact, actual released throw and
landing, preview-to-live handoff, six-material rotated-skin containment, catch
without teleport, shortest-angle return, transient wall adhesion and spring
material response/recovery. All 18 free-squeeze cases passed across focused
runs: the three cold-start timeouts cleared in an isolated repeat, together
with the updated shortest-angle unit case (4/4). Recorded real game motion
accompanies local review.

The broader browser regression is not green: 270/288 passed in the two-worker
run. Its 18 failures include two pixel comparisons, cold renderer/test timeouts,
an unloaded-font request and an exact default Hall table position comparison.
The two pixel failures reproduce on untouched `79c4aa7`; aborted-font loading
also reproduces there, while the default Hall geometry case passes serially on
that baseline. Other broad failures have not all been isolated. This is not a
claim of complete regression acceptance or readiness to merge/deploy.

The environment could not fetch the pinned Chromium 153 archive. Local browser
verification used Chromium 134 headless-shell with software WebGL via temporary
config overrides; test timeouts, assertions and visual baselines were unchanged.
GitHub push was rejected by automatic approval review because this new public
source payload needs explicit owner authorization. All changes remain local;
no new PR, CI, merge or deployment is established by this note.


### Coupled surface grip and visible soft-body follow-through

The free grip now captures UVs through the inverse rendered triangle mesh,
then updates the body lever from that deformed UV point every frame. This
allows a stretched tip to remain caught and makes catches use the live skin.
Grip damping is relative to sampled hand velocity, with a finite idle fade.

Held room loads distribute gravity and filtered hand acceleration through the
existing spring mesh with zero weight at the caught tip and increasing weight
through the body. Centrifugal load extends away from the grip; transverse
narrowing retains a volume proxy. Hand acceleration is sampled independently:
feeding the deforming grip's spring reaction back into its load created an
unstable feedback loop. Release removes the grip load without clearing the
existing field or vertex velocities. Contact compression is biased toward the
contact side, with existing material-dependent recovery. The softer room-only
damping does not change the published pinned tactile constants.

A subtle transient contact ring shows the held surface point. Opt-in room
Squeeze controls now occupy the reserved bottom UI band instead of the pedestal
label, and the long duplicate label hint is hidden during play. Three-size
room geometry, V3 persistence, second-finger deformation and Studio remain
covered by the focused free-squeeze suite.

This refinement passed release:check, 20 focused physics/browser scenarios,
the stronger fast-spin recording case and all 30 unchanged visual baseline
comparisons. The grip-field case also verifies six-material sag/recovery.
A new 26-second real-game recording shows hanging, swing, loaded rotation,
throw, collision and return. The earlier broad regression limitations above
remain open; that full suite has not been rerun on this refinement. This is
local visual-review work, without GitHub push or publication authorization.


### Free-squeeze entry paused

On 7 October 2026 the owner paused the free-flight interaction after visual
review. The Squeeze panel no longer renders the Unpin / Отцепить button in
Library or Studio. Pinned squeezing and its existing actions remain available.
Experimental physics code is retained for possible later work; it is not
reachable through the player UI. Browser scenarios that click the paused entry
need an explicit diagnostic harness before this work can become a release PR.

### Craft controls polish — 7 October 2026 (local review)

The owner requested a more usable craft interface after pausing free flight.
The craft heading now groups the step counter with its title instead of
allowing the counter to collide with the title on short phones. Portrait
heading tracks reserve 56px (48px on short phones), consistently across every
step, giving the scene more height without moving the toy between stages.

Arrange now exposes the selected object list, size and rotation sliders,
Lock / Mirror / Delete actions and More in a fixed 132px contextual area.
Colour, Copy and Reset open within that area; global Undo / Redo and Continue
remain outside it. Opening settings disables the covered controls with inert,
restores keyboard focus on close, and supports Escape even after history
navigation disables its focused button. Locked pieces disable colour and
transform inputs. Selected object chips stay within the horizontal list's
visible area without scrolling the page. V3 encoding and renderer/physics
are unchanged by this interface pass.

The new craft-interface scenarios cover four screen/locale combinations,
control hit targets, heading containment, colour undo/redo, settings focus,
locking, deletion undo and size/rotation/colour persistence after reload.
The existing rich-detail drag and full new-craft scenarios remain relevant.
This is a local interface review; no push, CI, deployment or phone tactile
acceptance is claimed.

Validation: release:check passed for both production builds, including the
Yandex upload limit. Twenty-two distinct focused browser/data scenarios passed;
the four new interface scenarios were rerun after the Escape fix, and desktop
was rerun after centering the hint. Six visual scenarios (30 captures) passed
against the reviewed baselines; 18 craft-stage images were intentionally
refreshed for the heading/tray changes, while Library/Ideas stayed unchanged.
The prior full-suite limitations and paused Unpin scenarios remain open.

### One freely navigable Workshop — 7 October 2026 (local review)

The owner approved replacing the six-step creation flow with one Workshop,
without a tutorial in this pass. New Squishy opens immediately on Base with
an editable default toy. Four persistent sections switch the existing tools:
Base (shape, material, optional light), Paint, Fillings and Decor. The same
scene and draft survive section changes. Undo/Redo, Try it and Save have one
shared action strip; any section can save a plain or decorated toy. The old
Mix progress barrier and Next chain are no longer part of the player path.
Internal stage identifiers still select existing renderer/authoring behaviour;
this is not a new renderer, physics model or save schema.

Brush selects its tool without opening a dialog; Settings contains brush size,
palette themes, stamps and Clear. Fillings keeps Eraser, Settings and Clear
outside the scrolling choices. Adding an accessory or placing a sticker opens
its contextual editor immediately. Existing detail selection from Face/Details
enters Arrange while retaining the original gesture owner; explicit sticker
placement remains its own mode. The object list resolves overlaps. The colour
button also exposes Copy/Reset. Squeeze's action now says Edit and reopens this
same Workshop, with existing V3 identity preserved.

Portrait navigation uses the former heading track. Short landscape uses a
2×2 section group beside the tools, keeping 44px targets and the toy below it.
The controls sit above the render buffer in hit testing; authoring pointer
handling remains owned by Phaser. Preview hides tools without changing the
scene geometry and returns to the previous section. Saving blocks authoring
while awaiting persistence, and an error retains the editable draft for retry.

The prior craft-interface test was superseded by the new workflow scenarios.
The visual route now captures freely selected Paint, Decor and Base/Material
instead of driving the retired mixing sequence. Older broad browser cases
that explicitly assert the sequential stage path need migration before this
branch can pass a release gate; they are not evidence against the new product
contract. The earlier baseline failures and paused free-flight entry cases
also remain recorded above. No push, CI, deployment or tutorial is included.

Validation: release:check passed for both production builds and the Yandex
upload limit. Thirteen focused workflow/data scenarios passed, covering RU/EN,
portrait phones, short landscape and desktop, plain creation, preview, detail
editing, history, same-ID saved editing and persistence-error retry. Seven
gesture routing cases passed. Six visual scenarios (30 captures) passed after
reviewing all 18 craft captures and updating Paint/Decor/Material baselines;
Library/Ideas baselines stayed unchanged. Actual gameplay screenshots were
also reviewed at 320, 568 and 1440 widths. The full older browser gate has not
been rerun or claimed passing.

### Independent Workshop review fixes — 7 October 2026 (local)

An independent pass reproduced three state defects: a face-size slider recorded
history without updating Undo/Redo, light-only edits bypassed the exit warning,
and the next toy inherited the mix-in eraser and settings panel. History UI now
updates when the editor closes a transaction. Exit checks compare the complete
draft with its initial/loaded document, including light and brush settings;
returning to that document with Undo is clean. New resets the mix-in tools and
catalogue; selecting a filling also exits Eraser.

Short landscape now uses one full-width section row, readable 12px labels and a
larger toy beside the controls. At heights up to 350px, catalogues/contextual
settings scroll within 88px while navigation and the shared action strip stay
fixed. Detail settings hide the covered core and reset its scroll position;
this prevents the clipped colour overlay from exposing underlying buttons.
Light buttons keep their 44px targets after moving from Finish into Base.
The Paint Settings dialog is bounded by the viewport and scrolls locally when
its translated choices exceed the short landscape height, retaining 44px
targets and returning keyboard focus to Settings.

The broad regression pass also caught the release-session integration still
counting only Finish → Squeeze. Successful creations now count from every
Workshop section; saved edits and Library revisits remain excluded. New-workshop
entry supplies the start event even without Paint. The existing 120s initial
grace, 150s cooldown and three-action ad policy are unchanged.

Browser paths were adapted to section navigation, shared history, Paint
Settings, contextual placement and Try it. Save/V3/slot/reward assertions remain.
Browser free-flight cases are explicitly skipped while Unpin is
paused; its physics units stay active, and a new player-interface test checks
that the button is absent. The two strict raster checks for paw-pad pixels and
accessory alpha also fail on the unchanged `abab225` baseline with the same
adapted test drivers. They remain active release-gate failures, not waived
assertions or evidence that the Workshop fixes caused those differences.

Final local validation: release:check passed (strict TypeScript, smoke checks,
both production builds and the Yandex size limit). The 309-case release suite
was covered in partitions with targeted reruns after fixes: 295 active cases
passed, 12 owner-paused Unpin browser cases were skipped, and the two unchanged
strict raster failures remain. This is not a green full release gate. The local
software-GPU browser used a 120s test timeout; the checked-in 45s default was not
changed. Initial eager asset requests are allowed to finish before test-directed
reloads, so intentional reload cancellation is not reported as an asset failure.

Six visual scenarios / 30 captures passed without updating snapshots after
reviewing the six changed RU/EN landscape Paint/Decor/Material baselines. Other
baselines stayed unchanged. Real gameplay captures were reviewed at 320 and
568 widths. Short-screen face rows use their content height and a 44px blush
button, avoiding label overlap and unscrollable clipping. Local commit only;
no push, CI, deployment or tutorial work.

### Workshop catalog layout — 2026-10-08 (local)

Desktop Workshop panels now share a 940px width at viewports above 900px wide
and at least 640px high. Catalog height scales from 160 to 208px; shape and
accessory catalogs use five columns of 76px cards. Navigation and shared actions
use 52px targets, with larger labels and choice art. Existing narrow-panel caps
were removed for this desktop layout. Scene, section navigation and action-strip
geometry remain stable across Base, Paint, Fillings and Decor.

Overflowing shape, filling, material and accessory catalogs show a persistent
proportional position indicator with a direction arrow. Catalogs retain native
touch, wheel and keyboard scrolling; the indicator does not intercept input.
Resize/content observation hides it for short content and compact settings,
and observers are disconnected on disposal. Mobile retains the toy above the
tools and a partially visible next catalog row. Physics, save formats and assets
are unchanged. Desktop workspace assertions now expect 940px rather than 620px.

Local release:check passed, including strict TypeScript, smoke checks, production
builds and the Yandex size limit. The scoped layout/workflow regression has 39
passing cases across RU/EN, phones, short landscape and desktop, including touch
scrolling, selection, settings, history, save/reload and panel centering. Reviewed
visual changes affect ten RU/EN Paint/Decor/Material baselines; Library and Ideas
remain unchanged. All six visual scenarios / 30 captures then passed without
updating snapshots. The full release suite was not rerun in this layout pass; its
two previously recorded strict raster failures remain unresolved. Local browser
timeouts and executable overrides are temporary; checked-in defaults remain.
Local commit only; no push, CI, deployment or tutorial work.

### Remaining screen polish — 2026-10-08 (local)

The ordinary nonempty Library now browses the collection alone; choosing a toy
opens a separate Squeeze view using the existing Phaser maker. The table gets
more space in play, intentionally changing its geometry between browsing and
play while staying stable during play. Empty shelves retain their welcome/table.
Back buttons name their destination and restore collection scroll; newly saved
toys are selected on return. Delete appears only in Manage mode, with the existing
confirmation. Room remains opt-in (`roomReview=1`); its furniture slots, relative
scales and clipping are unchanged. Room, collection and Squeeze keep distinct
headings and return paths.

The room editor uses a wider desktop panel and readable art/labels. Phones keep
an internally scrolling catalog with its native input and proportional scroll
hint. Short screens replace the category strip with a native select and reserve
at least 72px for catalog content, keeping cancel/save visible. Colors and decor
still save separately from V3; cancel and persistence/loading retries retain
existing behavior. The shared scroll-hint helper now accepts a selector and is
disposed when its host is replaced; Workshop's default selector is unchanged.

Ideas show real renderer thumbnails, including target paint and optional
fillings, without applying them to the player's draft. Desktop shows 12 cards
per page; other sizes show four, preserving the page anchor when resized. The
optional goal becomes an expandable 44px control in the topbar brand cell,
without covering Workshop navigation. It retains the maker's required brand
marker and restores the brand after completion; Escape closes its details.

Full-shelf replacement now has two distinct actions: select an old toy, then
confirm Replace & save. Selection and cancel do not mutate storage. The dialog
shows the new preview, the selected old toy and an explicit return to creation.
Short screens scroll only the card grid, leaving dialog actions accessible.
Failed writes keep the draft, selection and original pager-disabled states for
retry. Existing V3 migration, capacity/reward cadence, asset content, physics,
Unpin pause and tutorial deferral are unchanged.

Final local release:check passed: strict TypeScript, smoke/asset checks, both
production builds and the Yandex size limit. The final functional runs passed
28 cases (11 new screen scenarios plus Ideas and core save/migration workflows)
and 16 Workshop catalog/settings/native-touch cases. Separate earlier scoped
runs passed six card-pager and three room-decor failure/retry cases, plus Library,
room-foundation and rewarded-expansion regressions. The completion regression
caught during that run was fixed and passed in the final 28-case run. Reviewed
visual updates affect exactly 12 RU/EN Library/Ideas baselines; the other 18
captures remain unchanged. Six visual scenarios / 30 captures then passed
without updating snapshots. Real unmasked game screenshots were reviewed at
390, 568 and 1440 widths, including all seven room slots together; the new
functional scenarios also cover 320 width. Browser emulation does not establish
physical-phone acceptance. The full release suite was not rerun: the two
previously recorded strict raster failures remain unresolved. This is not a
green full release gate. Temporary browser overrides are not checked in.
Local commit only; no push, CI, deployment or tutorial work.

### UX freeze follow-up — 2026-10-08 (local)

The four concrete findings in UX_FREEZE_REVIEW_2026-10-08 are addressed. A new
craft explicitly clears the active Idea, guide and old completion notice; editing
also clears that session context. The maker signals that intent through an
optional callback to its Library owner rather than mutating completion credit.
On portrait viewports up to 400px, the three post-save actions use two rows;
Library's two play actions retain their layout. Mirror copy is named explicitly
in RU/EN and retains its existing reflected-copy behavior. Object actions share
available row width and wrap their labels.

Accessory and sticker addition/copy controls reflect their existing 128-item
limits with a visible explanation. Paired accessories require two free places;
normal copies require one. Removal, transformations and undo remain available,
and update control availability. No save format, durable capacity, physics,
reward, tutorial, Unpin or asset changes.

Local release:check passed. Ten new RU/EN tests cover Idea reset and completed
notice lifetime, actual text boundaries/touch size at 320px, paired placement at
127 items, limits at 128 accessories/stickers, deletion, undo and recovery across
320 portrait, 568 landscape and 1440 desktop. Four existing editor/history cases
and ten S4 Idea cases also passed. Six visual scenarios / 30 captures passed
without changing snapshots. Real game captures were reviewed for the new rows,
normal Mirror copy labels and limit explanation. This scoped result does not
claim a green full release gate: the prior two raster failures were not fixed.
Temporary local browser configuration is not checked in. No push, CI or deploy.


## 8 October — default room and clear object feedback

The owner approved merging the room into the normal entry. Ordinary web/Yandex and preview entrypoints now use the room; `roomReview=0` explicitly selects the previous gallery for its historical regression scenarios. Room foundation/persistence tests now exercise the parameter-free entry.

Arrange highlights selected stickers as well as accessories, including crafts with no accessories. Sticker controls identify the design and instance (for example, Flower · 12). The frame follows size, rotation and placement and stays hidden outside Arrange or during try-on. The horizontal object tray cannot gain a vertical scrollbar from its pressed-button transform. Save uses a plain purple background with white text instead of stretching honey artwork. V3 IDs/documents are unchanged.

## 8 October — owner-approved customization expansion

The owner approved six additional accessories (antennae, mushroom/witch hats,
halo, eye patch and bolt), four eye styles (angry, sly, crosses, sparkling), four
mouths (tongue, fangs, straight, stitched), nine stickers (candy, donut,
strawberry, lightning, flame, skull, planet, eye, ghost), and four paint patterns
(spots, melon stripes, patches, plush seams). These are code-native art using the
existing renderer, transforms and materials. New sticker codes append after the
original four; V3 storage and original encoded content retain their meaning.

Patterns apply in the selected paint color as ordinary UV pigment strokes,
with one undo/redo transaction. They remain paint after reload: no independent
pattern layer or replacement setting is introduced. New faces retain existing
Phaser reactions. Ordinary ornaments retain face priority; the eye patch is an
intentional exception, composited above the face in Studio and thumbnails.
Antennae start at a smaller scale to keep their tall silhouette usable on phones.
Expanded faces/stickers scroll inside the fixed catalog, without overlapping
rows; desktop face rows use eight columns. The paint settings close action stays
visible during internal scrolling. Old limits, room, physics, rewards, tutorial
and paused Unpin scope are unchanged. Cyclops/asymmetric faces remain deferred.

Accessory overlays request a pixel-reading Canvas 2D context from the first
draw: tint and ink-bound measurements no longer trigger a rasterization change
that changes soft alpha edges. Existing recolor/mirror coverage passes unchanged.

Local verification passed strict TypeScript, tooling/asset smoke, clean web and
Yandex builds and the upload-root audit (63 files, 3,346,988 bytes), 33 targeted
browser/data scenarios, and all 30 interface snapshots across EN/RU, portrait,
short landscape and desktop. Only the six Decor baselines changed for the
expanded choices. Old compact sticker bytes and all 196 face/pattern save
combinations round-trip; the full browser and preview suites remain PR gates.

Full-suite follow-up reserves two caption lines in accessory cards, including
both long hat names on 320px screens. Paint settings use a separate scrolling
content area and fixed close action, so the close button cannot cover tools.
The existing full-flow audits now scroll Face/Stickers before checking every
caption and hit target, and retain a fixed page/scene requirement. The short
phone catalog audit additionally checks 44px targets and both vertical edges.

## First creation guidance — 10 October 2026

Owner approved first entry directly into free craft with an editable default
body, then Save → Squeeze → furnished room. Fresh storage receives a dresser,
picture and centered oval rug. Existing saves/settings/room choices remain
returning-player evidence, including intentionally empty rooms; prior rooms are
not repopulated. Explicit `roomReview=0` regression/preview entry retains its old
flow. Migration and V3 content/capacity/rewards remain unchanged.

Guidance is contextual EN/RU copy in a dedicated bottom hint strip, with
highlighted targets and a 44px Skip button. It does not block tool sections,
require painting/decorating, drive stage changes or add recipe gating. Actual
paint/decor state and successful save/squeeze control the hints. Fillings has a
one-time introduction; first return explains the room editor. Replay lives in a
44px question-mark button next to Ideas, avoiding short-landscape header overlap.

`squishy.onboarding.v1` stores skip/completion/seen state and the first/replay
unsaved draft separately from V3. Draft decoding uses the existing V3 content
validators. Committed changes checkpoint after UI actions, with a short debounce
for remaining observed changes and exit/pagehide checkpointing. A successful
V3 save clears the draft; leaving early retains it. Resetting to another craft
ends the current guide. Existing players can replay without replacing a saved
toy. Startup/renderer failure retains the normal room fallback with an explicit reload action (failed dynamic imports can remain cached by the browser).

Existing-room QA explicitly seeds returning-player storage. Fresh-start QA uses
unseeded storage and exercises the full flow, reload recovery, skip, replay,
successful squeezing and untouched existing room/save data. Visual baseline
changes are limited to the room's added replay button; tutorial screenshots are
also inspected at narrow portrait, short landscape and desktop sizes.

Local validation passed strict TypeScript, tooling/asset smoke, release web and
Yandex builds plus the upload-root audit (63 files, 3,360,953 bytes), Pages staging
and the isolated DRAFT audit (63 files, 3,361,462 bytes). Browser coverage includes
10 onboarding scenarios, 33 room/customization regressions and 2 exact DRAFT
root/adapter scenarios. The DRAFT adapter scenarios use a stub SDK and do not
establish real hosted ads or tactile phone acceptance. Full suites remain PR
gates; this feature has not been merged or deployed.
All 30 interface snapshots passed across EN/RU at 320×568, 844×390 and
1440×900. Only the two narrow-portrait Library baselines exceeded the unchanged
pixel tolerance and were updated for the replay button; other 28 remained within
existing tolerance. Fresh tutorial screenshots were inspected separately.
