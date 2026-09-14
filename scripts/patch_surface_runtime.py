from pathlib import Path

path = Path('src/squish/SquishSurface.ts')
text = path.read_text()
text = text.replace("    window.addEventListener('resize', this.resize);\n    document.addEventListener('visibilitychange', this.handleVisibilityChange);\n", "    window.addEventListener('resize', this.resize);\n", 1)
text = text.replace("    window.removeEventListener('resize', this.resize);\n    document.removeEventListener('visibilitychange', this.handleVisibilityChange);\n", "    window.removeEventListener('resize', this.resize);\n", 1)
text = text.replace("  private readonly handleVisibilityChange = (): void => {\n    if (document.hidden) this.cancelInteraction();\n  };\n\n", "", 1)
needle = "  public setInteractive(enabled: boolean): void {\n    if (this.interactive === enabled) return;\n    this.interactive = enabled;\n    this.canvas.classList.toggle('is-disabled', !enabled);\n    if (!enabled) this.cancelInteraction();\n  }\n"
replacement = needle + "\n  public resetTiming(): void {\n    const now = performance.now();\n    this.lastFrameAt = now;\n    this.previousSampleAt = now;\n  }\n"
if needle not in text:
    raise SystemExit('setInteractive block not found')
text = text.replace(needle, replacement, 1)
path.write_text(text)
