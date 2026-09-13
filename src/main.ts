import './styles.css';
import { SquishProbe, type ProbeMetrics } from './probe/SquishProbe';

type CraftStage = 'select' | 'pour' | 'add' | 'mix' | 'mold' | 'reveal' | 'test' | 'collect';
type ColorId = 'grape' | 'strawberry' | 'lime';
type FillingId = 'smooth' | 'beads';

interface VariantChoice {
  color: ColorId;
  filling: FillingId;
}

const DISCOVERED_STORAGE_KEY = 'squishy.vertical-slice.discovered.v1';
const TOTAL_VARIANTS = 6;

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing #app root.');

root.innerHTML = `
  <main class="lab-shell" data-stage="select" data-color="grape" data-filling="smooth">
    <header class="lab-topbar">
      <div class="lab-brand">
        <strong>Squishy Lab</strong>
        <span>Vertical Slice 01</span>
      </div>
      <div class="made-count" aria-live="polite">Made 0 / ${TOTAL_VARIANTS}</div>
    </header>

    <section class="lab-workspace" aria-label="Squishy workbench">
      <div class="workspace-glow" aria-hidden="true"></div>
      <div class="mold-frame" aria-hidden="true">
        <div class="mold-lid"></div>
      </div>

      <div class="object-stack">
        <div class="contact-shadow" aria-hidden="true"></div>
        <canvas class="probe-canvas" aria-label="Interactive squishy"></canvas>
        <div class="bead-layer" aria-hidden="true"></div>
      </div>

      <div class="pour-stream" aria-hidden="true"></div>
      <div class="reveal-flash" aria-hidden="true"></div>

      <button class="hold-surface" type="button" aria-label="Hold to continue" hidden></button>

      <div class="stage-copy">
        <strong class="stage-title">Choose a recipe</strong>
        <span class="stage-hint">Pick a color and texture, then make it.</span>
      </div>

      <div class="stage-progress" aria-hidden="true">
        <div class="stage-progress__fill"></div>
      </div>
    </section>

    <section class="recipe-panel" aria-label="Recipe options">
      <div class="option-group">
        <span class="option-label">Color</span>
        <div class="swatches" role="group" aria-label="Squishy color">
          <button class="swatch swatch--grape" type="button" data-color-choice="grape" aria-pressed="true" aria-label="Lavender grape"></button>
          <button class="swatch swatch--strawberry" type="button" data-color-choice="strawberry" aria-pressed="false" aria-label="Strawberry pink"></button>
          <button class="swatch swatch--lime" type="button" data-color-choice="lime" aria-pressed="false" aria-label="Lime mint"></button>
        </div>
      </div>

      <div class="option-group">
        <span class="option-label">Texture</span>
        <div class="texture-options" role="group" aria-label="Squishy filling">
          <button class="texture-button" type="button" data-filling-choice="smooth" aria-pressed="true">Smooth</button>
          <button class="texture-button" type="button" data-filling-choice="beads" aria-pressed="false">Foam beads</button>
        </div>
      </div>

      <button class="primary-button start-button" type="button">Make squishy</button>
    </section>

    <button class="primary-button collect-button" type="button" hidden>Collect</button>

    <div class="probe-controls" aria-label="Debug controls">
      <button class="probe-button" type="button" data-action="metrics" aria-pressed="false">Metrics</button>
      <button class="probe-button" type="button" data-action="wireframe" aria-pressed="false">Mesh</button>
      <button class="probe-button" type="button" data-action="mute" aria-pressed="false">Mute</button>
    </div>
    <pre class="metrics" aria-live="polite" hidden></pre>
  </main>
`;

const requireElement = <T extends Element>(selector: string): T => {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element;
};

