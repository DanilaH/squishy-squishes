from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one target, found {count}')
    file.write_text(text.replace(old, new, 1), encoding='utf-8')


source = 'src/sandbox/SandboxApp.ts'
replace_once(source, """    if (shapeId && SHAPES.some((shape) => shape.id === shapeId)) {
      this.draft = { ...this.draft, shapeId };
      this.applyDraftToRenderer();
      this.updatePressed('[data-shape]', 'shape', shapeId);
      return;
    }""", """    if (shapeId && SHAPES.some((shape) => shape.id === shapeId)) {
      if (shapeId !== this.draft.shapeId) {
        this.draft = { ...this.draft, shapeId };
        this.applyDraftToRenderer();
        // Face and blush are shape-relative. Rebuild the authored texture after
        // changing a shape, without dropping paint, mix-ins or stickers.
        this.replayAndUpload();
      }
      this.updatePressed('button[data-shape]', 'shape', shapeId);
      return;
    }""")
file = Path(source)
text = file.read_text(encoding='utf-8')
old = "this.updatePressed('[data-shape]', 'shape',"
if text.count(old) != 2:
    raise RuntimeError(f'Expected two other shape-button syncs, found {text.count(old)}')
file.write_text(text.replace(old, "this.updatePressed('button[data-shape]', 'shape',"), encoding='utf-8')

spec = 'tests/phaser-pages/studio-navigation.spec.ts'
replace_once(spec, """  await expect(page.locator('[data-action="decor-undo"]')).toBeEnabled();
  await back.click();
  await expect(shell).toHaveAttribute('data-stage', 'mix');
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
  await expect(shell).toHaveAttribute('data-decor-sticker-count', '1');
  await page.locator('[data-action="decor-continue"]').click();""", """  await expect(page.locator('[data-action="decor-undo"]')).toBeEnabled();
  // Changing the shape *after* decorating must preserve creative data and rebake
  // the shape-relative face rather than keeping the old shape's texture.
  await back.click();
  await expect(shell).toHaveAttribute('data-stage', 'mix');
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await back.click();
  await back.click();
  await back.click();
  await expect(shell).toHaveAttribute('data-stage', 'shape');
  await page.locator('button[data-shape="mochi"]').click();
  await expect(shell).toHaveAttribute('data-shape', 'mochi');
  await expect(shell).toHaveAttribute('data-decor-sticker-count', '1');
  await expect(shell).toHaveAttribute('data-paint-strokes', '1');
  await expect(shell).toHaveAttribute('data-mixin-count', '1');
  await page.locator('[data-action="shape-continue"]').click();
  await page.locator('[data-action="paint-continue"]').click();
  await page.locator('[data-action="mixin-continue"]').click();
  await expect(page.locator('[data-action="mix-continue"]')).toBeEnabled();
  await page.locator('[data-action="mix-continue"]').click();
  await expect(shell).toHaveAttribute('data-decor-sticker-count', '1');
  await page.locator('[data-action="decor-continue"]').click();""")
replace_once(spec, "expect(parsed.library[0]).toMatchObject({ shapeId: 'heart', materialId: 'holo' });", "expect(parsed.library[0]).toMatchObject({ shapeId: 'mochi', materialId: 'holo' });")
print('Applied shape rebake fix and decorated-shape navigation regression.')
