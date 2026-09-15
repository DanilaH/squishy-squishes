# Sandbox Pivot S3 — Decor MVP

**Phase:** S3
**Status:** implementation specification
**Base:** `main@4454d2f72e9df490d93e03dc40fe149e9ae6fdcb`

## 1. Goal

Give player-authored squishies enough reusable identity that two toys with the same shape/paint can still feel like different characters, without turning Decor into a second physics/rendering system.

Target loop after S3:

`Library → New Squishy → Shape → Paint → Mix-ins → Mix → Decorate → Finish → Save → Squeeze → Library`

S3 must strengthen the existing sandbox/library thesis. It must not reintroduce recipe gates, currency, unlock walls or bespoke per-shape mechanics.

---

## 2. Product contract

### One dominant verb

Decor is one creation stage between Mix and Finish.

The player can:

- choose an eye style;
- choose a mouth style;
- toggle blush;
- place a small number of surface stickers;
- choose at most one head accessory;
- undo the latest sticker placement;
- clear stickers;
- continue immediately, including with no decor at all.

No completion score or minimum decoration requirement.

### Identity set for S3

Free baseline:

**Eyes**
- dot eyes;
- happy eyes;
- sleepy eyes.

**Mouths**
- smile;
- tiny `o`;
- cat mouth.

**Face accent**
- blush on/off.

**Surface stickers**
- heart;
- star;
- flower;
- sparkle.

**Anchored head accessories**
- cat ears;
- bunny ears;
- horns;
- bow;
- crown.

The exact visual drawing can remain procedural in S3. Asset polish is not required to prove the system.

---

## 3. Interaction model

### Eyes / mouth / blush

Face pieces are slot-based rather than free-dragged.

Reasons:

- faster child-facing interaction;
- avoids malformed faces from tiny drag targets;
- gives deterministic placement across all six shapes;
- keeps persistence tiny;
- keeps Library thumbnails readable;
- makes later cosmetic packs additive rather than requiring a new placement model.

Selecting a style replaces the previous style in that slot. A `none` option removes it.

Face pieces are rendered into squishy UV-space so they naturally deform with the existing WebGL mesh.

### Surface stickers

Stickers are the free-placement part of Decor.

Interaction:

1. choose a sticker;
2. tap the visible squishy;
3. store the tapped UV point;
4. render the sticker into the appearance texture;
5. allow Undo / Clear;
6. continue at any time.

No arbitrary DOM sticker elements over the squishy.

S3 safety cap: **12 sticker placements per toy**.

### Anchored accessory

Head accessories are **not draggable in S3**.

Selecting an accessory replaces the current head accessory. `None` removes it.

The accessory is an anchored 2D/2.5D overlay which follows the deforming mesh through a generic UV projection API. There is no accessory spring, collision, grab target or per-accessory physics.

---

## 4. Decor persistence model

Do not store screenshots/base64 bitmaps.

Add a compact decor document to authored toys:

```ts
interface DecorDocumentV1 {
  readonly v: 1;
  readonly eyes: EyeStyleId | null;
  readonly mouth: MouthStyleId | null;
  readonly blush: boolean;
  readonly stickers: readonly StickerPlacementV1[];
  readonly accessory: AccessoryId | null;
}

interface StickerPlacementV1 {
  readonly t: number; // bounded sticker catalog code
  readonly x: number; // UV byte 0..255
  readonly y: number; // UV byte 0..255
  readonly s: number; // bounded size byte
  readonly r: number; // rotation byte
}
```

`SandboxDraft` and `SavedSquishy` gain `decor`.

### Save compatibility

Remain on **SaveState V3**.

Existing S2 toys do not contain `decor`; V3 decode must normalize missing decor to `createEmptyDecorDocument()`.

Do not fabricate a face/accessory for an old toy.

A newly saved S3 toy always writes canonical decor explicitly.

No SaveState V4 is justified because top-level persistence semantics do not change; this is a backward-compatible authored-toy field extension inside V3.

### Bounds

Decoder must reject or normalize outside these hard bounds:

- known eye IDs only;
- known mouth IDs only;
- known accessory IDs only;
- at most 12 stickers;
- known sticker type code;
- byte-bounded coordinates/scale/rotation;
- decor object version exactly `1`.

---

## 5. Rendering architecture

S3 deliberately has **two decor rendering paths sourced from one domain document**, because surface decals and accessories have different geometric requirements.

### 5.1 Surface decor → existing appearance texture

Eyes, mouth, blush and stickers render into the existing 256×256 appearance canvas after paint/mix-ins.

Recommended appearance replay order:

1. paint strokes;
2. mix-ins;
3. face slots;
4. surface stickers.

The WebGL shader remains unchanged. `SquishSurface` continues sampling one appearance texture, so all surface decor deforms naturally with the mesh.

Do not create separate WebGL decal geometry.

### 5.2 Head accessory → generic overlay

Ears/horns/bow/crown cannot be baked only into the appearance texture because parts must extend beyond the squishy silhouette.

Add one generic projection method to `SquishSurface`, conceptually:

```ts
projectUvToCanvas(u: number, v: number): { x: number; y: number }
```

It must bilinearly sample the current deformed grid vertices and convert the result through the existing surface scale into CSS canvas coordinates.

The accessory layer uses three projected sample points around a generic top anchor to derive:

- translation;
- horizontal scale;
- rotation;
- a bounded vertical scale response.

This is read-only renderer geometry access. It must not change spring constants, pointer physics or shape branches.

### Generic accessory anchor

