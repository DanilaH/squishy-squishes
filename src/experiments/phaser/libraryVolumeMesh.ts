import { getShape } from '../../game/shapes';
import { getMaterial, getPalette } from '../../game/content';
import { drawSeatedAccessories } from '../../sandbox/decor';
import type { SavedSquishy } from '../../sandbox/types';

/** Lab-only curved geometry. Exactly one disposable offscreen WebGL2 context
 * renders all five-way comparison specimens on demand, never per Hall card. */
const SIZE = 512;
const FRONT_RINGS = 26;
const STRIDE = 9;
const VERTEX = `#version 300 es
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aUv;
layout(location=3) in float aFront;
out vec3 vNormal;
out vec2 vUv;
out float vFront;
void main() {
  // Saved paint/decor/accessories are authored in Studio's front frame.
  // Keep Hall front-facing; curvature/normals provide the visible thickness.
  const float yaw = 0.0;
  const float pitch = 0.0;
  float cy = cos(yaw), sy = sin(yaw), cp = cos(pitch), sp = sin(pitch);
  vec3 p = vec3(aPosition.x * cy + aPosition.z * sy,
                aPosition.y, -aPosition.x * sy + aPosition.z * cy);
  vec3 n = vec3(aNormal.x * cy + aNormal.z * sy,
                aNormal.y, -aNormal.x * sy + aNormal.z * cy);
  p = vec3(p.x, p.y * cp - p.z * sp, p.y * sp + p.z * cp);
  n = vec3(n.x, n.y * cp - n.z * sp, n.y * sp + n.z * cp);
  vNormal = normalize(n);
  vUv = aUv;
  vFront = aFront;
  // Match the finished Studio mold and the existing neutral albedo UVs:
  // +7.5% horizontal stretch, -9.5% vertical stretch, -1.8% seat.
  gl_Position = vec4(p.x * 0.80 * 1.075, (p.y * 0.905 - 0.018) * 0.80, -p.z * 0.16, 1.0);
}`;
const FRAGMENT = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUv;
in float vFront;
uniform sampler2D uFront;
uniform vec3 uSideColor;
uniform vec3 uSheenColor;
uniform vec3 uRimColor;
uniform float uMaterialSeed;
uniform float uTranslucency;
uniform float uIridescence;
uniform float uRoughness;
uniform float uMetallic;
uniform float uPearlescence;
uniform float uCloudiness;
out vec4 outColor;

vec3 spectralColor(float phase) {
  return 0.52 + 0.48 * cos(6.2831853 * (phase + vec3(0.00, 0.33, 0.67)));
}

