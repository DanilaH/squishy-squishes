from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    if old not in text:
        raise SystemExit(f'Missing expected snippet in {path}: {old!r}')
    target.write_text(text.replace(old, new, 1))


replace_once(
    'src/game/VerticalSliceApp.ts',
    "    if (this.stage !== 'mold' || this.moldComplete || document.hidden) return;",
    "    if (this.activityBlocked || this.stage !== 'mold' || this.moldComplete) return;",
)
replace_once(
    'src/i18n/ru.ts',
    "    mute: 'Звук',",
    "    mute: 'Выключить звук',",
)

replace_once(
    'docs/IMPLEMENTATION_ROADMAP.md',
    '**Status:** APPROVED START SEQUENCE  \n**Primary gate:** complete one real loop before productionizing the whole game.',
    '**Status:** ACTIVE PRODUCTION ROADMAP\n**Current gate:** Production Skeleton 01. Vertical Slice 01 and interaction correction passes are complete; the next gate is one materially different second shape.',
)
replace_once(
    'docs/IMPLEMENTATION_ROADMAP.md',
    '## Phase 1 — Vertical Slice 01: one shape, full loop',
    '## Phase 1 — Vertical Slice 01: one shape, full loop — COMPLETE',
)
replace_once(
    'docs/IMPLEMENTATION_ROADMAP.md',
    '## Phase 2 — Full-loop correction pass',
    '## Phase 2 — Full-loop correction pass — COMPLETE',
)
replace_once(
    'docs/IMPLEMENTATION_ROADMAP.md',
    '## Phase 3 — Production skeleton and boundary extraction',
    '## Phase 3 — Production Skeleton 01 — ACTIVE',
)
replace_once(
    'docs/IMPLEMENTATION_ROADMAP.md',
    '- move shared dependency to reviewed `mini-games-kit@d17ba31fce2a71335dcc3095f772c3fdd87fe97b`;',
    '- preserve the already-pinned reviewed `mini-games-kit@d17ba31fce2a71335dcc3095f772c3fdd87fe97b` production dependency;',
)

replace_once(
    'docs/PRODUCT.md',
    '**Status:** PRE-DEVELOPMENT PROPOSAL  \n**Decision state:** tactile core PASS; product scope awaiting final user confirmation',
    '**Status:** ACTIVE MVP SPEC\n**Decision state:** tactile core + full loop PASS; Production Skeleton 01 active',
)
replace_once(
    'docs/CONTENT_AND_PROGRESSION.md',
    '**Status:** PRE-DEVELOPMENT PROPOSAL  \n**Important:** exact names, XP values and unlock thresholds are not final until `PREIMPLEMENTATION_REVIEW.md` is resolved.',
    '**Status:** APPROVED DIRECTION / DEFERRED UNTIL AFTER SECOND-SHAPE GATE\n**Important:** exact names, XP values and unlock thresholds remain provisional until the production shell and second-shape reuse gate are complete.',
)
replace_once(
    'docs/TECHNICAL_DIRECTION.md',
    '**Status:** PRE-DEVELOPMENT PROPOSAL',
    '**Status:** ACTIVE PRODUCTION DIRECTION — current bounded implementation is `PRODUCTION_SKELETON_01.md`',
)
