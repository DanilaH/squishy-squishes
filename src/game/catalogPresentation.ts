import type { GameCopy } from '../i18n';

const asStringRecord = (value: object): Readonly<Record<string, string>> => value as Readonly<Record<string, string>>;

export const getRecipeDisplayLabel = (copy: GameCopy, id: string, fallback: string): string => (
  asStringRecord(copy.catalog.recipes)[id] ?? fallback
);

export const getShapeDisplayLabel = (copy: GameCopy, id: string, fallback: string): string => (
  asStringRecord(copy.catalog.shapes)[id] ?? fallback
);
