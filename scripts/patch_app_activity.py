from pathlib import Path

path = Path('src/game/VerticalSliceApp.ts')
text = path.read_text()

def rep(old: str, new: str) -> None:
    global text
    if old not in text:
        raise SystemExit(f'missing snippet: {old[:80]!r}')
    text = text.replace(old, new, 1)

rep("    this.startButton.addEventListener('click', () => {\n      void this.audio.prime();\n      this.setStage('pour');\n    }, { signal });", "    this.startButton.addEventListener('click', () => {\n      if (this.activityBlocked) return;\n      void this.audio.prime();\n      this.setStage('pour');\n    }, { signal });")
rep("        if (this.stage !== 'select') return;\n        const value = button.dataset.paletteChoice;", "        if (this.activityBlocked || this.stage !== 'select') return;\n        const value = button.dataset.paletteChoice;")
rep("        if (this.stage !== 'select') return;\n        const value = button.dataset.fillingChoice;", "        if (this.activityBlocked || this.stage !== 'select') return;\n        const value = button.dataset.fillingChoice;")
rep("    const tactile = next === 'mix' || next === 'test';\n    this.renderer.setInteractive(tactile);", "    const tactile = next === 'mix' || next === 'test';\n    this.renderer.setInteractive(!this.activityBlocked && tactile);")
rep("    if (this.stage === 'mix') {", "    if (!this.activityBlocked && this.stage === 'mix') {")
rep("    if (this.holdPointerId !== null || (this.stage !== 'pour' && this.stage !== 'add')) return;", "    if (this.activityBlocked || this.holdPointerId !== null || (this.stage !== 'pour' && this.stage !== 'add')) return;")
rep("    if (event.pointerId !== this.holdPointerId) return;\n    event.preventDefault();\n\n    if (this.stage === 'pour') {", "    if (this.activityBlocked || event.pointerId !== this.holdPointerId) return;\n    event.preventDefault();\n\n    if (this.stage === 'pour') {")
rep("    if (this.stage !== 'mix' || this.mixPointerId !== null) return;", "    if (this.activityBlocked || this.stage !== 'mix' || this.mixPointerId !== null) return;")
rep("    if (this.stage !== 'mix' || event.pointerId !== this.mixPointerId) return;", "    if (this.activityBlocked || this.stage !== 'mix' || event.pointerId !== this.mixPointerId) return;")
rep("    if (this.stage !== 'mold' || this.moldComplete) return;\n    const point = this.pointerToPaintUv(event.clientX, event.clientY);", "    if (this.activityBlocked || this.stage !== 'mold' || this.moldComplete) return;\n    const point = this.pointerToPaintUv(event.clientX, event.clientY);")
rep("    if (this.stage !== 'mold' || this.moldComplete) return;\n    event.preventDefault();\n    event.stopPropagation();", "    if (this.activityBlocked || this.stage !== 'mold' || this.moldComplete) return;\n    event.preventDefault();\n    event.stopPropagation();")
rep("    if (this.stage === 'mold' && !this.moldComplete && this.stageProgress > 0) {", "    if (!this.activityBlocked && this.stage === 'mold' && !this.moldComplete && this.stageProgress > 0) {")
start = text.find("  private readonly handleVisibilityChange = (): void => {")
end = text.find("  private setStageProgress(value: number): void {", start)
if start < 0 or end < 0:
    raise SystemExit('visibility handler block not found')
method = """  public setActivityBlocked(blocked: boolean): void {
    if (this.activityBlocked === blocked) return;
    this.activityBlocked = blocked;

    if (blocked) {
      this.audio.stopPour();
      this.paintAudioActive = false;
      this.shakeAudioActive = false;
      this.shell.dataset.shaking = 'false';
      this.moldTargetWasAvailableBeforeBlock = this.stage === 'mold'
        && !this.moldTarget.hidden
        && !this.moldTarget.disabled;
      this.clearMoldTargetTimer();
      this.moldTarget.hidden = true;
      this.resetMixTracking();
      this.renderer.setInteractive(false);

      if (this.holdPointerId !== null) {
        try {
          this.holdSurface.releasePointerCapture(this.holdPointerId);
        } catch {
          // Pointer capture may already be unavailable during a platform pause.
        }
        this.holdPointerId = null;
        this.holdStageComplete = false;
      }
      return;
    }

    this.lastCraftFrameAt = performance.now();
    this.lastSemanticAt = performance.now();
    this.renderer.resetTiming();
    this.renderer.setInteractive(this.stage === 'mix' || this.stage === 'test');

    if (this.stage === 'mold' && !this.moldComplete) {
      if (this.moldTargetWasAvailableBeforeBlock) {
        this.positionMoldTarget();
        this.moldTarget.disabled = false;
        this.moldTarget.hidden = false;
      } else {
        this.spawnMoldTarget();
      }
    }
    this.moldTargetWasAvailableBeforeBlock = false;
  }

"""
text = text[:start] + method + text[end:]
path.write_text(text)
