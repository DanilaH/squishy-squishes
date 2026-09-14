import type { GameCopy } from '../i18n';
import { SquishSurface, type SquishMetrics } from '../squish/SquishSurface';
import {
  ALL_VARIANT_IDS,
  FILLINGS,
  PALETTES,
  getPalette,
  type FillingId,
  type PaletteId,
  type VariantChoice,
  variantId,
  variantLabel,
} from './content';
import { SquishyAudio } from './SquishyAudio';

type CraftStage = 'select' | 'pour' | 'add' | 'mix' | 'mold' | 'reveal' | 'test' | 'collect';

export interface VerticalSliceAppOptions {
  readonly completedVariantIds: readonly string[];
  readonly muted: boolean;
  readonly copy: GameCopy;
  readonly onVariantCollected: (variantId: string) => void | Promise<void>;
  readonly onMutedChange: (muted: boolean) => void | Promise<void>;
}

const TOTAL_VARIANTS = ALL_VARIANT_IDS.length;
const SHAKE_PATH_FOR_FULL_PROGRESS_PX = 3000;
const SHAKE_IDLE_MS = 120;
const PAINT_CANVAS_SIZE = 256;
const PAINT_GRID_SIZE = 20;
const PAINT_COMPLETE_COVERAGE = 0.92;
const PAINT_BRUSH_RADIUS_UV = 0.115;
const PAINT_IDLE_MS = 110;
const MIX_MOTION_IDLE_MS = 110;
const MOLD_NORMAL_HIT_PROGRESS = 0.028;
const MOLD_CRIT_HIT_PROGRESS = 0.095;
const MOLD_DECAY_PER_SECOND = 0.03;
const MOLD_NEXT_TARGET_DELAY_MS = 130;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export class VerticalSliceApp {
  private readonly abortController = new AbortController();
  private readonly shell: HTMLElement;
  private readonly workspace: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly paintCanvas: HTMLCanvasElement;
  private readonly paintContext: CanvasRenderingContext2D;
  private readonly paintShapePath: Path2D;
  private readonly contactShadow: HTMLElement;
  private readonly holdSurface: HTMLButtonElement;
  private readonly moldTarget: HTMLButtonElement;
  private readonly foamShaker: HTMLElement;
  private readonly stageTitle: HTMLElement;
  private readonly stageHint: HTMLElement;
  private readonly progressFill: HTMLElement;
  private readonly recipePanel: HTMLElement;
  private readonly startButton: HTMLButtonElement;
  private readonly collectButton: HTMLButtonElement;
  private readonly madeCount: HTMLElement;
  private readonly variantPreview: HTMLElement;
  private readonly resultBadge: HTMLElement;
  private readonly metricsElement: HTMLElement;
  private readonly metricsButton: HTMLButtonElement;
  private readonly wireframeButton: HTMLButtonElement;
  private readonly muteButton: HTMLButtonElement;
  private readonly discoveryDots: HTMLElement;
  private readonly colorButtons: readonly HTMLButtonElement[];
  private readonly fillingButtons: readonly HTMLButtonElement[];
  private readonly audio = new SquishyAudio();
  private readonly renderer: SquishSurface;
  private readonly discovered = new Set<string>();
  private readonly paintCoverage = new Uint8Array(PAINT_GRID_SIZE * PAINT_GRID_SIZE);
  private readonly paintEligible = new Uint8Array(PAINT_GRID_SIZE * PAINT_GRID_SIZE);

  private stage: CraftStage = 'select';
  private selected: VariantChoice = { palette: 'grape', filling: 'smooth' };
  private stageProgress = 0;
  private holdPointerId: number | null = null;
  private holdStageComplete = false;
  private transitionTimer: number | null = null;
  private moldTargetTimer: number | null = null;
  private craftFrame = 0;
  private lastCraftFrameAt = performance.now();
  private lastSemanticAt = performance.now();
  private latestMetrics: SquishMetrics | null = null;
  private testStartSqueezes = 0;
  private metricsVisible = false;
  private wireframe = false;
  private muted = false;
  private disposed = false;
  private shakeLastX = 0;
  private shakeLastY = 0;
  private shakeLastAt = 0;
  private shakeLastActiveAt = 0;
  private shakeLastDirection = 0;
  private shakeAudioActive = false;
  private paintEligibleCount = 0;
  private paintCoveredCount = 0;
  private paintLastU = 0.5;
  private paintLastV = 0.5;
  private paintLastAt = 0;
  private paintAudioActive = false;
  private paintComplete = false;
  private mixPointerId: number | null = null;
  private mixLastX = 0;
  private mixLastY = 0;
  private mixLastSampleAt = 0;
  private mixLastMoveAt = 0;
  private mixPointerSpeed = 0;
  private moldComplete = false;
  private moldTargetX = 0;
  private moldTargetY = 0;
  private heroSizePx = 240;
  private activityBlocked = false;
  private moldTargetWasAvailableBeforeBlock = false;

  public constructor(
    private readonly root: HTMLDivElement,
    private readonly options: VerticalSliceAppOptions,
  ) {
    for (const id of options.completedVariantIds) {
      if (ALL_VARIANT_IDS.includes(id)) this.discovered.add(id);
    }
    this.muted = options.muted;
    root.innerHTML = this.renderShell();

    this.shell = this.requireElement<HTMLElement>('.lab-shell');
    this.workspace = this.requireElement<HTMLElement>('.lab-workspace');
    this.canvas = this.requireElement<HTMLCanvasElement>('.squish-canvas');
    this.paintCanvas = this.requireElement<HTMLCanvasElement>('.paint-layer');
    const paintContext = this.paintCanvas.getContext('2d');
    if (!paintContext) throw new Error('2D canvas is required for paint coverage.');
    this.paintContext = paintContext;
    this.paintShapePath = this.createPaintShapePath();
    this.contactShadow = this.requireElement<HTMLElement>('.contact-shadow');
    this.holdSurface = this.requireElement<HTMLButtonElement>('.hold-surface');
    this.moldTarget = this.requireElement<HTMLButtonElement>('.mold-target');
    this.foamShaker = this.requireElement<HTMLElement>('.foam-shaker');
    this.stageTitle = this.requireElement<HTMLElement>('.stage-title');
    this.stageHint = this.requireElement<HTMLElement>('.stage-hint');
    this.progressFill = this.requireElement<HTMLElement>('.stage-progress__fill');
    this.recipePanel = this.requireElement<HTMLElement>('.recipe-panel');
    this.startButton = this.requireElement<HTMLButtonElement>('.start-button');
    this.collectButton = this.requireElement<HTMLButtonElement>('.collect-button');
    this.madeCount = this.requireElement<HTMLElement>('.made-count');
    this.variantPreview = this.requireElement<HTMLElement>('.variant-preview');
    this.resultBadge = this.requireElement<HTMLElement>('.result-badge');
    this.metricsElement = this.requireElement<HTMLElement>('.metrics');
    this.metricsButton = this.requireElement<HTMLButtonElement>('[data-action="metrics"]');
    this.wireframeButton = this.requireElement<HTMLButtonElement>('[data-action="wireframe"]');
    this.muteButton = this.requireElement<HTMLButtonElement>('[data-action="mute"]');
    this.discoveryDots = this.requireElement<HTMLElement>('.discovery-dots');
    this.colorButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-palette-choice]'));
    this.fillingButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-filling-choice]'));

    this.renderer = new SquishSurface(this.canvas, this.handleMetrics, this.audio);
    this.renderer.setMuted(this.muted);
    this.muteButton.setAttribute('aria-pressed', String(this.muted));
    this.muteButton.textContent = this.muted ? this.options.copy.actions.unmute : this.options.copy.actions.mute;

    this.bindEvents();
    this.updateDiscoveredUi();
    this.updateSelectionUi();
    this.updateHeroSize();
    this.setStage('select');
    this.craftFrame = requestAnimationFrame(this.tickCraft);
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.clearTransitionTimer();
    this.clearMoldTargetTimer();
    cancelAnimationFrame(this.craftFrame);
    this.abortController.abort();
    this.audio.stopPour();
    this.renderer.dispose();
    this.audio.dispose();
  }

  private renderShell(): string {
    const copy = this.options.copy;
    const paletteButtons = PALETTES.map((palette, index) => `
      <button
        class="swatch"
        type="button"
        data-palette-choice="${palette.id}"
        aria-pressed="${index === 0 ? 'true' : 'false'}"
        aria-label="${palette.label}"
        style="--swatch-color: ${palette.accentCss}"
      ></button>
    `).join('');

    const fillingButtons = FILLINGS.map((filling, index) => `
      <button
        class="texture-button"
        type="button"
        data-filling-choice="${filling.id}"
        aria-pressed="${index === 0 ? 'true' : 'false'}"
      >
        <span>${filling.label}</span>
        <small>${filling.description}</small>
      </button>
    `).join('');

    const discoveryDots = ALL_VARIANT_IDS.map((id) => `<span class="discovery-dot" data-variant-dot="${id}"></span>`).join('');
    const foamParticles = Array.from({ length: 20 }, (_, index) => {
      const x = (index - 9.5) * 4.6;
      const drift = x + ((index % 5) - 2) * 5.5;
      const delay = index * -31;
      const size = 3 + ((index * 7) % 4);
      const duration = 450 + (index % 5) * 55;
      const blur = (index % 3) * 0.18;
      return `<span class="foam-particle" style="--foam-x: ${x}px; --foam-drift: ${drift}px; --foam-delay: ${delay}ms; --foam-size: ${size}px; --foam-duration: ${duration}ms; --foam-blur: ${blur}px"></span>`;
    }).join('');

    return `
      <main class="lab-shell" data-stage="select" data-palette="grape" data-filling="smooth" data-tested="false" data-shaking="false">
        <header class="lab-topbar">
          <div class="lab-brand">
            <strong>${copy.brand.name}</strong>
            <span>${copy.brand.line}</span>
          </div>
          <div class="collection-summary" aria-live="polite">
            <span class="made-count">${copy.collection.made} ${this.discovered.size} / ${TOTAL_VARIANTS}</span>
            <span class="discovery-dots" aria-hidden="true">${discoveryDots}</span>
          </div>
        </header>

        <section class="lab-workspace" aria-label="${copy.aria.workbench}">
          <div class="workspace-vignette" aria-hidden="true"></div>
          <div class="bench-line" aria-hidden="true"></div>
          <div class="mold-frame" aria-hidden="true">
            <div class="mold-inner"></div>
            <div class="mold-lid"></div>
          </div>

          <div class="contact-shadow" aria-hidden="true"></div>
          <div class="object-stack">
            <canvas class="squish-canvas" aria-label="${copy.aria.squishy}"></canvas>
            <canvas class="paint-layer" width="${PAINT_CANVAS_SIZE}" height="${PAINT_CANVAS_SIZE}" aria-hidden="true" hidden></canvas>
          </div>

          <div class="dispenser" aria-hidden="true">
            <div class="dispenser-neck"></div>
            <div class="pour-stream"></div>
          </div>

          <div class="foam-shaker" aria-hidden="true">
            <div class="foam-shaker__cap"></div>
            <div class="foam-shaker__body"><span>FOAM</span></div>
            <div class="foam-spray">${foamParticles}</div>
          </div>

          <div class="reveal-flash" aria-hidden="true"></div>
          <div class="result-halo" aria-hidden="true"></div>

          <button class="hold-surface" type="button" aria-label="${copy.aria.craftSurface}" hidden></button>
          <button class="mold-target" type="button" aria-label="${copy.aria.moldTarget}" hidden><span></span></button>

          <div class="stage-copy">
            <span class="stage-kicker">${copy.stage.kicker}</span>
            <strong class="stage-title">${copy.stage.selectTitle}</strong>
            <span class="stage-hint">${copy.stage.selectHint}</span>
            <span class="result-badge" hidden>NEW</span>
          </div>

          <div class="stage-progress" aria-hidden="true">
            <div class="stage-progress__fill"></div>
          </div>
        </section>

        <section class="recipe-panel" aria-label="${copy.aria.recipeOptions}">
          <div class="option-group option-group--palette">
            <span class="option-label">${copy.recipe.color}</span>
            <div class="swatches" role="group" aria-label="${copy.aria.colorGroup}">${paletteButtons}</div>
          </div>

          <div class="option-group option-group--texture">
            <span class="option-label">${copy.recipe.texture}</span>
            <div class="texture-options" role="group" aria-label="${copy.aria.fillingGroup}">${fillingButtons}</div>
          </div>

          <div class="recipe-action">
            <span class="variant-preview">Lavender Grape · Smooth</span>
            <button class="primary-button start-button" type="button">${copy.recipe.make}</button>
          </div>
        </section>

        <button class="primary-button collect-button" type="button" hidden>${copy.actions.collect}</button>

        <div class="debug-controls" aria-label="${copy.aria.debugControls}">
          <button class="debug-button" type="button" data-action="metrics" aria-pressed="false">${copy.actions.metrics}</button>
          <button class="debug-button" type="button" data-action="wireframe" aria-pressed="false">${copy.actions.mesh}</button>
          <button class="debug-button" type="button" data-action="mute" aria-pressed="false">${this.muted ? copy.actions.unmute : copy.actions.mute}</button>
        </div>
        <pre class="metrics" aria-live="polite" hidden></pre>
      </main>
    `;
  }

  private bindEvents(): void {
    const signal = this.abortController.signal;

    this.holdSurface.addEventListener('pointerdown', this.handleHoldPointerDown, { signal });
    this.holdSurface.addEventListener('pointermove', this.handleHoldPointerMove, { signal });
    this.holdSurface.addEventListener('pointerup', this.handleHoldPointerEnd, { signal });
    this.holdSurface.addEventListener('pointercancel', this.handleHoldPointerEnd, { signal });
    this.moldTarget.addEventListener('pointerdown', this.handleMoldTargetPress, { signal });
    this.workspace.addEventListener('pointerdown', this.handleMoldSurfacePress, { signal });

    this.canvas.addEventListener('pointerdown', this.handleMixPointerDown, { signal });
    this.canvas.addEventListener('pointermove', this.handleMixPointerMove, { signal });
    this.canvas.addEventListener('pointerup', this.handleMixPointerEnd, { signal });
    this.canvas.addEventListener('pointercancel', this.handleMixPointerEnd, { signal });

    this.startButton.addEventListener('click', () => {
      if (this.activityBlocked) return;
      void this.audio.prime();
      this.setStage('pour');
    }, { signal });

    this.collectButton.addEventListener('click', () => this.collectResult(), { signal });

    for (const button of this.colorButtons) {
      button.addEventListener('click', () => {
        if (this.activityBlocked || this.stage !== 'select') return;
        const value = button.dataset.paletteChoice;
        if (!this.isPaletteId(value)) return;
        this.selected = { ...this.selected, palette: value };
        this.updateSelectionUi();
      }, { signal });
    }

    for (const button of this.fillingButtons) {
      button.addEventListener('click', () => {
        if (this.activityBlocked || this.stage !== 'select') return;
        const value = button.dataset.fillingChoice;
        if (!this.isFillingId(value)) return;
        this.selected = { ...this.selected, filling: value };
        this.updateSelectionUi();
      }, { signal });
    }

    this.metricsButton.addEventListener('click', () => {
      this.metricsVisible = !this.metricsVisible;
      this.metricsElement.hidden = !this.metricsVisible;
      this.metricsButton.setAttribute('aria-pressed', String(this.metricsVisible));
    }, { signal });

    this.wireframeButton.addEventListener('click', () => {
      this.wireframe = !this.wireframe;
      this.renderer.setWireframe(this.wireframe);
      this.wireframeButton.setAttribute('aria-pressed', String(this.wireframe));
    }, { signal });

    this.muteButton.addEventListener('click', () => {
      this.muted = !this.muted;
      this.renderer.setMuted(this.muted);
      this.muteButton.setAttribute('aria-pressed', String(this.muted));
      this.muteButton.textContent = this.muted ? this.options.copy.actions.unmute : this.options.copy.actions.mute;
      void this.options.onMutedChange(this.muted);
    }, { signal });

    window.addEventListener('resize', this.updateHeroSize, { signal });
  }

  private updateSelectionUi(): void {
    const palette = getPalette(this.selected.palette);
    this.shell.dataset.palette = palette.id;
    this.shell.dataset.filling = this.selected.filling;
    this.shell.style.setProperty('--accent', palette.accentCss);
    this.shell.style.setProperty('--accent-soft', palette.accentSoftCss);
    this.variantPreview.textContent = variantLabel(this.selected);
    this.renderer.setMaterial(palette);

    for (const button of this.colorButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.paletteChoice === this.selected.palette));
    }
    for (const button of this.fillingButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.fillingChoice === this.selected.filling));
    }

    if (this.stage === 'select') {
      this.renderer.setFillProgress(1);
      this.renderer.setFillingAmount(this.selected.filling === 'beads' ? 1 : 0);
    }
  }

  private setStage(next: CraftStage): void {
    this.clearTransitionTimer();
    this.clearMoldTargetTimer();
    this.audio.stopPour();
    this.stage = next;
    this.shell.dataset.stage = next;
    this.shell.dataset.tested = 'false';
    this.shell.dataset.shaking = 'false';
    this.foamShaker.style.setProperty('--shake-x', '0px');
    this.foamShaker.style.setProperty('--shake-tilt', '0deg');
    this.shakeLastActiveAt = 0;
    this.setStageProgress(0);
    this.setHoldSurfaceActive(false);
    this.paintCanvas.hidden = true;
    this.paintAudioActive = false;
    this.paintComplete = false;
    this.resetMixTracking();
    this.moldTarget.hidden = true;
    this.moldTarget.disabled = true;
    this.moldComplete = false;
    this.shakeAudioActive = false;
    this.resultBadge.hidden = true;

    const tactile = next === 'mix' || next === 'test';
    this.renderer.setInteractive(!this.activityBlocked && tactile);
    this.recipePanel.hidden = next !== 'select';
    this.collectButton.hidden = next !== 'test';

    switch (next) {
      case 'select':
        this.setStageCopy(this.options.copy.stage.selectTitle, this.options.copy.stage.selectHint);
        this.renderer.setFillProgress(1);
        this.renderer.setFillingAmount(this.selected.filling === 'beads' ? 1 : 0);
        this.renderer.setMoldProgress(0);
        break;
      case 'pour':
        this.setStageCopy(this.options.copy.stage.pourTitle, this.options.copy.stage.pourHint);
        this.renderer.setFillProgress(0);
        this.renderer.setFillingAmount(0);
        this.renderer.setMoldProgress(0);
        this.resetPaintCoverage();
        this.paintCanvas.hidden = false;
        this.setHoldSurfaceActive(true);
        break;
      case 'add':
        this.setStageCopy(this.options.copy.stage.addTitle, this.options.copy.stage.addHint);
        this.renderer.setFillProgress(1);
        this.renderer.setFillingAmount(0);
        this.setHoldSurfaceActive(true);
        break;
      case 'mix':
        this.setStageCopy(this.options.copy.stage.mixTitle, this.options.copy.stage.mixHint);
        this.renderer.setFillProgress(1);
        this.renderer.setFillingAmount(this.selected.filling === 'beads' ? 1 : 0);
        this.renderer.setMoldProgress(0);
        this.lastSemanticAt = performance.now();
        break;
      case 'mold':
        this.setStageCopy(this.options.copy.stage.moldTitle, this.options.copy.stage.moldHint);
        this.renderer.setMoldProgress(0);
        this.lastSemanticAt = performance.now();
        this.spawnMoldTarget();
        break;
      case 'reveal':
        this.setStageCopy(this.options.copy.stage.revealTitle, '');
        this.renderer.setMoldProgress(1);
        this.audio.playReveal(this.selected.filling === 'beads');
        this.transitionTimer = window.setTimeout(() => this.setStage('test'), 920);
        break;
      case 'test': {
        const isNew = !this.discovered.has(variantId(this.selected));
        this.renderer.setMoldProgress(0);
        this.setStageCopy(variantLabel(this.selected), this.options.copy.stage.testHint);
        this.resultBadge.hidden = !isNew;
        this.resultBadge.textContent = this.options.copy.stage.newMaterial;
        this.testStartSqueezes = this.latestMetrics?.squeezes ?? 0;
        break;
      }
      case 'collect':
        this.setStageCopy(this.options.copy.stage.collectedTitle, this.options.copy.stage.collectedHint);
        this.audio.playCollect();
        this.transitionTimer = window.setTimeout(() => this.setStage('select'), 520);
        break;
    }
  }

  private readonly handleMetrics = (metrics: SquishMetrics): void => {
    this.latestMetrics = metrics;
    this.metricsElement.textContent = [
      `stage            ${this.stage}`,
      `stage progress   ${this.stageProgress.toFixed(3)}`,
      `fps              ${metrics.fps.toFixed(1)}`,
      `p95 frame        ${metrics.p95FrameMs.toFixed(2)} ms`,
      `compression      ${metrics.compression.toFixed(3)}`,
      `press depth      ${metrics.pressDepth.toFixed(3)}`,
      `velocity         ${metrics.normalizedVelocity.toFixed(3)}`,
      `mix pointer px/s ${this.mixPointerSpeed.toFixed(1)}`,
      `max displacement ${metrics.maxDisplacement.toFixed(3)}`,
      `pointer active   ${metrics.active ? 'yes' : 'no'}`,
      `squeezes         ${metrics.squeezes}`,
    ].join('\n');

    this.updateShadow(metrics);

    const now = performance.now();
    const dt = Math.min(0.2, Math.max(0, (now - this.lastSemanticAt) / 1000));
    this.lastSemanticAt = now;

    if (!this.activityBlocked && this.stage === 'mix') {
      const recentTravel = now - this.mixLastMoveAt <= MIX_MOTION_IDLE_MS;
      const speedFactor = clamp01((this.mixPointerSpeed - 55) / 650);
      const movingStretch = metrics.active
        && metrics.compression >= 0.24
        && recentTravel
        && speedFactor > 0;

      if (movingStretch && this.stageProgress < 1) {
        const stretch = clamp01((metrics.compression - 0.22) / 0.58);
        const effort = stretch * 0.72 + speedFactor * 0.28;
        this.setStageProgress(this.stageProgress + dt * effort * 0.67);
      }

      if (!metrics.active && this.stageProgress >= 1) {
        this.audio.playStageComplete(0.5);
        this.setStage('mold');
      }
    } else if (this.stage === 'test') {
      this.shell.dataset.tested = String(metrics.squeezes > this.testStartSqueezes);
    }
  };

  private updateShadow(metrics: SquishMetrics): void {
    const directionMagnitude = Math.hypot(metrics.gestureX, metrics.gestureY);
    const angle = directionMagnitude > 0.05
      ? Math.atan2(-metrics.gestureY, metrics.gestureX) * (180 / Math.PI)
      : 0;
    const shiftX = metrics.gestureX * metrics.compression * 9;
    const shiftY = -metrics.gestureY * metrics.compression * 5;
    const scaleAlong = 1 + metrics.compression * 0.18 + metrics.pressDepth * 0.025;
    const scaleAcross = 1 - metrics.compression * 0.045 - metrics.pressDepth * 0.03;

    this.contactShadow.style.transform = [
      'translate(-50%, -50%)',
      `translate(${shiftX.toFixed(2)}px, ${shiftY.toFixed(2)}px)`,
      `rotate(${angle.toFixed(2)}deg)`,
      `scale(${scaleAlong.toFixed(3)}, ${scaleAcross.toFixed(3)})`,
    ].join(' ');
    this.contactShadow.style.opacity = String(0.68 + metrics.compression * 0.16 + metrics.pressDepth * 0.04);
  }

  private readonly handleHoldPointerDown = (event: PointerEvent): void => {
    if (this.activityBlocked || this.holdPointerId !== null || (this.stage !== 'pour' && this.stage !== 'add')) return;
    event.preventDefault();
    this.holdPointerId = event.pointerId;
    this.holdStageComplete = false;

    try {
      this.holdSurface.setPointerCapture(event.pointerId);
    } catch {
      // Best-effort pointer ownership only.
    }

    void this.audio.prime();

    if (this.stage === 'pour') {
      const point = this.pointerToPaintUv(event.clientX, event.clientY);
      this.paintLastU = point.u;
      this.paintLastV = point.v;
      this.paintLastAt = performance.now();
      this.paintAtUv(point.u, point.v);
      return;
    }

    this.shakeLastX = event.clientX;
    this.shakeLastY = event.clientY;
    this.shakeLastAt = performance.now();
    this.shakeLastActiveAt = 0;
    this.shakeLastDirection = 0;
  };

  private readonly handleHoldPointerMove = (event: PointerEvent): void => {
    if (this.activityBlocked || event.pointerId !== this.holdPointerId) return;
    event.preventDefault();

    if (this.stage === 'pour') {
      if (!this.paintComplete) this.paintPathTo(event.clientX, event.clientY);
      return;
    }

    if (this.stage !== 'add' || this.holdStageComplete) return;

    const now = performance.now();
    const dx = event.clientX - this.shakeLastX;
    const dy = event.clientY - this.shakeLastY;
    const elapsedMs = Math.max(8, now - this.shakeLastAt);
    const distance = Math.min(48, Math.hypot(dx, dy));
    const speed = (distance / elapsedMs) * 1000;
    const speedFactor = clamp01((speed - 110) / 650);
    const direction = Math.abs(dx) < 1 ? 0 : Math.sign(dx);
    const reversalBonus = direction !== 0
      && this.shakeLastDirection !== 0
      && direction !== this.shakeLastDirection
      ? 1.28
      : 1;

    if (distance >= 2.5 && speedFactor > 0) {
      const progressDelta = (distance / SHAKE_PATH_FOR_FULL_PROGRESS_PX)
        * (0.45 + speedFactor * 0.55)
        * reversalBonus;
      this.setStageProgress(this.stageProgress + progressDelta);
      this.renderer.setFillingAmount(this.stageProgress);
      this.shell.dataset.shaking = 'true';
      this.shakeLastActiveAt = now;
      if (!this.shakeAudioActive) {
        this.audio.startPour('beads');
        this.shakeAudioActive = true;
      }
      this.updateShakerPose(event.clientX);
    }

    if (direction !== 0) this.shakeLastDirection = direction;
    this.shakeLastX = event.clientX;
    this.shakeLastY = event.clientY;
    this.shakeLastAt = now;

    if (this.stageProgress >= 1) this.finishShakeStage();
  };

  private readonly handleHoldPointerEnd = (event: PointerEvent): void => {
    if (event.pointerId !== this.holdPointerId) return;
    event.preventDefault();

    try {
      this.holdSurface.releasePointerCapture(event.pointerId);
    } catch {
      // Capture may already be gone.
    }

    this.holdPointerId = null;
    this.audio.stopPour();
    this.paintAudioActive = false;
    this.shakeAudioActive = false;
    this.shell.dataset.shaking = 'false';
  };

  private resetPaintCoverage(): void {
    this.paintCoverage.fill(0);
    this.paintEligible.fill(0);
    this.paintEligibleCount = 0;
    this.paintCoveredCount = 0;
    this.paintComplete = false;

    for (let y = 0; y < PAINT_GRID_SIZE; y += 1) {
      for (let x = 0; x < PAINT_GRID_SIZE; x += 1) {
        const u = (x + 0.5) / PAINT_GRID_SIZE;
        const v = (y + 0.5) / PAINT_GRID_SIZE;
        const px = u * 2 - 1;
        const py = v * 2 - 1;
        if (Math.abs(px) ** 4 + Math.abs(py) ** 4 > 0.96) continue;
        const index = y * PAINT_GRID_SIZE + x;
        this.paintEligible[index] = 1;
        this.paintEligibleCount += 1;
      }
    }

    const context = this.paintContext;
    context.clearRect(0, 0, PAINT_CANVAS_SIZE, PAINT_CANVAS_SIZE);
    const palette = getPalette(this.selected.palette);
    context.save();
    context.fillStyle = 'rgba(255, 255, 255, 0.045)';
    context.fill(this.paintShapePath);
    context.lineWidth = 2;
    context.strokeStyle = palette.accentSoftCss;
    context.shadowBlur = 12;
    context.shadowColor = palette.accentSoftCss;
    context.stroke(this.paintShapePath);
    context.restore();
  }

  private paintPathTo(clientX: number, clientY: number): void {
    const point = this.pointerToPaintUv(clientX, clientY);
    const du = point.u - this.paintLastU;
    const dv = point.v - this.paintLastV;
    const distance = Math.hypot(du, dv);
    const steps = Math.max(1, Math.ceil(distance / 0.026));

    for (let step = 1; step <= steps; step += 1) {
      const ratio = step / steps;
      this.paintAtUv(this.paintLastU + du * ratio, this.paintLastV + dv * ratio);
      if (this.paintComplete) break;
    }

    this.paintLastU = point.u;
    this.paintLastV = point.v;
  }

  private paintAtUv(u: number, v: number): void {
    if (this.paintComplete || !this.isInsidePaintShape(u, v)) return;

    let newlyCovered = 0;
    for (let y = 0; y < PAINT_GRID_SIZE; y += 1) {
      for (let x = 0; x < PAINT_GRID_SIZE; x += 1) {
        const index = y * PAINT_GRID_SIZE + x;
        if (this.paintEligible[index] !== 1 || this.paintCoverage[index] === 1) continue;
        const cellU = (x + 0.5) / PAINT_GRID_SIZE;
        const cellV = (y + 0.5) / PAINT_GRID_SIZE;
        if (Math.hypot(cellU - u, cellV - v) > PAINT_BRUSH_RADIUS_UV) continue;
        this.paintCoverage[index] = 1;
        this.paintCoveredCount += 1;
        newlyCovered += 1;
      }
    }

    if (newlyCovered === 0) return;

    this.drawPaintBrush(u, v);
    const coverage = this.paintEligibleCount === 0 ? 0 : this.paintCoveredCount / this.paintEligibleCount;
    this.setStageProgress(coverage / PAINT_COMPLETE_COVERAGE);
    this.paintLastAt = performance.now();

    if (!this.paintAudioActive) {
      this.audio.startPour('base');
      this.paintAudioActive = true;
    }

    if (coverage >= PAINT_COMPLETE_COVERAGE) this.finishPaintStage();
  }

  private drawPaintBrush(u: number, v: number): void {
    const context = this.paintContext;
    const x = u * PAINT_CANVAS_SIZE;
    const y = (1 - v) * PAINT_CANVAS_SIZE;
    const radius = PAINT_CANVAS_SIZE * PAINT_BRUSH_RADIUS_UV;
    const spreadRadius = radius * 1.42;
    const palette = getPalette(this.selected.palette);

    const spreadGradient = context.createRadialGradient(x, y, radius * 0.25, x, y, spreadRadius);
    spreadGradient.addColorStop(0, palette.accentCss);
    spreadGradient.addColorStop(0.48, palette.accentSoftCss);
    spreadGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    context.save();
    context.clip(this.paintShapePath);
    context.globalAlpha = 0.34;
    context.fillStyle = spreadGradient;
    context.beginPath();
    context.arc(x, y, spreadRadius, 0, Math.PI * 2);
    context.fill();
    context.restore();

    const gradient = context.createRadialGradient(
      x - radius * 0.18,
      y - radius * 0.18,
      radius * 0.08,
      x,
      y,
      radius,
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.34)');
    gradient.addColorStop(0.22, palette.accentCss);
    gradient.addColorStop(1, palette.accentSoftCss);

    context.save();
    context.clip(this.paintShapePath);
    context.globalAlpha = 0.94;
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  private createPaintShapePath(): Path2D {
    const path = new Path2D();
    const center = PAINT_CANVAS_SIZE * 0.5;
    const radius = PAINT_CANVAS_SIZE * 0.48;
    const points = 96;

    for (let index = 0; index <= points; index += 1) {
      const angle = (index / points) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const x = Math.sign(cos) * Math.sqrt(Math.abs(cos));
      const y = Math.sign(sin) * Math.sqrt(Math.abs(sin));
      const px = center + x * radius;
      const py = center - y * radius;
      if (index === 0) path.moveTo(px, py);
      else path.lineTo(px, py);
    }

    path.closePath();
    return path;
  }

  private pointerToPaintUv(clientX: number, clientY: number): { u: number; v: number } {
    const rect = this.workspace.getBoundingClientRect();
    const left = rect.left + rect.width * 0.5 - this.heroSizePx * 0.5;
    const top = rect.top + rect.height * 0.5 - this.heroSizePx * 0.5;
    return {
      u: (clientX - left) / Math.max(1, this.heroSizePx),
      v: 1 - (clientY - top) / Math.max(1, this.heroSizePx),
    };
  }

  private isInsidePaintShape(u: number, v: number): boolean {
    const x = u * 2 - 1;
    const y = v * 2 - 1;
    return Math.abs(x) ** 4 + Math.abs(y) ** 4 <= 0.96;
  }

  private finishPaintStage(): void {
    if (this.stage !== 'pour' || this.paintComplete) return;
    this.paintComplete = true;
    this.setStageProgress(1);
    this.renderer.setFillProgress(1);
    this.stageHint.textContent = this.options.copy.stage.covered;
    this.audio.stopPour();
    this.paintAudioActive = false;

    if (this.holdPointerId !== null) {
      try {
        this.holdSurface.releasePointerCapture(this.holdPointerId);
      } catch {
        // Capture may already be gone.
      }
    }

    this.holdPointerId = null;
    this.setHoldSurfaceActive(false);
    this.audio.playStageComplete(0.42);
    this.transitionTimer = window.setTimeout(
      () => this.setStage(this.selected.filling === 'beads' ? 'add' : 'mix'),
      180,
    );
  }

  private finishShakeStage(): void {
    if (this.stage !== 'add' || this.holdStageComplete) return;
    this.holdStageComplete = true;
    this.setStageProgress(1);
    this.renderer.setFillingAmount(1);
    this.stageHint.textContent = this.options.copy.stage.scattered;
    this.audio.stopPour();
    this.shakeAudioActive = false;
    this.shell.dataset.shaking = 'false';

    if (this.holdPointerId !== null) {
      try {
        this.holdSurface.releasePointerCapture(this.holdPointerId);
      } catch {
        // Capture may already be gone.
      }
    }

    this.holdPointerId = null;
    this.setHoldSurfaceActive(false);
    this.audio.playStageComplete(0.65);
    this.transitionTimer = window.setTimeout(() => this.setStage('mix'), 170);
  }

  private updateShakerPose(clientX: number): void {
    const rect = this.workspace.getBoundingClientRect();
    const offset = clamp01((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    this.foamShaker.style.setProperty('--shake-x', `${(offset * 30).toFixed(1)}px`);
    this.foamShaker.style.setProperty('--shake-tilt', `${(offset * 9).toFixed(1)}deg`);
  }

  private readonly handleMixPointerDown = (event: PointerEvent): void => {
    if (this.activityBlocked || this.stage !== 'mix' || this.mixPointerId !== null) return;
    this.mixPointerId = event.pointerId;
    this.mixLastX = event.clientX;
    this.mixLastY = event.clientY;
    this.mixLastSampleAt = performance.now();
    this.mixLastMoveAt = 0;
    this.mixPointerSpeed = 0;
  };

  private readonly handleMixPointerMove = (event: PointerEvent): void => {
    if (this.activityBlocked || this.stage !== 'mix' || event.pointerId !== this.mixPointerId) return;
    const now = performance.now();
    const dx = event.clientX - this.mixLastX;
    const dy = event.clientY - this.mixLastY;
    const distance = Math.hypot(dx, dy);
    const elapsedMs = Math.max(8, now - this.mixLastSampleAt);

    if (distance >= 1) {
      this.mixPointerSpeed = (distance / elapsedMs) * 1000;
      this.mixLastMoveAt = now;
    }

    this.mixLastX = event.clientX;
    this.mixLastY = event.clientY;
    this.mixLastSampleAt = now;
  };

  private readonly handleMixPointerEnd = (event: PointerEvent): void => {
    if (event.pointerId !== this.mixPointerId) return;
    this.resetMixTracking();
  };

  private resetMixTracking(): void {
    this.mixPointerId = null;
    this.mixLastSampleAt = 0;
    this.mixLastMoveAt = 0;
    this.mixPointerSpeed = 0;
  }

  private readonly handleMoldSurfacePress = (event: PointerEvent): void => {
    if (this.activityBlocked || this.stage !== 'mold' || this.moldComplete) return;
    const point = this.pointerToPaintUv(event.clientX, event.clientY);
    if (!this.isInsidePaintShape(point.u, point.v)) return;
    event.preventDefault();
    void this.audio.prime();
    this.advanceMoldProgress(MOLD_NORMAL_HIT_PROGRESS);
  };

  private advanceMoldProgress(amount: number): boolean {
    if (this.stage !== 'mold' || this.moldComplete) return false;
    this.setStageProgress(this.stageProgress + amount);
    this.renderer.setMoldProgress(this.stageProgress);
    if (this.stageProgress < 1) return false;

    this.moldComplete = true;
    this.clearMoldTargetTimer();
    this.moldTarget.hidden = true;
    this.moldTarget.disabled = true;
    this.setStageCopy(this.options.copy.stage.shapeLocked, '');
    this.audio.playStageComplete(0.8);
    this.transitionTimer = window.setTimeout(() => this.setStage('reveal'), 220);
    return true;
  }

  private readonly handleMoldTargetPress = (event: PointerEvent): void => {
    if (this.activityBlocked || this.stage !== 'mold' || this.moldComplete) return;
    event.preventDefault();
    event.stopPropagation();
    void this.audio.prime();

    this.clearMoldTargetTimer();
    this.moldTarget.classList.remove('is-hit');
    void this.moldTarget.offsetWidth;
    this.moldTarget.classList.add('is-hit');
    this.moldTarget.disabled = true;

    if (this.advanceMoldProgress(MOLD_CRIT_HIT_PROGRESS)) return;

    this.moldTargetTimer = window.setTimeout(() => this.spawnMoldTarget(), MOLD_NEXT_TARGET_DELAY_MS);
  };

  private spawnMoldTarget(): void {
    if (this.activityBlocked || this.stage !== 'mold' || this.moldComplete) return;
    this.clearMoldTargetTimer();

    let nextX = 0;
    let nextY = 0;
    for (let attempt = 0; attempt < 16; attempt += 1) {
      const candidateX = (Math.random() * 2 - 1) * 0.68;
      const candidateY = (Math.random() * 2 - 1) * 0.68;
      const inside = Math.abs(candidateX) ** 4 + Math.abs(candidateY) ** 4 <= 0.62;
      const separated = Math.hypot(candidateX - this.moldTargetX, candidateY - this.moldTargetY) >= 0.34;
      if (!inside || !separated) continue;
      nextX = candidateX;
      nextY = candidateY;
      break;
    }

    this.moldTargetX = nextX;
    this.moldTargetY = nextY;
    this.positionMoldTarget();
    this.moldTarget.classList.remove('is-hit');
    this.moldTarget.disabled = false;
    this.moldTarget.hidden = false;
  }

  private positionMoldTarget(): void {
    if (this.stage !== 'mold') return;
    const rect = this.workspace.getBoundingClientRect();
    const left = rect.width * 0.5 + this.moldTargetX * this.heroSizePx * 0.5;
    const top = rect.height * 0.5 - this.moldTargetY * this.heroSizePx * 0.5;
    this.moldTarget.style.left = `${left.toFixed(1)}px`;
    this.moldTarget.style.top = `${top.toFixed(1)}px`;
  }

  private collectResult(): void {
    if (this.activityBlocked || this.stage !== 'test') return;
    const collectedVariantId = variantId(this.selected);
    this.discovered.add(collectedVariantId);
    this.updateDiscoveredUi();
    void this.options.onVariantCollected(collectedVariantId);
    this.setStage('collect');
  }

  private readonly tickCraft = (now: number): void => {
    if (this.disposed) return;
    const dt = Math.min(0.05, Math.max(0, (now - this.lastCraftFrameAt) / 1000));
    this.lastCraftFrameAt = now;

    if (this.stage === 'pour' && this.paintAudioActive && now - this.paintLastAt > PAINT_IDLE_MS) {
      this.audio.stopPour();
      this.paintAudioActive = false;
    }

    if (this.stage === 'add' && this.shell.dataset.shaking === 'true' && now - this.shakeLastActiveAt > SHAKE_IDLE_MS) {
      this.shell.dataset.shaking = 'false';
      if (this.shakeAudioActive) {
        this.audio.stopPour();
        this.shakeAudioActive = false;
      }
    }

    if (this.stage === 'mix' && now - this.mixLastMoveAt > MIX_MOTION_IDLE_MS) {
      this.mixPointerSpeed = 0;
    }

    if (!this.activityBlocked && this.stage === 'mold' && !this.moldComplete && this.stageProgress > 0) {
      this.setStageProgress(this.stageProgress - dt * MOLD_DECAY_PER_SECOND);
      this.renderer.setMoldProgress(this.stageProgress);
    }

    this.craftFrame = requestAnimationFrame(this.tickCraft);
  };

  public setActivityBlocked(blocked: boolean): void {
    if (this.activityBlocked === blocked) return;
    this.activityBlocked = blocked;

    if (blocked) {
      this.audio.stopPour();
      this.paintAudioActive = false;
      this.shakeAudioActive = false;
      this.shell.dataset.shaking = 'false';
      this.moldTargetWasAvailableBeforeBlock = this.stage === 'mold'
        && !this.moldTarget.hidden
        && !this.moldTarget.disabled;
      this.clearMoldTargetTimer();
      this.moldTarget.hidden = true;
      this.resetMixTracking();
      this.renderer.setInteractive(false);

      if (this.holdPointerId !== null) {
        try {
          this.holdSurface.releasePointerCapture(this.holdPointerId);
        } catch {
          // Pointer capture may already be unavailable during a platform pause.
        }
        this.holdPointerId = null;
        this.holdStageComplete = false;
      }
      return;
    }

    this.lastCraftFrameAt = performance.now();
    this.lastSemanticAt = performance.now();
    this.renderer.resetTiming();
    this.renderer.setInteractive(this.stage === 'mix' || this.stage === 'test');

    if (this.stage === 'mold' && !this.moldComplete) {
      if (this.moldTargetWasAvailableBeforeBlock) {
        this.positionMoldTarget();
        this.moldTarget.disabled = false;
        this.moldTarget.hidden = false;
      } else {
        this.spawnMoldTarget();
      }
    }
    this.moldTargetWasAvailableBeforeBlock = false;
  }

  private setStageProgress(value: number): void {
    this.stageProgress = clamp01(value);
    this.progressFill.style.transform = `scaleX(${this.stageProgress.toFixed(4)})`;
    this.shell.style.setProperty('--stage-progress', this.stageProgress.toFixed(4));
  }

  private setHoldSurfaceActive(active: boolean): void {
    this.holdSurface.hidden = !active;
    if (!active) {
      this.holdPointerId = null;
      this.holdStageComplete = false;
    }
  }

  private setStageCopy(title: string, hint: string): void {
    this.stageTitle.textContent = title;
    this.stageHint.textContent = hint;
  }

  private clearTransitionTimer(): void {
    if (this.transitionTimer === null) return;
    window.clearTimeout(this.transitionTimer);
    this.transitionTimer = null;
  }

  private clearMoldTargetTimer(): void {
    if (this.moldTargetTimer === null) return;
    window.clearTimeout(this.moldTargetTimer);
    this.moldTargetTimer = null;
  }

  private updateDiscoveredUi(): void {
    this.madeCount.textContent = `${this.options.copy.collection.made} ${Math.min(TOTAL_VARIANTS, this.discovered.size)} / ${TOTAL_VARIANTS}`;
    for (const dot of this.discoveryDots.querySelectorAll<HTMLElement>('[data-variant-dot]')) {
      const id = dot.dataset.variantDot;
      dot.classList.toggle('is-found', typeof id === 'string' && this.discovered.has(id));
    }
    this.collectionPulse();
  }

  private collectionPulse(): void {
    const summary = this.madeCount.parentElement;
    if (!summary) return;
    summary.classList.remove('is-updated');
    void summary.offsetWidth;
    summary.classList.add('is-updated');
  }

  private readonly updateHeroSize = (): void => {
    const rect = this.workspace.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height) * 0.68;
    this.heroSizePx = Math.max(120, size);
    this.shell.style.setProperty('--hero-size', `${this.heroSizePx.toFixed(1)}px`);
    if (this.stage === 'mold' && !this.moldTarget.hidden) this.positionMoldTarget();
  };

  private requireElement<T extends Element>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing required element: ${selector}`);
    return element;
  }

  private isPaletteId(value: string | undefined): value is PaletteId {
    return value === 'grape' || value === 'strawberry' || value === 'lime';
  }

  private isFillingId(value: string | undefined): value is FillingId {
    return value === 'smooth' || value === 'beads';
  }
}
