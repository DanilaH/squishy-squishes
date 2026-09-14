import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/game/VerticalSliceApp.ts';
let source = readFileSync(path, 'utf8');

const replaceOnce = (needle, replacement, label) => {
  const first = source.indexOf(needle);
  if (first < 0) throw new Error(`${label}: anchor missing`);
  if (source.indexOf(needle, first + needle.length) >= 0) throw new Error(`${label}: anchor not unique`);
  source = source.replace(needle, replacement);
};

replaceOnce(
`  ALL_VARIANT_IDS,
  SELECTOR_FILLINGS,
  SELECTOR_PALETTES,
  getFilling,
  getMaterial,
  getPalette,
  getVariantSpec,
  isLegacyFillingId,
  isLegacyPaletteId,
  type FillingId,
  type PaletteId,
  type VariantChoice,
`,
`  ALL_VARIANT_IDS,
  getFilling,
  getMaterial,
  getPalette,
  getVariantSpec,
  type VariantChoice,
`,
'import content cleanup',
);

replaceOnce(
`import {
  SELECTOR_SHAPES,
  createShapePath,
  getShape,
  isPointInsideShape,
  isSelectorShapeId,
  type ShapeId,
} from './shapes';`,
`import {
  createShapePath,
  getShape,
  isPointInsideShape,
} from './shapes';`,
'import shapes cleanup',
);

replaceOnce(
`  private readonly recipePanel: HTMLElement;
  private readonly startButton: HTMLButtonElement;
`,
`  private readonly recipePanel: HTMLElement;
  private readonly recipeBrowseButton: HTMLButtonElement;
  private readonly startButton: HTMLButtonElement;
`,
'recipe browse field',
);

replaceOnce(
`  private readonly progressionFeedback: HTMLElement;
  private readonly variantPreview: HTMLElement;
`,
`  private readonly progressionFeedback: HTMLElement;
  private readonly variantPreview: HTMLElement;
  private readonly variantMeta: HTMLElement;
`,
'variant meta field',
);

replaceOnce(
`  private readonly discoveryDots: HTMLElement;
  private readonly shapeButtons: readonly HTMLButtonElement[];
  private readonly colorButtons: readonly HTMLButtonElement[];
  private readonly fillingButtons: readonly HTMLButtonElement[];
`,
`  private readonly discoveryDots: HTMLElement;
`,
'legacy selector fields',
);

replaceOnce(
`    this.recipePanel = this.requireElement<HTMLElement>('.recipe-panel');
    this.startButton = this.requireElement<HTMLButtonElement>('.start-button');
`,
`    this.recipePanel = this.requireElement<HTMLElement>('.recipe-panel');
    this.recipeBrowseButton = this.requireElement<HTMLButtonElement>('.recipe-browse-button');
    this.startButton = this.requireElement<HTMLButtonElement>('.start-button');
`,
'constructor browse query',
);

replaceOnce(
`    this.progressionFeedback = this.requireElement<HTMLElement>('.progression-feedback');
    this.variantPreview = this.requireElement<HTMLElement>('.variant-preview');
`,
`    this.progressionFeedback = this.requireElement<HTMLElement>('.progression-feedback');
    this.variantPreview = this.requireElement<HTMLElement>('.variant-preview');
    this.variantMeta = this.requireElement<HTMLElement>('.variant-meta');
`,
'constructor meta query',
);

replaceOnce(
`    this.discoveryDots = this.requireElement<HTMLElement>('.discovery-dots');
    this.shapeButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-shape-choice]'));
    this.colorButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-palette-choice]'));
    this.fillingButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-filling-choice]'));
`,
`    this.discoveryDots = this.requireElement<HTMLElement>('.discovery-dots');
`,
'constructor selector queries',
);

{
  const start = source.indexOf('    const shapeButtons = SELECTOR_SHAPES.map(');
  const end = source.indexOf('    const discoveryDots = ALL_VARIANT_IDS.map', start);
  if (start < 0 || end < 0) throw new Error('legacy render selector block anchors missing');
  source = source.slice(0, start) + source.slice(end);
}

