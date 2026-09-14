import { getBackingStoreSize, getRenderPixelRatio, sampleContinuousInteraction } from '@danilah/mini-games-kit/core';
import type { SquishyAudio } from '../game/SquishyAudio';
import {
  createShapeField,
  getShape,
  isPointInsideShape,
  type ShapeDefinition,
  type ShapeId,
} from '../game/shapes';
import { fragmentShaderSource, vertexShaderSource } from './shaders';

interface VertexState {
  restX: number;
  restY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  u: number;
  v: number;
}

export type SquishRgb = readonly [number, number, number];

export interface SquishMaterialStyle {
  low: SquishRgb;
  high: SquishRgb;
  sheen: SquishRgb;
  rim: SquishRgb;
  seed: number;
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

const GRID_CELLS = 16;
const SHAPE_FIELD_SIZE = 128;
const GRAB_RADIUS = 0.92;
const PRESS_RADIUS = 0.58;
const MAX_POINTER_DISPLACEMENT = 0.72;
const MAX_VERTEX_DISPLACEMENT = 0.72;
const GRAB_STIFFNESS_NEAR = 245;
const GRAB_STIFFNESS_FAR = 92;
const REST_STIFFNESS = 44;
const DAMPING = 10.5;
const BULGE_STRENGTH = 0.085;
const PRESS_DENT_STRENGTH = 0.14;
const PRESS_RING_BULGE = 0.045;
const PRESS_COMPRESSION_WEIGHT = 0.22;
const PRESS_ATTACK = 12;
const PRESS_RELEASE = 18;
const RELEASE_DRAG_KICK = 1.05;
const RELEASE_PRESS_KICK = 0.24;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const clamp01 = (value: number): number => clamp(value, 0, 1);
const smoothstep01 = (value: number): number => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

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

const requireUniform = (
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
): WebGLUniformLocation => {
  const location = gl.getUniformLocation(program, name);
  if (location === null) throw new Error(`Missing WebGL uniform: ${name}`);
  return location;
};

const DEFAULT_MATERIAL: SquishMaterialStyle = {
  low: [0.39, 0.12, 0.54],
  high: [0.84, 0.48, 0.91],
  sheen: [0.98, 0.86, 1],
  rim: [0.44, 0.22, 0.54],
  seed: 0.17,
};

export class SquishSurface {
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly vertexBuffer: WebGLBuffer;
  private readonly triangleIndexBuffer: WebGLBuffer;
  private readonly lineIndexBuffer: WebGLBuffer;
  private readonly shapeTexture: WebGLTexture;
  private readonly shapeFieldUniform: WebGLUniformLocation;
  private readonly shapeFieldCache = new Map<ShapeId, Uint8Array>();
  private readonly vertices: VertexState[] = [];
  private readonly triangleIndices: Uint16Array;
  private readonly lineIndices: Uint16Array;
  private readonly packedVertices: Float32Array;
  private readonly scaleUniform: WebGLUniformLocation;
  private readonly pointerUvUniform: WebGLUniformLocation;
  private readonly compressionUniform: WebGLUniformLocation;
  private readonly pressDepthUniform: WebGLUniformLocation;
  private readonly strainDirectionUniform: WebGLUniformLocation;
  private readonly colorLowUniform: WebGLUniformLocation;
  private readonly colorHighUniform: WebGLUniformLocation;
  private readonly sheenColorUniform: WebGLUniformLocation;
  private readonly rimColorUniform: WebGLUniformLocation;
  private readonly fillingAmountUniform: WebGLUniformLocation;
  private readonly fillProgressUniform: WebGLUniformLocation;
  private readonly moldProgressUniform: WebGLUniformLocation;
  private readonly materialSeedUniform: WebGLUniformLocation;
  private readonly wireframePassUniform: WebGLUniformLocation;

