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
  "      case 'collect':\n        this.setStageCopy(\n          this.options.copy.stage.collectedTitle,\n          this.collectFeedbackText || this.options.copy.stage.collectedHint,\n        );",
  "      case 'collect':\n        this.setStageCopy(\n          this.options.copy.stage.collectedTitle,\n          this.options.copy.stage.collectedHint,\n        );",
  'collect stage copy',
);

app = replaceOnce(
  app,
  "    this.presentCollectOutcome(outcome);\n    this.setStage('collect');",
  "    this.presentCollectOutcome(outcome);\n    this.setStage('collect');\n\n    const nextRecipe = getCollectionSnapshot(outcome.next.labXp, outcome.next.completedVariantIds).byShape\n      .flatMap((group) => group.recipes)\n      .filter((recipe) => recipe.state === 'available')\n      .sort((left, right) => left.requiredRank - right.requiredRank)[0];\n    if (nextRecipe) this.selected = nextRecipe.choice;",
  'next uncollected selection',
);

app = replaceOnce(
  app,
  "    if (outcome.newlyUnlockedIds.length > 0) {\n      const names = outcome.newlyUnlockedIds\n        .map((id) => {\n          const variant = getVariantSpec(id);\n          return getRecipeDisplayLabel(this.options.copy, id, variant?.label ?? id);\n        })\n        .join(' · ');\n      parts.push(this.formatCopy(this.options.copy.progress.newUnlocks, { names }));\n    }\n    if (outcome.milestone) parts.push(this.milestoneLabel(outcome.milestone));",
  "    if (outcome.newlyUnlockedIds.length > 0) {\n      parts.push(this.formatCopy(this.options.copy.progress.newUnlocks, {\n        names: outcome.newlyUnlockedIds.length,\n      }));\n    }\n    if (outcome.milestone && outcome.milestone !== 'first-squishy') {\n      parts.push(this.milestoneLabel(outcome.milestone));\n    }",
  'compact collect feedback',
);

fs.writeFileSync(appPath, app);

for (const [path, from, to] of [
  ['src/i18n/en.ts', "    rankUp: 'LEVEL ★ {rank}',\n    newUnlocks: 'NEW: {names}',", "    rankUp: '★ {rank}',\n    newUnlocks: 'NEW +{names}',"],
  ['src/i18n/ru.ts', "    rankUp: 'УРОВЕНЬ ★ {rank}',\n    newUnlocks: 'НОВОЕ: {names}',", "    rankUp: '★ {rank}',\n    newUnlocks: 'ЕЩЁ +{names}',"],
]) {
  let source = fs.readFileSync(path, 'utf8');
  source = replaceOnce(source, from, to, `${path} reward copy`);
  fs.writeFileSync(path, source);
}

const cssPath = 'src/ui-ux-overhaul-02.css';
let css = fs.readFileSync(cssPath, 'utf8');
const marker = '/* Screenshot review iteration 04 — ownership loop */';
if (css.includes(marker)) throw new Error('Iteration 04 CSS already applied');
css += `\n\n${marker}\n\n/* Collect is an ownership beat, never a full-screen receipt. */\n.progression-feedback {\n  top: auto;\n  bottom: max(28px, calc(env(safe-area-inset-bottom) + 20px));\n  width: max-content;\n  min-width: 0;\n  max-width: min(88vw, 420px);\n  padding: 10px 15px;\n  border: 1px solid rgba(87, 64, 101, 0.08);\n  border-radius: 999px;\n  background: rgba(255,255,255,0.90);\n  color: #4a3859;\n  font-size: 12px;\n  font-weight: 900;\n  line-height: 1.15;\n  box-shadow: 0 12px 30px rgba(70,48,84,0.12);\n}\n\n.lab-shell[data-stage=\"collect\"] .stage-hint {\n  color: #75667f;\n  font-size: 13px;\n  font-weight: 800;\n}\n\n/* Locked toys remain visible and desirable; the lock is secondary metadata. */\n.collection-card--locked::before {\n  top: 12px;\n  right: 12px;\n  left: auto;\n  width: 26px;\n  height: 26px;\n  transform: none;\n  font-size: 11px;\n  box-shadow: 0 5px 12px rgba(66,48,78,0.10);\n}\n\n.collection-card--locked .recipe-thumb {\n  opacity: 0.62;\n  filter: grayscale(0.24) saturate(0.76);\n}\n\n.collection-card--available .recipe-thumb {\n  transform: scale(1.035);\n}\n\n.collection-card--available .collection-card__action {\n  box-shadow: inset 0 2px 0 rgba(255,255,255,0.56), 0 8px 18px color-mix(in srgb, var(--card-accent-soft) 58%, rgba(76,55,89,0.08));\n}\n\n.lab-shell[data-stage=\"test\"][data-tested=\"true\"] .stage-copy::after {\n  opacity: 0;\n  animation: none;\n}\n\n@media (max-width: 480px) and (orientation: portrait) {\n  .collection-card--locked::before {\n    top: 10px;\n    right: 10px;\n    width: 24px;\n    height: 24px;\n    font-size: 10px;\n  }\n\n  .progression-feedback {\n    bottom: max(22px, calc(env(safe-area-inset-bottom) + 16px));\n    max-width: calc(100% - 34px);\n    font-size: 11px;\n  }\n}\n`;
fs.writeFileSync(cssPath, css);
console.log('UI Overhaul 02 ownership correction patch applied.');
