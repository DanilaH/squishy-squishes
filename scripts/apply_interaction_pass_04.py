from pathlib import Path

app_path = Path('src/game/VerticalSliceApp.ts')
app = app_path.read_text()

replacements = {
    "const SHAKE_PATH_FOR_FULL_PROGRESS_PX = 2200;": "const SHAKE_PATH_FOR_FULL_PROGRESS_PX = 3000;",
    "const PAINT_GRID_SIZE = 16;": "const PAINT_GRID_SIZE = 20;",
    "const PAINT_COMPLETE_COVERAGE = 0.82;": "const PAINT_COMPLETE_COVERAGE = 0.92;",
    "const PAINT_BRUSH_RADIUS_UV = 0.14;": "const PAINT_BRUSH_RADIUS_UV = 0.115;",
    "const MOLD_HIT_PROGRESS = 0.17;\nconst MOLD_DECAY_PER_SECOND = 0.055;\nconst MOLD_TARGET_LIFETIME_MS = 900;": "const MOLD_NORMAL_HIT_PROGRESS = 0.028;\nconst MOLD_CRIT_HIT_PROGRESS = 0.095;\nconst MOLD_DECAY_PER_SECOND = 0.03;",
    "    this.moldTarget.addEventListener('pointerdown', this.handleMoldTargetPress, { signal });": "    this.moldTarget.addEventListener('pointerdown', this.handleMoldTargetPress, { signal });\n    this.workspace.addEventListener('pointerdown', this.handleMoldSurfacePress, { signal });",
    "        this.setStageCopy('Press the mold', 'Tap each pulse before the press meter slips back.');": "        this.setStageCopy('Shape it', 'Tap the squishy. Hit the pulse for a critical press.');",
    "        this.setStageProgress(this.stageProgress + dt * effort * 0.88);": "        this.setStageProgress(this.stageProgress + dt * effort * 0.67);",
    "    const steps = Math.max(1, Math.ceil(distance / 0.035));": "    const steps = Math.max(1, Math.ceil(distance / 0.026));",
    "    const radius = PAINT_CANVAS_SIZE * PAINT_BRUSH_RADIUS_UV;": "    const radius = PAINT_CANVAS_SIZE * PAINT_BRUSH_RADIUS_UV;\n    const spreadRadius = radius * 1.42;",
    "    const palette = getPalette(this.selected.palette);\n    const gradient = context.createRadialGradient(\n      x - radius * 0.18,": "    const palette = getPalette(this.selected.palette);\n\n    const spreadGradient = context.createRadialGradient(x, y, radius * 0.25, x, y, spreadRadius);\n    spreadGradient.addColorStop(0, palette.accentCss);\n    spreadGradient.addColorStop(0.48, palette.accentSoftCss);\n    spreadGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');\n\n    context.save();\n    context.clip(this.paintShapePath);\n    context.globalAlpha = 0.34;\n    context.fillStyle = spreadGradient;\n    context.beginPath();\n    context.arc(x, y, spreadRadius, 0, Math.PI * 2);\n    context.fill();\n    context.restore();\n\n    const gradient = context.createRadialGradient(\n      x - radius * 0.18,",
    "    this.setStageProgress(this.stageProgress + MOLD_HIT_PROGRESS);\n    this.renderer.setMoldProgress(this.stageProgress);\n\n    if (this.stageProgress >= 1) {\n      this.moldComplete = true;\n      this.moldTarget.hidden = true;\n      this.setStageCopy('Press locked', '');\n      this.audio.playStageComplete(0.8);\n      this.transitionTimer = window.setTimeout(() => this.setStage('reveal'), 190);\n      return;\n    }\n\n    this.moldTargetTimer = window.setTimeout(() => this.spawnMoldTarget(), MOLD_NEXT_TARGET_DELAY_MS);": "    if (this.advanceMoldProgress(MOLD_CRIT_HIT_PROGRESS)) return;\n\n    this.moldTargetTimer = window.setTimeout(() => this.spawnMoldTarget(), MOLD_NEXT_TARGET_DELAY_MS);",
    "    this.moldTarget.hidden = false;\n    this.moldTargetTimer = window.setTimeout(() => this.spawnMoldTarget(), MOLD_TARGET_LIFETIME_MS);": "    this.moldTarget.hidden = false;",
}

for old, new in replacements.items():
    if old not in app:
        raise SystemExit(f'Missing expected app snippet: {old[:90]!r}')
    app = app.replace(old, new, 1)

