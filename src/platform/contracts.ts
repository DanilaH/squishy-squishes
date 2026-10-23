import type { AnalyticsAdapter, GameplayActivityCoordinator, StorageAdapter } from '@danilah/mini-games-kit/platform';
import type { AdsAdapter, RewardedRequest, RewardedResult } from '@danilah/mini-games-kit/yandex';
import type { Language } from '../i18n';

export interface NativeRewardReceipt { token: string; attempt: string }
export interface SquishyPlatformRuntime {
  kind: 'mock' | 'yandex' | 'android';
  language: Language;
  storage: StorageAdapter;
  analytics: AnalyticsAdapter;
  ads: Omit<AdsAdapter, 'showRewarded'> & {
    showRewarded(request: RewardedRequest & { context?: string }): Promise<RewardedResult>;
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
