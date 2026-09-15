import { VerticalSliceApp } from '../game/VerticalSliceApp';
import { ALL_VARIANT_IDS } from '../game/content';
import { getGameCopy } from '../i18n';
import { installReleaseSession } from '../platform/releaseSession';
import { createSquishyPlatformRuntime } from '../platform/runtime';
import {
  applyCollectedVariant,
  createDefaultSave,
  createSaveRepository,
  loadSaveWithLegacyMigration,
  resetProgressSave,
  type SaveStateV2,
} from '../platform/save';
import { createDefaultSettings, createSettingsRepository } from '../platform/settings';

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

  const saveRepository = createSaveRepository(runtime.storage);
  const settingsRepository = createSettingsRepository(runtime.storage);

  let saveState = await loadSaveWithLegacyMigration(
    runtime.storage,
    saveRepository,
    (error) => reportError('save-load', error),
  );
  let settingsState = await settingsRepository.loadOrDefault(
    (error) => reportError('settings-load', error),
  );

  const app = new VerticalSliceApp(root, {
    completedVariantIds: saveState.completedVariantIds,
    labXp: saveState.labXp,
    muted: settingsState.muted,
    copy: getGameCopy(runtime.language),
    onVariantCollected: (id) => {
      const result = applyCollectedVariant(saveState, id);
      saveState = result.state;
      void saveRepository.write(saveState).catch((error: unknown) => reportError('save-write', error));
      return result.outcome;
    },
    onProgressReset: async () => {
      saveState = await resetProgressSave(runtime.storage, saveRepository);
    },
    onMutedChange: (muted) => {
      settingsState = { version: 1, muted };
      void settingsRepository.write(settingsState).catch((error: unknown) => reportError('settings-write', error));
    },
  });

  let removePhoneQaPanel = (): void => undefined;
  if (import.meta.env.VITE_PLATFORM !== 'yandex' || import.meta.env.VITE_ENABLE_QA === '1') {
    const { installPhoneQaPanel } = await import('../debug/installPhoneQaPanel');
    removePhoneQaPanel = installPhoneQaPanel({
    language: runtime.language,
    getSaveState: () => saveState,
    setProgress: async (next) => {
      const requested = new Set(next.completedVariantIds);
      const completedVariantIds = ALL_VARIANT_IDS.filter((id) => requested.has(id));
      const nextState: SaveStateV2 = {
        version: 2,
        completedVariantIds,
        totalCrafts: Math.max(saveState.totalCrafts, completedVariantIds.length),
        labXp: Math.max(0, Math.floor(next.labXp)),
        updatedAt: Date.now(),
      };
      await saveRepository.write(nextState);
      await saveRepository.flush();
      saveState = nextState;
    },
    resetProgress: async () => {
      saveState = await resetProgressSave(runtime.storage, saveRepository);
    },
    });
  }

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
        saveState = createDefaultSave();
        console.info('[squishy-debug] save cleared; reload to reset in-memory progression state');
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
      removePhoneQaPanel();
      removeDebugTools();
      app.dispose();
      await Promise.allSettled([saveRepository.flush(), settingsRepository.flush()]);
      runtime.destroy();
    },
  };
};
