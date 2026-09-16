import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const candidate = mode === 'phaser-candidate';
  const phaserYandexDraft = mode === 'phaser-yandex';
  return {
    base: mode === 'yandex' || candidate || phaserYandexDraft ? './' : '/squishy-squishes/',
    build: {
      outDir: candidate ? 'dist-phaser-candidate' : phaserYandexDraft ? 'dist-phaser-yandex' : mode === 'yandex' ? 'dist-yandex' : 'dist',
      sourcemap: false,
      ...(candidate ? { rollupOptions: { input: ['phaser-candidate.html', 'phaser-parity.html', 'phaser-compositing.html', 'phaser-stage-input.html', 'phaser-studio.html', 'phaser-library.html', 'phaser-platform.html'] } } : {}),
      ...(phaserYandexDraft ? { rollupOptions: { input: ['phaser-yandex.html'] } } : {}),
    },
    server: { host: true },
  };
});
