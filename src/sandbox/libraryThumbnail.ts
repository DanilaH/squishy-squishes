import { getMaterial, type MaterialId } from '../game/content';
import { getShape } from '../game/shapes';
import {
  APPEARANCE_TEXTURE_SIZE,
  replayAppearanceDocument,
} from './appearance';
import { drawAccessoryGraphic, getDecorFrame, renderSurfaceDecor } from './decor';
import type { SavedSquishy } from './types';

const THUMBNAIL_SIZE = 256;
const SHAPE_PADDING = 30;

// Only the isolated Pages entry opts in. Normal/Yandex thumbnails keep their
// previous render path and save format; no per-card WebGL context is created.
let pagesMaterialLighting = false;
export const enablePagesLibraryMaterialLighting = (): void => { pagesMaterialLighting = true; };

const buildShapePath = (
  context: CanvasRenderingContext2D,
  toy: SavedSquishy,
  width: number,
  height: number,
): void => {
  const shape = getShape(toy.shapeId);
  const centerX = width * 0.5;
  const centerY = height * 0.5;
  const scale = Math.min(width, height) * 0.5 - SHAPE_PADDING;
  context.beginPath();
  shape.boundary.forEach((point, index) => {
    const x = centerX + point.x * scale;
    const y = centerY - point.y * scale;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.closePath();
};

const materialBase = (
  context: CanvasRenderingContext2D,
  materialId: MaterialId,
  width: number,
  height: number,
): CanvasGradient | string => {
  if (materialId === 'holo') {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f7b8e5');
    gradient.addColorStop(0.34, '#b8ebff');
    gradient.addColorStop(0.67, '#d8c0ff');
    gradient.addColorStop(1, '#fff0a8');
    return gradient;
  }
  if (materialId === 'jelly') return 'rgba(139, 229, 222, 0.76)';
  if (materialId === 'marshmallow') return '#f8eee5';
  if (materialId === 'pearl') {
    const gradient = context.createLinearGradient(0, height, width, 0);
    gradient.addColorStop(0, '#e9d7f4');
    gradient.addColorStop(0.45, '#fff6e8');
    gradient.addColorStop(0.72, '#d8f2ee');
    gradient.addColorStop(1, '#f5d9e8');
    return gradient;
  }
  if (materialId === 'chrome') {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f8fbff');
    gradient.addColorStop(0.22, '#6d7480');
    gradient.addColorStop(0.46, '#fdfefe');
    gradient.addColorStop(0.67, '#474e58');
    gradient.addColorStop(1, '#dce3eb');
    return gradient;
  }
  return '#f2dcae';
};

/** Shape-clipped, material-specific light for the static Library preview.
 * This is NOT a claim of WebGL shader parity: it is a bounded Canvas2D approximation
 * which preserves the actual painted/sticker appearance and existing save schema. */
const paintPreviewVolume = (context: CanvasRenderingContext2D, materialId: MaterialId): void => {
  const material = getMaterial(materialId);
  const edgeStrength = Math.min(0.38, 0.19 + material.translucency * 0.07 + material.metallic * 0.12 - material.cloudiness * 0.03);
  const edge = context.createRadialGradient(101, 73, 20, 137, 125, 155);
  edge.addColorStop(0, 'rgba(44,30,59,0)');
  edge.addColorStop(0.54, 'rgba(44,30,59,0)');
  edge.addColorStop(0.81, `rgba(44,30,59,${(edgeStrength * 0.35).toFixed(3)})`);
  edge.addColorStop(1, `rgba(44,30,59,${edgeStrength.toFixed(3)})`);
  context.fillStyle = edge;
  context.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);

  // A broad off-centre reflection reads as a soft curved body, not a plastic spot.
  // Rough marshmallow has a diffuse lift; jelly/pearl/chrome receive clearer light.
  const highlightStrength = 0.12 + (1 - material.roughness) * 0.16 + material.pearlescence * 0.035;
  context.save();
  context.translate(94, 73);
  context.rotate(-0.38);
  context.scale(1.1, 0.62);
  const highlight = context.createRadialGradient(0, 0, 3, 0, 0, 90);
  highlight.addColorStop(0, `rgba(255,255,255,${highlightStrength.toFixed(3)})`);
  highlight.addColorStop(0.45, `rgba(255,255,255,${(highlightStrength * 0.47).toFixed(3)})`);
  highlight.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = highlight;
  context.fillRect(-100, -100, 200, 200);
  context.restore();

  // Avoid black chrome and milky jelly: material profile controls the lower bounce.
  const bounce = context.createLinearGradient(0, 115, 0, THUMBNAIL_SIZE);
  bounce.addColorStop(0, 'rgba(255,255,255,0)');
  bounce.addColorStop(0.74, 'rgba(255,255,255,0)');
  bounce.addColorStop(1, `rgba(255,238,228,${(0.035 + material.translucency * 0.06).toFixed(3)})`);
  context.fillStyle = bounce;
  context.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
};

export const renderLibraryThumbnail = (
  canvas: HTMLCanvasElement,
  toy: SavedSquishy,
): void => {
  canvas.width = THUMBNAIL_SIZE;
  canvas.height = THUMBNAIL_SIZE;
  const context = canvas.getContext('2d');
  if (!context) return;
  if (pagesMaterialLighting) canvas.dataset.libraryMaterialProfile = toy.materialId;

  context.clearRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);

  const shape = getShape(toy.shapeId);
  if (toy.decor.accessory) {
    const frame = getDecorFrame(shape);
    const localX = frame.headAnchor.u * 2 - 1;
    const localY = (frame.headAnchor.v + frame.headSeatOffsetV) * 2 - 1;
    const scale = Math.min(THUMBNAIL_SIZE, THUMBNAIL_SIZE) * 0.5 - SHAPE_PADDING;
    const anchorX = THUMBNAIL_SIZE * 0.5 + localX * scale;
    const anchorY = THUMBNAIL_SIZE * 0.5 - localY * scale;
    const accessoryCanvas = document.createElement('canvas');
    accessoryCanvas.width = 180;
    accessoryCanvas.height = 120;
    const accessoryContext = accessoryCanvas.getContext('2d');
    if (accessoryContext) {
      drawAccessoryGraphic(accessoryContext, toy.decor.accessory, 180, 120);
      const drawWidth = 112;
      const drawHeight = 75;
      context.drawImage(accessoryCanvas, anchorX - drawWidth * 0.5, anchorY - drawHeight * 0.9, drawWidth, drawHeight);
    }
  }

  context.save();
  context.shadowColor = 'rgba(69, 47, 89, 0.18)';
  context.shadowBlur = 18;
  context.shadowOffsetY = 10;
  buildShapePath(context, toy, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
  context.fillStyle = materialBase(context, toy.materialId, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
  context.fill();
  context.restore();

  context.save();
  buildShapePath(context, toy, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
  context.clip();

  context.fillStyle = materialBase(context, toy.materialId, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
  context.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);

  const appearanceCanvas = document.createElement('canvas');
  appearanceCanvas.width = APPEARANCE_TEXTURE_SIZE;
  appearanceCanvas.height = APPEARANCE_TEXTURE_SIZE;
  const appearanceContext = appearanceCanvas.getContext('2d');
  if (appearanceContext) {
    replayAppearanceDocument(appearanceContext, toy.appearance);
    renderSurfaceDecor(appearanceContext, toy.decor, shape);
    context.drawImage(appearanceCanvas, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
  }

  if (pagesMaterialLighting) {
    paintPreviewVolume(context, toy.materialId);
  } else {
    const sheen = context.createLinearGradient(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
    sheen.addColorStop(0, 'rgba(255,255,255,0.42)');
    sheen.addColorStop(0.42, 'rgba(255,255,255,0.05)');
    sheen.addColorStop(1, 'rgba(79,55,98,0.08)');
    context.fillStyle = sheen;
    context.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
  }
  context.restore();

  context.save();
  buildShapePath(context, toy, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
  context.lineWidth = 4;
  context.strokeStyle = toy.materialId === 'jelly'
    ? 'rgba(66, 159, 161, 0.38)'
    : 'rgba(118, 80, 141, 0.22)';
  context.stroke();
  context.restore();
};
