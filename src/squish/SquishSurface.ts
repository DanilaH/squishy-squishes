import { getBackingStoreSize, getRenderPixelRatio } from '@danilah/mini-games-kit/core';
import type { SquishyAudio } from '../game/SquishyAudio';
import { createShapeField, getShape, type ShapeDefinition, type ShapeId } from '../game/shapes';
import { SquishSimulation, type SquishSimulationSample } from './SquishSimulation';
import { fragmentShaderSource, vertexShaderSource } from './shaders';

export type SquishRgb = readonly [number, number, number];
export type SquishFillingStyle = 'none' | 'foam' | 'pearl';

export interface SquishMaterialStyle {
  low: SquishRgb;
  high: SquishRgb;
  sheen: SquishRgb;
  rim: SquishRgb;
  seed: number;
  translucency: number;
  iridescence: number;
  roughness: number;
  metallic: number;
  pearlescence: number;
  cloudiness: number;
}

export interface SquishMetrics {
  fps: number;
  p95FrameMs: number;
  compression: number;
  pressDepth: number;
  normalizedVelocity: number;
  maxDisplacement: number;
  gestureX: number;
  gestureY: number;
  active: boolean;
  squeezes: number;
}

type MetricsListener = (metrics: SquishMetrics) => void;
const SHAPE_FIELD_SIZE = 128;
const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const compileShader = (gl: WebGL2RenderingContext, type: number, source: string): WebGLShader => {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to allocate WebGL shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? 'Unknown shader compilation error.';
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
};

const createProgram = (gl: WebGL2RenderingContext): WebGLProgram => {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to allocate WebGL program.');
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? 'Unknown shader link error.';
    gl.deleteProgram(program);
    throw new Error(log);
  }
  return program;
};

const DEFAULT_MATERIAL: SquishMaterialStyle = {
  low: [0.39, 0.12, 0.54],
  high: [0.84, 0.48, 0.91],
  sheen: [0.98, 0.86, 1],
  rim: [0.44, 0.22, 0.54],
  seed: 0.17,
  translucency: 0,
  iridescence: 0,
  roughness: 0.42,
  metallic: 0,
  pearlescence: 0,
  cloudiness: 0.05,
};

const UNIFORM_NAMES = [
  'uScale', 'uShapeField', 'uAppearanceTexture', 'uAppearanceEnabled', 'uPointerUv',
  'uCompression', 'uPressDepth', 'uStrainDirection', 'uColorLow', 'uColorHigh',
  'uSheenColor', 'uRimColor', 'uFillingAmount', 'uFillingStyle', 'uFillProgress',
  'uMoldProgress', 'uMaterialSeed', 'uTranslucency', 'uIridescence', 'uRoughness',
  'uMetallic', 'uPearlescence', 'uCloudiness', 'uWireframePass',
] as const;
type UniformName = typeof UNIFORM_NAMES[number];

/** Raw-WebGL adapter retained until Phaser acceptance; springs are owned by SquishSimulation. */
export class SquishSurface {
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly vertexBuffer: WebGLBuffer;
  private readonly triangleIndexBuffer: WebGLBuffer;
  private readonly lineIndexBuffer: WebGLBuffer;
  private readonly shapeTexture: WebGLTexture;
  private readonly appearanceTexture: WebGLTexture;
  private readonly uniforms: ReadonlyMap<UniformName, WebGLUniformLocation>;
  private readonly shapeFieldCache = new Map<ShapeId, Uint8Array>();
  private readonly simulation = new SquishSimulation(getShape('soft-square'), performance.now());
  private readonly packedVertices: Float32Array;
  private sample: SquishSimulationSample = this.simulation.snapshot();
  private scaleX = 0.5;
  private scaleY = 0.5;
  private capturedPointerId: number | null = null;
  private wireframe = false;
  private muted = false;
  private interactive = true;
  private material: SquishMaterialStyle = DEFAULT_MATERIAL;
  private shape: ShapeDefinition = getShape('soft-square');
  private fillingAmount = 0;
  private fillingStyle = 0;
  private fillProgress = 1;
  private moldProgress = 0;
  private appearanceEnabled = false;
  private animationFrame = 0;
  private lastFrameAt = performance.now();
  private frameTimes: number[] = [];
  private lastMetricsAt = 0;
  private disposed = false;

