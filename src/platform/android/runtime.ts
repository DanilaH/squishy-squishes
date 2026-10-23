import './layout.css';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { GameplayActivityCoordinator, installDocumentVisibilityBlocker } from '@danilah/mini-games-kit/platform';
import { normalizeLanguage } from '../../i18n';
import type { SquishyPlatformRuntime } from '../contracts';
import { handleAndroidBack } from './back';
import { nativeBridge as bridge } from './bridge';

export async function createAndroidRuntime(): Promise<SquishyPlatformRuntime> {
  if (Capacitor.getPlatform() !== 'android') throw new Error('Android build requires its native host');
  const activity = new GameplayActivityCoordinator(() => undefined, () => undefined);
  const removeVisibility = installDocumentVisibilityBlocker(activity, 'visibility');
  const listeners: { remove(): Promise<void> }[] = [];
  let disposed = false;
  let fullscreen = false;
  const analytics = {
    track(name: string, data: Readonly<Record<string, unknown>> = {}) {
      if (disposed || import.meta.env.VITE_ANALYTICS === 'none') return;
      void bridge.report({ name, data }).catch(error => console.error('[appmetrica]', error));
    },
  };
  try {
    listeners.push(await App.addListener('appStateChange', ({ isActive }) => {
      activity.setBlocked('native-background', !isActive);
      if (isActive) void bridge.preload().catch(() => undefined);
    }));
    activity.setBlocked('native-background', !(await App.getState()).isActive);
    listeners.push(await App.addListener('backButton', () => {
      if (fullscreen || activity.isBlocked()) return;
      if (!handleAndroidBack()) void App.minimizeApp().catch(error => console.error('[android:back]', error));
    }));
    const config = await bridge.initialize();
    const show = async (kind: 'interstitial' | 'rewarded', attempt?: string) => {
      if (disposed || fullscreen) return { status: 'unavailable' };
      fullscreen = true;
      activity.setBlocked('native-ad', true);
      try { return await bridge.show({ kind, ...(attempt === undefined ? {} : { attempt }) }); }
      finally { fullscreen = false; activity.setBlocked('native-ad', false); }
    };
    return {
      kind: 'android', language: normalizeLanguage(navigator.language), analytics, activity,
      capabilities: { interstitial: config.enabled, banner: config.enabled },
      storage: {
        getItem: async key => (await bridge.storageGet({ key })).value,
        setItem: (key, value) => bridge.storageSet({ key, value }),
        removeItem: key => bridge.storageRemove({ key }),
      },
      receipts: {
        pending: async () => (await bridge.pending()).reward,
        acknowledge: token => bridge.acknowledge({ token }),
      },
      ads: {
        async showInterstitial() {
          const result = await show('interstitial');
          return { status: result.status === 'closed' ? 'closed' : 'error', wasShown: result.shown === true };
        },
        async showRewarded(request) {
          if (!request.context) throw new Error('Missing durable reward intent');
          const result = await show('rewarded', request.context);
          if (result.reward) {
            // A different pending intent must be recovered by bootstrap, never
            // credited to the currently clicked offer.
            if (result.reward.attempt !== request.context) throw new Error('Pending reward requires recovery');
            await request.onReward();
            await bridge.acknowledge({ token: result.reward.token });
          }
          return { status: result.status === 'closed' ? 'closed' : 'error', rewardEarned: !!result.reward };
        },
        async setStickyBannerVisible(visible) {
          await bridge.banner({ visible: visible && !disposed });
          return { isShowing: false, reason: 'native-managed' };
        },
      },
      markReady() { void bridge.preload().catch(() => undefined); },
      destroy() {
        if (disposed) return;
        disposed = true;
        removeVisibility();
        for (const listener of listeners) void listener.remove().catch(() => undefined);
        void bridge.banner({ visible: false }).catch(() => undefined);
      },
    };
  } catch (error) {
    removeVisibility();
    for (const listener of listeners) await listener.remove();
    throw error;
  }
}
