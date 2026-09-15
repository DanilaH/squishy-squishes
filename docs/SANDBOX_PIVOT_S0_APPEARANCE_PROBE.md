# Sandbox Pivot — S0 Appearance Probe

**Status:** ACTIVE TECHNICAL GATE

S0 exists to answer one question before the sandbox pivot is allowed to expand:

> Can one custom-painted squishy preserve its appearance compactly across save/reload and deform correctly on the existing WebGL squish mesh?

## In scope

- one existing production shape (`soft-square`);
- existing `SquishSurface` physics/deformation;
- one optional RGBA appearance texture sampled in stable UV space;
- two semi-transparent paint colors that visibly blend by overlap;
- soft eraser;
- three brush sizes;
- Undo;
- compact quantized stroke serialization;
- save → reload → deterministic replay;
- switch from Paint to Squeeze and verify the custom appearance follows deformation;
- production build / Yandex bundle exclusion / browser evidence;
- measured serialized byte size.

## Explicitly out of scope

- SaveState V3;
- personal library;
- multiple shapes in the probe;
- recipe/title meta;
- mix-ins;
- decals/accessories;
- rewarded ads;
- player-facing sandbox IA;
- migration of existing saves;
- final art direction.

## Storage budget

The probe uses a compact stroke log rather than bitmap/base64 screenshots.

S0 target:

- typical probe appearance **≤ 6,000 serialized UTF-8 bytes**;
- no raw float arrays;
- no PNG/base64 screenshot persistence;
- UV points quantized to byte pairs before base64 transport.

This is not the final per-toy schema, but it must demonstrate that a future 24-slot library is plausible inside the platform save budget.

## Renderer contract

The existing mesh already carries stable UV coordinates independently from deformed XY positions. S0 may add one optional appearance texture seam, but must not change:

- grid resolution;
- spring/deformation constants;
- squeeze interaction behavior;
- shape field masking;
- material/filling semantics when no appearance texture is provided.

With appearance disabled, production rendering must remain visually/behaviorally equivalent to main.

## Pages-only probe

The probe is entered only with:

`?appearanceProbe=1`

It is QA/research tooling, not a new player screen. It must not ship into the Yandex bundle.

## Automated exit evidence

A real-browser probe must demonstrate:

1. Pages production build boots the probe at phone portrait size;
2. real pointer input paints color A;
3. color B can overlap color A;
4. eraser creates a third serialized stroke;
5. serialized payload remains under 6 KB for the representative drawing;
6. Save persists through page reload;
7. reload reconstructs the same stroke document and reuploads the texture;
8. Squeeze mode uses the real `SquishSurface` pointer path and records at least one squeeze;
9. normal permanent release QA remains green;
10. Yandex verifier confirms probe code/storage marker is absent from `dist-yandex`.

## Manual/visual exit evidence

Production screenshot review must confirm:

- paint is clearly attached to the squishy rather than floating UI;
- overlapping colors look like a useful soft blend rather than hard stickers;
- erasing reads as removal/fade;
- after reload the visible custom appearance is materially the same;
- when squeezed/stretched, the painted pattern follows the object without obvious sliding or detached overlay behavior.

## Exit decision

### PASS

Only if the technical and visual evidence above are both acceptable. Then Sandbox Pivot S1 may introduce the real sandbox flow and SaveState V3.

### FAIL / REWORK

If texture fidelity, persistence size, deformation attachment, or target-device performance is poor, fix/reduce the appearance representation before building library/decor/meta systems on top of it.
