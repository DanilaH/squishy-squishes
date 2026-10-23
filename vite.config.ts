import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const platform = env.VITE_PLATFORM ?? 'web';
  const ads = env.VITE_ADS ?? (platform === 'yandex' ? 'yandex-games' : 'mock');
  const analytics = env.VITE_ANALYTICS ?? 'metrica';
  if (!['web', 'mock', 'yandex', 'android'].includes(platform)) throw new Error('Unknown platform');
  if (!['none', 'metrica', 'appmetrica'].includes(analytics)) throw new Error('Unknown analytics provider');
  const allowedAds: Record<string, string[]> = { web: ['mock'], mock: ['mock'], yandex: ['yandex-games'], android: ['yandex-mobile'] };
  if (!allowedAds[platform]?.includes(ads) || (analytics === 'appmetrica' && platform !== 'android') || (platform === 'android' && analytics === 'metrica')) {
    throw new Error('Incompatible platform, advertising and analytics configuration');
  }
  if ((mode === 'android') !== (platform === 'android')) throw new Error('Android requires the dedicated Android build mode');
  const candidate = mode === 'phaser-candidate';
  const phaserYandexDraft = mode === 'phaser-yandex';
  const phaserPagesPreview = mode === 'phaser-pages';
  return {
    base: mode === 'android' || mode === 'yandex' || candidate || phaserYandexDraft || phaserPagesPreview ? './' : '/squishy-squishes/',
    build: {
      // Every upload root must contain only the current build, including new hashed chunks.
      emptyOutDir: true,
      outDir: mode === 'android' ? 'dist-android' : candidate ? 'dist-phaser-candidate' : phaserYandexDraft ? 'dist-phaser-yandex' : phaserPagesPreview ? 'dist-phaser-pages' : mode === 'yandex' ? 'dist-yandex' : 'dist',
      sourcemap: false,
      // Keep all seven modular Studio PNGs as individually inspectable assets on the isolated Pages build.
      ...(phaserPagesPreview ? { assetsInlineLimit: 0 } : {}),
      ...(candidate ? { rollupOptions: { input: ['phaser-candidate.html', 'phaser-parity.html', 'phaser-compositing.html', 'phaser-stage-input.html', 'phaser-studio.html', 'phaser-library.html', 'phaser-platform.html'] } } : {}),
      ...(phaserYandexDraft ? { rollupOptions: { input: ['phaser-yandex.html'] } } : {}),
      ...(phaserPagesPreview ? { rollupOptions: { input: ['phaser-pages.html'] } } : {}),
    },
    server: { host: true },
  };
});