Do not add renderer conditionals for six shapes.

Derive the head anchor from shape boundary bounds in a decor helper:

- horizontal center from boundary min/max X;
- top from boundary max Y;
- sample a small local basis around the top-center anchor.

If later art proves one shape genuinely needs tuning, allow declarative anchor metadata in the decor layer, not renderer branching.

### 5.3 Library thumbnail

`renderLibraryThumbnail` must render both:

- surface decor from the same `DecorDocumentV1`;
- the selected accessory using the same procedural accessory renderer, positioned from the static shape boundary.

No WebGL thumbnail contexts.

---

## 6. Domain/module split

Add `src/sandbox/decor.ts` for:

- typed IDs/catalogs;
- compact codec;
- empty decor factory;
- face/sticker rendering into 2D appearance context;
- accessory procedural drawing;
- generic anchor derivation.

Keep responsibilities separated:

- `appearance.ts`: paint/mix-in command codec and replay;
- `decor.ts`: decor state/catalog/rendering;
- `SandboxApp.ts`: stage orchestration and player input;
- `SquishSurface.ts`: generic deformation + projection only;
- `libraryThumbnail.ts`: composition of static toy preview.

Do not put the decor catalog in `SandboxApp.ts`.

---

## 7. S3 stage integration

Current S2 stages:

`shape → paint → mixins → mix → finish → squeeze`

S3 stages:

`shape → paint → mixins → mix → decor → finish → squeeze`

Player-facing steps become **1 / 6 … 6 / 6**.

After Mix completes, Continue enters Decor rather than Finish.

Decor panel requirements:

- large category controls;
- current selection visually obvious;
- sticker tap target uses the existing squishy canvas;
- face/accessory changes preview immediately;
- Undo/Clear apply to stickers only and remain secondary;
- Continue always enabled;
- no technical IDs or payload data in player UI.

On Finish, `Back` should return to Decor so the player can revise identity before Save.

---

## 8. Tactile/play behavior

Saved decor must survive:

`create → save → first squeeze → Library → reload → reopen → squeeze`

Surface face/stickers must deform because they are part of the appearance texture.

Head accessory must visibly follow pull/press/release motion through projected mesh anchors. S3 does not require independent wobble physics.

Accessory overlay must never intercept squish pointer input (`pointer-events: none`).

---

## 9. Payload budget

S2 representative full V3 payloads were:

- 1 rich toy: 3,426 B;
- 8 rich toys: 26,512 B;
- 24-toy stress: 79,333 B.

S3 must add very little relative to appearance strokes.

Target:

- typical decor ≤ 160 B per toy;
- hard S3 decor command envelope comfortably < 512 B per toy;
- representative 24-toy stress must remain < 100 KB unless evidence justifies revisiting the model.

Measure the full serialized V3 envelope again after S3. Do not estimate only the decor sub-object.

---

## 10. Permanent Browser QA exit contract

S3 is not complete until production Chromium proves at least:

1. an S2 save with no `decor` loads as empty decor without data loss;
2. eyes/mouth/blush selection is reflected in the authored toy;
3. sticker placement requires a real pointer/tap on the squishy and persists UV placement;
4. sticker Undo/Clear work without altering paint/mix-ins;
5. head accessory selection is exclusive and removable;
6. decorated save enters Squeeze with the same decor;
7. Library card preview contains saved decor;
8. reload retains decor exactly;
9. reopening a non-latest decorated toy retains decor and real squeeze interaction;
10. accessory overlay does not block pointer squeeze;
11. all six shapes can carry the same decor system without renderer-specific branches;
12. phone portrait / short landscape controls remain contained;
13. updated 1 / 8 / 24 full-V3 payload measurements remain within the S3 budget;
14. Yandex build/lifecycle and S0/S2 regressions remain green.

Do not add test-only product hooks, lower accepted motion thresholds or mutate private state to make QA pass.

---

## 11. Visual acceptance

Capture production evidence at minimum for:

- Decor stage on phone with face + stickers + accessory;
- finished decorated toy;
- first Squeeze under deformation;
- Library with at least three visibly different decorated toys;
- reopened saved toy;
- one short-landscape Decor screen;
- desktop Library.

Success criteria:

- face reads at phone scale;
- accessories read as attached rather than floating UI badges;
- stickers do not visually fight paint/mix-ins;
- different toys gain noticeably stronger character than S2 cards;
- controls still read as a playful tool tray rather than an editor dashboard.

---

## 12. Explicit non-goals

S3 does **not** add:

- draggable ears/accessories;
- accessory spring/collision physics;
- stretch-triggered facial expressions;
- user-imported images;
- text labels on toys;
- arbitrary sticker scaling/rotation handles;
- rewarded cosmetic packs;
- library slot monetization;
- recipes/Ideas;
- humorous titles;
- currency/shop/orders;
- new shapes;
- renderer/shader rewrite;
- SaveState V4;
- shared-kit upgrade.

---

## 13. Stop / reassess conditions

Stop and reassess instead of forcing S3 through if:

- accessories require shape-specific renderer branches;
- generic mesh projection visibly detaches accessories during ordinary squeeze;
- decor requires a second WebGL renderer or DOM elements for every surface decal;
- the Decor UI needs tiny editor-like controls to be usable;
- S3 pushes representative 24-toy V3 payload near the current platform ceiling;
- surface decor cannot remain attached through current deformation without shader restructuring;
- identity still does not improve enough to justify the new system.

S3 succeeds only if identity becomes stronger while the product remains one simple tactile sandbox.
