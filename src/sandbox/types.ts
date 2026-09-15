import type { MaterialId } from '../game/content';
import type { ShapeId } from '../game/shapes';
import type { AppearanceDocumentV1 } from './appearance';

export interface SavedSquishy {
  readonly id: string;
  readonly createdAt: number;
  readonly shapeId: ShapeId;
  readonly materialId: MaterialId;
  readonly appearance: AppearanceDocumentV1;
}

export interface SandboxDraft {
  readonly shapeId: ShapeId;
  readonly materialId: MaterialId;
  readonly appearance: AppearanceDocumentV1;
}

export const createSandboxDraft = (): SandboxDraft => ({
  shapeId: 'soft-square',
  materialId: 'soft',
  appearance: { v: 1, strokes: [], mixins: [] },
});