const shell = requireElement<HTMLElement>('.lab-shell');
const workspace = requireElement<HTMLElement>('.lab-workspace');
const objectStack = requireElement<HTMLElement>('.object-stack');
const canvas = requireElement<HTMLCanvasElement>('.probe-canvas');
const metricsElement = requireElement<HTMLElement>('.metrics');
const shadow = requireElement<HTMLElement>('.contact-shadow');
const beadLayer = requireElement<HTMLElement>('.bead-layer');
const holdSurface = requireElement<HTMLButtonElement>('.hold-surface');
const stageTitle = requireElement<HTMLElement>('.stage-title');
const stageHint = requireElement<HTMLElement>('.stage-hint');
const progressFill = requireElement<HTMLElement>('.stage-progress__fill');
const recipePanel = requireElement<HTMLElement>('.recipe-panel');
const startButton = requireElement<HTMLButtonElement>('.start-button');
const collectButton = requireElement<HTMLButtonElement>('.collect-button');
const madeCount = requireElement<HTMLElement>('.made-count');
const metricsButton = requireElement<HTMLButtonElement>('[data-action="metrics"]');
const wireframeButton = requireElement<HTMLButtonElement>('[data-action="wireframe"]');
const muteButton = requireElement<HTMLButtonElement>('[data-action="mute"]');
const colorButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-color-choice]'));
const fillingButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-filling-choice]'));

let stage: CraftStage = 'select';
let selected: VariantChoice = { color: 'grape', filling: 'smooth' };
let stageProgress = 0;
let holdPointerId: number | null = null;
let holdStageComplete = false;
let transitionTimer: number | null = null;
let lastCraftFrameAt = performance.now();
let craftFrame = 0;
let lastSemanticAt = performance.now();
let testStartSqueezes = 0;
let latestMetrics: ProbeMetrics | null = null;

const discovered = new Set<string>();

const loadDiscovered = (): void => {
  try {
    const raw = window.localStorage.getItem(DISCOVERED_STORAGE_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    for (const value of parsed) {
      if (typeof value === 'string') discovered.add(value);
    }
  } catch {
    // Slice-only convenience state must never block the loop.
  }
};

const persistDiscovered = (): void => {
  try {
    window.localStorage.setItem(DISCOVERED_STORAGE_KEY, JSON.stringify([...discovered]));
  } catch {
    // Slice-only convenience state must never block the loop.
  }
};

const currentVariantId = (): string => `${selected.color}-${selected.filling}`;

const updateMadeCount = (): void => {
  madeCount.textContent = `Made ${Math.min(TOTAL_VARIANTS, discovered.size)} / ${TOTAL_VARIANTS}`;
};

const setStageProgress = (value: number): void => {
  stageProgress = Math.max(0, Math.min(1, value));
  progressFill.style.transform = `scaleX(${stageProgress.toFixed(4)})`;
  shell.style.setProperty('--stage-progress', stageProgress.toFixed(4));
};

const setBeadProgress = (value: number): void => {
  const clamped = Math.max(0, Math.min(1, value));
  shell.style.setProperty('--bead-progress', clamped.toFixed(4));
};

const setObjectBuildProgress = (value: number): void => {
  const clamped = Math.max(0, Math.min(1, value));
  const eased = 1 - (1 - clamped) ** 3;
  shell.style.setProperty('--object-build', eased.toFixed(4));
};

const clearTransitionTimer = (): void => {
  if (transitionTimer === null) return;
  window.clearTimeout(transitionTimer);
  transitionTimer = null;
};

const updateSelectionUi = (): void => {
  shell.dataset.color = selected.color;
  shell.dataset.filling = selected.filling;

  for (const button of colorButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.colorChoice === selected.color));
  }
  for (const button of fillingButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.fillingChoice === selected.filling));
  }

  if (stage === 'select') {
    setBeadProgress(selected.filling === 'beads' ? 1 : 0);
  }
};

const setHoldSurfaceActive = (active: boolean): void => {
  holdSurface.hidden = !active;
  if (!active) {
    holdPointerId = null;
    holdStageComplete = false;
  }
};

