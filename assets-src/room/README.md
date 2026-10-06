# Squishy room furniture — 6 October 2026

Owner-approved direction: illustrated rounded craft-room furniture matching
existing owner pedestal art. This is an opt-in room review, not a published
release. Source PNG masters and per-item prompts are preserved here. Images
were generated with OpenAI's built-in imagegen; no third-party asset pack is
included. Generated imagery still requires the owner's in-game visual review.

Runtime WebP preparation uses the existing asset:prepare pipeline at 300px (480px for the wide garland),
8px transparent padding, quality 66, background preservation, WebP only.
AVIF companions are explicitly absent. Run `node scripts/prepare-room-assets.mjs`
from the repository root to regenerate files and SHA-256/runtime frame metadata.
The canonical square image is retained; rendering uses its measured alpha
bounds and shared original frame coordinates so the visible foot sits on the
floor. These bounds are layout metadata, not independently cropped art pieces.

The furniture preloader runs only on roomReview=1, before Library readiness.
No furniture PNG masters are part of the upload root. V3 toy saves are unchanged.
Room choices are persisted separately using the platform storage adapter.
