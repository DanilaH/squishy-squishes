# Sandbox Pivot 01 — Independent Plan Review

**Verdict:** APPROVE THE PIVOT, with mandatory implementation constraints below.

The product direction is stronger than the current recipe-gated model because it aligns the main value with creation + ownership rather than access progression. The risky part is no longer progression design; it is custom appearance persistence and the technical cost of a truly free paint surface.

---

## 1. Correct product decision: remove content gating

The sandbox should not make ordinary colors/shapes/decor dependent on Lab XP or recipe completion.

Keep recipe progress as optional meta only.

The current `progression.ts` should therefore not be incrementally softened into a more complicated hybrid. Its access-control role should be retired for the sandbox domain.

---

## 2. Highest-risk dependency: custom appearance texture

Do not start Library, Recipes or rewarded cosmetics before proving custom paint can:

- render cleanly on the existing mesh;
- follow squeeze/stretch deformation;
- survive save/reload;
- remain performant on a real phone;
- remain compact enough for Yandex cloud storage.

This makes Phase S0 the correct hard gate.

### Recommended active texture resolution

Start the probe at **256×256**. Do not jump to 512/1024 unless visual evidence proves 256 insufficient.

Update the GPU texture at a bounded cadence rather than creating a WebGL upload for every raw pointer event.

---

## 3. Save budget is a hard architecture constraint

Current Yandex Games documentation limits `player.setData()` to **200 KB per player**.

Therefore the library cannot be designed as if storage is unlimited.

### Budget target

Design for:

- **≤ 6 KB average serialized custom squishy**;
- **≤ 8 KB normal worst-case target**;
- **24 slots + all meta comfortably below ~160 KB**;
- reserve remaining budget for recipe completion, entitlements, future schema fields and serialization overhead.

These are engineering targets, not platform limits per individual squishy.

### Consequence

Readable JSON arrays of thousands of floating-point `{x,y}` objects are acceptable for an early probe but not necessarily for final V3 persistence.

Before S2 is complete, choose/implement a compact representation, likely:

- quantized UV coordinates;
- flat numeric arrays or packed strings;
- delta encoding where useful;
- stroke simplification;
- deterministic replay.

Avoid full PNG/base64 snapshots as the primary canonical representation unless measurement proves they fit the total budget better than commands.

---

## 4. Material selection currently needs an explicit UI home

The master plan keeps `materialId`, and monetization refers to Jelly/Holo/other materials, but the creation stages should not gain another separate screen.

**Decision:** material/finish selection lives inside **Paint** as a compact `Finish` tray or inside the start of **Mix-ins**.

Recommended default UX:

- Paint toolbar: Color / Brush / Erase / Undo;
- secondary `Finish` control: Soft, Jelly, Holo, future premium materials;
- changing finish immediately previews on the hero;
- no separate material stage.

This preserves the user's six-step mental model.

---

## 5. Mix-ins should be visually convincing without new physics

Do not interpret beads/glitter/stars as a requirement for hundreds of simulated particles.

V1 should render them as deterministic appearance/inclusion marks tied to the squishy surface/material.

Existing filling/material shader ideas may be reused where they help, but the domain model should allow several mix-in types rather than one old `FillingId`.

Physical loose objects are out of scope.

---

## 6. Face deformation is partly free; expression animation is not

If face decals are in UV-space, the existing deformed mesh naturally stretches the face.

That already satisfies much of the desired 'face changes when stretched' feeling.

Do not build expression-state logic in S3 unless normal UV deformation looks insufficient on a phone.

Explicit mouth/eye expression swaps belong to S7 expressive polish.

---

## 7. Ear interaction is a separate technical class

Cat/bunny ears are not equivalent to flat decals.

For V1:

- anchor them to semantic top-left/top-right regions;
- follow hero transform/deformation approximately;
- no individual physics body;
- no dragging ears independently.

Only add draggable ears after the base accessory anchoring is visually accepted.

---

## 8. Library thumbnails must not multiply renderer cost

Do not instantiate 24 full WebGL squishies in the Library.

Recommended approach:

- one real hero renderer for active play;
- shelf thumbnails use lightweight 2D previews;
- generate previews lazily from saved procedural appearance for visible cards;
- do not persist large thumbnail images in cloud save unless measurement later proves it worthwhile.

---

## 9. Library capacity values are hypotheses, not sacred constants

`8 initial / +2 rewarded / 24 max` is a good launch hypothesis because it avoids instant ad pressure while preserving future expansion value.

Keep these as config values, not schema assumptions.

If real sessions rarely reach 8, slot monetization is weak and should not distort the product to force it.

---

## 10. Rewarded monetization must stay additive

Yandex requires rewarded ads to be voluntary and the reward to enhance the core experience rather than determine whether the user can continue playing.

Therefore when Library is full:

- free delete/replace path must remain;
- `+2 slots for ad` is optional convenience/abundance;
- basic creation remains possible without watching.

Permanent cosmetic unlocks are preferable for first implementation because they are easy to understand and less hostile than charging an ad every time a material is used.

---

## 11. Current interstitial policy should be adapted, not thrown away

The existing release session already has useful conservative controls:

- initial grace;
- minimum interval;
- minimum eligible actions;
- no call during active craft.

Preserve that philosophy.

Only change the eligible semantic boundary from old `collect → select` to new logical breaks such as:

- successful Save → Library;
- leaving a saved-squishy squeeze session → Library.

Do not request on every stage change.

---

## 12. Recipes should not become an image-recognition problem

The free paint surface makes exact visual comparison a trap.

Recipe matching should use metadata we already own:

- shape;
- selected material;
- colors used;
- mix-in types used;
- decal/accessory IDs used.

Never compare screenshots or calculate whether a player drew the 'correct' pattern.

The recipe is inspiration, not grading.

---

## 13. Architecture warning: stop growing `VerticalSliceApp.ts`

The current app file is already large. The pivot introduces Draft, Paint, Library, Recipe, Entitlement and Save V3 domains.

Do not implement the pivot as another thousand lines in the same controller.

Before or during S1, extract domain state and creation stages into focused modules. Keep renderer state separate from saved product state.

This is justified refactoring tied directly to the pivot, not generic architecture gardening.

---

## 14. Scope correction for first implementation

The first proof should **not** contain:

- recipe titles;
- rewarded ads;
- real cosmetic packs;
- draggable ears;
- expression swaps;
- 20 accessories;
- polished library UI.

The first proof should answer only:

> Can I freely paint one squishy, mix it, save it compactly, reload it, and squeeze the same custom design?

If yes, continue. If no, fix that foundation before adding systems.

---

## Final recommendation

Proceed with Sandbox Pivot 01.

Hard execution order:

`S0 appearance/save probe → S1 core pipeline → S2 library → S3 real decor → S4 recipes/titles → S5 rewarded monetization → S6 interstitial adaptation → optional S7 expressive polish`

Do not reverse this order just because assets or ad integration are easier to build than the paint/save foundation.
