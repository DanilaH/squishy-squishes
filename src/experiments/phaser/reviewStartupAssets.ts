import { preloadJellyUi } from './jellyUiPreload';
import { preloadReviewVisualProfile } from './reviewVisualProfile';

const STARTUP_ART_BUDGET_MS = 1800;

/**
 * Give first-screen authored art a bounded head start without letting an
 * optional image stall the playable Library indefinitely. Late successful
 * decodes still apply in-place through the shared preload/profile caches.
 */
export const prepareReviewFirstPaint = async (
  root: HTMLElement,
  scope: 'pages' | 'draft',
): Promise<void> => {
  const markJellyReady = (ready: boolean): void => {
    if (ready && root.isConnected) root.dataset.jellyUiReady = '';
  };
  const jelly = preloadJellyUi().then((ready) => {
    markJellyReady(ready);
    if (!ready) {
      // Retry outside the startup budget: the Library is already playable with
      // native/CSS controls, so recovery must never delay first interaction.
      globalThis.setTimeout(() => {
        if (!root.isConnected || root.dataset.jellyUiReady === '') return;
        void preloadJellyUi().then(markJellyReady);
      }, 900);
    }
  });
  const hall = preloadReviewVisualProfile().catch((error: unknown) => {
    console.warn(`[squishy:${scope}] Hall preload failed; the fallback Library can still start.`, error);
  });

  let budgetTimer = 0;
  const budget = new Promise<void>((resolve) => {
    budgetTimer = globalThis.setTimeout(() => {
      budgetTimer = 0;
      resolve();
    }, STARTUP_ART_BUDGET_MS);
  });
  try {
    await Promise.race([
      Promise.all([jelly, hall]).then(() => undefined),
      budget,
    ]);
  } finally {
    if (budgetTimer) globalThis.clearTimeout(budgetTimer);
  }
};
