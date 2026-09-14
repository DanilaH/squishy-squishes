from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    if old not in text:
        raise SystemExit(f'missing replacement target in {path}: {old[:120]!r}')
    target.write_text(text.replace(old, new, 1))


path = 'src/game/VerticalSliceApp.ts'

replace_once(path, "  getPalette,\n", "  getPalette,\n  getVariantSpec,\n")
replace_once(
    path,
    "} from './content';\nimport { SquishyAudio } from './SquishyAudio';\n",
    "} from './content';\nimport {\n  getCollectionSnapshot,\n  getRankProgress,\n  getRequiredRank,\n  isVariantUnlocked,\n  type CollectionMilestone,\n  type CompletionOutcome,\n} from './progression';\nimport { SquishyAudio } from './SquishyAudio';\n",
)
replace_once(
    path,
    "  readonly completedVariantIds: readonly string[];\n  readonly muted: boolean;\n  readonly copy: GameCopy;\n  readonly onVariantCollected: (variantId: string) => void | Promise<void>;\n",
    "  readonly completedVariantIds: readonly string[];\n  readonly labXp: number;\n  readonly muted: boolean;\n  readonly copy: GameCopy;\n  readonly onVariantCollected: (variantId: string) => CompletionOutcome;\n",
)
replace_once(
    path,
    "  private readonly madeCount: HTMLElement;\n  private readonly variantPreview: HTMLElement;\n",
    "  private readonly madeCount: HTMLElement;\n  private readonly labRankElement: HTMLElement;\n  private readonly xpLabel: HTMLElement;\n  private readonly rankProgressFill: HTMLElement;\n  private readonly collectionButton: HTMLButtonElement;\n  private readonly collectionOverlay: HTMLElement;\n  private readonly collectionGroups: HTMLElement;\n  private readonly collectionCloseButton: HTMLButtonElement;\n  private readonly progressionFeedback: HTMLElement;\n  private readonly variantPreview: HTMLElement;\n",
)
replace_once(
    path,
    "  private stage: CraftStage = 'select';\n  private selected: VariantChoice = { shape: 'soft-square', palette: 'grape', filling: 'smooth' };\n",
    "  private stage: CraftStage = 'select';\n  private selected: VariantChoice = { shape: 'soft-square', palette: 'grape', filling: 'smooth' };\n  private labXp = 0;\n  private revisitMode = false;\n  private feedbackTimer: number | null = null;\n  private collectFeedbackText = '';\n",
)
replace_once(path, "    this.muted = options.muted;\n", "    this.muted = options.muted;\n    this.labXp = options.labXp;\n")
replace_once(
    path,
    "    this.madeCount = this.requireElement<HTMLElement>('.made-count');\n    this.variantPreview = this.requireElement<HTMLElement>('.variant-preview');\n",
    "    this.madeCount = this.requireElement<HTMLElement>('.made-count');\n    this.labRankElement = this.requireElement<HTMLElement>('.lab-rank');\n    this.xpLabel = this.requireElement<HTMLElement>('.xp-label');\n    this.rankProgressFill = this.requireElement<HTMLElement>('.rank-progress__fill');\n    this.collectionButton = this.requireElement<HTMLButtonElement>('.collection-open-button');\n    this.collectionOverlay = this.requireElement<HTMLElement>('.collection-overlay');\n    this.collectionGroups = this.requireElement<HTMLElement>('.collection-groups');\n    this.collectionCloseButton = this.requireElement<HTMLButtonElement>('.collection-close-button');\n    this.progressionFeedback = this.requireElement<HTMLElement>('.progression-feedback');\n    this.variantPreview = this.requireElement<HTMLElement>('.variant-preview');\n",
)
replace_once(
    path,
    "    this.bindEvents();\n    this.updateDiscoveredUi();\n    this.updateSelectionUi();\n",
    "    this.bindEvents();\n    this.updateDiscoveredUi();\n    this.updateProgressionUi();\n    this.updateCollectionUi();\n    this.updateSelectionUi();\n",
)
replace_once(
    path,
    "    this.clearMoldTargetTimer();\n    cancelAnimationFrame(this.craftFrame);\n",
    "    this.clearMoldTargetTimer();\n    if (this.feedbackTimer !== null) window.clearTimeout(this.feedbackTimer);\n    cancelAnimationFrame(this.craftFrame);\n",
)
replace_once(
    path,
    "          <div class=\"collection-summary\" aria-live=\"polite\">\n            <span class=\"made-count\">${copy.collection.made} ${this.discovered.size} / ${TOTAL_VARIANTS}</span>\n            <span class=\"discovery-dots\" aria-hidden=\"true\">${discoveryDots}</span>\n          </div>\n",
    "          <div class=\"collection-summary\" aria-live=\"polite\">\n            <div class=\"rank-summary\">\n              <span class=\"lab-rank\">${copy.progress.rank.replace('{rank}', '1')}</span>\n              <span class=\"xp-label\">0 / 100 XP</span>\n              <span class=\"rank-progress\" aria-hidden=\"true\"><span class=\"rank-progress__fill\"></span></span>\n            </div>\n            <div class=\"collection-summary__row\">\n              <span class=\"made-count\">${copy.collection.made} ${this.discovered.size} / ${TOTAL_VARIANTS}</span>\n              <button class=\"collection-open-button\" type=\"button\">${copy.collection.open}</button>\n            </div>\n            <span class=\"discovery-dots\" aria-hidden=\"true\">${discoveryDots}</span>\n          </div>\n",
)
replace_once(
    path,
    "        <button class=\"primary-button collect-button\" type=\"button\" hidden>${copy.actions.collect}</button>\n\n        <div class=\"debug-controls\"",
    "        <button class=\"primary-button collect-button\" type=\"button\" hidden>${copy.actions.collect}</button>\n\n        <section class=\"collection-overlay\" aria-label=\"${copy.aria.collection}\" hidden>\n          <div class=\"collection-panel\">\n            <header class=\"collection-panel__header\">\n              <div>\n                <span class=\"option-label\">${copy.collection.title}</span>\n                <strong>${copy.collection.title}</strong>\n              </div>\n              <button class=\"collection-close-button\" type=\"button\">${copy.collection.close}</button>\n            </header>\n            <div class=\"collection-groups\"></div>\n          </div>\n        </section>\n\n        <div class=\"progression-feedback\" aria-live=\"polite\" hidden></div>\n\n        <div class=\"debug-controls\"",
)
replace_once(
    path,
    "    this.startButton.addEventListener('click', () => {\n      if (this.activityBlocked) return;\n      void this.audio.prime();\n      this.setStage('pour');\n    }, { signal });\n",
    "    this.startButton.addEventListener('click', () => {\n      if (this.activityBlocked || !isVariantUnlocked(variantId(this.selected), this.labXp)) return;\n      this.revisitMode = false;\n      void this.audio.prime();\n      this.setStage('pour');\n    }, { signal });\n",
)
replace_once(
    path,
    "    this.collectButton.addEventListener('click', () => this.collectResult(), { signal });\n\n",
    "    this.collectButton.addEventListener('click', () => this.collectResult(), { signal });\n    this.collectionButton.addEventListener('click', () => this.openCollection(), { signal });\n    this.collectionCloseButton.addEventListener('click', () => this.closeCollection(), { signal });\n    this.collectionOverlay.addEventListener('click', (event) => {\n      if (event.target === this.collectionOverlay) this.closeCollection();\n    }, { signal });\n    this.collectionGroups.addEventListener('click', (event) => {\n      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-revisit-id]') : null;\n      const id = target?.dataset.revisitId;\n      if (id) this.openCompletedVariant(id);\n    }, { signal });\n\n",
)
replace_once(
    path,
    "    this.variantPreview.textContent = variantLabel(this.selected);\n    this.paintShapePath = createShapePath(shape, PAINT_CANVAS_SIZE);\n",
    "    const selectedId = variantId(this.selected);\n    const requiredRank = getRequiredRank(selectedId);\n    const unlocked = isVariantUnlocked(selectedId, this.labXp);\n    this.variantPreview.textContent = unlocked\n      ? variantLabel(this.selected)\n      : `${variantLabel(this.selected)} · ${this.options.copy.progress.lockedAtRank.replace('{rank}', String(requiredRank))}`;\n    this.startButton.disabled = !unlocked;\n    this.paintShapePath = createShapePath(shape, PAINT_CANVAS_SIZE);\n",
)
replace_once(
    path,
    "    this.stage = next;\n    this.shell.dataset.stage = next;\n",
    "    this.stage = next;\n    this.collectionButton.disabled = next !== 'select';\n    if (next !== 'select') this.closeCollection();\n    this.shell.dataset.stage = next;\n",
)
replace_once(
    path,
    "      case 'select':\n        this.setStageCopy(this.options.copy.stage.selectTitle, this.options.copy.stage.selectHint);\n",
    "      case 'select':\n        this.revisitMode = false;\n        this.collectButton.textContent = this.options.copy.actions.collect;\n        this.setStageCopy(this.options.copy.stage.selectTitle, this.options.copy.stage.selectHint);\n        this.updateSelectionUi();\n",
)
replace_once(
    path,
    "      case 'test': {\n        const isNew = !this.discovered.has(variantId(this.selected));\n        this.renderer.setMoldProgress(0);\n        this.setStageCopy(variantLabel(this.selected), this.options.copy.stage.testHint);\n        this.resultBadge.hidden = !isNew;\n        this.resultBadge.textContent = this.options.copy.stage.newMaterial;\n        this.testStartSqueezes = this.latestMetrics?.squeezes ?? 0;\n        break;\n      }\n      case 'collect':\n        this.setStageCopy(this.options.copy.stage.collectedTitle, this.options.copy.stage.collectedHint);\n",
    "      case 'test': {\n        const isNew = !this.revisitMode && !this.discovered.has(variantId(this.selected));\n        this.renderer.setMoldProgress(0);\n        this.setStageCopy(\n          variantLabel(this.selected),\n          this.revisitMode ? this.options.copy.stage.revisitHint : this.options.copy.stage.testHint,\n        );\n        this.collectButton.textContent = this.revisitMode ? this.options.copy.actions.backToLab : this.options.copy.actions.collect;\n        this.resultBadge.hidden = !isNew;\n        this.resultBadge.textContent = this.options.copy.stage.newMaterial;\n        this.testStartSqueezes = this.latestMetrics?.squeezes ?? 0;\n        break;\n      }\n      case 'collect':\n        this.setStageCopy(\n          this.options.copy.stage.collectedTitle,\n          this.collectFeedbackText || this.options.copy.stage.collectedHint,\n        );\n",
)
replace_once(
    path,
    "  private collectResult(): void {\n    if (this.activityBlocked || this.stage !== 'test') return;\n    const collectedVariantId = variantId(this.selected);\n    this.discovered.add(collectedVariantId);\n    this.updateDiscoveredUi();\n    void this.options.onVariantCollected(collectedVariantId);\n    this.setStage('collect');\n  }\n",
    "  private collectResult(): void {\n    if (this.activityBlocked || this.stage !== 'test') return;\n    if (this.revisitMode) {\n      this.revisitMode = false;\n      this.setStage('select');\n      return;\n    }\n\n    const collectedVariantId = variantId(this.selected);\n    const outcome = this.options.onVariantCollected(collectedVariantId);\n    this.labXp = outcome.next.labXp;\n    this.discovered.add(collectedVariantId);\n    this.updateDiscoveredUi();\n    this.updateProgressionUi();\n    this.updateCollectionUi();\n    this.presentCollectOutcome(outcome);\n    this.setStage('collect');\n  }\n",
)
insert_before = "  private readonly tickCraft = (now: number): void => {\n"
helpers = r'''  private formatCopy(template: string, values: Readonly<Record<string, string | number>>): string {
    let result = template;
    for (const [key, value] of Object.entries(values)) result = result.replace(`{${key}}`, String(value));
    return result;
  }

  private updateProgressionUi(): void {
    const progress = getRankProgress(this.labXp);
    this.labRankElement.textContent = this.formatCopy(this.options.copy.progress.rank, { rank: progress.rank });
    this.xpLabel.textContent = progress.nextRank === null
      ? this.options.copy.progress.max
      : this.formatCopy(this.options.copy.progress.xp, {
          current: progress.xpIntoRank,
          target: progress.xpForRank,
        });
    this.rankProgressFill.style.transform = `scaleX(${progress.fraction.toFixed(4)})`;
  }

  private updateCollectionUi(): void {
    const snapshot = getCollectionSnapshot(this.labXp, [...this.discovered]);
    this.collectionGroups.innerHTML = snapshot.byShape.map((group) => {
      const cards = group.recipes.map((recipe) => {
        const palette = getPalette(recipe.choice.palette);
        const status = recipe.state === 'completed'
          ? this.options.copy.collection.completed
          : recipe.state === 'available'
            ? this.options.copy.collection.available
            : this.options.copy.collection.locked;
        const action = recipe.state === 'completed'
          ? `<button class="collection-card__action" type="button" data-revisit-id="${recipe.id}">${this.options.copy.collection.squeeze}</button>`
          : recipe.state === 'locked'
            ? `<span class="collection-card__rank">${this.formatCopy(this.options.copy.collection.requiredRank, { rank: recipe.requiredRank })}</span>`
            : '';
        return `<article class="collection-card collection-card--${recipe.state}" style="--card-accent: ${palette.accentCss}; --card-accent-soft: ${palette.accentSoftCss}">
          <div class="collection-card__swatch" aria-hidden="true"></div>
          <div class="collection-card__body">
            <strong>${recipe.label}</strong>
            <span>${status}</span>
          </div>
          ${action}
        </article>`;
      }).join('');
      return `<section class="collection-group">
        <header><strong>${group.shapeLabel}</strong><span>${group.completed} / ${group.total}</span></header>
        <div class="collection-grid">${cards}</div>
      </section>`;
    }).join('');
  }

  private openCollection(): void {
    if (this.activityBlocked || this.stage !== 'select') return;
    this.updateCollectionUi();
    this.collectionOverlay.hidden = false;
  }

  private closeCollection(): void {
    this.collectionOverlay.hidden = true;
  }

  private openCompletedVariant(id: string): void {
    if (this.activityBlocked || this.stage !== 'select' || !this.discovered.has(id)) return;
    const variant = getVariantSpec(id);
    if (!variant) return;
    this.selected = variant.choice;
    this.updateSelectionUi();
    this.revisitMode = true;
    this.closeCollection();
    this.setStage('test');
  }

  private milestoneLabel(milestone: CollectionMilestone): string {
    switch (milestone) {
      case 'first-squishy': return this.options.copy.progress.firstSquishy;
      case 'half-catalog': return this.options.copy.progress.halfCatalog;
      case 'full-shape': return this.options.copy.progress.fullShape;
      case 'full-catalog': return this.options.copy.progress.fullCatalog;
    }
  }

  private presentCollectOutcome(outcome: CompletionOutcome): void {
    const parts = [this.formatCopy(this.options.copy.progress.xpAward, { xp: outcome.xpAward })];
    if (outcome.currentRank > outcome.previousRank) {
      parts.push(this.formatCopy(this.options.copy.progress.rankUp, { rank: outcome.currentRank }));
    }
    if (outcome.newlyUnlockedIds.length > 0) {
      const names = outcome.newlyUnlockedIds
        .map((id) => getVariantSpec(id)?.label ?? id)
        .join(' · ');
      parts.push(this.formatCopy(this.options.copy.progress.newUnlocks, { names }));
    }
    if (outcome.milestone) parts.push(this.milestoneLabel(outcome.milestone));

    this.collectFeedbackText = parts.join(' · ');
    this.progressionFeedback.textContent = this.collectFeedbackText;
    this.progressionFeedback.hidden = false;
    if (this.feedbackTimer !== null) window.clearTimeout(this.feedbackTimer);
    this.feedbackTimer = window.setTimeout(() => {
      this.progressionFeedback.hidden = true;
      this.feedbackTimer = null;
    }, 3400);
  }

'''
replace_once(path, insert_before, helpers + insert_before)
replace_once(
    path,
    "    if (blocked) {\n      this.audio.stopPour();\n",
    "    if (blocked) {\n      this.collectionButton.disabled = true;\n      this.closeCollection();\n      this.audio.stopPour();\n",
)
replace_once(
    path,
    "    this.lastCraftFrameAt = performance.now();\n    this.lastSemanticAt = performance.now();\n",
    "    this.collectionButton.disabled = this.stage !== 'select';\n    this.lastCraftFrameAt = performance.now();\n    this.lastSemanticAt = performance.now();\n",
)
replace_once(
    path,
    "  private updateDiscoveredUi(): void {\n    this.madeCount.textContent = `${this.options.copy.collection.made} ${Math.min(TOTAL_VARIANTS, this.discovered.size)} / ${TOTAL_VARIANTS}`;\n",
    "  private updateDiscoveredUi(): void {\n    this.madeCount.textContent = `${this.options.copy.collection.made} ${Math.min(TOTAL_VARIANTS, this.discovered.size)} / ${TOTAL_VARIANTS}`;\n",
)

