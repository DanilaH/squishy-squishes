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

const DISCOVERED_STORAGE_KEY = 'squishy.vertical-slice.discovered.v2';
const TOTAL_VARIANTS = ALL_VARIANT_IDS.length;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export class VerticalSliceApp {
  private readonly abortController = new AbortController();
  private readonly shell: HTMLElement;
  private readonly workspace: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly contactShadow: HTMLElement;
  private readonly holdSurface: HTMLButtonElement;
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

  private stage: CraftStage = 'select';
  private selected: VariantChoice = { palette: 'grape', filling: 'smooth' };
  private stageProgress = 0;
  private holdPointerId: number | null = null;
  private holdStageComplete = false;
  private transitionTimer: number | null = null;
  private craftFrame = 0;
  private lastCraftFrameAt = performance.now();
  private lastSemanticAt = performance.now();
  private latestMetrics: SquishMetrics | null = null;
  private testStartSqueezes = 0;
  private metricsVisible = false;
  private wireframe = false;
  private muted = false;
  private disposed = false;

  public constructor(private readonly root: HTMLDivElement) {
    root.innerHTML = this.renderShell();

    this.shell = this.requireElement<HTMLElement>('.lab-shell');
    this.workspace = this.requireElement<HTMLElement>('.lab-workspace');
    this.canvas = this.requireElement<HTMLCanvasElement>('.squish-canvas');
    this.contactShadow = this.requireElement<HTMLElement>('.contact-shadow');
    this.holdSurface = this.requireElement<HTMLButtonElement>('.hold-surface');
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

    this.bindEvents();
    this.loadDiscovered();
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
    cancelAnimationFrame(this.craftFrame);
    this.abortController.abort();
    this.audio.stopPour();
    this.renderer.dispose();
    this.audio.dispose();
  }

  private renderShell(): string {
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

    return `
      <main class="lab-shell" data-stage="select" data-palette="grape" data-filling="smooth" data-tested="false">
        <header class="lab-topbar">
          <div class="lab-brand">
            <strong>Squishy Lab</strong>
            <span>Prototype line · 01</span>
          </div>
          <div class="collection-summary" aria-live="polite">
            <span class="made-count">Made 0 / ${TOTAL_VARIANTS}</span>
            <span class="discovery-dots" aria-hidden="true">${discoveryDots}</span>
          </div>
        </header>

        <section class="lab-workspace" aria-label="Squishy workbench">
          <div class="workspace-vignette" aria-hidden="true"></div>
          <div class="bench-line" aria-hidden="true"></div>
          <div class="mold-frame" aria-hidden="true">
            <div class="mold-inner"></div>
            <div class="mold-lid"></div>
          </div>

          <div class="contact-shadow" aria-hidden="true"></div>
          <div class="object-stack">
            <canvas class="squish-canvas" aria-label="Interactive squishy"></canvas>
          </div>

          <div class="dispenser" aria-hidden="true">
            <div class="dispenser-neck"></div>
            <div class="pour-stream"></div>
          </div>
          <div class="reveal-flash" aria-hidden="true"></div>
          <div class="result-halo" aria-hidden="true"></div>

          <button class="hold-surface" type="button" aria-label="Hold to continue" hidden></button>

          <div class="stage-copy">
            <span class="stage-kicker">CRAFT 01</span>
            <strong class="stage-title">Choose a recipe</strong>
            <span class="stage-hint">Pick a color and texture.</span>
            <span class="result-badge" hidden>NEW</span>
          </div>

          <div class="stage-progress" aria-hidden="true">
            <div class="stage-progress__fill"></div>
          </div>
        </section>

        <section class="recipe-panel" aria-label="Recipe options">
          <div class="option-group option-group--palette">
            <span class="option-label">Color</span>
            <div class="swatches" role="group" aria-label="Squishy color">${paletteButtons}</div>
          </div>

          <div class="option-group option-group--texture">
            <span class="option-label">Texture</span>
            <div class="texture-options" role="group" aria-label="Squishy filling">${fillingButtons}</div>
          </div>

          <div class="recipe-action">
            <span class="variant-preview">Lavender Grape · Smooth</span>
            <button class="primary-button start-button" type="button">Make squishy</button>
          </div>
        </section>

        <button class="primary-button collect-button" type="button" hidden>Collect</button>

        <div class="debug-controls" aria-label="Debug controls">
          <button class="debug-button" type="button" data-action="metrics" aria-pressed="false">Metrics</button>
          <button class="debug-button" type="button" data-action="wireframe" aria-pressed="false">Mesh</button>
          <button class="debug-button" type="button" data-action="mute" aria-pressed="false">Mute</button>
        </div>
        <pre class="metrics" aria-live="polite" hidden></pre>
      </main>
    `;
  }

  private bindEvents(): void {
    const signal = this.abortController.signal;

    this.holdSurface.addEventListener('pointerdown', this.handleHoldPointerDown, { signal });
    this.holdSurface.addEventListener('pointerup', this.handleHoldPointerEnd, { signal });
    this.holdSurface.addEventListener('pointercancel', this.handleHoldPointerEnd, { signal });

    this.startButton.addEventListener('click', () => {
      void this.audio.prime();
      this.setStage('pour');
    }, { signal });

    this.collectButton.addEventListener('click', () => this.collectResult(), { signal });

    for (const button of this.colorButtons) {
      button.addEventListener('click', () => {
        if (this.stage !== 'select') return;
        const value = button.dataset.paletteChoice;
        if (!this.isPaletteId(value)) return;
        this.selected = { ...this.selected, palette: value };
        this.updateSelectionUi();
      }, { signal });
    }

    for (const button of this.fillingButtons) {
      button.addEventListener('click', () => {
        if (this.stage !== 'select') return;
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
      this.muteButton.textContent = this.muted ? 'Unmute' : 'Mute';
    }, { signal });

    document.addEventListener('visibilitychange', this.handleVisibilityChange, { signal });
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
    this.audio.stopPour();
    this.stage = next;
    this.shell.dataset.stage = next;
    this.shell.dataset.tested = 'false';
    this.setStageProgress(0);
    this.setHoldSurfaceActive(false);
    this.resultBadge.hidden = true;

    const tactile = next === 'mix' || next === 'mold' || next === 'test';
    this.renderer.setInteractive(tactile);
    this.recipePanel.hidden = next !== 'select';
    this.collectButton.hidden = next !== 'test';

    switch (next) {
      case 'select':
        this.setStageCopy('Choose a recipe', 'Pick a color and texture, then make it.');
        this.renderer.setFillProgress(1);
        this.renderer.setFillingAmount(this.selected.filling === 'beads' ? 1 : 0);
        this.renderer.setMoldProgress(0);
        break;
      case 'pour':
        this.setStageCopy('Pour the base', 'Hold the workbench until the mold is full.');
        this.renderer.setFillProgress(0);
        this.renderer.setFillingAmount(0);
        this.renderer.setMoldProgress(0);
        this.setHoldSurfaceActive(true);
        break;
      case 'add':
        this.setStageCopy('Add foam beads', 'Hold to scatter the filling through the base.');
        this.renderer.setFillProgress(1);
        this.renderer.setFillingAmount(0);
        this.setHoldSurfaceActive(true);
        break;
      case 'mix':
        this.setStageCopy('Knead it', 'Press, drag and fold the soft mass.');
        this.renderer.setFillProgress(1);
        this.renderer.setFillingAmount(this.selected.filling === 'beads' ? 1 : 0);
        this.renderer.setMoldProgress(0);
        this.lastSemanticAt = performance.now();
        break;
      case 'mold':
        this.setStageCopy('Press the mold', 'Push and hold until the shape settles.');
        this.renderer.setMoldProgress(0);
        this.lastSemanticAt = performance.now();
        break;
      case 'reveal':
        this.setStageCopy('Unmolding…', '');
        this.renderer.setMoldProgress(1);
        this.audio.playReveal(this.selected.filling === 'beads');
        this.transitionTimer = window.setTimeout(() => this.setStage('test'), 920);
        break;
      case 'test': {
        const isNew = !this.discovered.has(variantId(this.selected));
        this.renderer.setMoldProgress(0);
        this.setStageCopy(variantLabel(this.selected), 'Fresh from the mold. Squeeze it, then collect.');
        this.resultBadge.hidden = !isNew;
        this.resultBadge.textContent = 'NEW MATERIAL';
        this.testStartSqueezes = this.latestMetrics?.squeezes ?? 0;
        break;
      }
      case 'collect':
        this.setStageCopy('Collected', 'Ready for another recipe.');
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
      `max displacement ${metrics.maxDisplacement.toFixed(3)}`,
      `pointer active   ${metrics.active ? 'yes' : 'no'}`,
      `squeezes         ${metrics.squeezes}`,
    ].join('\n');

    this.updateShadow(metrics);

    const now = performance.now();
    const dt = Math.min(0.2, Math.max(0, (now - this.lastSemanticAt) / 1000));
    this.lastSemanticAt = now;

    if (this.stage === 'mix') {
      if (metrics.active && this.stageProgress < 1) {
        const effort = 0.12
          + metrics.compression * 0.5
          + metrics.normalizedVelocity * 0.55
          + metrics.pressDepth * 0.1;
        this.setStageProgress(this.stageProgress + dt * effort * 0.72);
      }
      if (!metrics.active && this.stageProgress >= 1) {
        this.audio.playStageComplete(0.5);
        this.setStage('mold');
      }
    } else if (this.stage === 'mold') {
      if (metrics.active && this.stageProgress < 1) {
        const pressure = metrics.pressDepth * 0.52 + metrics.compression * 0.24;
        this.setStageProgress(this.stageProgress + dt * pressure * 0.82);
        this.renderer.setMoldProgress(this.stageProgress);
      }
      if (!metrics.active && this.stageProgress >= 1) {
        this.audio.playStageComplete(0.8);
        this.setStage('reveal');
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
    if (this.holdPointerId !== null || (this.stage !== 'pour' && this.stage !== 'add')) return;
    event.preventDefault();
    this.holdPointerId = event.pointerId;
    this.holdStageComplete = false;

    try {
      this.holdSurface.setPointerCapture(event.pointerId);
    } catch {
      // Best-effort pointer ownership only.
    }

    void this.audio.prime();
    this.audio.startPour(this.stage === 'pour' ? 'base' : 'beads');
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
    this.finishHoldStage();
  };

  private finishHoldStage(): void {
    if (!this.holdStageComplete) return;
    this.holdStageComplete = false;
    this.audio.playStageComplete(this.stage === 'add' ? 0.65 : 0.42);

    if (this.stage === 'pour') {
      this.setStage(this.selected.filling === 'beads' ? 'add' : 'mix');
    } else if (this.stage === 'add') {
      this.setStage('mix');
    }
  }

  private collectResult(): void {
    if (this.stage !== 'test') return;
    this.discovered.add(variantId(this.selected));
    this.persistDiscovered();
    this.updateDiscoveredUi();
    this.setStage('collect');
  }

  private readonly tickCraft = (now: number): void => {
    if (this.disposed) return;
    const dt = Math.min(0.05, Math.max(0, (now - this.lastCraftFrameAt) / 1000));
    this.lastCraftFrameAt = now;

    if (this.holdPointerId !== null && !this.holdStageComplete) {
      if (this.stage === 'pour') {
        this.setStageProgress(this.stageProgress + dt / 1.35);
        this.renderer.setFillProgress(this.easeOutCubic(this.stageProgress));
      } else if (this.stage === 'add') {
        this.setStageProgress(this.stageProgress + dt / 1.05);
        this.renderer.setFillingAmount(this.easeOutCubic(this.stageProgress));
      }

      if (this.stageProgress >= 1) {
        this.holdStageComplete = true;
        this.stageHint.textContent = 'Release.';
      }
    }

    this.craftFrame = requestAnimationFrame(this.tickCraft);
  };

  private readonly handleVisibilityChange = (): void => {
    if (!document.hidden) return;
    this.audio.stopPour();

    if (this.holdPointerId !== null) {
      try {
        this.holdSurface.releasePointerCapture(this.holdPointerId);
      } catch {
        // Capture may already be gone.
      }
      this.holdPointerId = null;
      this.holdStageComplete = false;
    }
  };

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

  private loadDiscovered(): void {
    try {
      const raw = window.localStorage.getItem(DISCOVERED_STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      for (const value of parsed) {
        if (typeof value === 'string' && ALL_VARIANT_IDS.includes(value)) this.discovered.add(value);
      }
    } catch {
      // Slice-only convenience state must never block the loop.
    }
  }

  private persistDiscovered(): void {
    try {
      window.localStorage.setItem(DISCOVERED_STORAGE_KEY, JSON.stringify([...this.discovered]));
    } catch {
      // Slice-only convenience state must never block the loop.
    }
  }

  private updateDiscoveredUi(): void {
    this.madeCount.textContent = `Made ${Math.min(TOTAL_VARIANTS, this.discovered.size)} / ${TOTAL_VARIANTS}`;
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
    this.shell.style.setProperty('--hero-size', `${Math.max(120, size).toFixed(1)}px`);
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

  private easeOutCubic(value: number): number {
    const t = clamp01(value);
    return 1 - (1 - t) ** 3;
  }
}
