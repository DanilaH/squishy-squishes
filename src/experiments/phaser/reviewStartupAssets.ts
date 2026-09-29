import { preloadJellyUi } from './jellyUiPreload';
import { preloadReviewVisualProfile } from './reviewVisualProfile';

const STARTUP_ART_BUDGET_MS = 1800;

const delay = (ms: number): Promise<void> => new Promise((resolve) => {
  globalThis.setTimeout(resolve, ms);
});

/**
 * Give first-screen authored art a bounded head start without letting an
 * optional image stall the playable Library indefinitely. Late successful
 * decodes still apply in-place through the shared preload/profile caches.
 */
export const prepareReviewFirstPaint = async (
  root: HTMLElement,
  scope: 'pages' | 'draft',
): Promise<void> => {
  const jelly = preloadJellyUi().then((ready) => {
    if (ready && root.isConnected) root.dataset.jellyUiReady = '';
  });
  const hall = preloadReviewVisualProfile().catch((error: unknown) => {
    console.warn(`[squishy:${scope}] Hall preload failed; the fallback Library can still start.`, error);
  });

  await Promise.race([
    Promise.all([jelly, hall]).then(() => undefined),
    delay(STARTUP_ART_BUDGET_MS),
  ]);
};
