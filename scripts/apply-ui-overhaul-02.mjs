import fs from 'node:fs';

const appPath = 'src/game/VerticalSliceApp.ts';
let app = fs.readFileSync(appPath, 'utf8');

const replaceOnce = (source, from, to, label) => {
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one anchor, found ${count}`);
  return source.replace(from, to);
};

app = replaceOnce(
  app,
  "import { SquishyAudio } from './SquishyAudio';",
  "import { getRecipeDisplayLabel, getShapeDisplayLabel } from './catalogPresentation';\nimport { SquishyAudio } from './SquishyAudio';",
  'catalog presentation import',
);

app = replaceOnce(
  app,
  '      this.variantPreview.textContent = selectedSpec.label;',
  '      this.variantPreview.textContent = getRecipeDisplayLabel(this.options.copy, selectedSpec.id, selectedSpec.label);',
  'selected recipe label',
);

app = replaceOnce(
  app,
  "          getVariantSpec(variantId(this.selected))?.label ?? variantLabel(this.selected),",
  "          getRecipeDisplayLabel(\n            this.options.copy,\n            variantId(this.selected),\n            getVariantSpec(variantId(this.selected))?.label ?? variantLabel(this.selected),\n          ),",
  'result recipe label',
);

app = replaceOnce(
  app,
  "        this.transitionTimer = window.setTimeout(() => this.setStage('select'), 520);",
  "        this.transitionTimer = window.setTimeout(() => this.setStage('select'), 1300);",
  'ownership timing',
);

const oldCollectionAction = `        const makeLabel = recipe.state === 'completed'\n          ? this.options.copy.collection.makeAgain\n          : this.options.copy.collection.make;\n        const makeButton = \`<button class=\"collection-card__action\" type=\"button\" data-make-id=\"\${recipe.id}\">\${makeLabel}</button>\`;\n        const action = recipe.state === 'locked'\n          ? \`<span class=\"collection-card__rank\">\${this.formatCopy(this.options.copy.collection.requiredRank, { rank: recipe.requiredRank })}</span>\`\n          : recipe.state === 'completed'\n            ? \`<div class=\"collection-card__actions\">\${makeButton}<button class=\"collection-card__action collection-card__action--secondary\" type=\"button\" data-revisit-id=\"\${recipe.id}\">\${this.options.copy.collection.squeeze}</button></div>\`\n            : \`<div class=\"collection-card__actions\">\${makeButton}</div>\`;`;

const newCollectionAction = `        const displayLabel = getRecipeDisplayLabel(this.options.copy, recipe.id, recipe.label);\n        const action = recipe.state === 'locked'\n          ? \`<span class=\"collection-card__rank\">\${this.formatCopy(this.options.copy.collection.requiredRank, { rank: recipe.requiredRank })}</span>\`\n          : recipe.state === 'completed'\n            ? \`<div class=\"collection-card__actions\"><button class=\"collection-card__action\" type=\"button\" data-revisit-id=\"\${recipe.id}\">\${this.options.copy.collection.squeeze}</button><button class=\"collection-card__action collection-card__action--secondary\" type=\"button\" data-make-id=\"\${recipe.id}\">\${this.options.copy.collection.makeAgain}</button></div>\`\n            : \`<div class=\"collection-card__actions\"><button class=\"collection-card__action\" type=\"button\" data-make-id=\"\${recipe.id}\">\${this.options.copy.collection.make}</button></div>\`;`;
app = replaceOnce(app, oldCollectionAction, newCollectionAction, 'collection actions');

app = replaceOnce(
  app,
  '            <strong>${recipe.label}</strong>',
  '            <strong>${displayLabel}</strong>',
  'collection recipe label',
);

app = replaceOnce(
  app,
  '        <header><strong>${group.shapeLabel}</strong><span>${group.completed} / ${group.total}</span></header>',
  '        <header><strong>${getShapeDisplayLabel(this.options.copy, group.shapeId, group.shapeLabel)}</strong><span>${group.completed} / ${group.total}</span></header>',
  'collection shape label',
);

app = replaceOnce(
  app,
  `      const names = outcome.newlyUnlockedIds\n        .map((id) => getVariantSpec(id)?.label ?? id)\n        .join(' · ');`,
  `      const names = outcome.newlyUnlockedIds\n        .map((id) => {\n          const variant = getVariantSpec(id);\n          return getRecipeDisplayLabel(this.options.copy, id, variant?.label ?? id);\n        })\n        .join(' · ');`,
  'unlock labels',
);

fs.writeFileSync(appPath, app);

const cssPath = 'src/ui-ux-overhaul-02.css';
let css = fs.readFileSync(cssPath, 'utf8');
const marker = '/* Screenshot review iteration 02 */';
if (css.includes(marker)) throw new Error('CSS review patch already applied');
css += `\n\n${marker}\n\n/* Keep hidden player surfaces actually hidden despite late-layer layout overrides. */\n.recipe-panel.recipe-dock[hidden],\n.collect-button[hidden],\n.collection-overlay[hidden] {\n  display: none !important;\n}\n\n/* Active craft is full-screen: progression/navigation chrome gets out of the way. */\n.lab-shell:not([data-stage=\"select\"]) .lab-topbar {\n  opacity: 0;\n  pointer-events: none;\n}\n\n/* Softer playroom atmosphere; avoid wallpaper-like dot noise. */\n.lab-shell::before {\n  background:\n    radial-gradient(circle at 14% 18%, rgba(255,255,255,0.66), transparent 19%),\n    radial-gradient(circle at 87% 20%, rgba(255,255,255,0.62), transparent 18%),\n    radial-gradient(circle at 50% 52%, rgba(255,255,255,0.30), transparent 48%);\n}\n\n/* Toy names may use two lines; never truncate the identity into database-like ellipses. */\n.collection-card__body strong {\n  display: -webkit-box;\n  overflow: hidden;\n  white-space: normal;\n  text-overflow: clip;\n  -webkit-box-orient: vertical;\n  -webkit-line-clamp: 2;\n}\n\n.collection-card__actions {\n  justify-content: stretch;\n}\n\n.collection-card__action {\n  width: 100%;\n}\n\n/* The ownership beat stays visible during the longer collect state. */\n.lab-shell[data-stage=\"collect\"] .object-stack {\n  animation: toy-owned-settle 1.2s cubic-bezier(.16,.86,.2,1) both;\n}\n\n.lab-shell[data-stage=\"collect\"] .result-halo {\n  animation: toy-owned-halo 1.2s ease-out both;\n}\n\n@keyframes toy-owned-settle {\n  0% { transform: translateY(0) scale(1); opacity: 1; filter: brightness(1); }\n  28% { transform: translateY(-7px) scale(1.035); opacity: 1; filter: brightness(1.08); }\n  100% { transform: translateY(-2px) scale(0.96); opacity: 1; filter: brightness(1.02); }\n}\n\n@keyframes toy-owned-halo {\n  0% { opacity: var(--reward-halo-opacity); transform: translate(-50%, -50%) scale(1); }\n  100% { opacity: var(--reward-halo-rest); transform: translate(-50%, -50%) scale(1.05); }\n}\n\n/* Give the choose-state name breathing room under the hero. */\n@keyframes toy-idle-select {\n  0%, 100% { transform: translateY(-18px); }\n  50% { transform: translateY(-24px); }\n}\n\n.lab-shell[data-stage=\"select\"] .object-stack {\n  animation: toy-idle-select 4.2s ease-in-out infinite;\n}\n\n@media (max-height: 560px) and (orientation: landscape) {\n  .lab-shell[data-stage=\"select\"] .stage-copy {\n    display: none;\n  }\n\n  .lab-shell[data-stage=\"select\"] .workspace-vignette {\n    left: 32%;\n  }\n\n  .lab-shell[data-stage=\"select\"] .contact-shadow {\n    left: 32%;\n  }\n\n  .lab-shell[data-stage=\"select\"] .object-stack {\n    animation: toy-idle-select-landscape 4.2s ease-in-out infinite;\n  }\n\n  .recipe-panel.recipe-dock {\n    width: min(39vw, 350px);\n  }\n\n  .recipe-dock__identity .variant-preview {\n    max-width: 100%;\n    font-size: 17px;\n    line-height: 1.05;\n  }\n\n  @keyframes toy-idle-select-landscape {\n    0%, 100% { transform: translateX(-18vw) translateY(-3px); }\n    50% { transform: translateX(-18vw) translateY(-8px); }\n  }\n}\n`;
fs.writeFileSync(cssPath, css);

console.log('UI Overhaul 02 source patch applied successfully.');
