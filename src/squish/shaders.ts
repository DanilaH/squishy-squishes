export const vertexShaderSource = `#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;
layout(location = 1) in vec2 aUv;

uniform vec2 uScale;
uniform float uMoldProgress;

out vec2 vUv;

void main() {
  vUv = aUv;
  float mold = smoothstep(0.0, 1.0, clamp(uMoldProgress, 0.0, 1.0));
  vec2 stagePosition = aPosition;
  stagePosition.x *= 1.0 + mold * 0.075;
  stagePosition.y *= 1.0 - mold * 0.095;
  stagePosition.y -= mold * 0.018;
  gl_Position = vec4(stagePosition * uScale, 0.0, 1.0);
}
`;

export const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 vUv;

uniform sampler2D uShapeField;
uniform sampler2D uAppearanceTexture;
uniform bool uAppearanceEnabled;
uniform vec2 uPointerUv;
uniform vec2 uStrainDirection;
uniform vec3 uColorLow;
uniform vec3 uColorHigh;
uniform vec3 uSheenColor;
uniform vec3 uRimColor;
uniform float uCompression;
uniform float uPressDepth;
uniform float uFillingAmount;
uniform float uFillingStyle;
uniform float uFillProgress;
uniform float uMoldProgress;
uniform float uMaterialSeed;
uniform float uTranslucency;
uniform float uIridescence;
uniform bool uWireframePass;

out vec4 outColor;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec3 spectralColor(float phase) {
  return 0.52 + 0.48 * cos(6.2831853 * (phase + vec3(0.00, 0.33, 0.67)));
}

vec2 fillingCell(vec2 uv, float seed, float style) {
  float pearl = step(1.5, style);
  float density = mix(10.4, 7.7, pearl);
  vec2 scaled = uv * density + vec2(seed * 3.1, seed * 5.7);
  return floor(scaled);
}

