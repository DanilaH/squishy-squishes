import { REST_FACE, type FaceReaction } from './toyReactions';
import { drawSeatedAccessories } from './decor';
import { getMaterial, getPalette } from '../game/content';
import { createShapeField, getShape, type ShapeId } from '../game/shapes';
import { SquishSimulation } from '../squish/SquishSimulation';
import { vertexShaderSource } from '../squish/shaders';
import { APPEARANCE_TEXTURE_SIZE } from './appearance';
import { getPagesVolumeFrontShader, PhaserDeformableVolume } from '../experiments/phaser/PhaserDeformableVolume';
import { renderToyInclusions, renderToyInk, renderToyPigment } from './toySurfaceLayers';
import { hasSurfaceDecor } from './decor';
import type { SavedSquishy } from './types';
import { hasShapeRelief } from './shapeRelief';

/** An on-demand, single-context static snapshot of the actual Studio shader.
 * This is Pages-only; the original Canvas2D thumbnail remains the fallback.
 * Never create a WebGL context per saved toy, and never schedule a frame here. */
const SIZE = 512;
const LOGICAL_SIZE = 256;
const FIELD_SIZE = 128;
const UNIFORMS = [
  'uScale', 'uMoldProgress', 'uShapeField', 'uAppearanceTexture', 'uAppearanceEnabled',
  'uFillingDrift', 'uFaceTexture', 'uFaceEnabled', 'uInclusionTexture', 'uInclusionEnabled', 'uPointerUv', 'uStrainDirection', 'uColorLow', 'uColorHigh', 'uSheenColor', 'uRimColor',
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
  private readonly faceTexture: WebGLTexture;
  private readonly inclusionTexture: WebGLTexture;
  private readonly face = document.createElement('canvas');
  private readonly inclusion = document.createElement('canvas');
  private readonly volume: PhaserDeformableVolume;
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
      preserveDrawingBuffer: true, premultipliedAlpha: true,
      powerPreference: 'low-power',
    });
    if (!gl) throw new Error('WebGL2 unavailable for static Library snapshots');
    this.gl = gl;
    this.volume = new PhaserDeformableVolume(gl);
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

    let vertex: WebGLShader | null = null;
    let fragment: WebGLShader | null = null;
    let program: WebGLProgram | null = null;
    let vao: WebGLVertexArrayObject | null = null;
    let vertexBuffer: WebGLBuffer | null = null;
    let indices: WebGLBuffer | null = null;
    let shapeTexture: WebGLTexture | null = null;
    let appearanceTexture: WebGLTexture | null = null;
    let faceTexture: WebGLTexture | null = null;
    let inclusionTexture: WebGLTexture | null = null;
    try {
      vertex = compile(gl.VERTEX_SHADER, vertexShaderSource);
      fragment = compile(gl.FRAGMENT_SHADER, getPagesVolumeFrontShader());
      program = gl.createProgram();
      if (!program) throw new Error('Library shader program allocation failed');
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const reason = gl.getProgramInfoLog(program) ?? 'unknown error';
        throw new Error(`Library Studio shader link: ${reason}`);
      }

      const uniforms = new Map<Uniform, WebGLUniformLocation>();
      for (const name of UNIFORMS) {
        const location = gl.getUniformLocation(program, name);
        if (location === null) throw new Error(`Missing Studio uniform ${name}`);
        uniforms.set(name, location);
      }

      vao = gl.createVertexArray();
      vertexBuffer = gl.createBuffer();
      indices = gl.createBuffer();
      shapeTexture = gl.createTexture();
      appearanceTexture = gl.createTexture();
      faceTexture = gl.createTexture(); inclusionTexture = gl.createTexture();
      if (!vao || !vertexBuffer || !indices || !shapeTexture || !appearanceTexture || !faceTexture || !inclusionTexture) {
        throw new Error('Library Studio buffer/texture allocation failed');
      }

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
      for (const [unit, texture] of [[gl.TEXTURE0, shapeTexture], [gl.TEXTURE1, appearanceTexture], [gl.TEXTURE2, faceTexture], [gl.TEXTURE3, inclusionTexture]] as const) {
        gl.activeTexture(unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }

      this.appearance.width = APPEARANCE_TEXTURE_SIZE;
      this.appearance.height = APPEARANCE_TEXTURE_SIZE;
      const context = this.appearance.getContext('2d');
      if (!context) throw new Error('Library Studio appearance canvas unavailable');
      // The V3 authoring coordinates stay in the original 256px domain.
      // Use the same logical texture resolution as the live toy; only the
      // destination thumbnail resolution changes between Hall and the tray.
      context.setTransform(1, 0, 0, 1, 0, 0);
      this.face.width = this.face.height = this.inclusion.width = this.inclusion.height = APPEARANCE_TEXTURE_SIZE;

      this.program = program;
      this.uniforms = uniforms;
      this.vao = vao;
      this.vertexBuffer = vertexBuffer;
      this.indices = indices;
      this.shapeTexture = shapeTexture;
      this.appearanceTexture = appearanceTexture;
      this.faceTexture = faceTexture; this.inclusionTexture = inclusionTexture;
      this.appearanceContext = context;
    } catch (error: unknown) {
      if (vao) gl.deleteVertexArray(vao);
      if (vertexBuffer) gl.deleteBuffer(vertexBuffer);
      if (indices) gl.deleteBuffer(indices);
      if (shapeTexture) gl.deleteTexture(shapeTexture);
      if (appearanceTexture) gl.deleteTexture(appearanceTexture);
      if (faceTexture) gl.deleteTexture(faceTexture);
      if (inclusionTexture) gl.deleteTexture(inclusionTexture);
      if (program) gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      throw error;
    } finally {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
    }
  }

  public render(destination: CanvasRenderingContext2D, toy: SavedSquishy, snapshotSize: 256 | 512 = SIZE, reaction: FaceReaction = REST_FACE): void {
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
      toy.appearance.mixins.length > 0 || hasSurfaceDecor(toy.decor) || hasShapeRelief(toy.shapeId);
    if (hasAppearance) {
      // Pigment stays separate from inclusions and face ink in every scene.
      renderToyPigment(this.appearanceContext, toy.appearance, toy.materialId, toy.shapeId);
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
    renderToyInk(this.face.getContext('2d')!, toy.decor, toy.shapeId, reaction);
    renderToyInclusions(this.inclusion.getContext('2d')!, toy.appearance, toy.materialId);
    for (const [unit, texture, source] of [[gl.TEXTURE2, this.faceTexture, this.face], [gl.TEXTURE3, this.inclusionTexture, this.inclusion]] as const) {
      gl.activeTexture(unit); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    }
    const palette = getPalette('milk');
    const material = getMaterial(toy.materialId);
    gl.viewport(0, 0, snapshotSize, snapshotSize);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.simulation.setShape(getShape(toy.shapeId));
    this.volume.render(this.simulation, getShape(toy.shapeId), { ...palette, ...material, materialId: toy.materialId },
      this.appearanceTexture, hasAppearance, .80, .80, 1, 0);
    gl.useProgram(this.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.shapeTexture);
    gl.uniform1i(u('uShapeField'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.appearanceTexture);
    gl.uniform1i(u('uAppearanceTexture'), 1);
    gl.uniform1i(u('uAppearanceEnabled'), hasAppearance ? 1 : 0);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.faceTexture);
    gl.uniform1i(u('uFaceTexture'), 2); gl.uniform1i(u('uFaceEnabled'), 1);
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, this.inclusionTexture);
    gl.uniform1i(u('uInclusionTexture'), 3); gl.uniform1i(u('uInclusionEnabled'), toy.appearance.mixins.length ? 1 : 0);
    gl.uniform2f(u('uFillingDrift'), 0, 0);
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
    if (toy.decor.accessory) drawSeatedAccessories(destination, getShape(toy.shapeId), toy.decor.accessory,
      (u, v) => [128 + (u * 2 - 1) * 102.4 * 1.075, 128 - ((v * 2 - 1) * .905 - .018) * 102.4], 112, 75);
  }

  public dispose(): void {
    const gl = this.gl;
    this.volume.dispose();
    if (!gl.isContextLost()) {
      gl.deleteVertexArray(this.vao);
      gl.deleteBuffer(this.vertexBuffer);
      gl.deleteBuffer(this.indices);
      gl.deleteTexture(this.shapeTexture);
      gl.deleteTexture(this.appearanceTexture);
      gl.deleteTexture(this.faceTexture); gl.deleteTexture(this.inclusionTexture);
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
  context: CanvasRenderingContext2D, toy: SavedSquishy, snapshotSize: 256 | 512 = SIZE, reaction: FaceReaction = REST_FACE,
): boolean => {
  if (unavailable) return false;
  try {
    shared ??= new StudioThumbnailRenderer();
    shared.render(context, toy, snapshotSize, reaction);
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
