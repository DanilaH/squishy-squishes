import { readFileSync, writeFileSync } from 'node:fs';

const replaceOnce = (source, before, after, label) => {
  if (!source.includes(before)) throw new Error(`${label}: anchor not found`);
  if (source.indexOf(before) !== source.lastIndexOf(before)) throw new Error(`${label}: anchor is ambiguous`);
  return source.replace(before, after);
};

const appPath = 'src/sandbox/SandboxLibraryApp.ts';
let app = readFileSync(appPath, 'utf8');
app = replaceOnce(
  app,
  `import { SandboxApp, type SandboxLanguage } from './SandboxApp';\n`,
  `import { getShape } from '../game/shapes';\nimport { SandboxApp, type SandboxLanguage } from './SandboxApp';\n`,
  'shape import',
);
app = replaceOnce(
  app,
  `const escapeAttribute = (value: string): string => value\n  .replaceAll('&', '&amp;')\n  .replaceAll('"', '&quot;')\n  .replaceAll('<', '&lt;')\n  .replaceAll('>', '&gt;');\n`,
  `const escapeAttribute = (value: string): string => value\n  .replaceAll('&', '&amp;')\n  .replaceAll('"', '&quot;')\n  .replaceAll('<', '&lt;')\n  .replaceAll('>', '&gt;');\n\nconst ideaShapeSvg = (idea: SquishyIdea): string => {\n  const shape = getShape(idea.shapeId);\n  const points = shape.boundary.map((point) => \`${'${'}50 + point.x * 40},${'${'}50 - point.y * 40}\`).join(' ');\n  return \`<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="${'${'}points}" /></svg>\`;\n};\n`,
  'shape preview helper',
);
const oldCard = `        <button class="sandbox-idea-card${'${'}done ? ' is-complete' : ''}" type="button" data-idea-id="${'${'}escapeAttribute(idea.id)}" aria-pressed="${'${'}done}">\n          <span class="sandbox-idea-card__top">\n            <span class="sandbox-idea-card__shape">${'${'}getIdeaShapeLabel(idea, this.options.language)}</span>\n            ${'${'}done ? \`<strong>✓ ${'${'}this.copy.completed}</strong>\` : ''}\n          </span>\n          <span class="sandbox-idea-card__name">${'${'}getIdeaLabel(idea, this.options.language)}</span>\n          <span class="sandbox-idea-card__cues">\n            <i style="--idea-color:#${'${'}idea.paintColor.toString(16).padStart(6, '0')}"></i>\n            <span>${'${'}getIdeaMaterialLabel(idea, this.options.language)}</span>\n            ${'${'}mixin ? \`<span>· ${'${'}mixin}</span>\` : ''}\n          </span>\n        </button>`;
const newCard = `        <button class="sandbox-idea-card${'${'}done ? ' is-complete' : ''}" type="button" data-idea-id="${'${'}escapeAttribute(idea.id)}" aria-pressed="${'${'}done}" style="--idea-color:#${'${'}idea.paintColor.toString(16).padStart(6, '0')}">\n          <span class="sandbox-idea-card__top">\n            <span class="sandbox-idea-card__shape">${'${'}getIdeaShapeLabel(idea, this.options.language)}</span>\n            ${'${'}done ? \`<strong>✓ ${'${'}this.copy.completed}</strong>\` : ''}\n          </span>\n          <span class="sandbox-idea-card__hero">\n            <span class="sandbox-idea-card__preview">${'${'}ideaShapeSvg(idea)}</span>\n            <span class="sandbox-idea-card__copy">\n              <span class="sandbox-idea-card__name">${'${'}getIdeaLabel(idea, this.options.language)}</span>\n              <span class="sandbox-idea-card__cues">\n                <span>${'${'}getIdeaMaterialLabel(idea, this.options.language)}</span>\n                ${'${'}mixin ? \`<span>· ${'${'}mixin}</span>\` : ''}\n              </span>\n            </span>\n          </span>\n        </button>`;
app = replaceOnce(app, oldCard, newCard, 'idea card markup');
writeFileSync(appPath, app);

const cssPath = 'src/sandbox-ideas.css';
let css = readFileSync(cssPath, 'utf8');
css = replaceOnce(css, `  min-height: 112px;\n`, `  min-height: 126px;\n`, 'card height');
css = replaceOnce(
  css,
  `.sandbox-idea-card__name {\n`,
  `.sandbox-idea-card__hero {\n  min-width: 0;\n  display: flex;\n  align-items: center;\n  gap: 10px;\n}\n\n.sandbox-idea-card__preview {\n  width: 52px;\n  height: 52px;\n  flex: 0 0 52px;\n  display: grid;\n  place-items: center;\n  border-radius: 16px;\n  background: radial-gradient(circle at 35% 28%, rgba(255,255,255,.95), rgba(255,255,255,.54));\n  box-shadow: inset 0 0 0 1px rgba(88,64,112,.08), 0 5px 12px rgba(78,56,97,.08);\n}\n\n.sandbox-idea-card__preview svg {\n  width: 42px;\n  height: 42px;\n  overflow: visible;\n  filter: drop-shadow(0 4px 4px rgba(75,53,92,.14));\n}\n\n.sandbox-idea-card__preview polygon {\n  fill: var(--idea-color);\n  stroke: rgba(255,255,255,.92);\n  stroke-width: 3;\n  stroke-linejoin: round;\n}\n\n.sandbox-idea-card__copy {\n  min-width: 0;\n  display: grid;\n  gap: 6px;\n}\n\n.sandbox-idea-card__name {\n`,
  'card visual styles',
);
css = replaceOnce(
  css,
  `.sandbox-idea-card__cues i,\n.sandbox-idea-guide i {\n`,
  `.sandbox-idea-guide i {\n`,
  'remove card dot selector',
);
css = replaceOnce(
  css,
  `  .sandbox-idea-card { min-height: 104px; padding: 9px; border-radius: 15px; }\n`,
  `  .sandbox-idea-card { min-height: 116px; padding: 9px; border-radius: 15px; }\n  .sandbox-idea-card__hero { gap: 8px; }\n  .sandbox-idea-card__preview { width: 44px; height: 44px; flex-basis: 44px; border-radius: 14px; }\n  .sandbox-idea-card__preview svg { width: 36px; height: 36px; }\n`,
  'phone card polish',
);
css = replaceOnce(
  css,
  `  .sandbox-ideas-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; margin-top: 6px; }\n  .sandbox-idea-card { min-height: 84px; padding: 7px; gap: 5px; border-radius: 13px; }\n  .sandbox-idea-card__name { font-size: 10px; }\n  .sandbox-idea-card__top, .sandbox-idea-card__cues { font-size: 8px; }\n`,
  `  .sandbox-ideas-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin-top: 6px; }\n  .sandbox-idea-card { min-height: 86px; padding: 7px; gap: 5px; border-radius: 13px; }\n  .sandbox-idea-card__hero { gap: 6px; }\n  .sandbox-idea-card__preview { width: 32px; height: 32px; flex-basis: 32px; border-radius: 10px; }\n  .sandbox-idea-card__preview svg { width: 27px; height: 27px; }\n  .sandbox-idea-card__copy { gap: 3px; }\n  .sandbox-idea-card__name { font-size: 10px; }\n  .sandbox-idea-card__top, .sandbox-idea-card__cues { font-size: 8px; }\n`,
  'landscape card polish',
);
writeFileSync(cssPath, css);
console.log('Applied S4 Ideas visual polish.');
