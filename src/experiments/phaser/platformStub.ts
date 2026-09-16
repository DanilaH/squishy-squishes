import {
  createYandexPlatformRuntime,
  type YandexPlatformSdk,
  type YandexRewardedCallbacks,
} from '@danilah/mini-games-kit/yandex';
import { normalizeLanguage } from '../../i18n';
import type { SquishyPlatformRuntime } from '../../platform/runtime';

export type StubRewardMode = 'closed' | 'grant' | 'duplicate' | 'error' | 'pending';

export interface StubYandexControls {
  readonly events: string[];
  readonly counters: { ready: number; starts: number; stops: number; rewarded: number; interstitials: number };
  setRewardMode(mode: StubRewardMode): void;
  pause(): void;
  resume(): void;
  finishPendingReward(grant: boolean): void;
}

/** Exercises the pinned kit's REAL Yandex runtime/ads adapters, not fake app grants. */
export const createStubYandexRuntime = async (): Promise<{
  runtime: SquishyPlatformRuntime;
  controls: StubYandexControls;
}> => {
  const events: string[] = [];
  const counters = { ready: 0, starts: 0, stops: 0, rewarded: 0, interstitials: 0 };
  const listeners = {
    game_api_pause: new Set<() => void>(),
    game_api_resume: new Set<() => void>(),
  };
  let rewardMode: StubRewardMode = 'closed';
  let pendingReward: YandexRewardedCallbacks | null = null;
  const sdk: YandexPlatformSdk = {
    environment: { i18n: { lang: new URLSearchParams(location.search).get('lang') ?? 'ru' } },
    features: {
      GameplayAPI: {
        start: () => { counters.starts += 1; events.push('gameplay_start'); },
        stop: () => { counters.stops += 1; events.push('gameplay_stop'); },
      },
      LoadingAPI: { ready: () => { counters.ready += 1; events.push('loading_ready'); } },
    },
    on: (event, listener) => { listeners[event].add(listener); },
    off: (event, listener) => { listeners[event].delete(listener); },
    getStorage: async () => sessionStorage,
    getPlayer: async () => { throw new Error('Player Data is not configured for Squishy.'); },
    adv: {
      showFullscreenAdv: ({ callbacks }) => {
        counters.interstitials += 1;
        events.push('interstitial_request');
        callbacks.onOpen?.();
        queueMicrotask(() => callbacks.onClose?.(true));
      },
      showRewardedVideo: ({ callbacks }) => {
        counters.rewarded += 1;
        events.push('reward_request');
        callbacks.onOpen?.();
        if (rewardMode === 'pending') { pendingReward = callbacks; return; }
        queueMicrotask(() => {
          if (rewardMode === 'error') { callbacks.onError?.(new Error('Test ad error')); return; }
          if (rewardMode === 'grant' || rewardMode === 'duplicate') callbacks.onRewarded?.();
          if (rewardMode === 'duplicate') callbacks.onRewarded?.();
          callbacks.onClose?.();
        });
      },
      showBannerAdv: async () => ({}),
      hideBannerAdv: async () => ({ stickyAdvIsShowing: false }),
      getBannerAdvStatus: async () => ({ stickyAdvIsShowing: false }),
    },
  };

  const runtime = await createYandexPlatformRuntime(sdk, {
    normalizeLanguage,
    analytics: { track: (event, params) => events.push(`analytics:${event}:${JSON.stringify(params ?? {})}`) },
    visibilityBlockReason: 'visibility',
  });
  const controls: StubYandexControls = {
    events,
    counters,
    setRewardMode: (mode) => { rewardMode = mode; },
    pause: () => { events.push('sdk_pause'); for (const listener of listeners.game_api_pause) listener(); },
    resume: () => { events.push('sdk_resume'); for (const listener of listeners.game_api_resume) listener(); },
    finishPendingReward: (grant) => {
      const callbacks = pendingReward;
      pendingReward = null;
      if (!callbacks) throw new Error('No pending rewarded video.');
      if (grant) callbacks.onRewarded?.();
      callbacks.onClose?.();
    },
  };
  return { runtime, controls };
};
