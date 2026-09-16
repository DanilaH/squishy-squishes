import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const candidate = mode === 'phaser-candidate';
  return {
    base: mode === 'yandex' || candidate ? './' : '/squishy-squishes/',
    build: {
      outDir: candidate ? 'dist-phaser-candidate' : mode === 'yandex' ? 'dist-yandex' : 'dist',
      sourcemap: false,
      ...(candidate ? { rollupOptions: { input: ['phaser-candidate.html', 'phaser-parity.html', 'phaser-compositing.html', 'phaser-stage-input.html', 'phaser-studio.html'] } } : {}),
    },
    server: { host: true },
  };
});
