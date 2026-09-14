from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    if old not in text:
        raise SystemExit(f'Missing expected snippet in {path}: {old!r}')
    target.write_text(text.replace(old, new, 1))


# --- SquishSurface: generic shape field + shared hit testing ---
replace_once(
    'src/squish/SquishSurface.ts',
    "import type { SquishyAudio } from '../game/SquishyAudio';\nimport { fragmentShaderSource, vertexShaderSource } from './shaders';",
    "import type { SquishyAudio } from '../game/SquishyAudio';\nimport {\n  createShapeField,\n  getShape,\n  isPointInsideShape,\n  type ShapeDefinition,\n  type ShapeId,\n} from '../game/shapes';\nimport { fragmentShaderSource, vertexShaderSource } from './shaders';",
)
replace_once(
    'src/squish/SquishSurface.ts',
    'const GRID_CELLS = 16;\n',
    'const GRID_CELLS = 16;\nconst SHAPE_FIELD_SIZE = 128;\n',
)
replace_once(
    'src/squish/SquishSurface.ts',
    '  private readonly lineIndexBuffer: WebGLBuffer;\n  private readonly vertices: VertexState[] = [];',
    '  private readonly lineIndexBuffer: WebGLBuffer;\n  private readonly shapeTexture: WebGLTexture;\n  private readonly shapeFieldUniform: WebGLUniformLocation;\n  private readonly shapeFieldCache = new Map<ShapeId, Uint8Array>();\n  private readonly vertices: VertexState[] = [];',
)
replace_once(
    'src/squish/SquishSurface.ts',
    '  private material: SquishMaterialStyle = DEFAULT_MATERIAL;\n',
    "  private material: SquishMaterialStyle = DEFAULT_MATERIAL;\n  private shape: ShapeDefinition = getShape('soft-square');\n",
)
replace_once(
    'src/squish/SquishSurface.ts',
    "    this.scaleUniform = requireUniform(gl, this.program, 'uScale');\n",
    "    this.scaleUniform = requireUniform(gl, this.program, 'uScale');\n    this.shapeFieldUniform = requireUniform(gl, this.program, 'uShapeField');\n",
)
replace_once(
    'src/squish/SquishSurface.ts',
    '    const lineIndexBuffer = gl.createBuffer();\n    if (!vao || !vertexBuffer || !triangleIndexBuffer || !lineIndexBuffer) {\n      throw new Error(\'Unable to allocate WebGL buffers.\');\n    }\n',
    "    const lineIndexBuffer = gl.createBuffer();\n    const shapeTexture = gl.createTexture();\n    if (!vao || !vertexBuffer || !triangleIndexBuffer || !lineIndexBuffer || !shapeTexture) {\n      throw new Error('Unable to allocate WebGL buffers or shape texture.');\n    }\n",
)
replace_once(
    'src/squish/SquishSurface.ts',
    '    this.lineIndexBuffer = lineIndexBuffer;\n\n    const triangleIndices: number[] = [];',
    '    this.lineIndexBuffer = lineIndexBuffer;\n    this.shapeTexture = shapeTexture;\n\n    gl.activeTexture(gl.TEXTURE0);\n    gl.bindTexture(gl.TEXTURE_2D, this.shapeTexture);\n    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);\n    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);\n    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);\n    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);\n    this.uploadShapeField(this.shape);\n    gl.bindTexture(gl.TEXTURE_2D, null);\n\n    const triangleIndices: number[] = [];',
)
replace_once(
    'src/squish/SquishSurface.ts',
    '  public setMaterial(material: SquishMaterialStyle): void {\n    this.material = material;\n  }\n',
    "  public setMaterial(material: SquishMaterialStyle): void {\n    this.material = material;\n  }\n\n  public setShape(shape: ShapeDefinition): void {\n    if (shape.id === this.shape.id) return;\n    this.cancelInteraction();\n    this.shape = shape;\n    this.uploadShapeField(shape);\n  }\n",
)
replace_once(
    'src/squish/SquishSurface.ts',
    '    this.gl.deleteBuffer(this.lineIndexBuffer);\n    this.gl.deleteVertexArray(this.vao);',
    '    this.gl.deleteBuffer(this.lineIndexBuffer);\n    this.gl.deleteTexture(this.shapeTexture);\n    this.gl.deleteVertexArray(this.vao);',
)
replace_once(
    'src/squish/SquishSurface.ts',
    '  private isInsideObject(x: number, y: number): boolean {\n    return Math.abs(x) ** 4 + Math.abs(y) ** 4 <= 0.96;\n  }\n',
    '  private isInsideObject(x: number, y: number): boolean {\n    return isPointInsideShape(this.shape, x, y);\n  }\n\n  private uploadShapeField(shape: ShapeDefinition): void {\n    let field = this.shapeFieldCache.get(shape.id);\n    if (!field) {\n      field = createShapeField(shape, SHAPE_FIELD_SIZE);\n      this.shapeFieldCache.set(shape.id, field);\n    }\n\n    const gl = this.gl;\n    gl.activeTexture(gl.TEXTURE0);\n    gl.bindTexture(gl.TEXTURE_2D, this.shapeTexture);\n    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);\n    gl.texImage2D(\n      gl.TEXTURE_2D,\n      0,\n      gl.R8,\n      SHAPE_FIELD_SIZE,\n      SHAPE_FIELD_SIZE,\n      0,\n      gl.RED,\n      gl.UNSIGNED_BYTE,\n      field,\n    );\n  }\n',
)
replace_once(
    'src/squish/SquishSurface.ts',
    '    gl.useProgram(this.program);\n    gl.uniform2f(this.scaleUniform, this.scaleX, this.scaleY);',
    '    gl.useProgram(this.program);\n    gl.activeTexture(gl.TEXTURE0);\n    gl.bindTexture(gl.TEXTURE_2D, this.shapeTexture);\n    gl.uniform1i(this.shapeFieldUniform, 0);\n    gl.uniform2f(this.scaleUniform, this.scaleX, this.scaleY);',
)