float beadField(vec2 uv, float seed, float amount, float style) {
  float pearl = step(1.5, style);
  float density = mix(10.4, 7.7, pearl);
  vec2 scaled = uv * density + vec2(seed * 3.1, seed * 5.7);
  vec2 cell = floor(scaled);
  vec2 local = fract(scaled) - 0.5;
  float occupiedThreshold = mix(0.34, 0.50, pearl);
  float occupied = step(occupiedThreshold, hash21(cell + seed * 17.0));
  vec2 jitter = vec2(
    hash21(cell + vec2(11.3, 7.1) + seed),
    hash21(cell + vec2(3.7, 19.9) + seed)
  ) - 0.5;
  jitter *= mix(0.34, 0.24, pearl);
  float distanceToCenter = length(local - jitter);
  float innerRadius = mix(0.095, 0.125, pearl);
  float outerRadius = mix(0.165, 0.215, pearl);
  float bead = 1.0 - smoothstep(innerRadius, outerRadius, distanceToCenter);

  float revealOrder = hash21(cell + vec2(29.1, 13.7) + seed * 43.0);
  float reveal = smoothstep(revealOrder, min(1.0, revealOrder + 0.075), clamp(amount, 0.0, 1.0));
  reveal *= smoothstep(0.0, 0.035, amount);
  return bead * occupied * reveal;
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float shapeField = texture(uShapeField, vUv).r;
  float shapeAlpha = 1.0 - smoothstep(0.49, 0.515, shapeField);
  if (shapeAlpha <= 0.001) discard;
  float shape = smoothstep(0.0, 0.5, shapeField);

  float fillProgress = clamp(uFillProgress, 0.0, 1.0);
  float meniscus = sin(vUv.x * 17.0 + uMaterialSeed * 9.0) * 0.010;
  meniscus += sin(vUv.x * 31.0 + uMaterialSeed * 21.0) * 0.004;
  float fillLine = mix(-0.08, 1.08, fillProgress) + meniscus;
  if (vUv.y > fillLine) discard;

  if (uWireframePass) {
    outColor = vec4(1.0, 1.0, 1.0, 0.22 * shapeAlpha);
    return;
  }

  float vertical = smoothstep(0.0, 1.0, vUv.y);
  vec3 base = mix(uColorLow, uColorHigh, vertical);
  if (uAppearanceEnabled) {
    vec4 appearance = texture(uAppearanceTexture, vUv);
    base = mix(base, appearance.rgb, clamp(appearance.a, 0.0, 1.0));
  }

  float edge = smoothstep(0.5, 1.0, shape);
  base *= 1.0 - edge * 0.26;

  float translucency = clamp(uTranslucency, 0.0, 1.0);
  float innerLight = (1.0 - edge) * (0.07 + translucency * 0.17);
  base = mix(base, base * 0.78 + uSheenColor * 0.22, translucency * 0.46);
  base += uSheenColor * innerLight * translucency;
  base += uRimColor * edge * translucency * 0.10;

  float iridescence = clamp(uIridescence, 0.0, 1.0);
  float spectralPhase = vUv.x * 0.72 + vUv.y * 0.48 + uMaterialSeed * 0.61 + uCompression * 0.18;
  vec3 spectral = spectralColor(spectralPhase);
  float spectralBand = 0.5 + 0.5 * sin((vUv.x * 1.35 - vUv.y * 0.82 + uMaterialSeed) * 6.2831853);
  float spectralWeight = iridescence * (0.12 + spectralBand * 0.24 + edge * 0.12);
  base = mix(base, spectral, spectralWeight);

  float fillAmount = clamp(uFillingAmount, 0.0, 1.0);
  float bead = beadField(vUv, uMaterialSeed, fillAmount, uFillingStyle);
  vec2 fillCell = fillingCell(vUv, uMaterialSeed, uFillingStyle);
  float beadShade = 0.78 + hash21(fillCell + uMaterialSeed * 31.0) * 0.22;
  float pearl = step(1.5, uFillingStyle);
  vec3 foamColor = mix(vec3(0.89, 0.92, 0.96), uSheenColor, 0.28) * beadShade;
  vec3 pearlTint = mix(vec3(0.94, 0.96, 1.0), spectralColor(hash21(fillCell) + uMaterialSeed), 0.28);
  vec3 beadColor = mix(foamColor, pearlTint * (0.90 + beadShade * 0.16), pearl);
  base = mix(base, beadColor, bead * mix(0.72, 0.84, pearl));
  base += uSheenColor * bead * pearl * 0.08;
  base -= vec3(0.045) * bead * edge * (1.0 - pearl * 0.45);

  vec2 sheenDelta = vUv - uPointerUv;
  float directionAmount = clamp(length(uStrainDirection), 0.0, 1.0);
  vec2 strainDirection = directionAmount > 0.001 ? normalize(uStrainDirection) : vec2(1.0, 0.0);
  vec2 strainNormal = vec2(-strainDirection.y, strainDirection.x);
  float along = dot(sheenDelta, strainDirection);
  float across = dot(sheenDelta, strainNormal);
  float isotropicMetric = dot(sheenDelta, sheenDelta) * 18.0;
  float strainedMetric = along * along * 11.0 + across * across * 24.0;
  float sheenMetric = mix(isotropicMetric, strainedMetric, directionAmount * 0.78);
  float sheen = exp(-sheenMetric);
  sheen *= 0.09 + uCompression * 0.17 + uPressDepth * 0.035;
  base += uSheenColor * sheen;

  float pressDistance = distance(vUv, uPointerUv);
  float dent = exp(-pressDistance * pressDistance * 52.0) * uPressDepth;
  base *= 1.0 - dent * 0.065;
  float pressRing = exp(-pow(pressDistance - 0.115, 2.0) * 180.0) * uPressDepth;
  base += uRimColor * pressRing * 0.045;

  float centerGlow = exp(-dot(p, p) * 1.7) * 0.07;
  base += uRimColor * centerGlow;

  float rim = smoothstep(0.68, 1.0, shape) * (1.0 - smoothstep(0.92, 1.0, shape));
  base += uRimColor * rim * (0.10 + uCompression * 0.10 + uMoldProgress * 0.06 + translucency * 0.07);

  float meniscusBand = 1.0 - smoothstep(0.0, 0.025, abs(vUv.y - fillLine));
  meniscusBand *= 1.0 - step(0.995, fillProgress);
  base += uSheenColor * meniscusBand * 0.12;

  float bodyAlpha = mix(0.985, 0.82 + edge * 0.10, translucency);
  outColor = vec4(base, bodyAlpha * shapeAlpha);
}
`;
