from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    if old not in text:
        raise SystemExit(f'missing target in {path}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


def replace_all(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    if old not in text:
        raise SystemExit(f'missing target in {path}: {old[:180]!r}')
    target.write_text(text.replace(old, new))


# SquishSurface: generic material + filling style uniforms.
replace_once(
    'src/squish/SquishSurface.ts',
    "export type SquishRgb = readonly [number, number, number];\n\nexport interface SquishMaterialStyle {",
    "export type SquishRgb = readonly [number, number, number];\nexport type SquishFillingStyle = 'none' | 'foam' | 'pearl';\n\nexport interface SquishMaterialStyle {",
)
replace_once(
    'src/squish/SquishSurface.ts',
    "  rim: SquishRgb;\n  seed: number;\n}",
    "  rim: SquishRgb;\n  seed: number;\n  translucency: number;\n  iridescence: number;\n}",
)
replace_once(
    'src/squish/SquishSurface.ts',
    "  rim: [0.44, 0.22, 0.54],\n  seed: 0.17,\n};",
    "  rim: [0.44, 0.22, 0.54],\n  seed: 0.17,\n  translucency: 0,\n  iridescence: 0,\n};",
)
replace_once(
    'src/squish/SquishSurface.ts',
    "  private readonly fillingAmountUniform: WebGLUniformLocation;\n  private readonly fillProgressUniform: WebGLUniformLocation;",
    "  private readonly fillingAmountUniform: WebGLUniformLocation;\n  private readonly fillingStyleUniform: WebGLUniformLocation;\n  private readonly fillProgressUniform: WebGLUniformLocation;",
)
replace_once(
    'src/squish/SquishSurface.ts',
    "  private readonly materialSeedUniform: WebGLUniformLocation;\n  private readonly wireframePassUniform: WebGLUniformLocation;",
    "  private readonly materialSeedUniform: WebGLUniformLocation;\n  private readonly translucencyUniform: WebGLUniformLocation;\n  private readonly iridescenceUniform: WebGLUniformLocation;\n  private readonly wireframePassUniform: WebGLUniformLocation;",
)
replace_once(
    'src/squish/SquishSurface.ts',
    "  private fillingAmount = 0;\n  private fillProgress = 1;",
    "  private fillingAmount = 0;\n  private fillingStyle = 0;\n  private fillProgress = 1;",
)
replace_once(
    'src/squish/SquishSurface.ts',
    "    this.fillingAmountUniform = requireUniform(gl, this.program, 'uFillingAmount');\n    this.fillProgressUniform = requireUniform(gl, this.program, 'uFillProgress');",
    "    this.fillingAmountUniform = requireUniform(gl, this.program, 'uFillingAmount');\n    this.fillingStyleUniform = requireUniform(gl, this.program, 'uFillingStyle');\n    this.fillProgressUniform = requireUniform(gl, this.program, 'uFillProgress');",
)
replace_once(
    'src/squish/SquishSurface.ts',
    "    this.materialSeedUniform = requireUniform(gl, this.program, 'uMaterialSeed');\n    this.wireframePassUniform = requireUniform(gl, this.program, 'uWireframePass');",
    "    this.materialSeedUniform = requireUniform(gl, this.program, 'uMaterialSeed');\n    this.translucencyUniform = requireUniform(gl, this.program, 'uTranslucency');\n    this.iridescenceUniform = requireUniform(gl, this.program, 'uIridescence');\n    this.wireframePassUniform = requireUniform(gl, this.program, 'uWireframePass');",
)
replace_once(
    'src/squish/SquishSurface.ts',
    "  public setFillingAmount(amount: number): void {\n    this.fillingAmount = clamp01(amount);\n  }\n\n  public setFillProgress(progress: number): void {",
    "  public setFillingAmount(amount: number): void {\n    this.fillingAmount = clamp01(amount);\n  }\n\n  public setFillingStyle(style: SquishFillingStyle): void {\n    this.fillingStyle = style === 'pearl' ? 2 : style === 'foam' ? 1 : 0;\n  }\n\n  public setFillProgress(progress: number): void {",
)
replace_once(
    'src/squish/SquishSurface.ts',
    "    gl.uniform1f(this.fillingAmountUniform, this.fillingAmount);\n    gl.uniform1f(this.fillProgressUniform, this.fillProgress);",
    "    gl.uniform1f(this.fillingAmountUniform, this.fillingAmount);\n    gl.uniform1f(this.fillingStyleUniform, this.fillingStyle);\n    gl.uniform1f(this.fillProgressUniform, this.fillProgress);",
)
replace_once(
    'src/squish/SquishSurface.ts',
    "    gl.uniform1f(this.materialSeedUniform, this.material.seed);\n\n    gl.bindVertexArray(this.vao);",
    "    gl.uniform1f(this.materialSeedUniform, this.material.seed);\n    gl.uniform1f(this.translucencyUniform, clamp01(this.material.translucency));\n    gl.uniform1f(this.iridescenceUniform, clamp01(this.material.iridescence));\n\n    gl.bindVertexArray(this.vao);",
)

# VerticalSliceApp imports and choice safety.
replace_once(
    'src/game/VerticalSliceApp.ts',
    "  FILLINGS,\n  PALETTES,\n  getPalette,\n  getVariantSpec,",
    "  FILLINGS,\n  PALETTES,\n  SELECTOR_FILLINGS,\n  SELECTOR_PALETTES,\n  getFilling,\n  getMaterial,\n  getPalette,\n  getVariantSpec,\n  isLegacyFillingId,\n  isLegacyPaletteId,",
)
replace_all(
    'src/game/VerticalSliceApp.ts',
    "{ shape: 'soft-square', palette: 'grape', filling: 'smooth' }",
    "{ shape: 'soft-square', palette: 'grape', material: 'soft', filling: 'smooth' }",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "    const paletteButtons = PALETTES.map((palette, index) => `",
    "    const paletteButtons = SELECTOR_PALETTES.map((palette, index) => `",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "    const fillingButtons = FILLINGS.map((filling, index) => `",
    "    const fillingButtons = SELECTOR_FILLINGS.map((filling, index) => `",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    '<div class="foam-shaker__body"><span>FOAM</span></div>',
    '<div class="foam-shaker__body"><span>FILL</span></div>',
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "    this.startButton.addEventListener('click', () => {\n      if (this.activityBlocked || !isVariantUnlocked(variantId(this.selected), this.labXp)) return;",
    "    this.startButton.addEventListener('click', () => {\n      const selectedId = variantId(this.selected);\n      if (this.activityBlocked || !getVariantSpec(selectedId) || !isVariantUnlocked(selectedId, this.labXp)) return;",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "    this.collectionGroups.addEventListener('click', (event) => {\n      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-revisit-id]') : null;\n      const id = target?.dataset.revisitId;\n      if (id) this.openCompletedVariant(id);\n    }, { signal });",
    "    this.collectionGroups.addEventListener('click', (event) => {\n      const element = event.target instanceof Element ? event.target : null;\n      const makeTarget = element?.closest<HTMLElement>('[data-make-id]') ?? null;\n      const makeId = makeTarget?.dataset.makeId;\n      if (makeId) {\n        this.startVariantFromCollection(makeId);\n        return;\n      }\n      const revisitTarget = element?.closest<HTMLElement>('[data-revisit-id]') ?? null;\n      const revisitId = revisitTarget?.dataset.revisitId;\n      if (revisitId) this.openCompletedVariant(revisitId);\n    }, { signal });",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "        this.selected = { ...this.selected, shape: value };\n        this.updateSelectionUi();",
    "        const palette = isLegacyPaletteId(this.selected.palette) ? this.selected.palette : 'grape';\n        const filling = isLegacyFillingId(this.selected.filling) ? this.selected.filling : 'smooth';\n        this.selected = { shape: value, palette, material: 'soft', filling };\n        this.updateSelectionUi();",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "        this.selected = { ...this.selected, palette: value };\n        this.updateSelectionUi();",
    "        const filling = isLegacyFillingId(this.selected.filling) ? this.selected.filling : 'smooth';\n        this.selected = { shape: this.selected.shape, palette: value, material: 'soft', filling };\n        this.updateSelectionUi();",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "        this.selected = { ...this.selected, filling: value };\n        this.updateSelectionUi();",
    "        const palette = isLegacyPaletteId(this.selected.palette) ? this.selected.palette : 'grape';\n        this.selected = { shape: this.selected.shape, palette, material: 'soft', filling: value };\n        this.updateSelectionUi();",
)

old_update_selection = """  private updateSelectionUi(): void {
    const shape = getShape(this.selected.shape);
    const palette = getPalette(this.selected.palette);
    this.shell.dataset.shape = shape.id;
    this.shell.dataset.palette = palette.id;
    this.shell.dataset.filling = this.selected.filling;
    this.shell.style.setProperty('--accent', palette.accentCss);
    this.shell.style.setProperty('--accent-soft', palette.accentSoftCss);
    const selectedId = variantId(this.selected);
    const requiredRank = getRequiredRank(selectedId);
    const unlocked = isVariantUnlocked(selectedId, this.labXp);
    this.variantPreview.textContent = unlocked
      ? variantLabel(this.selected)
      : `${variantLabel(this.selected)} · ${this.options.copy.progress.lockedAtRank.replace('{rank}', String(requiredRank))}`;
    this.startButton.disabled = !unlocked;
    this.paintShapePath = createShapePath(shape, PAINT_CANVAS_SIZE);
    this.renderer.setShape(shape);
    this.renderer.setMaterial(palette);

    for (const button of this.shapeButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.shapeChoice === this.selected.shape));
    }
    for (const button of this.colorButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.paletteChoice === this.selected.palette));
    }
    for (const button of this.fillingButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.fillingChoice === this.selected.filling));
    }

    if (this.stage === 'select') {
      this.renderer.setFillProgress(1);
      this.renderer.setFillingAmount(this.selected.filling === 'beads' ? 1 : 0);
    }
  }
"""
new_update_selection = """  private updateSelectionUi(): void {
    const shape = getShape(this.selected.shape);
    const palette = getPalette(this.selected.palette);
    const material = getMaterial(this.selected.material);
    const filling = getFilling(this.selected.filling);
    this.shell.dataset.shape = shape.id;
    this.shell.dataset.palette = palette.id;
    this.shell.dataset.material = material.id;
    this.shell.dataset.filling = filling.id;
    this.shell.style.setProperty('--accent', palette.accentCss);
    this.shell.style.setProperty('--accent-soft', palette.accentSoftCss);
    const selectedId = variantId(this.selected);
    const selectedSpec = getVariantSpec(selectedId);
    const unlocked = selectedSpec ? isVariantUnlocked(selectedId, this.labXp) : false;
    if (selectedSpec) {
      const requiredRank = getRequiredRank(selectedId);
      this.variantPreview.textContent = unlocked
        ? selectedSpec.label
        : `${selectedSpec.label} · ${this.options.copy.progress.lockedAtRank.replace('{rank}', String(requiredRank))}`;
    } else {
      this.variantPreview.textContent = variantLabel(this.selected);
    }
    this.startButton.disabled = !unlocked;
    this.paintShapePath = createShapePath(shape, PAINT_CANVAS_SIZE);
    this.renderer.setShape(shape);
    this.renderer.setMaterial({
      low: palette.low,
      high: palette.high,
      sheen: palette.sheen,
      rim: palette.rim,
      seed: palette.seed,
      translucency: material.translucency,
      iridescence: material.iridescence,
    });
    this.renderer.setFillingStyle(filling.renderStyle);

    for (const button of this.shapeButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.shapeChoice === this.selected.shape));
    }
    for (const button of this.colorButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.paletteChoice === this.selected.palette));
    }
    for (const button of this.fillingButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.fillingChoice === this.selected.filling));
    }

    if (this.stage === 'select') {
      this.renderer.setFillProgress(1);
      this.renderer.setFillingAmount(filling.requiresAddStage ? 1 : 0);
    }
  }
"""
replace_once('src/game/VerticalSliceApp.ts', old_update_selection, new_update_selection)

replace_all(
    'src/game/VerticalSliceApp.ts',
    "this.selected.filling === 'beads' ? 1 : 0",
    "getFilling(this.selected.filling).requiresAddStage ? 1 : 0",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "        this.audio.playReveal(this.selected.filling === 'beads');",
    "        this.audio.playReveal(this.selected.material !== 'soft' || getFilling(this.selected.filling).requiresAddStage);",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "          variantLabel(this.selected),\n          this.revisitMode ? this.options.copy.stage.revisitHint : this.options.copy.stage.testHint,",
    "          getVariantSpec(variantId(this.selected))?.label ?? variantLabel(this.selected),\n          this.revisitMode ? this.options.copy.stage.revisitHint : this.options.copy.stage.testHint,",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "      () => this.setStage(this.selected.filling === 'beads' ? 'add' : 'mix'),",
    "      () => this.setStage(getFilling(this.selected.filling).requiresAddStage ? 'add' : 'mix'),",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "        const action = recipe.state === 'completed'\n          ? `<button class=\"collection-card__action\" type=\"button\" data-revisit-id=\"${recipe.id}\">${this.options.copy.collection.squeeze}</button>`\n          : recipe.state === 'locked'\n            ? `<span class=\"collection-card__rank\">${this.formatCopy(this.options.copy.collection.requiredRank, { rank: recipe.requiredRank })}</span>`\n            : '';",
    "        const action = recipe.state === 'completed'\n          ? `<button class=\"collection-card__action\" type=\"button\" data-revisit-id=\"${recipe.id}\">${this.options.copy.collection.squeeze}</button>`\n          : recipe.state === 'available'\n            ? `<button class=\"collection-card__action\" type=\"button\" data-make-id=\"${recipe.id}\">${this.options.copy.collection.make}</button>`\n            : `<span class=\"collection-card__rank\">${this.formatCopy(this.options.copy.collection.requiredRank, { rank: recipe.requiredRank })}</span>`;",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "  private openCompletedVariant(id: string): void {",
    "  private startVariantFromCollection(id: string): void {\n    if (this.activityBlocked || this.stage !== 'select') return;\n    const variant = getVariantSpec(id);\n    if (!variant || !isVariantUnlocked(id, this.labXp)) return;\n    this.selected = variant.choice;\n    this.revisitMode = false;\n    this.updateSelectionUi();\n    this.closeCollection();\n    void this.audio.prime();\n    this.setStage('pour');\n  }\n\n  private openCompletedVariant(id: string): void {",
)

# Typed copy: Collection Make + filling-generic add copy.
replace_once(
    'src/i18n/en.ts',
    "    squeeze: 'Squeeze',\n    requiredRank: 'Rank {rank}',",
    "    squeeze: 'Squeeze',\n    make: 'Make',\n    requiredRank: 'Rank {rank}',",
)
replace_once(
    'src/i18n/ru.ts',
    "    squeeze: 'Пожмякать',\n    requiredRank: 'Ранг {rank}',",
    "    squeeze: 'Пожмякать',\n    make: 'Сделать',\n    requiredRank: 'Ранг {rank}',",
)
replace_once(
    'src/i18n/en.ts',
    "    addTitle: 'Shake in the foam beads',\n    addHint: 'Hold and shake side to side to scatter them through the squishy.',",
    "    addTitle: 'Shake in the filling',\n    addHint: 'Hold and shake side to side to distribute it through the squishy.',",
)
replace_once(
    'src/i18n/ru.ts',
    "    addTitle: 'Насыпь пенопластовые шарики',\n    addHint: 'Зажми и тряси из стороны в сторону, чтобы равномерно распределить их.',",
    "    addTitle: 'Добавь наполнитель',\n    addHint: 'Зажми и тряси из стороны в сторону, чтобы равномерно распределить его.',",
)

# Roadmap: Phase 5 accepted, Phase 6 active.
replace_once(
    'docs/IMPLEMENTATION_ROADMAP.md',
    "**Current gate:** Phase 5 — Progression + Collection 01\n**Previous gate:** Phase 4 — Renderer Reuse / Second Shape — COMPLETE\n\nThe tactile probe, complete vertical slice, production shell and two-shape renderer-reuse gate have passed. Soft Cube + Soft Heart share the same deformation/material/craft path and the merged phone build was accepted. The project is now validating the one-more-squishy progression/collection loop before representative content expansion.",
    "**Current gate:** Phase 6 — Representative Content 01\n**Previous gate:** Phase 5 — Progression + Collection 01 — COMPLETE\n\nThe tactile loop, production shell, two-shape renderer reuse and the one-more-squishy progression/collection loop have passed deployed phone acceptance. The project is now proving reusable material/filling novelty with four curated representative recipes before broad catalog production or final UI polish.",
)
replace_once('docs/IMPLEMENTATION_ROADMAP.md', '## Phase 5 — Progression + Collection — ACTIVE', '## Phase 5 — Progression + Collection — COMPLETE')
replace_once(
    'docs/IMPLEMENTATION_ROADMAP.md',
    "### Exit gate\n\nFresh save reaches several desirable unlocks at a cadence supported by measured loop timing.\n\n---\n\n## Phase 6 — Interaction/content expansion\n",
    "### Exit gate\n\nFresh-save progression, deterministic unlocks, Collection states and completed-item revisit were exercised successfully on the deployed phone build on 2026-09-14. The bounded one-more-loop gate is closed; XP values remain validation tuning rather than final launch balance.\n\n---\n\n## Phase 6 — Interaction/content expansion — ACTIVE\n\nCanonical bounded spec:\n\n- `REPRESENTATIVE_CONTENT_01.md`\n- `REPRESENTATIVE_CONTENT_01_REVIEW.md`\n",
)
replace_once(
    'docs/IMPLEMENTATION_ROADMAP.md',
    "Possible additions only where content needs them:\n\n- richer filling/add variants;\n- selected DRAG/APPLY finish/decor behavior;\n- one restrained finish/decor beat if justified;\n- premium reveal hierarchy.\n\nUse only a few representative recipes before catalog scale.",
    "Current bounded proof:\n\n- explicit curated registry rather than a Cartesian canonical catalog;\n- reusable `soft` / `jelly` / `holo` material profiles in one shader path;\n- reusable Pearl filling on the existing shake/add interaction;\n- four premium representative recipes across both proven shapes;\n- Collection Make as temporary functional reachability for recipes outside the legacy component selector.\n\nUse only this representative set before deciding whether catalog scale is cheap enough. Additional finish/decor mechanics remain deferred unless the content proof shows they are needed.",
)

replace_once(
    'docs/CONTENT_AND_PROGRESSION.md',
    "**Status:** ACTIVE SUPPORTING DIRECTION — Phase 5 Progression + Collection\n**Important:** `PROGRESSION_COLLECTION_01.md` defines the bounded 12-recipe validation tuning. Its XP values/unlock order are test parameters, not final launch balance.",
    "**Status:** ACTIVE SUPPORTING DIRECTION — Phase 6 Representative Content\n**Important:** `PROGRESSION_COLLECTION_01.md` remains historical validation tuning. `REPRESENTATIVE_CONTENT_01.md` now governs the bounded 16-recipe material/filling proof; XP values/unlock order are still test parameters, not final launch balance.",
)

# Align prism naming in the approved spec.
replace_all('docs/REPRESENTATIVE_CONTENT_01.md', '- `opal` — pale neutral/spectral base suitable for holographic treatment.', '- `prism` — pale opal/spectral base suitable for holographic treatment.')
