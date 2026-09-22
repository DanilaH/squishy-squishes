from pathlib import Path
p = Path('src/experiments/phaser/PhaserSquishCandidate.ts')
s = p.read_text()
old = '''    if (this.pagesVolume && !this.wireframe && this.fillProgress >= 0.999 && this.moldProgress > 0.85) {
      this.volume ??= new PhaserDeformableVolume(gl);
      const radius = Math.min(this.scene.scale.width, this.scene.scale.height) * 0.34;
      this.volume.render(this.simulation, getShape(this.shapeId), material, gpu.appearance,
        this.appearanceEnabled, radius * 2 / this.scene.scale.width,
        radius * 2 / this.scene.scale.height, this.moldProgress, sample.compression);
    }
'''
assert s.count(old) == 1, 'Sidewall draw signature changed'
s = s.replace(old, '')
needle = '    gl.drawElements(gl.TRIANGLES, this.simulation.triangleIndices.length, gl.UNSIGNED_SHORT, 0);\n'
assert s.count(needle) == 1
s = s.replace(needle, needle + old)
p.write_text(s)
