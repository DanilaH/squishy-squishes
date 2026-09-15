# Sandbox Pivot S2 — Personal Library

**Phase:** S2
**Status:** ENGINEERING COMPLETE / PR CANDIDATE
**Base:** `main@72b27a84020a5918b3dd79af4c1a1d3dd30b855b`

## 1. Goal

Turn the proven S1 single-authored-toy lifecycle into the retention backbone:

`Library → New Squishy → Create → Save → Squeeze → Library`

The library stores the player's actual authored squishies. It is not a recipe catalog, unlock matrix, inventory economy, or monetization gate.

Initial capacity is **8 free slots**.

---

## 2. Product contract

### Library home

Normal boot with SaveState V3 opens the personal library.

The library must:

- render saved authored toys as visually identifiable cards;
- show free capacity without making empty slots feel like locked content;
- expose a clear `New Squishy` action at all times;
- open any saved toy directly into tactile Squeeze mode;
- allow a saved toy to be deleted for free;
- preserve deterministic ordering across reload;
- remain understandable on 390×844 portrait without becoming a database grid.

### Saving when space exists

If `library.length < libraryCapacity`:

1. player completes the existing S1 maker;
2. `KEEP IT` appends the new toy;
3. save is flushed;
4. player immediately enters Squeeze with that new toy;
5. returning goes to Library.

No slot picker is shown when a free slot exists.

### Saving when the library is full

A full library must **not** block creation and must not require an ad/payment/delete before creating.

Required behavior:

1. `New Squishy` remains available at full capacity;
2. player completes creation normally;
3. pressing `KEEP IT` does **not** delete anything yet;
4. app enters a `replace` decision showing the existing saved toys;
5. player chooses exactly which toy to replace, or cancels back to Finish;
6. only after explicit replacement choice is the V3 state written;
7. the new toy then enters Squeeze.

No implicit FIFO eviction. No random replacement. No destructive action before explicit choice.

### Delete

Deletion is free.

To avoid accidental loss on touch devices:

- delete is secondary, not the card's primary action;
- one confirmation step is required;
- confirmation names/identifies the selected toy visually rather than relying on a generic destructive modal;
- after deletion, the free slot is immediately reusable;
- deleting the final toy returns to an empty Library, not directly into the maker.

---

## 3. Data model

S2 stays on **SaveState V3**. Do not introduce V4 merely because the library becomes multi-slot.

Existing V3 fields already support the phase:

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

### Ordering

Use array order as canonical library order.

Rules:

- append new toy to the end when capacity exists;
- replacement keeps the replaced slot/index;
- deletion removes the slot and compacts later entries left;
- reload must preserve that order exactly.

Do not add sortable metadata or user drag ordering in S2.

### Required repository/domain operations

Add pure helpers around V3 rather than mutating arrays ad hoc in UI:

- append toy if capacity exists;
- replace toy by stable saved-toy ID;
- delete toy by stable saved-toy ID;
- reject duplicate IDs and invalid targets;
- return new immutable SaveStateV3 values;
- increment `totalCrafts` only when a newly authored toy is successfully committed, including replacement;
- deletion does not decrement historical `totalCrafts`.

---

## 4. Card identity

S2 has no face/decal system yet, so cards must extract identity from already-authored data:

- shape silhouette;
- selected material/finish;
- authored appearance texture replayed from compact V3 data;
- optional small material label if needed for disambiguation.

Do **not** reduce cards to technical text such as shape ID, byte count, timestamps, recipe metadata, or slot numbers as the dominant content.

Preferred card hierarchy:

1. toy preview;
2. tactile primary action (`Squeeze` / card tap);
3. quiet secondary delete affordance.

Empty capacity should read as room to create, not a disabled/locked reward.

---

## 5. Rendering constraint

Do not create eight permanent WebGL contexts for the shelf.

Library previews should be cheap and deterministic. Preferred S2 implementation:

- 2D canvas thumbnail renderer that replays the authored appearance document;
- clip/mask using the existing shared shape boundary projected into thumbnail space;
- lightweight material treatment for Soft/Jelly/Holo;
- no independent spring/deformation simulation in cards.

The real `SquishSurface` is used only after opening a saved toy into Squeeze or entering the maker.

This keeps raw WebGL production burden bounded and avoids mobile context/performance risk.

---

## 6. Capacity / payload evidence

S2 must measure actual serialized V3 payload size, not extrapolate from S0/S1 verbally.

Required measurements from deterministic representative fixtures:

