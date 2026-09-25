# Library visual recovery — September 2026

**Status:** owner approved a trial of the screenshot volume look in the isolated Pages Hall; browser validation remains a separate gate. **Scope:** draft PR #59, isolated Phaser Pages review (`/review/pr-59/`), never existing production `/`, `/phaser/` or Yandex. **Branch creation base:** `main@521f5ec9cb313bac5416badd88af75aceda79a46`. Preserve player V3 saves/IDs, Studio gameplay/physics and supplied artwork. The owner approved a Pages trial, not merging or publishing the original/Yandex site.

## Source lineage and completed room work (historical Gates 0–3)

- Owner's [`Library` commit `223c843`](https://github.com/DanilaH/squishy-squishes/commit/223c84339c7700b0ae0d53749be86d13fb56f30f) provides seven original PNG sources. Source/export hashes remain pinned and checked. Six original room pieces and the seventh ground shadow are preserved; previous hybrid/SVG props and independently reconstructed room assets are historical baselines, **not** candidates to reintroduce.
- The later owner parquet from `main@8f92bd2` is pinned to its unchanged source PNG and a reproducible WebP export (`floor-tile.webp`, SHA-256 `9c5af415adcecf2730e00c474527a8d0ff712620aa6738362f64e7aff9625d91`). It repeats on one static perspective plane. Owner approved the room; preserve cabinet `top: 19%`, plant `top: 33%` and tablet heading-clearance correction.
- Perpetual saved-toy bobbing/brightness was rejected as laggy and removed. Arrival/paging may use bounded opacity-only transitions. No per-card GPU contexts or continuous floor/thumbnail repaint.
- Studio/Squeeze/Library Pages decor uses shared authored graphics; the adopted 512px unlit radial mesh is snapshotted through one shared WebGL2 context, with Studio shader then Canvas2D fallback. The **Pages** Hall already uses **512×512** canvases, 512×512 mesh snapshots and 2× decor; ordinary/Yandex still use legacy 256px. Do not describe the current Pages Hall as a 256px renderer.
- Previous gates restored source fidelity, larger stage/props, material parity, interactions and authored decor. Past green checks are regression evidence, not proof of physical toy volume or release readiness.

## Current blocker: squishy still looks flat / blurry

Owner approved the room but rejected the toy appearance. A previous comparison mislabeled a deliberately forced **256px** thumbnail as “Current Hall” and inferred that merely rendering at 512px would fix current Pages blur. Current Pages already uses 512px by default (`libraryStudioThumbnail.ts`, `libraryThumbnail.ts`); the original inference was **falsified**. The baseline must always be the actual current 512px Studio shader snapshot, with 256px available only as a clearly labeled diagnostic.

### Controlled comparison protocol

1. Use **exactly the same V3-format saved toy, material, appearance, decor, shape, 512px source and CSS display width** in each visible column. State explicitly when a candidate uses a simplified Canvas2D material instead of Studio shader parity. Source changes and geometry changes are separate experiments.
2. Capture actual Chrome desktop and phone screenshots for `soft-square`, `heart` and `paw`; inspect heart cleft/tip, paw valleys, eye/sticker sharpness, accessory seat, outline alpha, paint, mass and visible side. Compare undecorated and decorated samples before acceptance. Test green only establishes functional invariants.
3. The initial SDF relief produced saturation, overbright highlights and artificial lobe folds. The initial 2.5D pseudo-extrusion produced cardboard-like sidewalls. Radial WebGL geometry pinches concave shapes, and the rectangular field-grid creates bright valleys. Neither currently passes aesthetic acceptance.
4. Isolate material from shape: use precisely the **same radial geometry and GPU shader** with three inputs: flat Canvas gradient, baked Studio texture, and an independent unlit albedo of the **same saved paint, face and sticker**. Changing the source colour must not change mesh geometry, pose, renderer resolution or CSS size. Neutral albedo is now Pages-only for all six materials; material parity with Studio requires actual screenshot review.
5. When geometry is accepted, verify real V3 save → reload → open → delete; six shapes and six materials; contact shadow, accessory/sticker mapping; 30s idle/paging and actual GPU context count; all viewport crops; pinned art hashes and exact-head TS/build/Pages/release checks. The Hall trial is approved; Studio and Yandex remain unchanged.

### Independent adversarial audit of the September 22 prototypes

