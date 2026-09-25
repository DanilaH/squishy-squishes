import Phaser from 'phaser';
import { getMaterial, getPalette, type MaterialId, type PaletteId } from '../../game/content';
import { createShapeField, getShape, type ShapeId } from '../../game/shapes';
import {
  APPEARANCE_TEXTURE_SIZE,
  createEmptyAppearanceDocument,
  getMixInId,
  replayAppearanceDocument,
  type AppearanceDocumentV1,
  type AppearancePoint,
} from '../../sandbox/appearance';
import { renderSurfaceDecor, type DecorDocumentV1 } from '../../sandbox/decor';
import type { SquishFillingStyle, SquishMaterialStyle } from '../../squish/SquishSurface';
import { SquishSimulation, type SquishSimulationSample } from '../../squish/SquishSimulation';
import { fragmentShaderSource, vertexShaderSource } from '../../squish/shaders';
import { PhaserDeformableVolume, pagesVolumeFrontShader } from './PhaserDeformableVolume';

interface GpuResources {
  readonly program: WebGLProgram;
  readonly vao: WebGLVertexArrayObject;
  readonly vertices: WebGLBuffer;
  readonly indices: WebGLBuffer;
  readonly lines: WebGLBuffer;
  readonly shapeField: WebGLTexture;
  readonly appearance: WebGLTexture;
  readonly uniforms: ReadonlyMap<string, WebGLUniformLocation>;
}

const FIELD_SIZE = 128;
const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));
const UNIFORMS = [
  'uScale', 'uMoldProgress', 'uShapeField', 'uAppearanceTexture', 'uAppearanceEnabled',
  'uPointerUv', 'uStrainDirection', 'uColorLow', 'uColorHigh', 'uSheenColor', 'uRimColor',
  'uCompression', 'uPressDepth', 'uFillingAmount', 'uFillingStyle', 'uFillProgress',
  'uMaterialSeed', 'uTranslucency', 'uIridescence', 'uRoughness', 'uMetallic',
  'uPearlescence', 'uCloudiness', 'uWireframePass',
] as const;

const compile = (gl: WebGL2RenderingContext, kind: number, source: string): WebGLShader => {
  const shader = gl.createShader(kind);
  if (!shader) throw new Error('Cannot allocate candidate shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const details = gl.getShaderInfoLog(shader) ?? 'Unknown shader compilation error';
    gl.deleteShader(shader);
    throw new Error(details);
  }
  return shader;
};

const getStyle = (paletteId: PaletteId, materialId: MaterialId): SquishMaterialStyle => {
  const palette = getPalette(paletteId);
  const material = getMaterial(materialId);
  return {
    low: palette.low,
    high: palette.high,
    sheen: palette.sheen,
    rim: palette.rim,
    seed: palette.seed,
    translucency: material.translucency,
    iridescence: material.iridescence,
    roughness: material.roughness,
    metallic: material.metallic,
    pearlescence: material.pearlescence,
    cloudiness: material.cloudiness,
  };
};

/** Phaser owns the WebGL2 context and frame clock. The old and new renderers share SquishSimulation. */
export class PhaserSquishCandidate extends Phaser.GameObjects.Extern {
  private readonly simulation = new SquishSimulation(getShape('soft-square'), performance.now());
  private readonly packed = new Float32Array(this.simulation.vertices.length * 4);
  private readonly shapeFields = new Map<ShapeId, Uint8Array>();
  private readonly appearanceCanvas = document.createElement('canvas');
  private readonly appearanceContext: CanvasRenderingContext2D;
  private appearanceDocument: AppearanceDocumentV1 | null = null;
  private decorDocument: DecorDocumentV1 | null = null;
  private appearanceEnabled = false;
  private appearanceRevision = 0;
  private uploadedAppearanceRevision = -1;
  private gpu: GpuResources | null = null;
  private volume: PhaserDeformableVolume | null = null;
  private shapeId: ShapeId = 'soft-square';
  private paletteId: PaletteId = 'milk';
  private materialId: MaterialId = 'soft';
  private materialStyle: SquishMaterialStyle | null = null;
  private fillingAmount = 0;
  private fillingStyle = 0;
  private fillProgress = 1;
  private moldProgress = 1;
  private wireframe = false;
  private activePointer: number | null = null;
  private drawCalls = 0;
  private disposed = false;
  private lastReleaseEnergy = 0;
  private renderRadiusRatio = 0.34;

  public constructor(scene: Phaser.Scene, private readonly gl: WebGL2RenderingContext, private readonly pagesVolume = false) {
    super(scene);
    this.appearanceCanvas.width = APPEARANCE_TEXTURE_SIZE;
    this.appearanceCanvas.height = APPEARANCE_TEXTURE_SIZE;
    const context = this.appearanceCanvas.getContext('2d');
    if (!context) throw new Error('Cannot create the canonical appearance surface');
    this.appearanceContext = context;
  }

