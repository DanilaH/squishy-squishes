import type { ShapeDefinition } from '../../game/shapes';
import type { SquishMaterialStyle } from '../../squish/SquishSurface';
import type { SquishSimulation } from '../../squish/SquishSimulation';
import { fragmentShaderSource, vertexShaderSource } from '../../squish/shaders';

/** Pages adds cap/side geometry on top of the shared material shader. */
const BODY_ALPHA_LINE = '  float bodyAlpha = mix(0.985, 0.76 + edge * 0.15, translucency);';
if (fragmentShaderSource.split(BODY_ALPHA_LINE).length !== 2) {
  throw new Error('Pages volume needs the reviewed Studio fragment shader.');
}
export const pagesVolumeFrontShader = fragmentShaderSource.replace('  base *= 1.0 - edge * 0.26;', '  base *= 1.0 - edge * 0.17;').replace(BODY_ALPHA_LINE, `
  // Smooth radial cap normals avoid the concave paw/heart wedge artifacts.
  // UVs and 2D deformation still belong to the one canonical simulation.
  float capSlope = smoothstep(0.10, 0.48, shapeField);
  vec3 capNormal = normalize(vec3(p * (capSlope * 0.72), 1.0 - capSlope * 0.20));
  float capLight = max(dot(capNormal, normalize(vec3(-0.42, 0.51, 0.75))), 0.0);
  base *= mix(1.0, 0.80 + 0.23 * capLight, 0.64);
  ${BODY_ALPHA_LINE}`);

