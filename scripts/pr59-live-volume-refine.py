from pathlib import Path

file = Path('src/experiments/phaser/PhaserDeformableVolume.ts')
text = file.read_text()
changes = [
    ('  body *= 0.77 + vUv.y * 0.08 + uCompression * 0.025;',
     '  body *= 0.86 + vUv.y * 0.06 + uCompression * 0.020;'),
    ('    const thickness = 0.026 + 0.064 * Math.min(1, Math.max(0, moldProgress));',
     '    const thickness = 0.014 + 0.038 * Math.min(1, Math.max(0, moldProgress));'),
    ('      const deformed = simulation.projectUvToLocal(u, v);',
     '''      const deformed = simulation.projectUvToLocal(u, v);
      // Overlap the antialiased 2D edge by a few pixels. Without this the
      // alpha falloff exposes a dotted background seam between the two meshes.
      const inset = simulation.projectUvToLocal(0.5 + (u - 0.5) * 0.962, 0.5 + (v - 0.5) * 0.962);'''),
    ('      this.packed[a] = deformed.x;\n      this.packed[a + 1] = deformed.y;',
     '      this.packed[a] = inset.x;\n      this.packed[a + 1] = inset.y;'),
]
for before, after in changes:
    if text.count(before) != 1:
        raise RuntimeError(f'{file}: expected one match, found {text.count(before)}: {before[:70]}')
    text = text.replace(before, after)
file.write_text(text)

file = Path('src/experiments/phaser/PhaserDeformableVolume.ts')
text = file.read_text()
before = 'export const pagesVolumeFrontShader = fragmentShaderSource.replace(BODY_ALPHA_LINE, `'
after = "export const pagesVolumeFrontShader = fragmentShaderSource.replace('  base *= 1.0 - edge * 0.26;', '  base *= 1.0 - edge * 0.17;').replace(BODY_ALPHA_LINE, `"
if text.count(before) != 1: raise RuntimeError('Pages front shading signature changed')
file.write_text(text.replace(before, after))
