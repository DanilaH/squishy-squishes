# Squishy Squishes — Content & Progression

**Status:** ACTIVE SUPPORTING DIRECTION — Phase 5 Progression + Collection
**Important:** `PROGRESSION_COLLECTION_01.md` defines the bounded 12-recipe validation tuning. Its XP values/unlock order are test parameters, not final launch balance.

---

## 1. Content strategy

The game should create a large amount of perceived novelty from a deliberately small production base.

Primary content model:

```text
shape × palette/material × filling × face/decal × decoration × finish
```

MVP does **not** expose every mathematical combination. It uses a curated catalog so each unlock has a clear identity and art direction remains controlled.

The target is approximately:

- 6 base shapes;
- 24 canonical recipes;
- one shared deformation engine;
- a small material/filling/finish vocabulary reused across recipes.

The production test is not “can we imagine 100 recipes?” It is “can recipe #24 be materially cheaper than recipe #1 while still looking new?”

---

## 2. Base shapes

### Proven production shapes

1. **Soft Cube** — accepted baseline; strong deformation readability.
2. **Soft Heart** — accepted second silhouette; materially different concave outline on the same renderer/deformation path. It is now a real MVP candidate, not a disposable technical test.

### Remaining MVP candidates

- **Mochi / Dumpling** — rounded soft starter; immediately reads as squeezable.
- **Peach / Fruit Puff** — asymmetric silhouette with a small cleft/detail.
- **Mushroom** — broad cap + thick stem; visually distinctive under squash.
- **Paw** — recognizable tactile silhouette; pads can support subtle material accents.
- **Blob Creature** — abstract designer-toy form for stranger/adult-neutral recipes.

The old planning list predated the successful Heart reuse gate. The final six launch shapes are therefore **not locked yet**: Soft Heart remains in contention and one of the remaining candidates may be cut after representative content/material expansion. Do not discard a proven low-burden shape merely to preserve the old count.

### Reserve / post-MVP candidates

- Cloud / Pillow
- Capsule / Pebble

Do not increase the launch target above roughly six shapes before the content system proves cheap and stable.

## 3. Shape implementation rule## 3. Shape implementation rule

A shape is primarily a **silhouette / mask / geometry profile**, not a unique gameplay implementation.

Allowed per-shape configuration may include small bounded parameters such as:

- mask/SDF identifier;
- visual pivot/scale;
- softness multiplier;
- bulge multiplier;
- return multiplier;
- contact-shadow profile;
- optional decorative anchor points.

Forbidden by default:

- unique physics solver;
- unique pointer rules;
- hand-authored per-vertex behavior;
- unique game state machine;
- custom rendering engine path.

If several shapes need bespoke deformation fixes, stop and repair the generic shape/deformation representation instead of normalizing one-off code.

---

## 4. Material vocabulary

The MVP should use a small set of visually strong material families that scale well in shader/config form.

### Base material families

- milk / opaque soft matte-gloss;
- jelly / translucent candy;
- pearl / pearlescent iridescent;
- oil / dark oil-slick sheen;
- holographic / spectral sheen;
- aquarium / clear translucent with visible filling;
- chrome-soft / stylized metallic-soft finish for premium results;
- cyber/x-ray / translucent dark body + internal accent treatment.

Not every family requires unique shader architecture. Prefer one material shader with bounded feature toggles/parameters where practical.

---

## 5. Filling / decoration vocabulary

Potential reusable fillings:

- bubbles;
- boba-like dark beads;
- small stars;
- confetti flakes;
- pearl beads;
- tiny suspended shapes;
- stylized “circuit” strips for cyber/x-ray recipes.

Potential surface accents:

- simple face/decal;
- cheek marks;
- star/moon motif;
- fruit leaf/detail;
- paw-pad treatment;
- restrained charm/tag when composition needs it.

Keep filling object counts bounded. Perceived richness must not imply hundreds of physics bodies.

---

## 6. Visual tiers

The current proposal uses four **collection tiers** as a presentation/progression hierarchy, not a random loot table.