  private scaleX = 0.5;
  private scaleY = 0.5;
  private pointerId: number | null = null;
  private grabStartX = 0;
  private grabStartY = 0;
  private pointerX = 0;
  private pointerY = 0;
  private sheenX = 0;
  private sheenY = 0;
  private gestureX = 0;
  private gestureY = 0;
  private pressDepth = 0;
  private compression = 0;
  private previousCompression = 0;
  private previousSampleAt = performance.now();
  private normalizedVelocity = 0;
  private maxDisplacement = 0;
  private maxGestureCompression = 0;
  private squeezes = 0;
  private wireframe = false;
  private muted = false;
  private interactive = true;
  private material: SquishMaterialStyle = DEFAULT_MATERIAL;
  private shape: ShapeDefinition = getShape('soft-square');
  private fillingAmount = 0;
  private fillProgress = 1;
  private moldProgress = 0;
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
    this.scaleUniform = requireUniform(gl, this.program, 'uScale');
    this.shapeFieldUniform = requireUniform(gl, this.program, 'uShapeField');
    this.pointerUvUniform = requireUniform(gl, this.program, 'uPointerUv');
    this.compressionUniform = requireUniform(gl, this.program, 'uCompression');
    this.pressDepthUniform = requireUniform(gl, this.program, 'uPressDepth');
    this.strainDirectionUniform = requireUniform(gl, this.program, 'uStrainDirection');
    this.colorLowUniform = requireUniform(gl, this.program, 'uColorLow');
    this.colorHighUniform = requireUniform(gl, this.program, 'uColorHigh');
    this.sheenColorUniform = requireUniform(gl, this.program, 'uSheenColor');
    this.rimColorUniform = requireUniform(gl, this.program, 'uRimColor');
    this.fillingAmountUniform = requireUniform(gl, this.program, 'uFillingAmount');
    this.fillProgressUniform = requireUniform(gl, this.program, 'uFillProgress');
    this.moldProgressUniform = requireUniform(gl, this.program, 'uMoldProgress');
    this.materialSeedUniform = requireUniform(gl, this.program, 'uMaterialSeed');
    this.wireframePassUniform = requireUniform(gl, this.program, 'uWireframePass');

    const vao = gl.createVertexArray();
    const vertexBuffer = gl.createBuffer();
    const triangleIndexBuffer = gl.createBuffer();
    const lineIndexBuffer = gl.createBuffer();
    const shapeTexture = gl.createTexture();
    if (!vao || !vertexBuffer || !triangleIndexBuffer || !lineIndexBuffer || !shapeTexture) {
      throw new Error('Unable to allocate WebGL buffers or shape texture.');
    }
    this.vao = vao;
    this.vertexBuffer = vertexBuffer;
    this.triangleIndexBuffer = triangleIndexBuffer;
    this.lineIndexBuffer = lineIndexBuffer;
    this.shapeTexture = shapeTexture;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.shapeTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.uploadShapeField(this.shape);
    gl.bindTexture(gl.TEXTURE_2D, null);

    const triangleIndices: number[] = [];
    const lineIndices: number[] = [];
    this.buildMesh(triangleIndices, lineIndices);
    this.triangleIndices = new Uint16Array(triangleIndices);
    this.lineIndices = new Uint16Array(lineIndices);
    this.packedVertices = new Float32Array(this.vertices.length * 4);

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.packedVertices.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lineIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.lineIndices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);

    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerup', this.handlePointerEnd);
    canvas.addEventListener('pointercancel', this.handlePointerEnd);
    window.addEventListener('resize', this.resize);

