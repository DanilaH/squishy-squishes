import type { MaterialId } from '../game/content';
import { getShape } from '../game/shapes';
import {
  APPEARANCE_TEXTURE_SIZE,
  replayAppearanceDocument,
} from './appearance';
import { drawAccessoryGraphic, getDecorFrame, renderSurfaceDecor } from './decor';
import type { SavedSquishy } from './types';

const THUMBNAIL_SIZE = 256;
const SHAPE_PADDING = 30;

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
  return '#f2dcae';
};

export const renderLibraryThumbnail = (
  canvas: HTMLCanvasElement,
  toy: SavedSquishy,
): void => {
  canvas.width = THUMBNAIL_SIZE;
  canvas.height = THUMBNAIL_SIZE;
  const context = canvas.getContext('2d');
  if (!context) return;

  context.clearRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);

  const shape = getShape(toy.shapeId);
  if (toy.decor.accessory) {
    const frame = getDecorFrame(shape);
    const localX = frame.headAnchor.u * 2 - 1;
    const localY = frame.headAnchor.v * 2 - 1;
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

  const sheen = context.createLinearGradient(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
  sheen.addColorStop(0, 'rgba(255,255,255,0.42)');
  sheen.addColorStop(0.42, 'rgba(255,255,255,0.05)');
  sheen.addColorStop(1, 'rgba(79,55,98,0.08)');
  context.fillStyle = sheen;
  context.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
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
