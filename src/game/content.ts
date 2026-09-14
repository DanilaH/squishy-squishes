import { SHAPES, getShape, type ShapeId } from './shapes';

export type PaletteId = 'grape' | 'strawberry' | 'lime';
export type FillingId = 'smooth' | 'beads';

export type Rgb = readonly [number, number, number];

export interface PaletteSpec {
  readonly id: PaletteId;
  readonly label: string;
  readonly low: Rgb;
  readonly high: Rgb;
  readonly sheen: Rgb;
  readonly rim: Rgb;
  readonly accentCss: string;
  readonly accentSoftCss: string;
  readonly seed: number;
}

export interface FillingSpec {
  readonly id: FillingId;
  readonly label: string;
  readonly description: string;
}

export interface VariantChoice {
  readonly shape: ShapeId;
  readonly palette: PaletteId;
  readonly filling: FillingId;
}

export interface VariantSpec {
  readonly id: string;
  readonly label: string;
  readonly choice: VariantChoice;
}

export const PALETTES: readonly PaletteSpec[] = [
  {
    id: 'grape',
    label: 'Lavender Grape',
    low: [0.39, 0.12, 0.54],
    high: [0.84, 0.48, 0.91],
    sheen: [0.98, 0.86, 1],
    rim: [0.44, 0.22, 0.54],
    accentCss: '#ca8be3',
    accentSoftCss: 'rgba(202, 139, 227, 0.24)',
    seed: 0.17,
  },
  {
    id: 'strawberry',
    label: 'Strawberry Cream',
    low: [0.58, 0.13, 0.29],
    high: [1, 0.59, 0.72],
    sheen: [1, 0.91, 0.94],
    rim: [0.57, 0.2, 0.34],
    accentCss: '#ff92b2',
    accentSoftCss: 'rgba(255, 146, 178, 0.23)',
    seed: 0.49,
  },
  {
    id: 'lime',
    label: 'Lime Mint',
    low: [0.18, 0.49, 0.29],
    high: [0.65, 0.94, 0.62],
    sheen: [0.9, 1, 0.9],
    rim: [0.2, 0.48, 0.3],
    accentCss: '#9ce78e',
    accentSoftCss: 'rgba(156, 231, 142, 0.22)',
    seed: 0.78,
  },
] as const;

export const FILLINGS: readonly FillingSpec[] = [
  { id: 'smooth', label: 'Smooth', description: 'Soft glossy base' },
  { id: 'beads', label: 'Foam Beads', description: 'Crunchy bead filling' },
] as const;

const paletteById: Readonly<Record<PaletteId, PaletteSpec>> = Object.fromEntries(
  PALETTES.map((palette) => [palette.id, palette]),
) as Readonly<Record<PaletteId, PaletteSpec>>;

const fillingById: Readonly<Record<FillingId, FillingSpec>> = Object.fromEntries(
  FILLINGS.map((filling) => [filling.id, filling]),
) as Readonly<Record<FillingId, FillingSpec>>;

export const getPalette = (id: PaletteId): PaletteSpec => paletteById[id];
export const getFilling = (id: FillingId): FillingSpec => fillingById[id];

export const variantId = (choice: VariantChoice): string => {
  const base = `${choice.palette}-${choice.filling}`;
  return choice.shape === 'soft-square' ? base : `${choice.shape}-${base}`;
};

export const variantLabel = (choice: VariantChoice): string => {
  const shape = getShape(choice.shape);
  const palette = getPalette(choice.palette);
  const filling = getFilling(choice.filling);
  return `${shape.label} · ${palette.label} · ${filling.label}`;
};

export const ALL_VARIANTS: readonly VariantSpec[] = SHAPES.flatMap((shape) =>
  PALETTES.flatMap((palette) =>
    FILLINGS.map((filling) => {
      const choice: VariantChoice = { shape: shape.id, palette: palette.id, filling: filling.id };
      return {
        id: variantId(choice),
        label: variantLabel(choice),
        choice,
      } satisfies VariantSpec;
    }),
  ),
);

export const ALL_VARIANT_IDS: readonly string[] = ALL_VARIANTS.map((variant) => variant.id);

const variantById = new Map(ALL_VARIANTS.map((variant) => [variant.id, variant] as const));

export const getVariantSpec = (id: string): VariantSpec | null => variantById.get(id) ?? null;
