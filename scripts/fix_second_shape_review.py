from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    if old not in text:
        raise SystemExit(f'Missing expected snippet in {path}: {old!r}')
    target.write_text(text.replace(old, new, 1))


replace_once(
    'src/game/VerticalSliceApp.ts',
    """    let nextX = 0;
    let nextY = 0;
    for (let attempt = 0; attempt < 16; attempt += 1) {
      const candidateX = (Math.random() * 2 - 1) * 0.68;
      const candidateY = (Math.random() * 2 - 1) * 0.68;
      const inside = isPointInsideShape(getShape(this.selected.shape), candidateX, candidateY);
      const separated = Math.hypot(candidateX - this.moldTargetX, candidateY - this.moldTargetY) >= 0.34;
      if (!inside || !separated) continue;
      nextX = candidateX;
      nextY = candidateY;
      break;
    }

    this.moldTargetX = nextX;
    this.moldTargetY = nextY;
""",
    """    const shape = getShape(this.selected.shape);
    let nextX = 0;
    let nextY = 0;
    let found = false;
    for (let attempt = 0; attempt < 16; attempt += 1) {
      const candidateX = (Math.random() * 2 - 1) * 0.68;
      const candidateY = (Math.random() * 2 - 1) * 0.68;
      const inside = isPointInsideShape(shape, candidateX, candidateY);
      const separated = Math.hypot(candidateX - this.moldTargetX, candidateY - this.moldTargetY) >= 0.34;
      if (!inside || !separated) continue;
      nextX = candidateX;
      nextY = candidateY;
      found = true;
      break;
    }

    if (!found) {
      let bestDistance = -1;
      for (let y = -0.56; y <= 0.56; y += 0.28) {
        for (let x = -0.56; x <= 0.56; x += 0.28) {
          if (!isPointInsideShape(shape, x, y)) continue;
          const distance = Math.hypot(x - this.moldTargetX, y - this.moldTargetY);
          if (distance <= bestDistance) continue;
          bestDistance = distance;
          nextX = x;
          nextY = y;
          found = true;
        }
      }
    }

    if (!found) return;

    this.moldTargetX = nextX;
    this.moldTargetY = nextY;
""",
)
