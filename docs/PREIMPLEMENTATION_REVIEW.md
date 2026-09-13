# Squishy Squishes — Pre-Implementation Review

**Status:** OPEN  
**Purpose:** final product/architecture confirmation before full-game coding begins.

The tactile thesis is already PASS. This review is not permission to reopen broad market research or keep tuning the isolated probe. It resolves only the decisions that materially affect the full-game implementation.

---

## 1. Already confirmed — do not reopen without new evidence

### A. Build Squishy Lab / Maker

The feel probe passed. Custom Headphones returns to reserve/fallback status rather than remaining the next build.

### B. Keep the cheap 2D tactile core

No true soft-body physics / real-time 3D is needed for the product baseline.

### C. Premium tactile toy-lab art direction

Dark plum/indigo studio, bright semi-gloss designer-toy objects, material-rich presentation, kawaii-lite rather than childlike.

### D. Manufacturing ritual

Conceptually:

`pour → add → mix/squish → mold → reveal → decorate/finish → test squeeze → collect`

Stages are composed from a small reusable interaction grammar; not every recipe uses every optional stage.

### E. High-CMF content

Perceived variety comes primarily from:

`shape × material/palette × filling × decal/face × decoration × finish`

No bespoke deformation/gameplay system per recipe.

---

## 2. Decision to confirm — launch content target

### Recommended

**6 base shapes / ~24 curated recipes**.

MVP shapes:

1. Mochi/Dumpling
2. Soft Cube
3. Peach/Fruit Puff
4. Mushroom
5. Paw
6. Blob Creature

Cloud/Pillow and Capsule/Pebble stay reserve.

### Why

- enough visual collection for meaningful progression;
- four recipes per silhouette gives real CMF test;
- production remains bounded;
- additional shape families can be post-launch content.

### Scope escape hatch

24 is a target, not a quota. If runtime content production shows that 18–20 excellent recipes are better than 24 repetitive/filler recipes, revise explicitly.

**Confirm / change:** OPEN

---

## 3. Decision to confirm — deterministic recipes

### Recommended

Player selects the recipe/result they are making. The main reward is transformation/material unlock, **not random loot**.

### Why

- stronger maker fantasy;
- differentiates this project from the chest/unboxing portfolio grammar;
- avoids duplicates/pity/random reward economy;
- keeps progression readable and cheap.

Cosmetic microvariation can remain random without changing recipe identity.

**Confirm / change:** OPEN

---

## 4. Decision to confirm — progression model

### Recommended

One **Lab XP / Lab Rank** progression track.

- first-time recipe completion → strong XP;
- repeat → smaller XP;
- rank → deterministic recipe/material unlocks;
- no spendable currency;
- no ingredient inventory/crafting costs;
- no shop/orders/customers/upgrades in MVP.

Exact XP values and unlock thresholds wait until the first full vertical slice gives actual craft-time evidence.

### Alternative if we want even less system

Direct recipe-to-next-recipe unlock chain with no XP/rank.

This is cheaper, but gives less flexible progression and weaker rewarded-ad placement.

**Recommended choice:** Lab Rank, still one system only.

**Confirm / change:** OPEN

---

## 5. Decision to confirm — tech baseline

### Recommended

**strict TypeScript + Vite + raw WebGL2 hero + DOM/CSS UI**.

Do not add Phaser/React/physics/3D initially.

Move full-game shared dependency to reviewed:

`DanilaH/mini-games-kit@d17ba31fce2a71335dcc3095f772c3fdd87fe97b`

Reasons:

- probe already proved raw WebGL2 feel;
- DOM keeps RU/EN/UI cheap;
- newer kit adds Yandex runtime, JSON repository and browser lifecycle helpers;
- less framework surface for a small game.

Escalate renderer/framework only if implementation evidence shows raw WebGL2 itself becomes the dominant cost.

**Confirm / change:** OPEN

---

## 6. Decision to confirm — orientation

### Recommended starting position

Support responsive desktop/mobile layouts **including portrait if it remains visually good**, rather than inheriting Signal 2000's landscape-only rule.

Why:

- one centered hero object is naturally adaptable;
- UI is sparse;
- portrait may expand playable mobile surface without much architecture cost.

Fallback:

If first production layout shows portrait materially hurts composition/interaction, lock landscape with the shared orientation blocker and a simple rotate gate.

### Alternative

Lock landscape immediately for tighter composition and less layout QA.

**Confirm / change:** OPEN

---

## 7. Decision to confirm — monetization posture

### Recommended

Interstitial:

- only after result Collect / between loops;
- initial grace;
- several completed crafts between requests;
- conservative cooldown;
- never during tactile stage/reveal/result squeeze.

Rewarded:

- at most one MVP offer;
- candidate: optional fixed/bonus Lab XP after a completed craft;
- no permanent core recipe locked exclusively behind an ad.

Sticky banner:

- none over the tactile lab by default.

Exact cadence waits for measured craft/session duration.

**Confirm / change:** OPEN

---

## 8. Decision to confirm — mid-craft reload behavior

### Recommended

Do **not** persist every short crafting gesture.

If the page reloads during an unfinished craft, restart that craft. Persist meaningful completed result/progression only.

Why:

- stages are short;
- transaction complexity would not currently buy enough user value;
- shared durable transaction primitive remains available if later design introduces a real exactly-once staged reward problem.

**Confirm / change:** OPEN

---

## 9. Decision to confirm — first starter content

### Recommended

Start with two available recipes to establish variety immediately:

- Milk Mochi
- Strawberry Cream Cube

First unlock should visibly escalate material/shape, candidate:

- Grape Jelly Mochi, or
- Lavender Blob.

The exact sequence can change during vertical-slice tuning, but first-session variety should arrive early.

**Confirm / change:** OPEN

---

## 10. Deferred intentionally — do not decide before evidence

The following should **not** block development start after the above review:

- exact XP numbers;
- exact rank count;
- exact recipe order after first few unlocks;
- final font;
- final recipe marketing names;
- final interstitial seconds/craft-count thresholds;
- exact rewarded XP amount;
- whether collection freeplay/remix is worth adding post-MVP;
- whether presentation skip is needed;
- cloud Player Data reconciliation details until save structure is implemented;
- exact final catalog count if quality/production evidence recommends a bounded revision.

---

## 11. Proposed implementation start after confirmation

Once the open decisions above are confirmed:

1. update this file and `DECISIONS.md`;
2. merge the planning PR;
3. start Phase 1 from `IMPLEMENTATION_ROADMAP.md`;
4. first production goal is app/platform/save/debug skeleton, not mass content;
5. first major product gate is one complete end-to-end starter recipe vertical slice;
6. only after that feels good do we lock progression timing and scale content production.

---

## 12. Review summary

The default package being proposed is:

> **Raw-WebGL premium toy-lab game, deterministic curated recipes, 6 shapes / ~24 results, one Lab Rank track, no currency/shop, responsive mobile+desktop starting assumption, conservative between-loop ads, and aggressive reuse of the reviewed shared platform/feel kit without importing Signal 2000's product systems.**

That is the package to confirm or edit before development starts.
