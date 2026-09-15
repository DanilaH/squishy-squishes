import fs from 'node:fs';

const replaceOnce = (source, from, to, label) => {
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one anchor, found ${count}`);
  return source.replace(from, to);
};

const appPath = 'src/game/VerticalSliceApp.ts';
let app = fs.readFileSync(appPath, 'utf8');

app = replaceOnce(
  app,
  '      const cards = group.recipes.map((recipe) => {',
  '      const cards = [...group.recipes]\n        .sort((left, right) => left.requiredRank - right.requiredRank)\n        .map((recipe) => {',
  'collection recipe order',
);

app = replaceOnce(
  app,
  '      }).join(\'\');\n      return `<section class="collection-group">',
  '        }).join(\'\');\n      return `<section class="collection-group">',
  'collection map indentation',
);

app = replaceOnce(
  app,
  "    context.fillStyle = 'rgba(255, 255, 255, 0.045)';\n    context.fill(this.paintShapePath);\n    context.lineWidth = 2;\n    context.strokeStyle = palette.accentSoftCss;\n    context.shadowBlur = 12;\n    context.shadowColor = palette.accentSoftCss;\n    context.stroke(this.paintShapePath);",
  "    context.globalAlpha = 0.1;\n    context.fillStyle = palette.accentCss;\n    context.fill(this.paintShapePath);\n    context.globalAlpha = 0.34;\n    context.lineWidth = 2.4;\n    context.strokeStyle = palette.accentCss;\n    context.shadowBlur = 14;\n    context.shadowColor = palette.accentSoftCss;\n    context.stroke(this.paintShapePath);",
  'paint idle silhouette',
);

fs.writeFileSync(appPath, app);

const cssPath = 'src/ui-ux-overhaul-02.css';
let css = fs.readFileSync(cssPath, 'utf8');
const marker = '/* Screenshot review iteration 03 */';
if (css.includes(marker)) throw new Error('Iteration 03 CSS already applied');
css += `\n\n${marker}\n\n/* Progress reset belongs to the Pages QA panel, not the child-facing shelf. */\n.collection-reset-button {\n  display: none !important;\n}\n\n/* Completion count lives on the shelf; keep the game surface top bar almost empty. */\n.collection-summary__row {\n  display: none !important;\n}\n\n/* Locked state already has lock + star requirement. Repeating “coming soon” on every toy is noise. */\n.collection-card--locked .collection-card__body > span:not(.collection-card__meta) {\n  display: none;\n}\n\n/* A compact icon-like sound control keeps text chrome away from the toy. */\nbody[data-release-build=\"production\"] .debug-button[data-action=\"mute\"] {\n  width: 50px;\n  min-width: 50px;\n  padding: 0;\n  font-size: 0;\n}\n\nbody[data-release-build=\"production\"] .debug-button[data-action=\"mute\"]::before {\n  content: \"♪\";\n  font-size: 22px;\n  line-height: 1;\n}\n\nbody[data-release-build=\"production\"] .debug-button[data-action=\"mute\"][aria-pressed=\"true\"]::before {\n  content: \"×♪\";\n  font-size: 17px;\n}\n\n/* Gesture hint belongs on the interaction object rather than under the instruction copy. */\n.lab-shell[data-stage=\"pour\"] .stage-copy::after,\n.lab-shell[data-stage=\"add\"] .stage-copy::after,\n.lab-shell[data-stage=\"mix\"] .stage-copy::after,\n.lab-shell[data-stage=\"mold\"] .stage-copy::after,\n.lab-shell[data-stage=\"test\"] .stage-copy::after {\n  top: clamp(168px, 25vh, 220px);\n}\n\n.lab-shell[data-stage=\"pour\"] .workspace-vignette {\n  opacity: 0.72;\n  background: radial-gradient(circle, color-mix(in srgb, var(--accent-soft) 88%, white 12%), transparent 61%);\n}\n\n@media (max-width: 480px) and (orientation: portrait) {\n  .lab-shell[data-stage=\"pour\"] .stage-copy::after,\n  .lab-shell[data-stage=\"add\"] .stage-copy::after,\n  .lab-shell[data-stage=\"mix\"] .stage-copy::after,\n  .lab-shell[data-stage=\"mold\"] .stage-copy::after,\n  .lab-shell[data-stage=\"test\"] .stage-copy::after {\n    top: clamp(175px, 25vh, 215px);\n  }\n}\n`;
fs.writeFileSync(cssPath, css);
console.log('UI Overhaul 02 visual correction patch applied.');
