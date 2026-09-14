from pathlib import Path


def patch(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    if old not in text:
        raise SystemExit(f'missing target in {path}: {old[:120]!r}')
    target.write_text(text.replace(old, new, 1))


def section(path: str, start: str, end: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    a = text.find(start)
    b = text.find(end, a + len(start))
    if a < 0 or b < 0:
        raise SystemExit(f'missing section in {path}')
    target.write_text(text[:a] + new + text[b:])

patch('docs/PROGRESSION_COLLECTION_01.md', '**Status:** APPROVED FOR IMPLEMENTATION', '**Status:** IMPLEMENTED / STRUCTURAL PASS — PHONE ACCEPTANCE PENDING')
patch(
    'docs/PROGRESSION_COLLECTION_01.md',
    '  - `max(0, totalCrafts - uniqueCompletedCount)` contributes repeat XP;\n- write V2;',
    '  - `max(0, totalCrafts - uniqueCompletedCount)` contributes repeat XP;\n- floor migrated XP to the threshold required by the highest-rank already-completed recipe, so Phase-4 completions never become effectively re-locked;\n- write V2;',
)
patch(
    'docs/PROGRESSION_COLLECTION_01.md',
    '- award first-completion XP for each migrated completion;\n- write V2;',
    '- award first-completion XP for each migrated completion;\n- apply the same highest-completed-required-rank XP floor;\n- write V2;',
)
patch(
    'README.md',
    'Independent review: `docs/PROGRESSION_COLLECTION_01_REVIEW.md`.',
    'Independent pre-implementation review: `docs/PROGRESSION_COLLECTION_01_REVIEW.md`.\nIndependent implementation review: `docs/PROGRESSION_COLLECTION_01_IMPLEMENTATION_REVIEW.md`.',
)
patch(
    'README.md',
    '- `docs/PROGRESSION_COLLECTION_01_REVIEW.md` — independent pre-implementation challenge/corrections',
    '- `docs/PROGRESSION_COLLECTION_01_REVIEW.md` — independent pre-implementation challenge/corrections\n- `docs/PROGRESSION_COLLECTION_01_IMPLEMENTATION_REVIEW.md` — final structural diff review / phone gate',
)
patch(
    'AGENTS.md',
    '2. `docs/PROGRESSION_COLLECTION_01_REVIEW.md`\n3. `docs/IMPLEMENTATION_ROADMAP.md`',
    '2. `docs/PROGRESSION_COLLECTION_01_REVIEW.md`\n3. `docs/PROGRESSION_COLLECTION_01_IMPLEMENTATION_REVIEW.md`\n4. `docs/IMPLEMENTATION_ROADMAP.md`',
)
# Renumber remaining AGENTS read-first list only.
for old, new in [('4. `docs/CONTENT_AND_PROGRESSION.md`','5. `docs/CONTENT_AND_PROGRESSION.md`'),('5. `docs/TECHNICAL_DIRECTION.md`','6. `docs/TECHNICAL_DIRECTION.md`'),('6. `docs/GAMEPLAY.md`','7. `docs/GAMEPLAY.md`'),('7. `docs/DECISIONS.md`','8. `docs/DECISIONS.md`'),('8. `docs/PRODUCT.md`','9. `docs/PRODUCT.md`')]:
    patch('AGENTS.md', old, new)

section(
    'docs/TECHNICAL_DIRECTION.md',
    '## 8. Save model',
    '## 9. Mid-craft persistence',
    '''## 8. Save model\n\nPhase 5 uses the implemented progression save:\n\n```ts\ninterface SaveStateV2 {\n  readonly version: 2;\n  readonly completedVariantIds: readonly string[];\n  readonly totalCrafts: number;\n  readonly labXp: number;\n  readonly updatedAt: number;\n}\n```\n\nDerived state is deliberately not persisted:\n\n- `labRank` comes from `labXp`;\n- unlocked variant IDs come from Lab Rank;\n- collection card state comes from unlocked + completed truth.\n\nSettings remain separate:\n\n```ts\ninterface SettingsV1 {\n  readonly version: 1;\n  readonly muted: boolean;\n}\n```\n\nMigration order is V2 → previous production V1 → legacy slice data → fresh default. V1/legacy migration derives historical XP and floors it to the rank threshold required by the highest already-completed recipe, preserving effective access to all pre-progression completions.\n\nOriginal Soft Cube IDs and Phase-4 Heart IDs remain durable. Use shared `JsonStorageRepository` for JSON mechanics/write ordering while validation/migration/domain invariants remain Squishy-local.\n\n---\n\n'''
    + '## 9. Mid-craft persistence',
)
patch(
    'docs/TECHNICAL_DIRECTION.md',
    'Persist durable truth only:\n\n- completed/collected result;\n- later progression/unlock state;\n- total craft count;\n- settings.',
    'Persist durable truth only:\n\n- completed/collected result IDs;\n- Lab XP;\n- total craft count;\n- settings.\n\nRank and unlock arrays remain derived rather than persisted.',
)
patch(
    'docs/TECHNICAL_DIRECTION.md',
    'Phase 5 may revisit the exact completion point if progression/reload evidence shows that losing a revealed-but-uncollected result is materially harmful. If random staged outcomes are introduced later, then evaluate stronger pending-transaction semantics. Do not preemptively add them now.',
    'Phase 5 keeps Collect as the durable completion boundary: bootstrap computes/applies progression truth synchronously in memory and persists asynchronously, while UI feedback only visualizes that committed outcome. If later random staged outcomes are introduced, then evaluate stronger pending-transaction semantics. Do not preemptively add them now.',
)
patch(
    'docs/TECHNICAL_DIRECTION.md',
    '**Hard invariant:** shape differences are silhouette data. No `shape.id` condition may alter spring stiffness, grab/press response, damping, bulge, release behavior, craft progress math, audio behavior or state transitions during the Phase 4 reuse test.',
    '**Proven invariant:** shape differences are silhouette data. No `shape.id` condition should alter spring stiffness, grab/press response, damping, bulge, release behavior, craft progress math, audio behavior or state transitions without new evidence that the shared model itself must evolve.',
)
patch(
    'docs/TECHNICAL_DIRECTION.md',
    'If the second shape needs bespoke deformation tuning to look acceptable, treat that as failed reuse evidence rather than hiding it in optional `softness`/`bulge` fields.\n\nLater catalog evidence may justify additional shared shape metadata, but only after the second-shape gate passes and only when every relevant consumer applies it consistently.',
    'The accepted Soft Heart passed without bespoke deformation tuning. Later catalog evidence may justify additional shared shape metadata only when every relevant consumer applies it consistently; do not normalize one-off per-shape physics knobs.',
)
patch(
    'docs/IMPLEMENTATION_ROADMAP.md',
    '- `PROGRESSION_COLLECTION_01_REVIEW.md`',
    '- `PROGRESSION_COLLECTION_01_REVIEW.md`\n- `PROGRESSION_COLLECTION_01_IMPLEMENTATION_REVIEW.md`',
)
