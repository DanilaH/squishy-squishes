import { ActionInterstitialGate } from '@danilah/mini-games-kit/platform';
import type { SquishyPlatformRuntime } from './runtime';

const LEGACY_ACTIVE_CRAFT_STAGES = new Set(['pour', 'add', 'mix', 'mold', 'reveal', 'test']);
const SANDBOX_ACTIVE_CRAFT_STAGES = new Set(['shape', 'paint', 'mixins', 'mix', 'decor', 'finish']);

export interface ReleaseSessionHandle {
  dispose(): void;
}

const selectionParams = (shell: HTMLElement | null): Readonly<Record<string, string>> => ({
  shape: shell?.dataset.shape ?? 'unknown',
  material: shell?.dataset.material ?? 'unknown',
});

export const installReleaseSession = (
  root: HTMLDivElement,
  runtime: SquishyPlatformRuntime,
): ReleaseSessionHandle => {
  const sandboxMode = root.querySelector('[data-sandbox-library], [data-sandbox-app]') !== null;
  const legacyCollection = root.querySelector<HTMLElement>('.collection-overlay');

  if (!sandboxMode && !root.querySelector('.lab-shell')) {
    throw new Error('Release session requires the mounted game shell.');
  }

  const gate = new ActionInterstitialGate(
    () => performance.now(),
    {
      initialGraceMs: 120_000,
      minIntervalMs: 150_000,
      minActionsBetweenRequests: 1,
    },
  );
  gate.markReady();

  const getSandboxShell = (): HTMLElement | null =>
    root.querySelector<HTMLElement>('[data-sandbox-app]');
  const getLibraryShell = (): HTMLElement | null =>
    root.querySelector<HTMLElement>('[data-sandbox-library]');
  const getLegacyShell = (): HTMLElement | null =>
    root.querySelector<HTMLElement>('.lab-shell');
  const currentStage = (): string => {
    if (sandboxMode) return getSandboxShell()?.dataset.stage ?? getLibraryShell()?.dataset.stage ?? 'library';
    return getLegacyShell()?.dataset.stage ?? 'select';
  };

  let disposed = false;
  let previousStage = currentStage();
  let previousStageAt = performance.now();
  let collectionOpen = legacyCollection ? !legacyCollection.hidden : false;
  let completedCrafts = 0;
  let pendingCompletedSaveActions = 0;
  let adInFlight = false;

  runtime.analytics.track('session_ready', {
    platform: runtime.kind,
    language: runtime.language,
    mode: sandboxMode ? 'sandbox' : 'legacy',
  });

  const isNaturalBreak = (): boolean => {
    const stage = currentStage();
    if (sandboxMode) return stage === 'library';
    return stage === 'select' && !collectionOpen;
  };

  const showInterstitialIfEligible = async (eligibleActions = 1): Promise<void> => {
    if (
      disposed
      || !(runtime.capabilities?.interstitial ?? runtime.kind === 'yandex')
      || adInFlight
      || !isNaturalBreak()
      || performance.now() - Number(root.dataset.lastRewardAt ?? -Infinity) < 150_000
      || eligibleActions < 1
    ) return;

    let shouldRequest = false;
    for (let index = 0; index < eligibleActions; index += 1) {
      if (gate.recordEligibleAction()) shouldRequest = true;
    }
    if (!shouldRequest) return;

    adInFlight = true;
    runtime.analytics.track('interstitial_request', { completedCrafts });
    try {
      const result = await runtime.ads.showInterstitial();
      runtime.analytics.track('interstitial_result', {
        completedCrafts,
        status: result.status,
        wasShown: result.wasShown,
      });
    } catch (error: unknown) {
      runtime.analytics.track('interstitial_result', {
        completedCrafts,
        status: 'exception',
      });
      console.error('[squishy:interstitial]', error);
    } finally {
      adInFlight = false;
    }
  };

  // Enable only after the Console's API-controlled banner option is verified.
  let bannerDesired: boolean | null = null;
  let bannerQueue = Promise.resolve();
  const syncBanner = (): void => {
    if (!(runtime.capabilities?.banner ?? (runtime.kind === 'yandex' && import.meta.env.VITE_STICKY_BANNER_CONTROL === '1'))) return;
    const modal = [...root.querySelectorAll<HTMLElement>('[role="dialog"], dialog[open], [data-room-editing="true"]')].some(node => node.getClientRects().length > 0);
    const tutorial = root.querySelector('[data-guide-skip], [data-room-decor-hint]');
    const visible = runtime.kind === 'android'
      ? !modal && !tutorial && !runtime.activity.isBlocked()
      : ['library', 'squeeze'].includes(currentStage());
    if (bannerDesired === visible) return;
    bannerDesired = visible;
    bannerQueue = bannerQueue.then(async () => {
      if (disposed || bannerDesired !== visible) return;
      const result = await runtime.ads.setStickyBannerVisible(visible);
      runtime.analytics.track('banner_visibility_result', { requested: visible, showing: result.isShowing });
    }).catch(error => console.error('[squishy:banner]', error));
  };
  const unsubscribeBanner = runtime.activity.onBlockedChange(() => syncBanner());
  syncBanner();
  const handleStageChange = (): void => {
    syncBanner();
    const stage = currentStage();
    if (stage === previousStage) return;

    if (sandboxMode) {
      const sandboxShell = getSandboxShell();
      if (stage === 'shape' && ['library', 'squeeze', 'home'].includes(previousStage) && sandboxShell?.dataset.saveKind !== 'edit') {
        runtime.analytics.track('craft_start', selectionParams(sandboxShell));
      }
      if (SANDBOX_ACTIVE_CRAFT_STAGES.has(previousStage) && stage === 'squeeze' && sandboxShell?.dataset.saveKind !== 'edit') {
        completedCrafts += 1;
        pendingCompletedSaveActions += 1;
        runtime.analytics.track('craft_save', {
          ...selectionParams(sandboxShell),
          completedCrafts,
        });
      }

      const enteredLibrary = stage === 'library' && previousStage !== 'library';
      const meaningfulSqueeze = previousStage === 'squeeze' && performance.now() - previousStageAt > 15_000;
      const eligibleActions = enteredLibrary && (pendingCompletedSaveActions > 0 || meaningfulSqueeze) ? 1 : 0;
      if (enteredLibrary) pendingCompletedSaveActions = 0;
      previousStage = stage;
      previousStageAt = performance.now();
      if (eligibleActions > 0) void showInterstitialIfEligible(eligibleActions);
      return;
    }

    const legacyShell = getLegacyShell();
    if (stage === 'pour') runtime.analytics.track('craft_start', selectionParams(legacyShell));
    if (stage === 'collect') {
      completedCrafts += 1;
      runtime.analytics.track('craft_collect', {
        ...selectionParams(legacyShell),
        completedCrafts,
      });
    }
    const completedLoopReturnedToSelect = previousStage === 'collect' && stage === 'select';
    previousStage = stage;
    if (completedLoopReturnedToSelect) void showInterstitialIfEligible();
  };

  const stageObserver = new MutationObserver(handleStageChange);
  stageObserver.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['data-stage', 'hidden', 'data-room-editing'],
  });

  const handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const revisit = target.closest<HTMLElement>('[data-revisit-id]')?.dataset.revisitId;
    if (revisit) runtime.analytics.track('recipe_revisit', { recipeId: revisit });

    const make = target.closest<HTMLElement>('[data-make-id]')?.dataset.makeId;
    if (make) runtime.analytics.track('catalog_recipe_start', { recipeId: make });

    const mute = target.closest<HTMLElement>('[data-action="mute"], [data-library-mute]');
    if (mute) {
      queueMicrotask(() => {
        runtime.analytics.track('mute_toggle', {
          muted: mute.getAttribute('aria-pressed') === 'true',
        });
      });
    }
  };

  root.addEventListener('click', handleClick);

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      unsubscribeBanner();
      void runtime.ads.setStickyBannerVisible(false).catch(() => undefined);
      stageObserver.disconnect();
      root.removeEventListener('click', handleClick);
      const stage = currentStage();
      const activeStages = sandboxMode ? SANDBOX_ACTIVE_CRAFT_STAGES : LEGACY_ACTIVE_CRAFT_STAGES;
      if (activeStages.has(stage)) runtime.analytics.track('session_end_mid_craft', { stage });
    },
  };
};
