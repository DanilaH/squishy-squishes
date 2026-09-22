from pathlib import Path


def patch(path: str, substitutions: list[tuple[str, str]]) -> None:
    file = Path(path)
    content = file.read_text()
    for old, new in substitutions:
        count = content.count(old)
        if count != 1:
            raise RuntimeError(f'{path}: expected exactly one match, found {count}: {old[:100]}')
        content = content.replace(old, new)
    file.write_text(content)


patch('src/experiments/phaser/PhaserSquishCandidate.ts', [
    ("import { fragmentShaderSource, vertexShaderSource } from '../../squish/shaders';",
     "import { fragmentShaderSource, vertexShaderSource } from '../../squish/shaders';\n"
     "import { PhaserDeformableVolume, pagesVolumeFrontShader } from './PhaserDeformableVolume';"),
    ('  private gpu: GpuResources | null = null;',
     '  private gpu: GpuResources | null = null;\n'
     '  private volume: PhaserDeformableVolume | null = null;'),
    ('public constructor(scene: Phaser.Scene, private readonly gl: WebGL2RenderingContext) {',
     'public constructor(scene: Phaser.Scene, private readonly gl: WebGL2RenderingContext, private readonly pagesVolume = false) {'),
    ('const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);',
     'const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, this.pagesVolume ? pagesVolumeFrontShader : fragmentShaderSource);'),
    ('    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);\n    gl.bindBuffer(gl.ARRAY_BUFFER, gpu.vertices);',
     '''    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    if (this.pagesVolume && !this.wireframe && this.fillProgress >= 0.999 && this.moldProgress > 0.85) {
      this.volume ??= new PhaserDeformableVolume(gl);
      const radius = Math.min(this.scene.scale.width, this.scene.scale.height) * 0.34;
      this.volume.render(this.simulation, getShape(this.shapeId), material, gpu.appearance,
        this.appearanceEnabled, radius * 2 / this.scene.scale.width,
        radius * 2 / this.scene.scale.height, this.moldProgress, sample.compression);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, gpu.vertices);'''),
    ('  public forgetLostContext(): void {\n    this.gpu = null;',
     '  public forgetLostContext(): void {\n    this.volume?.dispose();\n    this.volume = null;\n    this.gpu = null;'),
    ('    const gpu = this.gpu;\n    this.gpu = null;\n    if (!gpu || this.gl.isContextLost()) return;',
     '    const gpu = this.gpu;\n    this.volume?.dispose();\n    this.volume = null;\n    this.gpu = null;\n    if (!gpu || this.gl.isContextLost()) return;'),
])

patch('src/sandbox/PhaserSquishSurface.ts', [
    ('    private readonly callbacks: PhaserSandboxCallbacks,\n',
     '    private readonly callbacks: PhaserSandboxCallbacks,\n    private readonly volumeProfile = false,\n'),
    ('new PhaserSquishCandidate(this, gl!);', 'new PhaserSquishCandidate(this, gl!, owner.volumeProfile);'),
    ("        canvas.dataset.phaserReady = 'true';",
     "        canvas.dataset.phaserReady = 'true';\n        if (owner.volumeProfile) canvas.dataset.phaserVolume = 'deformable';"),
    ('    delete this.canvas.dataset.phaserReady;',
     '    delete this.canvas.dataset.phaserReady;\n    delete this.canvas.dataset.phaserVolume;'),
])

patch('src/experiments/phaser/pagesPreview.ts', [
    ('new PhaserSquishSurface(canvas, onMetrics, audio, callbacks),',
     'new PhaserSquishSurface(canvas, onMetrics, audio, callbacks, true),'),
])

patch('tests/phaser-pages/library-hall-cross-scene-parity.spec.ts', [
    ("    await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');",
     "    await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-ready', 'true');\n"
     "    await expect(page.locator('[data-sandbox-canvas]')).toHaveAttribute('data-phaser-volume', 'deformable');"),
])
