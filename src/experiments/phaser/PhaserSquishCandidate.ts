import Phaser from 'phaser';
import { getMaterial, getPalette, type MaterialId } from '../../game/content';
import { createShapeField, getShape, type ShapeId } from '../../game/shapes';
import type { SquishMaterialStyle } from '../../squish/SquishSurface';
import { SquishSimulation } from '../../squish/SquishSimulation';
import { fragmentShaderSource, vertexShaderSource } from '../../squish/shaders';

interface GpuResources {
  readonly program: WebGLProgram;
  readonly vao: WebGLVertexArrayObject;
  readonly vertices: WebGLBuffer;
  readonly indices: WebGLBuffer;
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

const getStyle = (id: MaterialId): SquishMaterialStyle => {
  const palette = getPalette('milk');
  const material = getMaterial(id);
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

/** M2 isolated reference, not yet the full production SquishSurface feature adapter. */
export class PhaserSquishCandidate extends Phaser.GameObjects.Extern {
  private readonly simulation = new SquishSimulation(getShape('soft-square'), performance.now());
  private readonly packed = new Float32Array(this.simulation.vertices.length * 4);
  private gpu: GpuResources | null = null;
  private shapeId: ShapeId = 'soft-square';
  private materialId: MaterialId = 'soft';
  private activePointer: number | null = null;
  private drawCalls = 0;
  private disposed = false;
  private lastReleaseEnergy = 0;

  public constructor(scene: Phaser.Scene, private readonly gl: WebGL2RenderingContext) {
    super(scene);
  }

  public setShape(id: ShapeId): void {
    if (this.shapeId === id) return;
    this.cancel();
    this.shapeId = id;
    this.simulation.setShape(getShape(id));
    if (this.gpu) this.uploadShapeField(this.gpu);
  }

  public setMaterial(id: MaterialId): void {
    this.materialId = id;
  }

  /** Phaser coordinates are pixels within the candidate's original-size canvas. */
  private localPoint(x: number, y: number): { x: number; y: number } {
    const { width, height } = this.scene.scale;
    const radius = Math.max(1, Math.min(width, height) * 0.34);
    return { x: (x - width / 2) / radius, y: (height / 2 - y) / radius };
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
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gpu.shapeField);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, FIELD_SIZE, FIELD_SIZE, 0, gl.RED, gl.UNSIGNED_BYTE,
      createShapeField(getShape(this.shapeId), FIELD_SIZE));
  }

  private createGpu(): GpuResources {
    const gl = this.gl;
    const vertexShader = compile(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
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
    const shapeField = gl.createTexture();
    const appearance = gl.createTexture();
    if (!vao || !vertices || !indices || !shapeField || !appearance) {
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
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    const gpu = { program, vao, vertices, indices, shapeField, appearance, uniforms };
    this.uploadShapeField(gpu);
    gl.activeTexture(gl.TEXTURE0);
    return gpu;
  }

  public override render(renderer: Phaser.Renderer.WebGL.WebGLRenderer): void {
    if (this.disposed) return;
    if (renderer.gl !== this.gl) throw new Error('Candidate needs the Phaser-owned WebGL2 context');
    const gl = this.gl;
    this.gpu ??= this.createGpu();
    const gpu = this.gpu;
    const material = getStyle(this.materialId);
    const sample = this.simulation.snapshot();
    for (let index = 0; index < this.simulation.vertices.length; index += 1) {
      const vertex = this.simulation.vertices[index]!;
      const offset = index * 4;
      this.packed[offset] = vertex.x;
      this.packed[offset + 1] = vertex.y;
      this.packed[offset + 2] = vertex.u;
      this.packed[offset + 3] = vertex.v;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // Only the base framebuffer is supported in M2.
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
    gl.uniform1i(u('uAppearanceEnabled'), 0);
    const { width, height } = this.scene.scale;
    const radius = Math.min(width, height) * 0.34;
    gl.uniform2f(u('uScale'), radius * 2 / width, radius * 2 / height);
    gl.uniform1f(u('uMoldProgress'), 1);
    gl.uniform2f(u('uPointerUv'), clamp01(sample.sheenX * 0.5 + 0.5), clamp01(sample.sheenY * 0.5 + 0.5));
    gl.uniform2f(u('uStrainDirection'), sample.gestureX, sample.gestureY);
    gl.uniform1f(u('uCompression'), sample.compression);
    gl.uniform1f(u('uPressDepth'), sample.pressDepth);
    gl.uniform3f(u('uColorLow'), ...material.low);
    gl.uniform3f(u('uColorHigh'), ...material.high);
    gl.uniform3f(u('uSheenColor'), ...material.sheen);
    gl.uniform3f(u('uRimColor'), ...material.rim);
    gl.uniform1f(u('uFillingAmount'), 0);
    gl.uniform1f(u('uFillingStyle'), 0);
    gl.uniform1f(u('uFillProgress'), 1);
    gl.uniform1f(u('uMaterialSeed'), material.seed);
    gl.uniform1f(u('uTranslucency'), material.translucency);
    gl.uniform1f(u('uIridescence'), material.iridescence);
    gl.uniform1f(u('uRoughness'), material.roughness);
    gl.uniform1f(u('uMetallic'), material.metallic);
    gl.uniform1f(u('uPearlescence'), material.pearlescence);
    gl.uniform1f(u('uCloudiness'), material.cloudiness);
    gl.uniform1i(u('uWireframePass'), 0);
    gl.bindVertexArray(gpu.vao);
    gl.drawElements(gl.TRIANGLES, this.simulation.triangleIndices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
    gl.activeTexture(gl.TEXTURE0);
    this.drawCalls += 1;
  }

  public snapshot(): { drawCalls: number; squeezes: number; active: boolean; canvasCount: number; renderer: string; releaseEnergy: number } {
    return {
      drawCalls: this.drawCalls,
      squeezes: this.simulation.snapshot().squeezes,
      active: this.simulation.snapshot().active,
      canvasCount: document.querySelectorAll('#phaser-candidate-stage canvas').length,
      renderer: 'phaser-extern-shared-simulation-webgl2',
      releaseEnergy: this.lastReleaseEnergy,
    };
  }

  public forgetLostContext(): void { this.gpu = null; this.cancel(); }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.cancel();
    const gpu = this.gpu;
    this.gpu = null;
    if (!gpu || this.gl.isContextLost()) return;
    this.gl.deleteBuffer(gpu.vertices);
    this.gl.deleteBuffer(gpu.indices);
    this.gl.deleteTexture(gpu.shapeField);
    this.gl.deleteTexture(gpu.appearance);
    this.gl.deleteVertexArray(gpu.vao);
    this.gl.deleteProgram(gpu.program);
  }
}
