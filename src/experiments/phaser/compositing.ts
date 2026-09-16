import Phaser from 'phaser';
import { PhaserSquishCandidate } from './PhaserSquishCandidate';

declare global {
  interface Window {
    __squishyCompositing?: {
      snapshot(): { readonly draws: number; readonly renderer: string; readonly glError: number; readonly canvasCount: number };
      setOverlayVisible(visible: boolean): void;
      setShape(id: 'heart' | 'paw'): void;
      destroy(): void;
    };
  }
}

// Isolated GL interoperability probe. Not the studio, a second runtime, or a shipping entry.
const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Missing compositing probe root');
document.head.insertAdjacentHTML('beforeend', `<style>
  body { margin: 0; background: #f3edf6; color: #39243c; font: 16px system-ui, sans-serif; }
  main { padding: 12px; }
  #compositing-stage { width: 420px; height: 420px; position: relative; background: #efe5f4; }
  #compositing-stage canvas { display: block; width: 420px; height: 420px; }
</style>`);
root.innerHTML = `<main data-compositing="loading"><h1>Phaser / Extern GL state gate</h1>
  <div id="compositing-stage" aria-label="Phaser objects before and after Squish Extern"></div>
  <p data-compositing-status>Initializing one WebGL2 scene…</p></main>`;
const shell = root.querySelector<HTMLElement>('[data-compositing]')!;
const host = root.querySelector<HTMLElement>('#compositing-stage')!;
const status = root.querySelector<HTMLElement>('[data-compositing-status]')!;
const canvas = document.createElement('canvas');
canvas.style.touchAction = 'none';
const gl = canvas.getContext('webgl2', {
  alpha: true, antialias: true, depth: true, stencil: true,
  premultipliedAlpha: true,
  preserveDrawingBuffer: true, // Screenshots only; never carry this into production.
});
if (!gl) {
  shell.dataset.compositing = 'unsupported';
  status.textContent = 'WebGL2 unavailable';
  throw new Error('GL composition test requires WebGL2');
}
let game: Phaser.Game | null = null;
let scene: CompositionScene | null = null;
let destroyed = false;

const destroy = (): void => {
  if (destroyed) return;
  destroyed = true;
  scene?.cleanup();
  game?.destroy(true);
  canvas.remove();
  shell.dataset.compositing = 'destroyed';
  delete window.__squishyCompositing;
};

class CompositionScene extends Phaser.Scene {
  private squish: PhaserSquishCandidate | null = null;
  private overlay: Phaser.GameObjects.Rectangle | null = null;
  private cleaned = false;

  constructor() { super({ key: 'SquishGLCompositingScene' }); }

  create(): void {
    scene = this;
    // The first marker is rendered by Phaser *before* the Extern's raw GLSL.
    this.add.rectangle(38, 38, 48, 48, 0xff00ff);
    this.add.text(18, 390, 'BEFORE', { fontSize: '18px', color: '#ffffff' });
    const squish = new PhaserSquishCandidate(this, gl!);
    this.squish = squish;
    this.add.existing(squish);
    // These objects require Phaser to resume after Extern has touched the GL state.
    this.add.rectangle(382, 38, 48, 48, 0x00ff00);
    this.overlay = this.add.rectangle(210, 210, 70, 70, 0xff0000, 0.45);
    this.add.text(300, 390, 'AFTER', { fontSize: '18px', color: '#ffffff' });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
    shell.dataset.compositing = 'ready';
    status.textContent = 'One shared GL context; Phaser → Extern → Phaser';
    window.__squishyCompositing = {
      snapshot: () => ({
        draws: squish.snapshot().drawCalls,
        renderer: squish.snapshot().renderer,
        glError: gl!.getError(),
        canvasCount: host.querySelectorAll('canvas').length,
      }),
      setOverlayVisible: (visible) => this.overlay?.setVisible(visible),
      setShape: (id) => squish.setShape(id),
      destroy,
    };
  }

  override update(_time: number, delta: number): void {
    this.squish?.advance(delta, performance.now());
  }

  cleanup(): void {
    if (this.cleaned) return;
    this.cleaned = true;
    this.squish?.dispose();
    this.squish = null;
    this.overlay = null;
    scene = null;
  }
}

game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: host,
  canvas,
  // Phaser 4's GameConfig context type still claims Canvas2D for WebGL2.
  context: gl as unknown as CanvasRenderingContext2D,
  width: 420,
  height: 420,
  transparent: true,
  scale: { mode: Phaser.Scale.NONE },
  render: { antialias: true, premultipliedAlpha: true },
  audio: { noAudio: true },
  scene: [CompositionScene],
});
window.addEventListener('pagehide', (event: PageTransitionEvent) => {
  if (!event.persisted) destroy();
});
