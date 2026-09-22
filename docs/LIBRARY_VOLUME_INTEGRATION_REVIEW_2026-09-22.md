# Pages Library volume integration — owner trial (2026-09-22)

The owner accepted trying the unlit-albedo radial mesh seen in the isolated comparison. It is registered as the default **Pages Hall** thumbnail renderer for saved V3 toys; this is not permission to merge PR #59 or publish the main/Yandex game.

## Review in the actual Hall, not only the lab

- Create, save, reload, page and delete saved toys; inspect six shapes and six material IDs with actual paint, faces, stickers and accessories.
- Capture desktop and mobile screenshots of ordinary `/review/pr-59/` without query parameters. The `?volume-probe=1` lab remains a diagnostic only.
- Confirm non-Pages Canvas2D pixels, V3 codec, static one-context snapshots, and fallback after WebGL failure remain intact. Behind-body accessories should occur exactly once.
- The first integrated browser capture exposed transparent/dark seams at the paw toe valleys even though the tests passed. A mesh front texel guard now fills out-of-albedo UV samples; **fresh paw and heart screenshots must establish whether this actually fixes the visible gaps**. Do not describe a compiling shader change as a visual fix by itself.
- Strict TypeScript, both builds, Pages regression and independent real-browser Hall QA must pass on the final exact feature SHA. Green tests cannot replace screenshot review.

If the new renderer visibly regresses on mobile or materials, repair it or revert only its registration while retaining the accepted floor, prop positions and decor. No merge to `main` without a separate explicit go-ahead.