css_path = Path('src/styles.css')
css = css_path.read_text()
css += r'''

/* Progression + Collection 01 */
.collection-summary {
  pointer-events: auto;
  min-width: min(330px, 50vw);
}

.rank-summary {
  width: min(250px, 42vw);
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 5px 9px;
}

.lab-rank {
  font-size: 10px;
  font-weight: 760;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.xp-label {
  font-size: 9px;
  color: rgba(255,255,255,0.46);
}

.rank-progress {
  grid-column: 1 / -1;
  display: block;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
}

.rank-progress__fill {
  display: block;
  width: 100%;
  height: 100%;
  transform: scaleX(0);
  transform-origin: 0 50%;
  border-radius: inherit;
  background: var(--accent);
  box-shadow: 0 0 12px var(--accent-soft);
  transition: transform 260ms ease;
}

.collection-summary__row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 9px;
}

.collection-open-button,
.collection-close-button,
.collection-card__action {
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 10px;
  background: rgba(255,255,255,0.045);
  color: rgba(255,255,255,0.76);
  cursor: pointer;
}

.collection-open-button {
  padding: 6px 9px;
  font-size: 10px;
}

.collection-open-button:disabled {
  opacity: 0.36;
  cursor: default;
}

.primary-button:disabled {
  opacity: 0.42;
  cursor: not-allowed;
  filter: saturate(0.6);
  box-shadow: none;
}

.collection-overlay {
  position: absolute;
  z-index: 40;
  inset: 0;
  display: grid;
  place-items: center;
  padding: max(18px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(18px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left));
  background: rgba(5, 5, 9, 0.70);
  backdrop-filter: blur(14px);
}

.collection-overlay[hidden] {
  display: none;
}

.collection-panel {
  width: min(820px, 100%);
  max-height: min(82vh, 720px);
  overflow: hidden;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(26,23,36,0.98), rgba(11,11,17,0.98));
  box-shadow: 0 28px 90px rgba(0,0,0,0.48);
}

.collection-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 17px 13px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}

.collection-panel__header > div {
  display: grid;
  gap: 4px;
}

.collection-panel__header strong {
  font-size: 20px;
}

.collection-close-button {
  padding: 8px 11px;
  font-size: 11px;
}

.collection-groups {
  overflow: auto;
  overscroll-behavior: contain;
  padding: 16px;
  display: grid;
  gap: 18px;
}

.collection-group {
  display: grid;
  gap: 9px;
}

.collection-group > header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: rgba(255,255,255,0.72);
  font-size: 11px;
}

.collection-group > header span {
  color: rgba(255,255,255,0.38);
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 9px;
}

.collection-card {
  min-height: 88px;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  grid-template-rows: 1fr auto;
  gap: 6px 10px;
  align-items: center;
  padding: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 13px;
  background: rgba(255,255,255,0.028);
}

.collection-card--completed {
  border-color: color-mix(in srgb, var(--card-accent) 42%, transparent);
  background: color-mix(in srgb, var(--card-accent) 8%, rgba(255,255,255,0.025));
}

.collection-card--locked {
  opacity: 0.48;
  filter: saturate(0.45);
}

.collection-card__swatch {
  width: 30px;
  height: 30px;
  grid-row: 1 / 3;
  border-radius: 40% 46% 44% 38%;
  background: radial-gradient(circle at 32% 25%, rgba(255,255,255,0.55), transparent 24%), var(--card-accent);
  box-shadow: 0 0 18px var(--card-accent-soft);
}

.collection-card__body {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.collection-card__body strong {
  overflow: hidden;
  font-size: 10px;
  line-height: 1.25;
  text-overflow: ellipsis;
}

.collection-card__body span,
.collection-card__rank {
  font-size: 9px;
  color: rgba(255,255,255,0.42);
}

.collection-card__action {
  justify-self: start;
  padding: 5px 8px;
  font-size: 9px;
  color: #fff;
  border-color: color-mix(in srgb, var(--card-accent) 45%, transparent);
  background: color-mix(in srgb, var(--card-accent) 12%, rgba(255,255,255,0.04));
}

.progression-feedback {
  position: absolute;
  z-index: 32;
  left: 50%;
  top: max(74px, calc(env(safe-area-inset-top) + 58px));
  transform: translateX(-50%);
  width: min(calc(100% - 28px), 720px);
  padding: 9px 12px;
  border: 1px solid color-mix(in srgb, var(--accent) 34%, transparent);
  border-radius: 12px;
  background: rgba(12,11,18,0.86);
  color: rgba(255,255,255,0.82);
  box-shadow: 0 10px 36px rgba(0,0,0,0.30);
  backdrop-filter: blur(12px);
  font-size: 10px;
  line-height: 1.35;
  text-align: center;
  pointer-events: none;
}

.progression-feedback[hidden] {
  display: none;
}

@media (max-width: 760px) {
  .collection-summary {
    min-width: 0;
  }

  .rank-summary {
    width: min(220px, 54vw);
  }

  .discovery-dots {
    display: none;
  }

  .collection-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .collection-panel {
    max-height: 86vh;
    border-radius: 18px;
  }
}

@media (max-width: 480px) and (orientation: portrait) {
  .collection-summary {
    margin-top: 36px;
  }

  .rank-summary {
    width: min(190px, 56vw);
  }

  .collection-summary__row {
    gap: 6px;
  }

  .collection-open-button {
    padding: 5px 7px;
  }

  .collection-grid {
    grid-template-columns: 1fr;
  }

  .collection-groups {
    padding: 12px;
  }
}
'''
css_path.write_text(css)
