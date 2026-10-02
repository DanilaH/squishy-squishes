import { preloadToyArt } from '../../sandbox/toyArt';
import type { SandboxAppOptions } from '../../sandbox/SandboxApp';
import { preloadMakerJellyUi } from './jellyUiPreload';
import { preloadStudioEnvironmentAssets } from './studioEnvironmentPreview';

type MakerRendererOptions = Pick<SandboxAppOptions, 'rendererBackend' | 'makePhaserRenderer'>;
type ReviewScope = 'pages' | 'draft' | 'production';

const waitForMakerArt = async (): Promise<void> => {
  // Furniture is part of the normal scene, not progressive decoration. Keep the
  // player on the previous screen while authored Studio art is still loading.
  // A genuine decode/network failure may still fall back to the original Studio
  // rather than trapping the player outside the maker forever.
  await preloadStudioEnvironmentAssets();
  await Promise.all([preloadMakerJellyUi(), preloadToyArt()]);
};

export interface ReviewMakerRendererLoader {
  load(): Promise<MakerRendererOptions>;
  scheduleWarm(): () => void;
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
        waitForMakerArt(),
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

  const scheduleWarm = (): (() => void) => {
    let cancelled = false;
    let timeoutHandle = 0;
    let idleHandle = 0;
    const warm = (): void => {
      timeoutHandle = 0;
      idleHandle = 0;
      if (cancelled) return;
      // Warm only optional maker art. Importing the Phaser module itself during
      // idle can poison the browser module cache if that speculative request
      // fails; the real user click must own the first module import.
      void Promise.all([
        preloadStudioEnvironmentAssets(),
        preloadMakerJellyUi(),
      ]).catch((error: unknown) => {
        console.warn(`[squishy:${scope}] Idle maker-art warmup failed; maker entry will retry assets.`, error);
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
