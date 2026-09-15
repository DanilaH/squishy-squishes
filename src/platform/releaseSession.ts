import { ActionInterstitialGate } from '@danilah/mini-games-kit/platform';
import type { SquishyPlatformRuntime } from './runtime';

const LEGACY_ACTIVE_CRAFT_STAGES = new Set(['pour', 'add', 'mix', 'mold', 'reveal', 'test']);
const SANDBOX_ACTIVE_CRAFT_STAGES = new Set(['paint', 'mixins', 'mix', 'finish']);

export interface ReleaseSessionHandle {
  dispose(): void;
}

const selectionParams = (shell: HTMLElement): Readonly<Record<string, string>> => ({
  shape: shell.dataset.shape ?? 'unknown',
  material: shell.dataset.material ?? 'unknown',
});

export const installReleaseSession = (
  root: HTMLDivElement,
  runtime: SquishyPlatformRuntime,
): ReleaseSessionHandle => {
  const shell = root.querySelector<HTMLElement>('.sandbox-shell, .lab-shell');
  if (!shell) throw new Error('Release session requires the mounted game shell.');
  const collection = root.querySelector<HTMLElement>('.collection-overlay');
  const sandbox = shell.classList.contains('sandbox-shell');

  const gate = new ActionInterstitialGate(
    () => performance.now(),
    {
      initialGraceMs: 120_000,
      minIntervalMs: 150_000,
      minActionsBetweenRequests: 3,
    },
  );
  gate.markReady();

  let disposed = false;
  let previousStage = shell.dataset.stage ?? (sandbox ? 'shape' : 'select');
  let collectionOpen = collection ? !collection.hidden : false;
  let completedCrafts = 0;
  let adInFlight = false;

  runtime.analytics.track('session_ready', {
    platform: runtime.kind,
    language: runtime.language,
    mode: sandbox ? 'sandbox' : 'legacy',
  });

  const isNaturalBreak = (): boolean => {
    const stage = shell.dataset.stage ?? '';
    if (sandbox) return stage === 'home';
    return stage === 'select' && !collectionOpen;
  };

  const showInterstitialIfEligible = async (): Promise<void> => {
    if (disposed || runtime.kind !== 'yandex' || adInFlight || !isNaturalBreak()) return;
    if (!gate.recordEligibleAction()) return;

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

  const handleStageChange = (): void => {
    const stage = shell.dataset.stage ?? '';
    if (stage === previousStage) return;

    if (sandbox) {
      if (previousStage === 'shape' && stage === 'paint') {
        runtime.analytics.track('craft_start', selectionParams(shell));
      }
      if (previousStage === 'finish' && stage === 'squeeze') {
        completedCrafts += 1;
        runtime.analytics.track('craft_save', {
          ...selectionParams(shell),
          completedCrafts,
        });
      }
      const returnedHomeAfterPlay = previousStage === 'squeeze' && stage === 'home';
      previousStage = stage;
      if (returnedHomeAfterPlay) void showInterstitialIfEligible();
      return;
    }

    if (stage === 'pour') runtime.analytics.track('craft_start', selectionParams(shell));
    if (stage === 'collect') {
      completedCrafts += 1;
      runtime.analytics.track('craft_collect', {
        ...selectionParams(shell),
        completedCrafts,
      });
    }
    const completedLoopReturnedToSelect = previousStage === 'collect' && stage === 'select';
    previousStage = stage;
    if (completedLoopReturnedToSelect) void showInterstitialIfEligible();
  };

  const stageObserver = new MutationObserver(handleStageChange);
  stageObserver.observe(shell, { attributes: true, attributeFilter: ['data-stage'] });

  let collectionObserver: MutationObserver | null = null;
  if (collection) {
    const handleCollectionChange = (): void => {
      const isOpen = !collection.hidden;
      if (isOpen === collectionOpen) return;
      collectionOpen = isOpen;
      runtime.activity.setGameplayDesired(!isOpen);
      runtime.analytics.track(isOpen ? 'catalog_open' : 'catalog_close');
    };
    collectionObserver = new MutationObserver(handleCollectionChange);
    collectionObserver.observe(collection, { attributes: true, attributeFilter: ['hidden'] });
  }

  const handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const revisit = target.closest<HTMLElement>('[data-revisit-id]')?.dataset.revisitId;
    if (revisit) runtime.analytics.track('recipe_revisit', { recipeId: revisit });

    const make = target.closest<HTMLElement>('[data-make-id]')?.dataset.makeId;
    if (make) runtime.analytics.track('catalog_recipe_start', { recipeId: make });

    const mute = target.closest<HTMLElement>('[data-action="mute"]');
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
      stageObserver.disconnect();
      collectionObserver?.disconnect();
      root.removeEventListener('click', handleClick);
      const stage = shell.dataset.stage ?? '';
      const activeStages = sandbox ? SANDBOX_ACTIVE_CRAFT_STAGES : LEGACY_ACTIVE_CRAFT_STAGES;
      if (activeStages.has(stage)) runtime.analytics.track('session_end_mid_craft', { stage });
    },
  };
};
