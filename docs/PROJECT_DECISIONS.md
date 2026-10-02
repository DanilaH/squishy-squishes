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

`build-and-deploy` is now a dependent job in that same workflow. It requires all
three jobs to succeed, runs only for main push/manual dispatch, verifies the
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
