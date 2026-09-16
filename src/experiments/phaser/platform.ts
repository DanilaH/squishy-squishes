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
import { bootstrapSquishyApp, type SquishyAppHandle } from '../../app/bootstrap';
import { PhaserSquishSurface } from '../../sandbox/PhaserSquishSurface';

// This entry runs the ORIGINAL platform bootstrap, including the real Yandex
// runtime when built with VITE_PLATFORM=yandex. Namespace every save/settings
// key so a preview cannot overwrite or consume an ordinary player's data.
const STORAGE_NAMESPACE = 'squishy.phaser-platform-preview.';
const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Phaser platform preview needs #app');

let app: SquishyAppHandle | null = null;
let disposed = false;
const dispose = async (): Promise<void> => {
  if (disposed) return;
  disposed = true;
  const active = app;
  app = null;
  await active?.dispose();
  delete window.__squishyPhaserPlatform;
};

declare global {
  interface Window {
    __squishyPhaserPlatform?: {
      storageNamespace: string;
      dispose(): Promise<void>;
    };
  }
}

void bootstrapSquishyApp(root, {
  storageNamespace: STORAGE_NAMESPACE,
  makerRendererOptions: {
    rendererBackend: 'phaser',
    makePhaserRenderer: (canvas, onMetrics, audio, callbacks) =>
      new PhaserSquishSurface(canvas, onMetrics, audio, callbacks),
  },
}).then(async (handle) => {
  if (disposed) {
    await handle.dispose();
    return;
  }
  app = handle;
  root.dataset.phaserPlatformReady = 'true';
  root.dataset.previewStorageNamespace = STORAGE_NAMESPACE;
  window.__squishyPhaserPlatform = { storageNamespace: STORAGE_NAMESPACE, dispose };
  // Do not destroy a live Phaser/SDK instance on a bfcache navigation.
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) void dispose();
  });
}).catch((error: unknown) => {
  console.error('[phaser-platform:bootstrap]', error);
  root.dataset.phaserPlatformReady = 'failed';
  root.textContent = 'Phaser platform preview failed to start.';
});
