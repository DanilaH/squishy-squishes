from pathlib import Path


def replace_once(path: str, before: str, after: str) -> None:
    file = Path(path)
    source = file.read_text()
    count = source.count(before)
    if count != 1:
        raise RuntimeError(f'{path}: expected one exact patch location; got {count}: {before[:90]!r}')
    file.write_text(source.replace(before, after, 1))


app = 'src/sandbox/SandboxApp.ts'
replace_once(app,
    '          <strong>${this.copy.studio}</strong>\n          <button class="sandbox-sound"',
    '          <strong data-sandbox-brand>${this.copy.studio}</strong>\n          <button class="sandbox-sound" type="button" data-action="stage-back" hidden>← ${this.copy.back}</button>\n          <button class="sandbox-sound"')
replace_once(app,
    "    else this.applyDraftToRenderer();\n    this.setStage(this.stage);",
    "    else this.applyDraftToRenderer();\n    this.updateAppearanceDataset();\n    this.setStage(this.stage);")
replace_once(app,
    "    if (action === 'shape-continue') this.setStage('paint');",
    "    if (action === 'stage-back') this.goBack();\n    else if (action === 'shape-continue') this.setStage('paint');")
replace_once(app,
    "  private beginMix(): void {\n    this.mixDistance = 0;\n    this.mixProgressFill.style.transform = 'scaleX(0)';\n    this.mixContinueButton.disabled = true;\n    this.shell.dataset.mixProgress = '0.000';\n    this.setStage('mix');\n  }",
    "  private goBack(): void {\n    if (this.stage === 'paint') this.setStage('shape');\n    else if (this.stage === 'mixins') this.setStage('paint');\n    else if (this.stage === 'mix') this.setStage('mixins');\n    else if (this.stage === 'decor') this.setStage('mix');\n  }\n\n  private beginMix(): void {\n    // Re-entering Mix after navigating back must not erase earned progress.\n    const progress = Math.min(1, this.mixDistance / MIX_DISTANCE_FOR_COMPLETE_PX);\n    this.mixProgressFill.style.transform = `scaleX(${progress})`;\n    this.mixContinueButton.disabled = progress < 1;\n    this.shell.dataset.mixProgress = progress.toFixed(3);\n    this.setStage('mix');\n  }")
replace_once(app,
    "    this.status.textContent = next === 'mix' ? this.copy.mixMore : '';\n    for (const panel of this.root.querySelectorAll<HTMLElement>('[data-panel]')) {",
    "    this.status.textContent = next === 'mix'\n      ? (this.mixDistance >= MIX_DISTANCE_FOR_COMPLETE_PX ? this.copy.mixReady : this.copy.mixMore) : '';\n    const canGoBack = next === 'paint' || next === 'mixins' || next === 'mix' || next === 'decor';\n    this.requireElement<HTMLButtonElement>('[data-action=\"stage-back\"]').hidden = !canGoBack;\n    this.requireElement<HTMLElement>('[data-sandbox-brand]').hidden = canGoBack;\n    for (const panel of this.root.querySelectorAll<HTMLElement>('[data-panel]')) {")
replace_once(app,
    "    this.shell.dataset.decorBytes = String(estimateDecorBytes(this.draft.decor));\n  }",
    "    this.shell.dataset.decorBytes = String(estimateDecorBytes(this.draft.decor));\n    for (const action of ['decor-undo', 'decor-clear']) {\n      const button = this.root.querySelector<HTMLButtonElement>(`[data-action=\"${action}\"]`);\n      if (button) button.disabled = this.draft.decor.stickers.length === 0;\n    }\n  }")
replace_once(app,
    "    this.shell.dataset.mixinCount = String(this.draft.appearance.mixins.length);\n    this.updateDecorUi();",
    "    this.shell.dataset.mixinCount = String(this.draft.appearance.mixins.length);\n    for (const [action, empty] of [\n      ['paint-undo', this.draft.appearance.strokes.length === 0],\n      ['paint-clear', this.draft.appearance.strokes.length === 0],\n      ['mixin-undo', this.draft.appearance.mixins.length === 0],\n      ['mixin-clear', this.draft.appearance.mixins.length === 0],\n    ] as const) {\n      const button = this.root.querySelector<HTMLButtonElement>(`[data-action=\"${action}\"]`);\n      if (button) button.disabled = empty;\n    }\n    this.updateDecorUi();")

router = 'src/sandbox/StageGestureRouter.ts'
replace_once(router,
    "    if (stage === 'mix' && this.stage !== 'mix') {\n      this.mixDistance = 0;\n      this.host.mixProgress(0, 0);\n    }",
    "    // A new toy resets Mix; revisiting an earlier creative stage does not.\n    if (stage === 'shape' && (this.stage === 'home' || this.stage === 'squeeze')) {\n      this.mixDistance = 0;\n    }\n    if (stage === 'mix' && this.stage !== 'mix') {\n      this.host.mixProgress(this.mixDistance, Math.min(1, this.mixDistance / MIX_DISTANCE_FOR_COMPLETE_PX));\n    }")

print('Applied eight exact, bounded navigation/empty-control patches.')
