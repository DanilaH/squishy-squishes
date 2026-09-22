from pathlib import Path


def change(path, before, after, n=1):
    file = Path(path)
    body = file.read_text()
    count = body.count(before)
    if count != n:
        raise RuntimeError(f'{path}: expected {n} patch sites, saw {count}: {before[:90]!r}')
    file.write_text(body.replace(before, after))

p = 'src/experiments/phaser/studioEnvironmentPreview.ts'
change(p, "const element = (tag: 'div' | 'img', className: string): HTMLDivElement | HTMLImageElement => {", '''// Shared decode before first playable frame; no late background/desk pop-in.
let preparedDesk: Promise<string | null> | null = null;
export const preloadStudioEnvironmentAssets = (): Promise<string | null> => {
  preparedDesk ??= Promise.all(Object.values(assets).map(loadImage))
    .then((images) => {
      const left = images[2], middle = images[3], right = images[4];
      if (!left || !middle || !right) throw new Error('Missing Studio desk slices');
      return composeDesk(left, middle, right);
    })
    .catch((error: unknown) => {
      console.warn('[squishy:studio-preview] Environment assets failed to decode or compose; original UI retained.', error);
      return null;
    });
  return preparedDesk;
};

const element = (tag: 'div' | 'img', className: string): HTMLDivElement | HTMLImageElement => {''')
change(p, '/** Returns cleanup; never mutates non-Shape/Paint gameplay, storage, or main/Yandex entrypoints. */', '/** Pages-only visual layer for the entire maker and Squeeze; no gameplay mutation. */')
change(p, '  // The real stage changes height AFTER its data-stage mutation (notably on wide Paint).\n  // Observing layout keeps the floor and desk aligned without moving gameplay/UI.', '  // Observe viewport geometry, not step-panel heights: Pages CSS reserves one\n  // stable workbench and controls track for every maker stage.')
change(p, "    const supported = shell.dataset.stage === 'shape' || shell.dataset.stage === 'paint';", "    const supported = ['shape', 'paint', 'mixins', 'mix', 'decor', 'finish', 'squeeze', 'home'].includes(shell.dataset.stage ?? '');")
change(p, "  void Promise.all(Object.values(assets).map(loadImage)).then((images) => {\n    if (disposed) return;\n    const left = images[2];\n    const middle = images[3];\n    const right = images[4];\n    if (!left || !middle || !right) throw new Error('Missing Studio desk slices');\n    deskTexture = composeDesk(left, middle, right);\n    decoded = true;\n    root.dataset.studioEnvReady = '';\n    schedule();\n  }).catch((error: unknown) => {\n    console.warn('[squishy:studio-preview] Environment assets failed to decode or compose; original UI retained.', error);\n  });", "  void preloadStudioEnvironmentAssets().then((texture) => {\n    if (disposed || !texture) return;\n    deskTexture = texture;\n    decoded = true;\n    root.dataset.studioEnvReady = '';\n    schedule();\n  });")

p = 'src/experiments/phaser/pagesPreview.ts'
change(p, "import { preloadJellyUi } from './jellyUiPreload';", "import { preloadJellyUi } from './jellyUiPreload';\nimport { preloadStudioEnvironmentAssets } from './studioEnvironmentPreview';")
change(p, "void preloadJellyUi().then((ready) => {\n  if (ready) root.dataset.jellyUiReady = '';", "void Promise.all([preloadJellyUi(), preloadStudioEnvironmentAssets()]).then(([ready, desk]) => {\n  if (ready) root.dataset.jellyUiReady = '';\n  if (desk) root.dataset.studioEnvReady = '';")

