import { SELECTOR_SHAPES, getShape, type ShapeId } from './shapes';

export type PaletteId = 'grape' | 'strawberry' | 'lime' | 'aqua' | 'prism' | 'milk' | 'peach';
export type MaterialId = 'soft' | 'jelly' | 'holo' | 'marshmallow' | 'pearl' | 'chrome';
export type FillingId = 'smooth' | 'beads' | 'pearls';
export type FillingRenderStyle = 'none' | 'foam' | 'pearl';

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

export interface MaterialSpec {
  readonly id: MaterialId;
  readonly label: string;
  readonly translucency: number;
  readonly iridescence: number;
  readonly roughness: number;
  readonly metallic: number;
  readonly pearlescence: number;
  readonly cloudiness: number;
}

export interface FillingSpec {
  readonly id: FillingId;
  readonly label: string;
  readonly description: string;
  readonly renderStyle: FillingRenderStyle;
  readonly requiresAddStage: boolean;
}

export interface VariantChoice {
  readonly shape: ShapeId;
  readonly palette: PaletteId;
  readonly material: MaterialId;
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
  {
    id: 'aqua',
    label: 'Aqua Glass',
    low: [0.06, 0.31, 0.39],
    high: [0.38, 0.93, 0.91],
    sheen: [0.82, 1, 1],
    rim: [0.14, 0.66, 0.7],
    accentCss: '#64e7e0',
    accentSoftCss: 'rgba(100, 231, 224, 0.23)',
    seed: 0.63,
  },
  {
    id: 'prism',
    label: 'Opal Prism',
    low: [0.31, 0.28, 0.43],
    high: [0.84, 0.79, 0.95],
    sheen: [1, 0.94, 1],
    rim: [0.58, 0.5, 0.83],
    accentCss: '#d3bff2',
    accentSoftCss: 'rgba(211, 191, 242, 0.24)',
    seed: 0.91,
  },
  {
    id: 'milk',
    label: 'Warm Milk',
    low: [0.66, 0.58, 0.47],
    high: [0.99, 0.93, 0.8],
    sheen: [1, 0.99, 0.94],
    rim: [0.72, 0.62, 0.49],
    accentCss: '#f1dcae',
    accentSoftCss: 'rgba(241, 220, 174, 0.23)',
    seed: 0.28,
  },
  {
    id: 'peach',
    label: 'Peach Cream',
    low: [0.62, 0.24, 0.17],
    high: [1, 0.67, 0.47],
    sheen: [1, 0.91, 0.84],
    rim: [0.74, 0.31, 0.22],
    accentCss: '#ff9f78',
    accentSoftCss: 'rgba(255, 159, 120, 0.23)',
    seed: 0.38,
  },
] as const;

export const MATERIALS: readonly MaterialSpec[] = [
  { id: 'soft', label: 'Soft', translucency: 0, iridescence: 0, roughness: 0.42, metallic: 0, pearlescence: 0, cloudiness: 0.05 },
  // Jelly is the deliberately see-through hero material: its inclusions should
  // read as content suspended inside the body, not as surface stickers.
  { id: 'jelly', label: 'Jelly', translucency: 0.90, iridescence: 0.08, roughness: 0.10, metallic: 0, pearlescence: 0.06, cloudiness: 0 },
  { id: 'holo', label: 'Holographic', translucency: 0.28, iridescence: 1.0, roughness: 0.14, metallic: 0.10, pearlescence: 0.22, cloudiness: 0 },
  { id: 'marshmallow', label: 'Marshmallow', translucency: 0.03, iridescence: 0, roughness: 0.92, metallic: 0, pearlescence: 0.03, cloudiness: 0.62 },
  { id: 'pearl', label: 'Pearl', translucency: 0.14, iridescence: 0.24, roughness: 0.22, metallic: 0.10, pearlescence: 1.0, cloudiness: 0.05 },
  { id: 'chrome', label: 'Chrome', translucency: 0.02, iridescence: 0.08, roughness: 0.04, metallic: 1.0, pearlescence: 0.08, cloudiness: 0 },
] as const;

export const FILLINGS: readonly FillingSpec[] = [
  { id: 'smooth', label: 'Smooth', description: 'Soft glossy base', renderStyle: 'none', requiresAddStage: false },
  { id: 'beads', label: 'Foam Beads', description: 'Crunchy bead filling', renderStyle: 'foam', requiresAddStage: true },
  { id: 'pearls', label: 'Pearl Beads', description: 'Larger luminous pearls', renderStyle: 'pearl', requiresAddStage: true },
] as const;

const LEGACY_PALETTE_IDS = new Set<PaletteId>(['grape', 'strawberry', 'lime']);
const LEGACY_FILLING_IDS = new Set<FillingId>(['smooth', 'beads']);

export const SELECTOR_PALETTES: readonly PaletteSpec[] = PALETTES.filter((palette) => LEGACY_PALETTE_IDS.has(palette.id));
export const SELECTOR_FILLINGS: readonly FillingSpec[] = FILLINGS.filter((filling) => LEGACY_FILLING_IDS.has(filling.id));

const paletteById: Readonly<Record<PaletteId, PaletteSpec>> = Object.fromEntries(
  PALETTES.map((palette) => [palette.id, palette]),
) as Readonly<Record<PaletteId, PaletteSpec>>;

const materialById: Readonly<Record<MaterialId, MaterialSpec>> = Object.fromEntries(
  MATERIALS.map((material) => [material.id, material]),
) as Readonly<Record<MaterialId, MaterialSpec>>;

const fillingById: Readonly<Record<FillingId, FillingSpec>> = Object.fromEntries(
  FILLINGS.map((filling) => [filling.id, filling]),
) as Readonly<Record<FillingId, FillingSpec>>;

