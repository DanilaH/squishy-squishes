# Pages Library volume integration — owner trial (2026-09-22)

The owner accepted trying the unlit-albedo radial mesh seen in the isolated comparison. It is now registered as the default **Pages Hall** thumbnail renderer for saved V3 toys; this is not an approval to merge PR #59 or publish the main/Yandex game.

## Verify on the actual Hall, not only the lab

- Create, save, reload, page and delete saved toys; check all six shapes and all six material IDs with painted strokes, faces, stickers and accessories.
- Take desktop and mobile browser screenshots of the **ordinary** `/review/pr-59/` route without `volume-probe=1`, then check the `?volume-probe=1` comparison only as a diagnostic.
- Confirm non-Pages Canvas2D renders and V3 codec remain unchanged; no new continuous animation or one-WebGL-context-per-card pattern.
- Validate fallback behavior after WebGL context failure, clipping on concave heart/paw silhouettes, and placement of a behind-the-body accessory exactly once.
- Typecheck, Pages build, full Pages browser regression, independent Hall browser QA, and the existing release checks must pass on the integrated head SHA. Green tests cannot replace an actual screenshot review.

If the new renderer visibly regresses on mobile or materials, fix the integrated renderer or revert only its registration while keeping the approved floor, prop positions and decor work. No merge to `main` without an explicit separate go-ahead.
