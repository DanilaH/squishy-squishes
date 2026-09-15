import fs from 'node:fs';

for (const path of ['tests/release/s4-ideas.spec.ts', 'tests/release/s4-visual.spec.ts']) {
  let content = fs.readFileSync(path, 'utf8');
  const from = "page.locator('[data-material=\"soft\"]')";
  const to = "page.locator('.sandbox-material[data-material=\"soft\"]')";
  if (!content.includes(from)) throw new Error(`Missing material locator in ${path}`);
  content = content.replaceAll(from, to);
  fs.writeFileSync(path, content);
}
console.log('Sandbox S4 test locators fixed.');
