import type { CapacitorConfig } from '@capacitor/cli';
const release = process.env.SQUISHY_BUILD_FLAVOR === 'release';
const config: CapacitorConfig = {
  appId: release ? 'com.danilah.squishysquishes' : 'com.danilah.squishysquishes.preview',
  appName: release ? 'Сквиши' : 'Сквиши · тест',
  webDir: 'dist-android',
  backgroundColor: '#f8eaf0',
  server: { androidScheme: 'https' },
  plugins: { SystemBars: { insetsHandling: 'native', initialViewportFitValueHint: 'contain' } },
};
export default config;
