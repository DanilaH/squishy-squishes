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

// Opt-in only for the isolated Phaser Pages entry. Ordinary/Yandex cards
// retain their existing pixels and the same saved V3 document representation.
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

/** A single deterministic Canvas2D approximation of the Studio's material
 * response. A broad off-axis light, shape-following soft rim and darkened
 * bottom/right are drawn inside the existing silhouette: NO live per-toy GPU
 * contexts, new saves or shader-parity claim. Lighting is material-specific. */
const paintPreviewVolume = (context: CanvasRenderingContext2D, toy: SavedSquishy): void => {
  const material = getMaterial(toy.materialId);
  const isJelly = toy.materialId === 'jelly';
  const dark = isJelly ? '35,119,127' : toy.materialId === 'marshmallow' ? '113,88,96' : '68,41,76';
  const edgeStrength = Math.min(0.46, 0.36 + material.translucency * 0.07 + material.metallic * 0.035 - material.cloudiness * 0.11);

  // Convex diffuse falloff: center stays close to the saved paint, edge and
  // underside lose light. Unlike a diagonal opacity gradient, this follows
  // curved silhouettes including the heart's lobes when clipped below.
  const shade = context.createRadialGradient(96, 70, 3, 96, 70, 167);
  shade.addColorStop(0, `rgba(${dark},0)`);
  shade.addColorStop(0.37, `rgba(${dark},0)`);
  shade.addColorStop(0.61, `rgba(${dark},${(edgeStrength * 0.21).toFixed(3)})`);
  shade.addColorStop(0.80, `rgba(${dark},${(edgeStrength * 0.54).toFixed(3)})`);
  shade.addColorStop(1, `rgba(${dark},${edgeStrength.toFixed(3)})`);
  context.fillStyle = shade;
  context.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);

  // Diffuse curved reflection; high roughness softens rather than sharpening it.
  const highlightStrength = 0.20 + (1 - material.roughness) * 0.21 + material.pearlescence * 0.035;
  context.save();
  context.translate(85, 65);
  context.rotate(-0.34);
  context.scale(1.10, 0.66);
  const highlight = context.createRadialGradient(0, 0, 3, 0, 0, 95);
  highlight.addColorStop(0, `rgba(255,255,255,${highlightStrength.toFixed(3)})`);
  highlight.addColorStop(0.49, `rgba(255,255,255,${(highlightStrength * 0.40).toFixed(3)})`);
  highlight.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = highlight;
  context.fillRect(-110, -110, 220, 220);
  context.restore();

  // A bounded edge reflection helps the body read as a rounded object.
  // The pre-existing outer outline remains unchanged and masks the outer half.
  context.save();
  buildShapePath(context, toy, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
  const edgeLight = context.createLinearGradient(0, 24, 0, 165);
  const rimStrength = 0.18 + material.translucency * 0.13 + material.pearlescence * 0.04 - material.roughness * 0.09;
  edgeLight.addColorStop(0, `rgba(255,255,255,${rimStrength.toFixed(3)})`);
  edgeLight.addColorStop(0.52, `rgba(255,255,255,${(rimStrength * 0.28).toFixed(3)})`);
  edgeLight.addColorStop(1, 'rgba(255,255,255,0)');
  context.strokeStyle = edgeLight;
  context.lineWidth = 12;
  context.stroke();
  context.restore();

  // Soft bounce under the body, so jelly stays luminous and chrome not muddy.
  const bounce = context.createLinearGradient(0, 115, 0, THUMBNAIL_SIZE);
  bounce.addColorStop(0, 'rgba(255,255,255,0)');
  bounce.addColorStop(0.73, 'rgba(255,255,255,0)');
  bounce.addColorStop(1, `rgba(255,238,228,${(0.05 + material.translucency * 0.07).toFixed(3)})`);
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
    paintPreviewVolume(context, toy);
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