  public setShape(id: ShapeId): void {
    if (this.shapeId === id) return;
    this.cancel();
    this.shapeId = id;
    this.simulation.setShape(getShape(id));
    if (this.gpu) this.uploadShapeField(this.gpu);
    if (this.decorDocument) this.bakeAppearance();
  }

  public setPalette(id: PaletteId): void { this.paletteId = id; this.materialStyle = null; }
  public setMaterial(id: MaterialId): void { this.materialId = id; this.materialStyle = null; }
  /** The actual SandboxApp passes the complete original material style, not a guessed preset. */
  public setMaterialStyle(style: SquishMaterialStyle): void { this.materialStyle = style; }
  public setFillingAmount(amount: number): void { this.fillingAmount = clamp01(amount); }
  public setFillingStyle(style: SquishFillingStyle): void {
    this.fillingStyle = style === 'pearl' ? 2 : style === 'foam' ? 1 : 0;
  }
  public setFillProgress(progress: number): void { this.fillProgress = clamp01(progress); }
  public setMoldProgress(progress: number): void { this.moldProgress = clamp01(progress); }
  public setWireframe(enabled: boolean): void { this.wireframe = enabled; }
  public setRenderRadiusRatio(value: number): void {
    this.renderRadiusRatio = Math.min(0.42, Math.max(0.20, Number.isFinite(value) ? value : 0.34));
  }
  public resetTiming(): void { this.simulation.resetTiming(performance.now()); }

  private radius(): number {
    const { width, height } = this.scene.scale;
    return Math.max(1, Math.min(width, height) * this.renderRadiusRatio);
  }

  /** One canonical UV transform for the Extern and the studio input bridge. */
  private localPoint(x: number, y: number): { x: number; y: number } {
    const { width, height } = this.scene.scale;
    const radius = this.radius();
    return { x: (x - width / 2) / radius, y: (height / 2 - y) / radius };
  }

  public pointToUv(x: number, y: number): AppearancePoint | null {
    if (this.disposed) return null;
    const point = this.localPoint(x, y);
    return this.simulation.pointToUv(point.x, point.y);
  }

  public pointToAppearanceUv(x: number, y: number): AppearancePoint | null {
    if (this.disposed) return null;
    const point = this.localPoint(x, y);
    if (Math.abs(point.x) > 1 || Math.abs(point.y) > 1) return null;
    return { u: clamp01(point.x * 0.5 + 0.5), v: clamp01(point.y * 0.5 + 0.5) };
  }

  public projectUvToCanvas(u: number, v: number): { x: number; y: number } {
    const { width, height } = this.scene.scale;
    const radius = this.radius();
    const point = this.simulation.projectUvToLocal(u, v);
    return { x: width / 2 + point.x * radius, y: height / 2 - point.y * radius };
  }

  /** Same replay pipeline as SandboxApp; no new appearance or decor format. */
  public setAppearanceDocuments(appearance: AppearanceDocumentV1 | null, decor: DecorDocumentV1 | null): void {
    if (this.disposed) return;
    this.appearanceDocument = appearance;
    this.decorDocument = decor;
    this.bakeAppearance();
  }

  /** Accepts SandboxApp's already-baked offscreen canvas, avoiding a second document/replay path. */
  public setAppearanceCanvas(source: HTMLCanvasElement | null): void {
    if (this.disposed) return;
    this.appearanceDocument = null;
    this.decorDocument = null;
    this.appearanceContext.clearRect(0, 0, APPEARANCE_TEXTURE_SIZE, APPEARANCE_TEXTURE_SIZE);
    this.appearanceEnabled = source !== null;
    if (source) this.appearanceContext.drawImage(source, 0, 0, APPEARANCE_TEXTURE_SIZE, APPEARANCE_TEXTURE_SIZE);
    this.appearanceRevision += 1;
  }

  private bakeAppearance(): void {
    replayAppearanceDocument(this.appearanceContext, this.appearanceDocument ?? createEmptyAppearanceDocument(), {
      excludeMixIns: ['pearls'],
    });
    if (this.decorDocument) renderSurfaceDecor(this.appearanceContext, this.decorDocument, getShape(this.shapeId));
    const appearance = this.appearanceDocument;
    const decor = this.decorDocument;
    this.appearanceEnabled = Boolean(
      appearance?.strokes.length || appearance?.mixins.some((item) => getMixInId(item) !== 'pearls') ||
      decor?.eyes || decor?.mouth || decor?.blush || decor?.stickers.length,
    );
    this.appearanceRevision += 1;
  }

