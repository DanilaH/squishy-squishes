import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const inputDir = 'artifacts/s4-visual';
const outputDir = path.join(inputDir, 'review');
fs.mkdirSync(outputDir, { recursive: true });

const files = fs.readdirSync(inputDir).filter((name) => name.endsWith('.png')).sort();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const readBase64 = (name) => fs.readFileSync(path.join(inputDir, name)).toString('base64');
const writeWrapped = (name, encoded) => {
  const wrapped = encoded.match(/.{1,76}/g)?.join('\n') ?? encoded;
  fs.writeFileSync(path.join(outputDir, name), `${wrapped}\n`);
};

for (const name of files) {
  const png = readBase64(name);
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
  writeWrapped(name.replace(/\.png$/, '.b64'), encoded);
}

const makeContact = async (entries, columns, cellWidth, quality) => {
  const payload = entries.map(({ name, label }) => ({ name, label, data: readBase64(name) }));
  return page.evaluate(async ({ payload, columns, cellWidth, quality }) => {
    const images = await Promise.all(payload.map(async (entry) => {
      const image = new Image();
      image.src = `data:image/png;base64,${entry.data}`;
      await image.decode();
      const scale = cellWidth / image.naturalWidth;
      return {
        image,
        label: entry.label,
        width: cellWidth,
        height: Math.round(image.naturalHeight * scale),
      };
    }));
    const rows = Math.ceil(images.length / columns);
    const labelHeight = 18;
    const gap = 6;
    const rowHeights = Array.from({ length: rows }, (_, row) => {
      const rowImages = images.slice(row * columns, row * columns + columns);
      return Math.max(...rowImages.map((item) => item.height + labelHeight));
    });
    const canvas = document.createElement('canvas');
    canvas.width = columns * cellWidth + (columns - 1) * gap;
    canvas.height = rowHeights.reduce((sum, value) => sum + value, 0) + (rows - 1) * gap;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Missing contact-sheet 2D context');
    context.fillStyle = '#f4f1f7';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'bold 11px sans-serif';
    context.fillStyle = '#2f2740';
    let y = 0;
    for (let row = 0; row < rows; row += 1) {
      const rowImages = images.slice(row * columns, row * columns + columns);
      rowImages.forEach((item, col) => {
        const x = col * (cellWidth + gap);
        context.fillText(item.label, x + 3, y + 12);
        context.drawImage(item.image, x, y + labelHeight, item.width, item.height);
      });
      y += rowHeights[row] + (row < rows - 1 ? gap : 0);
    }
    return canvas.toDataURL('image/jpeg', quality).split(',')[1];
  }, { payload, columns, cellWidth, quality });
};

const phoneContact = await makeContact([
  { name: '01-phone-library.png', label: '01 Library' },
  { name: '02-phone-ideas-progress.png', label: '02 Ideas' },
  { name: '03-phone-idea-maker.png', label: '03 Maker' },
  { name: '04-phone-complete-squeeze.png', label: '04 Complete' },
], 2, 140, 0.22);
writeWrapped('contact-phone.b64', phoneContact);

const responsiveContact = await makeContact([
  { name: '05-landscape-ideas.png', label: '05 Landscape' },
  { name: '06-desktop-ideas.png', label: '06 Desktop' },
], 1, 300, 0.22);
writeWrapped('contact-responsive.b64', responsiveContact);

await browser.close();
console.log(`Prepared ${files.length} thumbnails + 2 S4 visual contact sheets.`);
