import { installReleaseSession } from '../platform/releaseSession';
import { createSquishyPlatformRuntime } from '../platform/runtime';
import {
  appendSavedSquishy,
  createDefaultSaveV3,
  createSaveV3Repository,
  createSavedSquishy,
  deleteSavedSquishy,
  loadSaveV3WithMigration,
  replaceSavedSquishy,
} from '../platform/saveV3';
import { createDefaultSettings, createSettingsRepository } from '../platform/settings';
import { SandboxLibraryApp } from '../sandbox/SandboxLibraryApp';
import type { SandboxLanguage } from '../sandbox/SandboxApp';

export interface SquishyAppHandle {
  dispose(): Promise<void>;
}

const reportError = (scope: string, error: unknown): void => {
  console.error(`[squishy:${scope}]`, error);
};

export const bootstrapSquishyApp = async (root: HTMLDivElement): Promise<SquishyAppHandle> => {
  const runtime = await createSquishyPlatformRuntime();
  document.body.dataset.releasePlatform = runtime.kind;
  document.body.dataset.releaseBuild = import.meta.env.PROD ? 'production' : 'development';

  if (
    import.meta.env.VITE_PLATFORM !== 'yandex'
    && new URLSearchParams(window.location.search).get('appearanceProbe') === '1'
  ) {
    const { installAppearanceProbe } = await import('../debug/installAppearanceProbe');
    const removeAppearanceProbe = await installAppearanceProbe(root, runtime.storage);
    runtime.activity.setGameplayDesired(true);
    runtime.markReady();
    let probeDisposed = false;
    return {
      async dispose() {
        if (probeDisposed) return;
        probeDisposed = true;
        runtime.activity.setGameplayDesired(false);
        removeAppearanceProbe();
        runtime.destroy();
      },
    };
  }

  const saveRepository = createSaveV3Repository(runtime.storage);
  const settingsRepository = createSettingsRepository(runtime.storage);

  let saveState = await loadSaveV3WithMigration(
    runtime.storage,
    saveRepository,
    (error) => reportError('save-v3-load', error),
  );
  let settingsState = await settingsRepository.loadOrDefault(
    (error) => reportError('settings-load', error),
  );

  const persistSave = async (nextState: typeof saveState): Promise<void> => {
    await saveRepository.write(nextState);
    await saveRepository.flush();
    saveState = nextState;
  };

  const language: SandboxLanguage = runtime.language === 'ru' ? 'ru' : 'en';
  const app = new SandboxLibraryApp(root, {
    language,
    muted: settingsState.muted,
    initialLibrary: saveState.library,
    libraryCapacity: saveState.libraryCapacity,
    onAppendSquishy: async (draft) => {
      const savedSquishy = createSavedSquishy(draft);
      const nextState = appendSavedSquishy(saveState, savedSquishy);
      await persistSave(nextState);
      return { savedSquishy, library: nextState.library };
    },
    onReplaceSquishy: async (targetId, draft) => {
      const savedSquishy = createSavedSquishy(draft);
      const nextState = replaceSavedSquishy(saveState, targetId, savedSquishy);
      await persistSave(nextState);
      return { savedSquishy, library: nextState.library };
    },
    onDeleteSquishy: async (targetId) => {
      const nextState = deleteSavedSquishy(saveState, targetId);
      await persistSave(nextState);
      return nextState.library;
    },
    onMutedChange: (muted) => {
      settingsState = { version: 1, muted };
      void settingsRepository.write(settingsState).catch((error: unknown) => reportError('settings-write', error));
    },
  });

  const releaseSession = installReleaseSession(root, runtime);
  const unsubscribeActivity = runtime.activity.onBlockedChange((blocked) => app.setActivityBlocked(blocked));
  runtime.activity.setGameplayDesired(true);
  runtime.markReady();

  let removeDebugTools = (): void => undefined;
  if (import.meta.env.DEV) {
    const { installDebugTools } = await import('../debug/installDebugTools');
    removeDebugTools = installDebugTools({
      resetSave: async () => {
        await saveRepository.remove();
        saveState = createDefaultSaveV3();
        console.info('[squishy-debug] V3 save cleared; reload to reset sandbox state');
      },
      resetSettings: async () => {
        await settingsRepository.remove();
        settingsState = createDefaultSettings();
        console.info('[squishy-debug] settings cleared; reload to apply defaults');
      },
      getState: () => ({
        runtime: runtime.kind,
        language: runtime.language,
        save: saveState,
        settings: settingsState,
      }),
    });
  }

  let disposed = false;
  return {
    async dispose() {
      if (disposed) return;
      disposed = true;
      runtime.activity.setGameplayDesired(false);
      unsubscribeActivity();
      releaseSession.dispose();
      removeDebugTools();
      app.dispose();
      await Promise.allSettled([saveRepository.flush(), settingsRepository.flush()]);
      runtime.destroy();
    },
  };
};
