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
