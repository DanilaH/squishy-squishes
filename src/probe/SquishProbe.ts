import { sampleContinuousInteraction } from '@danilah/mini-games-kit/core';
import { TactileAudio } from './TactileAudio';
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

export interface ProbeMetrics {
  fps: number;
  p95FrameMs: number;
  compression: number;
  normalizedVelocity: number;
  maxDisplacement: number;
  active: boolean;
  squeezes: number;
}

type MetricsListener = (metrics: ProbeMetrics) => void;

const GRID_CELLS = 10;
const GRAB_RADIUS = 0.92;
const MAX_POINTER_DISPLACEMENT = 0.72;
const MAX_VERTEX_DISPLACEMENT = 0.72;
const GRAB_STIFFNESS = 235;
const REST_STIFFNESS = 44;
const DAMPING = 10.5;
const BULGE_STRENGTH = 0.085;

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
    const log = gl.getProgramInfoLog(program) ?? 'Unknown WebGL link error.';
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
  if (!location) throw new Error(`Missing WebGL uniform: ${name}`);
  return location;
};

export class SquishProbe {
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly vertexBuffer: WebGLBuffer;
  private readonly triangleIndexBuffer: WebGLBuffer;
  private readonly lineIndexBuffer: WebGLBuffer;
  private readonly vertices: VertexState[] = [];
  private readonly triangleIndices: Uint16Array;
  private readonly lineIndices: Uint16Array;
  private readonly packedVertices: Float32Array;
  private readonly audio = new TactileAudio();

  private readonly scaleUniform: WebGLUniformLocation;
  private readonly pointerUvUniform: WebGLUniformLocation;
  private readonly compressionUniform: WebGLUniformLocation;
  private readonly wireframePassUniform: WebGLUniformLocation;

  private scaleX = 0.5;
  private scaleY = 0.5;
  private pointerId: number | null = null;
  private grabStartX = 0;
  private grabStartY = 0;
  private pointerX = 0;
  private pointerY = 0;
  private compression = 0;
  private previousCompression = 0;
  private previousSampleAt = performance.now();
  private normalizedVelocity = 0;
  private maxDisplacement = 0;
  private maxGestureCompression = 0;
  private squeezes = 0;
  private wireframe = false;
  private muted = false;
  private animationFrame = 0;
  private lastFrameAt = performance.now();
  private frameTimes: number[] = [];
  private lastMetricsAt = 0;
  private disposed = false;