### Tier 1 — Simple / tactile

- opaque or simple two-tone material;
- little/no filling;
- readable shape;
- desirable even without effects.

### Tier 2 — Material novelty

- translucent/frosted treatment;
- simple beads/bubbles;
- stronger palette contrast.

### Tier 3 — Premium composition

- pearl/aquarium/confetti/galaxy language;
- richer internal detail;
- stronger reveal/audio hierarchy.

### Tier 4 — Showcase

- oil-slick / holographic / chrome / x-ray / cosmic identity;
- clear thumbnail hook;
- still based on the same production grammar;
- premium without detail soup.

Working UI names may eventually be Common/Rare/Epic/Legendary or a more brand-specific vocabulary. The technical/content model should not depend on the final labels.

---

## 7. Initial 24-recipe catalog

Names below are **working production names**, not final localization copy.

### Mochi

| Tier | Working recipe | Main content delta |
| --- | --- | --- |
| 1 | Milk Mochi | opaque milk base, minimal face/accent |
| 2 | Grape Jelly Mochi | translucent violet jelly |
| 3 | Galaxy Pearl Mochi | pearlescent body + star/pearl filling |
| 4 | Black Oil Mochi | dark oil-slick spectral finish |

### Soft Cube

| Tier | Working recipe | Main content delta |
| --- | --- | --- |
| 1 | Strawberry Cream Cube | pink/cream opaque material |
| 2 | Boba Cube | translucent tea tone + dark beads |
| 3 | Aquarium Cube | clear aqua + bubbles/suspended accents |
| 4 | Holographic Prism Cube | spectral/holo finish |

### Peach / Fruit Puff

| Tier | Working recipe | Main content delta |
| --- | --- | --- |
| 1 | Peach Milk Puff | peach/cream soft material |
| 2 | Sakura Jelly Peach | translucent pink + restrained blossom decal |
| 3 | Candy Confetti Peach | clear candy body + confetti filling |
| 4 | Chrome Sunset Peach | stylized warm chrome/iridescent finish |

### Mushroom

| Tier | Working recipe | Main content delta |
| --- | --- | --- |
| 1 | Vanilla Mushroom | simple cream/pastel two-zone material |
| 2 | Grape Glow Mushroom | translucent violet cap + glow-like rim |
| 3 | Forest Sparkle Mushroom | deeper green/purple palette + sparkle filling |
| 4 | Cosmic Mushroom | galaxy body + premium internal stars |

### Paw

| Tier | Working recipe | Main content delta |
| --- | --- | --- |
| 1 | Milk Paw | soft neutral body + simple pads |
| 2 | Bubblegum Paw | translucent pink / bubble treatment |
| 3 | Boba Paw | tea-jelly body + bead filling |
| 4 | Aurora Paw | pearlescent/holographic pads and body |

### Blob Creature

| Tier | Working recipe | Main content delta |
| --- | --- | --- |
| 1 | Lavender Blob | clean purple designer-toy identity |
| 2 | Slime Bubble Blob | translucent green/blue + bubbles |
| 3 | Galaxy Blob | dark translucent cosmic treatment |
| 4 | X-Ray Cyber Blob | smoked clear shell + internal neon/circuit accent |

---

## 8. Catalog quality rules

Every canonical recipe must pass:

- recognizable at small card/thumbnail size;
- visibly different from adjacent unlocks;
- one dominant material/content idea rather than five weak ideas;
- no trademark/brand dependence;
- no childlike overload unless deliberately chosen;
- same general premium toy-lab identity;
- feasible with shared shape/material/filling systems;
- no bespoke mechanic needed;
- no expensive unique animation required;
- finished item still looks good while idle for 30+ seconds;
- result remains readable with effects reduced.

A visually weak recipe should be replaced, not rescued with more particles.

---

## 9. Progression model

### Primary proposal: Lab Rank

One compact progression track exposes the catalog.

Durable concepts:

