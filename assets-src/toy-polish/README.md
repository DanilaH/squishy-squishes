# Puffy bow — authored toy sample, 2026-10-02

Source: original generated with the built-in OpenAI imagegen tool for this repository.
No third-party pack, reference image or copied character. AI-generated art; no claim
of exclusive copyright or separately purchased license. Master is retained here;
only prepared runtime images ship. User authorized this new art sample.

Prompt:
> Use case: stylized-concept. Asset type: single transparent game sprite, puffy silicone bow accessory for a tactile squishy toy. One bow only, front view with very slight top visibility, symmetrical broad rounded cushion loops, small rounded center knot, short soft tails. Strawberry pink silicone with pearlescent pale-pink highlights, subtle molded folds, rounded thick edges, soft realistic volume and satin-gloss material. Sweet feminine children's craft toy aesthetic, polished collectible toy render. Light from upper left, gentle shading on lower right, clear silhouette readable at 90 pixels wide. Centered, fills 80 percent of image width, generous transparent padding. Genuine transparent background. No ground, no external cast shadow, no text, no outline, no glitter, no extra items. Width approximately twice its height.

Preparation:
`npm run asset:prepare -- assets-src/toy-polish/puffy-bow-master.png public/assets/toy-polish/puffy-bow.webp --canvas=256 --padding=16`

| Runtime | Bytes | Dimensions | Decoded RGBA proxy | AVIF companion |
| --- | ---: | --- | ---: | --- |
| puffy-bow.webp | 9688 | 256×256 | 262144 B | Yes |
| puffy-bow.avif | 5918 | 256×256 | 262144 B | — |

Startup-required because existing saved bows are immediately visible in Library.
Decode before installing the visual profile; maker entry retries failed loads.
AVIF failure retries WebP; total failure keeps the existing procedural bow.
Consumer reconstructs the fixed prepared canvas (alpha bounds x16..239, y72..183)
inside the established accessory extent, preserving its projection/seat geometry.
Stars remain procedural, authored in pearlStars.ts; no external source or new save IDs.

## Catalog extension — 2 October 2026

Built-in imagegen, transparent output; generated masters retained unchanged. Rejected halo variants were not shipped. Existing bow unchanged. All four additions are startup-required for saved V3 toys, with AVIF → WebP → procedural fallback. Per image: 256×256, decoded RGBA proxy 262144 bytes; total extra decoded proxy 1 MiB. `asset:prepare --canvas=256 --padding=16`, existing alpha preserved.

| File | WebP bytes | AVIF bytes |
| --- | ---: | ---: |
| cat-ears | 6612 | 4136 |
| bunny-ears | 9888 | 5715 |
| horns | 6988 | 4450 |
| crown | 10954 | 7357 |

Exact accepted prompts:

### cat-ears

Use case: stylized-concept. Asset type: transparent game accessory sprite. Subject: A pair of short rounded kitten ears, warm ivory outer silicone and recessed blush pink inner ears. Two separate symmetrical ears, no headband, no animal head, no fur. Soft triangular tips, visibly thick rounded molded edges. Style: premium tactile kawaii squishy craft toy, puffy molded soft silicone, subtle satin gloss and wide softbox highlight upper left, gentle dimensional shading. Camera: straight front view, near orthographic, symmetrical, flat horizontal seating baseline, entire object isolated and centered with clear empty margin. Genuine transparent background; no floor, no background shadow, no body, no face, no hands, no packaging, no lettering, no outlines, no hard plastic look. Readable when displayed at 70px. Color and softness should match a blush pink puffy silicone bow.

### bunny-ears

A two short bunny ears, warm white with pink inset, symmetrical upright pair. Puffy molded silicone toy accessory. Wide landscape sprite, front orthographic view. Soft dimensional shading contained inside object, no rim light, no backlight, no bloom. Opaque object with clean contour. Die-cut isolated object on fully transparent empty background with zero opacity outside edges. No ground, cast shadow, glow or translucent haze. Like a small game inventory asset.

### horns

Use case: stylized-concept. Asset type: transparent game accessory sprite. Subject: A pair of tiny curved lilac silicone toy horns. Two separate symmetrical horns, curving gently outward and up, rounded safe tips, chunky bases, lavender pink pearlescent coloring. Cute playful toy, not menacing. Style: premium tactile kawaii squishy craft toy, puffy molded soft silicone, subtle satin gloss and wide softbox highlight upper left, gentle dimensional shading. Camera: straight front view, near orthographic, symmetrical, flat horizontal seating baseline, entire object isolated and centered with clear empty margin. Genuine transparent background; no floor, no background shadow, no body, no face, no hands, no packaging, no lettering, no outlines, no hard plastic look. Readable when displayed at 70px. Color and softness should match a blush pink puffy silicone bow.

### crown

A a small five point rounded golden crown with pink heart jewel. Puffy molded silicone toy accessory. Wide landscape sprite, front orthographic view. Soft dimensional shading contained inside object, no rim light, no backlight, no bloom. Opaque object with clean contour. Die-cut isolated object on fully transparent empty background with zero opacity outside edges. No ground, cast shadow, glow or translucent haze. Like a small game inventory asset.
