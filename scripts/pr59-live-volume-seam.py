from pathlib import Path

path = Path('src/experiments/phaser/PhaserDeformableVolume.ts')
text = path.read_text()
before = '      this.packed[a + 1] = inset.y;'
after = '''      // Raise the side's inner rim into the opaque front, covering the
      // subpixel antialias transition without changing the outer silhouette.
      this.packed[a + 1] = inset.y + 0.025;'''
if text.count(before) != 1:
    raise RuntimeError(f'Expected one Pages sidewall seam, found {text.count(before)}')
path.write_text(text.replace(before, after))
