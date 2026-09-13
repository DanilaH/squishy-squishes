# Squishy Squishes — Art Direction

**Status:** PRE-DEVELOPMENT PROPOSAL

## 1. One-line direction

**Premium tactile toy lab:** a dark studio/lab backdrop that makes bright semi-gloss designer-toy squishies feel expensive, touchable and collectible.

The target is not realism. The target is material desire.

---

## 2. Visual identity

### Environment

Primary environment language:

- deep plum / indigo / near-black studio tones;
- soft radial light behind the hero;
- controlled contact shadow;
- subtle glass/acrylic/lab-surface cues where useful;
- minimal background detail;
- enough ambient motion to avoid a dead screenshot without becoming noisy.

The environment should make the current squishy the brightest, most saturated and most materially interesting thing on screen.

### Squishies

Squishies should read as:

- thick;
- soft;
- slightly glossy or materially rich;
- rounded and toy-like;
- collectible rather than edible-photoreal;
- tactile before they are “cute.”

Use **designer-toy / kawaii-lite**, not preschool kawaii.

Faces are optional accents, not the identity of every object.

---

## 3. Anti-directions

Avoid:

- white/pastel generic DIY-app background;
- rainbow overload;
- toddler/preschool visual language;
- photoreal craft bench clutter;
- realistic industrial factory simulation;
- candy-shop UI around every surface;
- heavy black outlines everywhere;
- random glitter on every tier;
- mobile-game particle spam masking weak material rendering;
- full-screen rarity color washes that erase the lab continuity;
- AI-art inconsistency between recipes.

The game should look like one authored product, not a collage of generated assets.

---

## 4. Color strategy

### Environment palette

Keep environment chroma restrained so recipe colors can vary widely.

Working family:

- black-plum / charcoal base;
- muted violet ambient light;
- subtle cool/warm accents depending on recipe;
- off-white UI text rather than pure white everywhere.

### Object palette

Recipes may use:

- milk/cream;
- lavender/grape;
- peach/coral;
- bubblegum pink;
- aqua/teal;
- lime/slime green;
- dark oil black;
- spectral/holographic accents.

The object palette is allowed to be playful because the environment remains controlled.

---

## 5. Material hierarchy

Material differences must remain readable with particles/audio disabled.

### Opaque milk / soft plastic

- broad soft gradient;
- subtle edge darkening;
- restrained sheen;
- minimal internal detail.

### Jelly / translucent

- brighter rim/transmission cue;
- depth tint;
- visible internal filling where present;
- avoid physically expensive true refraction.

### Pearl / iridescent

- view/pointer-responsive hue shift;
- broad highlight, not glitter noise;
- premium without chrome hardness.

### Oil-slick

- dark base;
- bounded spectral highlight;
- strong thumbnail contrast;
- preserve softness in deformation.

### Holographic / showcase

- directional spectral banding/sheens;
- low-frequency material movement;
- do not animate the entire surface independently of player/idle state.

### Aquarium / filled clear body

- clear/translucent body;
- small bounded filling count;
- internal pieces may drift cosmetically but are not physics bodies;
- keep silhouette readable.

---

## 6. Shape language

Base forms should be:

- compact;
- broad enough to deform visibly;
- recognizable in silhouette;
- free of thin fragile appendages;
- visually compatible with the same generic mesh/deformation system.

MVP shape set:

- Mochi/Dumpling
- Soft Cube
- Peach/Fruit Puff
- Mushroom
- Paw
- Blob Creature

Each shape should have one canonical master silhouette. Material variants modify surface/internal treatment more than geometry.

---

## 7. Faces and character cues

Faces are a spice.

Guidelines:

- use very simple eyes/mouth when a recipe benefits;
- avoid turning all six shapes into mascot characters;
- abstract/material-first recipes should remain face-free;
- facial marks should deform coherently with the surface;
- expressions should not require animation rigs in MVP.

Blob Creature can carry more character identity than the other shapes without establishing a rule that all content needs characters.

---

## 8. Crafting-stage presentation

Crafting tools/molds should be stylized functional props, subordinate to material.

### Pour

