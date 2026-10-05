import { moldFactors, containClipAxis } from '../../squish/projection';
import { REST_TOY, posePoint, unposePoint, type ToyPose } from '../../sandbox/livingToy';
import Phaser from 'phaser';
import { hasShapeRelief } from '../../sandbox/shapeRelief';
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
import { getPagesVolumeFrontShader, PhaserDeformableVolume } from './PhaserDeformableVolume';

interface GpuResources {
  readonly program: WebGLProgram;
  readonly vao: WebGLVertexArrayObject;
  readonly vertices: WebGLBuffer;
  readonly indices: WebGLBuffer;
  readonly lines: WebGLBuffer;
  readonly shapeField: WebGLTexture;
  readonly appearance: WebGLTexture;
  readonly face: WebGLTexture | null;
  readonly inclusion: WebGLTexture | null;
  readonly inclusionTextureUniform: WebGLUniformLocation | null;
  readonly inclusionEnabledUniform: WebGLUniformLocation | null;
  readonly faceTextureUniform: WebGLUniformLocation | null;
  readonly faceEnabledUniform: WebGLUniformLocation | null;
  readonly uniforms: ReadonlyMap<string, WebGLUniformLocation>;
}

const FIELD_SIZE = 128;
const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));
const UNIFORMS = [
  'uScale', 'uMoldProgress', 'uShapeField', 'uAppearanceTexture', 'uAppearanceEnabled',
  'uFillingDrift', 'uPointerUv', 'uStrainDirection', 'uColorLow', 'uColorHigh', 'uSheenColor', 'uRimColor',
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
  private frameSample = this.simulation.snapshot();
  private readonly packed = new Float32Array(this.simulation.vertices.length * 4);
  private readonly shapeFields = new Map<ShapeId, Uint8Array>();
  private readonly appearanceCanvas = document.createElement('canvas');
  private readonly appearanceContext: CanvasRenderingContext2D;
  private readonly faceCanvas = document.createElement('canvas');
  private readonly faceContext: CanvasRenderingContext2D;
  private readonly inclusionCanvas = document.createElement('canvas');
  private inclusionEnabled = false;
  private inclusionRevision = 0;
  private uploadedInclusionRevision = -1;
  private appearanceDocument: AppearanceDocumentV1 | null = null;
  private decorDocument: DecorDocumentV1 | null = null;
  private appearanceEnabled = false;
  private appearanceRevision = 0;
  private uploadedAppearanceRevision = -1;
  private faceEnabled = false;
  private faceRevision = 0;
  private uploadedFaceRevision = -1;
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
  private pokeEnabled = false;
  private pose: ToyPose = REST_TOY;
  private fillingDrift = { x: 0, y: 0 };
  public setPresentation(pose: ToyPose, x = 0, y = 0): void { this.pose = pose; this.fillingDrift = { x, y }; }
  private drawCalls = 0;
  private disposed = false;
  private lastReleaseEnergy = 0;
  private renderRadiusRatio = 0.34;
  /** Local simulation-space render offset; positive Y points upward. */
  private renderCenterOffsetY = 0;

  public constructor(scene: Phaser.Scene, private readonly gl: WebGL2RenderingContext, private readonly pagesVolume = false) {
    super(scene);
    this.appearanceCanvas.width = APPEARANCE_TEXTURE_SIZE;
    this.appearanceCanvas.height = APPEARANCE_TEXTURE_SIZE;
    const context = this.appearanceCanvas.getContext('2d');
    if (!context) throw new Error('Cannot create the canonical appearance surface');
    this.appearanceContext = context;
    this.faceCanvas.width = APPEARANCE_TEXTURE_SIZE;
    this.faceCanvas.height = APPEARANCE_TEXTURE_SIZE;
    const faceContext = this.faceCanvas.getContext('2d');
    if (!faceContext) throw new Error('Cannot create the clean face surface');
    this.faceContext = faceContext;
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
  public setMaterial(id: MaterialId): void { this.materialId = id; this.materialStyle = null; this.simulation.setTactileFeatures(this.pokeEnabled, id); }
  /** The actual SandboxApp passes the complete original material style, not a guessed preset. */
  public setMaterialStyle(style: SquishMaterialStyle): void {
    this.materialStyle = style;
    this.simulation.setTactileFeatures(this.pokeEnabled, style.materialId);
  }
  public setFillingAmount(amount: number): void { this.fillingAmount = clamp01(amount); }
  public setFillingStyle(style: SquishFillingStyle): void {
    this.fillingStyle = style === 'pearl' ? 2 : style === 'foam' ? 1 : 0;
  }
  public setFillProgress(progress: number): void { this.fillProgress = clamp01(progress); }
  public setMoldProgress(progress: number): void { this.moldProgress = clamp01(progress); }
  public setWireframe(enabled: boolean): void { this.wireframe = enabled; }
  public setRenderRadiusRatio(value: number): void {
    this.renderRadiusRatio = Math.min(0.42, Math.max(0.10, Number.isFinite(value) ? value : 0.34));
  }
  public setRenderCenterOffsetY(value: number): void {
    this.renderCenterOffsetY = Math.min(0.30, Math.max(-0.30, Number.isFinite(value) ? value : 0));
  }
  public setViewportFollowEnabled(enabled: boolean): void {
    this.simulation.setViewportFollowEnabled(this.pagesVolume && enabled);
  }
  public setPokeEnabled(enabled: boolean): void {
    this.pokeEnabled = this.pagesVolume && enabled;
    this.simulation.setTactileFeatures(this.pokeEnabled, this.materialStyle?.materialId ?? this.materialId);
  }
  public recenterViewportFollow(): void {
    if (this.pagesVolume) this.simulation.recenterViewportFollow();
  }
  public viewportFollowOffset(): { readonly x: number; readonly y: number } {
    return this.simulation.viewportFollowOffset();
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
    const mold = moldFactors(this.moldProgress);
    return {
      x: (x - width / 2) / radius / mold.x,
      y: ((height / 2 - y) / radius + mold.offsetY) / mold.y - this.renderCenterOffsetY,
    };
  }

  public pointToUv(x: number, y: number): AppearancePoint | null {
    if (this.disposed) return null;
    const point = this.localPoint(x, y);
    const hit = unposePoint(point.x, point.y, this.pose);
    return this.simulation.pointToUv(hit.x, hit.y);
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
    const local = this.simulation.projectUvToLocal(u, v);
    const point = posePoint(local.x, local.y, this.pose);
    const mold = moldFactors(this.moldProgress);
    return {
      x: width / 2 + containClipAxis(point.x * mold.x * radius * 2 / width) * width / 2,
      y: height / 2 - containClipAxis(((point.y + this.renderCenterOffsetY) * mold.y - mold.offsetY) * radius * 2 / height) * height / 2,
    };
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

  public setInclusionCanvas(source: HTMLCanvasElement | null): void {
    this.inclusionCanvas.width = APPEARANCE_TEXTURE_SIZE;
    this.inclusionCanvas.height = APPEARANCE_TEXTURE_SIZE;
    if (source) this.inclusionCanvas.getContext('2d')?.drawImage(source, 0, 0);
    this.inclusionEnabled = source !== null;
    this.inclusionRevision += 1;
  }

  public setFaceCanvas(source: HTMLCanvasElement | null): void {
    if (this.disposed) return;
    this.faceContext.clearRect(0, 0, APPEARANCE_TEXTURE_SIZE, APPEARANCE_TEXTURE_SIZE);
    this.faceEnabled = source !== null;
    if (source) this.faceContext.drawImage(source, 0, 0, APPEARANCE_TEXTURE_SIZE, APPEARANCE_TEXTURE_SIZE);
    this.faceRevision += 1;
  }

  private bakeAppearance(): void {
    replayAppearanceDocument(this.appearanceContext, this.appearanceDocument ?? createEmptyAppearanceDocument(), {
      excludeMixIns: ['pearls'],
      shapeId: this.shapeId,
    });
    if (this.decorDocument) renderSurfaceDecor(this.appearanceContext, this.decorDocument, getShape(this.shapeId));
    const appearance = this.appearanceDocument;
    const decor = this.decorDocument;
    this.appearanceEnabled = Boolean(
      appearance?.strokes.length || appearance?.mixins.some((item) => getMixInId(item) !== 'pearls') ||
      decor?.eyes || decor?.mouth || decor?.blush || decor?.stickers.length || hasShapeRelief(this.shapeId),
    );
    this.appearanceRevision += 1;
  }

  public beginAt(pointerId: number, canvasX: number, canvasY: number): boolean {
    if (this.disposed) return false;
    const point = this.localPoint(canvasX, canvasY);
    const hit = unposePoint(point.x, point.y, this.pose);
    if (!this.simulation.begin(pointerId, hit.x, hit.y)) return false;
    this.pose = REST_TOY;
    return true;
  }

  public moveAt(pointerId: number, canvasX: number, canvasY: number): void {
    const point = this.localPoint(canvasX, canvasY);
    this.simulation.move(pointerId, point.x, point.y);
  }

  public endById(pointerId: number): void {
    this.lastReleaseEnergy = this.simulation.end(pointerId, this.pokeEnabled) ?? 0;
  }

  public begin(pointer: Phaser.Input.Pointer): boolean { return this.beginAt(pointer.id, pointer.x, pointer.y); }
  public move(pointer: Phaser.Input.Pointer): void { this.moveAt(pointer.id, pointer.x, pointer.y); }
  public end(pointer: Phaser.Input.Pointer): void { this.endById(pointer.id); }

  public cancel(): void {
    this.simulation.cancel();
  }

  /** The only animation clock is Phaser's Scene.update. */
  public advance(deltaMs: number, nowMs: number): void {
    if (!this.disposed) this.frameSample = this.simulation.advance(deltaMs, nowMs);
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

  private uploadFace(gpu: GpuResources): void {
    if (!this.pagesVolume || !gpu.face || !gpu.faceTextureUniform || !gpu.faceEnabledUniform
      || this.uploadedFaceRevision === this.faceRevision) return;
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, gpu.face);
    if (!this.faceEnabled) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    } else {
      const previousFlip = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL) as boolean;
      const previousPremultiply = gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL) as boolean;
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.faceCanvas);
      } finally {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, previousFlip ? 1 : 0);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, previousPremultiply ? 1 : 0);
      }
    }
    gl.activeTexture(gl.TEXTURE0);
    this.uploadedFaceRevision = this.faceRevision;
  }

  private uploadInclusion(gpu: GpuResources): void {
    if (!this.pagesVolume || !gpu.inclusion || !gpu.inclusionTextureUniform || !gpu.inclusionEnabledUniform
      || this.uploadedInclusionRevision === this.inclusionRevision) return;
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, gpu.inclusion);
    if (!this.inclusionEnabled) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    } else {
      const previousFlip = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL) as boolean;
      const previousPremultiply = gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL) as boolean;
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.inclusionCanvas);
      } finally {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, previousFlip ? 1 : 0);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, previousPremultiply ? 1 : 0);
      }
    }
    gl.activeTexture(gl.TEXTURE0);
    this.uploadedInclusionRevision = this.inclusionRevision;
  }

  private createGpu(): GpuResources {
    const gl = this.gl;
    const vertexShader = compile(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, this.pagesVolume ? getPagesVolumeFrontShader() : fragmentShaderSource);
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
    const face = this.pagesVolume ? gl.createTexture() : null;
    const inclusion = this.pagesVolume ? gl.createTexture() : null;
    if (!vao || !vertices || !indices || !lines || !shapeField || !appearance || (this.pagesVolume && (!face || !inclusion))) {
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
    let faceTextureUniform: WebGLUniformLocation | null = null;
    let faceEnabledUniform: WebGLUniformLocation | null = null;
    if (this.pagesVolume && face) {
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, face);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      faceTextureUniform = gl.getUniformLocation(program, 'uFaceTexture');
      faceEnabledUniform = gl.getUniformLocation(program, 'uFaceEnabled');
      if (!faceTextureUniform || !faceEnabledUniform) throw new Error('Missing clean face uniforms');
    }
    let inclusionTextureUniform: WebGLUniformLocation | null = null;
    let inclusionEnabledUniform: WebGLUniformLocation | null = null;
    if (inclusion) {
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, inclusion);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      inclusionTextureUniform = gl.getUniformLocation(program, 'uInclusionTexture');
      inclusionEnabledUniform = gl.getUniformLocation(program, 'uInclusionEnabled');
      if (!inclusionTextureUniform || !inclusionEnabledUniform) throw new Error('Missing inclusion uniforms');
    }
    const gpu = { program, vao, vertices, indices, lines, shapeField, appearance, face, inclusion,
      inclusionTextureUniform, inclusionEnabledUniform, faceTextureUniform, faceEnabledUniform, uniforms };
    this.uploadShapeField(gpu);
    this.uploadedAppearanceRevision = -1;
    this.uploadAppearance(gpu);
    this.uploadedFaceRevision = -1;
    this.uploadedInclusionRevision = -1;
    this.uploadFace(gpu);
    this.uploadInclusion(gpu);
    return gpu;
  }

  public override render(renderer: Phaser.Renderer.WebGL.WebGLRenderer): void {
    if (this.disposed) return;
    if (renderer.gl !== this.gl) throw new Error('Candidate needs the Phaser-owned WebGL2 context');
    const gl = this.gl;
    this.gpu ??= this.createGpu();
    const gpu = this.gpu;
    this.uploadAppearance(gpu);
    this.uploadFace(gpu);
    this.uploadInclusion(gpu);
    const material = this.materialStyle ?? getStyle(this.paletteId, this.materialId);
    const sample = this.simulation.snapshot();
    for (let index = 0; index < this.simulation.vertices.length; index += 1) {
      const vertex = this.simulation.vertices[index]!;
      const offset = index * 4;
      const point = posePoint(vertex.x, vertex.y, this.pose);
      this.packed[offset] = point.x;
      this.packed[offset + 1] = point.y + this.renderCenterOffsetY;
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
    const { width, height } = this.scene.scale;
    const radius = this.radius();
    if (this.pagesVolume && !this.wireframe && this.fillProgress >= 0.999 && this.moldProgress > 0.85) {
      // Sidewall is backing geometry. Draw it first so contour folds can never
      // smear side UVs across the visible front under a strong pull.
      this.volume ??= new PhaserDeformableVolume(gl);
      this.volume.render(this.simulation, getShape(this.shapeId), material, gpu.appearance,
        this.appearanceEnabled, radius * 2 / width, radius * 2 / height,
        this.moldProgress, sample.compression, this.renderCenterOffsetY, this.pose);
    }
    gl.useProgram(gpu.program);
    const u = (name: typeof UNIFORMS[number]): WebGLUniformLocation => gpu.uniforms.get(name)!;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gpu.shapeField);
    gl.uniform1i(u('uShapeField'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, gpu.appearance);
    gl.uniform1i(u('uAppearanceTexture'), 1);
    gl.uniform1i(u('uAppearanceEnabled'), this.appearanceEnabled ? 1 : 0);
    if (this.pagesVolume && gpu.face && gpu.faceTextureUniform && gpu.faceEnabledUniform) {
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, gpu.face);
      gl.uniform1i(gpu.faceTextureUniform, 2);
      gl.uniform1i(gpu.faceEnabledUniform, this.faceEnabled ? 1 : 0);
    }
    if (gpu.inclusion && gpu.inclusionTextureUniform && gpu.inclusionEnabledUniform) {
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, gpu.inclusion);
      gl.uniform1i(gpu.inclusionTextureUniform, 3);
      gl.uniform1i(gpu.inclusionEnabledUniform, this.inclusionEnabled ? 1 : 0);
    }
    gl.uniform2f(u('uScale'), radius * 2 / width, radius * 2 / height);
    gl.uniform1f(u('uMoldProgress'), this.moldProgress);
    gl.uniform2f(u('uPointerUv'), clamp01(sample.sheenX * 0.5 + 0.5), clamp01(sample.sheenY * 0.5 + 0.5));
    gl.uniform2f(u('uStrainDirection'), sample.gestureX, sample.gestureY);
    gl.uniform1f(u('uCompression'), sample.compression);
    gl.uniform1f(u('uPressDepth'), sample.pressDepth);
    gl.uniform2f(u('uFillingDrift'), this.fillingDrift.x, this.fillingDrift.y);
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
  public metricsSample(): SquishSimulationSample {
    return { ...this.frameSample, active: this.simulation.snapshot().active };
  }

  public forgetLostContext(): void {
    this.volume?.dispose();
    this.volume = null;
    this.gpu = null;
    this.uploadedAppearanceRevision = -1;
    this.uploadedFaceRevision = -1;
    this.uploadedInclusionRevision = -1;
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
    if (gpu.face) this.gl.deleteTexture(gpu.face);
    if (gpu.inclusion) this.gl.deleteTexture(gpu.inclusion);
    this.gl.deleteVertexArray(gpu.vao);
    this.gl.deleteProgram(gpu.program);
  }
}
