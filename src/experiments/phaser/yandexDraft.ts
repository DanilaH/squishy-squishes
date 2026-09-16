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

/** DRAFT must exercise the real SDK but cannot mutate an existing player's normal save/settings. */
const DRAFT_PREFIX = 'squishy.phaser-yandex-draft.';
const prefixStorage = (storage: StorageAdapter): StorageAdapter => ({
  getItem: (key) => storage.getItem(DRAFT_PREFIX + key),
  setItem: (key, value) => storage.setItem(DRAFT_PREFIX + key, value),
  removeItem: (key) => storage.removeItem(DRAFT_PREFIX + key),
});

let draftRuntime: SquishyPlatformRuntime | null = null;
const createDraftRuntime = async (): Promise<SquishyPlatformRuntime> => {
  const runtime = await createSquishyPlatformRuntime();
  if (runtime.kind !== 'yandex') {
    runtime.destroy();
    throw new Error('Phaser Yandex DRAFT requires the real Yandex platform runtime.');
  }
  draftRuntime = { ...runtime, storage: prefixStorage(runtime.storage) };
  return draftRuntime;
};

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app root.');

void bootstrapSquishyApp(root, {
  createRuntime: createDraftRuntime,
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
    draftRuntime = null;
    void handle.dispose();
  };
  // A bfcache pagehide suspends the existing Phaser.Game; only a final hide destroys it.
  window.addEventListener('pagehide', (event) => {
    draftRuntime?.activity.setBlocked('pagehide', true);
    if (!event.persisted) dispose();
  }, { signal: listeners.signal });
  window.addEventListener('pageshow', () => {
    draftRuntime?.activity.setBlocked('pagehide', false);
  }, { signal: listeners.signal });
}).catch((error: unknown) => {
  console.error('[squishy:phaser-yandex-draft]', error);
  const copy = getGameCopy(normalizeLanguage(navigator.language));
  root.innerHTML = `<main class="lab-shell"><section class="recipe-panel"><strong>${copy.fatal.title}</strong><span>${copy.fatal.retry}</span></section></main>`;
});
