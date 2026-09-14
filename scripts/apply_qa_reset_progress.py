from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    if old not in text:
        raise SystemExit(f'missing target in {path}: {old[:160]!r}')
    target.write_text(text.replace(old, new, 1))


replace_once(
    'src/platform/save.ts',
    "export const applyCollectedVariant = (\n",
    "export const resetProgressSave = async (\n  storage: StorageAdapter,\n  repository: JsonStorageRepository<SaveStateV2>,\n): Promise<SaveStateV2> => {\n  await repository.remove();\n  await storage.removeItem(PREVIOUS_SAVE_STORAGE_KEY);\n  await storage.removeItem(LEGACY_DISCOVERED_STORAGE_KEY);\n  return createDefaultSave();\n};\n\nexport const applyCollectedVariant = (\n",
)

replace_once(
    'src/app/bootstrap.ts',
    "  loadSaveWithLegacyMigration,\n} from '../platform/save';",
    "  loadSaveWithLegacyMigration,\n  resetProgressSave,\n} from '../platform/save';",
)
replace_once(
    'src/app/bootstrap.ts',
    "    onMutedChange: (muted) => {\n      settingsState = { version: 1, muted };",
    "    onProgressReset: async () => {\n      saveState = await resetProgressSave(runtime.storage, saveRepository);\n    },\n    onMutedChange: (muted) => {\n      settingsState = { version: 1, muted };",
)

replace_once(
    'src/game/VerticalSliceApp.ts',
    "  readonly onVariantCollected: (variantId: string) => CompletionOutcome;\n  readonly onMutedChange: (muted: boolean) => void | Promise<void>;",
    "  readonly onVariantCollected: (variantId: string) => CompletionOutcome;\n  readonly onProgressReset: () => Promise<void>;\n  readonly onMutedChange: (muted: boolean) => void | Promise<void>;",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "  private readonly collectionCloseButton: HTMLButtonElement;\n  private readonly progressionFeedback: HTMLElement;",
    "  private readonly collectionCloseButton: HTMLButtonElement;\n  private readonly collectionResetButton: HTMLButtonElement;\n  private readonly progressionFeedback: HTMLElement;",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "    this.collectionCloseButton = this.requireElement<HTMLButtonElement>('.collection-close-button');\n    this.progressionFeedback = this.requireElement<HTMLElement>('.progression-feedback');",
    "    this.collectionCloseButton = this.requireElement<HTMLButtonElement>('.collection-close-button');\n    this.collectionResetButton = this.requireElement<HTMLButtonElement>('.collection-reset-button');\n    this.progressionFeedback = this.requireElement<HTMLElement>('.progression-feedback');",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "              <button class=\"collection-close-button\" type=\"button\">${copy.collection.close}</button>\n            </header>",
    "              <div class=\"collection-panel__actions\">\n                <button class=\"collection-reset-button\" type=\"button\">${copy.collection.resetProgress}</button>\n                <button class=\"collection-close-button\" type=\"button\">${copy.collection.close}</button>\n              </div>\n            </header>",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "    this.collectionButton.addEventListener('click', () => this.openCollection(), { signal });\n    this.collectionCloseButton.addEventListener('click', () => this.closeCollection(), { signal });",
    "    this.collectionButton.addEventListener('click', () => this.openCollection(), { signal });\n    this.collectionCloseButton.addEventListener('click', () => this.closeCollection(), { signal });\n    this.collectionResetButton.addEventListener('click', () => { void this.resetProgress(); }, { signal });",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "  private closeCollection(): void {\n    this.collectionOverlay.hidden = true;\n  }\n\n  private openCompletedVariant(id: string): void {",
    "  private closeCollection(): void {\n    this.collectionOverlay.hidden = true;\n  }\n\n  private async resetProgress(): Promise<void> {\n    if (this.activityBlocked || this.stage !== 'select') return;\n    if (!window.confirm(this.options.copy.collection.resetConfirm)) return;\n\n    this.collectionResetButton.disabled = true;\n    try {\n      await this.options.onProgressReset();\n      this.labXp = 0;\n      this.discovered.clear();\n      this.revisitMode = false;\n      this.collectFeedbackText = '';\n      this.selected = { shape: 'soft-square', palette: 'grape', filling: 'smooth' };\n      if (this.feedbackTimer !== null) {\n        window.clearTimeout(this.feedbackTimer);\n        this.feedbackTimer = null;\n      }\n      this.progressionFeedback.hidden = true;\n      this.updateDiscoveredUi();\n      this.updateProgressionUi();\n      this.updateCollectionUi();\n      this.updateSelectionUi();\n      this.closeCollection();\n    } catch (error: unknown) {\n      console.error('[squishy:reset-progress]', error);\n      window.alert(this.options.copy.collection.resetFailed);\n    } finally {\n      this.collectionResetButton.disabled = false;\n    }\n  }\n\n  private openCompletedVariant(id: string): void {",
)

replace_once(
    'src/i18n/en.ts',
    "    requiredRank: 'Rank {rank}',\n  },",
    "    requiredRank: 'Rank {rank}',\n    resetProgress: 'Reset progress',\n    resetConfirm: 'Reset all Lab XP and collection progress? This cannot be undone.',\n    resetFailed: 'Could not reset progress. Please try again.',\n  },",
)
replace_once(
    'src/i18n/ru.ts',
    "    requiredRank: 'Ранг {rank}',\n  },",
    "    requiredRank: 'Ранг {rank}',\n    resetProgress: 'Сбросить прогресс',\n    resetConfirm: 'Сбросить весь XP лаборатории и коллекцию? Отменить это нельзя.',\n    resetFailed: 'Не удалось сбросить прогресс. Попробуй ещё раз.',\n  },",
)

replace_once(
    'src/styles.css',
    ".collection-open-button,\n.collection-close-button,\n.collection-card__action {",
    ".collection-open-button,\n.collection-close-button,\n.collection-reset-button,\n.collection-card__action {",
)
replace_once(
    'src/styles.css',
    ".collection-close-button {\n  padding: 8px 11px;\n  font-size: 11px;\n}\n",
    ".collection-panel__actions {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n\n.collection-close-button,\n.collection-reset-button {\n  padding: 8px 11px;\n  font-size: 11px;\n}\n\n.collection-reset-button {\n  border-color: rgba(255, 111, 124, 0.24);\n  color: rgba(255, 170, 178, 0.82);\n  background: rgba(255, 88, 106, 0.06);\n}\n\n.collection-reset-button:disabled {\n  opacity: 0.42;\n  cursor: wait;\n}\n",
)

replace_once(
    'docs/PROGRESSION_COLLECTION_01.md',
    "Do not turn debug tooling into an admin framework.\n",
    "Do not turn debug tooling into an admin framework.\n\nDuring deployed phone acceptance, Collection exposes one explicit **Reset progress** QA control with confirmation. It clears V2 plus both migration-source keys so a reset cannot silently resurrect old progress. This is a temporary visible test surface, not a hidden production backdoor; review/remove it during release hardening.\n",
)
