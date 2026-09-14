import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: mode === 'yandex' ? './' : '/squishy-squishes/',
  build: {
    outDir: mode === 'yandex' ? 'dist-yandex' : 'dist',
    sourcemap: false,
  },
  server: {
    host: true,
  },
}));
