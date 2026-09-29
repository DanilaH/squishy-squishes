import type { SandboxAppOptions } from '../../sandbox/SandboxApp';
import { preloadMakerJellyUi } from './jellyUiPreload';
import { preloadStudioEnvironmentAssets } from './studioEnvironmentPreview';

type MakerRendererOptions = Pick<SandboxAppOptions, 'rendererBackend' | 'makePhaserRenderer'>;
type ReviewScope = 'pages' | 'draft';

export interface ReviewMakerRendererLoader {
  load(): Promise<MakerRendererOptions>;
  scheduleWarm(canWarm?: () => boolean): () => void;
}

/**
 * Shared lazy maker boundary for Pages and the isolated Yandex DRAFT.
 * Phaser plus maker-only art stay outside the first Library JS/asset path.
 */
export const createReviewMakerRendererLoader = (scope: ReviewScope): ReviewMakerRendererLoader => {
  let makerRendererPromise: Promise<MakerRendererOptions> | null = null;

  const load = (): Promise<MakerRendererOptions> => {
    if (!makerRendererPromise) {
      makerRendererPromise = Promise.all([
        import('../../sandbox/PhaserSquishSurface'),
        preloadStudioEnvironmentAssets(),
        preloadMakerJellyUi(),
      ])
        .then<MakerRendererOptions>(([{ PhaserSquishSurface }]) => ({
          rendererBackend: 'phaser',
          makePhaserRenderer: (canvas, onMetrics, audio, callbacks) =>
            new PhaserSquishSurface(canvas, onMetrics, audio, callbacks, true),
        }))
        .catch((error: unknown) => {
          // A transient chunk/network failure must not poison future maker opens.
          makerRendererPromise = null;
          throw error;
        });
    }
    return makerRendererPromise;
  };

  const scheduleWarm = (canWarm: () => boolean = () => true): (() => void) => {
    let cancelled = false;
    let timeoutHandle = 0;
    let idleHandle = 0;
    const warm = (): void => {
      timeoutHandle = 0;
      idleHandle = 0;
      if (cancelled || !canWarm()) return;
      void load().catch((error: unknown) => {
        console.warn(`[squishy:${scope}] Idle Phaser warmup failed; maker entry will retry.`, error);
      });
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleHandle = window.requestIdleCallback(warm, { timeout: 1800 });
    } else {
      timeoutHandle = globalThis.setTimeout(warm, 900);
    }

    return () => {
      cancelled = true;
      if (timeoutHandle) globalThis.clearTimeout(timeoutHandle);
      if (idleHandle && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleHandle);
      timeoutHandle = 0;
      idleHandle = 0;
    };
  };

  return { load, scheduleWarm };
};
