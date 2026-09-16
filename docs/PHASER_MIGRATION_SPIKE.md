# Phaser 4 migration spike — intentionally isolated

**Status:** experimental, not production migration. Branch `experiment/phaser4-squish-extern`; do not merge into `main` merely because CI is green.

## Goal

Validate the hard integration seam: render one actual Squishy silhouette with **the production shape field and original vertex/fragment GLSL** as a `Phaser.GameObjects.Extern` in Phaser 4.2.1, using the **same WebGL2 context/canvas**, Phaser's frame/update loop and Phaser input. Test a hold → drag → release on desktop/phone-size browser and GL state restoration (Phaser Text renders *after* the Extern).

## Try it

```bash
npm install
npm run dev
# open http://localhost:5173/phaser-spike.html
npm run spike:qa
```

`npm run spike:build` builds only `phaser-spike.html` to `dist-phaser-spike/`, not the normal Pages/Yandex `index.html`. The experiment is not a route in the shipped game, does not load Yandex SDK and does not alter production save, ads, audio, translations or gameplay. `phaser` is a devDependency for the spike and should only move to runtime dependencies if a real migration is approved.

## Architecture and what the proof does *not* prove

- `main.ts` creates one WebGL2 context and passes that exact canvas/context to `new Phaser.Game`.
- `PhaserSquishExtern` draws through Phaser 4's `Extern` display-list step. Phaser calls `YieldContext` and `RebindContext` around the custom render. It **does not** create its own canvas, JS animation loop or WebGL context; `Scene.update` advances the springs.
- The experiment imports the original `shaders.ts` verbatim and uses `createShapeField(getShape('soft-square'), 128)` from the production silhouette implementation. It copies the 16×16 mesh and spring constants/algorithm from `SquishSurface`, instead of modifying the production class during proof of concept. **This is code duplication, not achieved reuse.** A real migration must first extract an engine-independent squish simulation or replace the existing renderer in a reviewable dedicated step.
- One material/shape, no paint or appearance texture, fillings, audio, multi-touch policy, saves, ads, full sandbox UI, localized screens or hosted Yandex validation. Shader uniforms unused by this fixture are given neutral values. Phaser text after Extern is a basic interop signal, not proof of arbitrary camera transforms, filters or render textures.
- The prototype draws to the base framebuffer and intentionally has no camera effects/filters. Resource teardown is explicit; lost GL context invalidates external resources and reinitializes on next render. Check this on real phones before depending on it.

## Acceptance and decision

`npm run spike:qa` checks one canvas/WebGL2 context, real draw calls, visible non-background center pixels, drag displacement, completed release and canvas teardown in headless Chromium at desktop and phone-size viewports. CI retains screenshots as `phaser-spike-evidence`; **phone-size emulation is not real touch/device acceptance**. Inspect the screenshots and run a real phone before claiming feel parity.

Only after the prototype passes should we estimate the rest: shared simulation extraction, replacing the current DOM/CSS stage UI or keeping it as an explicit overlay, Phaser input/lifecycle mapping, paint/UV/decor interop, save/ads/i18n integration, and end-to-end Yandex DRAFT. If the Extern requires unstable state hacks or hurts input/render latency, keep the shared-kit infrastructure engine-neutral rather than forcing an expensive rewrite.