# --- VerticalSliceApp: shape selection and shared geometry ---
replace_once(
    'src/game/VerticalSliceApp.ts',
    "import { SquishyAudio } from './SquishyAudio';",
    "import { SquishyAudio } from './SquishyAudio';\nimport {\n  SHAPES,\n  createShapePath,\n  getShape,\n  isPointInsideShape,\n  type ShapeId,\n} from './shapes';",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    '  private readonly paintShapePath: Path2D;\n',
    '  private paintShapePath: Path2D;\n',
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    '  private readonly discoveryDots: HTMLElement;\n  private readonly colorButtons: readonly HTMLButtonElement[];\n',
    '  private readonly discoveryDots: HTMLElement;\n  private readonly shapeButtons: readonly HTMLButtonElement[];\n  private readonly colorButtons: readonly HTMLButtonElement[];\n',
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "  private selected: VariantChoice = { palette: 'grape', filling: 'smooth' };",
    "  private selected: VariantChoice = { shape: 'soft-square', palette: 'grape', filling: 'smooth' };",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "    this.paintShapePath = this.createPaintShapePath();",
    "    this.paintShapePath = createShapePath(getShape(this.selected.shape), PAINT_CANVAS_SIZE);",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "    this.discoveryDots = this.requireElement<HTMLElement>('.discovery-dots');\n    this.colorButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-palette-choice]'));",
    "    this.discoveryDots = this.requireElement<HTMLElement>('.discovery-dots');\n    this.shapeButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-shape-choice]'));\n    this.colorButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-palette-choice]'));",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "    const paletteButtons = PALETTES.map((palette, index) => `",
    "    const shapeButtons = SHAPES.map((shape, index) => `\n      <button\n        class=\"texture-button shape-button\"\n        type=\"button\"\n        data-shape-choice=\"${shape.id}\"\n        aria-pressed=\"${index === 0 ? 'true' : 'false'}\"\n      >\n        <span>${shape.label}</span>\n      </button>\n    `).join('');\n\n    const paletteButtons = PALETTES.map((palette, index) => `",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    '<main class="lab-shell" data-stage="select" data-palette="grape" data-filling="smooth" data-tested="false" data-shaking="false">',
    '<main class="lab-shell" data-stage="select" data-shape="soft-square" data-palette="grape" data-filling="smooth" data-tested="false" data-shaking="false">',
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    '        <section class="recipe-panel" aria-label="${copy.aria.recipeOptions}">\n          <div class="option-group option-group--palette">',
    '        <section class="recipe-panel" aria-label="${copy.aria.recipeOptions}">\n          <div class="option-group option-group--shape">\n            <span class="option-label">${copy.recipe.shape}</span>\n            <div class="shape-options texture-options" role="group" aria-label="${copy.aria.shapeGroup}">${shapeButtons}</div>\n          </div>\n\n          <div class="option-group option-group--palette">',
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    '            <span class="variant-preview">Lavender Grape · Smooth</span>',
    '            <span class="variant-preview">Soft Cube · Lavender Grape · Smooth</span>',
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    '    this.collectButton.addEventListener(\'click\', () => this.collectResult(), { signal });\n\n    for (const button of this.colorButtons) {',
    "    this.collectButton.addEventListener('click', () => this.collectResult(), { signal });\n\n    for (const button of this.shapeButtons) {\n      button.addEventListener('click', () => {\n        if (this.activityBlocked || this.stage !== 'select') return;\n        const value = button.dataset.shapeChoice;\n        if (!this.isShapeId(value)) return;\n        this.selected = { ...this.selected, shape: value };\n        this.updateSelectionUi();\n      }, { signal });\n    }\n\n    for (const button of this.colorButtons) {",
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    '    const palette = getPalette(this.selected.palette);\n    this.shell.dataset.palette = palette.id;',
    '    const shape = getShape(this.selected.shape);\n    const palette = getPalette(this.selected.palette);\n    this.shell.dataset.shape = shape.id;\n    this.shell.dataset.palette = palette.id;',
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    '    this.variantPreview.textContent = variantLabel(this.selected);\n    this.renderer.setMaterial(palette);\n\n    for (const button of this.colorButtons) {',
    '    this.variantPreview.textContent = variantLabel(this.selected);\n    this.paintShapePath = createShapePath(shape, PAINT_CANVAS_SIZE);\n    this.renderer.setShape(shape);\n    this.renderer.setMaterial(palette);\n\n    for (const button of this.shapeButtons) {\n      button.setAttribute(\'aria-pressed\', String(button.dataset.shapeChoice === this.selected.shape));\n    }\n    for (const button of this.colorButtons) {',
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    '        const px = u * 2 - 1;\n        const py = v * 2 - 1;\n        if (Math.abs(px) ** 4 + Math.abs(py) ** 4 > 0.96) continue;',
    '        const px = u * 2 - 1;\n        const py = v * 2 - 1;\n        if (!isPointInsideShape(getShape(this.selected.shape), px, py)) continue;',
)
start = "  private createPaintShapePath(): Path2D {\n"
end = "  private pointerToPaintUv(clientX: number, clientY: number): { u: number; v: number } {\n"
path = Path('src/game/VerticalSliceApp.ts')
text = path.read_text()
start_index = text.find(start)
end_index = text.find(end)
if start_index < 0 or end_index < 0 or end_index <= start_index:
    raise SystemExit('Unable to locate obsolete paint shape path method')