vec3 applyMaterial(vec3 base, vec2 uv, float edge) {
  float translucency = clamp(uTranslucency, 0.0, 1.0);
  float roughness = clamp(uRoughness, 0.0, 1.0);
  float cloudiness = clamp(uCloudiness, 0.0, 1.0);
  float interior = 1.0 - edge;
  float authoredLuma = dot(base, vec3(0.2126, 0.7152, 0.0722));
  float authoredMax = max(base.r, max(base.g, base.b));
  float authoredMin = min(base.r, min(base.g, base.b));
  float authoredChroma = authoredMax - authoredMin;
  float lightSurface = smoothstep(0.68, 0.94, authoredLuma);
  float warmSurface = lightSurface * smoothstep(0.02, 0.22, (base.r + base.g) * 0.5 - base.b);

  base *= 1.0 - translucency * (0.020 + interior * 0.040);
  base = mix(base, base * 0.965 + uSheenColor * 0.035, translucency * 0.14);
  float jellyIdentity = translucency * (1.0 - uIridescence) * (1.0 - uPearlescence) * (1.0 - uMetallic);
  float jellyColourProtection = smoothstep(0.10, 0.52, authoredChroma);
  float jellyTintWeight = jellyIdentity * mix(0.34, 0.10, jellyColourProtection);
  base = mix(base, vec3(0.34, 0.88, 0.84), jellyTintWeight);
  float jellyContrast = jellyIdentity * (0.075 + lightSurface * 0.070);
  base = clamp(vec3(0.5) + (base - vec3(0.5)) * (1.0 + jellyContrast), 0.0, 1.0);
  float gelWave = 0.5 + 0.5 * sin((uv.x * 1.72 + uv.y * 1.08 + uMaterialSeed * 2.31) * 6.2831853);
  base += uSheenColor * pow(gelWave, 5.5) * interior * translucency * 0.045;
  base += uRimColor * edge * translucency * (0.25 + lightSurface * 0.04);

  float cloudA = 0.5 + 0.5 * sin((uv.x * 2.2 + uv.y * 1.45 + uMaterialSeed * 1.7) * 6.2831853);
  float cloudB = 0.5 + 0.5 * sin((uv.x * 4.7 - uv.y * 3.1 + uMaterialSeed * 2.9) * 6.2831853);
  float cloudField = cloudA * 0.62 + cloudB * 0.38;
  float milkyWeight = cloudiness * (0.72 + cloudField * 0.18);
  vec3 milkyTint = mix(uSheenColor, vec3(1.0), 0.42 + cloudField * 0.10);
  vec3 cloudyBase = mix(base * (0.98 + cloudField * 0.025), milkyTint, 0.24 + cloudField * 0.10);
  base = mix(base, cloudyBase, clamp(milkyWeight, 0.0, 0.86));
  float marshmallowIdentity = cloudiness * roughness
    * (1.0 - clamp(uIridescence, 0.0, 1.0))
    * (1.0 - clamp(uPearlescence, 0.0, 1.0))
    * (1.0 - clamp(uMetallic, 0.0, 1.0));
  vec3 marshmallowTint = vec3(1.0, 0.925, 0.82);
  float marshmallowWrap = 1.0 - smoothstep(0.18, 0.82, length(uv - vec2(0.5)) * 1.32);
  float marshmallowLuma = dot(base, vec3(0.2126, 0.7152, 0.0722));
  vec3 marshmallowPowder = mix(vec3(marshmallowLuma), marshmallowTint, 0.50);
  float marshmallowPowderWeight = marshmallowIdentity * (0.34 + marshmallowWrap * 0.18 + lightSurface * 0.06);
  base = mix(base, marshmallowPowder, clamp(marshmallowPowderWeight, 0.0, 0.56));
  base += marshmallowTint * marshmallowIdentity * (0.030 + edge * 0.085 + marshmallowWrap * 0.025);

  float iridescence = clamp(uIridescence, 0.0, 1.0);
  float spectralPhase = uv.x * 0.78 + uv.y * 0.44 + uMaterialSeed * 0.61;
  float holoSweep = 0.5 + 0.5 * sin((uv.x * 1.58 - uv.y * 0.96 + uMaterialSeed * 0.93) * 6.2831853);
  float holoFine = 0.5 + 0.5 * sin((uv.x * 3.35 + uv.y * 1.70 + uMaterialSeed * 1.37) * 6.2831853);
  vec3 spectral = spectralColor(spectralPhase + holoFine * 0.07);
  base = mix(base, spectral, iridescence * (0.13 + holoSweep * 0.29 + edge * 0.12 + warmSurface * 0.07));
  base += vec3(0.72, 0.90, 1.0) * iridescence * warmSurface * holoSweep * 0.025;

  float pearlescence = clamp(uPearlescence, 0.0, 1.0);
  float pearlBand = 0.5 + 0.5 * sin((uv.x * 0.64 + uv.y * 0.42 + uMaterialSeed * 0.71) * 6.2831853);
  float pearlCross = 0.5 + 0.5 * sin((uv.x * 0.38 - uv.y * 0.58 + uMaterialSeed * 0.33) * 6.2831853);
  vec3 pearlRose = vec3(1.0, 0.62, 0.88);
  vec3 pearlCyan = vec3(0.48, 0.91, 1.0);
  vec3 pearlNacre = mix(pearlRose, pearlCyan, pearlBand);
  vec3 pearlSpectrum = mix(pearlNacre, spectralColor(spectralPhase * 0.42 + pearlCross * 0.12 + 0.10), 0.28);
  float pearlTintWeight = pearlescence * (0.34 + pearlBand * 0.22 + edge * 0.08 + lightSurface * 0.05);
  vec3 pearlSurface = mix(base * (0.985 + pearlCross * 0.020), pearlSpectrum, pearlTintWeight);
  base = mix(base, pearlSurface, pearlescence * (0.82 + edge * 0.08));
  float pearlSheen = pow(0.5 + 0.5 * sin(
    (uv.x * 0.92 - uv.y * 0.38 + uMaterialSeed * 0.81) * 6.2831853
  ), 3.2);
  vec3 pearlSheenColor = mix(pearlRose, pearlCyan, 0.5 + 0.5 * sin(
    (uv.x * 0.48 + uv.y * 0.36 + uMaterialSeed * 0.57) * 6.2831853
  ));
  float nacreSweep = 0.5 + 0.5 * sin(
    (uv.x * 0.72 + uv.y * 0.22 + uMaterialSeed * 0.67) * 6.2831853
  );
  vec3 nacreBand = mix(pearlRose, pearlCyan, nacreSweep);
  base = mix(base, mix(base, nacreBand, 0.56), pearlescence * (0.20 + edge * 0.06));
  base += pearlSheenColor * pearlescence * pearlSheen * (0.135 + edge * 0.024);

  float metallic = clamp(uMetallic, 0.0, 1.0);
  float metalBandA = 0.5 + 0.5 * sin((uv.y * 1.22 + uv.x * 0.28 + uMaterialSeed * 0.53) * 6.2831853);
  float metalBandB = 0.5 + 0.5 * sin((uv.y * 2.72 - uv.x * 0.19 + uMaterialSeed * 0.91) * 6.2831853);
  float metalHighlight = pow(metalBandA, mix(14.0, 4.6, roughness));
  float metalDarkBand = pow(1.0 - metalBandB, 3.4);
  vec3 metalDark = base * mix(0.48, 0.27, metalDarkBand);
  vec3 metalMid = base * (0.76 + metalBandA * 0.10);
  vec3 metalLight = mix(base * 1.10, uSheenColor, 0.24);
  vec3 metalSurface = mix(metalMid, metalDark, 0.20 + metalDarkBand * 0.45);
  metalSurface = mix(metalSurface, metalLight, metalHighlight * 0.84);
  return mix(base, metalSurface, metallic * 0.82);
}

