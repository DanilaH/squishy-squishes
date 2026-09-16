import type { StorageAdapter } from '@danilah/mini-games-kit/platform';
import { createMockPlatformRuntime } from '@danilah/mini-games-kit/yandex';
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
import { normalizeLanguage } from '../../i18n';
import { createSquishyPlatformRuntime, type SquishyPlatformRuntime } from '../../platform/runtime';
import { createSaveV3Repository, SAVE_V3_STORAGE_KEY, type SaveStateV3 } from '../../platform/saveV3';
import { PhaserSquishSurface } from '../../sandbox/PhaserSquishSurface';
import { createStubYandexRuntime, type StubRewardMode, type StubYandexControls } from './platformStub';

/** All candidate keys, including V2 migration and settings, stay out of real player storage. */
const PREFIX = 'squishy.phaser-platform-preview.';
const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Phaser platform candidate requires #app.');
const params = new URLSearchParams(location.search);
const useStubSdk = params.get('sdk') === 'stub' && import.meta.env.VITE_PLATFORM !== 'yandex';
let sdkControls: StubYandexControls | null = null;
let runtime: SquishyPlatformRuntime | null = null;
let app: SquishyAppHandle | null = null;
let disposed = false;
let failSaveWrites = false;
const listeners = new AbortController();
const events: string[] = [];
let mockReady = 0;

const prefixStorage = (upstream: StorageAdapter): StorageAdapter => ({
  getItem: (key) => upstream.getItem(PREFIX + key),
  setItem: (key, value) => {
    if (failSaveWrites && key === SAVE_V3_STORAGE_KEY) return Promise.reject(new Error('Injected candidate-only V3 storage failure'));
    return upstream.setItem(PREFIX + key, value);
  },
  removeItem: (key) => upstream.removeItem(PREFIX + key),
});

const createCandidateRuntime = async (): Promise<SquishyPlatformRuntime> => {
  let original: SquishyPlatformRuntime;
  if (useStubSdk) {
    const stub = await createStubYandexRuntime();
    sdkControls = stub.controls;
    original = stub.runtime;
  } else if (import.meta.env.VITE_PLATFORM === 'yandex') {
    // Same production SDK initialization and adapters, but never live V3 keys.
    original = await createSquishyPlatformRuntime();
  } else {
    original = createMockPlatformRuntime({
      language: normalizeLanguage(params.get('lang') ?? navigator.language),
      storage: {
        getItem: async (key) => sessionStorage.getItem(key),
        setItem: async (key, value) => { sessionStorage.setItem(key, value); },
        removeItem: async (key) => { sessionStorage.removeItem(key); },
      },
      analytics: { track: (event, values) => events.push(`analytics:${event}:${JSON.stringify(values ?? {})}`) },
      visibilityBlockReason: 'visibility',
      startGameplay: () => events.push('gameplay_start'),
      stopGameplay: () => events.push('gameplay_stop'),
    });
  }
  runtime = {
    ...original,
    storage: prefixStorage(original.storage),
    markReady: () => { mockReady += 1; original.markReady(); },
  };
  return runtime;
};

const dispose = async (): Promise<void> => {
  if (disposed) return;
  disposed = true;
  listeners.abort();
  const current = app;
  app = null;
  if (current) await current.dispose();
  delete window.__squishyPhaserPlatform;
};

declare global {
  interface Window {
    __squishyPhaserPlatform?: {
      readSave(): Promise<SaveStateV3>;
      storageKey(): string;
      getEvents(): readonly string[];
      getSdkCounters(): StubYandexControls['counters'] | null;
      getReadyCalls(): number;
      setRewardMode(mode: StubRewardMode): void;
      setSaveWriteFailure(enabled: boolean): void;
      pause(): void;
      resume(): void;
      finishPendingReward(grant: boolean): void;
      setBlocked(blocked: boolean): void;
      dispose(): Promise<void>;
    };
  }
}

void bootstrapSquishyApp(root, {
  createRuntime: createCandidateRuntime,
  makerRendererOptions: {
    rendererBackend: 'phaser',
    makePhaserRenderer: (canvas, onMetrics, audio, callbacks) =>
      new PhaserSquishSurface(canvas, onMetrics, audio, callbacks),
  },
}).then((handle) => {
  if (disposed) { void handle.dispose(); return; }
  app = handle;
  root.dataset.phaserPlatformReady = 'true';
  root.dataset.previewStorageKey = PREFIX + SAVE_V3_STORAGE_KEY;
  window.__squishyPhaserPlatform = {
    readSave: () => createSaveV3Repository(runtime!.storage).load(),
    storageKey: () => PREFIX + SAVE_V3_STORAGE_KEY,
    getEvents: () => [...(sdkControls?.events ?? events)],
    getSdkCounters: () => sdkControls ? { ...sdkControls.counters } : null,
    getReadyCalls: () => mockReady,
    setRewardMode: (mode) => { if (!sdkControls) throw new Error('Stub SDK required'); sdkControls.setRewardMode(mode); },
    setSaveWriteFailure: (enabled) => { failSaveWrites = enabled; },
    pause: () => { if (!sdkControls) throw new Error('Stub SDK required'); sdkControls.pause(); },
    resume: () => { if (!sdkControls) throw new Error('Stub SDK required'); sdkControls.resume(); },
    finishPendingReward: (grant) => { if (!sdkControls) throw new Error('Stub SDK required'); sdkControls.finishPendingReward(grant); },
    setBlocked: (blocked) => runtime?.activity.setBlocked('candidate-test', blocked),
    dispose,
  };
  // bfcache does not imply disposal. The shared coordinator cancels input.
  window.addEventListener('pagehide', () => runtime?.activity.setBlocked('pagehide', true), { signal: listeners.signal });
  window.addEventListener('pageshow', () => runtime?.activity.setBlocked('pagehide', false), { signal: listeners.signal });
}).catch((error: unknown) => {
  console.error('[phaser-platform:bootstrap]', error);
  root.dataset.phaserPlatformReady = 'failed';
  root.textContent = 'Phaser platform preview failed to start.';
});
