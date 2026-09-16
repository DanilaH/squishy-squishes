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
import { bootstrapSquishyApp } from '../../app/bootstrap';
import { getGameCopy, normalizeLanguage } from '../../i18n';
import { createSquishyPlatformRuntime, type SquishyPlatformRuntime } from '../../platform/runtime';
import { PhaserSquishSurface } from '../../sandbox/PhaserSquishSurface';

// Pages is a public device-preview, not a migration of real player saves or a Yandex SDK test.
const PAGES_PREFIX = 'squishy.phaser-pages-preview.';
const prefixStorage = (storage: StorageAdapter): StorageAdapter => ({
  getItem: (key) => storage.getItem(PAGES_PREFIX + key),
  setItem: (key, value) => storage.setItem(PAGES_PREFIX + key, value),
  removeItem: (key) => storage.removeItem(PAGES_PREFIX + key),
});

let pagesRuntime: SquishyPlatformRuntime | null = null;
const createPagesRuntime = async (): Promise<SquishyPlatformRuntime> => {
  const runtime = await createSquishyPlatformRuntime();
  if (runtime.kind === 'yandex') {
    runtime.destroy();
    throw new Error('The Phaser Pages preview must not initialize the Yandex SDK.');
  }
  pagesRuntime = { ...runtime, storage: prefixStorage(runtime.storage) };
  return pagesRuntime;
};

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app root.');

void bootstrapSquishyApp(root, {
  createRuntime: createPagesRuntime,
  makerRendererOptions: {
    rendererBackend: 'phaser',
    makePhaserRenderer: (canvas, onMetrics, audio, callbacks) =>
      new PhaserSquishSurface(canvas, onMetrics, audio, callbacks),
  },
}).then((handle) => {
  const listeners = new AbortController();
  let disposed = false;
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    listeners.abort();
    pagesRuntime = null;
    void handle.dispose();
  };
  window.addEventListener('pagehide', (event) => {
    pagesRuntime?.activity.setBlocked('pagehide', true);
    if (!event.persisted) dispose();
  }, { signal: listeners.signal });
  window.addEventListener('pageshow', () => {
    pagesRuntime?.activity.setBlocked('pagehide', false);
  }, { signal: listeners.signal });
}).catch((error: unknown) => {
  console.error('[squishy:phaser-pages-preview]', error);
  const copy = getGameCopy(normalizeLanguage(navigator.language));
  root.innerHTML = `<main class="lab-shell"><section class="recipe-panel"><strong>${copy.fatal.title}</strong><span>${copy.fatal.retry}</span></section></main>`;
});
