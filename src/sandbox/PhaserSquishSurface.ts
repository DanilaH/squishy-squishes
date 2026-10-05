import { ToyPersonality } from './toyPersonality';
import { REST_TOY, idleToyPose, inclusionLag, type ToyPose } from './livingToy';
import Phaser from 'phaser';
import type { SquishyAudio } from '../game/SquishyAudio';
import { getShape, isPointInsideShape, type ShapeDefinition } from '../game/shapes';
import type { AppearancePoint } from './appearance';
import type { SquishFillingStyle, SquishMaterialStyle, SquishMetrics } from '../squish/SquishSurface';
import { PhaserSquishCandidate } from '../experiments/phaser/PhaserSquishCandidate';
import { PhaserStudioGestureBridge, type PhaserStudioGestureHost } from './PhaserStudioGestureBridge';
import type { StudioDecorSection, StudioGestureStage } from './StageGestureRouter';

/** The existing SandboxApp remains the only owner of draft, UI, baked texture, save and overlays. */
export interface PhaserSandboxCallbacks extends Pick<PhaserStudioGestureHost,
  'paintStamp' | 'paintSegment' | 'paintEnd' | 'addMixin' | 'addSticker' | 'previewSticker' | 'mixProgress'> {
  /** Draw existing DOM decor layers on Phaser's own update tick, not a second RAF. */
  readonly onFrame: () => void;
  readonly onSquishBegin?: () => void;
  readonly onSquishRelease?: (energy: number) => void;
  readonly onSquishCancel?: () => void;
}

/**
 * Drop-in studio rendering port, used only by the isolated Phaser studio entry.
 * It owns ONE Phaser.Game + WebGL2 context, and the Extern owns the shared
 * SquishSimulation. The original SandboxApp still owns all game documents.
 */
export class PhaserSquishSurface {
  private readonly game: Phaser.Game;
  private readonly gl: WebGL2RenderingContext;
  private scene: Phaser.Scene | null = null;
  private squish: PhaserSquishCandidate | null = null;
  private bridge: PhaserStudioGestureBridge | null = null;
  private shape: ShapeDefinition = getShape('soft-square');
  private material: SquishMaterialStyle | null = null;
  private appearance: HTMLCanvasElement | null = null;
  private readonly appearanceSnapshot = document.createElement('canvas');
  private appearanceContext: CanvasRenderingContext2D;
  private appearanceDefined = false;
  private readonly faceSnapshot = document.createElement('canvas');
  private faceContext: CanvasRenderingContext2D;
  private face: HTMLCanvasElement | null = null;
  private faceDefined = false;
  private inclusion: HTMLCanvasElement | null = null;
  private fillingAmount = 0;
  private fillingStyle: SquishFillingStyle = 'none';
  private fillProgress = 1;
  private moldProgress = 1;
  private wireframe = false;
  private muted = false;
  private blocked = false;
  private stage: StudioGestureStage = 'shape';
  private decorSection: StudioDecorSection = 'face';
  private disposed = false;
  private lastMetricsAt = 0;
  private readonly personality = new ToyPersonality();
  private extras = { surprise: 0, blink: 0 };
  public reactionExtras(): { surprise: number; blink: number } { return this.extras; }
  private quietMs = 0;
  private lastPresentationAt = performance.now();
  private pose: ToyPose = REST_TOY;
  private lag = { x: 0, y: 0 };
  private lastBody = { x: 0, y: 0 };
  private lastPose = REST_TOY;
  public bodyOffset(): { readonly x: number; readonly y: number } { return this.squish?.viewportFollowOffset() ?? { x: 0, y: 0 }; }
  private readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  public presentation(): ToyPose { return this.pose; }
  public inclusionOffset(): { x: number; y: number } {
    const scale = this.material?.materialId === 'jelly' ? 1.25 : this.material?.materialId === 'marshmallow' ? .4 : .75;
    return { x: this.lag.x * scale, y: this.lag.y * scale };
  }
  private resetPresentation(): void {
    this.quietMs = 0; this.pose = REST_TOY; this.lag = { x: 0, y: 0 };
    this.lastPresentationAt = performance.now();
    this.lastPose = REST_TOY;
    this.lastBody = this.squish?.viewportFollowOffset() ?? { x: 0, y: 0 };
    this.squish?.setPresentation(REST_TOY);
  }
  private advancePresentation(delta: number): void {
    const squish = this.squish;
    if (!squish) return;
    const sample = squish.metricsSample(), body = squish.viewportFollowOffset();
    // Phaser smooths/clamps delta on slow frames. Idle delay is elapsed quiet
    // time, while spring integration and inclusion damping retain that delta.
    const now = performance.now(), elapsed = Math.max(0, now - this.lastPresentationAt);
    this.lastPresentationAt = now;
    const enabled = (this.stage === 'squeeze' || this.stage === 'finish') && !this.blocked && !this.reducedMotion.matches;
    if (enabled && !sample.active && elapsed < 1000) this.quietMs += elapsed;
    else this.quietMs = 0;
    if (!enabled) this.personality.cancel();
    this.extras = enabled ? this.personality.sample(now, sample.active, sample.stroking, sample.stretch) : { surprise: 0, blink: 0 };
    const release = this.personality.releasePose(now);
    this.pose = enabled && !sample.active ? release !== REST_TOY ? release : sample.maxDisplacement < .025 ? idleToyPose(this.quietMs) : REST_TOY : REST_TOY;
    this.lag = enabled ? { x: inclusionLag(this.lag.x, body.x - this.lastBody.x + (this.pose.rotation - this.lastPose.rotation) * .25, delta), y: inclusionLag(this.lag.y, body.y - this.lastBody.y + this.pose.y - this.lastPose.y, delta) } : { x: 0, y: 0 };
    this.lastBody = body; this.lastPose = this.pose;
    const drift = this.inclusionOffset();
    squish.setPresentation(this.pose, drift.x, drift.y);
    this.canvas.dataset.toyIdle = this.pose.kind;
    this.canvas.dataset.toyRotation = this.pose.rotation.toFixed(4);
    this.canvas.dataset.toySkew = this.pose.skew.toFixed(4);
  }
  private readonly frameTimes: number[] = [];
  private readonly resizeObserver: ResizeObserver;

