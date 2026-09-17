#!/usr/bin/env node
// Curated PNG-atlas extraction. Nothing is shipped merely by running this tool.
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(root, 'biba/atlas-map.json'), 'utf8'));
const usage = 'node scripts/extract-ui-atlas.mjs --variant=honey --names=round-undo,wide-blank-button --out=/tmp/squishy-ui [--max-width=1024] [--avif] [--force]';
const options = {};
for (const arg of process.argv.slice(2)) {
  if (arg === '--avif' || arg === '--force') options[arg.slice(2)] = true;
  else {
    const match = /^--([a-z-]+)=(.+)$/.exec(arg);
    if (!match || options[match[1]] !== undefined) throw new Error(`${usage}\nInvalid or repeated argument: ${arg}`);
    options[match[1]] = match[2];
  }
}
if (!options.variant || !Object.hasOwn(manifest.variants, options.variant) || !options.names || !options.out) {
  throw new Error(usage);
}
if (Object.keys(options).some((key) => !['variant', 'names', 'out', 'max-width', 'avif', 'force'].includes(key))) {
  throw new Error(usage);
}
const maxWidth = options['max-width'] === undefined ? 1024 : Number(options['max-width']);
if (!Number.isInteger(maxWidth) || maxWidth < 64 || maxWidth > 4096) throw new Error('max-width must be an integer from 64 to 4096');
const names = [...new Set(options.names.split(',').map((name) => name.trim()))];
if (!names.length || names.some((name) => !Object.hasOwn(manifest.sprites, name))) {
  throw new Error(`Unknown/empty sprite name. See biba/atlas-map.json. Received: ${options.names}`);
}
const out = path.resolve(options.out);
const sourcePath = path.resolve(root, manifest.variants[options.variant]);
const sourceDir = path.resolve(root, 'biba');
if (out === sourceDir || out.startsWith(`${sourceDir}${path.sep}`)) throw new Error('Output must not overwrite source atlas files');
const { width, height } = await sharp(sourcePath).metadata();
if (width !== manifest.sourceSize[0] || height !== manifest.sourceSize[1]) throw new Error('Source atlas dimensions have changed; remap before extracting');
const alpha = await sharp(sourcePath).extractChannel(3).raw().toBuffer();
const actualMaskHash = createHash('sha256').update(alpha).digest('hex');
if (actualMaskHash !== manifest.alphaMaskSHA256) throw new Error('Atlas alpha layout changed; extraction coordinates are not trusted');

// Check every potential destination before writing, including stale AVIF files.
const targets = names.flatMap((name) => [
  path.join(out, `${options.variant}-${name}.webp`),
  path.join(out, `${options.variant}-${name}.avif`),
]);
targets.push(path.join(out, 'export.json'));
if (!options.force) {
  for (const target of targets) {
    try { await access(target); throw new Error(`Output already exists: ${target}. Use --force only after review.`); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
await mkdir(out, { recursive: true });
const exportItems = {};
for (const name of names) {
  const [left, top, cropWidth, cropHeight] = manifest.sprites[name];
  if ([left, top, cropWidth, cropHeight].some((n) => !Number.isInteger(n)) ||
      left < 0 || top < 0 || cropWidth < 1 || cropHeight < 1 ||
      left + cropWidth > width || top + cropHeight > height) {
    throw new Error(`Invalid rectangle for ${name}`);
  }
  // First crop losslessly. WebP and AVIF are both encoded from these PNG pixels,
  // not from one another. Keep a transparent gutter to protect edge antialiasing.
  const cropPng = await sharp(sourcePath).extract({ left, top, width: cropWidth, height: cropHeight }).png().toBuffer();
  const physicalWidth = Math.min(cropWidth, maxWidth);
  const rgba = await sharp(cropPng)
    .resize({ width: physicalWidth, withoutEnlargement: true })
    .extend({ top: 4, bottom: 4, left: 4, right: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toBuffer();
  const webpName = `${options.variant}-${name}.webp`;
  const webpBuffer = await sharp(rgba).webp({ quality: 88, alphaQuality: 100, effort: 5 }).toBuffer();
  await writeFile(path.join(out, webpName), webpBuffer);
  let hasAvifCompanion = false;
  const avifPath = path.join(out, `${options.variant}-${name}.avif`);
  if (options.avif) {
    const avifBuffer = await sharp(rgba).avif({ quality: 65, effort: 4 }).toBuffer();
    const [webpInfo, avifInfo] = await Promise.all([sharp(webpBuffer).metadata(), sharp(avifBuffer).metadata()]);
    if (avifInfo.format !== 'heif' || avifInfo.width !== webpInfo.width ||
        avifInfo.height !== webpInfo.height || !avifInfo.hasAlpha) throw new Error(`Invalid AVIF companion for ${name}`);
    if (avifBuffer.length < webpBuffer.length) {
      await writeFile(avifPath, avifBuffer);
      hasAvifCompanion = true;
    } else if (options.force) await rm(avifPath, { force: true });
  } else if (options.force) await rm(avifPath, { force: true });
  const info = await sharp(webpBuffer).metadata();
  exportItems[name] = {
    fallbackWebp: webpName, hasAvifCompanion, sourceRect: [left, top, cropWidth, cropHeight],
    pixelSize: [info.width, info.height], borderPadding: 4, webpBytes: webpBuffer.length,
    bakedEnglishText: manifest.bakedEnglishText.includes(name),
  };
}
const exportPath = path.join(out, 'export.json');
await writeFile(exportPath, JSON.stringify({ variant: options.variant, sourceAtlas: manifest.variants[options.variant], items: exportItems }, null, 2) + '\n');
console.log(`Extracted ${names.length} sprites from ${options.variant}; see ${exportPath}. These files are for review, not automatically shipped.`);
