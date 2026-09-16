import Phaser from 'phaser';
import { getMaterial, getPalette, type MaterialId } from '../../game/content';
import { getShape, type ShapeId } from '../../game/shapes';
import { SquishyAudio } from '../../game/SquishyAudio';
import { createAppearanceStroke, replayAppearanceDocument, type AppearanceDocumentV1 } from '../../sandbox/appearance';
import { createStickerPlacement, renderSurfaceDecor, type DecorDocumentV1 } from '../../sandbox/decor';
import { SquishSurface, type SquishFillingStyle, type SquishMaterialStyle } from '../../squish/SquishSurface';
import { PhaserSquishCandidate } from './PhaserSquishCandidate';
import './parity.css';

type Fixture = 'base' | 'paint' | 'decor' | 'foam' | 'pearl' | 'holo' | 'heart';

declare global {
  interface Window {
    __squishyParity?: { readonly ready: boolean; fixture(kind: Fixture): void; destroy(): void };
  }
}

// This page exists solely to compare *actual* browser output. It is excluded
// from the default Pages and Yandex builds and does not contain production UI.
const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Parity fixture root missing');
root.innerHTML = `
  <main class="parity-shell" data-parity="loading">
    <h1>WebGL → Phaser · original renderer comparison</h1>
    <p>Test-only fixture. Both canvases receive the same original shape, GLSL, material and appearance documents.</p>
    <div class="parity-grid">
      <section><h2>Original WebGL</h2><canvas id="parity-old" width="420" height="420"></canvas></section>
      <section><h2>Phaser 4 Extern</h2><div id="parity-new"></div></section>
    </div>
    <p data-parity-status>Starting both renderers…</p>
  </main>
`;
const shell = root.querySelector<HTMLElement>('[data-parity]')!;
const oldCanvas = root.querySelector<HTMLCanvasElement>('#parity-old')!;
const newHost = root.querySelector<HTMLElement>('#parity-new')!;
const status = root.querySelector<HTMLElement>('[data-parity-status]')!;
const audio = new SquishyAudio();
const old = new SquishSurface(oldCanvas, () => {}, audio);
old.setMuted(true);
old.setInteractive(false);

const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2', {
  alpha: true,
  antialias: true,
  depth: true,
  stencil: true,
  premultipliedAlpha: true,
  preserveDrawingBuffer: true, // Test-only pixel evidence, never the shipping renderer.
});
if (!gl) {
  old.dispose();
  audio.dispose();
  shell.dataset.parity = 'unsupported';
  status.textContent = 'WebGL2 is unavailable';
  throw new Error('WebGL2 parity fixture requires WebGL2');
}
const appearanceCanvas = document.createElement('canvas');
appearanceCanvas.width = 256;
appearanceCanvas.height = 256;
const appearanceContext = appearanceCanvas.getContext('2d');
if (!appearanceContext) throw new Error('Cannot allocate appearance fixture');

const styleFor = (materialId: MaterialId): SquishMaterialStyle => {
  const palette = getPalette('milk');
  const material = getMaterial(materialId);
  return {
    low: palette.low, high: palette.high, sheen: palette.sheen, rim: palette.rim, seed: palette.seed,
    translucency: material.translucency, iridescence: material.iridescence,
    roughness: material.roughness, metallic: material.metallic,
    pearlescence: material.pearlescence, cloudiness: material.cloudiness,
  };
};
let game: Phaser.Game | null = null;
let squish: PhaserSquishCandidate | null = null;
let destroyed = false;

const destroy = (): void => {
  if (destroyed) return;
  destroyed = true;
  squish?.dispose();
  squish = null;
  game?.destroy(true);
  old.dispose();
  audio.dispose();
  canvas.remove();
  shell.dataset.parity = 'destroyed';
  delete window.__squishyParity;
};

const fixture = (kind: Fixture): void => {
  if (!squish || destroyed) throw new Error('Parity renderer is not ready');
  const shapeId: ShapeId = kind === 'heart' ? 'heart' : 'soft-square';
  const materialId: MaterialId = kind === 'holo' ? 'holo' : 'soft';
  const fillingStyle: SquishFillingStyle = kind === 'foam' || kind === 'pearl' ? kind : 'none';
  const amount = fillingStyle === 'none' ? 0 : 0.85;
  const progress = fillingStyle === 'none' ? 1 : 0.78;
  const appearance: AppearanceDocumentV1 = kind === 'paint' ? {
    v: 1,
    strokes: [createAppearanceStroke(0, 0xff1764, 74, [
      { u: 0.35, v: 0.43 }, { u: 0.52, v: 0.5 }, { u: 0.67, v: 0.56 },
    ])],
    mixins: [],
  } : { v: 1, strokes: [], mixins: [] };
  const decor: DecorDocumentV1 = kind === 'decor' ? {
    v: 1, eyes: 'happy', mouth: 'smile', blush: true,
    stickers: [createStickerPlacement('star', { u: 0.67, v: 0.36 }, 0)], accessory: null,
  } : { v: 1, eyes: null, mouth: null, blush: false, stickers: [], accessory: null };

  old.setShape(getShape(shapeId));
  // Diagnostic only: Phaser may retain a WebGL pixel-store flip from its own texture uploads.
  // The original raw renderer uploads the shape-field bytes with the default flip disabled.
  const previousFlip = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL) as boolean;
  shell.dataset.unpackFlipBeforeShape = String(previousFlip);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  squish.setShape(shapeId);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, previousFlip ? 1 : 0);
  old.setMaterial(styleFor(materialId));
  squish.setMaterial(materialId);
  squish.setPalette('milk');
  old.setMoldProgress(1);
  squish.setMoldProgress(1);
  old.setFillingAmount(amount);
  squish.setFillingAmount(amount);
  old.setFillingStyle(fillingStyle);
  squish.setFillingStyle(fillingStyle);
  old.setFillProgress(progress);
  squish.setFillProgress(progress);
  old.setWireframe(false);
  squish.setWireframe(false);
  if (kind === 'paint' || kind === 'decor') {
    replayAppearanceDocument(appearanceContext, appearance);
    renderSurfaceDecor(appearanceContext, decor, getShape(shapeId));
    old.setAppearanceTexture(appearanceCanvas);
    squish.setAppearanceDocuments(appearance, decor);
  } else {
    old.setAppearanceTexture(null);
    squish.setAppearanceDocuments(null, null);
  }
  shell.dataset.parityFixture = kind;
};

class ParityScene extends Phaser.Scene {
  constructor() { super({ key: 'ParityScene' }); }
  create(): void {
    squish = new PhaserSquishCandidate(this, gl!);
    this.add.existing(squish);
    fixture('base');
    shell.dataset.parity = 'ready';
    status.textContent = 'Both renderers ready; compare matching 420×420 canvas screenshots.';
    window.__squishyParity = { ready: true, fixture, destroy };
  }
  override update(_time: number, delta: number): void {
    squish?.advance(delta, performance.now());
  }
}

game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: newHost,
  canvas,
  context: gl as unknown as CanvasRenderingContext2D, // Phaser 4 GameConfig incorrectly types context as 2D.
  width: 420,
  height: 420,
  transparent: true,
  scale: { mode: Phaser.Scale.RESIZE },
  render: { antialias: true, premultipliedAlpha: true },
  audio: { noAudio: true },
  scene: [ParityScene],
});
window.addEventListener('pagehide', () => destroy(), { once: true });