```text
labXp
labRank
unlockedRecipeIds
completedRecipeIds
totalCrafts
```

`labRank` should be derivable from XP/config where possible instead of persisted redundantly unless persistence simplicity argues otherwise.

### Progress sources

Proposed behavior:

- first completion of a recipe → strong XP award;
- repeat completion → much smaller XP award;
- optional rewarded-ad bonus may multiply/add XP after result acceptance;
- no ingredient spend and no craft failure tax.

The player should be rewarded most for seeing new content but remain free to replay favorites.

---

## 10. Unlock cadence

Goals:

- first new recipe arrives almost immediately;
- first new shape arrives early enough to prove content variety;
- later premium materials are visible/teased well before unlock;
- no long drought between meaningful unlocks;
- full 24-item collection remains realistically completable in a compact game.

### Proposed structure

Use a deterministic unlock table rather than procedural/random unlock selection.

Example shape of the table:

```text
Rank 1  → 2 starter recipes
Rank 2  → new recipe + first new material
Rank 3  → new shape + recipe
Rank 4  → new recipe
Rank 5  → new shape + recipe
...
late ranks → Tier 3/4 showcase recipes
```

Exact rank thresholds and recipe order are deliberately **not locked yet**. They should be tuned after one end-to-end vertical slice establishes real craft duration and session rhythm.

Do not encode final XP balance before that timing evidence exists.

---

## 11. Starter content proposal

For first-session variety, the current preference is to start with **two visually different recipes**, not all content and not a single shape for too long.

Candidate starters:

- Milk Mochi
- Strawberry Cream Cube

Then reveal/tease Lavender Blob or Grape Jelly Mochi as the first unlock.

This is a pre-development choice to confirm, not a hard requirement.

---

## 12. Collection read model

Adapt the proven pure-read-model pattern from Signal 2000 rather than coupling collection UI to mutable scene state.

Squishy-local snapshot might expose:

```ts
interface CollectionSnapshot {
  completed: number;
  total: number;
  byShape: readonly ShapeCollectionSnapshot[];
  nextNearCompletion?: {
    shapeId: string;
    missingRecipeId: string;
  };
}
```

The exact type remains local because Squishy content semantics differ from Signal 2000.

Useful pure helpers:

- completed count;
- per-shape completion;
- nearest collection completion milestone;
- featured highest-tier completed recipe for a shape;
- locked/unlocked/completed card state.

---

## 13. Collection milestones

Use milestones sparingly and only when they create a meaningful celebration.

Candidate MVP milestones:

- first completed squishy;
- first completed shape set (all four recipes for one shape);
- half catalog;
- full catalog.

At most one high-priority milestone celebration should own the foreground after a craft.

Completion outranks halfway/first-time events when multiple conditions occur together.

This is adapted from the previous project's pure milestone-resolution pattern, but milestone names/content remain Squishy-specific.

---

## 14. Repeats and duplicates

There are **no duplicates** in the loot-box sense because the player intentionally crafts a recipe.

Repeat crafting:

- remains allowed;
- gives reduced progression value;
- may be used simply because the object is fun to make/squeeze;
- does not produce duplicate currency conversion in MVP.

Do not import Signal 2000's duplicate sink merely because the code/pattern exists.

---

## 15. Freeplay / remix

A component-mixing freeplay mode is a plausible extension because the content architecture naturally supports it.

It is **not MVP**.

Only consider it after:

- the curated 24-recipe loop is fun;
- content config really is composable;
- UI for component selection can stay small;
- it adds replay value without undermining curated unlock anticipation.

Do not build a combinatorial editor before the basic game ships.

---

## 16. Expansion rule

Post-launch content should prefer:

1. new curated recipe using existing shape + new material/filling;
2. new shape that immediately supports several recipes;
3. small new finish/decal family reusable across shapes;
4. only then, a genuinely new interaction stage if player evidence shows it is needed.

The cheapest visible novelty wins.

A content addition that requires a new subsystem should be evaluated as a feature, not smuggled in as “one more recipe.”