- **1-slot** library;
- **8-slot** library at the initial free capacity;
- **24-slot stress** envelope using valid bounded appearances.

Record:

- full `JSON.stringify(saveState)` UTF-8 bytes;
- average bytes per toy for each fixture;
- largest representative toy appearance used;
- whether 24 remains credible as a technical ceiling.

The 24-slot number is a maximum decoder bound today, not a promise that product should expose 24 slots. If evidence is weak, keep the decoder bound but lower the planned product ceiling.

No bitmap thumbnails or screenshots are persisted. Thumbnails are regenerated from compact authored data.

---

## 7. Responsive UX

### Phone portrait — primary target

The Library should feel like a toy shelf, not an admin panel.

- 2 columns is the default target for 390×844;
- toy preview receives most of each card;
- New Squishy remains obvious without consuming half the screen;
- scrolling is acceptable once multiple toys exist;
- destructive controls should be small enough to stay secondary but remain safely tappable;
- no exact byte/slot diagnostics in player UI.

### Phone landscape / short desktop

Use more columns where space allows, but keep cards large enough to recognize authored appearance.

Do not compress to a dense eight-column inventory row simply because width exists.

---

## 8. Lifecycle / ads

Preserve the S1 rule:

- no interstitial during creation;
- no interstitial between successful save/replacement and first Squeeze;
- returning from Squeeze to Library is a valid completed-loop boundary;
- opening a saved toy from Library must never trigger an ad before the player can touch it.

---

## 9. QA requirements

Permanent production-browser coverage must prove:

1. empty V3 save boots to Library and can start a new toy;
2. saving several distinct toys appends them in deterministic order;
3. reload preserves all saved toys and order;
4. opening a non-latest toy restores its shape/material/appearance and squeezes;
5. delete requires explicit confirmation and persists across reload;
6. full eight-slot library still allows New Squishy;
7. saving at full capacity presents replacement choice and does not mutate storage before confirmation;
8. confirmed replacement preserves library length/index and increments totalCrafts;
9. cancel replacement preserves old library and returns safely to Finish;
10. 1/8/24 payload measurements are generated from valid V3 fixtures;
11. phone portrait / landscape / short desktop remain contained;
12. Yandex lifecycle/settings/build verifier remain green;
13. S0 appearance regression remains green.

Tests must not lower capacity, shorten gameplay thresholds, mutate private app state, or expose test-only product hooks merely to pass.

---

## 10. Visual acceptance

Before PR, capture production screenshots for at least:

- empty Library, phone portrait;
- 3-toy Library, phone portrait;
- full 8-toy Library, phone portrait;
- full Library replacement decision;
- delete confirmation;
- saved toy Squeeze opened from a non-latest card;
- short landscape Library;
- desktop Library.

Review questions:

- are authored toys visually distinguishable without faces/decor yet?
- does the screen read as "my squishies" rather than database/inventory management?
- is `New Squishy` obvious at both empty and full capacity?
- does full-capacity replacement feel safe and explicit?
- is delete discoverable but clearly secondary?

If cards are emotionally too abstract even with authored paint/material/shape, record that as evidence for S3 Decor; do not smuggle a face system into S2.

---

## 11. Non-goals

S2 does not add:

- faces, mouths, blush or accessory decals;
- draggable ears/horns/crowns;
- recipes/Ideas UI;
- titles/XP meta;
- rewarded ads or paid slots;
- currency/shop/orders;
- sorting/filter/search;
- custom naming flow;
- cloud-sync redesign;
- SaveState V4;
- renderer rewrite.

---

## 12. Exit criterion

S2 is engineering-complete only when the production build proves:

> A player can own several genuinely authored squishies, recognize and reopen any of them, safely delete or replace one, keep creating even at full capacity, and retain the whole library across reload without making persistence or rendering architecture materially heavier than the product value justifies.


---

## 13. Final evidence

S2 implementation satisfies the exit criterion.

- final bounded validation/visual run: **34962829873 — PASS**;
- representative V3 payloads: **3,426 B / 26,512 B / 79,333 B** for 1 / 8 / 24 toys;
- largest representative appearance: **3,214 B**;
- final visual review: **PASS** after bounded modal readability fix;
- permanent QA contract moved to the S2 multi-slot lifecycle;
- physical-phone/manual touch acceptance remains a separate release gate.

See `SANDBOX_PIVOT_S2_VISUAL_REVIEW.md` and `SANDBOX_PIVOT_S2_IMPLEMENTATION_REVIEW.md`.
