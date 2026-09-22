# Pages Library volume integration — owner trial (2026-09-22)

The owner accepted trying the unlit-albedo radial mesh seen in the isolated comparison. It is registered as the default **Pages Hall** thumbnail renderer for saved V3 toys; this is not permission to merge PR #59 or publish the main/Yandex game.

## Review in the actual Hall, not only the lab

- Create, save, reload, page and delete saved toys; inspect six shapes and six material IDs with actual paint, faces, stickers and accessories.
- Capture desktop and mobile screenshots of ordinary `/review/pr-59/` without query parameters. The `?volume-probe=1` lab remains a diagnostic only.
- Confirm non-Pages Canvas2D pixels, V3 codec, static one-context snapshots, and fallback after WebGL failure remain intact. Behind-body accessories should occur exactly once.
- The first integrated browser capture exposed transparent/dark seams at the paw toe valleys even though the tests passed. A mesh front texel guard now fills out-of-albedo UV samples; **fresh paw and heart screenshots must establish whether this actually fixes the visible gaps**. Do not describe a compiling shader change as a visual fix by itself.
- Strict TypeScript, both builds, Pages regression and independent real-browser Hall QA must pass on the final exact feature SHA. Green tests cannot replace screenshot review.

If the new renderer visibly regresses on mobile or materials, repair it or revert only its registration while retaining the accepted floor, prop positions and decor. No merge to `main` without a separate explicit go-ahead.

## Cross-scene parity follow-up (2026-09-23)

Root cause: the Hall's offscreen static 3D snapshot is not the dynamically deforming Studio/Squeeze surface. In addition, the Hall used contour-derived front normals that produced artificial hard wedges at paw valleys, a fixed-color side instead of saved pigment, a taller pre-finished mold, and a separate green Jelly base. These are appearance differences, not corrupt V3 saves.

The Pages-only Hall mesh now uses smoother radial normals, paints its visible side from the saved appearance, matches the finished Studio mold's horizontal/vertical profile and seat, keeps Jelly/Marshmallow's warm milk base, and softly shades its curved front rim. The Pages paw crown is seated independently to avoid burying it under the inflated volume. Studio/Squeeze shaders, deformation, physics, V3 schema and Yandex rendering are not changed by these appearance patches.

A new browser test, `tests/phaser-pages/library-hall-cross-scene-parity.spec.ts`, actually creates, paints and decorates three V3 toys (paw with crown/Soft, heart/Marshmallow, square/Jelly), saves them, captures Studio and Squeeze idle/pressed/released frames, checks the Hall uses the 512px `volume-mesh`, reloads the page, and reopens the same saved toy. It checks V3 remains byte-identical through reload, material IDs and paint/decor survive, warm Jelly pigment and the crown's local clearance, and reports JS exceptions. This tests identity/lifecycle, not pixel-identical images or actual touch hardware.

The successful exploratory browser run with screenshots is [soft front rim review](https://github.com/DanilaH/squishy-squishes/actions/runs/35774404595), following the [warm palette and crown run](https://github.com/DanilaH/squishy-squishes/actions/runs/35774034231). These runs each include the Pages TypeScript/build step and all three V3 scenarios. See the final exact-head CI runs for release-check and surrounding regression coverage; earlier passing runs do not substitute for the final commit.

**Remaining acceptance limits:** Hall is a static 3D snapshot; Studio and Squeeze are an interactive deforming material, so shader responses and perspective still differ. Three representative shapes/materials do not prove the whole six-shape/six-material/decor matrix; screenshots from desktop Chromium mobile emulation do not prove a real phone's touch, performance, GPU fallback or battery behavior. Review on a physical phone and owner visual approval remain outstanding. The draft PR stays isolated: no merge into `main` or Yandex release without explicit approval.
