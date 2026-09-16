#!/usr/bin/env node
import { access, mkdir, readFile, rm, stat } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import {
  buildAvifCompanions,
  prepareImageAssetFile,
  validateAvifCompanions,
} from '@danilah/mini-games-kit/assets';

const usage = 'Usage: npm run asset:prepare -- <source.png> <public/assets/name.webp> [--canvas=256] [--padding=24] [--webp-quality=88] [--avif-quality=65] [--background=auto|preserve|deterministic] [--webp-only] [--force]';

const options = {
  canvas: 256,
  padding: 24,
  webpQuality: 88,
  avifQuality: 65,
  backgroundRemoval: 'auto',
  webpOnly: false,
  force: false,
};

const positional = [];
for (const arg of process.argv.slice(2)) {
  if (arg === '--force') options.force = true;
  else if (arg === '--webp-only') options.webpOnly = true;
  else if (arg.startsWith('--')) {
    const match = /^--(canvas|padding|webp-quality|avif-quality|background)=(.+)$/.exec(arg);
    if (!match) throw new Error(`${usage}\nUnknown option: ${arg}`);
    const [, key, value] = match;
    if (key === 'background') {
      if (!['auto', 'preserve', 'deterministic'].includes(value)) throw new Error(`Invalid background mode: ${value}`);
      options.backgroundRemoval = value;
    } else {
      if (!/^\d+$/.test(value)) throw new Error(`Invalid integer for ${key}: ${value}`);
      const number = Number(value);
      if (!Number.isSafeInteger(number)) throw new Error(`Invalid integer for ${key}: ${value}`);
      if (key === 'canvas') options.canvas = number;
      if (key === 'padding') options.padding = number;
      if (key === 'webp-quality') options.webpQuality = number;
      if (key === 'avif-quality') options.avifQuality = number;
    }
  } else positional.push(arg);
}

if (positional.length !== 2) throw new Error(usage);
if (options.canvas < 32 || options.canvas > 2048 || options.padding < 8 || options.padding * 2 >= options.canvas) {
  throw new Error('Canvas must be 32–2048px; padding must be >=8px and smaller than half the canvas.');
}
if (options.webpQuality < 1 || options.webpQuality > 100 || options.avifQuality < 1 || options.avifQuality > 100) {
  throw new Error('Codec quality must be between 1 and 100.');
}

const [inputArgument, outputArgument] = positional;
const input = resolve(inputArgument);
const output = resolve(outputArgument);
if (input === output || extname(output).toLowerCase() !== '.webp') {
  throw new Error('Source and destination must differ; output must have a .webp extension.');
}
const avifOutput = output.replace(/\.webp$/i, '.avif');
await access(input);
if (!options.force) {
  for (const candidate of options.webpOnly ? [output] : [output, avifOutput]) {
    try {
      await access(candidate);
      throw new Error(`Output already exists: ${candidate}. Pass --force only after reviewing the source.`);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
}

await mkdir(dirname(output), { recursive: true });
const prepared = await prepareImageAssetFile(input, output, {
  canvas: options.canvas,
  padding: options.padding,
  webpQuality: options.webpQuality,
  backgroundRemoval: options.backgroundRemoval,
}, { minTransparentPadding: Math.max(4, Math.floor(options.padding / 2)) });

let avifBytes = null;
if (!options.webpOnly) {
  // We currently encode the AVIF companion from canonical WebP. Retain the original
  // source so both formats can be regenerated from a lossless master when needed.
  const pair = [{ id: output, input: output, output: avifOutput, category: 'authored-art' }];
  await buildAvifCompanions(pair, { quality: options.avifQuality, concurrency: 1 });
  const checked = await validateAvifCompanions(pair);
  if (checked.errors.length) {
    await rm(avifOutput, { force: true });
    throw new Error(`AVIF validation failed: ${checked.errors.join('; ')}`);
  }
  avifBytes = (await stat(avifOutput)).size;
  if (avifBytes >= prepared.validation.bytes) {
    await rm(avifOutput, { force: true });
    avifBytes = null;
  }
}

console.log(JSON.stringify({
  input,
  webp: output,
  avif: avifBytes === null ? null : avifOutput,
  backgroundMethod: prepared.backgroundMethod,
  webpBytes: prepared.validation.bytes,
  avifBytes,
  warnings: prepared.validation.warnings,
}, null, 2));
