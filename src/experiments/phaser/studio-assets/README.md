# Studio v8 — integrated asset set (draft)

The **seven** PNGs in this directory are loaded into the isolated `/phaser/` Pages preview on `feat/studio-environment-v1` (draft PR #56, based on draft UI PR #54). This is no longer an upload inbox. `main`, Yandex entrypoints, mechanics and saves are untouched.

- `studio-wall.png` — horizontally tiled cream wall.
- `studio-floor.png` — horizontally tiled wooden floor with lavender baseboard.
- `studio-desk-left.png`, `studio-desk-middle.png`, `studio-desk-right.png` — one desk reconstructed from one canonical source and assembled as fixed caps plus a repeating middle.
- `studio-decor-left.png`, `studio-decor-right.png` — one non-repeating prop group per side.

`studioEnvironmentPreview.ts` predecodes all seven images and mounts passive Shape/Paint layers; a failed decode leaves the original UI in place. The layout hides the desk on short landscape and respects existing interactive canvas and controls. `studio-environment-integration.spec.ts`, `studio-environment-landscape-regression.spec.ts` and `studio-environment-resilience.spec.ts` exercise real-browser geometry, input, resize and missing-image fallback at mobile/desktop viewports and DPR 1/2. See the [Studio integration Actions workflow](https://github.com/DanilaH/squishy-squishes/actions/workflows/studio-environment-integration.yml) for the current run and screenshot artifact.

**Not production-approved:** the simplified desk and decor still need the owner's visual sign-off. The source OpenRaster master, build scripts, seam/alpha audit and detailed source provenance are in the separately delivered `squishy-studio-v8-candidate.zip`, not in this directory. The decor was adapted from earlier AI-generated candidate images rather than cut from the approved flattened reference. Do not merge PR #56 or present this set as a commercial-release asset pack before the rights/provenance and visual gates are resolved.
