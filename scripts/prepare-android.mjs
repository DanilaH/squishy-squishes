import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { loadEnv } from 'vite';
const analyticsEnabled = loadEnv('android', process.cwd(), 'VITE_').VITE_ANALYTICS !== 'none';
const release = process.env.SQUISHY_BUILD_FLAVOR === 'release';
const appId = release ? 'com.danilah.squishysquishes' : 'com.danilah.squishysquishes.preview';
const names = ['APPMETRICA_API_KEY', 'YANDEX_BANNER_AD_UNIT_ID', 'YANDEX_INTERSTITIAL_AD_UNIT_ID', 'YANDEX_REWARDED_AD_UNIT_ID'];
const values = Object.fromEntries(names.map(name => [name, (process.env[name] ?? '').trim()]));
const live = process.env.ADS_MODE === 'live';
if (release && (!live || names.some(name => !values[name]))) throw new Error('Release requires ADS_MODE=live and all four mobile configuration values');
if (!release && live) throw new Error('Preview builds use demo ads; live ads require the release flavor');
for (const name of names) {
  if (values[name] && !(name === 'APPMETRICA_API_KEY' ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i : /^R-M-\d+-\d+$/).test(values[name])) throw new Error(`Invalid format: ${name}`);
}
// Reuse only a generated project with the same identity. Never silently turn a
// preview install into a production app with another save/signing identity.
if (!existsSync('android')) execFileSync('npx', ['cap', 'add', 'android'], { stdio: 'inherit' });
let gradle = readFileSync('android/app/build.gradle', 'utf8');
if (!gradle.includes(`applicationId "${appId}"`)) throw new Error('Android directory belongs to another flavor; use a clean checkout');
const versionCode = Number(process.env.ANDROID_VERSION_CODE ?? 1);
if (!Number.isSafeInteger(versionCode) || versionCode < 1) throw new Error('Invalid ANDROID_VERSION_CODE');
gradle = gradle.replace(/versionCode \d+/, `versionCode ${versionCode}`).replace(/versionName "[^"]+"/, 'versionName "0.1.0"');
if (!gradle.includes('// squishy SDKs')) gradle += `\n// squishy SDKs\ndependencies {\n implementation 'com.yandex.android:mobileads:8.5.0'\n implementation 'io.appmetrica.analytics:analytics:8.6.0'\n}\n`;
gradle = gradle.replace('minifyEnabled false', 'minifyEnabled true\n            shrinkResources true').replace('proguard-android.txt', 'proguard-android-optimize.txt');
writeFileSync('android/app/build.gradle', gradle);
const java = `android/app/src/main/java/${appId.replaceAll('.', '/')}`;
mkdirSync(java, { recursive: true });
for (const name of ['MainActivity', 'SquishyApplication', 'SquishyServicesPlugin', 'DurableStore']) {
  writeFileSync(`${java}/${name}.java`, readFileSync(`native/android/${name}.java`, 'utf8').replaceAll('package com.danilah.squishysquishes.preview;', `package ${appId};`));
}
copyFileSync('native/android/proguard-rules.pro', 'android/app/proguard-rules.pro');
const xml = names.map(name => {
  const resource = { APPMETRICA_API_KEY: 'appmetrica_api_key', YANDEX_BANNER_AD_UNIT_ID: 'yandex_banner_id', YANDEX_INTERSTITIAL_AD_UNIT_ID: 'yandex_interstitial_id', YANDEX_REWARDED_AD_UNIT_ID: 'yandex_rewarded_id' }[name];
  // Test analytics must use a separate project key, supplied explicitly.
  const value = name === 'APPMETRICA_API_KEY' ? (analyticsEnabled ? (release ? values[name] : process.env.APPMETRICA_TEST_API_KEY ?? '') : '') : live ? values[name] : `demo-${name.split('_')[1].toLowerCase()}-yandex`;
  if (!/^[a-zA-Z0-9-]*$/.test(value)) throw new Error(`Invalid ${name} configuration`);
  return `<string name="${resource}" translatable="false">${value}</string>`;
}).join('\n');
writeFileSync('android/app/src/main/res/values/squishy-services.xml', `<resources>\n${xml}\n<bool name="ads_test_mode">${!live}</bool>\n</resources>\n`);
const manifestPath = 'android/app/src/main/AndroidManifest.xml';
let manifest = readFileSync(manifestPath, 'utf8');
if (!manifest.includes('.SquishyApplication')) manifest = manifest.replace('<application', '<application android:name=".SquishyApplication" android:usesCleartextTraffic="false"');
manifest = manifest.replace('android:allowBackup="true"', 'android:allowBackup="false"');
if (!manifest.includes('AUTOMATIC_SDK_INITIALIZATION')) manifest = manifest.replace('</application>', '<meta-data android:name="com.yandex.mobile.ads.AUTOMATIC_SDK_INITIALIZATION" android:value="false" /></application>');
writeFileSync(manifestPath, manifest);
execFileSync('npx', ['cap', 'sync', 'android'], { stdio: 'inherit' });
console.log(`Android ${release ? 'release' : 'preview'} prepared; ${live ? 'live' : 'demo'} ads. Configuration values are not logged.`);
