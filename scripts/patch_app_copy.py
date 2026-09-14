from pathlib import Path

path = Path('src/game/VerticalSliceApp.ts')
text = path.read_text()

def rep(old: str, new: str) -> None:
    global text
    if old not in text:
        raise SystemExit(f'missing snippet: {old[:80]!r}')
    text = text.replace(old, new, 1)

rep("  private renderShell(): string {\n    const paletteButtons = PALETTES.map((palette, index) => `", "  private renderShell(): string {\n    const copy = this.options.copy;\n    const paletteButtons = PALETTES.map((palette, index) => `")
for old, new in {
    '<strong>Squishy Lab</strong>': '<strong>${copy.brand.name}</strong>',
    '<span>Prototype line · 01</span>': '<span>${copy.brand.line}</span>',
    '<span class="made-count">Made 0 / ${TOTAL_VARIANTS}</span>': '<span class="made-count">${copy.collection.made} ${this.discovered.size} / ${TOTAL_VARIANTS}</span>',
    '<section class="lab-workspace" aria-label="Squishy workbench">': '<section class="lab-workspace" aria-label="${copy.aria.workbench}">',
    '<canvas class="squish-canvas" aria-label="Interactive squishy"></canvas>': '<canvas class="squish-canvas" aria-label="${copy.aria.squishy}"></canvas>',
    '<button class="hold-surface" type="button" aria-label="Craft interaction surface" hidden></button>': '<button class="hold-surface" type="button" aria-label="${copy.aria.craftSurface}" hidden></button>',
    '<button class="mold-target" type="button" aria-label="Press the mold target" hidden><span></span></button>': '<button class="mold-target" type="button" aria-label="${copy.aria.moldTarget}" hidden><span></span></button>',
    '<span class="stage-kicker">CRAFT 01</span>': '<span class="stage-kicker">${copy.stage.kicker}</span>',
    '<strong class="stage-title">Choose a recipe</strong>': '<strong class="stage-title">${copy.stage.selectTitle}</strong>',
    '<span class="stage-hint">Pick a color and texture.</span>': '<span class="stage-hint">${copy.stage.selectHint}</span>',
    '<section class="recipe-panel" aria-label="Recipe options">': '<section class="recipe-panel" aria-label="${copy.aria.recipeOptions}">',
    '<span class="option-label">Color</span>': '<span class="option-label">${copy.recipe.color}</span>',
    '<div class="swatches" role="group" aria-label="Squishy color">': '<div class="swatches" role="group" aria-label="${copy.aria.colorGroup}">',
    '<span class="option-label">Texture</span>': '<span class="option-label">${copy.recipe.texture}</span>',
    '<div class="texture-options" role="group" aria-label="Squishy filling">': '<div class="texture-options" role="group" aria-label="${copy.aria.fillingGroup}">',
    '<button class="primary-button start-button" type="button">Make squishy</button>': '<button class="primary-button start-button" type="button">${copy.recipe.make}</button>',
    '<button class="primary-button collect-button" type="button" hidden>Collect</button>': '<button class="primary-button collect-button" type="button" hidden>${copy.actions.collect}</button>',
    '<div class="debug-controls" aria-label="Debug controls">': '<div class="debug-controls" aria-label="${copy.aria.debugControls}">',
    '<button class="debug-button" type="button" data-action="metrics" aria-pressed="false">Metrics</button>': '<button class="debug-button" type="button" data-action="metrics" aria-pressed="false">${copy.actions.metrics}</button>',
    '<button class="debug-button" type="button" data-action="wireframe" aria-pressed="false">Mesh</button>': '<button class="debug-button" type="button" data-action="wireframe" aria-pressed="false">${copy.actions.mesh}</button>',
    '<button class="debug-button" type="button" data-action="mute" aria-pressed="false">Mute</button>': '<button class="debug-button" type="button" data-action="mute" aria-pressed="false">${this.muted ? copy.actions.unmute : copy.actions.mute}</button>',
}.items():
    rep(old, new)

for old, new in {
    "this.setStageCopy('Choose a recipe', 'Pick a color and texture, then make it.');": "this.setStageCopy(this.options.copy.stage.selectTitle, this.options.copy.stage.selectHint);",
    "this.setStageCopy('Spread the base', 'Drag across the squishy until the surface is covered.');": "this.setStageCopy(this.options.copy.stage.pourTitle, this.options.copy.stage.pourHint);",
    "this.setStageCopy('Shake in the foam beads', 'Hold and shake side to side to scatter them through the squishy.');": "this.setStageCopy(this.options.copy.stage.addTitle, this.options.copy.stage.addHint);",
    "this.setStageCopy('Stretch to mix', 'Grab the squishy and keep pulling it around. Holding still will not mix it.');": "this.setStageCopy(this.options.copy.stage.mixTitle, this.options.copy.stage.mixHint);",
    "this.setStageCopy('Shape it', 'Tap the squishy. Hit the pulse for a critical press.');": "this.setStageCopy(this.options.copy.stage.moldTitle, this.options.copy.stage.moldHint);",
    "this.setStageCopy('Unmolding…', '');": "this.setStageCopy(this.options.copy.stage.revealTitle, '');",
    "this.setStageCopy(variantLabel(this.selected), 'Fresh from the mold. Squeeze it, then collect.');": "this.setStageCopy(variantLabel(this.selected), this.options.copy.stage.testHint);",
    "this.resultBadge.textContent = 'NEW MATERIAL';": "this.resultBadge.textContent = this.options.copy.stage.newMaterial;",
    "this.setStageCopy('Collected', 'Ready for another recipe.');": "this.setStageCopy(this.options.copy.stage.collectedTitle, this.options.copy.stage.collectedHint);",
    "this.stageHint.textContent = 'Covered.';": "this.stageHint.textContent = this.options.copy.stage.covered;",
    "this.stageHint.textContent = 'Evenly scattered.';": "this.stageHint.textContent = this.options.copy.stage.scattered;",
    "this.setStageCopy('Shape locked', '');": "this.setStageCopy(this.options.copy.stage.shapeLocked, '');",
}.items():
    rep(old, new)

rep("    this.madeCount.textContent = `Made ${Math.min(TOTAL_VARIANTS, this.discovered.size)} / ${TOTAL_VARIANTS}`;", "    this.madeCount.textContent = `${this.options.copy.collection.made} ${Math.min(TOTAL_VARIANTS, this.discovered.size)} / ${TOTAL_VARIANTS}`;")
path.write_text(text)
