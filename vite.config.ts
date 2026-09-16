import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const spike = mode === 'phaser-spike';
  return {
    base: mode === 'yandex' || spike ? './' : '/squishy-squishes/',
    build: {
      outDir: spike ? 'dist-phaser-spike' : mode === 'yandex' ? 'dist-yandex' : 'dist',
      sourcemap: false,
      ...(spike ? { rollupOptions: { input: 'phaser-spike.html' } } : {}),
    },
    server: { host: true },
  };
});
