# Squishy Squishes — Sandbox Pivot 01 Master Plan

**Status:** proposed source of truth for the next product version
**Scope:** product model, UX flow, architecture, save model, monetization, asset acquisition, phased implementation
**Supersedes:** recipe-gated progression as the primary game structure

---

## 1. Product thesis

Squishy Squishes should become a **sandbox squishy maker with a personal toy library**, not a progression game where content exists mainly to be unlocked.

Primary fantasy:

> Make any squishy you want, decorate it, save it as yours, then squeeze it whenever you want.

Primary loop:

`Library / Home → New Squishy → Shape → Paint → Mix-ins → Mix → Decorate → Save → Squeeze / Library → New Squishy`

The game should feel like a tactile creative toy rather than a sequence of recipes.

### Core principles

1. **All core creation verbs are available from the beginning.**
2. **All production shapes are available from the beginning.**
3. **No XP/rank gates on ordinary creation.**
4. **A player may continue from creative steps at any time.** There is no coverage requirement, score requirement or failure state.
5. **The player's own creations are the collection.** Canonical recipes stop being the primary collection.
6. **Recipes become optional inspiration/challenges.** They give humorous status progression, not access to the sandbox.
7. **Rewarded ads unlock optional abundance/cosmetics, not basic play.**
8. **Interstitial ads only happen at natural breaks and never interrupt paint, mixing, decorating or squeezing.**

---

## 2. Product model after the pivot

### 2.1 Primary mode — Studio / Sandbox

The default way to play.

The player creates a custom squishy from freely combinable parts and saves it into a finite personal library.

A saved squishy is not a reference to a canonical recipe. It is an immutable appearance snapshot that can be reopened later for tactile play.

### 2.2 Secondary mode — Recipe Book / Ideas

Recipes remain because they provide:

- direction for players who do not immediately know what to make;
- completion goals without restricting creativity;
- a lightweight reason to return;
- a place for humorous rank/status progression;
- reuse of the current 24 canonical recipes as design inspiration rather than hard content gates.

Recipes are **never required to unlock shapes, paint colors or the basic decoration system**.

### 2.3 Personal Library

The library becomes the retention backbone.

A saved item supports:

- open and squeeze;
- delete;
- view creation details;
- later: rename / favorite / duplicate, only if evidence justifies it.

The player always has a prominent `New Squishy` action.

---

## 3. New crafting pipeline

### Stage 0 — Library / Home

Primary content:

- saved squishies;
- large `New Squishy` CTA;
- optional `Ideas / Recipes` entry;
- compact humorous title/status;
- library capacity shown only where relevant.

Do not turn this into a dashboard.

### Stage 1 — Choose shape

All six production shapes are available immediately:

- Soft Square;
- Heart;
- Mochi;
- Peach;
- Mushroom;
- Paw.

Requirements:

- large visual options;
- one tap selects;
- instant hero preview;
- no rank labels, locks or XP.

### Stage 2 — Free paint

This is a real creative surface, not a coverage minigame.

V1 tools:

- soft brush;
- 3 brush sizes;
- color palette;
- color blending through alpha compositing;
- eraser that softly reduces paint alpha / rubs paint back toward the base;
- one-tap whole-body Fill tool using the selected paint color;
- undo last stroke;
- clear paint as a secondary action;
- `Continue` available immediately.

Rules:

- zero minimum coverage;
- player can paint one dot, a smiley, stripes, a gradient or fully cover the toy;
- paint is clipped by the selected shape;
- Brush/Eraser authoring may begin slightly outside the silhouette so the brush footprint can feather across the edge; squeeze/sticker/mix-in hit-testing remains shape-bound;
- strokes use normalized UV-space so the design follows deformation later;
- no scoring.

V1 deliberately does **not** attempt full Photoshop-style smudge/fluid simulation.

### Stage 3 — Mix-ins / Sprinkles

The player adds visual inclusions before mixing.

Initial free set should be small but expressive:

- glitter;
- stars;
- foam beads;
- pearls;
- hearts;
- confetti.

Interaction:

- choose a mix-in;
- tap/drag to scatter it into the squishy;
- erase/undo placement;
- combine multiple types;
- continue at any time.

Recommended V1 safety cap: **up to 3 active mix-in types per squishy**. This is a rendering/content-control limit, not a user-facing scarcity economy.

### Stage 4 — Mix / Stretch

Reuse the accepted tactile Mix interaction:

- real pointer travel;
- deformation/stretch;
- static hold is insufficient;
- no fail state.

Purpose changes: this is now a satisfying ritual that binds the creation together, not a recipe checkpoint.

After sufficient interaction, the player may continue.

### Stage 5 — Decorate

Two categories:

#### Surface decals

- eyes;
- mouths;
- blush;
- flowers;
- hearts;
- stars;
- stickers;
- bows / small flat ornaments.

Surface decals should live in squishy UV-space where possible. This gives natural deformation with the existing mesh without bespoke face physics.

#### Attached accessories

- cat ears;
- bunny ears;
- horns;
- large bow;
- flower crown / head flower.

V1 can use anchored 2D/2.5D accessories that follow the squishy transform.

**Deferred polish:** physically draggable ears and explicit expression-state changes during stretching. Those are valuable, but not required to prove the new core loop.

### Stage 6 — Finish / Save

The player sees the finished squishy at full prominence.

Actions:

- `Save to Library`;
- optional immediate `Squeeze` after successful save;
- `Back` to decor if the player wants to change something.

Saving should have a short tactile/reward beat, but not a long result receipt.

### Stage 7 — Squeeze / Play

A saved squishy opens in a clean tactile scene.

Core interaction:

- squeeze;
- pull/stretch;
- release;
- material/audio feedback;
- accessories follow deformation appropriately.

Actions remain secondary:

- Library;
- Delete;
- Make New.

---

## 4. Paint and appearance technical model

This pivot justifies one important renderer change: the squishy needs a persistent custom appearance texture rather than a single predefined palette pair.

### Recommended V1 representation

Use an offscreen 2D appearance canvas in normalized squishy UV-space.

Layers:

1. base material color/background;
2. paint strokes;
3. mix-in marks / procedural sprite placements;
4. face and flat sticker decals;
5. material/finish effect remains shader-driven where appropriate.

The WebGL squishy samples the custom appearance texture while preserving the existing deformation mesh.

This is preferable to making every brush stroke a DOM element or storing a full screenshot of the toy.

### Persistence strategy

Do **not** store arbitrary PNG/base64 screenshots as the canonical save state by default. They are unnecessarily large and difficult to evolve.

Store replayable procedural commands:

```ts
interface PaintStroke {
  tool: 'paint' | 'erase';
  color: string;
  alpha: number;
  radius: number;
  points: readonly NormalizedPoint[];
}

interface MixInPlacement {
  type: MixInId;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  seed: number;
}

interface DecalPlacement {
  decalId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}
```

Rebuild the texture deterministically when loading a saved squishy.

### Save-size protections

Before implementation lock concrete budgets, but V1 should include:

- point sampling by minimum movement distance;
- stroke simplification before save;
- hard maximum stroke count;
- hard maximum stored points per squishy;
- hard maximum mix-in placements;
- hard maximum decal placements;
- schema versioning.

When a hard appearance/decor budget is reached, the player must get an explicit visible limit notice. Only actions that would add more persisted detail become unavailable; Undo/Clear and every Continue/exit action remain usable.

If actual save payloads become excessive, optimize the procedural representation before switching to image blobs.

---

## 5. New save model

Current `SaveStateV2` is progression-centric and cannot represent player-created toys. Sandbox Pivot requires **SaveStateV3**.

Proposed model:

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

