import type { StorageAdapter } from '@danilah/mini-games-kit/platform';
import { SquishyAudio } from '../game/SquishyAudio';
import { getShape } from '../game/shapes';
import { SquishSurface, type SquishMetrics } from '../squish/SquishSurface';
import '../sandbox-appearance-probe.css';
import {
  APPEARANCE_PROBE_STORAGE_KEY,
  APPEARANCE_TEXTURE_SIZE,
  createAppearanceStroke,
  createEmptyAppearanceDocument,
  decodeAppearancePoints,
  estimateAppearanceBytes,
  parseAppearanceDocument,
  stringifyAppearanceDocument,
  type AppearanceDocumentV1,
  type AppearancePoint,
  type AppearanceStrokeMode,
  type AppearanceStrokeV1,
} from './appearanceCodec';

const COLOR_A = 0xd58cff;
const COLOR_B = 0x63e6e2;
const SAVE_BUDGET_BYTES = 6_000;

type ProbeTool = 'color-a' | 'color-b' | 'erase';
type ProbeMode = 'paint' | 'squeeze';

const colorToCss = (color: number, alpha: number): string => {
  const red = (color >> 16) & 0xff;
  const green = (color >> 8) & 0xff;
  const blue = color & 0xff;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const pointToCanvas = (point: AppearancePoint): readonly [number, number] => [
  point.u * APPEARANCE_TEXTURE_SIZE,
  (1 - point.v) * APPEARANCE_TEXTURE_SIZE,
];

const drawStamp = (
  context: CanvasRenderingContext2D,
  mode: AppearanceStrokeMode,
  color: number,
  sizePx: number,
  point: AppearancePoint,
): void => {
  const [x, y] = pointToCanvas(point);
  const radius = Math.max(1, sizePx * 0.5);
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  context.save();
  context.globalCompositeOperation = mode === 1 ? 'destination-out' : 'source-over';
  if (mode === 1) {
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.82)');
    gradient.addColorStop(0.58, 'rgba(0, 0, 0, 0.58)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else {
    gradient.addColorStop(0, colorToCss(color, 0.62));
    gradient.addColorStop(0.56, colorToCss(color, 0.42));
    gradient.addColorStop(1, colorToCss(color, 0));
  }
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  context.restore();
};

const drawSegment = (
  context: CanvasRenderingContext2D,
  mode: AppearanceStrokeMode,
  color: number,
  sizePx: number,
  from: AppearancePoint,
  to: AppearancePoint,
): void => {
  const [fromX, fromY] = pointToCanvas(from);
  const [toX, toY] = pointToCanvas(to);
  const distance = Math.hypot(toX - fromX, toY - fromY);
  const spacing = Math.max(1.5, sizePx * 0.16);
  const steps = Math.max(1, Math.ceil(distance / spacing));
  for (let index = 1; index <= steps; index += 1) {
    const t = index / steps;
    drawStamp(context, mode, color, sizePx, {
      u: from.u + (to.u - from.u) * t,
      v: from.v + (to.v - from.v) * t,
    });
  }
};

const replayStroke = (context: CanvasRenderingContext2D, stroke: AppearanceStrokeV1): void => {
  const points = decodeAppearancePoints(stroke.p);
  const first = points[0];
  if (!first) return;
  drawStamp(context, stroke.m, stroke.c, stroke.s, first);
  for (let index = 1; index < points.length; index += 1) {
    drawSegment(context, stroke.m, stroke.c, stroke.s, points[index - 1]!, points[index]!);
  }
};

const replayDocument = (context: CanvasRenderingContext2D, document: AppearanceDocumentV1): void => {
  context.clearRect(0, 0, APPEARANCE_TEXTURE_SIZE, APPEARANCE_TEXTURE_SIZE);
  for (const stroke of document.strokes) replayStroke(context, stroke);
};

const readStoredDocument = async (storage: StorageAdapter): Promise<AppearanceDocumentV1> => {
  const raw = await storage.getItem(APPEARANCE_PROBE_STORAGE_KEY);
  if (raw === null) return createEmptyAppearanceDocument();
  try {
    return parseAppearanceDocument(raw);
  } catch (error: unknown) {
    console.error('[squishy:appearance-probe-load]', error);
    return createEmptyAppearanceDocument();
  }
};

export const installAppearanceProbe = async (
  root: HTMLDivElement,
  storage: StorageAdapter,
): Promise<() => void> => {
  root.innerHTML = `
    <main class="appearance-probe" data-appearance-probe data-probe-mode="paint">
      <header class="appearance-probe__header">
        <div>
          <span class="appearance-probe__eyebrow">SANDBOX S0</span>
          <strong>Appearance probe</strong>
        </div>
        <a class="appearance-probe__back" href="./">Exit</a>
      </header>
      <section class="appearance-probe__stage">
        <canvas class="appearance-probe__canvas" data-probe-canvas aria-label="Custom squishy appearance probe"></canvas>
      </section>
      <section class="appearance-probe__controls" aria-label="Appearance probe controls">
        <div class="appearance-probe__row">
          <button type="button" data-probe-tool="color-a" aria-pressed="true" class="appearance-probe__swatch appearance-probe__swatch--a">Purple</button>
          <button type="button" data-probe-tool="color-b" aria-pressed="false" class="appearance-probe__swatch appearance-probe__swatch--b">Aqua</button>
          <button type="button" data-probe-tool="erase" aria-pressed="false">Eraser</button>
        </div>
        <div class="appearance-probe__row">
          <button type="button" data-probe-size="18">Small</button>
          <button type="button" data-probe-size="34" aria-pressed="true">Medium</button>
          <button type="button" data-probe-size="56">Large</button>
          <button type="button" data-probe-action="undo">Undo</button>
        </div>
        <div class="appearance-probe__row appearance-probe__row--primary">
          <button type="button" data-probe-mode="paint" aria-pressed="true">Paint</button>
          <button type="button" data-probe-mode="squeeze" aria-pressed="false">Squeeze</button>
          <button type="button" data-probe-action="save" class="appearance-probe__save">Save</button>
          <button type="button" data-probe-action="reload">Reload</button>
          <button type="button" data-probe-action="reset">Reset</button>
        </div>
        <div class="appearance-probe__stats" data-probe-stats>Loading…</div>
        <div class="appearance-probe__status" data-probe-status>Draw anything. There is no coverage requirement.</div>
      </section>
    </main>
  `;

  const shell = root.querySelector<HTMLElement>('[data-appearance-probe]');
  const canvas = root.querySelector<HTMLCanvasElement>('[data-probe-canvas]');
  const stats = root.querySelector<HTMLElement>('[data-probe-stats]');
  const status = root.querySelector<HTMLElement>('[data-probe-status]');
  if (!shell || !canvas || !stats || !status) throw new Error('Appearance probe markup failed to mount.');

  const paintCanvas = document.createElement('canvas');
  paintCanvas.width = APPEARANCE_TEXTURE_SIZE;
  paintCanvas.height = APPEARANCE_TEXTURE_SIZE;
  const paintContext = paintCanvas.getContext('2d');
  if (!paintContext) throw new Error('Appearance probe requires Canvas 2D.');

  const audio = new SquishyAudio();
  audio.setMuted(true);
  let latestMetrics: SquishMetrics = {
    fps: 0,
    p95FrameMs: 0,
    compression: 0,
    pressDepth: 0,
    normalizedVelocity: 0,
    maxDisplacement: 0,
    gestureX: 0,
    gestureY: 0,
    active: false,
    squeezes: 0,
  };
  const surface = new SquishSurface(canvas, (metrics) => { latestMetrics = metrics; }, audio);
  surface.setShape(getShape('soft-square'));
  surface.setFillProgress(1);
  surface.setMoldProgress(1);
  surface.setInteractive(false);

  let documentState = await readStoredDocument(storage);
  replayDocument(paintContext, documentState);
  if (documentState.strokes.length > 0) surface.setAppearanceTexture(paintCanvas);

  let tool: ProbeTool = 'color-a';
  let brushSize = 34;
  let mode: ProbeMode = 'paint';
  let activePointerId: number | null = null;
  let activePoints: AppearancePoint[] = [];
  let activeMode: AppearanceStrokeMode = 0;
  let activeColor = COLOR_A;
  let uploadFrame = 0;
  let disposed = false;

  const currentDocument = (): AppearanceDocumentV1 => ({ v: 1, strokes: documentState.strokes });

  const updateStats = (): void => {
    if (disposed) return;
    const bytes = estimateAppearanceBytes(currentDocument());
    shell.dataset.probeBytes = String(bytes);
    shell.dataset.probeStrokes = String(documentState.strokes.length);
    shell.dataset.probeBudget = bytes <= SAVE_BUDGET_BYTES ? 'pass' : 'fail';
    stats.textContent = `${documentState.strokes.length} strokes · ${bytes} B / ${SAVE_BUDGET_BYTES} B · ${Math.round(latestMetrics.fps)} FPS · p95 ${latestMetrics.p95FrameMs.toFixed(1)} ms`;
    stats.classList.toggle('is-over-budget', bytes > SAVE_BUDGET_BYTES);
  };

  const scheduleTextureUpload = (): void => {
    if (uploadFrame !== 0) return;
    uploadFrame = requestAnimationFrame(() => {
      uploadFrame = 0;
      surface.setAppearanceTexture(paintCanvas);
    });
  };

  const replayAndUpload = (): void => {
    replayDocument(paintContext, currentDocument());
    if (documentState.strokes.length === 0) surface.setAppearanceTexture(null);
    else scheduleTextureUpload();
    updateStats();
  };

  const setTool = (next: ProbeTool): void => {
    tool = next;
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-probe-tool]')) {
      button.setAttribute('aria-pressed', String(button.dataset.probeTool === tool));
    }
    status.textContent = tool === 'erase' ? 'Soft eraser selected.' : 'Paint colors blend where strokes overlap.';
  };

  const setBrushSize = (next: number): void => {
    brushSize = next;
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-probe-size]')) {
      button.setAttribute('aria-pressed', String(Number(button.dataset.probeSize) === brushSize));
    }
  };

  const setMode = (next: ProbeMode): void => {
    mode = next;
    shell.dataset.probeMode = mode;
    surface.setInteractive(mode === 'squeeze');
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-probe-mode]')) {
      button.setAttribute('aria-pressed', String(button.dataset.probeMode === mode));
    }
    status.textContent = mode === 'paint'
      ? 'Paint mode. Continue whenever you want; there is no completion threshold.'
      : 'Squeeze mode. The painted UV texture should deform with the mesh.';
  };

  const finishStroke = (): void => {
    if (activePointerId === null) return;
    if (activePoints.length > 0) {
      const nextStroke = createAppearanceStroke(activeMode, activeColor, brushSize, activePoints);
      documentState = { v: 1, strokes: [...documentState.strokes, nextStroke] };
    }
    activePointerId = null;
    activePoints = [];
    updateStats();
  };

  const handlePointerDown = (event: PointerEvent): void => {
    if (mode !== 'paint' || activePointerId !== null) return;
    const point = surface.clientPointToUv(event.clientX, event.clientY);
    if (!point) return;
    activePointerId = event.pointerId;
    activePoints = [point];
    activeMode = tool === 'erase' ? 1 : 0;
    activeColor = tool === 'color-b' ? COLOR_B : COLOR_A;
    drawStamp(paintContext, activeMode, activeColor, brushSize, point);
    scheduleTextureUpload();
    try { canvas.setPointerCapture(event.pointerId); } catch { /* capture may be unavailable */ }
    event.preventDefault();
  };

  const handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== activePointerId || mode !== 'paint') return;
    const point = surface.clientPointToUv(event.clientX, event.clientY);
    if (!point) return;
    const previous = activePoints[activePoints.length - 1];
    if (!previous) return;
    if (Math.hypot(point.u - previous.u, point.v - previous.v) < 0.004) return;
    drawSegment(paintContext, activeMode, activeColor, brushSize, previous, point);
    activePoints.push(point);
    scheduleTextureUpload();
    event.preventDefault();
  };

  const handlePointerEnd = (event: PointerEvent): void => {
    if (event.pointerId !== activePointerId) return;
    try { canvas.releasePointerCapture(event.pointerId); } catch { /* already released */ }
    finishStroke();
    event.preventDefault();
  };

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerEnd);
  canvas.addEventListener('pointercancel', handlePointerEnd);

  const handleClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button') : null;
    if (!target) return;

    const requestedTool = target.dataset.probeTool as ProbeTool | undefined;
    if (requestedTool) {
      setTool(requestedTool);
      return;
    }

    const requestedSize = target.dataset.probeSize;
    if (requestedSize) {
      setBrushSize(Number(requestedSize));
      return;
    }

    const requestedMode = target.dataset.probeMode as ProbeMode | undefined;
    if (requestedMode) {
      setMode(requestedMode);
      return;
    }

    const action = target.dataset.probeAction;
    if (action === 'undo') {
      documentState = { v: 1, strokes: documentState.strokes.slice(0, -1) };
      replayAndUpload();
      status.textContent = 'Last stroke removed.';
      return;
    }
    if (action === 'save') {
      const raw = stringifyAppearanceDocument(currentDocument());
      void storage.setItem(APPEARANCE_PROBE_STORAGE_KEY, raw)
        .then(() => {
          const bytes = new TextEncoder().encode(raw).byteLength;
          status.textContent = bytes <= SAVE_BUDGET_BYTES
            ? `Saved ${bytes} B. Reload should reconstruct the same appearance.`
            : `Saved ${bytes} B, but this exceeds the ${SAVE_BUDGET_BYTES} B target.`;
          shell.dataset.probeSaved = 'true';
          updateStats();
        })
        .catch((error: unknown) => {
          shell.dataset.probeSaved = 'false';
          status.textContent = 'Save failed. See console.';
          console.error('[squishy:appearance-probe-save]', error);
        });
      return;
    }
    if (action === 'reload') {
      window.location.reload();
      return;
    }
    if (action === 'reset') {
      documentState = createEmptyAppearanceDocument();
      replayAndUpload();
      void storage.removeItem(APPEARANCE_PROBE_STORAGE_KEY).catch((error: unknown) => {
        console.error('[squishy:appearance-probe-reset]', error);
      });
      shell.dataset.probeSaved = 'false';
      status.textContent = 'Probe appearance cleared.';
    }
  };

  root.addEventListener('click', handleClick);
  updateStats();
  const statsTimer = window.setInterval(updateStats, 500);

  return () => {
    if (disposed) return;
    disposed = true;
    window.clearInterval(statsTimer);
    if (uploadFrame !== 0) cancelAnimationFrame(uploadFrame);
    root.removeEventListener('click', handleClick);
    canvas.removeEventListener('pointerdown', handlePointerDown);
    canvas.removeEventListener('pointermove', handlePointerMove);
    canvas.removeEventListener('pointerup', handlePointerEnd);
    canvas.removeEventListener('pointercancel', handlePointerEnd);
    surface.dispose();
    audio.dispose();
    root.replaceChildren();
  };
};
