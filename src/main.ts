import './styles.css';
import { SquishProbe, type ProbeMetrics } from './probe/SquishProbe';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app root.');

root.innerHTML = `
  <main class="probe-shell">
    <div class="contact-shadow" aria-hidden="true"></div>
    <canvas class="probe-canvas" aria-label="Interactive squishy feel probe"></canvas>
    <h1 class="probe-title">Squish Feel Probe</h1>
    <div class="probe-controls" aria-label="Probe controls">
      <button class="probe-button" type="button" data-action="metrics" aria-pressed="true">Metrics</button>
      <button class="probe-button" type="button" data-action="wireframe" aria-pressed="false">Mesh</button>
      <button class="probe-button" type="button" data-action="mute" aria-pressed="false">Mute</button>
    </div>
    <pre class="metrics" aria-live="polite"></pre>
    <p class="probe-hint">Press, knead, drag, release. Try slow and sharp gestures 20+ times.</p>
  </main>
`;

const canvas = root.querySelector<HTMLCanvasElement>('.probe-canvas');
const metricsElement = root.querySelector<HTMLElement>('.metrics');
const shadow = root.querySelector<HTMLElement>('.contact-shadow');
const metricsButton = root.querySelector<HTMLButtonElement>('[data-action="metrics"]');
const wireframeButton = root.querySelector<HTMLButtonElement>('[data-action="wireframe"]');
const muteButton = root.querySelector<HTMLButtonElement>('[data-action="mute"]');

if (!canvas || !metricsElement || !shadow || !metricsButton || !wireframeButton || !muteButton) {
  throw new Error('Probe shell failed to initialize.');
}

const renderMetrics = (metrics: ProbeMetrics): void => {
  metricsElement.textContent = [
    `fps              ${metrics.fps.toFixed(1)}`,
    `p95 frame        ${metrics.p95FrameMs.toFixed(2)} ms`,
    `compression      ${metrics.compression.toFixed(3)}`,
    `press depth      ${metrics.pressDepth.toFixed(3)}`,
    `velocity         ${metrics.normalizedVelocity.toFixed(3)}`,
    `max displacement ${metrics.maxDisplacement.toFixed(3)}`,
    `pointer active   ${metrics.active ? 'yes' : 'no'}`,
    `squeezes         ${metrics.squeezes}`,
  ].join('\n');

  const directionMagnitude = Math.hypot(metrics.gestureX, metrics.gestureY);
  const angle = directionMagnitude > 0.05
    ? Math.atan2(-metrics.gestureY, metrics.gestureX) * (180 / Math.PI)
    : 0;
  const shiftX = metrics.gestureX * metrics.compression * 9;
  const shiftY = -metrics.gestureY * metrics.compression * 5;
  const scaleAlong = 1 + metrics.compression * 0.18 + metrics.pressDepth * 0.025;
  const scaleAcross = 1 - metrics.compression * 0.045 - metrics.pressDepth * 0.03;

  shadow.style.transform = [
    'translate(-50%, -50%)',
    `translate(${shiftX.toFixed(2)}px, ${shiftY.toFixed(2)}px)`,
    `rotate(${angle.toFixed(2)}deg)`,
    `scale(${scaleAlong.toFixed(3)}, ${scaleAcross.toFixed(3)})`,
  ].join(' ');
  shadow.style.opacity = String(0.70 + metrics.compression * 0.14 + metrics.pressDepth * 0.035);
};

const probe = new SquishProbe(canvas, renderMetrics);

let metricsVisible = true;
metricsButton.addEventListener('click', () => {
  metricsVisible = !metricsVisible;
  metricsElement.hidden = !metricsVisible;
  metricsButton.setAttribute('aria-pressed', String(metricsVisible));
});

let wireframe = false;
wireframeButton.addEventListener('click', () => {
  wireframe = !wireframe;
  probe.setWireframe(wireframe);
  wireframeButton.setAttribute('aria-pressed', String(wireframe));
});

let muted = false;
muteButton.addEventListener('click', () => {
  muted = !muted;
  probe.setMuted(muted);
  muteButton.setAttribute('aria-pressed', String(muted));
});

window.addEventListener('pagehide', () => probe.dispose(), { once: true });
