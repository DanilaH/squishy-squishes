import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/sandbox/SandboxLibraryApp.ts';
let app = readFileSync(appPath, 'utf8');
const anchor = "const RU_SHAPES: Readonly<Record<SavedSquishy['shapeId'], string>> = {";
const helper = `const escapeAttribute = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

`;
if (!app.includes('const escapeAttribute = ')) {
  if (!app.includes(anchor)) throw new Error('Library escape anchor missing.');
  app = app.replace(anchor, helper + anchor);
}
app = app.replaceAll('${toy.id}', '${escapeAttribute(toy.id)}');
writeFileSync(appPath, app);

const cssPath = 'src/sandbox-library.css';
let css = readFileSync(cssPath, 'utf8');
const landscapePatch = `

@media (max-height: 520px) and (orientation: landscape) {
  .sandbox-library-empty {
    width: min(100%, 760px);
    margin: 0 auto;
    display: grid;
    grid-template-columns: 140px minmax(0, 1fr);
    grid-template-areas:
      "toy title"
      "toy hint"
      "toy action";
    column-gap: 18px;
    align-items: center;
    text-align: left;
  }
  .sandbox-library-empty__toy { grid-area: toy; width: 130px; margin: 0; font-size: 40px; }
  .sandbox-library-empty h2 { grid-area: title; font-size: 20px; align-self: end; }
  .sandbox-library-empty p { grid-area: hint; margin: 3px 0 7px; font-size: 10px; align-self: center; }
  .sandbox-library-empty .sandbox-library-new--hero { grid-area: action; justify-self: start; min-width: 180px; min-height: 38px; align-self: start; }
}
`;
if (!css.includes('grid-template-areas:\n      "toy title"')) css += landscapePatch;
writeFileSync(cssPath, css);

const qaPath = 'tests/release/release.spec.ts';
let qa = readFileSync(qaPath, 'utf8');
qa = qa.replaceAll('page.locator(`[data-material="${materialId}"]`)', 'page.locator(`.sandbox-material[data-material="${materialId}"]`)');
qa = qa.replaceAll("page.locator('[data-material=\"holo\"]')", "page.locator('.sandbox-material[data-material=\"holo\"]')");
writeFileSync(qaPath, qa);
