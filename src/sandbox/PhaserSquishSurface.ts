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
  'paintStamp' | 'paintSegment' | 'paintEnd' | 'addMixin' | 'addSticker' | 'mixProgress'> {
  /** Draw existing DOM decor layers on Phaser's own update tick, not a second RAF. */
  readonly onFrame: () => void;
}

/**
 * Drop-in studio rendering port, used only by the isolated Phaser studio entry.
 * It owns ONE Phaser.Game + WebGL2 context, and the Extern owns the shared
 * SquishSimulation. The original SandboxApp still owns all game documents.
 */
export class PhaserSquishSurface {
  private readonly game: Phaser.Game;
  private scene: Phaser.Scene | null = null;
  private squish: PhaserSquishCandidate | null = null;
  private bridge: PhaserStudioGestureBridge | null = null;
  private shape: ShapeDefinition = getShape('soft-square');
  private material: SquishMaterialStyle | null = null;
  private appearance: HTMLCanvasElement | null = null;
  private readonly appearanceSnapshot = document.createElement('canvas');
  private appearanceContext: CanvasRenderingContext2D;
  private appearanceDefined = false;
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
  private readonly frameTimes: number[] = [];

  public constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly onMetrics: (metrics: SquishMetrics) => void,
    private readonly audio: SquishyAudio,
    private readonly callbacks: PhaserSandboxCallbacks,
  ) {
    this.appearanceSnapshot.width = 256;
    this.appearanceSnapshot.height = 256;
    const context = this.appearanceSnapshot.getContext('2d');
    if (!context) throw new Error('Phaser studio appearance cache requires Canvas2D.');
    this.appearanceContext = context;
    const gl = canvas.getContext('webgl2', {
      alpha: true, antialias: true, depth: true, stencil: true,
      premultipliedAlpha: true, powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('Phaser studio requires WebGL2.');
    const owner = this;
    class StudioScene extends Phaser.Scene {
      constructor() { super({ key: 'SquishyRealStudioScene' }); }
      override create(): void {
        if (owner.disposed) return;
        owner.scene = this;
        const squish = new PhaserSquishCandidate(this, gl!);
        owner.squish = squish;
        this.add.existing(squish);
        owner.bridge = new PhaserStudioGestureBridge(this, canvas, {
          pointToUv: (x, y) => squish.pointToUv(x, y),
          beginSquish: (pointer) => {
            const claimed = squish.begin(pointer);
            if (claimed) void owner.audio.prime();
            return claimed;
          },
          moveSquish: (pointer) => squish.move(pointer),
          endSquish: (pointer) => {
            squish.end(pointer);
            owner.audio.releaseTactile(squish.snapshot().releaseEnergy);
          },
          cancelSquish: () => { squish.cancel(); owner.audio.releaseTactile(); },
          paintStamp: (point) => owner.callbacks.paintStamp(point),
          paintSegment: (from, to) => owner.callbacks.paintSegment(from, to),
          paintEnd: () => owner.callbacks.paintEnd(),
          addMixin: (point) => owner.callbacks.addMixin(point),
          addSticker: (point) => owner.callbacks.addSticker(point),
          mixProgress: (distance, progress) => owner.callbacks.mixProgress(distance, progress),
        });
        owner.applyPending();
        canvas.dataset.phaserReady = 'true';
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => owner.cleanupScene());
        this.events.once(Phaser.Scenes.Events.DESTROY, () => owner.cleanupScene());
      }
      override update(_time: number, delta: number): void {
        if (owner.disposed || !owner.squish) return;
        owner.squish.advance(delta, performance.now());
        owner.publishMetrics(delta);
        owner.callbacks.onFrame();
      }
    }
    this.game = new Phaser.Game({
      type: Phaser.WEBGL, parent: canvas.parentElement ?? undefined, canvas,
      context: gl as unknown as CanvasRenderingContext2D,
      width: Math.max(1, canvas.clientWidth), height: Math.max(1, canvas.clientHeight),
      transparent: true, scale: { mode: Phaser.Scale.RESIZE },
      render: { antialias: true, premultipliedAlpha: true },
      audio: { noAudio: true }, scene: [StudioScene],
    });
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
    if (this.appearanceDefined) squish.setAppearanceCanvas(this.appearance);
    this.bridge?.setStage(this.stage, this.decorSection);
    this.bridge?.setBlocked(this.blocked);
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
    this.stage = stage;
    this.decorSection = section;
    this.bridge?.setStage(stage, section);
  }
  public setActivityBlocked(value: boolean): void { this.blocked = value; this.bridge?.setBlocked(value); }
  public resetTiming(): void { this.squish?.resetTiming(); this.frameTimes.length = 0; }
  public primeAudio(): Promise<void> { return this.audio.prime(); }

  public setAppearanceTexture(source: HTMLCanvasElement | null): void {
    this.appearanceDefined = true;
    this.appearanceContext.clearRect(0, 0, 256, 256);
    if (source) this.appearanceContext.drawImage(source, 0, 0, 256, 256);
    this.appearance = source ? this.appearanceSnapshot : null;
    this.squish?.setAppearanceCanvas(this.appearance);
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
    if (sample.active && sample.tactileActive && !this.muted) {
      this.audio.updateTactile(sample.tactileProgress, sample.normalizedVelocity);
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
      squeezes: sample.squeezes,
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
    this.cleanupScene();
    this.game.destroy(true);
    delete this.canvas.dataset.phaserReady;
  }
}
