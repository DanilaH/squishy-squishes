# Squishy Squishes

Bounded feel probe for the Squishy Lab / Maker thesis.

The repository exists to answer one question:

> Can a single soft object remain pleasant to squeeze 20+ times using cheap local mesh deformation, damped return, material response, and tactile audio without true soft-body physics or product-scope expansion?

This is not the full game prototype. A weak core is a **FAIL**, not a reason to add economy, progression, collection, multiple objects, or another mechanic.

## Current implementation

The probe branch contains:

- strict TypeScript + Vite;
- one raw WebGL2 scene;
- a `16x16` dynamic grid mesh (`17x17` vertices);
- pointer-local weighted deformation;
- a small hold/press dent with a local counter-bulge;
- distance-weighted response for cheap viscoelastic lag;
- bounded pseudo-volume response during drag;
- damped spring return plus one restrained release kick;
- procedural soft-material shading with lagged, strain-aware sheen;
- direction-aware responsive contact shadow;
- `mini-games-kit` continuous-interaction semantics;
- `ContinuousNoiseTexture` tactile audio plus a low-frequency release plop;
- FPS / frame-time / compression / press-depth / velocity / displacement / squeeze diagnostics;
- optional mesh overlay and mute control.

The implementation contract and PASS/FAIL protocol live in `docs/SQUISH_FEEL_PROBE.md`.

## Shared dependency

The probe pins:

`DanilaH/mini-games-kit@2da5b501a7e47fbe4b3683069b34f8e252116963`

The kit repository is private, so `npm install` requires GitHub credentials that can read it. The probe intentionally does not copy those shared primitives into this repository.

## Run

Requirements: Node.js `>=20.19.0` and GitHub authentication for the private kit dependency.

```bash
npm install
npm run dev
```

For a production build/type check:

```bash
npm run build
```

## Acceptance

Do not judge from one drag or a screenshot. Interact for at least 60 seconds, then perform 20+ deliberate presses/drags/releases at different speeds and directions.

PASS requires the interaction to remain pleasant, responsive, materially soft rather than scale-like, stable in performance, and reusable without a real soft-body engine.

The planned bounded feel-refinement pass has now been used. Do not add product scope to rescue the probe; further changes should be limited to concrete defects or tuning exposed by the final hands-on run.

After acceptance, the result must be written back to the canonical Yandex Games decision ledger in `DanilaH/decisions`.
