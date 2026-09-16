import Phaser from 'phaser';

import { PhaserSquishExtern, type SpikeSnapshot } from './PhaserSquishExtern';
import './spike.css';

declare global {
  interface Window {
    __phaserSquishSpike?: {
      snapshot(): SpikeSnapshot;
      destroy(): void;
    };
  }
}

const root = document.querySelector<HTMLElement>('#phaser-spike-root');
if (!root) throw new Error('Missing Phaser spike root');

// Phaser receives the exact WebGL2 context its Extern will draw into.
// No second canvas, offscreen copy or concurrent raw-GL requestAnimationFrame.
const canvas = document.createElement('canvas');
canvas.style.touchAction = 'none';
const initialContext = canvas.getContext('webgl2', {
  alpha: false,
  antialias: true,
  depth: true,
  stencil: true,
  premultipliedAlpha: true,
});
if (!initialContext) {
  root.textContent = 'This experiment needs WebGL2.';
  throw new Error('Phaser squishy spike requires WebGL2');
}
const gl: WebGL2RenderingContext = initialContext;

class SquishSpikeScene extends Phaser.Scene {
  private squish: PhaserSquishExtern | null = null;
  private titleText: Phaser.GameObjects.Text | null = null;
  private hintText: Phaser.GameObjects.Text | null = null;
  private statsText: Phaser.GameObjects.Text | null = null;
  private readonly onBlur = (): void => { this.squish?.cancel(); };
  private readonly onVisibility = (): void => {
    if (document.hidden) this.squish?.cancel();
  };
  private readonly onContextLost = (): void => { this.squish?.forgetLostContext(); };

  public constructor() {
    super({ key: 'SquishSpikeScene' });
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#171225');
    const squish = new PhaserSquishExtern(this, gl);
    this.squish = squish;
    this.add.existing(squish);

    // Render Phaser Text AFTER Extern to detect corrupted shared GL state.
    const font = { fontFamily: 'system-ui, sans-serif', color: '#ffffff' };
    this.titleText = this.add.text(0, 0, 'PHASER 4 · WEBGL2 · EXTERN', {
      ...font, fontSize: '19px', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5, 0);
    this.hintText = this.add.text(0, 0, 'Hold and pull the squishy', {
      ...font, fontSize: '15px', color: '#d5c4ea', align: 'center',
    }).setOrigin(0.5, 1);
    this.statsText = this.add.text(0, 0, '', {
      ...font, fontSize: '13px', color: '#d5c4ea', align: 'center',
    }).setOrigin(0.5, 1);
    this.relayout();
    this.scale.on('resize', this.relayout, this);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!squish.begin(pointer.id, pointer.x, pointer.y)) return;
      const event = pointer.event;
      if (event instanceof PointerEvent) {
        try { canvas.setPointerCapture(event.pointerId); } catch { /* Browser may reject capture. */ }
      }
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      squish.move(pointer.id, pointer.x, pointer.y);
    });
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      squish.end(pointer.id);
    });
    this.input.on('pointerupoutside', (pointer: Phaser.Input.Pointer) => {
      squish.end(pointer.id);
    });
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibility);
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.relayout, this);
      window.removeEventListener('blur', this.onBlur);
      document.removeEventListener('visibilitychange', this.onVisibility);
      canvas.removeEventListener('webglcontextlost', this.onContextLost);
      squish.dispose();
      this.squish = null;
      delete window.__phaserSquishSpike;
    });

    window.__phaserSquishSpike = {
      snapshot: () => squish.snapshot(),
      destroy: () => this.game.destroy(true),
    };
    document.body.dataset.phaserSpike = 'ready';
  }

  public override update(_time: number, delta: number): void {
    const squish = this.squish;
    if (!squish) return;
    squish.advance(delta);
    if (this.statsText) {
      const state = squish.snapshot();
      this.statsText.setText(`Squeezes: ${state.squeezes} · Draws: ${state.drawCalls}`);
    }
  }

  private readonly relayout = (): void => {
    const { width, height } = this.scale;
    this.titleText?.setPosition(width / 2, 20);
    this.hintText?.setPosition(width / 2, height - 42);
    this.statsText?.setPosition(width / 2, height - 17);
  };
}

const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: root,
  canvas,
  // Phaser 4's GameConfig context declaration is 2D-only, while its WebGL renderer
  // accepts an existing GL context. This cast is confined to the isolated spike.
  context: gl as unknown as CanvasRenderingContext2D,
  width: Math.max(320, root.clientWidth),
  height: Math.max(320, root.clientHeight),
  backgroundColor: '#171225',
  scale: { mode: Phaser.Scale.RESIZE },
  render: { antialias: true, premultipliedAlpha: true },
  audio: { noAudio: true },
  scene: [SquishSpikeScene],
});

window.addEventListener('pagehide', (event: PageTransitionEvent) => {
  if (!event.persisted) game.destroy(true);
}, { once: true });