  public begin(pointer: Phaser.Input.Pointer): boolean {
    if (this.disposed || this.activePointer !== null) return false;
    const point = this.localPoint(pointer.x, pointer.y);
    if (!this.simulation.begin(pointer.id, point.x, point.y)) return false;
    this.activePointer = pointer.id;
    return true;
  }

  public move(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.activePointer) return;
    const point = this.localPoint(pointer.x, pointer.y);
    this.simulation.move(pointer.id, point.x, point.y);
  }

  public end(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.activePointer) return;
    this.lastReleaseEnergy = this.simulation.end(pointer.id) ?? 0;
    this.activePointer = null;
  }

  public cancel(): void {
    this.activePointer = null;
    this.simulation.cancel();
  }

  /** The only animation clock is Phaser's Scene.update. */
  public advance(deltaMs: number, nowMs: number): void {
    if (!this.disposed) this.simulation.advance(deltaMs, nowMs);
  }

  private uploadShapeField(gpu: GpuResources): void {
    const gl = this.gl;
    let field = this.shapeFields.get(this.shapeId);
    if (!field) {
      field = createShapeField(getShape(this.shapeId), FIELD_SIZE);
      this.shapeFields.set(this.shapeId, field);
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gpu.shapeField);
    const previousAlignment = gl.getParameter(gl.UNPACK_ALIGNMENT) as number;
    const previousFlip = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL) as boolean;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, FIELD_SIZE, FIELD_SIZE, 0, gl.RED, gl.UNSIGNED_BYTE, field);
    } finally {
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, previousAlignment);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, previousFlip ? 1 : 0);
    }
  }

  private uploadAppearance(gpu: GpuResources): void {
    if (this.uploadedAppearanceRevision === this.appearanceRevision) return;
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, gpu.appearance);
    if (!this.appearanceEnabled) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    } else {
      const previousFlip = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL) as boolean;
      const previousPremultiply = gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL) as boolean;
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.appearanceCanvas);
      } finally {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, previousFlip ? 1 : 0);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, previousPremultiply ? 1 : 0);
      }
    }
    gl.activeTexture(gl.TEXTURE0);
    this.uploadedAppearanceRevision = this.appearanceRevision;
  }

  private createGpu(): GpuResources {
    const gl = this.gl;
    const vertexShader = compile(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, this.pagesVolume ? pagesVolumeFrontShader : fragmentShaderSource);
    const program = gl.createProgram();
    if (!program) throw new Error('Cannot allocate Phaser candidate program');
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const details = gl.getProgramInfoLog(program) ?? 'Unknown shader link error';
      gl.deleteProgram(program);
      throw new Error(details);
    }
    const vao = gl.createVertexArray();
    const vertices = gl.createBuffer();
    const indices = gl.createBuffer();
    const lines = gl.createBuffer();
    const shapeField = gl.createTexture();
    const appearance = gl.createTexture();
    if (!vao || !vertices || !indices || !lines || !shapeField || !appearance) {
      gl.deleteProgram(program);
      throw new Error('Cannot allocate candidate GPU resources');
    }
    const uniforms = new Map<string, WebGLUniformLocation>();
    for (const name of UNIFORMS) {
      const location = gl.getUniformLocation(program, name);
      if (location === null) throw new Error(`Missing original GLSL uniform: ${name}`);
      uniforms.set(name, location);
    }
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
    gl.bufferData(gl.ARRAY_BUFFER, this.packed.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.simulation.triangleIndices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lines);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.simulation.lineIndices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, shapeField);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, appearance);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const gpu = { program, vao, vertices, indices, lines, shapeField, appearance, uniforms };
    this.uploadShapeField(gpu);
    this.uploadedAppearanceRevision = -1;
    this.uploadAppearance(gpu);
    return gpu;
  }

  public override render(renderer: Phaser.Renderer.WebGL.WebGLRenderer): void {
    if (this.disposed) return;
    if (renderer.gl !== this.gl) throw new Error('Candidate needs the Phaser-owned WebGL2 context');
    const gl = this.gl;
    this.gpu ??= this.createGpu();
    const gpu = this.gpu;
    this.uploadAppearance(gpu);
    const material = this.materialStyle ?? getStyle(this.paletteId, this.materialId);
    const sample = this.simulation.snapshot();
    for (let index = 0; index < this.simulation.vertices.length; index += 1) {
      const vertex = this.simulation.vertices[index]!;
      const offset = index * 4;
      this.packed[offset] = vertex.x;
      this.packed[offset + 1] = vertex.y;
      this.packed[offset + 2] = vertex.u;
      this.packed[offset + 3] = vertex.v;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindBuffer(gl.ARRAY_BUFFER, gpu.vertices);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.packed);
    gl.useProgram(gpu.program);
    const u = (name: typeof UNIFORMS[number]): WebGLUniformLocation => gpu.uniforms.get(name)!;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gpu.shapeField);
    gl.uniform1i(u('uShapeField'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, gpu.appearance);
    gl.uniform1i(u('uAppearanceTexture'), 1);
    gl.uniform1i(u('uAppearanceEnabled'), this.appearanceEnabled ? 1 : 0);
    const { width, height } = this.scene.scale;
    const radius = this.radius();
    gl.uniform2f(u('uScale'), radius * 2 / width, radius * 2 / height);
    gl.uniform1f(u('uMoldProgress'), this.moldProgress);
    gl.uniform2f(u('uPointerUv'), clamp01(sample.sheenX * 0.5 + 0.5), clamp01(sample.sheenY * 0.5 + 0.5));
    gl.uniform2f(u('uStrainDirection'), sample.gestureX, sample.gestureY);
    gl.uniform1f(u('uCompression'), sample.compression);
    gl.uniform1f(u('uPressDepth'), sample.pressDepth);
    gl.uniform3f(u('uColorLow'), ...material.low);
    gl.uniform3f(u('uColorHigh'), ...material.high);
    gl.uniform3f(u('uSheenColor'), ...material.sheen);
    gl.uniform3f(u('uRimColor'), ...material.rim);
    gl.uniform1f(u('uFillingAmount'), this.fillingAmount);
    gl.uniform1f(u('uFillingStyle'), this.fillingStyle);
    gl.uniform1f(u('uFillProgress'), this.fillProgress);
    gl.uniform1f(u('uMaterialSeed'), material.seed);
    gl.uniform1f(u('uTranslucency'), material.translucency);
    gl.uniform1f(u('uIridescence'), material.iridescence);
    gl.uniform1f(u('uRoughness'), material.roughness);
    gl.uniform1f(u('uMetallic'), material.metallic);
    gl.uniform1f(u('uPearlescence'), material.pearlescence);
    gl.uniform1f(u('uCloudiness'), material.cloudiness);
    gl.uniform1i(u('uWireframePass'), 0);
    gl.bindVertexArray(gpu.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpu.indices);
    gl.drawElements(gl.TRIANGLES, this.simulation.triangleIndices.length, gl.UNSIGNED_SHORT, 0);
    if (this.pagesVolume && !this.wireframe && this.fillProgress >= 0.999 && this.moldProgress > 0.85) {
      this.volume ??= new PhaserDeformableVolume(gl);
      const radius = this.radius();
      this.volume.render(this.simulation, getShape(this.shapeId), material, gpu.appearance,
        this.appearanceEnabled, radius * 2 / this.scene.scale.width,
        radius * 2 / this.scene.scale.height, this.moldProgress, sample.compression);
    }
    if (this.wireframe) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpu.lines);
      gl.uniform1i(u('uWireframePass'), 1);
      gl.drawElements(gl.LINES, this.simulation.lineIndices.length, gl.UNSIGNED_SHORT, 0);
    }
    gl.bindVertexArray(null);
    gl.activeTexture(gl.TEXTURE0);
    this.drawCalls += 1;
  }

  public snapshot(): {
    drawCalls: number; squeezes: number; active: boolean; canvasCount: number; renderer: string;
    releaseEnergy: number; appearanceEnabled: boolean; appearanceRevision: number;
  } {
    return {
      drawCalls: this.drawCalls,
      squeezes: this.simulation.snapshot().squeezes,
      active: this.simulation.snapshot().active,
      canvasCount: document.querySelectorAll('#phaser-candidate-stage canvas').length,
      renderer: 'phaser-extern-shared-simulation-webgl2',
      releaseEnergy: this.lastReleaseEnergy,
      appearanceEnabled: this.appearanceEnabled,
      appearanceRevision: this.appearanceRevision,
    };
  }

  /** The real studio uses the same public metrics sample as the raw renderer. */
  public metricsSample(): SquishSimulationSample { return this.simulation.snapshot(); }

  public forgetLostContext(): void {
    this.volume?.dispose();
    this.volume = null;
    this.gpu = null;
    this.uploadedAppearanceRevision = -1;
    this.cancel();
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.cancel();
    const gpu = this.gpu;
    this.volume?.dispose();
    this.volume = null;
    this.gpu = null;
    if (!gpu || this.gl.isContextLost()) return;
    this.gl.deleteBuffer(gpu.vertices);
    this.gl.deleteBuffer(gpu.indices);
    this.gl.deleteBuffer(gpu.lines);
    this.gl.deleteTexture(gpu.shapeField);
    this.gl.deleteTexture(gpu.appearance);
    this.gl.deleteVertexArray(gpu.vao);
    this.gl.deleteProgram(gpu.program);
  }
}
