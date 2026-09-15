import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/sandbox/SandboxApp.ts';
let app = readFileSync(path, 'utf8');
app = app.replace(
  "import { hasSurfaceDecor, renderSurfaceDecor } from './decor';",
  "import { drawAccessoryGraphic, getDecorFrame, hasSurfaceDecor, renderSurfaceDecor } from './decor';",
);
app = app.replace(
  "  private readonly canvas: HTMLCanvasElement;\n  private readonly stageTitle: HTMLElement;",
  "  private readonly canvas: HTMLCanvasElement;\n  private readonly accessoryCanvas: HTMLCanvasElement;\n  private readonly accessoryContext: CanvasRenderingContext2D;\n  private readonly stageTitle: HTMLElement;",
);
app = app.replace(
  "  private uploadFrame = 0;\n  private muted = false;",
  "  private uploadFrame = 0;\n  private accessoryFrame = 0;\n  private accessoryRestU = 0;\n  private accessoryRestV = 0;\n  private muted = false;",
);
app = app.replace(
  "    this.canvas = this.requireElement<HTMLCanvasElement>('[data-sandbox-canvas]');\n    this.stageTitle",
  "    this.canvas = this.requireElement<HTMLCanvasElement>('[data-sandbox-canvas]');\n    this.accessoryCanvas = this.requireElement<HTMLCanvasElement>('[data-sandbox-accessory]');\n    this.accessoryCanvas.width = 180;\n    this.accessoryCanvas.height = 120;\n    const accessoryContext = this.accessoryCanvas.getContext('2d');\n    if (!accessoryContext) throw new Error('Sandbox accessory overlay requires Canvas 2D.');\n    this.accessoryContext = accessoryContext;\n    this.stageTitle",
);
app = app.replace(
  "    if (this.uploadFrame !== 0) cancelAnimationFrame(this.uploadFrame);\n    this.abortController.abort();",
  "    if (this.uploadFrame !== 0) cancelAnimationFrame(this.uploadFrame);\n    if (this.accessoryFrame !== 0) cancelAnimationFrame(this.accessoryFrame);\n    this.abortController.abort();",
);
app = app.replace(
  "          <div class=\"sandbox-glow\" aria-hidden=\"true\"></div>\n          <canvas class=\"sandbox-canvas\" data-sandbox-canvas aria-label=\"Squishy\"></canvas>",
  "          <div class=\"sandbox-glow\" aria-hidden=\"true\"></div>\n          <canvas class=\"sandbox-accessory-layer\" data-sandbox-accessory aria-hidden=\"true\" hidden></canvas>\n          <canvas class=\"sandbox-canvas\" data-sandbox-canvas aria-label=\"Squishy\"></canvas>",
);
app = app.replace(
  "    this.shell.dataset.material = this.draft.materialId;\n  }",
  "    this.shell.dataset.material = this.draft.materialId;\n    this.refreshAccessoryGraphic();\n  }",
);
const insertAnchor = "  private applyMaterial(materialId: MaterialId): void {";
const methods = `  private refreshAccessoryGraphic(): void {\n    const accessory = this.draft.decor.accessory;\n    this.accessoryRestU = 0;\n    this.accessoryRestV = 0;\n    if (!accessory) {\n      this.accessoryCanvas.hidden = true;\n      this.accessoryCanvas.removeAttribute('data-accessory-id');\n      if (this.accessoryFrame !== 0) cancelAnimationFrame(this.accessoryFrame);\n      this.accessoryFrame = 0;\n      return;\n    }\n    this.accessoryCanvas.hidden = false;\n    this.accessoryCanvas.dataset.accessoryId = accessory;\n    drawAccessoryGraphic(this.accessoryContext, accessory, this.accessoryCanvas.width, this.accessoryCanvas.height);\n    if (this.accessoryFrame === 0) this.accessoryFrame = requestAnimationFrame(this.updateAccessoryOverlay);\n  }\n\n  private readonly updateAccessoryOverlay = (): void => {\n    if (this.disposed || !this.draft.decor.accessory) {\n      this.accessoryFrame = 0;\n      return;\n    }\n    const frame = getDecorFrame(getShape(this.draft.shapeId));\n    const anchor = this.renderer.projectUvToCanvas(frame.headAnchor.u, frame.headAnchor.v);\n    const right = this.renderer.projectUvToCanvas(frame.headAnchor.u + frame.headBasisU, frame.headAnchor.v);\n    const down = this.renderer.projectUvToCanvas(frame.headAnchor.u, frame.headAnchor.v - frame.headBasisV);\n    const basisU = { x: right.x - anchor.x, y: right.y - anchor.y };\n    const basisV = { x: down.x - anchor.x, y: down.y - anchor.y };\n    const lengthU = Math.max(0.001, Math.hypot(basisU.x, basisU.y));\n    const lengthV = Math.max(0.001, Math.hypot(basisV.x, basisV.y));\n    if (this.accessoryRestU <= 0) this.accessoryRestU = lengthU;\n    if (this.accessoryRestV <= 0) this.accessoryRestV = lengthV;\n    const clampRatio = (value: number): number => Math.min(1.35, Math.max(0.72, value));\n    const ratioU = clampRatio(lengthU / this.accessoryRestU);\n    const ratioV = clampRatio(lengthV / this.accessoryRestV);\n    const normUx = basisU.x / lengthU;\n    const normUy = basisU.y / lengthU;\n    const normVx = basisV.x / lengthV;\n    const normVy = basisV.y / lengthV;\n    const a = normUx * ratioU;\n    const b = normUy * ratioU;\n    const c = normVx * ratioV;\n    const d = normVy * ratioV;\n    const canvasRect = this.canvas.getBoundingClientRect();\n    const stageRect = this.canvas.parentElement?.getBoundingClientRect();\n    if (stageRect) {\n      const anchorX = canvasRect.left - stageRect.left + anchor.x;\n      const anchorY = canvasRect.top - stageRect.top + anchor.y;\n      const width = this.accessoryCanvas.offsetWidth || 160;\n      const height = this.accessoryCanvas.offsetHeight || 107;\n      this.accessoryCanvas.style.left = \\`${'${anchorX - width * 0.5}'}px\\`;\n      this.accessoryCanvas.style.top = \\`${'${anchorY - height * 0.92}'}px\\`;\n      this.accessoryCanvas.style.transform = \\`matrix(${'${a.toFixed(4)}'},${'${b.toFixed(4)}'},${'${c.toFixed(4)}'},${'${d.toFixed(4)}'},0,0)\\`;\n      this.accessoryCanvas.dataset.accessoryAnchorX = anchorX.toFixed(2);\n      this.accessoryCanvas.dataset.accessoryAnchorY = anchorY.toFixed(2);\n      this.accessoryCanvas.dataset.accessoryMatrix = \\`${'${a.toFixed(4)}'},${'${b.toFixed(4)}'},${'${c.toFixed(4)}'},${'${d.toFixed(4)}'}\\`;\n    }\n    this.accessoryFrame = requestAnimationFrame(this.updateAccessoryOverlay);\n  };\n\n`;
if (!app.includes(insertAnchor)) throw new Error('SandboxApp accessory method anchor missing');
app = app.replace(insertAnchor, methods + insertAnchor);
writeFileSync(path, app);

const cssPath = 'src/sandbox-core.css';
let css = readFileSync(cssPath, 'utf8');
const cssAnchor = `.sandbox-canvas {\n  position: relative;`;
const accessoryCss = `.sandbox-accessory-layer {\n  position: absolute;\n  z-index: 1;\n  width: 160px;\n  height: 107px;\n  display: block;\n  pointer-events: none;\n  transform-origin: 50% 92%;\n  will-change: left, top, transform;\n}\n\n`;
if (!css.includes('.sandbox-accessory-layer {')) {
  if (!css.includes(cssAnchor)) throw new Error('sandbox-core.css canvas anchor missing');
  css = css.replace(cssAnchor, accessoryCss + `.sandbox-canvas {\n  position: relative;`);
  css = css.replace('  z-index: 1;\n  width: min(82vw, 430px);', '  z-index: 2;\n  width: min(82vw, 430px);');
}
writeFileSync(cssPath, css);
