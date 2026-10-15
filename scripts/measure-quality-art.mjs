import sharp from 'sharp';
import { readdir, writeFile } from 'node:fs/promises';

// Keep trims and pair roots explicit: the consumer reconstructs the established
// logical geometry instead of allowing transparent margins to change seating.
const directory = new URL('../public/assets/art-quality/', import.meta.url);
const files = await readdir(directory);
const manifest = {};
for (const file of files.filter(file => file.endsWith('.webp')).sort()) {
  const id = file.slice(0, -5);
  const {data, info} = await sharp(new URL(file, directory).pathname).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  const bounds = (maxX = info.width) => {
    let left = maxX, top = info.height, right = -1, bottom = -1;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < maxX; x++) {
      if (data[(y * info.width + x) * 4 + 3] < 16) continue;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    if (right < left) throw new Error(`Empty alpha: ${id}`);
    return [left, top, right - left + 1, bottom - top + 1];
  };
  const asset = {file: id, hasAvif: files.includes(`${id}.avif`), crop: bounds()};
  if (id === 'leaves' || id === 'wings') {
    asset.leftCrop = bounds(Math.floor(info.width / 2));
    const [left, top, width, height] = asset.leftCrop;
    let weightedX = 0, weight = 0;
    for (let y = top + height - 4; y < top + height; y++) for (let x = left; x < left + width; x++) {
      const alpha = data[(y * info.width + x) * 4 + 3];
      if (alpha < 16) continue;
      weightedX += (x - left + .5) * alpha; weight += alpha;
    }
    asset.leftRoot = [Number((weightedX / weight / width).toFixed(5)), 1];
  }
  manifest[id] = asset;
}
await writeFile(new URL('../src/sandbox/qualityArtManifest.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Measured ${Object.keys(manifest).length} authored sprites with persistent logical crops.`);
