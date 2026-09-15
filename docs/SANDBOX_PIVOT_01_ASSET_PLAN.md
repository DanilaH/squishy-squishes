# Squishy Squishes — Sandbox Pivot 01 Asset Acquisition Plan

This is the owner's parallel acquisition checklist while engineering proves the sandbox paint/library core.

**Rule:** do not collect a giant asset dump. Acquire only items with a known use in S3 Decor MVP or later monetization packs.

---

## P0 — Find first

### Face parts

Preferred: separate SVG pieces with transparent backgrounds and commercial-use rights.

Target:

- [ ] 6–8 eye styles / pairs
- [ ] 6–8 mouth styles
- [ ] 3 blush / cheek styles
- [ ] 2–4 eyebrow / eyelash accents

Useful searches:

- `kawaii face parts svg commercial use`
- `cute eyes mouth vector pack commercial license`
- `kawaii expression sticker svg`
- `cute face elements vector game asset`

Do not buy flattened full characters. We need composable pieces.

### Flat stickers

Target:

- [ ] flowers × 4
- [ ] hearts × 3
- [ ] stars × 3
- [ ] bows × 3
- [ ] fruit/candy × 4–6
- [ ] sparkle decals × 3

Useful searches:

- `cute sticker pack svg commercial use`
- `kawaii planner stickers vector commercial`
- `cute flower heart star svg pack commercial license`

Preferred look:

- chunky readable silhouettes;
- soft-toy / sticker aesthetic;
- not ultra-detailed;
- not toddler-education clipart;
- consistent outline/lighting language across the pack.

### Attached accessories

Priority:

- [ ] cat ears
- [ ] bunny ears
- [ ] large bow
- [ ] small horns
- [ ] head flower
- [ ] simple crown

Useful searches:

- `cat ears vector transparent commercial use`
- `kawaii animal ears svg game asset`
- `cute bow flower crown vector commercial license`

For ears/horns prefer assets that can be separated into left/right pieces or already ship as separate pieces.

---

## P1 — Monetization / launch polish candidates

Do not acquire these until P0 has a coherent style.

- [ ] premium face expressions
- [ ] flowers & bows expansion
- [ ] fantasy ears/horns/crowns
- [ ] neon/glow decal pack
- [ ] premium sparkle shapes
- [ ] candy/fruit themed pack
- [ ] spooky/macabre-cute pack if it fits the final store audience

These are candidates for permanent rewarded unlock packs, not requirements for the free creation loop.

---

## Do not hunt external assets for these yet

Engineering should generate simple versions procedurally first:

- beads;
- pearls;
- glitter specks;
- stars;
- hearts;
- confetti rectangles;
- simple sparkle shapes;
- basic gradients/noise for material effects.

Buying particle packs here would increase visual inconsistency and production burden without proving value.

---

## Audio

Do not pause engineering to find audio yet. Current WebAudio is sufficient for the sandbox proof.

Only search richer samples after phone testing identifies a weak beat.

Potential later needs:

- [ ] sprinkle pour / tiny bead rattle
- [ ] sticker placement pop
- [ ] accessory placement pop
- [ ] save-to-library reward sting
- [ ] permanent unlock reward sting

Preferred format: WAV source + game-optimized export later.

---

## UI

Do not buy a standalone UI kit.

Need only a coherent icon language for:

- save;
- delete;
- new squishy;
- library;
- undo;
- eraser;
- brush size;
- rewarded ad;
- extra slots;
- recipes/ideas.

Reuse one icon family or draw simple icons internally.

---

## File-format requirements

### Preferred

- SVG for faces, stickers and flat accessories;
- transparent PNG if SVG is unavailable;
- PNG source should ideally be 512×512 or larger for a single decal/accessory;
- layered/separate pieces where interaction may need independent anchors.

### Avoid

- JPG for transparent assets;
- watermarked previews;
- packs only supplied as flattened screenshots;
- tiny 64–128 px raster originals;
- AI-upscaled images with broken transparent edges;
- PSD-only packs unless export rights/workflow are trivial.

---

## Licensing rule

Every external asset must be recorded before it enters production.

Create/maintain an asset manifest containing:

- local file path;
- original URL;
- creator/studio;
- exact license name/text;
- commercial game use allowed: yes/no;
- modification allowed: yes/no;
- attribution required: yes/no;
- purchase/order/license receipt reference where relevant;
- notes on redistribution restrictions.

Prefer:

- CC0 / public domain;
- explicit commercial-use asset licenses;
- paid packs with clear commercial video-game rights.

Reject:

- `free for personal use`;
- Pinterest/repost sources with no original license;
- random PNG mirrors;
- assets whose license cannot be reconstructed later;
- packs that prohibit modification if we need tinting/splitting/animation.

---

## Style acceptance checklist

Before accepting a pack, ask:

- [ ] readable at phone size?
- [ ] looks like a toy/sticker, not web clipart?
- [ ] works on both light and dark squishy colors?
- [ ] can be tinted or transformed if needed?
- [ ] compatible with the soft toy-first shell?
- [ ] not so detailed that the WebGL squishy looks visually cheaper beside it?
- [ ] can the same asset plausibly appear on several shapes?

---

## What to send back for integration

For each candidate pack, provide either the files or source links plus license evidence.

Ideal delivery structure:

```text
assets-inbox/
  faces/
  stickers/
  accessories/
  audio/
  LICENSES.md
```

Do not manually rename hundreds of files before review. First send the pack/source as acquired; production names can be normalized after we decide which subset actually enters the game.
