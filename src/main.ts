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
    <p class="probe-hint">Press inside the object, drag in different directions, release, repeat 20+ times.</p>
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
    `velocity         ${metrics.normalizedVelocity.toFixed(3)}`,
    `max displacement ${metrics.maxDisplacement.toFixed(3)}`,
    `pointer active   ${metrics.active ? 'yes' : 'no'}`,
    `squeezes         ${metrics.squeezes}`,
  ].join('\n');

  const scaleX = 1 + metrics.compression * 0.20;
  const scaleY = 1 - metrics.compression * 0.08;
  shadow.style.transform = `translate(-50%, -50%) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`;
  shadow.style.opacity = String(0.72 + metrics.compression * 0.12);
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
