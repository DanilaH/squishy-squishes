import { readFileSync, writeFileSync } from 'node:fs';

const path = 'tests/release/release.spec.ts';
let source = readFileSync(path, 'utf8');
const replace = (from, to) => {
  if (!source.includes(from)) throw new Error(`S3 QA fix missing anchor: ${from.slice(0, 120)}`);
  source = source.replace(from, to);
};

replace(
`const readBrowserSave = async (page: Page): Promise<SaveStateV3> =>
  page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3') ?? 'null') as SaveStateV3);`,
`const readBrowserSave = async (page: Page): Promise<SaveStateV3> => {
  const raw = await page.evaluate(() => JSON.parse(localStorage.getItem('squishy.save.v3') ?? 'null') as unknown);
  return decodeSaveStateV3(raw);
};`,
);

replace(
`  await page.locator('[data-action="mix-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'decor');
  await expect(shell).toContainText('5 / 6');

  const paintStrokes = await shell.getAttribute('data-paint-strokes');`,
`  await page.locator('[data-action="mix-continue"]').click();
  await expect(shell).toHaveAttribute('data-stage', 'decor');
  await expect(shell).toContainText('5 / 6');
  const decorBox = await getCanvasBox(page);
  const decorCx = decorBox.x + decorBox.width * 0.5;
  const decorCy = decorBox.y + decorBox.height * 0.5;

  const paintStrokes = await shell.getAttribute('data-paint-strokes');`,
);
replace(
  "  await page.mouse.click(cx - 30, cy + 25);\n  await page.locator('[data-decor-sticker=\"flower\"]').click();\n  await page.mouse.click(cx + 34, cy + 28);",
  "  await page.mouse.click(decorCx - 30, decorCy + 25);\n  await page.locator('[data-decor-sticker=\"flower\"]').click();\n  await page.mouse.click(decorCx + 34, decorCy + 28);",
);
replace(
  "  await page.locator('[data-decor-sticker=\"sparkle\"]').click();\n  await page.mouse.click(cx + 5, cy - 16);",
  "  await page.locator('[data-decor-sticker=\"sparkle\"]').click();\n  await page.mouse.click(decorCx + 5, decorCy - 16);",
);

writeFileSync(path, source);