text = text[:start_index] + text[end_index:]
path.write_text(text)
replace_once(
    'src/game/VerticalSliceApp.ts',
    '  private isInsidePaintShape(u: number, v: number): boolean {\n    const x = u * 2 - 1;\n    const y = v * 2 - 1;\n    return Math.abs(x) ** 4 + Math.abs(y) ** 4 <= 0.96;\n  }',
    '  private isInsidePaintShape(u: number, v: number): boolean {\n    const x = u * 2 - 1;\n    const y = v * 2 - 1;\n    return isPointInsideShape(getShape(this.selected.shape), x, y);\n  }',
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    '      const inside = Math.abs(candidateX) ** 4 + Math.abs(candidateY) ** 4 <= 0.62;\n      const separated = Math.hypot(candidateX - this.moldTargetX, candidateY - this.moldTargetY) >= 0.34;',
    '      const inside = isPointInsideShape(getShape(this.selected.shape), candidateX, candidateY);\n      const separated = Math.hypot(candidateX - this.moldTargetX, candidateY - this.moldTargetY) >= 0.34;',
)
replace_once(
    'src/game/VerticalSliceApp.ts',
    "  private isPaletteId(value: string | undefined): value is PaletteId {\n",
    "  private isShapeId(value: string | undefined): value is ShapeId {\n    return value === 'soft-square' || value === 'heart';\n  }\n\n  private isPaletteId(value: string | undefined): value is PaletteId {\n",
)

# --- CSS: fit the extra bounded selector without introducing a new component system ---
replace_once(
    'src/styles.css',
    '  width: min(calc(100% - 32px), 650px);\n  display: grid;\n  grid-template-columns: auto minmax(210px, 1fr) auto;',
    '  width: min(calc(100% - 32px), 820px);\n  display: grid;\n  grid-template-columns: minmax(150px, auto) auto minmax(210px, 1fr) auto;',
)
replace_once(
    'src/styles.css',
    '  .option-group--texture {\n    min-width: 0;\n  }',
    '  .option-group--shape,\n  .option-group--texture {\n    min-width: 0;\n  }',
)
replace_once(
    'src/styles.css',
    '  .recipe-action {\n    grid-column: 1 / -1;',
    '  .option-group--shape {\n    grid-column: 1 / -1;\n  }\n\n  .recipe-action {\n    grid-column: 1 / -1;',
)
replace_once(
    'src/styles.css',
    '  .option-group--palette {\n    grid-template-columns: auto 1fr;',
    '  .option-group--shape,\n  .option-group--palette {\n    grid-template-columns: auto 1fr;',
)