- [Eight-way same-toy real-browser screenshot artifact](https://github.com/DanilaH/squishy-squishes/actions/runs/35710465033/artifacts/10686656338), commit `c324bb2`: the identical height-field mesh and light were drawn with (07) the already shaded Studio texture and (08) simplified flat Canvas art. The heart cleft and paw valleys remain hard/bright and the toy still has a flat face plus attached side **in both**. Thus texture double-lighting is not the sole root cause. The flatter source does not establish resolution improvement, since both are 512px. This finding applies to these specimens, not every possible lighting model.
- [Ten-column neutral-albedo comparison](https://github.com/DanilaH/squishy-squishes/actions/runs/35713902564/artifacts/10688816705), commit `51b6c35`: columns 05, 06 and 07 use the same radial mesh, pose and light with flat gradient, baked Studio or genuinely unlit albedo. The unlit heart has cleaner diffuse colour but **retains the crease converging on its tip**; the unlit paw retains sharp folds between toes. A texture-only fix is therefore insufficient for the tested radial geometry. Do not call the neutral albedo a release candidate; it is a controlled diagnostic. Check the QA run's final conclusion separately; the artifact proves screenshots exist, not whole-suite success.
- [Exact-contour 3D experiment](https://github.com/DanilaH/squishy-squishes/blob/feat/library-visual-recovery-sep21/src/experiments/phaser/libraryVolumeContourMesh.ts), commits `2448fc2`–`9f65294`: replace a rectangular face grid clipped by a low-resolution SDF and alpha with triangulation of the **actual concave shape polygon**. Subdivide shared triangle edges, inflate interior from signed distance, and join actual contour coordinates to the side. The contour closes edge gaps but browser captures still show striated shading and an artificial sharp heart tip/paw folds. This remains an experimental geometry path, not an accepted toy.
- **Independent implementation risks identified before adoption:** ear clipping can fail on duplicated/degenerate or self-intersecting contours; a coarse 128px SDF and long, skinny triangulation faces can still create lumpy normals; a fixed rotated mesh moves face/accessory registration; a new GPU context is acceptable only for the disposable lab, never per card in Hall. Test geometric curvature and triangle/normal continuity **without changing saved art or lighting at the same time**. Reject a change if it improves the square but worsens heart/paw, and rollback only that candidate.

**Current decision (September 22):** use the unlit radial mesh in the ordinary isolated Pages review Hall, with the ten-way `?volume-probe=1` lab preserved for comparison. The owner accepted a trial of the screenshot look, not a main/Yandex merge. Validate V3 saves, all six shapes/materials, decor, one-context idle and loss-of-WebGL fallbacks on the integrated renderer.

## Remaining original gates (priorities unchanged)

**Gate 2 — restrained feel:** After an accepted static body. Keep saved exhibits still; opacity-only arrival/paging, reduced-motion and one lifecycle owner. No bob, shader sweep, per-card RAF or idle CPU/GPU work. Real browser video and 30s stress test idle → save → settle → page → return; physical-device GPU/touch remains a separate gate.

**Gate 3 — decorative content:** After body/feel acceptance. Compare one fully decorated toy in Studio, Squeeze and Hall; improve face/sticker/accessory art and shape-specific anchors without changing IDs, V3 codec, old saves, economy or physics. Review empty and decorated versions on all contours. Do not hide bad proportions with FX.

## Independent review and rollback safeguards

- **Wrong-source trap:** preserve owner PNG/WebP source/export hashes, crop and original baseline; do not replace art with lookalikes.
- **Resolution trap:** inspect actual source and display pixels before blaming 256px. A flat Canvas control and Studio material both at 512px are different rendering paths.
- **False-volume trap:** a rim, aggressive normal map or shifted edge is not automatically an inflated toy; heart/paw visuals and live owner review decide.
- **Scope/performance trap:** shared static offscreen rendering and bounded cost only. No new resident per-card GPU instances. Chrome CI is not physical phone validation.
- **False-green trap:** unit/build/browser checks are not aesthetic proof, rights clearance or permission to merge. Keep Studio shader as the explicit fallback and preserve Yandex pixels.
- **Compatibility trap:** never mutate main/Yandex, saved schema, Studio deformation or authoring flow to make a screenshot prettier. Preserve real save round-trips.

**Release lock:** owner aesthetic approval, real-device touch/GPU validation and commercial rights for supplied art remain outstanding. Keep draft PR and isolated public review route until explicitly cleared.