    this.resize();
    this.animationFrame = requestAnimationFrame(this.tick);
  }

  public setWireframe(enabled: boolean): void {
    this.wireframe = enabled;
  }

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
    this.previousSampleAt = now;
  }

  public setMaterial(material: SquishMaterialStyle): void {
    this.material = material;
  }

  public setShape(shape: ShapeDefinition): void {
    if (shape.id === this.shape.id) return;
    this.cancelInteraction();
    this.shape = shape;
    this.uploadShapeField(shape);
  }

  public setFillingAmount(amount: number): void {
    this.fillingAmount = clamp01(amount);
  }

  public setFillProgress(progress: number): void {
    this.fillProgress = clamp01(progress);
  }

  public setMoldProgress(progress: number): void {
    this.moldProgress = clamp01(progress);
  }

  public primeAudio(): Promise<void> {
    return this.audio.prime();
  }

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
    this.gl.deleteVertexArray(this.vao);
    this.gl.deleteProgram(this.program);
  }

  private buildMesh(triangleIndices: number[], lineIndices: number[]): void {
    const row = GRID_CELLS + 1;

    for (let y = 0; y <= GRID_CELLS; y += 1) {
      for (let x = 0; x <= GRID_CELLS; x += 1) {
        const u = x / GRID_CELLS;
        const v = y / GRID_CELLS;
        const restX = u * 2 - 1;
        const restY = v * 2 - 1;
        this.vertices.push({ restX, restY, x: restX, y: restY, vx: 0, vy: 0, u, v });
      }
    }

    for (let y = 0; y < GRID_CELLS; y += 1) {
      for (let x = 0; x < GRID_CELLS; x += 1) {
        const a = y * row + x;
        const b = a + 1;
        const c = a + row;
        const d = c + 1;
        triangleIndices.push(a, c, b, b, c, d);
      }
    }

    for (let y = 0; y <= GRID_CELLS; y += 1) {
      for (let x = 0; x < GRID_CELLS; x += 1) {
        const a = y * row + x;
        lineIndices.push(a, a + 1);
      }
    }
    for (let x = 0; x <= GRID_CELLS; x += 1) {
      for (let y = 0; y < GRID_CELLS; y += 1) {
        const a = y * row + x;
        lineIndices.push(a, a + row);
      }
    }
  }

  private readonly resize = (): void => {
    const rect = this.canvas.getBoundingClientRect();
    const pixelRatio = getRenderPixelRatio(2);
    const { width, height } = getBackingStoreSize(rect.width, rect.height, pixelRatio);

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    const radiusPx = Math.min(rect.width, rect.height) * 0.34;
    this.scaleX = (radiusPx * 2) / Math.max(1, rect.width);
    this.scaleY = (radiusPx * 2) / Math.max(1, rect.height);
    this.gl.viewport(0, 0, width, height);
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (!this.interactive || this.pointerId !== null) return;
    const local = this.pointerToLocal(event);
    if (!this.isInsideObject(local.x, local.y)) return;

    this.pointerId = event.pointerId;
    this.grabStartX = local.x;
    this.grabStartY = local.y;
    this.pointerX = local.x;
    this.pointerY = local.y;
    this.maxGestureCompression = 0;
    this.sheenX += (local.x - this.sheenX) * 0.55;
    this.sheenY += (local.y - this.sheenY) * 0.55;
    this.canvas.classList.add('is-active');

    try {
      this.canvas.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be unavailable during teardown.
    }

    void this.audio.prime();
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    const local = this.pointerToLocal(event);
    this.pointerX = local.x;
    this.pointerY = local.y;
  };

  private readonly handlePointerEnd = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;

    const releaseEnergy = clamp01(Math.max(this.maxGestureCompression, this.pressDepth * PRESS_COMPRESSION_WEIGHT));
    if (releaseEnergy >= 0.08) {
      this.squeezes += 1;
      this.applyReleaseImpulse();
    }
    this.cancelInteraction(releaseEnergy);
  };

  private cancelInteraction(releaseEnergy = 0): void {
    if (this.pointerId !== null) {
      try {
        this.canvas.releasePointerCapture(this.pointerId);
      } catch {
        // Pointer capture may already have been released by the browser.
      }
    }
    this.pointerId = null;
    this.canvas.classList.remove('is-active');
    this.audio.releaseTactile(releaseEnergy);
  }

  private applyReleaseImpulse(): void {
    let displacementX = this.pointerX - this.grabStartX;
    let displacementY = this.pointerY - this.grabStartY;
    const magnitude = Math.hypot(displacementX, displacementY);
    if (magnitude > MAX_POINTER_DISPLACEMENT) {
      const scale = MAX_POINTER_DISPLACEMENT / magnitude;
      displacementX *= scale;
      displacementY *= scale;
    }

    for (const vertex of this.vertices) {
      const localX = vertex.restX - this.grabStartX;
      const localY = vertex.restY - this.grabStartY;
      const distance = Math.hypot(localX, localY);
      const dragInfluence = smoothstep01(1 - distance / GRAB_RADIUS) ** 2;
      const pressInfluence = smoothstep01(1 - distance / PRESS_RADIUS) ** 2;

      vertex.vx -= displacementX * dragInfluence * RELEASE_DRAG_KICK;
      vertex.vy -= displacementY * dragInfluence * RELEASE_DRAG_KICK;

      if (distance > 0.0001) {
        const radialX = localX / distance;
        const radialY = localY / distance;
        const pressKick = this.pressDepth * pressInfluence * RELEASE_PRESS_KICK;
        vertex.vx += radialX * pressKick;
        vertex.vy += radialY * pressKick;
      }
    }
  }

  private pointerToLocal(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const ndcX = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    const ndcY = 1 - ((event.clientY - rect.top) / Math.max(1, rect.height)) * 2;
    return {
      x: ndcX / Math.max(0.0001, this.scaleX),
      y: ndcY / Math.max(0.0001, this.scaleY),
    };
  }

  private isInsideObject(x: number, y: number): boolean {
    return isPointInsideShape(this.shape, x, y);
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
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.R8,
      SHAPE_FIELD_SIZE,
      SHAPE_FIELD_SIZE,
      0,
      gl.RED,
      gl.UNSIGNED_BYTE,
      field,
    );
  }

  private readonly tick = (now: number): void => {
    if (this.disposed) return;

    const rawDt = Math.max(0.001, (now - this.lastFrameAt) / 1000);
    const dt = Math.min(rawDt, 1 / 30);
    this.lastFrameAt = now;
    this.recordFrameTime(rawDt * 1000);

    this.updatePhysics(dt, now);
    this.render();
    this.publishMetrics(now);

    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private updatePhysics(dt: number, now: number): void {
    const active = this.pointerId !== null;
    let displacementX = 0;
    let displacementY = 0;

    if (active) {
      displacementX = this.pointerX - this.grabStartX;
      displacementY = this.pointerY - this.grabStartY;
      const magnitude = Math.hypot(displacementX, displacementY);
      if (magnitude > MAX_POINTER_DISPLACEMENT) {
        const scale = MAX_POINTER_DISPLACEMENT / magnitude;
        displacementX *= scale;
        displacementY *= scale;
      }
    }

    const pressTarget = active ? 1 : 0;
    const pressRate = active ? PRESS_ATTACK : PRESS_RELEASE;
    const pressBlend = 1 - Math.exp(-pressRate * dt);
    this.pressDepth += (pressTarget - this.pressDepth) * pressBlend;

    const dragMagnitude = Math.hypot(displacementX, displacementY);
    const dragCompression = active ? clamp01(dragMagnitude / MAX_POINTER_DISPLACEMENT) : 0;
    this.compression = active
      ? clamp01(Math.max(dragCompression, this.pressDepth * PRESS_COMPRESSION_WEIGHT))
      : 0;
    this.maxGestureCompression = Math.max(this.maxGestureCompression, this.compression);

    const directionTargetX = active && dragMagnitude > 0.02 ? displacementX / dragMagnitude : 0;
    const directionTargetY = active && dragMagnitude > 0.02 ? displacementY / dragMagnitude : 0;
    const directionBlend = 1 - Math.exp(-(active ? 11 : 5) * dt);
    this.gestureX += (directionTargetX - this.gestureX) * directionBlend;
    this.gestureY += (directionTargetY - this.gestureY) * directionBlend;

    const sheenTargetX = active ? this.pointerX : 0;
    const sheenTargetY = active ? this.pointerY : 0;
    const sheenBlend = 1 - Math.exp(-(active ? 9 : 3) * dt);
    this.sheenX += (sheenTargetX - this.sheenX) * sheenBlend;
    this.sheenY += (sheenTargetY - this.sheenY) * sheenBlend;

    const sample = sampleContinuousInteraction(
      this.compression,
      this.previousCompression,
      now,
      this.previousSampleAt,
      {
        velocityForMax: 4,
        minActiveProgress: 0.005,
        minActiveProgressDelta: 0.0005,
      },
    );
    this.previousCompression = this.compression;
    this.previousSampleAt = now;
    this.normalizedVelocity = sample.normalizedVelocity;

    if (active && sample.active && !this.muted) {
      this.audio.updateTactile(sample.progress, sample.normalizedVelocity);
    }

    const gestureMagnitude = Math.max(0.0001, dragMagnitude);
    const gestureDirX = displacementX / gestureMagnitude;
    const gestureDirY = displacementY / gestureMagnitude;
    let frameMaxDisplacement = 0;

    for (const vertex of this.vertices) {
      let targetX = vertex.restX;
      let targetY = vertex.restY;
      let responseInfluence = 0;

      if (active) {
        const localX = vertex.restX - this.grabStartX;
        const localY = vertex.restY - this.grabStartY;
        const grabDistance = Math.hypot(localX, localY);
        const influence = smoothstep01(1 - grabDistance / GRAB_RADIUS);
        const weightedInfluence = influence * influence;
        const pressInfluence = smoothstep01(1 - grabDistance / PRESS_RADIUS) ** 2;
        responseInfluence = Math.max(weightedInfluence, pressInfluence * 0.9);

        targetX += displacementX * weightedInfluence;
        targetY += displacementY * weightedInfluence;

        targetX += -localX * pressInfluence * this.pressDepth * PRESS_DENT_STRENGTH;
        targetY += -localY * pressInfluence * this.pressDepth * PRESS_DENT_STRENGTH;

        if (grabDistance > 0.0001) {
          const localRadialX = localX / grabDistance;
          const localRadialY = localY / grabDistance;
          const ringCenter = PRESS_RADIUS * 0.72;
          const ringWidth = PRESS_RADIUS * 0.38;
          const ring = smoothstep01(1 - Math.abs(grabDistance - ringCenter) / ringWidth);
          const ringBulge = ring * this.pressDepth * PRESS_RING_BULGE * (1 - pressInfluence * 0.65);
          targetX += localRadialX * ringBulge;
          targetY += localRadialY * ringBulge;
        }

        const radialLength = Math.max(0.0001, Math.hypot(vertex.restX, vertex.restY));
        const radialX = vertex.restX / radialLength;
        const radialY = vertex.restY / radialLength;
        const directionAlignment = Math.abs(radialX * gestureDirX + radialY * gestureDirY);
        const sideWeight = 1 - directionAlignment;
        const bulge = dragCompression * BULGE_STRENGTH * sideWeight * (1 - weightedInfluence * 0.75);
        targetX += radialX * bulge;
        targetY += radialY * bulge;
      }

      const targetStiffness = active
        ? GRAB_STIFFNESS_FAR + (GRAB_STIFFNESS_NEAR - GRAB_STIFFNESS_FAR) * responseInfluence
        : 0;
      const localDamping = Math.exp(-(DAMPING * (0.88 + responseInfluence * 0.12)) * dt);
      const ax = (targetX - vertex.x) * targetStiffness + (vertex.restX - vertex.x) * REST_STIFFNESS;
      const ay = (targetY - vertex.y) * targetStiffness + (vertex.restY - vertex.y) * REST_STIFFNESS;

      vertex.vx = (vertex.vx + ax * dt) * localDamping;
      vertex.vy = (vertex.vy + ay * dt) * localDamping;
      vertex.x += vertex.vx * dt;
      vertex.y += vertex.vy * dt;

      const offsetX = vertex.x - vertex.restX;
      const offsetY = vertex.y - vertex.restY;
      const offset = Math.hypot(offsetX, offsetY);
      if (offset > MAX_VERTEX_DISPLACEMENT) {
        const scale = MAX_VERTEX_DISPLACEMENT / offset;
        vertex.x = vertex.restX + offsetX * scale;
        vertex.y = vertex.restY + offsetY * scale;
        vertex.vx *= 0.55;
        vertex.vy *= 0.55;
      }

      frameMaxDisplacement = Math.max(
        frameMaxDisplacement,
        Math.hypot(vertex.x - vertex.restX, vertex.y - vertex.restY),
      );
    }

    this.maxDisplacement = frameMaxDisplacement;
  }

  private render(): void {
    const gl = this.gl;

    for (let index = 0; index < this.vertices.length; index += 1) {
      const vertex = this.vertices[index]!;
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
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.shapeTexture);
    gl.uniform1i(this.shapeFieldUniform, 0);
    gl.uniform2f(this.scaleUniform, this.scaleX, this.scaleY);
    gl.uniform2f(
      this.pointerUvUniform,
      clamp01(this.sheenX * 0.5 + 0.5),
      clamp01(this.sheenY * 0.5 + 0.5),
    );
    gl.uniform1f(this.compressionUniform, this.compression);
    gl.uniform1f(this.pressDepthUniform, this.pressDepth);
    gl.uniform2f(this.strainDirectionUniform, this.gestureX, this.gestureY);
    gl.uniform3f(this.colorLowUniform, ...this.material.low);
    gl.uniform3f(this.colorHighUniform, ...this.material.high);
    gl.uniform3f(this.sheenColorUniform, ...this.material.sheen);
    gl.uniform3f(this.rimColorUniform, ...this.material.rim);
    gl.uniform1f(this.fillingAmountUniform, this.fillingAmount);
    gl.uniform1f(this.fillProgressUniform, this.fillProgress);
    gl.uniform1f(this.moldProgressUniform, this.moldProgress);
    gl.uniform1f(this.materialSeedUniform, this.material.seed);

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndexBuffer);
    gl.uniform1i(this.wireframePassUniform, 0);
    gl.drawElements(gl.TRIANGLES, this.triangleIndices.length, gl.UNSIGNED_SHORT, 0);

    if (this.wireframe) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lineIndexBuffer);
      gl.uniform1i(this.wireframePassUniform, 1);
      gl.drawElements(gl.LINES, this.lineIndices.length, gl.UNSIGNED_SHORT, 0);
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
      compression: this.compression,
      pressDepth: this.pressDepth,
      normalizedVelocity: this.normalizedVelocity,
      maxDisplacement: this.maxDisplacement,
      gestureX: this.gestureX,
      gestureY: this.gestureY,
      active: this.pointerId !== null,
      squeezes: this.squeezes,
    });
  }
}
