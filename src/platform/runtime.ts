import { WebStorageAdapter } from '@danilah/mini-games-kit/platform';
import {
  bootstrapYandexPlatformRuntime,
  createMockPlatformRuntime,
  type PlatformRuntime,
} from '@danilah/mini-games-kit/yandex';
import { normalizeLanguage, type Language } from '../i18n';

export type SquishyPlatformRuntime = PlatformRuntime<Language>;

const shouldUseYandexRuntime = (): boolean => import.meta.env.VITE_PLATFORM === 'yandex';

export const createSquishyPlatformRuntime = async (): Promise<SquishyPlatformRuntime> => {
  if (shouldUseYandexRuntime()) {
    return bootstrapYandexPlatformRuntime({
      normalizeLanguage,
      visibilityBlockReason: 'visibility',
    });
  }

  return createMockPlatformRuntime({
    language: normalizeLanguage(window.navigator.language),
    storage: new WebStorageAdapter(window.localStorage),
    visibilityBlockReason: 'visibility',
  });
};
