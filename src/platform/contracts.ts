import type { AnalyticsAdapter, GameplayActivityCoordinator, StorageAdapter } from '@danilah/mini-games-kit/platform';
import type { Language } from '../i18n';

export interface NativeRewardReceipt { token: string; attempt: string }
export interface SquishyPlatformRuntime {
  kind: 'mock' | 'yandex' | 'android';
  language: Language;
  storage: StorageAdapter;
  analytics: AnalyticsAdapter;
  ads: {
    showRewarded(request: { rewardId: string; context?: string; onReward(): Promise<void> | void }): Promise<{ status: 'closed' | 'error'; rewardEarned: boolean; error?: string }>;
    showInterstitial(): Promise<{ status: 'closed' | 'error' | 'offline'; wasShown: boolean; error?: string }>;
    setStickyBannerVisible(visible: boolean): Promise<{ isShowing: boolean; reason?: string }>;
  };
  activity: GameplayActivityCoordinator;
  capabilities?: { interstitial: boolean; banner: boolean };
  receipts?: {
    pending(): Promise<NativeRewardReceipt | undefined>;
    acknowledge(token: string): Promise<void>;
  };
  markReady(): void;
  destroy(): void;
}