  public constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly onMetrics: (metrics: SquishMetrics) => void,
    private readonly audio: SquishyAudio,
    private readonly callbacks: PhaserSandboxCallbacks,
    private readonly volumeProfile = true,
  ) {
    this.appearanceSnapshot.width = 256;
    this.appearanceSnapshot.height = 256;
    const context = this.appearanceSnapshot.getContext('2d');
    if (!context) throw new Error('Phaser studio appearance cache requires Canvas2D.');
    this.appearanceContext = context;
    this.faceSnapshot.width = 256;
    this.faceSnapshot.height = 256;
    const faceContext = this.faceSnapshot.getContext('2d');
    if (!faceContext) throw new Error('Phaser studio face cache requires Canvas2D.');
    this.faceContext = faceContext;
    const gl = canvas.getContext('webgl2', {
      alpha: true, antialias: true, depth: true, stencil: true,
      premultipliedAlpha: true, powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('Phaser studio requires WebGL2.');
    this.gl = gl;
    const owner = this;
    class StudioScene extends Phaser.Scene {
      constructor() { super({ key: 'SquishyRealStudioScene' }); }
      create(): void {
        if (owner.disposed) return;
        owner.scene = this;
        const squish = new PhaserSquishCandidate(this, gl!, owner.volumeProfile);
        owner.squish = squish;
        this.add.existing(squish);
        owner.bridge = new PhaserStudioGestureBridge(this, canvas, {
          pointToUv: (x, y) => squish.pointToUv(x, y),
          paintPointToUv: (x, y) => squish.pointToAppearanceUv(x, y),
          beginSecondSquish: (pointer) => squish.beginAt(pointer.id, pointer.x, pointer.y),
          beginSquish: (pointer) => {
            const claimed = squish.beginAt(pointer.id, pointer.x, pointer.y);
            if (claimed) { owner.resetPresentation(); owner.personality.begin(performance.now(), pointer.inputTime); void owner.audio.prime(); owner.callbacks.onSquishBegin?.(); }
            return claimed;
          },
          moveSquish: (pointer) => squish.moveAt(pointer.id, pointer.x, pointer.y),
          endSquish: (pointerId, inputTime) => {
            squish.endById(pointerId);
            owner.resetPresentation();
            if (squish.metricsSample().active) return;
            const energy = squish.snapshot().releaseEnergy;
            owner.personality.release(performance.now(), energy, inputTime);
            owner.audio.releaseTactile(energy);
            owner.callbacks.onSquishRelease?.(energy);
          },
          cancelSquish: () => { owner.personality.cancel(); owner.resetPresentation(); squish.cancel(); owner.audio.releaseTactile(); owner.callbacks.onSquishCancel?.(); },
          paintStamp: (point) => owner.callbacks.paintStamp(point),
          paintSegment: (from, to) => owner.callbacks.paintSegment(from, to),
          paintEnd: () => owner.callbacks.paintEnd(),
          addMixin: (point) => owner.callbacks.addMixin(point),
          addSticker: (point) => owner.callbacks.addSticker(point),
          ...(owner.callbacks.previewSticker ? { previewSticker: (point: AppearancePoint | null) => owner.callbacks.previewSticker?.(point) } : {}),
          mixProgress: (distance, progress) => owner.callbacks.mixProgress(distance, progress),
        });
        owner.syncCanvasSize();
        owner.applyPending();
        canvas.dataset.phaserReady = 'true';
        if (owner.volumeProfile) canvas.dataset.phaserVolume = 'deformable';
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => owner.cleanupScene());
        this.events.once(Phaser.Scenes.Events.DESTROY, () => owner.cleanupScene());
      }
      override update(_time: number, delta: number): void {
        if (owner.disposed || !owner.squish) return;
        owner.squish.advance(delta, performance.now());
        owner.advancePresentation(delta);
        owner.publishMetrics(delta);
        owner.callbacks.onFrame();
      }
    }
    let game: Phaser.Game | null = null;
    let resizeObserver: ResizeObserver | null = null;
    try {
      game = new Phaser.Game({
        type: Phaser.WEBGL, parent: canvas.parentElement, canvas,
        context: gl as unknown as CanvasRenderingContext2D,
        width: Math.max(1, canvas.clientWidth), height: Math.max(1, canvas.clientHeight),
        transparent: true, scale: { mode: Phaser.Scale.NONE },
        render: { antialias: true, premultipliedAlpha: true },
        input: { activePointers: 2 },
        audio: { noAudio: true }, scene: [StudioScene],
      });
      this.game = game;
      // The stage's responsive CSS owns the displayed square playfield. Phaser's
      // RESIZE mode instead follows the taller parent and vertically squashes art.
      resizeObserver = new ResizeObserver(() => this.syncCanvasSize());
      this.resizeObserver = resizeObserver;
      resizeObserver.observe(canvas);
    } catch (error: unknown) {
      resizeObserver?.disconnect();
      game?.destroy(true);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      throw error;
    }
  }

  /** Keep the WebGL backbuffer and simulation projection in the CSS playfield's aspect ratio. */
  private syncCanvasSize(): void {
    if (this.disposed || !this.scene) return;
    const rect = this.canvas.getBoundingClientRect();
    const style = getComputedStyle(this.canvas);
    const cssRatio = Number.parseFloat(style.getPropertyValue('--squish-radius-ratio'));
    const cssCenterOffsetY = Number.parseFloat(style.getPropertyValue('--squish-center-offset-y'));
    this.squish?.setRenderRadiusRatio(Number.isFinite(cssRatio) ? cssRatio : 0.34);
    this.squish?.setRenderCenterOffsetY(Number.isFinite(cssCenterOffsetY) ? cssCenterOffsetY : 0);
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (this.game.scale.width !== width || this.game.scale.height !== height) {
      this.game.scale.resize(width, height);
    }
  }

  private applyPending(): void {
    const squish = this.squish;
    if (!squish) return;
    squish.setShape(this.shape.id);
    if (this.material) squish.setMaterialStyle(this.material);
    squish.setFillingAmount(this.fillingAmount);
    squish.setFillingStyle(this.fillingStyle);
    squish.setFillProgress(this.fillProgress);
    squish.setMoldProgress(this.moldProgress);
    squish.setWireframe(this.wireframe);
    squish.setViewportFollowEnabled(this.stage === 'finish' || this.stage === 'squeeze');
    squish.setPokeEnabled(this.stage === 'squeeze' || this.stage === 'finish');
    if (this.appearanceDefined) squish.setAppearanceCanvas(this.appearance);
    if (this.faceDefined) squish.setFaceCanvas(this.face);
    squish.setInclusionCanvas(this.inclusion);
    this.bridge?.setStage(this.stage, this.decorSection);
    this.bridge?.setBlocked(this.blocked);
    if ((this.stage === 'squeeze' || this.stage === 'finish') && !this.blocked && !this.reducedMotion.matches) this.personality.greet(performance.now());
  }

  public setShape(shape: ShapeDefinition): void {
    this.bridge?.cancel();
    this.shape = shape;
    this.squish?.setShape(shape.id);
  }
  public setMaterial(style: SquishMaterialStyle): void { this.material = style; this.squish?.setMaterialStyle(style); }
  public setFillingAmount(value: number): void { this.fillingAmount = value; this.squish?.setFillingAmount(value); }
  public setFillingStyle(value: SquishFillingStyle): void { this.fillingStyle = value; this.squish?.setFillingStyle(value); }
  public setFillProgress(value: number): void { this.fillProgress = value; this.squish?.setFillProgress(value); }
  public setMoldProgress(value: number): void { this.moldProgress = value; this.squish?.setMoldProgress(value); }
  public setWireframe(value: boolean): void { this.wireframe = value; this.squish?.setWireframe(value); }
  public setMuted(value: boolean): void { this.muted = value; this.audio.setMuted(value); }
  /** StageGestureRouter owns all Phaser input, including Paint when squish interaction is disabled. */
  public setInteractive(_enabled: boolean): void { /* The old raw-renderer interaction gate is not a Phaser stage. */ }
  public setStudioStage(stage: StudioGestureStage, section: StudioDecorSection): void {
    const enteredSqueeze = stage !== this.stage && stage === 'squeeze';
    if (stage !== this.stage) {
      this.personality.cancel();
      this.resetPresentation();
      // A new Studio scene must start from its own centered presentation, even
      // if the player saved immediately after a far Finish drag.
      this.bridge?.cancel();
      this.squish?.recenterViewportFollow();
    }
    this.stage = stage;
    this.decorSection = section;
    this.squish?.setViewportFollowEnabled(stage === 'finish' || stage === 'squeeze');
    this.squish?.setPokeEnabled(stage === 'squeeze' || stage === 'finish');
    this.bridge?.setStage(stage, section);
    if (enteredSqueeze) this.personality.greet(performance.now());
    this.syncCanvasSize();
  }
  public setActivityBlocked(value: boolean): void {
    if (value !== this.blocked) { this.personality.cancel(); this.resetPresentation(); }
    this.blocked = value; this.bridge?.setBlocked(value);
  }
  public resetTiming(): void { this.squish?.resetTiming(); this.frameTimes.length = 0; }
  public primeAudio(): Promise<void> { return this.audio.prime(); }

  public setAppearanceTexture(source: HTMLCanvasElement | null): void {
    this.appearanceDefined = true;
    this.appearanceContext.clearRect(0, 0, 256, 256);
    if (source) this.appearanceContext.drawImage(source, 0, 0, 256, 256);
    this.appearance = source ? this.appearanceSnapshot : null;
    this.squish?.setAppearanceCanvas(this.appearance);
  }

  public setInclusionTexture(source: HTMLCanvasElement | null): void {
    this.inclusion = source;
    this.squish?.setInclusionCanvas(source);
  }

  public setFaceTexture(source: HTMLCanvasElement | null): void {
    this.faceDefined = true;
    this.faceContext.clearRect(0, 0, 256, 256);
    if (source) this.faceContext.drawImage(source, 0, 0, 256, 256);
    this.face = source ? this.faceSnapshot : null;
    this.squish?.setFaceCanvas(this.face);
  }

  public clientPointToUv(clientX: number, clientY: number): AppearancePoint | null {
    const rect = this.canvas.getBoundingClientRect();
    const width = this.scene?.scale.width ?? rect.width;
    const height = this.scene?.scale.height ?? rect.height;
    const x = (clientX - rect.left) * width / Math.max(1, rect.width);
    const y = (clientY - rect.top) * height / Math.max(1, rect.height);
    if (this.squish) return this.squish.pointToUv(x, y);
    const radius = Math.max(1, Math.min(width, height) * 0.34);
    const localX = (x - width / 2) / radius;
    const localY = (height / 2 - y) / radius;
    if (!isPointInsideShape(this.shape, localX, localY)) return null;
    return { u: Math.min(1, Math.max(0, localX * 0.5 + 0.5)), v: Math.min(1, Math.max(0, localY * 0.5 + 0.5)) };
  }

  public clientPointToAppearanceUv(clientX: number, clientY: number): AppearancePoint | null {
    const rect = this.canvas.getBoundingClientRect();
    const width = this.scene?.scale.width ?? rect.width;
    const height = this.scene?.scale.height ?? rect.height;
    const x = (clientX - rect.left) * width / Math.max(1, rect.width);
    const y = (clientY - rect.top) * height / Math.max(1, rect.height);
    if (this.squish) return this.squish.pointToAppearanceUv(x, y);
    const ratio = Number.parseFloat(getComputedStyle(this.canvas).getPropertyValue('--squish-radius-ratio'));
    const radius = Math.max(1, Math.min(width, height) * (Number.isFinite(ratio) ? ratio : 0.34));
    const localX = (x - width / 2) / radius;
    const localY = (height / 2 - y) / radius;
    if (Math.abs(localX) > 1 || Math.abs(localY) > 1) return null;
    return { u: Math.min(1, Math.max(0, localX * 0.5 + 0.5)), v: Math.min(1, Math.max(0, localY * 0.5 + 0.5)) };
  }

  public projectUvToCanvas(u: number, v: number): { x: number; y: number } {
    if (this.squish) {
      const projected = this.squish.projectUvToCanvas(u, v);
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: projected.x * rect.width / Math.max(1, this.scene?.scale.width ?? rect.width),
        y: projected.y * rect.height / Math.max(1, this.scene?.scale.height ?? rect.height),
      };
    }
    const rect = this.canvas.getBoundingClientRect();
    const radius = Math.min(rect.width, rect.height) * 0.34;
    return { x: rect.width / 2 + (u * 2 - 1) * radius, y: rect.height / 2 - (v * 2 - 1) * radius };
  }

  private publishMetrics(delta: number): void {
    const squish = this.squish;
    if (!squish) return;
    this.frameTimes.push(delta);
    if (this.frameTimes.length > 180) this.frameTimes.shift();
    const now = performance.now();
    if (now - this.lastMetricsAt < 50) return;
    this.lastMetricsAt = now;
    const values = [...this.frameTimes].sort((a, b) => a - b);
    const recent = this.frameTimes.slice(-30);
    const mean = recent.reduce((sum, value) => sum + value, 0) / Math.max(1, recent.length);
    const sample = squish.metricsSample();
    const bodyOffset = squish.viewportFollowOffset();
    this.canvas.dataset.squishBodyOffsetX = bodyOffset.x.toFixed(3);
    this.canvas.dataset.squishBodyOffsetY = bodyOffset.y.toFixed(3);
    if (sample.active && sample.tactileActive && !this.muted && !this.blocked) {
      this.audio.updateTactile(sample.tactileProgress, sample.normalizedVelocity, sample.stroking, sample.stretch);
    }
    this.onMetrics({
      fps: mean > 0 ? 1000 / mean : 0,
      p95FrameMs: values[Math.floor((values.length - 1) * 0.95)] ?? 0,
      compression: sample.compression,
      pressDepth: sample.pressDepth,
      normalizedVelocity: sample.normalizedVelocity,
      maxDisplacement: sample.maxDisplacement,
      gestureX: sample.gestureX,
      gestureY: sample.gestureY,
      active: sample.active,
      squeezes: sample.squeezes, stretch: sample.stretch, stroking: sample.stroking, pointers: sample.pointers,
    });
  }

  private cleanupScene(): void {
    this.bridge?.dispose();
    this.bridge = null;
    this.squish?.dispose();
    this.squish = null;
    this.scene = null;
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.resizeObserver.disconnect();
    this.cleanupScene();
    this.game.destroy(true);
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    delete this.canvas.dataset.phaserReady;
    delete this.canvas.dataset.phaserVolume;
    delete this.canvas.dataset.squishBodyOffsetX;
    delete this.canvas.dataset.squishBodyOffsetY;
  }
}
