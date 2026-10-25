import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const source = resolve('assets-src/app-icon/dumpling.webp');
const res = resolve(process.argv[2] ?? 'android/app/src/main/res');
for (const [density, size] of Object.entries({mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192})) {
  const dir = `${res}/mipmap-${density}`;
  mkdirSync(dir, {recursive:true});
  await sharp(source).resize(size,size).png().toFile(`${dir}/ic_launcher.png`);
  await sharp(source).resize(size,size).composite([{input:Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/></svg>`),blend:'dest-in'}]).png().toFile(`${dir}/ic_launcher_round.png`);
}
mkdirSync(`${res}/drawable-nodpi`, {recursive:true});
await sharp(source).resize(512,512).png().toFile(`${res}/drawable-nodpi/squishy_icon.png`);
mkdirSync(`${res}/drawable`, {recursive:true});
// Adaptive layers are 108dp; launchers expose the central 72dp. Keep the
// complete approved artwork inside that viewport instead of zooming its face.
writeFileSync(`${res}/drawable/squishy_icon_foreground.xml`, `<?xml version="1.0" encoding="utf-8"?>
<inset xmlns:android="http://schemas.android.com/apk/res/android" android:inset="16.6667%" android:drawable="@drawable/squishy_icon" />\n`);
mkdirSync(`${res}/mipmap-anydpi-v26`, {recursive:true});
for (const name of ['ic_launcher','ic_launcher_round']) writeFileSync(`${res}/mipmap-anydpi-v26/${name}.xml`, `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/squishy_icon_background" />
  <foreground android:drawable="@drawable/squishy_icon_foreground" />
</adaptive-icon>\n`);
mkdirSync(`${res}/values`, {recursive:true});
writeFileSync(`${res}/values/squishy-icon.xml`, '<resources><color name="squishy_icon_background">#00c9e8</color></resources>\n');
console.log('Dumpling launcher icons generated for all Android densities.');
