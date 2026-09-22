"""One-shot, guarded migration of Pages Hall snapshots from 256 to 512 pixels.

The output is still one shared demand-driven WebGL2 snapshot renderer; ordinary
and Yandex thumbnail output stays exactly 256x256. Every replacement asserts
its source anchor so a changed upstream file cannot be silently overwritten.
"""
from pathlib import Path


def patch(path: str, changes: list[tuple[str, str]]) -> None:
    file = Path(path)
    original = file.read_text()
    updated = original
    for before, after in changes:
        count = updated.count(before)
        if count != 1:
            raise RuntimeError(f'{path}: expected one anchor, got {count}: {before[:95]!r}')
        updated = updated.replace(before, after, 1)
    if updated == original:
        raise RuntimeError(f'{path}: no changes')
    file.write_text(updated)
    print(f'PATCHED: {path} ({len(changes)} independently checked anchors)')


patch('src/sandbox/libraryStudioThumbnail.ts', [
    ('const SIZE = 256;\nconst FIELD_SIZE = 128;',
     'const SIZE = 512;\nconst LOGICAL_SIZE = 256;\nconst FIELD_SIZE = 256;'),
    ('this.appearance.width = APPEARANCE_TEXTURE_SIZE;\n    this.appearance.height = APPEARANCE_TEXTURE_SIZE;',
     'this.appearance.width = APPEARANCE_TEXTURE_SIZE * 2;\n    this.appearance.height = APPEARANCE_TEXTURE_SIZE * 2;'),
    ('this.appearanceContext = context;',
     '// The V3 authoring coordinates stay in the original 256px domain.\n    // Rasterize their actual strokes, expressions and stickers at 2x.\n    context.setTransform(2, 0, 0, 2, 0, 0);\n    this.appearanceContext = context;'),
    ('public render(destination: CanvasRenderingContext2D, toy: SavedSquishy): void {\n    const gl = this.gl;',
     'public render(destination: CanvasRenderingContext2D, toy: SavedSquishy, snapshotSize: 256 | 512 = SIZE): void {\n    const gl = this.gl;\n    // A single context switches drawing-buffer size for the 256px benchmark;\n    // production Pages exhibits always use 512px. No extra context is made.\n    if (this.canvas.width !== snapshotSize || this.canvas.height !== snapshotSize) {\n      this.canvas.width = snapshotSize;\n      this.canvas.height = snapshotSize;\n    }'),
    ('gl.viewport(0, 0, SIZE, SIZE);', 'gl.viewport(0, 0, snapshotSize, snapshotSize);'),
    ('destination.drawImage(this.canvas, 0, 0, SIZE, SIZE);',
     '// The destination has a 1x or 2x transform; draw in 256 logical units.\n    destination.drawImage(this.canvas, 0, 0, LOGICAL_SIZE, LOGICAL_SIZE);'),
    ('export const renderStudioLibraryThumbnail = (context: CanvasRenderingContext2D, toy: SavedSquishy): boolean => {',
     'export const renderStudioLibraryThumbnail = (\n  context: CanvasRenderingContext2D, toy: SavedSquishy, snapshotSize: 256 | 512 = SIZE,\n): boolean => {'),
    ('shared.render(context, toy);', 'shared.render(context, toy, snapshotSize);'),
])

patch('src/sandbox/libraryThumbnail.ts', [
    ('type PagesRenderer = (context: CanvasRenderingContext2D, toy: SavedSquishy) => boolean;',
     'type PagesRenderer = (context: CanvasRenderingContext2D, toy: SavedSquishy, snapshotSize: 256 | 512) => boolean;'),
    ('export const renderLibraryThumbnail = (\n  canvas: HTMLCanvasElement,\n  toy: SavedSquishy,\n): void => {\n  canvas.width = THUMBNAIL_SIZE;\n  canvas.height = THUMBNAIL_SIZE;\n  const context = canvas.getContext(\'2d\');\n  if (!context) return;',
     'export const renderLibraryThumbnail = (\n  canvas: HTMLCanvasElement,\n  toy: SavedSquishy,\n  outputSize: 256 | 512 = pagesMaterialLighting ? 512 : 256,\n): void => {\n  // Only the isolated Pages Hall opts into 2x backing resolution. A 256px\n  // override keeps the benchmark control real, while Yandex stays byte-for-byte\n  // on its original 256px rendering path.\n  const rasterScale = pagesMaterialLighting && outputSize === 512 ? 2 : 1;\n  canvas.width = THUMBNAIL_SIZE * rasterScale;\n  canvas.height = THUMBNAIL_SIZE * rasterScale;\n  const context = canvas.getContext(\'2d\');\n  if (!context) return;\n  context.setTransform(rasterScale, 0, 0, rasterScale, 0, 0);'),
    ('accessoryCanvas.width = 180;\n    accessoryCanvas.height = 120;',
     'accessoryCanvas.width = 180 * rasterScale;\n    accessoryCanvas.height = 120 * rasterScale;'),
    ('if (accessoryContext) {\n      drawAccessoryGraphic(accessoryContext, toy.decor.accessory, 180, 120, toy.shapeId);',
     'if (accessoryContext) {\n      accessoryContext.setTransform(rasterScale, 0, 0, rasterScale, 0, 0);\n      drawAccessoryGraphic(accessoryContext, toy.decor.accessory, 180, 120, toy.shapeId);'),
    ('if (pagesMaterialLighting && pagesRenderer?.(context, toy)) {',
     'if (pagesMaterialLighting && pagesRenderer?.(context, toy, THUMBNAIL_SIZE * rasterScale as 256 | 512)) {'),
    ('appearanceCanvas.width = APPEARANCE_TEXTURE_SIZE;\n  appearanceCanvas.height = APPEARANCE_TEXTURE_SIZE;',
     'appearanceCanvas.width = APPEARANCE_TEXTURE_SIZE * rasterScale;\n  appearanceCanvas.height = APPEARANCE_TEXTURE_SIZE * rasterScale;'),
    ('if (appearanceContext) {\n    replayAppearanceDocument(appearanceContext, toy.appearance);',
     'if (appearanceContext) {\n    appearanceContext.setTransform(rasterScale, 0, 0, rasterScale, 0, 0);\n    replayAppearanceDocument(appearanceContext, toy.appearance);'),
])

patch('src/experiments/phaser/libraryVolumeProbe.ts', [
    ('renderLibraryThumbnail(current, toy);', 'renderLibraryThumbnail(current, toy, 256);'),
])

patch('tests/phaser-pages/library-hall-studio-shader.spec.ts', [
    ("await expect(visible.first()).toHaveAttribute('data-library-renderer', 'studio-shader');",
     "await expect(visible.first()).toHaveAttribute('data-library-renderer', 'studio-shader');\n    expect(await visible.evaluateAll(canvases => canvases.every(item => (item as HTMLCanvasElement).width === 512 && (item as HTMLCanvasElement).height === 512)),\n      'Pages only: 512px backing for each genuine Studio shader thumbnail').toBe(true);"),
    ("await expect(page.locator('[data-library-thumbnail]')).toHaveAttribute('data-library-renderer', 'canvas2d-fallback');",
     "await expect(page.locator('[data-library-thumbnail]')).toHaveAttribute('data-library-renderer', 'canvas2d-fallback');\n  expect(await page.locator('[data-library-thumbnail]').evaluate(canvas => (canvas as HTMLCanvasElement).width)).toBe(512);"),
])