const setStageCopy = (title: string, hint: string): void => {
  stageTitle.textContent = title;
  stageHint.textContent = hint;
};

const finishHoldStage = (): void => {
  if (!holdStageComplete) return;
  holdStageComplete = false;
  if (stage === 'pour') {
    setStage(selected.filling === 'beads' ? 'add' : 'mix');
  } else if (stage === 'add') {
    setStage('mix');
  }
};

const setStage = (next: CraftStage): void => {
  clearTransitionTimer();
  stage = next;
  shell.dataset.stage = next;
  setStageProgress(0);
  setHoldSurfaceActive(false);

  recipePanel.hidden = next !== 'select';
  collectButton.hidden = next !== 'test';

  switch (next) {
    case 'select':
      setStageCopy('Choose a recipe', 'Pick a color and texture, then make it.');
      setObjectBuildProgress(1);
      setBeadProgress(selected.filling === 'beads' ? 1 : 0);
      break;
    case 'pour':
      setStageCopy('Pour the base', 'Hold anywhere on the workbench. Release when it is full.');
      setObjectBuildProgress(0.12);
      setBeadProgress(0);
      setHoldSurfaceActive(true);
      break;
    case 'add':
      setStageCopy('Add foam beads', 'Hold to pour the texture in.');
      setObjectBuildProgress(1);
      setBeadProgress(0);
      setHoldSurfaceActive(true);
      break;
    case 'mix':
      setStageCopy('Mix it', 'Press, drag and knead the soft mass.');
      setObjectBuildProgress(1);
      setBeadProgress(selected.filling === 'beads' ? 1 : 0);
      lastSemanticAt = performance.now();
      break;
    case 'mold':
      setStageCopy('Press into the mold', 'Push and hold until the shape settles.');
      lastSemanticAt = performance.now();
      break;
    case 'reveal':
      setStageCopy('Unmolding…', '');
      setObjectBuildProgress(1);
      transitionTimer = window.setTimeout(() => setStage('test'), 1050);
      break;
    case 'test':
      setStageCopy('Fresh squishy', 'Squeeze it as much as you want, then collect it.');
      testStartSqueezes = latestMetrics?.squeezes ?? 0;
      break;
    case 'collect':
      setStageCopy('Collected', 'Ready for another one.');
      collectButton.hidden = true;
      transitionTimer = window.setTimeout(() => setStage('select'), 560);
      break;
  }
};

const renderMetrics = (metrics: ProbeMetrics): void => {
  latestMetrics = metrics;
  metricsElement.textContent = [
    `stage            ${stage}`,
    `stage progress   ${stageProgress.toFixed(3)}`,
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
  shadow.style.opacity = String(0.68 + metrics.compression * 0.16 + metrics.pressDepth * 0.04);

  const beadShiftX = metrics.gestureX * metrics.compression * 10;
  const beadShiftY = -metrics.gestureY * metrics.compression * 7;
  beadLayer.style.setProperty('--bead-shift-x', `${beadShiftX.toFixed(2)}px`);
  beadLayer.style.setProperty('--bead-shift-y', `${beadShiftY.toFixed(2)}px`);
  beadLayer.style.setProperty('--bead-rotation', `${(angle * 0.22).toFixed(2)}deg`);
  beadLayer.style.setProperty('--bead-scale-x', (1 + metrics.compression * 0.08).toFixed(3));
  beadLayer.style.setProperty('--bead-scale-y', (1 - metrics.compression * 0.04).toFixed(3));

  const now = performance.now();
  const dt = Math.min(0.2, Math.max(0, (now - lastSemanticAt) / 1000));
  lastSemanticAt = now;

  if (stage === 'mix') {
    if (metrics.active && stageProgress < 1) {
      const effort = 0.12
        + metrics.compression * 0.5
        + metrics.normalizedVelocity * 0.55
        + metrics.pressDepth * 0.1;
      setStageProgress(stageProgress + dt * effort * 0.65);
    }
    if (!metrics.active && stageProgress >= 1) setStage('mold');
  } else if (stage === 'mold') {
    if (metrics.active && stageProgress < 1) {
      const pressure = metrics.pressDepth * 0.45 + metrics.compression * 0.2;
      setStageProgress(stageProgress + dt * pressure * 0.55);
    }
    if (!metrics.active && stageProgress >= 1) setStage('reveal');
  } else if (stage === 'test') {
    shell.dataset.tested = String(metrics.squeezes > testStartSqueezes);
  }
};

const probe = new SquishProbe(canvas, renderMetrics);

const updateHeroSize = (): void => {
  const rect = canvas.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height) * 0.68;
  shell.style.setProperty('--hero-size', `${Math.max(120, size).toFixed(1)}px`);
};