{
  const start = source.indexOf('        <section class="recipe-panel" aria-label="${copy.aria.recipeOptions}">');
  const end = source.indexOf('\n\n        <button class="primary-button collect-button"', start);
  if (start < 0 || end < 0) throw new Error('recipe panel markup anchors missing');
  const replacement = `        <section class="recipe-panel recipe-dock" aria-label="\${copy.aria.recipeOptions}">
          <div class="recipe-dock__identity">
            <span class="option-label">\${copy.recipe.selected}</span>
            <strong class="variant-preview">Soft Cube · Lavender Grape · Smooth</strong>
            <span class="variant-meta">Lavender Grape · Soft · Smooth</span>
          </div>
          <div class="recipe-dock__actions">
            <button class="recipe-browse-button" type="button">\${copy.recipe.browse}</button>
            <button class="primary-button start-button" type="button">\${copy.recipe.make}</button>
          </div>
        </section>`;
  source = source.slice(0, start) + replacement + source.slice(end);
}

replaceOnce(
`    this.collectionButton.addEventListener('click', () => this.openCollection(), { signal });
`,
`    this.collectionButton.addEventListener('click', () => this.openCollection(), { signal });
    this.recipeBrowseButton.addEventListener('click', () => this.openCollection(), { signal });
`,
'browse listener',
);

{
  const start = source.indexOf('    for (const button of this.shapeButtons) {');
  const end = source.indexOf('    this.metricsButton.addEventListener', start);
  if (start < 0 || end < 0) throw new Error('legacy selector listener anchors missing');
  source = source.slice(0, start) + source.slice(end);
}

replaceOnce(
`    if (selectedSpec) {
      const requiredRank = getRequiredRank(selectedId);
      this.variantPreview.textContent = unlocked
        ? selectedSpec.label
        : \`\${selectedSpec.label} · \${this.options.copy.progress.lockedAtRank.replace('{rank}', String(requiredRank))}\`;
    } else {
      this.variantPreview.textContent = variantLabel(this.selected);
    }
    this.startButton.disabled = !unlocked;
`,
`    if (selectedSpec) {
      const requiredRank = getRequiredRank(selectedId);
      this.variantPreview.textContent = selectedSpec.label;
      this.variantMeta.textContent = unlocked
        ? \`\${palette.label} · \${material.label} · \${filling.label}\`
        : this.options.copy.progress.lockedAtRank.replace('{rank}', String(requiredRank));
    } else {
      this.variantPreview.textContent = variantLabel(this.selected);
      this.variantMeta.textContent = \`\${palette.label} · \${material.label} · \${filling.label}\`;
    }
    this.startButton.textContent = selectedSpec && this.discovered.has(selectedSpec.id)
      ? this.options.copy.recipe.makeAgain
      : this.options.copy.recipe.make;
    this.startButton.disabled = !unlocked;
`,
'selection identity',
);

{
  const start = source.indexOf('    for (const button of this.shapeButtons) {');
  if (start >= 0) {
    const end = source.indexOf("\n\n    if (this.stage === 'select')", start);
    if (end < 0) throw new Error('legacy selection aria block end missing');
    source = source.slice(0, start) + source.slice(end + 2);
  }
}

replaceOnce(
`    this.collectionButton.disabled = next !== 'select' || this.activityBlocked;
`,
`    this.collectionButton.disabled = next !== 'select' || this.activityBlocked;
    this.recipeBrowseButton.disabled = next !== 'select' || this.activityBlocked;
`,
'stage browse disabled',
);

