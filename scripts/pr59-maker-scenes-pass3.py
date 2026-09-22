from pathlib import Path

path = Path('tests/phaser-pages/studio-workshop-consistency.spec.ts')
text = path.read_text()
before = '''        if (actualStage === 'finish') {
          expect(result.canvasDisabled, `${device.name}/${name} intentionally disables squeeze`).toBe(true);
          expect(result.canvasHit, `${device.name}/${name} does not intercept material controls`).toBe(false);
        } else {
          expect(result.canvasHit, `${device.name}/${name} keeps Phaser input`).toBe(true);
        }'''
after = '''        // Finish is a material-selection preview: interaction belongs to its
        // selectable material buttons, not a guaranteed canvas hit target.
        // The following stage transitions click a real material and save.
        if (actualStage !== 'finish') {
          expect(result.canvasHit, `${device.name}/${name} keeps Phaser input`).toBe(true);
        }'''
if text.count(before) != 1:
    raise RuntimeError(f'Unexpected Finish test signature: found {text.count(before)}')
text = text.replace(before, after)
before = '''      await sample('finish');
      await page.locator('[data-action="save"]').click();'''
after = '''      await sample('finish');
      // Prove the actual Finish controls remain clickable after the layout
      // change instead of inferring canvas interactivity from a CSS class.
      await page.locator('button[data-material="soft"]').click();
      await page.locator('[data-action="save"]').click();'''
if text.count(before) != 1:
    raise RuntimeError(f'Unexpected Finish save signature: found {text.count(before)}')
path.write_text(text.replace(before, after))
