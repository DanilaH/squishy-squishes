# Squishy authored art — source to runtime

The current squishy surface, painted strokes and Library thumbnails remain procedural/UV-driven. This workflow is for **new external art** (e.g. an approved UI pack, workbench prop, small decorative sprite); it does not turn the squishy into a flat image. No new licensed art is included in this change.

## 1. Keep the master and rights record

Keep the best available original PNG/SVG/PSD/EPS in a reproducible source location outside the shipped `public/assets` directory, and record source URL, original author/license, exact archive/version, modification and license text as appropriate. Do **not** assume all assets in a pack permit re-distribution of the raw archive. Never bake EN/RU labels into the button artwork; native HTML controls keep focus, pointer and screen-reader behavior.

## 2. Prepare a new transparent asset

```bash
npm install
npm run asset:prepare -- assets-src/ui/button.png public/assets/ui/button.webp --canvas=256 --padding=24
# Optional: --background=preserve|deterministic|auto, --webp-quality=88,
# --avif-quality=65, --webp-only, --force
npm run asset:smoke
```

The CLI delegates to kit `prepareImageAssetFile` (border-connected removal / alpha preservation, normalized canvas and validation). It fails when source art cannot be safely extracted, when the output has no useful alpha or padding, or when a file would be overwritten without `--force`. Inspect the actual pixels afterwards: validation is not an art-direction or alpha-halo acceptance test. The optional AVIF companion is validated for dimensions/alpha and kept only if it is smaller than the WebP. Conversion currently goes **canonical WebP → AVIF**, so retain the pristine master for a future direct-from-master encode.

One canvas size is not universal: determine dimensions from actual on-screen size and target DPR. Do not run the square/cutout CLI on full-bleed stage backgrounds, fonts or spritesheets; those need an asset-specific policy.

## 3. Manifest and loading

The canonical logical ID/path is always the **WebP fallback**; record `hasAvifCompanion` per asset rather than guessing from extension. Before queueing an authored image, call:

```ts
const src = await resolveAuthoredImagePath('assets/ui/button.webp', hasAvifCompanion);
```

Import this function from `src/app/runtimeAssets.ts`. It uses the kit's bounded AVIF capability probe only when a companion exists, with a shared promise and safe WebP fallback. Debug-only `?artFormat=webp` can force WebP; it cannot force unsupported AVIF. Resolve asset paths through Vite's `import.meta.env.BASE_URL` or a build-aware URL function at the callsite: Pages uses `/squishy-squishes/` whereas Yandex uses `./`. Do **not** hardcode an absolute root URL or trigger image requests before a correct build-specific prefix is known.

**Important:** `resolveAuthoredImagePath` does not fetch, preload or decode anything. Before adopting the first asset batch, classify each asset as startup-required, session-required or deferred. This small instant-play game has no authored level-loading boundary, so any UI art reachable immediately must be ready before a player can access it. Wire error fallback, a visible preload boundary if needed and resource diagnostics in the same PR as the actual asset consumer; avoid silent post-ready network/decode hitches. Do not move Game Ready earlier to improve an apparent startup metric.

## 4. Budget and release acceptance

When the first pack is selected, measure each candidate's encoded WebP/AVIF bytes, physical pixel area, decoded RGBA proxy (`width × height × 4`), visual fidelity and real phone warm/cold startup. For sparse sprites, consider kit `trimCanonicalTransparentWebp` **only with persistent `LogicalTrimFrame` data and a consumer that reconstructs the original logical geometry**; cropping an image without correcting layout changes its position/size. Keep trims idempotent across rebuilds.

`npm run release:check` runs the CLI smoke test plus strict TS, Pages/Yandex builds and the upload-root audit. The audit retains Squishy's existing 5 MiB Yandex budget, SDK check and prohibition on debug-only code. A green build is not proof that a new asset looks good on a phone or works in the hosted Yandex DRAFT; review portrait, short landscape, slow network, fallback WebP and actual taps before merging artwork.