{
  const start = source.indexOf('  private updateCollectionUi(): void {');
  const end = source.indexOf('\n\n  private openCollection(): void {', start);
  if (start < 0 || end < 0) throw new Error('collection render anchors missing');
  const replacement = `  private renderRecipeThumbnail(id: string, choice: VariantChoice): string {
    const shape = getShape(choice.shape);
    const palette = getPalette(choice.palette);
    const filling = getFilling(choice.filling);
    const points = shape.boundary
      .map((point) => \`\${(50 + point.x * 43).toFixed(1)},\${(50 - point.y * 43).toFixed(1)}\`)
      .join(' ');
    const dotLayout = filling.renderStyle === 'foam'
      ? [[38, 43, 4], [50, 53, 3], [61, 43, 4], [44, 62, 3], [57, 63, 3]]
      : filling.renderStyle === 'pearl'
        ? [[40, 45, 7], [57, 43, 6], [51, 60, 7]]
        : [];
    const dots = dotLayout
      .map(([x, y, size]) => \`<span style="--dot-x: \${x}%; --dot-y: \${y}%; --dot-size: \${size}px"></span>\`)
      .join('');
    const fillingLayer = dots ? \`<span class="recipe-thumb__filling">\${dots}</span>\` : '';
    return \`<div class="recipe-thumb recipe-thumb--\${choice.material} recipe-thumb--\${filling.renderStyle}" style="--card-accent: \${palette.accentCss}; --card-accent-soft: \${palette.accentSoftCss}" data-thumb-id="\${id}" aria-hidden="true">
      <svg viewBox="0 0 100 100" focusable="false">
        <polygon class="recipe-thumb__shape" points="\${points}"></polygon>
        <path class="recipe-thumb__shine" d="M 33 31 Q 45 22 58 27"></path>
      </svg>
      \${fillingLayer}
    </div>\`;
  }

  private updateCollectionUi(): void {
    const snapshot = getCollectionSnapshot(this.labXp, [...this.discovered]);
    this.collectionGroups.innerHTML = snapshot.byShape.map((group) => {
      const cards = group.recipes.map((recipe) => {
        const palette = getPalette(recipe.choice.palette);
        const material = getMaterial(recipe.choice.material);
        const filling = getFilling(recipe.choice.filling);
        const status = recipe.state === 'completed'
          ? this.options.copy.collection.completed
          : recipe.state === 'available'
            ? this.options.copy.collection.available
            : this.options.copy.collection.locked;
        const makeLabel = recipe.state === 'completed'
          ? this.options.copy.collection.makeAgain
          : this.options.copy.collection.make;
        const makeButton = \`<button class="collection-card__action" type="button" data-make-id="\${recipe.id}">\${makeLabel}</button>\`;
        const action = recipe.state === 'locked'
          ? \`<span class="collection-card__rank">\${this.formatCopy(this.options.copy.collection.requiredRank, { rank: recipe.requiredRank })}</span>\`
          : recipe.state === 'completed'
            ? \`<div class="collection-card__actions">\${makeButton}<button class="collection-card__action collection-card__action--secondary" type="button" data-revisit-id="\${recipe.id}">\${this.options.copy.collection.squeeze}</button></div>\`
            : \`<div class="collection-card__actions">\${makeButton}</div>\`;
        return \`<article class="collection-card collection-card--\${recipe.state}" data-recipe-id="\${recipe.id}" style="--card-accent: \${palette.accentCss}; --card-accent-soft: \${palette.accentSoftCss}">
          \${this.renderRecipeThumbnail(recipe.id, recipe.choice)}
          <div class="collection-card__body">
            <strong>\${recipe.label}</strong>
            <span>\${status}</span>
            <span class="collection-card__meta">\${material.label} · \${filling.label}</span>
          </div>
          \${action}
        </article>\`;
      }).join('');
      return \`<section class="collection-group">
        <header><strong>\${group.shapeLabel}</strong><span>\${group.completed} / \${group.total}</span></header>
        <div class="collection-grid">\${cards}</div>
      </section>\`;
    }).join('');
  }`;
  source = source.slice(0, start) + replacement + source.slice(end);
}

replaceOnce(
`      this.collectionButton.disabled = true;
`,
`      this.collectionButton.disabled = true;
      this.recipeBrowseButton.disabled = true;
`,
'blocked browse disabled',
);

replaceOnce(
`    this.collectionButton.disabled = this.stage !== 'select';
`,
`    this.collectionButton.disabled = this.stage !== 'select';
    this.recipeBrowseButton.disabled = this.stage !== 'select';
`,
'unblocked browse disabled',
);

{
  const start = source.indexOf('\n  private isShapeId(value: string | undefined)');
  if (start < 0) throw new Error('legacy type guard start missing');
  const classEnd = source.lastIndexOf('\n}');
  if (classEnd < start) throw new Error('class end missing');
  source = source.slice(0, start) + source.slice(classEnd);
}

writeFileSync(path, source);
