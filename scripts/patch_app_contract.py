from pathlib import Path

path = Path('src/game/VerticalSliceApp.ts')
text = path.read_text()

def rep(old: str, new: str) -> None:
    global text
    if old not in text:
        raise SystemExit(f'missing snippet: {old[:80]!r}')
    text = text.replace(old, new, 1)

rep("import { SquishSurface, type SquishMetrics } from '../squish/SquishSurface';\n", "import type { GameCopy } from '../i18n';\nimport { SquishSurface, type SquishMetrics } from '../squish/SquishSurface';\n")
rep("type CraftStage = 'select' | 'pour' | 'add' | 'mix' | 'mold' | 'reveal' | 'test' | 'collect';\n\nconst DISCOVERED_STORAGE_KEY = 'squishy.vertical-slice.discovered.v2';\n", "type CraftStage = 'select' | 'pour' | 'add' | 'mix' | 'mold' | 'reveal' | 'test' | 'collect';\n\nexport interface VerticalSliceAppOptions {\n  readonly completedVariantIds: readonly string[];\n  readonly muted: boolean;\n  readonly copy: GameCopy;\n  readonly onVariantCollected: (variantId: string) => void | Promise<void>;\n  readonly onMutedChange: (muted: boolean) => void | Promise<void>;\n}\n\n")
rep("  private moldTargetX = 0;\n  private moldTargetY = 0;\n  private heroSizePx = 240;\n\n  public constructor(private readonly root: HTMLDivElement) {\n    root.innerHTML = this.renderShell();\n", "  private moldTargetX = 0;\n  private moldTargetY = 0;\n  private heroSizePx = 240;\n  private activityBlocked = false;\n  private moldTargetWasAvailableBeforeBlock = false;\n\n  public constructor(\n    private readonly root: HTMLDivElement,\n    private readonly options: VerticalSliceAppOptions,\n  ) {\n    for (const id of options.completedVariantIds) {\n      if (ALL_VARIANT_IDS.includes(id)) this.discovered.add(id);\n    }\n    this.muted = options.muted;\n    root.innerHTML = this.renderShell();\n")
rep("    this.renderer = new SquishSurface(this.canvas, this.handleMetrics, this.audio);\n\n    this.bindEvents();\n    this.loadDiscovered();\n", "    this.renderer = new SquishSurface(this.canvas, this.handleMetrics, this.audio);\n    this.renderer.setMuted(this.muted);\n    this.muteButton.setAttribute('aria-pressed', String(this.muted));\n    this.muteButton.textContent = this.muted ? this.options.copy.actions.unmute : this.options.copy.actions.mute;\n\n    this.bindEvents();\n")
rep("      this.muteButton.setAttribute('aria-pressed', String(this.muted));\n      this.muteButton.textContent = this.muted ? 'Unmute' : 'Mute';\n    }, { signal });\n\n    document.addEventListener('visibilitychange', this.handleVisibilityChange, { signal });\n", "      this.muteButton.setAttribute('aria-pressed', String(this.muted));\n      this.muteButton.textContent = this.muted ? this.options.copy.actions.unmute : this.options.copy.actions.mute;\n      void this.options.onMutedChange(this.muted);\n    }, { signal });\n\n")
rep("  private collectResult(): void {\n    if (this.stage !== 'test') return;\n    this.discovered.add(variantId(this.selected));\n    this.persistDiscovered();\n    this.updateDiscoveredUi();\n    this.setStage('collect');\n  }", "  private collectResult(): void {\n    if (this.activityBlocked || this.stage !== 'test') return;\n    const collectedVariantId = variantId(this.selected);\n    this.discovered.add(collectedVariantId);\n    this.updateDiscoveredUi();\n    void this.options.onVariantCollected(collectedVariantId);\n    this.setStage('collect');\n  }")
start = text.find("  private loadDiscovered(): void {")
end = text.find("  private updateDiscoveredUi(): void {", start)
if start < 0 or end < 0:
    raise SystemExit('legacy persistence block not found')
text = text[:start] + text[end:]
path.write_text(text)