  public constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly onMetrics: MetricsListener,
    private readonly audio: SquishyAudio,
  ) {
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      depth: false,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL2 is required for the Squishy surface.');
    this.gl = gl;
    this.program = createProgram(gl);
    const uniforms = new Map<UniformName, WebGLUniformLocation>();
    for (const name of UNIFORM_NAMES) {
      const location = gl.getUniformLocation(this.program, name);
      if (location === null) throw new Error(`Missing WebGL uniform: ${name}`);
      uniforms.set(name, location);
    }
    this.uniforms = uniforms;

    const vao = gl.createVertexArray();
    const vertexBuffer = gl.createBuffer();
    const triangleIndexBuffer = gl.createBuffer();
    const lineIndexBuffer = gl.createBuffer();
    const shapeTexture = gl.createTexture();
    const appearanceTexture = gl.createTexture();
    if (!vao || !vertexBuffer || !triangleIndexBuffer || !lineIndexBuffer || !shapeTexture || !appearanceTexture) {
      throw new Error('Unable to allocate WebGL buffers or textures.');
    }
    this.vao = vao;
    this.vertexBuffer = vertexBuffer;
    this.triangleIndexBuffer = triangleIndexBuffer;
    this.lineIndexBuffer = lineIndexBuffer;
    this.shapeTexture = shapeTexture;
    this.appearanceTexture = appearanceTexture;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.shapeTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.uploadShapeField(this.shape);
    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.appearanceTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE0);

    this.packedVertices = new Float32Array(this.simulation.vertices.length * 4);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.packedVertices.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lineIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.simulation.lineIndices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.simulation.triangleIndices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);

    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerup', this.handlePointerEnd);
    canvas.addEventListener('pointercancel', this.handlePointerEnd);
    window.addEventListener('resize', this.resize);
    this.resize();
    this.animationFrame = requestAnimationFrame(this.tick);
  }

  public setWireframe(enabled: boolean): void { this.wireframe = enabled; }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.audio.setMuted(muted);
  }

  public setInteractive(enabled: boolean): void {
    if (this.interactive === enabled) return;
    this.interactive = enabled;
    this.canvas.classList.toggle('is-disabled', !enabled);
    if (!enabled) this.cancelInteraction();
  }

  public resetTiming(): void {
    const now = performance.now();
    this.lastFrameAt = now;
    this.simulation.resetTiming(now);
  }

  public setMaterial(material: SquishMaterialStyle): void { this.material = material; }

  public setShape(shape: ShapeDefinition): void {
    if (shape.id === this.shape.id) return;
    this.cancelInteraction();
    this.shape = shape;
    this.simulation.setShape(shape);
    this.uploadShapeField(shape);
  }

  public setFillingAmount(amount: number): void { this.fillingAmount = clamp01(amount); }

  public setFillingStyle(style: SquishFillingStyle): void {
    this.fillingStyle = style === 'pearl' ? 2 : style === 'foam' ? 1 : 0;
  }

  public setFillProgress(progress: number): void { this.fillProgress = clamp01(progress); }
  public setMoldProgress(progress: number): void { this.moldProgress = clamp01(progress); }

  public setAppearanceTexture(source: TexImageSource | null): void {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.appearanceTexture);
    if (source === null) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
      this.appearanceEnabled = false;
    } else {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      this.appearanceEnabled = true;
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE0);
  }

  public clientPointToUv(clientX: number, clientY: number): { u: number; v: number } | null {
    const local = this.clientPointToLocal(clientX, clientY);
    return this.simulation.pointToUv(local.x, local.y);
  }

  public clientPointToAppearanceUv(clientX: number, clientY: number): { u: number; v: number } | null {
    const local = this.clientPointToLocal(clientX, clientY);
    if (Math.abs(local.x) > 1 || Math.abs(local.y) > 1) return null;
    return { u: clamp01(local.x * 0.5 + 0.5), v: clamp01(local.y * 0.5 + 0.5) };
  }

  public projectUvToCanvas(u: number, v: number): { x: number; y: number } {
    const local = this.simulation.projectUvToLocal(u, v);
    const rect = this.canvas.getBoundingClientRect();
    const ndcX = local.x * this.scaleX;
    const ndcY = local.y * this.scaleY;
    return { x: (ndcX * 0.5 + 0.5) * rect.width, y: (0.5 - ndcY * 0.5) * rect.height };
  }

  public primeAudio(): Promise<void> { return this.audio.prime(); }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.animationFrame);
    this.cancelInteraction();
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerEnd);
    this.canvas.removeEventListener('pointercancel', this.handlePointerEnd);
    window.removeEventListener('resize', this.resize);
    this.gl.deleteBuffer(this.vertexBuffer);
    this.gl.deleteBuffer(this.triangleIndexBuffer);
    this.gl.deleteBuffer(this.lineIndexBuffer);
    this.gl.deleteTexture(this.shapeTexture);
    this.gl.deleteTexture(this.appearanceTexture);
    this.gl.deleteVertexArray(this.vao);
    this.gl.deleteProgram(this.program);
  }

  private readonly resize = (): void => {
    const rect = this.canvas.getBoundingClientRect();
    const pixelRatio = getRenderPixelRatio(2);
    const { width, height } = getBackingStoreSize(rect.width, rect.height, pixelRatio);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    const cssRatio = Number.parseFloat(getComputedStyle(this.canvas).getPropertyValue('--squish-radius-ratio'));
    const radiusRatio = Number.isFinite(cssRatio) ? cssRatio : 0.34;
    const radiusPx = Math.min(rect.width, rect.height) * radiusRatio;
    this.scaleX = (radiusPx * 2) / Math.max(1, rect.width);
    this.scaleY = (radiusPx * 2) / Math.max(1, rect.height);
    this.gl.viewport(0, 0, width, height);
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (!this.interactive || this.capturedPointerId !== null) return;
    const local = this.clientPointToLocal(event.clientX, event.clientY);
    if (!this.simulation.begin(event.pointerId, local.x, local.y)) return;
    this.capturedPointerId = event.pointerId;
    this.canvas.classList.add('is-active');
    try { this.canvas.setPointerCapture(event.pointerId); } catch { /* unavailable */ }
    void this.audio.prime();
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.capturedPointerId) return;
    const local = this.clientPointToLocal(event.clientX, event.clientY);
    this.simulation.move(event.pointerId, local.x, local.y);
  };

  private readonly handlePointerEnd = (event: PointerEvent): void => {
    if (event.pointerId !== this.capturedPointerId) return;
    const energy = this.simulation.end(event.pointerId);
    this.cancelInteraction(energy ?? 0);
  };

  private cancelInteraction(releaseEnergy = 0): void {
    if (this.capturedPointerId !== null) {
      try { this.canvas.releasePointerCapture(this.capturedPointerId); } catch { /* unavailable */ }
    }
    this.capturedPointerId = null;
    this.simulation.cancel();
    this.canvas.classList.remove('is-active');
    this.audio.releaseTactile(releaseEnergy);
  }

  private clientPointToLocal(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    const ndcY = 1 - ((clientY - rect.top) / Math.max(1, rect.height)) * 2;
    return { x: ndcX / Math.max(0.0001, this.scaleX), y: ndcY / Math.max(0.0001, this.scaleY) };
  }

  private uploadShapeField(shape: ShapeDefinition): void {
    let field = this.shapeFieldCache.get(shape.id);
    if (!field) {
      field = createShapeField(shape, SHAPE_FIELD_SIZE);
      this.shapeFieldCache.set(shape.id, field);
    }
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.shapeTexture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, SHAPE_FIELD_SIZE, SHAPE_FIELD_SIZE, 0, gl.RED, gl.UNSIGNED_BYTE, field);
  }

  private readonly tick = (now: number): void => {
    if (this.disposed) return;
    const rawDt = Math.max(0.001, (now - this.lastFrameAt) / 1000);
    this.lastFrameAt = now;
    this.recordFrameTime(rawDt * 1000);
    this.sample = this.simulation.advance(rawDt * 1000, now);
    if (this.sample.active && this.sample.tactileActive && !this.muted) {
      this.audio.updateTactile(this.sample.tactileProgress, this.sample.normalizedVelocity);
    }
    this.render();
    this.publishMetrics(now);
    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private render(): void {
    const gl = this.gl;
    for (let index = 0; index < this.simulation.vertices.length; index += 1) {
      const vertex = this.simulation.vertices[index]!;
      const offset = index * 4;
      this.packedVertices[offset] = vertex.x;
      this.packedVertices[offset + 1] = vertex.y;
      this.packedVertices[offset + 2] = vertex.u;
      this.packedVertices[offset + 3] = vertex.v;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.packedVertices);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.program);
    const u = (name: UniformName): WebGLUniformLocation => this.uniforms.get(name)!;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.shapeTexture);
    gl.uniform1i(u('uShapeField'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.appearanceTexture);
    gl.uniform1i(u('uAppearanceTexture'), 1);
    gl.uniform1i(u('uAppearanceEnabled'), this.appearanceEnabled ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform2f(u('uScale'), this.scaleX, this.scaleY);
    gl.uniform2f(u('uPointerUv'), clamp01(this.sample.sheenX * 0.5 + 0.5), clamp01(this.sample.sheenY * 0.5 + 0.5));
    gl.uniform1f(u('uCompression'), this.sample.compression);
    gl.uniform1f(u('uPressDepth'), this.sample.pressDepth);
    gl.uniform2f(u('uStrainDirection'), this.sample.gestureX, this.sample.gestureY);
    gl.uniform3f(u('uColorLow'), ...this.material.low);
    gl.uniform3f(u('uColorHigh'), ...this.material.high);
    gl.uniform3f(u('uSheenColor'), ...this.material.sheen);
    gl.uniform3f(u('uRimColor'), ...this.material.rim);
    gl.uniform1f(u('uFillingAmount'), this.fillingAmount);
    gl.uniform1f(u('uFillingStyle'), this.fillingStyle);
    gl.uniform1f(u('uFillProgress'), this.fillProgress);
    gl.uniform1f(u('uMoldProgress'), this.moldProgress);
    gl.uniform1f(u('uMaterialSeed'), this.material.seed);
    gl.uniform1f(u('uTranslucency'), clamp01(this.material.translucency));
    gl.uniform1f(u('uIridescence'), clamp01(this.material.iridescence));
    gl.uniform1f(u('uRoughness'), clamp01(this.material.roughness));
    gl.uniform1f(u('uMetallic'), clamp01(this.material.metallic));
    gl.uniform1f(u('uPearlescence'), clamp01(this.material.pearlescence));
    gl.uniform1f(u('uCloudiness'), clamp01(this.material.cloudiness));
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndexBuffer);
    gl.uniform1i(u('uWireframePass'), 0);
    gl.drawElements(gl.TRIANGLES, this.simulation.triangleIndices.length, gl.UNSIGNED_SHORT, 0);
    if (this.wireframe) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lineIndexBuffer);
      gl.uniform1i(u('uWireframePass'), 1);
      gl.drawElements(gl.LINES, this.simulation.lineIndices.length, gl.UNSIGNED_SHORT, 0);
    }
    gl.bindVertexArray(null);
  }

  private recordFrameTime(frameMs: number): void {
    this.frameTimes.push(frameMs);
    if (this.frameTimes.length > 180) this.frameTimes.shift();
  }

  private publishMetrics(now: number): void {
    if (now - this.lastMetricsAt < 50) return;
    this.lastMetricsAt = now;
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const p95Index = sorted.length === 0 ? 0 : Math.floor((sorted.length - 1) * 0.95);
    const p95FrameMs = sorted[p95Index] ?? 0;
    const recentStart = Math.max(0, this.frameTimes.length - 30);
    let recentTotal = 0;
    let recentCount = 0;
    for (let index = recentStart; index < this.frameTimes.length; index += 1) {
      recentTotal += this.frameTimes[index] ?? 0;
      recentCount += 1;
    }
    const averageFrameMs = recentCount === 0 ? 0 : recentTotal / recentCount;
    this.onMetrics({
      fps: averageFrameMs > 0 ? 1000 / averageFrameMs : 0,
      p95FrameMs,
      compression: this.sample.compression,
      pressDepth: this.sample.pressDepth,
      normalizedVelocity: this.sample.normalizedVelocity,
      maxDisplacement: this.sample.maxDisplacement,
      gestureX: this.sample.gestureX,
      gestureY: this.sample.gestureY,
      active: this.sample.active,
      squeezes: this.sample.squeezes,
    });
  }
}
