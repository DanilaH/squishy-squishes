# M3 renderer slice — independent second-pass review

Reviewed branch `migration/phaser-m3-renderer` against the merged M2 Extern, old `SquishSurface`, `SandboxApp.replayAndUpload`, `appearance.ts`, `decor.ts` and real M3 Chromium screenshot/CI. **This is a code-and-evidence second pass, not an independent outside reviewer.**

## Validated scope

- One Phaser-owned WebGL2 canvas and shared `SquishSimulation` remain in the isolated entry. The canonical 256px 2D replay (`replayAppearanceDocument`, `renderSurfaceDecor`) feeds the existing GLSL as an appearance texture. Pearl mix-ins are intentionally excluded from that baked texture because the current game renders them on a separate visible 2D layer.
- Existing shape fields/materials still have distinct rendered images; test-only fixtures for paint, mix-ins, face/sticker decor, clear, foam/pearl filling, mold, palette and wireframe change **real WebGL pixels**. A shape change regenerates face landmarks. Screenshot `m3-decor.png` was inspected visually: face and sticker are on the squishy, not a fake HTML overlay.
- The candidate re-uploads an appearance texture on document change, not every frame; texture flip follows the old renderer's `UNPACK_FLIP_Y_WEBGL=1`. Old production entry/SDK/save paths are untouched.

## Deliberate limits / mandatory follow-ups before **full M3 parity or cutover**

1. **No matched old-vs-new pixel parity yet.** Image-change assertions prove the plumbing, not identical color/UV/decor under controlled equal inputs. Add a shared deterministic fixture and compare both on-screen WebGL canvases at matched size, material, shape, paint, fill and simulation time, with documented differences/tolerance.
2. **Composite/GL state:** Extern forces default framebuffer and leaves some WebGL state changed; there are no Phaser sprites/text after it in this candidate. Add display-list before/after Extern and GL-state/multistage checks, or constrain the eventual production scene explicitly. Do not claim mask, effect or multi-camera support.
3. **Context loss and failed allocation:** `forgetLostContext` drops resources and forces dirty upload, but a real `WEBGL_lose_context`/restore with Phaser lifecycle has not passed; allocation-error paths could leak partial GPU objects. Test/recover before switch. Do not call this context-loss acceptance.
4. **Rigid pearl and head-accessory layers:** the candidate has only baked surface decor. The original `SandboxApp` has separate visible pearl/accessory 2D canvases following deformed UVs. Port their visual/animation ownership in M4, not as baked substitutes.
5. **Pearl-only texture flag:** the old `SandboxApp` enables the appearance uniform whenever any mix-in exists, whereas this candidate disables it if there are only excluded rigid pearls. The current GLSL blends a fully transparent texel by alpha, so this should not change visible color, but exact uniform/state parity remains to be proved at the shared-fixture gate.
6. **Candidate-only QA aids and missing gameplay:** `preserveDrawingBuffer=true` exists only to sample pixels. No real Paint/Decor gestures, library, V3 save, Yandex DRAFT or real-device touch yet. Do not include the fixture global or test-only performance settings in the shipped entry.

**Decision:** mergeable as a *bounded, behind-a-separate-entry rendering capability* if its candidate QA and existing Release Check/Browser QA pass on the exact head; **not** evidence that M3 end-to-end parity, M4 or production cutover is done. Stop cutover until the six gaps above are resolved and the published migration plan's gates pass.
