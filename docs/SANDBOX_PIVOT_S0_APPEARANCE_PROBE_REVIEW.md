# Sandbox Pivot — S0 Appearance Probe Review

**Verdict:** PASS

S0 answered the blocking technical question for the sandbox pivot: a free-painted appearance can be stored compactly, reconstructed after reload, and remain attached to the existing deforming WebGL squishy surface.

## What was proved

### Stable deforming appearance

`SquishSurface` already keeps stable UV coordinates separate from spring-deformed XY positions. S0 adds one optional RGBA appearance texture sampled in that UV space.

Visual evidence from a production Chromium build shows:

- paint is attached to the squishy surface rather than rendered as a DOM/canvas overlay;
- overlapping semi-transparent purple and aqua strokes produce a useful soft blend;
- the eraser removes/fades painted texture rather than painting over it with the background;
- save → reload reconstructs materially the same visible appearance;
- during an actively held stretch, the painted strokes bend and travel with the deformed mesh instead of sliding or detaching.

The active-stretch screenshot was captured while the pointer remained down; it was not inferred from the post-release resting state.

### Compact persistence

The probe persists a versioned stroke log, not pixels:

- UV coordinates are quantized to byte pairs;
- point bytes are base64 transported inside compact JSON;
- no raw float arrays are persisted;
- no PNG/base64 screenshot is persisted.

Measured production-browser evidence:

- representative 3-stroke paint/blend/erase document: **219 B** serialized UTF-8;
- richer synthetic drawing: **48 long wavy strokes / 4,195 B** serialized UTF-8;
- the richer document saved and reconstructed after reload;
- the S0 representative per-toy target is **≤ 6,000 B**.

This does not prove the final 24-slot SaveState V3 budget by itself, because future toys also need shape/material/mix-in/decal/accessory metadata. It does prove that free paint does not require bitmap-sized persistence and leaves plausible room for that metadata.

### Production isolation

The probe is available only in the Pages build through:

`?appearanceProbe=1`

The bootstrap dynamically imports the probe only outside the Yandex build. The Yandex verifier also rejects the probe storage marker if it leaks into `dist-yandex`.

Validated Yandex artifact remained the normal three-file release bundle with no appearance-probe chunk/marker.

### Existing product remained intact

S0 did not change:

- spring constants or deformation model;
- grid resolution;
- shape field masking;
- accepted squeeze pointer behavior;
- paint/add/mix/mold mechanics of the existing game;
- SaveState V2;
- recipe/progression content;
- Yandex lifecycle or ads.

When the optional appearance texture is disabled, the normal material render path remains the fallback.

## Automated evidence

Initial S0 validation run `34954378604` passed:

- strict TypeScript;
- Pages production build;
- Yandex production build;
- Yandex verifier;
- existing release-browser suite plus temporary real-pointer S0 proof.

Active deformation visual run `34954782395` passed and produced the held-stretch screenshot used for visual acceptance.

Finalization run `34955138093` passed:

- full release check;
- permanent browser regression for paint → save → reload → real squeeze;
- richer 48-stroke storage stress proof;
- **8/8 tests** in that validation environment, where one test was the temporary stress spec;
- stress result `S0_STRESS_BYTES=4195`.

Only the permanent S0 regression was committed. The stress spec remained temporary validation tooling.

## Permanent regression contract

`tests/release/release.spec.ts` now protects the S0 architecture on the Pages production build:

1. open the Pages-only appearance probe at `390×844`;
2. paint with real `page.mouse` pointer input;
3. overlap a second color;
4. erase;
5. assert the serialized appearance remains under 6 KB;
6. save;
7. reload and confirm the stroke document survives;
8. switch to Squeeze;
9. exercise the real `SquishSurface` pointer interaction and confirm a squeeze is recorded;
10. reject fatal browser/request errors.

The permanent release suite should contain **7 tests** after temporary S0 tooling is removed.

## What S0 does not prove

S0 is not a finished player feature. It deliberately does not prove:

- final brush feel on a real phone;
- final palette/color-picker UX;
- all six shapes under free painting;
- mix-ins, decals or accessories;
- SaveState V3 or a multi-toy library;
- final 24-slot cloud-save size;
- final sandbox art direction;
- target-device thermal/performance after a long session.

Those belong to subsequent bounded phases.

## Decision

**Proceed to Sandbox Pivot S1.**

S1 may now build the real sandbox core on this seam: all shapes available, free paint as an actual craft stage, mix-ins, tactile Mix, finish, and SaveState V3 for one custom squishy that can be saved/reopened/squeezed.

Do not skip directly to multi-slot library, recipe meta, rewarded monetization or expressive accessories. Those remain later phases until the S1 single-toy core is coherent and measured.
