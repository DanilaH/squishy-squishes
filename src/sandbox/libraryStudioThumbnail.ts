import { getMaterial, getPalette } from '../game/content';
import { createShapeField, getShape, type ShapeId } from '../game/shapes';
import { SquishSimulation } from '../squish/SquishSimulation';
import { fragmentShaderSource, vertexShaderSource } from '../squish/shaders';
import { APPEARANCE_TEXTURE_SIZE, replayAppearanceDocument } from './appearance';
import { renderSurfaceDecor, hasSurfaceDecor } from './decor';
import type { SavedSquishy } from './types';

/** An on-demand, single-context static snapshot of the actual Studio shader.
 * This is Pages-only; the original Canvas2D thumbnail remains the fallback.
 * Never create a WebGL context per saved toy, and never schedule a frame here. */
const SIZE = 512;
const LOGICAL_SIZE = 256;
const FIELD_SIZE = 256;
const UNIFORMS = [
  'uScale', 'uMoldProgress', 'uShapeField', 'uAppearanceTexture', 'uAppearanceEnabled',
  'uPointerUv', 'uStrainDirection', 'uColorLow', 'uColorHigh', 'uSheenColor', 'uRimColor',
  'uCompression', 'uPressDepth', 'uFillingAmount', 'uFillingStyle', 'uFillProgress',
  'uMaterialSeed', 'uTranslucency', 'uIridescence', 'uRoughness', 'uMetallic',
  'uPearlescence', 'uCloudiness', 'uWireframePass',
] as const;
type Uniform = typeof UNIFORMS[number];

class StudioThumbnailRenderer {
  private readonly canvas = document.createElement('canvas');
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly vertexBuffer: WebGLBuffer;
  private readonly indices: WebGLBuffer;
  private readonly shapeTexture: WebGLTexture;
  private readonly appearanceTexture: WebGLTexture;
  private readonly uniforms: ReadonlyMap<Uniform, WebGLUniformLocation>;
  private readonly simulation = new SquishSimulation(getShape('soft-square'));
  private readonly vertices = new Float32Array(this.simulation.vertices.length * 4);
  private readonly shapeFields = new Map<ShapeId, Uint8Array>();
  private readonly appearance = document.createElement('canvas');
  private readonly appearanceContext: CanvasRenderingContext2D;
  private lastShape: ShapeId | null = null;

