import { ConsoleAnalyticsAdapter, WebStorageAdapter, type AnalyticsAdapter } from '@danilah/mini-games-kit/platform';
import {
  MetricaAnalyticsAdapter,
  bootstrapYandexPlatformRuntime,
  createMockPlatformRuntime,
  installYandexMetricaTag,
  type PlatformRuntime,
} from '@danilah/mini-games-kit/yandex';
import { normalizeLanguage, type Language } from '../i18n';

export type SquishyPlatformRuntime = PlatformRuntime<Language>;

const shouldUseYandexRuntime = (): boolean => import.meta.env.VITE_PLATFORM === 'yandex';

const createAnalytics = (): AnalyticsAdapter => {
  const fallback = new ConsoleAnalyticsAdapter(import.meta.env.DEV || import.meta.env.VITE_ANALYTICS_DEBUG === '1');
  const rawCounterId = import.meta.env.VITE_METRICA_COUNTER_ID;
  if (!rawCounterId) return fallback;
  const counterId = Number(rawCounterId);
  if (!Number.isSafeInteger(counterId) || counterId <= 0) return fallback;
  try {
    installYandexMetricaTag(counterId);
    return new MetricaAnalyticsAdapter(counterId, fallback);
  } catch (error: unknown) {
    console.error('[squishy:analytics-init]', error);
    return fallback;
  }
};

export const createSquishyPlatformRuntime = async (): Promise<SquishyPlatformRuntime> => {
  const analytics = createAnalytics();
  if (shouldUseYandexRuntime()) {
    return bootstrapYandexPlatformRuntime({
      analytics,
      normalizeLanguage,
      visibilityBlockReason: 'visibility',
    });
  }

  return createMockPlatformRuntime({
    analytics,
    language: normalizeLanguage(window.navigator.language),
    storage: new WebStorageAdapter(window.localStorage),
    visibilityBlockReason: 'visibility',
  });
};