p = 'src/experiments/phaser/studioEnvironmentPreview.css'
change(p, "#app[data-studio-env-ready] .sandbox-shell.studio-env-active:is([data-stage='shape'], [data-stage='paint']) {", '#app[data-studio-env-ready] .sandbox-shell.studio-env-active {')
with Path(p).open('a') as f:
    f.write('''
/* One workshop at every step: reserve the same heading, playfield and control
   tracks so changing panels never shifts the toy, tabletop or floor. */
#app[data-studio-env-ready] .sandbox-shell.studio-env-active {
  --studio-controls-height: clamp(202px, 31dvh, 276px);
  grid-template-rows: 38px 88px minmax(0, 1fr) var(--studio-controls-height) 20px;
  gap: 4px;
}
#app[data-studio-env-ready] .sandbox-shell.studio-env-active .sandbox-copy {
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
#app[data-studio-env-ready] .sandbox-shell.studio-env-active .sandbox-stage {
  min-height: 0;
  padding: 0;
  container-type: size;
}
#app[data-studio-env-ready] .sandbox-shell.studio-env-active .sandbox-canvas {
  width: min(82vw, 430px, 100cqh);
  height: auto;
  aspect-ratio: 1;
  min-width: 0;
  min-height: 0;
  max-width: 100%;
  max-height: 100%;
}
#app[data-studio-env-ready] .sandbox-shell.studio-env-active .sandbox-glow {
  width: min(88vw, 470px, 110cqh);
  max-height: 110cqh;
}
#app[data-studio-env-ready] .sandbox-shell.studio-env-active .sandbox-controls {
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}
#app[data-studio-env-ready] .sandbox-shell.studio-env-active .sandbox-panel {
  min-height: 0;
  flex-shrink: 0;
  margin-top: auto;
}
@media (max-height: 740px) and (orientation: portrait) {
  #app[data-studio-env-ready] .sandbox-shell.studio-env-active {
    --studio-controls-height: clamp(198px, 33dvh, 242px);
    grid-template-rows: 36px 76px minmax(0, 1fr) var(--studio-controls-height) 18px;
  }
  #app[data-studio-env-ready] .sandbox-shell.studio-env-active[data-stage='shape'] .sandbox-shape {
    min-height: 56px !important;
  }
  #app[data-studio-env-ready] .sandbox-shell.studio-env-active[data-stage='shape'] .sandbox-shape__icon {
    width: 26px; height: 26px;
  }
  #app[data-studio-env-ready] .sandbox-shell.studio-env-active [data-action='shape-continue'] {
    min-height: 52px !important;
  }
}
/* Preserve the existing compact-landscape two-column layout and absolute
   heading; every step gets identical stage padding, including Decor. */
@media (max-height: 520px) and (orientation: landscape) {
  #app[data-studio-env-ready] .sandbox-shell.studio-env-active {
    grid-template-columns: minmax(280px, .9fr) minmax(390px, 1.1fr);
    grid-template-rows: 38px minmax(0, 1fr) 18px;
  }
  #app[data-studio-env-ready] .sandbox-shell.studio-env-active .sandbox-copy {
    position: absolute;
    left: 14px; top: 48px;
    width: calc(42% - 20px);
    height: auto;
    display: block;
    text-align: left;
  }
  #app[data-studio-env-ready] .sandbox-shell.studio-env-active .sandbox-stage {
    padding-top: 45px;
    padding-bottom: 0;
  }
  #app[data-studio-env-ready] .sandbox-shell.studio-env-active .sandbox-canvas {
    width: min(64vh, 280px, calc(100cqh - 45px));
  }
  #app[data-studio-env-ready] .sandbox-shell.studio-env-active .sandbox-controls {
    justify-content: flex-start;
  }
  #app[data-studio-env-ready] .sandbox-shell.studio-env-active .sandbox-panel {
    margin-bottom: auto;
  }
}
''')

p = 'tests/phaser-pages/studio-environment-integration.spec.ts'
change(p, "      await expect(shell).not.toHaveClass(/studio-env-active/);\n      await expect(shell.locator('.studio-env-floor, .studio-env-stage-art')).toHaveCount(0);", "      await expect(shell).toHaveClass(/studio-env-active/);\n      await expect(shell.locator('.studio-env-floor, .studio-env-stage-art')).toHaveCount(2);")
