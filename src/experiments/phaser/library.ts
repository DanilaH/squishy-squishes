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
import {
  appendSavedSquishy,
  createSaveV3Repository,
  createSavedSquishy,
  deleteSavedSquishy,
  replaceSavedSquishy,
  SAVE_V3_STORAGE_KEY,
  type SaveStateV3,
} from '../../platform/saveV3';
import { completeRecipeIdea } from '../../platform/saveV3Ideas';
import { S5_SHELF_EXPANSION_CAPACITY } from '../../platform/saveV3Rewards';
import { createSettingsRepository, type SettingsV1 } from '../../platform/settings';
import { SandboxLibraryApp } from '../../sandbox/SandboxLibraryApp';
import { getSquishyIdea, matchSquishyIdea } from '../../sandbox/ideas';
import { PhaserSquishSurface } from '../../sandbox/PhaserSquishSurface';
import type { SandboxLanguage } from '../../sandbox/SandboxApp';
import type { SandboxDraft } from '../../sandbox/types';

/** Candidate-only: use original V3 codec and Library UI without touching live saves or ads. */
const PREFIX = 'squishy.phaser-library-preview.';
const storage: StorageAdapter = {
  getItem: async (key) => sessionStorage.getItem(PREFIX + key),
  setItem: async (key, value) => { sessionStorage.setItem(PREFIX + key, value); },
  removeItem: async (key) => { sessionStorage.removeItem(PREFIX + key); },
};
const repository = createSaveV3Repository(storage);
const settingsRepository = createSettingsRepository(storage);
const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Phaser Library candidate requires #app');
const language: SandboxLanguage = new URLSearchParams(location.search).get('lang') === 'ru' ? 'ru' : 'en';
let saveState: SaveStateV3;
let settingsState: SettingsV1;
let app: SandboxLibraryApp | null = null;
let disposed = false;

const persist = async (next: SaveStateV3): Promise<void> => {
  await repository.write(next);
  await repository.flush();
  saveState = next;
};

const completeIdea = (state: SaveStateV3, draft: SandboxDraft, ideaId: string | null): SaveStateV3 => {
  if (!ideaId) return state;
  const idea = getSquishyIdea(ideaId);
  return idea && matchSquishyIdea(draft, idea).complete ? completeRecipeIdea(state, ideaId) : state;
};

const mount = async (): Promise<void> => {
  saveState = await repository.loadOrDefault((error) => console.error('[phaser-library:v3-load]', error));
  settingsState = await settingsRepository.loadOrDefault((error) => console.error('[phaser-library:settings-load]', error));
  if (disposed) return;
  app = new SandboxLibraryApp(root, {
    language,
    muted: settingsState.muted,
    initialLibrary: saveState.library,
    initialCompletedRecipeIds: saveState.completedRecipeIds,
    libraryCapacity: saveState.libraryCapacity,
    shelfExpansionTargetCapacity: S5_SHELF_EXPANSION_CAPACITY,
    makerRendererOptions: {
      rendererBackend: 'phaser',
      makePhaserRenderer: (canvas, onMetrics, audio, callbacks) =>
        new PhaserSquishSurface(canvas, onMetrics, audio, callbacks),
    },
    // This isolated preview has NO ads runtime. A closed/no-grant response must
    // never unlock shelf capacity or claim rewarded-ad parity.
    onUnlockShelfExpansion: async () => ({
      granted: false,
      libraryCapacity: saveState.libraryCapacity,
      status: 'closed',
    }),
    onAppendSquishy: async (draft, ideaId) => {
      const savedSquishy = createSavedSquishy(draft);
      const next = completeIdea(appendSavedSquishy(saveState, savedSquishy), draft, ideaId);
      await persist(next);
      return { savedSquishy, library: next.library, completedRecipeIds: next.completedRecipeIds };
    },
    onReplaceSquishy: async (targetId, draft, ideaId) => {
      const savedSquishy = createSavedSquishy(draft);
      const next = completeIdea(replaceSavedSquishy(saveState, targetId, savedSquishy), draft, ideaId);
      await persist(next);
      return { savedSquishy, library: next.library, completedRecipeIds: next.completedRecipeIds };
    },
    onDeleteSquishy: async (id) => {
      const next = deleteSavedSquishy(saveState, id);
      await persist(next);
      return next.library;
    },
    onMutedChange: (muted) => {
      settingsState = { version: 1, muted };
      void settingsRepository.write(settingsState).catch((error: unknown) => console.error('[phaser-library:mute]', error));
    },
  });
  root.dataset.phaserLibraryReady = 'true';
  root.dataset.previewStorageKey = PREFIX + SAVE_V3_STORAGE_KEY;
  document.body.dataset.phaserAds = 'unavailable-in-isolated-preview';
};

const dispose = (): void => {
  if (disposed) return;
  disposed = true;
  app?.dispose();
  app = null;
  delete window.__squishyPhaserLibrary;
};

declare global {
  interface Window {
    __squishyPhaserLibrary?: {
      readSave(): Promise<SaveStateV3>;
      storageKey(): string;
      setBlocked(blocked: boolean): void;
      dispose(): void;
    };
  }
}

void mount().then(() => {
  if (disposed) return;
  window.__squishyPhaserLibrary = {
    readSave: () => repository.load(),
    storageKey: () => PREFIX + SAVE_V3_STORAGE_KEY,
    setBlocked: (blocked) => app?.setActivityBlocked(blocked),
    dispose,
  };
  // bfcache: cancel an in-flight gesture and resume the same instance on return.
  window.addEventListener('pagehide', () => app?.setActivityBlocked(true));
  window.addEventListener('pageshow', () => app?.setActivityBlocked(false));
}).catch((error: unknown) => {
  console.error('[phaser-library:bootstrap]', error);
  root.dataset.phaserLibraryReady = 'failed';
  root.textContent = 'Phaser Library preview failed to start.';
});
