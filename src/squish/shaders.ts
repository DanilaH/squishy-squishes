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

uniform vec2 uPointerUv;
uniform vec2 uStrainDirection;
uniform vec3 uColorLow;
uniform vec3 uColorHigh;
uniform vec3 uSheenColor;
uniform vec3 uRimColor;
uniform float uCompression;
uniform float uPressDepth;
uniform float uFillingAmount;
uniform float uFillProgress;
uniform float uMoldProgress;
uniform float uMaterialSeed;
uniform bool uWireframePass;

out vec4 outColor;

float superellipse(vec2 p) {
  vec2 q = abs(p);
  return pow(q.x, 4.0) + pow(q.y, 4.0);
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float beadField(vec2 uv, float seed, float amount) {
  vec2 scaled = uv * 10.4 + vec2(seed * 3.1, seed * 5.7);
  vec2 cell = floor(scaled);
  vec2 local = fract(scaled) - 0.5;
  float occupied = step(0.34, hash21(cell + seed * 17.0));
  vec2 jitter = vec2(
    hash21(cell + vec2(11.3, 7.1) + seed),
    hash21(cell + vec2(3.7, 19.9) + seed)
  ) - 0.5;
  jitter *= 0.34;
  float distanceToCenter = length(local - jitter);
  float bead = 1.0 - smoothstep(0.095, 0.165, distanceToCenter);

  // Each occupied cell gets a stable random reveal order. Increasing the amount
  // therefore scatters new beads across the whole squishy instead of fading one
  // pre-existing bead layer in as a single stream.
  float revealOrder = hash21(cell + vec2(29.1, 13.7) + seed * 43.0);
  float reveal = smoothstep(revealOrder, min(1.0, revealOrder + 0.075), clamp(amount, 0.0, 1.0));
  reveal *= smoothstep(0.0, 0.035, amount);
  return bead * occupied * reveal;
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float shape = superellipse(p);
  if (shape > 1.0) discard;

  float fillProgress = clamp(uFillProgress, 0.0, 1.0);
  float meniscus = sin(vUv.x * 17.0 + uMaterialSeed * 9.0) * 0.010;
  meniscus += sin(vUv.x * 31.0 + uMaterialSeed * 21.0) * 0.004;
  float fillLine = mix(-0.08, 1.08, fillProgress) + meniscus;
  if (vUv.y > fillLine) discard;

  if (uWireframePass) {
    outColor = vec4(1.0, 1.0, 1.0, 0.22);
    return;
  }

  float vertical = smoothstep(0.0, 1.0, vUv.y);
  vec3 base = mix(uColorLow, uColorHigh, vertical);

  float edge = smoothstep(0.5, 1.0, shape);
  base *= 1.0 - edge * 0.26;

  float fillAmount = clamp(uFillingAmount, 0.0, 1.0);
  float bead = beadField(vUv, uMaterialSeed, fillAmount);
  float beadShade = 0.78 + hash21(floor(vUv * 10.4) + uMaterialSeed * 31.0) * 0.22;
  vec3 beadColor = mix(vec3(0.89, 0.92, 0.96), uSheenColor, 0.28) * beadShade;
  base = mix(base, beadColor, bead * 0.72);
  base -= vec3(0.045) * bead * edge;

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
  base += uRimColor * rim * (0.10 + uCompression * 0.10 + uMoldProgress * 0.06);

  float meniscusBand = 1.0 - smoothstep(0.0, 0.025, abs(vUv.y - fillLine));
  meniscusBand *= 1.0 - step(0.995, fillProgress);
  base += uSheenColor * meniscusBand * 0.12;

  outColor = vec4(base, 0.985);
}
`;
