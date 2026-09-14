import { readFileSync, writeFileSync } from 'node:fs';

const replaceOnce = (source, needle, replacement, label) => {
  const first = source.indexOf(needle);
  if (first < 0) throw new Error(`${label}: anchor missing`);
  if (source.indexOf(needle, first + needle.length) >= 0) throw new Error(`${label}: anchor is not unique`);
  return source.replace(needle, replacement);
};

{
  const path = 'src/main.ts';
  let source = readFileSync(path, 'utf8');
  const needle = "import './interaction-pass-03.css';\n";
  source = replaceOnce(source, needle, `${needle}import './release.css';\n`, 'main release css');
  writeFileSync(path, source);
}

{
  const path = 'src/app/bootstrap.ts';
  let source = readFileSync(path, 'utf8');
  source = replaceOnce(source, "import { installPhoneQaPanel } from '../debug/installPhoneQaPanel';\n", '', 'remove static QA import');
  source = replaceOnce(
    source,
    "import { getGameCopy } from '../i18n';\n",
    "import { getGameCopy } from '../i18n';\nimport { installReleaseSession } from '../platform/releaseSession';\n",
    'release session import',
  );
  source = replaceOnce(
    source,
    "  const runtime = await createSquishyPlatformRuntime();\n",
    "  const runtime = await createSquishyPlatformRuntime();\n  document.body.dataset.releasePlatform = runtime.kind;\n  document.body.dataset.releaseBuild = import.meta.env.PROD ? 'production' : 'development';\n",
    'release body state',
  );

  const qaStart = "  const removePhoneQaPanel = installPhoneQaPanel({";
  const qaEnd = "\n\n  const unsubscribeActivity";
  const start = source.indexOf(qaStart);
  const end = source.indexOf(qaEnd, start);
  if (start < 0 || end < 0) throw new Error('QA block anchors missing');
  const originalQaBlock = source.slice(start, end);
  const wrappedQaBlock = originalQaBlock
    .replace(
      qaStart,
      "  let removePhoneQaPanel = (): void => undefined;\n  if (import.meta.env.VITE_PLATFORM !== 'yandex' || import.meta.env.VITE_ENABLE_QA === '1') {\n    const { installPhoneQaPanel } = await import('../debug/installPhoneQaPanel');\n    removePhoneQaPanel = installPhoneQaPanel({",
    )
    .replace(/\n  \}\);$/, '\n    });\n  }');
  source = `${source.slice(0, start)}${wrappedQaBlock}${source.slice(end)}`;

  source = replaceOnce(
    source,
    "\n\n  const unsubscribeActivity",
    "\n\n  const releaseSession = installReleaseSession(root, runtime);\n  const unsubscribeActivity",
    'install release session',
  );
  source = replaceOnce(
    source,
    "      unsubscribeActivity();\n      removePhoneQaPanel();",
    "      unsubscribeActivity();\n      releaseSession.dispose();\n      removePhoneQaPanel();",
    'dispose release session',
  );
  writeFileSync(path, source);
}

{
  const path = 'src/platform/runtime.ts';
  let source = readFileSync(path, 'utf8');
  source = replaceOnce(
    source,
    "import { WebStorageAdapter } from '@danilah/mini-games-kit/platform';",
    "import { ConsoleAnalyticsAdapter, WebStorageAdapter, type AnalyticsAdapter } from '@danilah/mini-games-kit/platform';",
    'analytics platform imports',
  );
  source = replaceOnce(
    source,
    "  bootstrapYandexPlatformRuntime,\n  createMockPlatformRuntime,",
    "  MetricaAnalyticsAdapter,\n  bootstrapYandexPlatformRuntime,\n  createMockPlatformRuntime,\n  installYandexMetricaTag,",
    'analytics yandex imports',
  );
  source = replaceOnce(
    source,
    "const shouldUseYandexRuntime = (): boolean => import.meta.env.VITE_PLATFORM === 'yandex';\n",
    `const shouldUseYandexRuntime = (): boolean => import.meta.env.VITE_PLATFORM === 'yandex';\n\nconst createAnalytics = (): AnalyticsAdapter => {\n  const fallback = new ConsoleAnalyticsAdapter(import.meta.env.DEV || import.meta.env.VITE_ANALYTICS_DEBUG === '1');\n  const rawCounterId = import.meta.env.VITE_METRICA_COUNTER_ID;\n  if (!rawCounterId) return fallback;\n  const counterId = Number(rawCounterId);\n  if (!Number.isSafeInteger(counterId) || counterId <= 0) return fallback;\n  try {\n    installYandexMetricaTag(counterId);\n    return new MetricaAnalyticsAdapter(counterId, fallback);\n  } catch (error: unknown) {\n    console.error('[squishy:analytics-init]', error);\n    return fallback;\n  }\n};\n`,
    'analytics factory',
  );
  source = replaceOnce(
    source,
    "export const createSquishyPlatformRuntime = async (): Promise<SquishyPlatformRuntime> => {\n",
    "export const createSquishyPlatformRuntime = async (): Promise<SquishyPlatformRuntime> => {\n  const analytics = createAnalytics();\n",
    'analytics runtime',
  );
  source = replaceOnce(source, "    return bootstrapYandexPlatformRuntime({\n", "    return bootstrapYandexPlatformRuntime({\n      analytics,\n", 'yandex analytics');
  source = replaceOnce(source, "  return createMockPlatformRuntime({\n", "  return createMockPlatformRuntime({\n    analytics,\n", 'mock analytics');
  writeFileSync(path, source);
}

{
  const path = 'vite.config.ts';
  writeFileSync(path, `import { defineConfig } from 'vite';\n\nexport default defineConfig(({ mode }) => ({\n  base: mode === 'yandex' ? './' : '/squishy-squishes/',\n  build: {\n    outDir: mode === 'yandex' ? 'dist-yandex' : 'dist',\n    sourcemap: false,\n  },\n  server: {\n    host: true,\n  },\n}));\n`);
}

{
  const path = 'package.json';
  const pkg = JSON.parse(readFileSync(path, 'utf8'));
  pkg.scripts['build:yandex'] = 'tsc --noEmit && vite build --mode yandex';
  pkg.scripts['verify:yandex'] = 'node scripts/verify-yandex-dist.mjs';
  pkg.scripts['release:check'] = 'npm run typecheck && npm run build && npm run build:yandex && npm run verify:yandex';
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
}
