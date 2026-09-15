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
import { completeRecipeIdea } from '../platform/saveV3Ideas';
import {
  S5_SHELF_EXPANSION_CAPACITY,
  S5_SHELF_EXPANSION_REWARD_ID,
  grantS5ShelfExpansion,
  hasS5ShelfExpansion,
} from '../platform/saveV3Rewards';
import { SandboxLibraryApp } from '../sandbox/SandboxLibraryApp';
import { getSquishyIdea, matchSquishyIdea } from '../sandbox/ideas';
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

  if (hasS5ShelfExpansion(saveState) && saveState.libraryCapacity < S5_SHELF_EXPANSION_CAPACITY) {
    await persistSave(grantS5ShelfExpansion(saveState));
  }

  const completeMatchingIdea = (state: typeof saveState, draft: Parameters<typeof createSavedSquishy>[0], ideaId: string | null): typeof saveState => {
    if (!ideaId) return state;
    const idea = getSquishyIdea(ideaId);
    if (!idea || !matchSquishyIdea(draft, idea).complete) return state;
    return completeRecipeIdea(state, ideaId);
  };

  const language: SandboxLanguage = runtime.language === 'ru' ? 'ru' : 'en';
  const app = new SandboxLibraryApp(root, {
    language,
    muted: settingsState.muted,
    initialLibrary: saveState.library,
    initialCompletedRecipeIds: saveState.completedRecipeIds,
    libraryCapacity: saveState.libraryCapacity,
    shelfExpansionTargetCapacity: S5_SHELF_EXPANSION_CAPACITY,
    onUnlockShelfExpansion: async () => {
      runtime.analytics.track('shelf_reward_offer_click', {
        count: saveState.library.length,
        capacity: saveState.libraryCapacity,
      });
      let grantedCapacity = saveState.libraryCapacity;
      const result = await runtime.ads.showRewarded({
        rewardId: S5_SHELF_EXPANSION_REWARD_ID,
        onReward: async () => {
          const nextState = grantS5ShelfExpansion(saveState);
          await persistSave(nextState);
          grantedCapacity = nextState.libraryCapacity;
          runtime.analytics.track('shelf_reward_granted', { capacity: nextState.libraryCapacity });
        },
      });
      return {
        granted: result.rewardEarned,
        libraryCapacity: grantedCapacity,
        status: result.status,
      };
    },
    onAppendSquishy: async (draft, ideaId) => {
      const savedSquishy = createSavedSquishy(draft);
      let nextState = appendSavedSquishy(saveState, savedSquishy);
      nextState = completeMatchingIdea(nextState, draft, ideaId);
      await persistSave(nextState);
      return { savedSquishy, library: nextState.library, completedRecipeIds: nextState.completedRecipeIds };
    },
    onReplaceSquishy: async (targetId, draft, ideaId) => {
      const savedSquishy = createSavedSquishy(draft);
      let nextState = replaceSavedSquishy(saveState, targetId, savedSquishy);
      nextState = completeMatchingIdea(nextState, draft, ideaId);
      await persistSave(nextState);
      return { savedSquishy, library: nextState.library, completedRecipeIds: nextState.completedRecipeIds };
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