void main() {
  vec3 geometricNormal = normalize(vNormal);
  // Concave silhouettes (especially Paw) are tessellated as radial rings. Using
  // those triangle normals for the front cap exposed faint spoke-shaped lighting
  // seams through Holo/Pearl paint. The authored front is a 2D Studio frame, so
  // light it with one continuous UV-space bulge instead; side/back keep the real
  // mesh normal and therefore preserve the visible 3D thickness.
  vec2 frontP = (vUv - vec2(0.5)) * vec2(1.34, 1.12);
  vec3 frontNormal = normalize(vec3(frontP * 0.34, 1.0));
  vec3 n = vFront > 0.5 ? frontNormal : geometricNormal;
  vec3 light = normalize(vec3(-0.42, 0.51, 0.75));
  float diffuse = max(dot(n, light), 0.0);
  vec4 paint = texture(uFront, vUv);
  if (paint.a < 0.025) paint = vec4(uSideColor, 1.0);

  // Front vertices encode their contour-ring radius in vFront (1..2).
  // Using that continuous ring coordinate gives a clean narrow rim without
  // consulting concave triangle normals or the intentionally overfilled albedo.
  float frontRadius = clamp(vFront - 1.0, 0.0, 1.0);
  float frontRim = vFront > 0.5
    ? smoothstep(0.80, 0.995, frontRadius)
    : (1.0 - smoothstep(0.58, 0.91, n.z));
  // Authored paint/stickers/face belong to the front Studio frame. Keep the
  // side mostly material/body coloured so edge artwork cannot echo around the
  // thickness and read as a slipped second mask.
  float materialEdge = vFront > 0.5 ? frontRim : 0.38;
  vec3 color = vFront > 0.5
    ? paint.rgb
    : mix(uSideColor, paint.rgb, 0.08);
  color = applyMaterial(color, vUv, materialEdge);
  color *= vFront > 0.5
    ? (0.80 + 0.18 * diffuse) * (1.0 - 0.14 * frontRim)
    : (0.78 + 0.20 * diffuse);

  vec3 halfDirection = normalize(light + vec3(0.0, 0.0, 1.0));
  float roughness = clamp(uRoughness, 0.0, 1.0);
  float specPower = mix(34.0, 8.0, roughness);
  float specStrength = mix(0.12, 0.035, roughness) * (1.0 + uMetallic * 0.9 + uPearlescence * 0.22);
  color += uSheenColor * pow(max(dot(n, halfDirection), 0.0), specPower) * specStrength;

  float bodyAlpha = mix(0.995, 0.64 + materialEdge * 0.28, clamp(uTranslucency, 0.0, 1.0));
  outColor = vec4(clamp(color, 0.0, 1.0), paint.a * bodyAlpha);
}`;

const addVertex = (vertices: number[], x: number, y: number, z: number,
  nx: number, ny: number, nz: number, front: number, uvRadius = 1): void => {
  // Inverse of the 512px control's logical 256px silhouette transform. The
  // uploaded texture has UNPACK_FLIP_Y_WEBGL set for bottom-origin UVs.
  vertices.push(x, y, z, nx, ny, nz,
    0.5 + x * 0.43 * uvRadius, 0.5 + y * 0.362 * uvRadius - 0.0072, front);
};

const createMesh = (toy: SavedSquishy): { vertices: Float32Array; indices: Uint16Array } => {
  const boundary = getShape(toy.shapeId).boundary;
  const count = boundary.length;
  const vertices: number[] = [];
  const indices: number[] = [];
  let area = 0;
  for (let i = 0; i < count; i += 1) {
    const a = boundary[i]!, b = boundary[(i + 1) % count]!;
    area += a.x * b.y - b.x * a.y;
  }
  const orientation = area >= 0 ? 1 : -1;
  const outward = boundary.map((_, i) => {
    const previous = boundary[(i + count - 1) % count]!;
    const next = boundary[(i + 1) % count]!;
    const tx = next.x - previous.x, ty = next.y - previous.y;
    const length = Math.hypot(tx, ty) || 1;
    return { x: orientation * ty / length, y: -orientation * tx / length };
  });
  const joinRings = (start: number, rings: number): void => {
    for (let ring = 0; ring < rings - 1; ring += 1) {
      for (let i = 0; i < count; i += 1) {
        const next = (i + 1) % count;
        const a = start + ring * count + i;
        const b = start + ring * count + next;
        const c = start + (ring + 1) * count + i;
        const d = start + (ring + 1) * count + next;
        indices.push(a, c, b, b, c, d);
      }
    }
  };

  const frontStart = vertices.length / STRIDE;
  for (let ring = 0; ring <= FRONT_RINGS; ring += 1) {
    const radius = ring / FRONT_RINGS;
    const z = 0.09 + 0.19 * Math.sqrt(Math.max(0, 1 - radius * radius));
    for (let i = 0; i < count; i += 1) {
      const point = boundary[i]!, normal = outward[i]!;
      // Smooth radial normals avoid diagonal wedges across concave paw tips.
      const slope = 0.19 * radius / Math.sqrt(Math.max(0.045, 1 - radius * radius));
      const contourBlend = 0.18 * Math.pow(radius, 5);
      const nx = point.x * slope * 0.85 + normal.x * contourBlend;
      const ny = point.y * slope * 0.85 + normal.y * contourBlend;
      const length = Math.hypot(nx, ny, 1);
      // vFront doubles as a smooth front-ring coordinate: 1 at the
      // centre, 2 at the contour. Side/back remain 0.
      addVertex(vertices, point.x * radius, point.y * radius, z,
        nx / length, ny / length, 1 / length, 1 + radius);
    }
  }
  joinRings(frontStart, FRONT_RINGS + 1);

  // Roll the Hall thickness inward from the authored front silhouette. The old
  // 1.025 outer lip exposed a second textured contour around painted/decorated
  // toys, creating the owner-reported mask-registration artifact.
  const sideStart = vertices.length / STRIDE;
  const sections = [
    { r: 1.000, z: 0.090, nz: 0.22 },
    { r: 0.997, z: 0.030, nz: 0.08 },
    { r: 0.989, z: -0.036, nz: -0.10 },
    { r: 0.976, z: -0.080, nz: -0.36 },
    { r: 0.958, z: -0.100, nz: -0.64 },
  ] as const;
  for (const section of sections) {
    for (let i = 0; i < count; i += 1) {
      const point = boundary[i]!, normal = outward[i]!;
      const length = Math.hypot(normal.x, normal.y, section.nz);
      addVertex(vertices, point.x * section.r, point.y * section.r, section.z,
        normal.x / length, normal.y / length, section.nz / length, 0, 0.91 / section.r);
    }
  }
  joinRings(sideStart, sections.length);

  const backStart = vertices.length / STRIDE;
  for (let ring = 0; ring <= 2; ring += 1) {
    const radius = ring / 2;
    const z = -0.100 - 0.020 * Math.sqrt(Math.max(0, 1 - radius * radius));
    for (let i = 0; i < count; i += 1) {
      const point = boundary[i]!, normal = outward[i]!;
      addVertex(vertices, point.x * radius * 0.958, point.y * radius * 0.958,
        z, normal.x * radius * 0.20, normal.y * radius * 0.20, -1, 0);
    }
  }
  joinRings(backStart, 3);
  return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) };
};

class VolumeMeshRenderer {
  private readonly canvas = document.createElement('canvas');
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly vertexBuffer: WebGLBuffer;
  private readonly indexBuffer: WebGLBuffer;
  private readonly frontTexture: WebGLTexture;

  constructor() {
    this.canvas.width = SIZE;
    this.canvas.height = SIZE;
    const gl = this.canvas.getContext('webgl2', {
      alpha: true, antialias: true, preserveDrawingBuffer: true,
      premultipliedAlpha: false, depth: true, stencil: false,
      powerPreference: 'low-power',
    });
    if (!gl) throw new Error('WebGL2 unavailable for the isolated 3D review');
    this.gl = gl;
    const compile = (kind: number, source: string): WebGLShader => {
      const shader = gl.createShader(kind);
      if (!shader) throw new Error('3D review shader allocation failed');
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const details = gl.getShaderInfoLog(shader) ?? '3D review shader compilation failed';
        gl.deleteShader(shader);
        throw new Error(details);
      }
      return shader;
    };

    let vertex: WebGLShader | null = null;
    let fragment: WebGLShader | null = null;
    let program: WebGLProgram | null = null;
    let vao: WebGLVertexArrayObject | null = null;
    let vertexBuffer: WebGLBuffer | null = null;
    let indexBuffer: WebGLBuffer | null = null;
    let frontTexture: WebGLTexture | null = null;
    try {
      vertex = compile(gl.VERTEX_SHADER, VERTEX);
      fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
      program = gl.createProgram();
      if (!program) throw new Error('3D review program allocation failed');
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) ?? '3D review shader link failed');
      }

      vao = gl.createVertexArray();
      vertexBuffer = gl.createBuffer();
      indexBuffer = gl.createBuffer();
      frontTexture = gl.createTexture();
      if (!vao || !vertexBuffer || !indexBuffer || !frontTexture) {
        throw new Error('3D review GPU resource allocation failed');
      }

      this.program = program;
      this.vao = vao;
      this.vertexBuffer = vertexBuffer;
      this.indexBuffer = indexBuffer;
      this.frontTexture = frontTexture;

      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      const stride = STRIDE * Float32Array.BYTES_PER_ELEMENT;
      for (const [index, size, offset] of [[0, 3, 0], [1, 3, 3], [2, 2, 6], [3, 1, 8]] as const) {
        gl.enableVertexAttribArray(index);
        gl.vertexAttribPointer(index, size, gl.FLOAT, false, stride, offset * Float32Array.BYTES_PER_ELEMENT);
      }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bindVertexArray(null);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, frontTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.useProgram(program);
      gl.uniform1i(gl.getUniformLocation(program, 'uFront'), 0);
    } catch (error: unknown) {
      if (vao) gl.deleteVertexArray(vao);
      if (vertexBuffer) gl.deleteBuffer(vertexBuffer);
      if (indexBuffer) gl.deleteBuffer(indexBuffer);
      if (frontTexture) gl.deleteTexture(frontTexture);
      if (program) gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      throw error;
    } finally {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
    }
  }

  render(toy: SavedSquishy, flat: HTMLCanvasElement): HTMLCanvasElement {
    const gl = this.gl;
    if (gl.isContextLost()) throw new Error('3D review WebGL context lost');
    const mesh = createMesh(toy);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.DYNAMIC_DRAW);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.frontTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, flat);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.viewport(0, 0, SIZE, SIZE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    const sides = {
      soft: [0.89, 0.79, 0.67], jelly: [0.62, 0.86, 0.80],
      holo: [0.86, 0.78, 0.75], marshmallow: [0.89, 0.84, 0.78],
      pearl: [0.87, 0.82, 0.81], chrome: [0.58, 0.59, 0.57],
    } as const;
    const material = getMaterial(toy.materialId);
    const palette = getPalette('milk');
    const side = sides[toy.materialId];
    gl.uniform3f(gl.getUniformLocation(this.program, 'uSideColor'), side[0], side[1], side[2]);
    gl.uniform3f(gl.getUniformLocation(this.program, 'uSheenColor'), ...palette.sheen);
    gl.uniform3f(gl.getUniformLocation(this.program, 'uRimColor'), ...palette.rim);
    gl.uniform1f(gl.getUniformLocation(this.program, 'uMaterialSeed'), palette.seed);
    gl.uniform1f(gl.getUniformLocation(this.program, 'uTranslucency'), material.translucency);
    gl.uniform1f(gl.getUniformLocation(this.program, 'uIridescence'), material.iridescence);
    gl.uniform1f(gl.getUniformLocation(this.program, 'uRoughness'), material.roughness);
    gl.uniform1f(gl.getUniformLocation(this.program, 'uMetallic'), material.metallic);
    gl.uniform1f(gl.getUniformLocation(this.program, 'uPearlescence'), material.pearlescence);
    gl.uniform1f(gl.getUniformLocation(this.program, 'uCloudiness'), material.cloudiness);
    gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);

    const output = document.createElement('canvas');
    output.width = SIZE;
    output.height = SIZE;
    const context = output.getContext('2d');
    if (!context) throw new Error('3D review output canvas unavailable');
    context.drawImage(this.canvas, 0, 0);
    if (toy.decor.accessory) drawSeatedAccessories(context, getShape(toy.shapeId), toy.decor.accessory,
      (u, v) => [(128 + (u * 2 - 1) * 98) * 2, (128 - (v * 2 - 1) * 98) * 2], 224, 150);
    output.dataset.volumeRenderer = 'inflated-mesh-512';
    return output;
  }

  dispose(): void {
    const gl = this.gl;
    if (gl.isContextLost()) return;
    gl.deleteVertexArray(this.vao);
    gl.deleteBuffer(this.vertexBuffer);
    gl.deleteBuffer(this.indexBuffer);
    gl.deleteTexture(this.frontTexture);
    gl.deleteProgram(this.program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

let shared: VolumeMeshRenderer | null = null;
let unavailable = false;

const flatVolumeFallback = (flat: HTMLCanvasElement): HTMLCanvasElement => {
  const output = document.createElement('canvas');
  output.width = SIZE;
  output.height = SIZE;
  output.getContext('2d')?.drawImage(flat, 0, 0);
  output.dataset.volumeRenderer = 'mesh-unavailable';
  return output;
};

export const renderVolumeMesh = (toy: SavedSquishy, flat: HTMLCanvasElement): HTMLCanvasElement => {
  if (unavailable) return flatVolumeFallback(flat);
  try {
    shared ??= new VolumeMeshRenderer();
    return shared.render(toy, flat);
  } catch (error) {
    console.warn('Isolated 3D volume review unavailable; displaying the flat control.', error);
    shared?.dispose();
    shared = null;
    unavailable = true;
    return flatVolumeFallback(flat);
  }
};
export const releaseVolumeMesh = (): void => {
  shared?.dispose();
  shared = null;
  unavailable = false;
};
