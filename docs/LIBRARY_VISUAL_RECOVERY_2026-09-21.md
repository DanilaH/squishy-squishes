# Library visual recovery — September 2026

**Status:** working plan and evidence, **not** aesthetic acceptance. **Scope:** draft PR #59, isolated Phaser Pages review (`/review/pr-59/`), never the existing production `/`, `/phaser/` or Yandex build. **Base at branch creation:** `main@521f5ec9cb313bac5416badd88af75aceda79a46`. Preserve player V3 saves/IDs, Studio gameplay/physics and supplied owner artwork. The owner must approve visual replacement; successful tests do not grant that approval.

## Source lineage and completed room work (historical Gates 0–3)

- Owner's [`Library` commit `223c843`](https://github.com/DanilaH/squishy-squishes/commit/223c84339c7700b0ae0d53749be86d13fb56f30f) provides seven original PNG sources. Their source/export hashes remain pinned and checked. Six original room pieces and the seventh ground shadow are preserved. Previous hybrid/SVG props and independently reconstructed room assets are historical baselines, **not** candidates to reintroduce.
- The later owner parquet from `main@8f92bd2` is pinned to the unchanged source PNG and a reproducible WebP export (`floor-tile.webp`, SHA-256 `9c5af415adcecf2730e00c474527a8d0ff712620aa6738362f64e7aff9625d91`). It repeats on one static perspective plane rather than stretching one image. The owner approved the room appearance; preserve their cabinet `top: 19%` and plant `top: 33%` and the responsive heading-clearance correction.
- Perpetual saved-toy bobbing/brightness animation was rejected as laggy and removed. Arrival and paging may use bounded opacity-only transitions. No N-per-card GPU contexts or continuous floor/thumbnail repaint.
- Studio/Squeeze/Library Pages decor uses shared authored graphics; the actual Studio WebGL shader is snapshotted on demand through one shared WebGL2 context with a Canvas2D fallback. The default **Pages** Hall already draws into **512×512** canvases with **512×512** Studio shader snapshots and 2× appearance/decor; ordinary/Yandex still use the legacy 256px path. Do **not** describe the current Pages Hall as a 256px renderer. CSS enlargement and material/form quality still need visual review.
- Earlier gates documented restoration of source fidelity, larger stage/props, material parity, stable interactions and authored decor. Their past green checks are regression evidence, not proof of physical toy volume or release readiness.

## Current blocker: squishy still looks flat / blurry

The owner approved the room but rejected the toy's appearance. The original hypothesis that the current Hall's offscreen source was fixed at 256px was **falsified by current code inspection**: `libraryStudioThumbnail.ts` and `libraryThumbnail.ts` already render 512px by default in Pages. The previous lab compared a deliberately forced 256px version against 512px alternatives and incorrectly called the 256px image “Current Hall”; screenshots from that comparison cannot establish that resolution alone fixes the actual Pages Hall. This was a methodological failure. Correct the comparison before drawing conclusions.

### Ordered visual experiment and acceptance

1. Display **the actual current 512px Studio-shader snapshot** alongside a separately rendered 512px flat control, a 512px SDF/relief prototype and a 512px visible-thickness prototype. All must use one identically encoded V3-format toy per shape, at the **same CSS display size**. The deliberately reduced 256px snapshot is available only behind a clearly labelled diagnostic toggle.
2. Compare real Chrome captures at desktop and mobile sizes for `soft-square`, `heart` and `paw`; check the heart cleft and tip, paw valleys, eye/sticker sharpness, accessory alignment, contour alpha, frontal colour, the whole body silhouette and the relation between body and side. Inspect the raw pixels, not test counts or marketing copy. Include plain and decorated examples before a final decision.
3. Treat the 512px flat control as a different **rendering/material** experiment, **not** merely a higher-resolution rendering of the same shader. If it appears clearer, establish whether light, colour, contrast, contour or rasterisation causes the difference before touching production. Do not claim pixel-level Studio/material parity for a Canvas2D approximation.
4. The current relief has already needed correction for SDF saturation, overbright highlights and artificial lobe folds. The first pseudo-extrusion was a uniform offset silhouette that looked like a brown cardboard edge. The next probe shades only contour-facing edges and retains an unchanged decorated front; reject it too if it still looks like a flat face glued to a slab. Avoid compensating with more white gloss or an ungrounded drop shadow.
5. If a convincingly inflated body cannot be achieved with honest static 2.5D, explicitly compare the implementation cost of a **real** rounded 3D mesh/extrusion versus authored prerendered sprites. Do not mislabel a Canvas2D sidewall as a physical 3D model, and do not propagate a failed effect across all materials/shapes.
6. Only after a visual candidate passes actual same-toy review should it replace the Pages Hall renderer. Then verify actual V3 save → reload → open → delete, all six shapes and six materials, accessory and sticker overlap, no new WebGL contexts, viewport clipping and 30s idle / repeated page turns. Re-run pinned owner art hashes, strict TS/build, Pages QA and release checks on the exact SHA. Default Hall/Studio/Yandex must remain unchanged while the comparison is unresolved.

**Current decision:** none of the 2.5D candidates is approved for the default Hall. The experiment remains query-gated: `/review/pr-59/?volume-probe=1` (or local `/phaser-pages.html?volume-probe=1`). The owner can dismiss it without changing saved data. Do not merge PR #59 or deploy to Yandex merely because the experiment compiles.

## Remaining original gates (unchanged priorities)

**Gate 2 — restrained feel:** Only after the static toy reads correctly. Keep saved exhibits still, opacity-only arrival/paging, reduced-motion support and one shared lifecycle owner. No continuous bob, shader sweep, per-card RAF or idle CPU/GPU work. Real 15–25s browser video and 30s stress checks must show idle → save → settle → page → return, with stable positions, context count and interaction. Actual physical-device GPU/touch review remains separate.

**Gate 3 — decorative content:** Only after the accepted static body/feel. Compare the same fully decorated toy in Studio, Squeeze and Hall; improve face/sticker/accessory art and contour-specific anchors without changing existing IDs, the compact V3 codec, old saves, economy or physics. Review both empty and decorated specimens on every shape; do not mask bad proportions with visual FX.

## Independent adversarial review and rollback

- **Wrong-source trap:** preserve the exact owner PNG/WebP export hashes, visual crops and old baseline. Never swap supplied art for similarly named lookalikes.
- **Resolution trap:** inspect current source and destination pixel sizes **before** blaming blur on 256px. A 512px Canvas2D control and a 512px real Studio shader differ in material rendering; do not attribute all differences to resolution or turn a diagnostic 256px variant into a claimed production baseline.
- **False-volume trap:** a rim, exaggerated normal map or solid shifted edge is not automatically an inflatable toy. Reject based on same-shape visual comparison, especially heart and paw, before integration.
- **Scope/performance trap:** shared static offscreen work only, bounded rendering cost and no extra resident per-card GPU instances. Measure 30s idle and touch layout rather than assuming Chrome CI implies phone performance.
- **False-green trap:** passing code tests proves implementation/interaction invariants, not aesthetic quality, rights, real-device suitability or permission to merge. Keep the previous Hall render switchable until approved.
- **Compatibility trap:** do not mutate main/Yandex, saved schema, Studio deformation or authoring flow to manufacture a prettier screenshot. The same real saved appearance must survive round-trip.

**Release lock:** owner aesthetic approval, real-device touch/GPU validation and commercial rights for supplied assets remain outstanding. Preserve the draft PR and isolated public review route until explicitly cleared.