marker = "  private readonly handleMoldTargetPress = (event: PointerEvent): void => {"
insertion = """  private readonly handleMoldSurfacePress = (event: PointerEvent): void => {
    if (this.stage !== 'mold' || this.moldComplete) return;
    const point = this.pointerToPaintUv(event.clientX, event.clientY);
    if (!this.isInsidePaintShape(point.u, point.v)) return;
    event.preventDefault();
    void this.audio.prime();
    this.advanceMoldProgress(MOLD_NORMAL_HIT_PROGRESS);
  };

  private advanceMoldProgress(amount: number): boolean {
    if (this.stage !== 'mold' || this.moldComplete) return false;
    this.setStageProgress(this.stageProgress + amount);
    this.renderer.setMoldProgress(this.stageProgress);
    if (this.stageProgress < 1) return false;

    this.moldComplete = true;
    this.clearMoldTargetTimer();
    this.moldTarget.hidden = true;
    this.moldTarget.disabled = true;
    this.setStageCopy('Shape locked', '');
    this.audio.playStageComplete(0.8);
    this.transitionTimer = window.setTimeout(() => this.setStage('reveal'), 220);
    return true;
  }

"""
if marker not in app:
    raise SystemExit('Missing mold target handler marker')
app = app.replace(marker, insertion + marker, 1)

old_particles = """    const foamParticles = Array.from({ length: 11 }, (_, index) => {
      const x = (index - 5) * 8;
      const drift = x + ((index % 3) - 1) * 7;
      const delay = index * -47;
      return `<span class=\"foam-particle\" style=\"--foam-x: ${x}px; --foam-drift: ${drift}px; --foam-delay: ${delay}ms\"></span>`;
    }).join('');"""
new_particles = """    const foamParticles = Array.from({ length: 20 }, (_, index) => {
      const x = (index - 9.5) * 4.6;
      const drift = x + ((index % 5) - 2) * 5.5;
      const delay = index * -31;
      const size = 3 + ((index * 7) % 4);
      const duration = 450 + (index % 5) * 55;
      const blur = (index % 3) * 0.18;
      return `<span class=\"foam-particle\" style=\"--foam-x: ${x}px; --foam-drift: ${drift}px; --foam-delay: ${delay}ms; --foam-size: ${size}px; --foam-duration: ${duration}ms; --foam-blur: ${blur}px\"></span>`;
    }).join('');"""
if old_particles not in app:
    raise SystemExit('Missing foam particle generator')
app = app.replace(old_particles, new_particles, 1)
app_path.write_text(app)

css_path = Path('src/interaction-pass.css')
css = css_path.read_text()
old_css = """.foam-particle {
  position: absolute;
  left: calc(50% + var(--foam-x));
  top: 0;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(245, 247, 252, 0.92);
  opacity: 0;
  animation: foam-bit-fall 520ms linear infinite;
  animation-delay: var(--foam-delay);
  animation-play-state: paused;
}

.foam-particle:nth-child(3n) {
  width: 5px;
  height: 5px;
}

.foam-particle:nth-child(4n) {
  width: 9px;
  height: 9px;
}"""
new_css = """.foam-particle {
  position: absolute;
  left: calc(50% + var(--foam-x));
  top: 0;
  width: var(--foam-size, 4px);
  height: var(--foam-size, 4px);
  border-radius: 50%;
  background: radial-gradient(circle at 34% 30%, rgba(255,255,255,0.94) 0 16%, rgba(239,243,250,0.72) 34%, rgba(210,219,232,0.2) 66%, transparent 100%);
  box-shadow: 0 0 5px rgba(232, 239, 249, 0.16);
  filter: blur(var(--foam-blur, 0px));
  opacity: 0;
  animation: foam-bit-fall var(--foam-duration, 520ms) cubic-bezier(.22,.58,.38,1) infinite;
  animation-delay: var(--foam-delay);
  animation-play-state: paused;
  will-change: transform, opacity;
}"""
if old_css not in css:
    raise SystemExit('Missing old foam particle CSS')
css = css.replace(old_css, new_css, 1)
css = css.replace("  12% { opacity: 0.95; }\n  70% { opacity: 0.78; }", "  14% { opacity: 0.82; }\n  68% { opacity: 0.6; }")
css = css.replace("transform: translate3d(var(--foam-drift), calc(var(--hero-size) * 0.48), 0) scale(1.08);", "transform: translate3d(var(--foam-drift), calc(var(--hero-size) * 0.48), 0) scale(0.82);")
css_path.write_text(css)

shader_path = Path('src/squish/shaders.ts')
shader = shader_path.read_text()
shader_replacements = {
    "vec2 scaled = uv * 8.6 + vec2(seed * 3.1, seed * 5.7);": "vec2 scaled = uv * 10.4 + vec2(seed * 3.1, seed * 5.7);",
    "float occupied = step(0.28, hash21(cell + seed * 17.0));": "float occupied = step(0.34, hash21(cell + seed * 17.0));",
    "float bead = 1.0 - smoothstep(0.11, 0.185, distanceToCenter);": "float bead = 1.0 - smoothstep(0.095, 0.165, distanceToCenter);",
    "float beadShade = 0.72 + hash21(floor(vUv * 8.6) + uMaterialSeed * 31.0) * 0.28;": "float beadShade = 0.78 + hash21(floor(vUv * 10.4) + uMaterialSeed * 31.0) * 0.22;",
}
for old, new in shader_replacements.items():
    if old not in shader:
        raise SystemExit(f'Missing shader snippet: {old!r}')
    shader = shader.replace(old, new, 1)
shader_path.write_text(shader)
