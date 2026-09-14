from pathlib import Path


def patch(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    if old not in text:
        raise SystemExit(f'missing {old!r} in {path}')
    target.write_text(text.replace(old, new, 1))


patch('README.md', '## Product thesis## Product thesis', '## Product thesis')
patch('README.md', '## Run## Run', '## Run')
patch(
    'README.md',
    'Working MVP direction remains approximately six reusable base shapes and around 24 curated recipes, with quality allowed to reduce the final count. That scale is not authorized until the current two-shape reuse gate passes.',
    'Working MVP direction remains approximately six reusable base shapes and around 24 curated recipes, with quality allowed to reduce the final count. Phase 5 validates progression on the current 12 combinations before representative content expansion and catalog scale.',
)
patch(
    'README.md',
    'Right now the goal is to falsify or confirm reusable multi-shape rendering with one second shape. If the heart needs bespoke physics, stages or a separate renderer path, stop catalog expansion and fix the renderer/content boundary before progression work.',
    'Right now the goal is to validate the progression/collection loop without hiding weak motivation behind currencies or more content. If the current 12-combination build does not create a clear next goal, fix progression pacing/UX before catalog expansion.',
)
patch('AGENTS.md', '## Product invariant## Product invariant', '## Product invariant')
patch(
    'AGENTS.md',
    '`PlatformRuntime.activity` remains the aggregate blocker source. Shape work must not create a second visibility policy.',
    '`PlatformRuntime.activity` remains the aggregate blocker source. Progression/collection work must not create a second visibility policy.',
)
patch('docs/CONTENT_AND_PROGRESSION.md', '## 3. Shape implementation rule## 3. Shape implementation rule', '## 3. Shape implementation rule')
