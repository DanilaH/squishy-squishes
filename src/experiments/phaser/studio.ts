import type { StorageAdapter } from '@danilah/mini-games-kit/platform';
import '../../styles.css';
import '../../interaction-pass.css';
import '../../interaction-pass-03.css';
import '../../release.css';
import '../../ui-ux-pass-01.css';
import '../../feel-art-audio-pass-01.css';
import '../../ui-ux-overhaul-02.css';
import '../../sandbox-core.css';
import '../../sandbox-library.css';
import '../../sandbox-ideas.css';
import '../../sandbox-polish-01.css';
import { appendSavedSquishy, createSaveV3Repository, createSavedSquishy, SAVE_V3_STORAGE_KEY, type SaveStateV3 } from '../../platform/saveV3';
import { SandboxApp, type SandboxLanguage } from '../../sandbox/SandboxApp';
import { PhaserSquishSurface } from '../../sandbox/PhaserSquishSurface';

// This page uses REAL SandboxApp and the REAL V3 repository/codec, but prefixes
// the browser storage to avoid ever reading or overwriting a player's live save.
const PREFIX = 'squishy.phaser-preview.';
const storage: StorageAdapter = {
  getItem: async (key) => sessionStorage.getItem(PREFIX + key),
  setItem: async (key, value) => { sessionStorage.setItem(PREFIX + key, value); },
  removeItem: async (key) => { sessionStorage.removeItem(PREFIX + key); },
};
const repository = createSaveV3Repository(storage);
const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Phaser studio preview needs #app');
const language: SandboxLanguage = new URLSearchParams(location.search).get('lang') === 'ru' ? 'ru' : 'en';
let app: SandboxApp | null = null;
let state: SaveStateV3;
let disposed = false;

const mount = async (): Promise<void> => {
  if (disposed) return;
  app?.dispose();
  state = await repository.loadOrDefault((error) => console.error('[phaser-studio:v3-load]', error));
  const savedSquishy = state.library.at(-1) ?? null;
  app = new SandboxApp(root, {
    language,
    muted: true,
    savedSquishy,
    rendererBackend: 'phaser',
    makePhaserRenderer: (canvas, onMetrics, audio, callbacks) =>
      new PhaserSquishSurface(canvas, onMetrics, audio, callbacks),
    onSaveSquishy: async (draft) => {
      const saved = createSavedSquishy(draft);
      const next = appendSavedSquishy(state, saved);
      await repository.write(next);
      await repository.flush();
      state = next;
      return saved;
    },
    onMutedChange: () => undefined,
  });
  root.dataset.phaserStudioReady = 'true';
  root.dataset.v3StorageKey = SAVE_V3_STORAGE_KEY;
};

const dispose = (): void => {
  if (disposed) return;
  disposed = true;
  app?.dispose();
  app = null;
  delete window.__squishyRealStudio;
};

declare global {
  interface Window {
    __squishyRealStudio?: {
      snapshot(): { stage: string; shape: string; material: string; paintStrokes: number; mixinCount: number; stickerCount: number; savedId: string | null; storedCount: number; webglReady: boolean; canvasCount: number };
      readSave(): Promise<SaveStateV3>;
      setBlocked(value: boolean): void;
      dispose(): void;
    };
  }
}

void mount().then(() => {
  window.__squishyRealStudio = {
    snapshot: () => {
      const shell = root.querySelector<HTMLElement>('[data-sandbox-app]');
      return {
        stage: shell?.dataset.stage ?? 'missing',
        shape: shell?.dataset.shape ?? 'missing',
        material: shell?.dataset.material ?? 'missing',
        paintStrokes: Number(shell?.dataset.paintStrokes ?? 0),
        mixinCount: Number(shell?.dataset.mixinCount ?? 0),
        stickerCount: Number(shell?.dataset.decorStickerCount ?? 0),
        savedId: shell?.dataset.savedSquishyId ?? null,
        storedCount: state.library.length,
        webglReady: root.querySelector('[data-sandbox-canvas]')?.getAttribute('data-phaser-ready') === 'true',
        canvasCount: root.querySelectorAll('[data-sandbox-canvas]').length,
      };
    },
    readSave: () => repository.load(),
    setBlocked: (value) => app?.setActivityBlocked(value),
    dispose,
  };
  window.addEventListener('pagehide', dispose, { once: true });
}).catch((error: unknown) => {
  console.error('[phaser-studio:bootstrap]', error);
  root.dataset.phaserStudioReady = 'failed';
  root.textContent = 'Phaser studio preview failed to start.';
});
