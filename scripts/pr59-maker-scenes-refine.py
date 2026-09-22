from pathlib import Path


def change(path, before, after):
    file = Path(path)
    body = file.read_text()
    if body.count(before) != 1:
        raise RuntimeError(f'{path}: expected one exact match for {before[:75]!r}, found {body.count(before)}')
    file.write_text(body.replace(before, after))

# Desktop Decor's last 45px of the CTA was below the tray. Make the *shared*
# control track tall enough on every step; do not special-case Decor geometry.
p = 'src/experiments/phaser/studioEnvironmentPreview.css'
with Path(p).open('a') as f:
    f.write('''
/* Desktop: the whole Decor panel including its CTA remains in the shared tray. */
@media (min-width: 901px) and (min-height: 640px) {
  #app[data-studio-env-ready] .sandbox-shell.studio-env-active {
    --studio-controls-height: clamp(290px, 40dvh, 356px);
  }
}
''')

# Old compact desktop test encoded a particular old stage height. Under the
# stable grid, the wood front is now predominantly INSIDE the workbench: test
# the actual visible area, not a minimum overlap beyond its former bottom.
p = 'tests/phaser-pages/studio-environment-integration.spec.ts'
change(p, '''    // Verify a *substantial* tabletop extends past the former clipping edge;
    // the previous 20px strip incorrectly passed a Boolean visibility test.
    expect(facts.desk.y + facts.desk.height * 0.41 - facts.stage.bottom,
      `${label}: real tabletop/front must extend beyond stage by >=70px`).toBeGreaterThanOrEqual(70);''', '''    // Fixed tracks make the desk visible inside the stage rather than forcing
    // it to protrude beyond its bottom. Still reject a 20px token strip.
    expect(Math.min(facts.desk.y + facts.desk.height * 0.41, facts.stage.bottom) - facts.desk.y,
      `${label}: >=70px of real tabletop/front stays visible`).toBeGreaterThanOrEqual(70);''')

# The Finish preview intentionally has pointer-events:none so it cannot
# intercept material buttons. All interactive maker and Squeeze stages MUST
# still hit the actual canvas (not the passive SVG/PNG props).
p = 'tests/phaser-pages/studio-workshop-consistency.spec.ts'
change(p, "            canvasHit: !!hit && canvas.contains(hit),", "            canvasHit: !!hit && canvas.contains(hit), canvasDisabled: canvas.classList.contains('is-disabled'),")
change(p, "        expect(result.canvasHit, `${device.name}/${name} keeps Phaser input`).toBe(true);", '''        if (actualStage === 'finish') {
          expect(result.canvasDisabled, `${device.name}/${name} intentionally disables squeeze`).toBe(true);
          expect(result.canvasHit, `${device.name}/${name} does not intercept material controls`).toBe(false);
        } else {
          expect(result.canvasHit, `${device.name}/${name} keeps Phaser input`).toBe(true);
        }''')
