# Squishy Squishes — Sandbox Pivot S1 Core

**Status:** ACTIVE IMPLEMENTATION PHASE
**Parent:** `docs/SANDBOX_PIVOT_01_MASTER_PLAN.md`
**Prerequisite:** S0 Appearance Probe — PASS

## Goal

Ship the first production sandbox vertical slice on the existing squishy renderer:

`Shape → Paint → Mix-ins → Mix → Finish → Save → Squeeze`

S1 is successful when one genuinely player-authored squishy can be created with real pointer input, persisted in SaveStateV3, reconstructed after reload and squeezed with its authored appearance intact.

## Hard scope

S1 includes:

- all six existing production shapes available immediately;
- free paint with no coverage gate;
- three brush sizes, ordinary palette, soft eraser, undo and clear;
- deterministic procedural mix-in placement with a small initial set;
- accepted pointer-travel/stretch Mix interaction reused as a tactile ritual;
- Finish with existing `soft`, `jelly` and `holo` material styles;
- no Mold stage;
- no XP/rank/content gates;
- SaveStateV3 foundation and deterministic V2 → V3 migration;
- exactly one production saved custom squishy path for S1;
- reload → reconstruct appearance → squeeze;
- Pages and Yandex production builds;
- permanent real-browser regression for the new path.

## Explicitly out of scope

- multi-slot personal library UI and capacity management (S2);
- rewarded ads or slot expansion;
- recipes/ideas/challenges and humorous title meta (S4);
- decals, faces and attached accessories (S3);
- rename/favorite/duplicate;
- new shapes;
- renderer/physics rewrite;
- shared-kit upgrade;
- image/blob persistence;
- automatic migration of old canonical completions into fake custom toys.

## Architecture

Do not extend `VerticalSliceApp` with sandbox state. S1 introduces a separate production `SandboxApp` and sandbox domain modules.

Required boundaries:

- `sandbox/appearance.ts` owns compact paint/mix-in commands and deterministic replay;
- `sandbox/types.ts` owns draft/saved sandbox product types;
- `sandbox/SandboxApp.ts` owns the S1 stage controller and player surface;
- platform save code owns SaveStateV3 codec/migration/persistence;
- `SquishSurface` owns rendering/deformation only;
- the S0 Pages probe may consume the production appearance module, but production code must not import from `debug/`.

The legacy recipe app may remain in the repository during S1, but normal player bootstrap must use the sandbox path once S1 validation is complete.

## S1 appearance contract

Canonical persistence remains command-based, not bitmap-based.

Paint strokes:

- UV points quantized to byte pairs;
- color + brush size + paint/erase mode;
- replayed onto a 256×256 offscreen appearance canvas;
- hard limits applied by the decoder/creation path.

Mix-ins:

- deterministic compact placements in UV-space;
- initial set is procedural and asset-free;
- placements are replayed into the same appearance texture for S1;
- no physics objects and no hundreds-of-particles simulation.

S1 target remains conservative: a representative authored toy should remain comfortably below the platform save budget; the S0 6 KB appearance target remains the working per-toy guardrail until multi-slot S2 measurement.

## SaveStateV3 contract

S1 uses a versioned V3 root. Minimum fields:

```ts
interface SaveStateV3 {
  version: 3;
  library: readonly SavedSquishy[];
  libraryCapacity: number;
  completedRecipeIds: readonly string[];
  unlockedRewardIds: readonly string[];
  totalCrafts: number;
  updatedAt: number;
}
```

S1 only exercises a single saved slot even though the schema is library-shaped for S2.

Migration rules:

- V3 wins when present and valid;
- otherwise valid V2 migrates deterministically;
- preserve `totalCrafts`;
- preserve known legacy completion IDs as `completedRecipeIds` for future recipe migration;
- discard `labXp` as an access-control concept;
- start `library` empty;
- default `libraryCapacity = 8`;
- preserve settings in their existing repository;
- after a successful V2 → V3 write, remove the superseded V2 key;
- malformed saves fail closed to the default V3 state and report through the existing error seam.

## Stage contracts

### Shape

- all six shapes visible and selectable;
- selection immediately updates the real `SquishSurface`;
- no locks/ranks.

### Paint

- real pointer drawing directly against `SquishSurface.clientPointToUv`;
- Continue is available immediately;
- no coverage meter/threshold;
- paint is clipped by the shape through UV hit testing and renderer mask;
- undo and clear affect command state deterministically.

### Mix-ins

- small expressive set: glitter, stars, foam, pearls, hearts, confetti;
- pointer tap/drag adds bounded placements;
- Continue available immediately;
- clear/undo supported at least at placement-batch level;
- no inventory/economy.

### Mix

- reuse existing interaction grammar: real pointer travel plus stretch;
- static hold does not complete;
- no fail state;
- bounded progress target suitable for browser/mobile;
- authored appearance remains visible throughout deformation.

### Finish

- choose one of existing material styles (`soft`, `jelly`, `holo`);
- finished toy remains the dominant visual object;
- Save persists the authored object immediately;
- successful save leads to Squeeze/play state.

### Squeeze

- reload from V3 reconstructs paint + mix-ins + material + shape;
- real `SquishSurface` interaction remains active;
- player can start a new toy without deleting the saved S1 sample;
- S2 will provide the actual library grid and slot management.

## QA exit criteria

S1 cannot be called engineering-complete unless all are true:

1. strict typecheck passes;
2. Pages build passes;
3. Yandex build and verifier pass;
4. legacy S0 appearance regression still passes;
5. normal boot is the sandbox player flow;
6. all six shapes are reachable without gates;
7. real-browser S1 path performs shape selection → paint → mix-in → Mix → finish → save;
8. persisted V3 payload contains the authored custom toy and no XP gate state;
9. reload reconstructs the same authored toy;
10. real pointer squeeze increments real renderer squeeze metrics after reload;
11. V2 → V3 migration is covered by deterministic test evidence;
12. no temporary apply/screenshot tooling remains in the final PR;
13. independent final diff review finds no product-code dependency on `debug/` and no accidental S2/S3/S4 scope.

## Stop / reassess conditions

Stop rather than papering over the issue if:

- custom appearance requires shape-specific renderer branches;
- save payload growth makes even one representative toy unsafe;
- Mix has to be faked with a button/test hook;
- S1 starts requiring a full library/economy to make sense;
- migration would destroy or fabricate user data;
- normal Yandex lifecycle/build isolation regresses;
- the new app becomes another monolith instead of using the sandbox domain boundaries above.