export const getPalette = (id: PaletteId): PaletteSpec => paletteById[id];
export const getMaterial = (id: MaterialId): MaterialSpec => materialById[id];
export const getFilling = (id: FillingId): FillingSpec => fillingById[id];

export const isLegacyPaletteId = (id: PaletteId): boolean => LEGACY_PALETTE_IDS.has(id);
export const isLegacyFillingId = (id: FillingId): boolean => LEGACY_FILLING_IDS.has(id);

export const variantId = (choice: VariantChoice): string => {
  const prefix = choice.shape === 'soft-square' ? '' : `${choice.shape}-`;
  if (choice.material === 'soft' && isLegacyPaletteId(choice.palette) && isLegacyFillingId(choice.filling)) {
    return `${prefix}${choice.palette}-${choice.filling}`;
  }
  return `${prefix}${choice.palette}-${choice.material}-${choice.filling}`;
};

export const variantLabel = (choice: VariantChoice): string => {
  const shape = getShape(choice.shape);
  const palette = getPalette(choice.palette);
  const material = getMaterial(choice.material);
  const filling = getFilling(choice.filling);
  const materialLabel = choice.material === 'soft' ? '' : ` · ${material.label}`;
  return `${shape.label} · ${palette.label}${materialLabel} · ${filling.label}`;
};

const LEGACY_VARIANTS: readonly VariantSpec[] = SELECTOR_SHAPES.flatMap((shape) =>
  SELECTOR_PALETTES.flatMap((palette) =>
    SELECTOR_FILLINGS.map((filling) => {
      const choice: VariantChoice = {
        shape: shape.id,
        palette: palette.id,
        material: 'soft',
        filling: filling.id,
      };
      return {
        id: variantId(choice),
        label: variantLabel(choice),
        choice,
      } satisfies VariantSpec;
    }),
  ),
);

const REPRESENTATIVE_VARIANTS: readonly VariantSpec[] = [
  {
    choice: { shape: 'soft-square', palette: 'aqua', material: 'jelly', filling: 'pearls' },
    id: 'aqua-jelly-pearls',
    label: 'Pearl Jelly Cube',
  },
  {
    choice: { shape: 'heart', palette: 'aqua', material: 'jelly', filling: 'smooth' },
    id: 'heart-aqua-jelly-smooth',
    label: 'Aqua Jelly Heart',
  },
  {
    choice: { shape: 'soft-square', palette: 'prism', material: 'holo', filling: 'smooth' },
    id: 'prism-holo-smooth',
    label: 'Holographic Prism Cube',
  },
  {
    choice: { shape: 'heart', palette: 'prism', material: 'holo', filling: 'pearls' },
    id: 'heart-prism-holo-pearls',
    label: 'Holographic Pearl Heart',
  },
] as const;

const CATALOG_PRODUCTION_7A_VARIANTS: readonly VariantSpec[] = [
  {
    choice: { shape: 'mochi', palette: 'milk', material: 'soft', filling: 'smooth' },
    id: 'mochi-milk-soft-smooth',
    label: 'Milk Mochi',
  },
  {
    choice: { shape: 'peach', palette: 'peach', material: 'soft', filling: 'smooth' },
    id: 'peach-peach-soft-smooth',
    label: 'Peach Milk Puff',
  },
  {
    choice: { shape: 'peach', palette: 'strawberry', material: 'jelly', filling: 'smooth' },
    id: 'peach-strawberry-jelly-smooth',
    label: 'Sakura Jelly Peach',
  },
  {
    choice: { shape: 'mochi', palette: 'prism', material: 'holo', filling: 'pearls' },
    id: 'mochi-prism-holo-pearls',
    label: 'Galaxy Pearl Mochi',
  },
] as const;

const CATALOG_PRODUCTION_7B_VARIANTS: readonly VariantSpec[] = [
  {
    choice: { shape: 'mushroom', palette: 'milk', material: 'soft', filling: 'smooth' },
    id: 'mushroom-milk-soft-smooth',
    label: 'Vanilla Mushroom',
  },
  {
    choice: { shape: 'paw', palette: 'milk', material: 'soft', filling: 'smooth' },
    id: 'paw-milk-soft-smooth',
    label: 'Milk Paw',
  },
  {
    choice: { shape: 'mushroom', palette: 'grape', material: 'jelly', filling: 'smooth' },
    id: 'mushroom-grape-jelly-smooth',
    label: 'Grape Glow Mushroom',
  },
  {
    choice: { shape: 'paw', palette: 'prism', material: 'holo', filling: 'pearls' },
    id: 'paw-prism-holo-pearls',
    label: 'Aurora Paw',
  },
] as const;

export const ALL_VARIANTS: readonly VariantSpec[] = [
  ...LEGACY_VARIANTS,
  ...REPRESENTATIVE_VARIANTS,
  ...CATALOG_PRODUCTION_7A_VARIANTS,
  ...CATALOG_PRODUCTION_7B_VARIANTS,
];
export const ALL_VARIANT_IDS: readonly string[] = ALL_VARIANTS.map((variant) => variant.id);

const uniqueVariantIds = new Set(ALL_VARIANT_IDS);
if (uniqueVariantIds.size !== ALL_VARIANTS.length) throw new Error('Canonical variant IDs must be unique.');

for (const variant of ALL_VARIANTS) {
  if (variant.id !== variantId(variant.choice)) {
    throw new Error(`Canonical variant ID does not match choice: ${variant.id}`);
  }
}

const variantById = new Map(ALL_VARIANTS.map((variant) => [variant.id, variant] as const));

export const getVariantSpec = (id: string): VariantSpec | null => variantById.get(id) ?? null;