const SIDE_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uAppearanceTexture;
uniform bool uAppearanceEnabled;
uniform vec3 uColorLow;
uniform vec3 uColorHigh;
uniform vec3 uSheenColor;
uniform float uMetallic;
uniform float uTranslucency;
uniform float uCompression;
out vec4 outColor;
void main() {
  vec3 body = mix(uColorLow, uColorHigh, smoothstep(0.0, 1.0, vUv.y));
  if (uAppearanceEnabled) {
    vec4 paint = texture(uAppearanceTexture, vUv);
    body = mix(body, paint.rgb, paint.a * 0.78);
  }
  // Sidewall has its own soft material lighting; never duplicate face/eyes.
  body *= 0.86 + vUv.y * 0.06 + uCompression * 0.020;
  body = mix(body, vec3(0.40, 0.90, 0.84), clamp(uTranslucency, 0.0, 1.0) * 0.30);
  float sideMetalBand = 0.5 + 0.5 * sin((vUv.y * 2.35 - vUv.x * 0.22) * 6.2831853);
  vec3 sideMetal = mix(body * 0.38, mix(body * 1.08, uSheenColor, 0.20), pow(sideMetalBand, 7.0));
  body = mix(body, sideMetal, clamp(uMetallic, 0.0, 1.0) * 0.76);
  float sideAlpha = mix(0.97, 0.78, clamp(uTranslucency, 0.0, 1.0));
  outColor = vec4(body, sideAlpha);
}`;

const compile = (gl: WebGL2RenderingContext, type: number, source: string): WebGLShader => {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Pages sidewall shader allocation failed');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader) ?? 'unknown GLSL error';
    gl.deleteShader(shader);
    throw new Error(`Pages sidewall shader: ${error}`);
  }
  return shader;
};

interface SideGpu {
  readonly program: WebGLProgram;
  readonly vao: WebGLVertexArrayObject;
  readonly positions: WebGLBuffer;
  readonly indices: WebGLBuffer;
  readonly uScale: WebGLUniformLocation;
  readonly uMoldProgress: WebGLUniformLocation;
  readonly uAppearanceEnabled: WebGLUniformLocation;
  readonly uColorLow: WebGLUniformLocation;
  readonly uColorHigh: WebGLUniformLocation;
  readonly uSheenColor: WebGLUniformLocation;
  readonly uMetallic: WebGLUniformLocation;
  readonly uTranslucency: WebGLUniformLocation;
  readonly uCompression: WebGLUniformLocation;
}

/** A per-frame contour strip in Phaser's EXISTING WebGL2 context.
 * All contour positions are projected through the actual simulation, so both
 * the back roll and the front move with the same squeeze, without a new RAF,
 * WebGL context, document format, or static Hall screenshot. */
export class PhaserDeformableVolume {
  private gpu: SideGpu | null = null;
  private shape: ShapeDefinition | null = null;
  private packed = new Float32Array(0);
  private indexCount = 0;

  constructor(private readonly gl: WebGL2RenderingContext) {}

  private createGpu(): SideGpu {
    const gl = this.gl;
    const vertex = compile(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, SIDE_FRAGMENT);
    const program = gl.createProgram();
    if (!program) throw new Error('Pages sidewall program allocation failed');
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program) ?? 'unknown linker error';
      gl.deleteProgram(program);
      throw new Error(`Pages sidewall program: ${error}`);
    }
    const vao = gl.createVertexArray();
    const positions = gl.createBuffer();
    const indices = gl.createBuffer();
    if (!vao || !positions || !indices) throw new Error('Pages sidewall buffer allocation failed');
    const uniform = (name: string): WebGLUniformLocation => {
      const location = gl.getUniformLocation(program, name);
      if (location === null) throw new Error(`Pages sidewall missing uniform ${name}`);
      return location;
    };
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, positions);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
    gl.bindVertexArray(null);
    gl.useProgram(program);
    gl.uniform1i(uniform('uAppearanceTexture'), 1);
    return {
      program, vao, positions, indices,
      uScale: uniform('uScale'),
      uMoldProgress: uniform('uMoldProgress'),
      uAppearanceEnabled: uniform('uAppearanceEnabled'),
      uColorLow: uniform('uColorLow'),
      uColorHigh: uniform('uColorHigh'),
      uSheenColor: uniform('uSheenColor'),
      uMetallic: uniform('uMetallic'),
      uTranslucency: uniform('uTranslucency'),
      uCompression: uniform('uCompression'),
    };
  }

  private setShape(shape: ShapeDefinition): void {
    if (this.shape === shape) return;
    const gl = this.gl;
    const n = shape.boundary.length;
    this.packed = new Float32Array(n * 2 * 4);
    const indices = new Uint16Array(n * 6);
    for (let i = 0; i < n; i += 1) {
      const next = (i + 1) % n;
      indices.set([i, n + i, next, next, n + i, n + next], i * 6);
    }
    const gpu = this.gpu!;
    gl.bindVertexArray(gpu.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpu.indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    this.indexCount = indices.length;
    this.shape = shape;
  }

  render(
    simulation: SquishSimulation,
    shape: ShapeDefinition,
    material: SquishMaterialStyle,
    appearance: WebGLTexture,
    appearanceEnabled: boolean,
    scaleX: number,
    scaleY: number,
    moldProgress: number,
    compression: number,
  ): void {
    const gl = this.gl;
    if (gl.isContextLost()) return;
    this.gpu ??= this.createGpu();
    this.setShape(shape);
    const n = shape.boundary.length;
    // A shallow back roll that grows as the soft body finishes molding.
    const thickness = 0.014 + 0.038 * Math.min(1, Math.max(0, moldProgress));
    for (let i = 0; i < n; i += 1) {
      const point = shape.boundary[i]!;
      const u = point.x * 0.5 + 0.5;
      const v = point.y * 0.5 + 0.5;
      const deformed = simulation.projectUvToLocal(u, v);
      // Overlap the antialiased 2D edge by a few pixels. Without this the
      // alpha falloff exposes a dotted background seam between the two meshes.
      const inset = simulation.projectUvToLocal(0.5 + (u - 0.5) * 0.962, 0.5 + (v - 0.5) * 0.962);
      const a = i * 4;
      const b = (n + i) * 4;
      this.packed[a] = inset.x;
      // Raise the side's inner rim into the opaque front, covering the
      // subpixel antialias transition without changing the outer silhouette.
      this.packed[a + 1] = inset.y + 0.025;
      this.packed[b] = deformed.x + thickness * 0.31;
      this.packed[b + 1] = deformed.y - thickness;
      this.packed[a + 2] = this.packed[b + 2] = u;
      this.packed[a + 3] = this.packed[b + 3] = v;
    }
    const gpu = this.gpu;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, appearance);
    gl.useProgram(gpu.program);
    gl.uniform2f(gpu.uScale, scaleX, scaleY);
    gl.uniform1f(gpu.uMoldProgress, moldProgress);
    gl.uniform1i(gpu.uAppearanceEnabled, appearanceEnabled ? 1 : 0);
    gl.uniform3f(gpu.uColorLow, ...material.low);
    gl.uniform3f(gpu.uColorHigh, ...material.high);
    gl.uniform3f(gpu.uSheenColor, ...material.sheen);
    gl.uniform1f(gpu.uMetallic, material.metallic);
    gl.uniform1f(gpu.uTranslucency, material.translucency);
    gl.uniform1f(gpu.uCompression, compression);
    gl.bindVertexArray(gpu.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gpu.positions);
    gl.bufferData(gl.ARRAY_BUFFER, this.packed, gl.DYNAMIC_DRAW);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }

  dispose(): void {
    const gpu = this.gpu;
    this.gpu = null;
    this.shape = null;
    if (!gpu || this.gl.isContextLost()) return;
    this.gl.deleteProgram(gpu.program);
    this.gl.deleteVertexArray(gpu.vao);
    this.gl.deleteBuffer(gpu.positions);
    this.gl.deleteBuffer(gpu.indices);
  }
}