  public constructor() {
    this.canvas.width = SIZE;
    this.canvas.height = SIZE;
    const gl = this.canvas.getContext('webgl2', {
      alpha: true, antialias: true, depth: false, stencil: false,
      preserveDrawingBuffer: true, premultipliedAlpha: false,
      powerPreference: 'low-power',
    });
    if (!gl) throw new Error('WebGL2 unavailable for static Library snapshots');
    this.gl = gl;
    const compile = (kind: number, source: string): WebGLShader => {
      const shader = gl.createShader(kind);
      if (!shader) throw new Error('Library shader allocation failed');
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const reason = gl.getShaderInfoLog(shader) ?? 'unknown error';
        gl.deleteShader(shader);
        throw new Error(`Library Studio shader: ${reason}`);
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, vertexShaderSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = gl.createProgram();
    if (!program) throw new Error('Library shader program allocation failed');
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const reason = gl.getProgramInfoLog(program) ?? 'unknown error';
      gl.deleteProgram(program);
      throw new Error(`Library Studio shader link: ${reason}`);
    }
    this.program = program;
    const uniforms = new Map<Uniform, WebGLUniformLocation>();
    for (const name of UNIFORMS) {
      const location = gl.getUniformLocation(program, name);
      if (location === null) throw new Error(`Missing Studio uniform ${name}`);
      uniforms.set(name, location);
    }
    this.uniforms = uniforms;
    const vao = gl.createVertexArray();
    const vertexBuffer = gl.createBuffer();
    const indices = gl.createBuffer();
    const shapeTexture = gl.createTexture();
    const appearanceTexture = gl.createTexture();
    if (!vao || !vertexBuffer || !indices || !shapeTexture || !appearanceTexture) {
      throw new Error('Library Studio buffer/texture allocation failed');
    }
    this.vao = vao;
    this.vertexBuffer = vertexBuffer;
    this.indices = indices;
    this.shapeTexture = shapeTexture;
    this.appearanceTexture = appearanceTexture;
    for (let index = 0; index < this.simulation.vertices.length; index += 1) {
      const vertexState = this.simulation.vertices[index]!;
      const offset = index * 4;
      this.vertices[offset] = vertexState.restX;
      this.vertices[offset + 1] = vertexState.restY;
      this.vertices[offset + 2] = vertexState.u;
      this.vertices[offset + 3] = vertexState.v;
    }
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.simulation.triangleIndices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    for (const [unit, texture] of [[gl.TEXTURE0, shapeTexture], [gl.TEXTURE1, appearanceTexture]] as const) {
      gl.activeTexture(unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    this.appearance.width = APPEARANCE_TEXTURE_SIZE * 2;
    this.appearance.height = APPEARANCE_TEXTURE_SIZE * 2;
    const context = this.appearance.getContext('2d');
    if (!context) throw new Error('Library Studio appearance canvas unavailable');
    // The V3 authoring coordinates stay in the original 256px domain.
    // Rasterize their actual strokes, expressions and stickers at 2x.
    context.setTransform(2, 0, 0, 2, 0, 0);
    this.appearanceContext = context;
  }

  public render(destination: CanvasRenderingContext2D, toy: SavedSquishy, snapshotSize: 256 | 512 = SIZE): void {
    const gl = this.gl;
    // A single context switches drawing-buffer size for the 256px benchmark;
    // production Pages exhibits always use 512px. No extra context is made.
    if (this.canvas.width !== snapshotSize || this.canvas.height !== snapshotSize) {
      this.canvas.width = snapshotSize;
      this.canvas.height = snapshotSize;
    }
    if (gl.isContextLost()) throw new Error('Library Studio context lost');
    gl.useProgram(this.program);
    const u = (name: Uniform): WebGLUniformLocation => this.uniforms.get(name)!;
    if (toy.shapeId !== this.lastShape) {
      let field = this.shapeFields.get(toy.shapeId);
      if (!field) {
        field = createShapeField(getShape(toy.shapeId), FIELD_SIZE);
        this.shapeFields.set(toy.shapeId, field);
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.shapeTexture);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, FIELD_SIZE, FIELD_SIZE, 0, gl.RED, gl.UNSIGNED_BYTE, field);
      this.lastShape = toy.shapeId;
    }
    const hasAppearance = toy.appearance.strokes.length > 0 ||
      toy.appearance.mixins.length > 0 || hasSurfaceDecor(toy.decor);
    if (hasAppearance) {
      // Flatten rigid pearl mix-ins only in the static thumbnail; Studio's live
      // squeeze scene draws those separately, but a saved decoration must not vanish.
      replayAppearanceDocument(this.appearanceContext, toy.appearance);
      renderSurfaceDecor(this.appearanceContext, toy.decor, getShape(toy.shapeId));
    }
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.appearanceTexture);
    if (hasAppearance) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.appearance);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    }
    const palette = getPalette('milk');
    const material = getMaterial(toy.materialId);
    gl.viewport(0, 0, snapshotSize, snapshotSize);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.shapeTexture);
    gl.uniform1i(u('uShapeField'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.appearanceTexture);
    gl.uniform1i(u('uAppearanceTexture'), 1);
    gl.uniform1i(u('uAppearanceEnabled'), hasAppearance ? 1 : 0);
    // A still, molded silhouette at the Library's existing approximate size.
    gl.uniform2f(u('uScale'), 0.80, 0.80);
    gl.uniform1f(u('uMoldProgress'), 1);
    gl.uniform2f(u('uPointerUv'), 0.5, 0.5);
    gl.uniform2f(u('uStrainDirection'), 0, 0);
    gl.uniform1f(u('uCompression'), 0);
    gl.uniform1f(u('uPressDepth'), 0);
    gl.uniform3f(u('uColorLow'), ...palette.low);
    gl.uniform3f(u('uColorHigh'), ...palette.high);
    gl.uniform3f(u('uSheenColor'), ...palette.sheen);
    gl.uniform3f(u('uRimColor'), ...palette.rim);
    gl.uniform1f(u('uFillingAmount'), 0);
    gl.uniform1f(u('uFillingStyle'), 0);
    gl.uniform1f(u('uFillProgress'), 1);
    gl.uniform1f(u('uMaterialSeed'), palette.seed);
    gl.uniform1f(u('uTranslucency'), material.translucency);
    gl.uniform1f(u('uIridescence'), material.iridescence);
    gl.uniform1f(u('uRoughness'), material.roughness);
    gl.uniform1f(u('uMetallic'), material.metallic);
    gl.uniform1f(u('uPearlescence'), material.pearlescence);
    gl.uniform1f(u('uCloudiness'), material.cloudiness);
    gl.uniform1i(u('uWireframePass'), 0);
    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, this.simulation.triangleIndices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
    // The real Studio shader pixels are copied into each ordinary Canvas2D card.
    // Nothing animated or WebGL-backed remains attached to an exhibit.
    // The destination has a 1x or 2x transform; draw in 256 logical units.
    destination.drawImage(this.canvas, 0, 0, LOGICAL_SIZE, LOGICAL_SIZE);
  }

  public dispose(): void {
    const gl = this.gl;
    if (!gl.isContextLost()) {
      gl.deleteVertexArray(this.vao);
      gl.deleteBuffer(this.vertexBuffer);
      gl.deleteBuffer(this.indices);
      gl.deleteTexture(this.shapeTexture);
      gl.deleteTexture(this.appearanceTexture);
      gl.deleteProgram(this.program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    this.shapeFields.clear();
  }
}

let shared: StudioThumbnailRenderer | null = null;
let unavailable = false;
/** Return false without changing destination on absence or loss of WebGL2. */
export const renderStudioLibraryThumbnail = (
  context: CanvasRenderingContext2D, toy: SavedSquishy, snapshotSize: 256 | 512 = SIZE,
): boolean => {
  if (unavailable) return false;
  try {
    shared ??= new StudioThumbnailRenderer();
    shared.render(context, toy, snapshotSize);
    return true;
  } catch (error) {
    console.warn('Pages Library static Studio shader unavailable; using Canvas2D fallback.', error);
    shared?.dispose();
    shared = null;
    unavailable = true;
    return false;
  }
};

/** Leaving Hall releases the single shared context before mounting Studio. */
export const releaseStudioLibraryThumbnail = (): void => {
  shared?.dispose();
  shared = null;
  unavailable = false;
};
