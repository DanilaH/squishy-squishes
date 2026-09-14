import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/game/VerticalSliceApp.ts';
let text = readFileSync(path, 'utf8');

const replacements = [
  [
    "  SHAPES,\n  createShapePath,\n  getShape,\n  isPointInsideShape,\n",
    "  SELECTOR_SHAPES,\n  createShapePath,\n  getShape,\n  isPointInsideShape,\n  isSelectorShapeId,\n",
  ],
  [
    "    const shapeButtons = SHAPES.map((shape, index) => `",
    "    const shapeButtons = SELECTOR_SHAPES.map((shape, index) => `",
  ],
  [
    "        const filling = isLegacyFillingId(this.selected.filling) ? this.selected.filling : 'smooth';\n        this.selected = { shape: this.selected.shape, palette: value, material: 'soft', filling };",
    "        const shape = isSelectorShapeId(this.selected.shape) ? this.selected.shape : 'soft-square';\n        const filling = isLegacyFillingId(this.selected.filling) ? this.selected.filling : 'smooth';\n        this.selected = { shape, palette: value, material: 'soft', filling };",
  ],
  [
    "        const palette = isLegacyPaletteId(this.selected.palette) ? this.selected.palette : 'grape';\n        this.selected = { shape: this.selected.shape, palette, material: 'soft', filling: value };",
    "        const shape = isSelectorShapeId(this.selected.shape) ? this.selected.shape : 'soft-square';\n        const palette = isLegacyPaletteId(this.selected.palette) ? this.selected.palette : 'grape';\n        this.selected = { shape, palette, material: 'soft', filling: value };",
  ],
];

for (const [oldText, newText] of replacements) {
  const first = text.indexOf(oldText);
  if (first < 0 || text.indexOf(oldText, first + 1) >= 0) {
    throw new Error(`Expected exactly one selector replacement: ${oldText.slice(0, 70)}`);
  }
  text = text.replace(oldText, newText);
}

writeFileSync(path, text);
