# Sandbox Pivot — S0 Appearance Probe

**Status:** PASS / ENGINEERING COMPLETE

S0 answered one blocking question before the sandbox pivot was allowed to expand:

> Can one custom-painted squishy preserve its appearance compactly across save/reload and deform correctly on the existing WebGL squish mesh?

**Answer: yes.** The implementation and measured evidence are recorded in `SANDBOX_PIVOT_S0_APPEARANCE_PROBE_REVIEW.md`.

## Proven scope

- one existing production shape (`soft-square`);
- existing `SquishSurface` physics/deformation;
- one optional RGBA appearance texture sampled in stable UV space;
- two semi-transparent paint colors that visibly blend by overlap;
- soft eraser;
- three brush sizes;
- Undo;
- compact quantized stroke serialization;
- save → reload → deterministic replay;
- Paint → Squeeze using the real surface pointer path;
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

Those remain deliberately deferred to later Sandbox Pivot phases.

## Storage contract proved by S0

The probe uses a compact stroke log rather than bitmap/base64 screenshots:

- no raw float arrays;
- no PNG/base64 screenshot persistence;
- UV points quantized to byte pairs before base64 transport;
- representative 3-stroke paint/blend/erase appearance: **219 B** serialized UTF-8;
- richer 48-stroke stress appearance: **4,195 B** serialized UTF-8;
- S0 target: **≤ 6,000 B** per representative custom appearance.

This is not the final per-toy SaveState V3 schema. Future shape/material/mix-in/decal/accessory metadata must still fit the overall cloud-save budget.

## Renderer contract

The existing mesh carries stable UV coordinates independently from deformed XY positions. S0 added one optional appearance texture seam without changing:

- grid resolution;
- spring/deformation constants;
- squeeze interaction behavior;
- shape field masking;
- material/filling semantics when no appearance texture is provided.

With appearance disabled, the production renderer follows the existing material path.

## Pages-only probe

The probe is entered only with:

`?appearanceProbe=1`

It is QA/research tooling, not a player screen. It is dynamically excluded from the Yandex build, and `verify:yandex` now fails if the appearance-probe marker leaks into `dist-yandex`.

## Accepted automated evidence

Production-browser evidence demonstrates:

1. Pages production build boots the probe at phone portrait size;
2. real pointer input paints color A;
3. color B overlaps and blends with color A;
4. eraser creates a real removal stroke;
5. representative and richer serialized payloads remain under 6 KB;
6. Save persists through page reload;
7. reload reconstructs the stroke document and reuploads the texture;
8. Squeeze mode uses the real `SquishSurface` pointer path;
9. permanent release QA remains green;
10. Yandex verifier confirms probe code/storage marker is absent from `dist-yandex`.

## Accepted visual evidence

Production screenshots confirm:

- paint is attached to the squishy rather than floating over it;
- overlapping colors produce a useful soft blend;
- erasing reads as removal/fade;
- reload reconstructs materially the same visible appearance;
- during an actively held stretch, the painted pattern bends and moves with the object without obvious sliding or detached-overlay behavior.

## Exit decision

### PASS

S0 is complete. Sandbox Pivot **S1 — Sandbox Core** is now the current implementation gate.

S1 may introduce the actual player-facing single-toy sandbox and SaveState V3, but should not jump ahead to multi-slot library, recipe meta, rewarded monetization or expressive accessory physics.