  public constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly onMetrics: MetricsListener,
  ) {
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      depth: false,
      premultipliedAlpha: true,
    });
    if (!gl) throw new Error('WebGL2 is required for the Squish Feel Probe.');
    this.gl = gl;

    this.program = createProgram(gl);
    this.scaleUniform = requireUniform(gl, this.program, 'uScale');
    this.pointerUvUniform = requireUniform(gl, this.program, 'uPointerUv');
    this.compressionUniform = requireUniform(gl, this.program, 'uCompression');
    this.wireframePassUniform = requireUniform(gl, this.program, 'uWireframePass');

    const vao = gl.createVertexArray();
    const vertexBuffer = gl.createBuffer();
    const triangleIndexBuffer = gl.createBuffer();
    const lineIndexBuffer = gl.createBuffer();
    if (!vao || !vertexBuffer || !triangleIndexBuffer || !lineIndexBuffer) {
      throw new Error('Unable to allocate WebGL buffers.');
    }
    this.vao = vao;
    this.vertexBuffer = vertexBuffer;
    this.triangleIndexBuffer = triangleIndexBuffer;
    this.lineIndexBuffer = lineIndexBuffer;

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

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);

    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerup', this.handlePointerEnd);
    canvas.addEventListener('pointercancel', this.handlePointerEnd);
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

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

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    cancelAnimationFrame(this.animationFrame);
    this.cancelInteraction();
    this.audio.dispose();

    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerEnd);
    this.canvas.removeEventListener('pointercancel', this.handlePointerEnd);
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    this.gl.deleteBuffer(this.vertexBuffer);
    this.gl.deleteBuffer(this.triangleIndexBuffer);
    this.gl.deleteBuffer(this.lineIndexBuffer);
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
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));

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
    if (this.pointerId !== null) return;
    const local = this.pointerToLocal(event);
    if (!this.isInsideObject(local.x, local.y)) return;

    this.pointerId = event.pointerId;
    this.grabStartX = local.x;
    this.grabStartY = local.y;
    this.pointerX = local.x;
    this.pointerY = local.y;
    this.maxGestureCompression = 0;
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
    if (this.maxGestureCompression >= 0.08) this.squeezes += 1;
    this.cancelInteraction();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) this.cancelInteraction();
  };

  private cancelInteraction(): void {
    if (this.pointerId !== null) {
      try {
        this.canvas.releasePointerCapture(this.pointerId);
      } catch {
        // Pointer capture may already have been released by the browser.
      }
    }
    this.pointerId = null;
    this.canvas.classList.remove('is-active');
    this.audio.release();
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
    return Math.abs(x) ** 4 + Math.abs(y) ** 4 <= 0.96;
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

    this.compression = active
      ? clamp01(Math.hypot(displacementX, displacementY) / MAX_POINTER_DISPLACEMENT)
      : 0;
    this.maxGestureCompression = Math.max(this.maxGestureCompression, this.compression);

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
      this.audio.update(sample.progress, sample.normalizedVelocity);
    }

    const gestureMagnitude = Math.max(0.0001, Math.hypot(displacementX, displacementY));
    const gestureDirX = displacementX / gestureMagnitude;
    const gestureDirY = displacementY / gestureMagnitude;
    const damping = Math.exp(-DAMPING * dt);
    let frameMaxDisplacement = 0;

    for (const vertex of this.vertices) {
      let targetX = vertex.restX;
      let targetY = vertex.restY;

      if (active) {
        const grabDistance = Math.hypot(vertex.restX - this.grabStartX, vertex.restY - this.grabStartY);
        const influence = smoothstep01(1 - grabDistance / GRAB_RADIUS);
        const weightedInfluence = influence * influence;

        targetX += displacementX * weightedInfluence;
        targetY += displacementY * weightedInfluence;

        const radialLength = Math.max(0.0001, Math.hypot(vertex.restX, vertex.restY));
        const radialX = vertex.restX / radialLength;
        const radialY = vertex.restY / radialLength;
        const directionAlignment = Math.abs(radialX * gestureDirX + radialY * gestureDirY);
        const sideWeight = 1 - directionAlignment;
        const bulge = this.compression * BULGE_STRENGTH * sideWeight * (1 - weightedInfluence * 0.75);
        targetX += radialX * bulge;
        targetY += radialY * bulge;
      }

      const targetStiffness = active ? GRAB_STIFFNESS : 0;
      const ax = (targetX - vertex.x) * targetStiffness + (vertex.restX - vertex.x) * REST_STIFFNESS;
      const ay = (targetY - vertex.y) * targetStiffness + (vertex.restY - vertex.y) * REST_STIFFNESS;

      vertex.vx = (vertex.vx + ax * dt) * damping;
      vertex.vy = (vertex.vy + ay * dt) * damping;
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
    gl.uniform2f(this.scaleUniform, this.scaleX, this.scaleY);
    gl.uniform2f(
      this.pointerUvUniform,
      clamp01(this.pointerX * 0.5 + 0.5),
      clamp01(this.pointerY * 0.5 + 0.5),
    );
    gl.uniform1f(this.compressionUniform, this.compression);

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndexBuffer);
    gl.uniform1i(this.wireframePassUniform, 0);
    gl.drawElements(gl.TRIANGLES, this.triangleIndices.length, gl.UNSIGNED_SHORT, 0);

    if (this.wireframe) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lineIndexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.lineIndices, gl.STATIC_DRAW);
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
    if (now - this.lastMetricsAt < 120) return;
    this.lastMetricsAt = now;

    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const p95Index = sorted.length === 0 ? 0 : Math.floor((sorted.length - 1) * 0.95);
    const p95FrameMs = sorted[p95Index] ?? 0;
    const recent = this.frameTimes.slice(-30);
    const averageFrameMs = recent.length === 0
      ? 0
      : recent.reduce((sum, value) => sum + value, 0) / recent.length;

    this.onMetrics({
      fps: averageFrameMs > 0 ? 1000 / averageFrameMs : 0,
      p95FrameMs,
      compression: this.compression,
      normalizedVelocity: this.normalizedVelocity,
      maxDisplacement: this.maxDisplacement,
      active: this.pointerId !== null,
      squeezes: this.squeezes,
    });
  }
}
