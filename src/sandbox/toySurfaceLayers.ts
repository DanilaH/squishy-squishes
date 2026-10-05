import { MIXIN_IDS, replayAppearanceDocument, type AppearanceDocumentV1 } from './appearance';
import { renderSurfaceFace, renderSurfaceStickers, type DecorDocumentV1 } from './decor';
import { drawShapeRelief } from './shapeRelief';
import { getShape, type ShapeId } from '../game/shapes';
import type { MaterialId } from '../game/content';
import { REST_FACE, type FaceReaction } from './toyReactions';

/** Authoring data stays V1. Every production scene uses these same three layers. */
export const renderToyPigment = (context: CanvasRenderingContext2D, appearance: AppearanceDocumentV1, materialId: MaterialId, shapeId: ShapeId): void => {
  replayAppearanceDocument(context, appearance, { materialId, shapeId, excludeMixIns: MIXIN_IDS, excludeRelief: true });
};
export const renderToyInclusions = (context: CanvasRenderingContext2D, appearance: AppearanceDocumentV1, materialId: MaterialId): void => {
  context.save();
  context.globalAlpha = materialId === 'chrome' ? .42 : 1;
  replayAppearanceDocument(context, { ...appearance, strokes: [] }, { materialId, excludeRelief: true });
  context.restore();
};
export const renderToyInk = (context: CanvasRenderingContext2D, decor: DecorDocumentV1, shapeId: ShapeId, reaction: FaceReaction = REST_FACE): void => {
  context.clearRect(0, 0, 256, 256);
  drawShapeRelief(context, shapeId);
  renderSurfaceStickers(context, decor, getShape(shapeId));
  renderSurfaceFace(context, decor, getShape(shapeId), reaction);
};