interface SavedSquishy {
  id: string;
  createdAt: number;
  shapeId: ShapeId;
  materialId: MaterialId;
  appearance: SavedAppearance;
}
```

No `labXp` is required as a gameplay gate.

### V2 → V3 migration

The existing game is pre-release/product-development state, but migration should still be deterministic.

Recommended behavior:

- keep `totalCrafts`;
- map old `completedVariantIds` to `completedRecipeIds` where IDs still correspond to migrated recipe challenges;
- discard old `labXp` as access control;
- start custom `library` empty because old canonical recipe completion is not equivalent to a player-created squishy;
- grant the default library capacity;
- preserve settings separately as today.

Do not fabricate saved custom toys from old canonical recipes merely to make migration look populated.

---

## 6. Library capacity and rewarded expansion

Recommended starting capacity: **8 saved squishies**.

Why 8:

- enough room for a meaningful first session;
- avoids immediate ad coercion;
- library still develops scarcity later;
- small enough that permanent expansion remains attractive.

Recommended expansion reward:

- `Watch ad → +2 permanent library slots`;
- cap initially at **24 slots** until real usage data says otherwise.

When the library is full, the player must still be able to continue without watching an ad:

- choose an existing squishy to delete/replace;
- or voluntarily watch a clearly-labelled rewarded ad for extra slots.

No forced rewarded ad.

---

## 7. Optional cosmetic monetization

### Free from the start

- all six shapes;
- broad ordinary color palette;
- brush + erase + undo;
- common glitter;
- common beads/stars/hearts;
- enough face pieces to create recognizable characters;
- several basic accessories;
- one or more standard material styles;
- save/squeeze/library core.

### Good rewarded unlock candidates

Permanent unlock packs are preferred over repeatedly charging an ad for every use.

Examples:

- `Holo / Galaxy material pack`;
- `Jelly / Glass material pack` if it is not part of the free baseline;
- `Pearl + premium sparkle mix-ins`;
- `Cute Faces Pack`;
- `Animal Ears Pack`;
- `Flowers & Bows Pack`;
- `Neon / Glow Pack` later;
- `+2 Library Slots`.

The exact free/premium split must be tuned after the asset set is known. Do not lock every attractive item behind advertising.

### Rewarded UX contract

Every rewarded button must explicitly communicate both facts before opening the ad:

- the user will watch an advertisement;
- the exact reward they receive.

Examples:

- `Смотреть рекламу → открыть голографик`
- `Смотреть рекламу → +2 места`

### Interstitials

Keep them only at logical breaks, for example:

- after Save → return to Library;
- after leaving a squeeze session back to Library;
- never between paint and mix-ins;
- never between Mix and Decorate;
- never while manipulating the toy.

Continue using a conservative gate rather than requesting an interstitial every craft.

Yandex controls whether an interstitial is actually shown after the request; our code should only decide whether a moment is eligible.

---

## 8. Recipe meta without progression gates

The current 24 recipes should be repurposed into **Ideas / Challenges**.

A recipe card contains a visual target such as:

- shape;
- one or two suggested colors;
- material/finish where relevant;
- one required mix-in;
- one optional decoration cue.

### Important implementation rule

Do not attempt pixel-perfect recognition of a freehand drawing.

Recipe completion should be based on known creation metadata, for example:

- correct shape;
- target color was used in at least one meaningful stroke;
- required mix-in was placed;
- required material selected;
- optional accessory/decal requirement where appropriate.

The player may deviate creatively and still save the squishy. A failed recipe match never blocks creation.

### Recipe entry

Starting from an Idea card should:

- select the required shape;
- show a small visual checklist during relevant steps;
- never disable other colors/decor;
- award completion only if the final save satisfies the loose recipe requirements.

---

## 9. Humorous title system

Titles are meta-progression only. They do not unlock sandbox content.

Recommended basis: **number of distinct recipe challenges completed**.

Example ladder to refine later:

1. `Новичок`
2. `Молодой сквишер`
3. `Жмякатель`
4. `Сквиш-стилист`
5. `Крутой сквишер`
6. `Сквишер-могер`
7. `Мастер жмяка`
8. `Верховный сквишер`

Possible thresholds for the existing 24 recipe challenges:

`0 / 2 / 5 / 8 / 12 / 16 / 20 / 24`

Do not display an XP bar unless later testing proves it improves motivation. The joke title itself is the reward.

---

## 10. UX information architecture

### Home / Library

Primary:

- `New Squishy`;
- saved toys.

Secondary:

- `Ideas`;
- title;
- settings/sound.

### Creation

One stage = one dominant verb.

1. `ФОРМА`
2. `РАСКРАСЬ`
3. `ДОБАВЬ`
4. `ЗАМЕШАЙ`
5. `УКРАСЬ`
6. `СОХРАНИ`

No persistent navigation dashboard during tactile steps.

### Recipe mode

Same creation screens, not a second implementation.

Recipe mode adds only a lightweight target/checklist layer.

---

## 11. Architecture changes

### Preserve

- raw WebGL2 spring/deformation core;
- shared shape boundaries;
- accepted Mix motion grammar;
- squeeze/release tactile physics;
- WebAudio foundation;
- runtime abstraction;
- Pages/Yandex dual build;
- Yandex lifecycle integration;
- permanent Browser QA philosophy;
- pinned shared kit unless a concrete blocker requires change.

### Replace / retire

- canonical recipe as the selected production object;
- rank-gated availability;
- paint coverage as a completion requirement;
- mandatory mold stage;
- canonical recipe Collection as the primary library;
- Lab XP as the visible core meta.

### New domain modules

Recommended separation:

- `sandbox/types.ts` — draft/saved appearance types;
- `sandbox/paint.ts` — brush command model + texture replay;
- `sandbox/mixins.ts` — mix-in definitions and deterministic placement rendering;
- `sandbox/decor.ts` — decal/accessory definitions and placement;
- `sandbox/library.ts` — capacity/save/delete/select semantics;
- `sandbox/recipes.ts` — optional recipe challenge definitions/matching;
- `sandbox/titles.ts` — humorous title derivation;
- `platform/saveV3.ts` or evolved save module — migration and persistence;
- existing renderer receives a bounded custom appearance texture integration rather than owning product state.

Avoid turning `VerticalSliceApp.ts` into an even larger state monolith. The pivot is the right moment to extract domain state and stage controllers.

---

## 12. Phased implementation roadmap

### Phase S0 — Technical appearance probe

Goal: prove the risky renderer change before rewriting the product shell.

Deliver only:

- one shape;
- offscreen UV paint texture;
- two paint colors that blend;
- soft eraser;
- persisted/replayed strokes;
- texture follows existing squeeze/stretch deformation.

Exit gate:

- paint looks stable while deforming;
- save payload is measurable and bounded;
- phone performance acceptable;
- no need to fork renderer per shape.

If this fails, stop and reassess before building library/decor systems.

### Phase S1 — Sandbox core

Deliver:

- all shapes open;
- Shape → Paint → Mix-ins → Mix → Finish;
- no mold stage;
- no progression gates;
- SaveStateV3 foundation;
- one custom squishy can be saved and reloaded;
- one saved squishy can be squeezed.

Use mostly procedural/placeholder decoration visuals here.

### Phase S2 — Personal Library

Deliver:

- 8 default slots;
- list/grid of saved custom squishies;
- select → squeeze;
- delete/replace;
- new squishy CTA;
- empty/full states;
- QA seeding/helpers outside Yandex build.

No rewarded ad required yet; prove the library UX first.

### Phase S3 — Decor MVP

Deliver:

- surface face pieces;
- stickers/flowers;
- simple anchored accessories;
- mix-in variety;
- creation previews and final save fidelity.

This is the first phase that depends materially on user-supplied/found assets.

### Phase S4 — Recipe meta + titles

Deliver:

- Ideas/Recipes entry;
- migrate current 24 recipes into loose challenge definitions;
- challenge checklist overlay;
- completion tracking;
- humorous title ladder;
- no access gates.

### Phase S5 — Rewarded monetization

Deliver:

- runtime rewarded-ad API seam;
- permanent cosmetic entitlements;
- +2 library slot reward;
- clear reward labels;
- persistence;
- offline/failure handling;
- Yandex QA exclusion rules as necessary;
- analytics for offer → ad → reward funnel.

### Phase S6 — Interstitial adaptation

Adapt the current conservative release gate to the new lifecycle.

Eligible boundary should be based on Library returns / completed saves, not old `collect → select` recipe stages.

### Phase S7 — Expressive polish

Only after core validation:

- draggable ears;
- richer accessory deformation;
- reactive expression changes;
- more premium material effects;
- stronger save/reveal celebration.

This phase is explicitly optional before launch if production burden grows.

---

## 13. Asset acquisition plan

The owner can collect these while engineering S0–S2 proceeds.

### P0 — Needed for Decor MVP

#### Face parts

Find separate transparent/vector assets, not flattened complete characters.

Target inventory:

- 6–8 eye pairs/styles;
- 6–8 mouths;
- 3 blush/cheek styles;
- 2–4 eyebrow/eyelash accents.

Preferred format: SVG. PNG transparent at 512px+ acceptable.

Search concepts:

- `kawaii face parts svg commercial use`
- `cute eyes mouth vector pack commercial license`
- `kawaii expression sticker svg`

#### Flat stickers

Target inventory:

- flowers × 4;
- hearts × 3;
- stars × 3;
- bows × 3;
- fruit/candy × 4–6;
- sparkle decals × 3.

Preferred style: soft toy / planner sticker, simple silhouette, thick readable shapes.

#### Attached accessories

Priority order:

1. cat ears;
2. bunny ears;
3. large bow;
4. horns;
5. head flower;
6. simple crown.

Prefer pieces that can be separated into left/right anchors where relevant.

### P1 — Nice for launch polish

- premium face pack;
- floral pack;
- fantasy pack;
- neon/glow iconography;
- extra bows/hats;
- premium sparkle shapes.

### P2 — Do not spend time finding yet

- complex 3D accessories;
- full character bodies;
- animated sprite sheets;
- large particle packs;
- detailed backgrounds;
- hundreds of decals.

### Mix-ins that should be procedural first

Do **not** hunt assets for basic:

- circular beads;
- pearls;
- stars;
- hearts;
- rectangular confetti;
- glitter specks.

These are cheaper and more coherent when generated from simple vector/procedural primitives.

### UI assets

Do not buy a separate UI pack unless the current design direction changes. Basic library/save/delete/ad icons can stay in one coherent icon system.

### Audio assets

Current procedural WebAudio should remain the default for engineering. Only search external foley if hands-on testing proves a specific interaction needs richer texture.

Potential later needs:

- sprinkle pour;
- sticker placement;
- soft accessory pop;
- save success;
- reward unlock sting.

### Licensing rule

For every external asset keep a manifest with:

- original URL;
- creator;
- exact license;
- purchase/order reference if applicable;
- whether attribution is required;
- local file mapping.

Prefer:

- CC0/public-domain;
- explicit commercial-use license;
- purchased asset packs with commercial game usage rights.

Avoid ambiguous `free for personal use`, unlicensed Pinterest reposts, random PNG mirrors, or assets requiring unclear downstream attribution.

---

## 14. Analytics after the pivot

High-value events only:

- `sandbox_new_start`;
- `shape_selected`;
- `paint_continue`;
- `mixins_continue`;
- `mix_complete`;
- `decor_continue`;
- `squishy_saved`;
- `library_open`;
- `saved_squishy_open`;
- `saved_squishy_delete`;
- `new_squishy_after_save`;
- `recipe_start`;
- `recipe_complete`;
- `reward_offer`;
- `reward_ad_result`;
- `reward_granted`;
- `library_full`;
- `interstitial_request/result`.

Do not log every brush point/decal drag.

Primary launch questions:

1. Do players save a first custom squishy?
2. Do they start a second creation?
3. Do they revisit saved toys to squeeze them?
4. Does the library become full?
5. Which rewarded cosmetics/slot offers get voluntary engagement?

---

## 15. QA contract

Permanent Browser QA must evolve from recipe completion to sandbox persistence.

Minimum final coverage:

- all shapes visible on fresh save;
- paint Continue works with minimal/no coverage;
- freehand paint persists through Mix and Save;
- erase changes the saved appearance;
- mix-in placement persists;
- one decal/accessory persists;
- saved custom squishy survives reload;
- library capacity enforced;
- delete frees a slot;
- full library still allows free replace/delete path;
- rewarded slot expansion only applies after a real rewarded callback;
- recipe completion never gates sandbox access;
- Yandex lifecycle still pauses gameplay/audio around ads;
- no QA/debug surface in Yandex bundle.

Keep real-pointer interaction where practical. Do not add test-only instant-completion paths to production.

---

## 16. Stop rules

Stop and reassess if:

- custom paint requires a renderer rewrite larger than the rest of the product;
- saved appearance payloads become unbounded;
- a single saved squishy routinely costs hundreds of KB without strong justification;
- accessories require shape-specific physics before the basic library loop is fun;
- monetization removes meaningful free creative choices;
- full-library state effectively forces an ad to continue;
- recipe matching starts requiring image recognition/computer vision;
- free painting is less fun than the old coverage interaction after a real phone test;
- the library feels like asset management rather than a toy shelf;
- the project starts adding dozens of cosmetics before one custom squishy is worth saving.

---

## 17. Recommended immediate execution order

1. Accept this product pivot as the new source of truth.
2. Run **Phase S0 — custom paint/deformation/save probe**.
3. In parallel, owner collects only P0 face/sticker/accessory assets from the acquisition plan.
4. If S0 passes, build S1 Sandbox Core.
5. Build S2 Library before serious recipe/meta or monetization work.
6. Integrate real decor assets in S3.
7. Add recipes/titles in S4.
8. Add rewarded monetization only after the free product loop is already satisfying.

The critical dependency is not ads, ranks or recipe copy. It is proving that a freely painted custom squishy can be created, saved, reloaded and still look/feel good while deforming.


## 15. Owner polish follow-up — 25 September 2026

This follow-up refines the already accepted freeform maker; it does not reintroduce recipe/XP gating.

- The durable material ID `chrome` remains unchanged for SaveState V3/backward compatibility, but its player-facing identity becomes **Metallic**: authored colour remains visible under denser, darker reflective bands rather than being replaced by neutral mirror chrome.
- Pages face art must not add unexplained white stripe highlights over line eyes/mouths. Expression ink should stay legible across Soft, Jelly, Pearl, Holo and Metallic.
- Squeeze/play needs deformation headroom beyond the visible resting body. Expand the transparent interactive/render playfield while preserving approximately the accepted resting toy size; do not solve clipping by shrinking the hero.
- Craft has an explicit exit-to-Library action. Unsaved work requires confirmation; already-saved Squeeze may return directly.
- Fill is a whole-body paint operation, not Photoshop flood-fill. It stays an ordinary replayable Appearance V1 stroke so V3/rollback compatibility remains intact. The current Fill replaces any prior Fill, is replayed beneath ordinary paint/eraser strokes, and remains the latest action in the stored stroke array so Undo removes it correctly.
- Localized draggable ears/appendage physics remain deferred expressive polish.


### Material differentiation follow-up — 25 September 2026

Owner review with yellow and multi-colour paint established the material hierarchy for the next polish pass:

- **Soft** remains the neutral baseline and should not be chased by every material change.
- **Marshmallow** must read as opaque, powdery, milky and light-wrapped rather than merely a paler Soft.
- **Pearl** must read as smooth nacre with slow rose/cyan angle bands; it must not collapse into Marshmallow or become full-spectrum Holo.
- **Jelly** remains the most translucent material, but saturated authored paint must retain its hue/chroma instead of being washed into aqua.
- **Holo** gets a more directional spectral sweep and slightly stronger cool response on light/warm paint while preserving authored stripes.
- **Metallic** keeps its successful colour-preserving reflective identity; only the darkest reflected bands may be softened modestly so custom paint remains legible.
- Light-colour compensation is evaluated per authored pixel luminance/chroma, not as a palette-specific special case, so mixed/striped paint remains coherent.
- Finish is also a tactile material-preview surface: the live toy may be dragged/released there using the same simulation/input owner as Squeeze. Material buttons and Keep It remain normal UI controls; no second physics/input path is introduced.