const handleHoldPointerDown = (event: PointerEvent): void => {
  if (holdPointerId !== null || (stage !== 'pour' && stage !== 'add')) return;
  event.preventDefault();
  holdPointerId = event.pointerId;
  holdStageComplete = false;
  try {
    holdSurface.setPointerCapture(event.pointerId);
  } catch {
    // Best effort only.
  }
};

const handleHoldPointerEnd = (event: PointerEvent): void => {
  if (event.pointerId !== holdPointerId) return;
  event.preventDefault();
  try {
    holdSurface.releasePointerCapture(event.pointerId);
  } catch {
    // Capture may already be released.
  }
  holdPointerId = null;
  finishHoldStage();
};

holdSurface.addEventListener('pointerdown', handleHoldPointerDown);
holdSurface.addEventListener('pointerup', handleHoldPointerEnd);
holdSurface.addEventListener('pointercancel', handleHoldPointerEnd);

startButton.addEventListener('click', () => setStage('pour'));

collectButton.addEventListener('click', () => {
  if (stage !== 'test') return;
  discovered.add(currentVariantId());
  persistDiscovered();
  updateMadeCount();
  setStage('collect');
});

for (const button of colorButtons) {
  button.addEventListener('click', () => {
    if (stage !== 'select') return;
    const value = button.dataset.colorChoice;
    if (value !== 'grape' && value !== 'strawberry' && value !== 'lime') return;
    selected = { ...selected, color: value };
    updateSelectionUi();
  });
}

for (const button of fillingButtons) {
  button.addEventListener('click', () => {
    if (stage !== 'select') return;
    const value = button.dataset.fillingChoice;
    if (value !== 'smooth' && value !== 'beads') return;
    selected = { ...selected, filling: value };
    updateSelectionUi();
  });
}

let metricsVisible = false;
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

const tickCraft = (now: number): void => {
  const dt = Math.min(0.05, Math.max(0, (now - lastCraftFrameAt) / 1000));
  lastCraftFrameAt = now;

  if (holdPointerId !== null && !holdStageComplete) {
    if (stage === 'pour') {
      setStageProgress(stageProgress + dt / 1.55);
      setObjectBuildProgress(0.12 + stageProgress * 0.88);
    } else if (stage === 'add') {
      setStageProgress(stageProgress + dt / 1.1);
      setBeadProgress(stageProgress);
    }

    if (stageProgress >= 1) {
      holdStageComplete = true;
      stageHint.textContent = 'Release.';
    }
  }

  craftFrame = requestAnimationFrame(tickCraft);
};

const handleVisibilityChange = (): void => {
  if (!document.hidden || holdPointerId === null) return;
  holdPointerId = null;
  holdStageComplete = false;
};

document.addEventListener('visibilitychange', handleVisibilityChange);
window.addEventListener('resize', updateHeroSize);

loadDiscovered();
updateMadeCount();
updateSelectionUi();
updateHeroSize();
setStage('select');
craftFrame = requestAnimationFrame(tickCraft);

window.addEventListener('pagehide', () => {
  clearTransitionTimer();
  cancelAnimationFrame(craftFrame);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('resize', updateHeroSize);
  probe.dispose();
}, { once: true });