- soft viscous stream / blob accumulation;
- material color clearly visible;
- vessel and target have simple premium lab geometry.

### Add/filling

- bounded visible pieces;
- clean trajectories;
- no confetti storm unless the recipe itself is confetti-based.

### Mix/squish

- hero material fills the composition;
- preserve validated deformation language;
- background responds subtly, not theatrically.

### Mold

- mold silhouette clearly previews transformation;
- contact/press feels weighty;
- no need to show realistic silicone/manufacturing detail.

### Reveal

- short visual quiet;
- mold separation;
- object settles into hero pose;
- premium recipes get more perceived mass/light ownership, not only more particles.

---

## 9. UI direction

UI should feel like a restrained translucent instrument panel around a toy photo studio.

Use:

- dark translucent surfaces;
- generous rounded corners;
- thin low-contrast borders;
- compact labels;
- modern rounded sans-serif typography;
- large touch targets;
- clear progress without large permanent HUD blocks.

Avoid:

- skeuomorphic lab dashboards;
- dense inventories;
- multiple currencies in the top bar;
- huge gradient CTA stacks;
- overly cute bubble fonts;
- pixel/Y2K language from Signal 2000.

The new game needs its own identity.

---

## 10. Typography and iconography

Typography:

- contemporary rounded sans-serif;
- strong numeric readability for rank/progress;
- RU/EN support;
- no text baked into raster art.

Icons:

- simple filled/rounded geometry;
- consistent stroke/fill language;
- use familiar symbols for collection, sound, back, replay;
- avoid inventing icons when a label is clearer.

Exact font is an implementation/art-production decision after in-browser sample review.

---

## 11. Motion language

Motion should reinforce softness and ownership.

Preferred:

- damped settle;
- one restrained rebound;
- slow ambient float/breathing where appropriate;
- responsive shadow/sheens;
- short anticipation pause before reveal;
- object-to-destination collection transfer when it helps causality.

Avoid:

- constant bobbing of every UI element;
- endless jelly oscillation;
- global screen shake for ordinary results;
- unrelated particle systems running continuously;
- large easing delays between player action and visual response.

---

## 12. Reward hierarchy

Higher collection tier should change multiple coordinated channels, but each remains bounded.

Possible hierarchy:

### Tier 1

- clean settle;
- small soft pop;
- simple environment response.

### Tier 2

- slightly richer material reveal;
- stronger light ownership;
- small filling motion.

### Tier 3

- brief ambience duck;
- denser but restrained reveal accent;
- premium material movement.

### Tier 4

- strongest anticipation/quiet;
- deliberate premium settle;
- fuller low-frequency audio contour;
- environment accents remain additive rather than replacing the scene.

Rarity/value should feel heavier and more special, not merely louder/brighter.

---

## 13. Thumbnail / store image rule

The discovery image should sell the object immediately.

Preferred composition:

- one large showcase squishy;
- dark clean background;
- very readable premium material (holographic/aquarium/oil-slick candidate);
- visible deformation or hand-like press cue only if it remains readable;
- minimal text, ideally none baked into the art;
- no tiny collection grid in the primary icon/thumbnail.

The game should be distinguishable from generic DIY titles at small size through dark-premium contrast and material rendering.

---

## 14. Content-production consistency

For each base shape:

1. establish one canonical silhouette/mask;
2. test at hero size and recipe-card size;
3. derive recipe variants through material/filling/decal/finish config;
4. only create unique raster/vector assets for reusable motifs or unavoidable silhouette detail;
5. compare new recipe against existing catalog before acceptance.

Do not generate each recipe independently as a complete flattened image. That would destroy both visual consistency and the runtime deformation advantage.

---

## 15. Art acceptance

Before recipe/content enters the catalog:

- silhouette reads at small size;
- it belongs to the same toy-lab world;
- material identity is clear without labels;
- no accidental brand/IP marks;
- no malformed AI-generated micro-detail;
- internal filling density remains bounded/readable;
- deforming surface does not visibly detach from decal/filling presentation;
- common/simple recipe is still desirable;
- premium recipe is richer without visual soup;
- normal idle state looks finished without relying on reveal FX.
