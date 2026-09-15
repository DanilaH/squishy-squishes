import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const inputDir = 'artifacts/s4-visual';
const outputDir = path.join(inputDir, 'review');
fs.mkdirSync(outputDir, { recursive: true });

const files = fs.readdirSync(inputDir).filter((name) => name.endsWith('.png')).sort();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

for (const name of files) {
  const png = fs.readFileSync(path.join(inputDir, name)).toString('base64');
  const maxWidth = name.startsWith('06-') ? 360 : name.startsWith('05-') ? 320 : 180;
  const encoded = await page.evaluate(async ({ data, maxWidth }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const scale = Math.min(1, maxWidth / image.naturalWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Missing 2D context');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.25).split(',')[1];
  }, { data: png, maxWidth });
  if (!encoded) throw new Error(`Failed to encode ${name}`);
  const wrapped = encoded.match(/.{1,76}/g)?.join('\n') ?? encoded;
  fs.writeFileSync(path.join(outputDir, name.replace(/\.png$/, '.b64')), `${wrapped}\n`);
}

await browser.close();
console.log(`Prepared ${files.length} compact S4 visual review thumbnails.`);
