# Squishy Squishes — Asset Pipeline

**Status:** PRE-DEVELOPMENT PROPOSAL

The art pipeline should preserve the project's strongest production advantage: most visual variety comes from runtime shape/material/filling configuration, not from dozens of flattened hero images.

---

## 1. Asset categories

### A. Runtime-procedural / data-driven

Prefer runtime generation/config for:

- base material gradients;
- translucency;
- sheen/iridescence/holographic response;
- edge/rim treatment;
- contact shadow;
- simple color variation;
- many filling placements;
- reveal glows/particles;
- deformable surface itself.

### B. Small authored reusable assets

Possible files:

- shape masks / SDFs;
- decals/faces;
- filling sprites (star, pearl, bubble, confetti flake, bead);
- small lab/mold icons;
- UI icons;
- occasional background/foreground texture if runtime gradients are insufficient.

### C. Audio

- low-fatigue lab ambience;
- pour/dispense texture;
- add/filling accents;
- mold press/release;
- reveal accents by hierarchy;
- collection/progression cue;
- UI feedback.

The validated continuous tactile texture remains generated/controlled through WebAudio rather than requiring one long squish recording per recipe.

---

## 2. Shape-master workflow

For each base shape:

1. explore several silhouette candidates cheaply;
2. inspect at hero size and recipe-card size;
3. select one canonical silhouette;
4. convert it into the runtime mask/SDF/shape representation;
5. verify the generic mesh/deformation engine does not need bespoke code;
6. verify silhouette stays coherent at allowed deformation extremes;
7. freeze the shape identity before mass-producing recipes.

Do not independently redraw geometry for each material tier.

MVP shape masters:

- mochi
- cube
- peach
- mushroom
- paw
- blob

---

## 3. Recipe-production workflow

For every canonical recipe:

1. start from an existing canonical shape;
2. define the dominant visual idea in one sentence;
3. choose material parameters;
4. choose bounded filling/decal/finish components;
5. preview in the actual runtime renderer;
6. inspect hero view + card/thumbnail view;
7. compare against neighboring catalog items;
8. reject if the visual delta is weak or production requires bespoke systems;
9. record config and any external asset sources;
10. run asset/runtime validation before integration.

A recipe should usually be a config addition plus at most a few small reusable art assets.

---

## 4. Suggested content schemas

Exact TypeScript types may evolve, but asset/config ownership should resemble:

```ts
interface ShapeDefinition {
  id: string;
  maskAsset: string;
  visualScale: number;
  visualOffset: readonly [number, number];
}

interface FillingDefinition {
  id: string;
  spriteAsset?: string;
  density: number;
  scaleRange: readonly [number, number];
  opacity: number;
}

interface DecalDefinition {
  id: string;
  asset: string;
  anchor: string;
  scale: number;
}

interface RecipeDefinition {
  id: string;
  shapeId: string;
  materialId: string;
  fillingIds: readonly string[];
  decalIds: readonly string[];
  finishId?: string;
  tier: number;
  stages: readonly CraftStageDefinition[];
}
```

Avoid file paths scattered through renderer code. Keep registry data authoritative.

---

## 5. Generated-image tooling

If AI-generated 2D assets are useful for decals, props or background elements, use the shared `mini-games-kit` image asset pipeline at the pinned full-game revision rather than rebuilding cutout/normalization tooling.

Expected pipeline responsibilities:

- background removal where required;
- alpha cleanup/normalization;
- consistent canvas/safe margin;
- validation of dimensions/file type;
- reproducible source-to-runtime output.

Squishy owns prompt/source logs and visual acceptance.

Do not flatten the core squishy itself into generated images; that would eliminate runtime deformation/material reuse.

---

## 6. Naming

Suggested runtime paths:

```text
public/assets/
  shapes/
    mochi-mask.webp
    peach-mask.webp
    ...
  decals/
    face-dot-smile.webp
    sakura-mark.webp
    ...
  fillings/
    star.webp
    pearl.webp
    confetti.webp
    ...
  ui/
  audio/
```

Data identifiers use stable kebab-case IDs.

Examples:

- `milk-mochi`
- `grape-jelly-mochi`
- `aquarium-cube`
- `xray-cyber-blob`

Do not encode localized display names into filenames/IDs.

---

## 7. Generated-art logging

When an external/generated asset enters production, keep enough provenance to reproduce or deliberately replace it:

- asset ID;
- source/tool;
- prompt/instructions if relevant;
- generation/edit date;
- selected source revision;
- cleanup notes;
- license/source notes where applicable.

Do not commit every rejected high-resolution exploration.

---

## 8. Card/thumbnail rendering

Prefer rendering recipe-card imagery from the same runtime recipe definition or from a controlled derived preview process rather than authoring a second unrelated illustration for every item.

Goals:

- same silhouette/material identity as gameplay;
- predictable card framing;
- cheap addition of new recipes;
- no drift between collection art and actual squishy.

If runtime card rendering is too expensive, generate cached previews from the same definitions during build/tooling.

---

## 9. Filling density / performance

Internal fillings must have explicit budgets.

Starting principle:

- use a small bounded visual count that reads as rich;
- avoid hundreds of individually animated objects;
- batch where practical;
- disable/reduce minor internal drift before reducing primary deformation quality;
- profile transparency/overdraw on mobile when translucent recipes exist.

The visual target is “full of interesting stuff,” not physically simulate all the stuff.

---

## 10. Audio production rules

### Tactile continuous layers

Use semantic progress/velocity rather than one looping sample whose loudness ignores interaction.

### One-shots

For repeated short cues:

- keep a small variation set or bounded pitch variation;
- avoid identical machine-gun repetition;
- control simultaneous voice count;
- avoid harsh broadband transients;
- higher-tier reveal should feel denser/more deliberate, not simply louder.

### Ambience

- low-fatigue baseline;
- no constant high-frequency hiss;
- premium foreground state may duck ambience briefly;
- restore deterministically after reveal/ad/pause ownership changes.

---

## 11. Content acceptance checklist

Before a recipe enters production catalog:

- [ ] shape reads at card size;
- [ ] dominant material idea is obvious without text;
- [ ] recipe is visibly distinct from adjacent unlocks;
- [ ] no accidental brand/IP mark;
- [ ] no malformed generated detail;
- [ ] decals deform coherently;
- [ ] filling does not visually detach from body;
- [ ] normal idle view looks finished;
- [ ] result remains attractive with reveal FX disabled;
- [ ] no recipe-specific gameplay code was required;
- [ ] asset weight is reasonable;
- [ ] RU/EN text is not baked into art;
- [ ] source/config is reproducible.

---

## 12. Scale checkpoint

Do not optimize the asset system for 200 recipes before 24 exist.

Once the real MVP catalog is integrated, profile:

- encoded download size;
- decoded GPU memory;
- startup cost;
- collection/card load behavior;
- transparent overdraw;
- mobile texture quality;
- cached card previews vs live rendering.

Use the simplest loading strategy that remains fast on real devices.
