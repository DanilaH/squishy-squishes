import { VerticalSliceApp } from '../game/VerticalSliceApp';
import { getGameCopy } from '../i18n';
import { createSquishyPlatformRuntime } from '../platform/runtime';
import { applyCollectedVariant, createSaveRepository, loadSaveWithLegacyMigration } from '../platform/save';
import { createSettingsRepository } from '../platform/settings';

export interface SquishyAppHandle {
  dispose(): Promise<void>;
}

export const bootstrapSquishyApp = async (root: HTMLDivElement): Promise<SquishyAppHandle> => {
  const runtime = await createSquishyPlatformRuntime();
  const saveRepository = createSaveRepository(runtime.storage);
  const settingsRepository = createSettingsRepository(runtime.storage);
  let saveState = await loadSaveWithLegacyMigration(runtime.storage, saveRepository, console.error);
  let settingsState = await settingsRepository.loadOrDefault(console.error);
  const app = new VerticalSliceApp(root, {
    completedVariantIds: saveState.completedVariantIds,
    muted: settingsState.muted,
    copy: getGameCopy(runtime.language),
    onVariantCollected: (id) => {
      saveState = applyCollectedVariant(saveState, id);
      void saveRepository.write(saveState).catch(console.error);
    },
    onMutedChange: (muted) => {
      settingsState = { version: 1, muted };
      void settingsRepository.write(settingsState).catch(console.error);
    },
  });
  const unsubscribe = runtime.activity.onBlockedChange((blocked) => app.setActivityBlocked(blocked));
  runtime.activity.setGameplayDesired(true);
  runtime.markReady();
  let disposed = false;
  return {
    async dispose() {
      if (disposed) return;
      disposed = true;
      runtime.activity.setGameplayDesired(false);
      unsubscribe();
      app.dispose();
      runtime.destroy();
      await Promise.allSettled([saveRepository.flush(), settingsRepository.flush()]);
    },
  };
};
