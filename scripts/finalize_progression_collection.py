from pathlib import Path
import re


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    if old not in text:
        raise SystemExit(f'missing replacement target in {path}: {old[:140]!r}')
    target.write_text(text.replace(old, new, 1))


def replace_section(path: str, start: str, end: str, replacement: str) -> None:
    target = Path(path)
    text = target.read_text()
    start_index = text.find(start)
    end_index = text.find(end, start_index + len(start))
    if start_index < 0 or end_index < 0:
        raise SystemExit(f'missing section markers in {path}: {start!r} -> {end!r}')
    target.write_text(text[:start_index] + replacement + text[end_index:])


# Independent implementation-review corrections.
replace_once(
    'src/styles.css',
    '.collection-summary {\n  pointer-events: auto;\n  min-width: min(330px, 50vw);\n}',
    '.collection-summary {\n  pointer-events: none;\n  min-width: min(330px, 50vw);\n}',
)
replace_once(
    'src/styles.css',
    '.collection-open-button {\n  padding: 6px 9px;\n  font-size: 10px;\n}',
    '.collection-open-button {\n  pointer-events: auto;\n  padding: 6px 9px;\n  font-size: 10px;\n}',
)
replace_once(
    'src/styles.css',
    '.collection-open-button:disabled {\n  opacity: 0.36;\n  cursor: default;\n}',
    '.collection-open-button:disabled {\n  pointer-events: none;\n  opacity: 0.36;\n  cursor: default;\n}',
)
styles = Path('src/styles.css')
styles.write_text(styles.read_text() + '''\n\n@media (prefers-reduced-motion: reduce) {\n  .rank-progress__fill {\n    transition: none;\n  }\n}\n''')
replace_once(
    'src/game/VerticalSliceApp.ts',
    "    this.collectionButton.disabled = next !== 'select';",
    "    this.collectionButton.disabled = next !== 'select' || this.activityBlocked;",
)

# Close Phase 4 and make Phase 5 the active documentation gate.
readme_active = '''**Current status:** tactile core PASS; full-loop slice PASS; interaction correction passes PASS; Production Skeleton 01 PASS; Renderer Reuse / Second Shape PASS; **Progression + Collection 01 is the active gate**.\n\nCurrent accepted loop:\n\n`select → paint base → optional foam shake → stretch/mix → form with normal taps + crit targets → reveal → free squeeze → Collect → visible progression → repeat`\n\n## Active gate — Progression + Collection 01\n\nThe current job is to prove the “one more squishy” layer on the already accepted two-shape renderer before representative content expansion.\n\nBounded scope:\n\n- keep Soft Cube + Soft Heart and the current 12 deterministic combinations;\n- introduce derived Lab Rank / Lab XP progression with deterministic unlocks;\n- migrate production save V1 to V2 without losing access to previously completed content;\n- add a compact locked / available / completed collection overlay;\n- let completed items reopen the existing finished-object squeeze state;\n- award stronger first-completion XP and smaller repeat XP;\n- surface concise rank/unlock/milestone feedback after Collect;\n- no currency, shop, ads, third shape, new material family or bespoke recipe gameplay;\n- strict typecheck/build plus independent final diff review before merge;\n- deployed phone check before Phase 5 is marked fully complete.\n\nCanonical implementation spec: `docs/PROGRESSION_COLLECTION_01.md`.\nIndependent review: `docs/PROGRESSION_COLLECTION_01_REVIEW.md`.\n\nRenderer Reuse / Second Shape is complete: Soft Cube and Soft Heart share one shape/deformation/material/craft path, and the merged phone build was accepted on 2026-09-14.\n\n'''
replace_section('README.md', '**Current status:**', '## Product thesis', readme_active + '## Product thesis')
replace_section(
    'README.md',
    '## Documentation',
    '## Run',
    '''## Documentation\n\nCurrent execution order:\n\n- `docs/PROGRESSION_COLLECTION_01.md` — active Phase 5 implementation contract\n- `docs/PROGRESSION_COLLECTION_01_REVIEW.md` — independent pre-implementation challenge/corrections\n- `docs/IMPLEMENTATION_ROADMAP.md` — full phase order and gates\n- `docs/CONTENT_AND_PROGRESSION.md` — active supporting progression/content direction\n- `docs/TECHNICAL_DIRECTION.md` — long-term boundaries\n- `docs/GAMEPLAY.md` — interaction grammar\n- `docs/PRODUCT.md` — product thesis/scope\n- `docs/ART_DIRECTION.md` — visual identity\n- `docs/ANALYTICS_AND_MONETIZATION.md` — later analytics/ad posture\n- `docs/QA_AND_ACCEPTANCE.md` — release validation\n\nCompleted production/reuse evidence:\n\n- `docs/PRODUCTION_SKELETON_01.md`\n- `docs/PRODUCTION_SKELETON_01_REVIEW.md`\n- `docs/RENDERER_REUSE_SECOND_SHAPE.md`\n- `docs/RENDERER_REUSE_SECOND_SHAPE_REVIEW.md`\n- `docs/RENDERER_REUSE_SECOND_SHAPE_IMPLEMENTATION_REVIEW.md`\n\nHistorical tactile/slice evidence remains under `docs/` and is not the active implementation contract.\n\n'''
    + '## Run',
)

replace_section(
    'AGENTS.md',
    'The tactile thesis,',
    '## Product invariant',
    '''The tactile thesis, Vertical Slice 01, interaction correction passes 02–04, Production Skeleton 01 and Renderer Reuse / Second Shape have **PASSED**. The active gate is now **Progression + Collection 01**.\n\nRead first:\n\n1. `docs/PROGRESSION_COLLECTION_01.md`\n2. `docs/PROGRESSION_COLLECTION_01_REVIEW.md`\n3. `docs/IMPLEMENTATION_ROADMAP.md`\n4. `docs/CONTENT_AND_PROGRESSION.md`\n5. `docs/TECHNICAL_DIRECTION.md`\n6. `docs/GAMEPLAY.md`\n7. `docs/DECISIONS.md`\n8. `docs/PRODUCT.md`\n\nProduction Skeleton 01 remains the architecture baseline and the two-shape reuse gate is accepted evidence. Older probe/slice documents remain evidence, not active instructions.\n\n## Current task invariant\n\nProve that the accepted tactile loop creates a clear durable “one more squishy” motivation without importing an economy or new content-production burden.\n\nAccepted loop becomes:\n\n`select unlocked recipe → tactile craft → reveal → squeeze → Collect → XP/unlock feedback → next visible goal → repeat`\n\nCurrent Phase 5 scope:\n\n- keep exactly the current two shapes and 12 combinations;\n- add one derived Lab XP / Lab Rank track;\n- deterministic unlock table;\n- SaveState V2 with V1/legacy migration;\n- collection read model with locked / available / completed states;\n- one compact collection overlay;\n- completed-item revisit through the existing test/squeeze state;\n- pure edge-triggered milestone resolution;\n- concise post-Collect feedback.\n\nDo not add currency, shop, crafting costs, ads, third shape, new materials/fillings, quests, duplicate systems, a router, another renderer, or bespoke per-recipe gameplay.\n\n## Review blocker rule\n\nProgression truth must remain domain-derived rather than scattered through DOM handlers. `labRank` and unlock arrays are derived from XP and must not be persisted redundantly. Collection cards must not create WebGL renderer instances. Revisit/free-squeeze must not mutate XP/save.\n\nSave migration must preserve effective access to every previously completed recipe, including Phase-4 completions that now have a higher required rank.\n\n'''
    + '## Product invariant',
)
replace_once(
    'AGENTS.md',
    'Phase 4 does **not** bump the save schema. Original variant IDs remain valid; new heart IDs extend the accepted set.',
    'Phase 5 bumps production save to V2 only to add `labXp`. Original square and heart variant IDs remain stable. Rank and unlocked IDs stay derived rather than persisted.',
)

replace_once('docs/PRODUCT.md', '**Decision state:** tactile core + full loop + Production Skeleton PASS; Renderer Reuse / Second Shape active', '**Decision state:** tactile core + full loop + Production Skeleton + Renderer Reuse PASS; Progression + Collection active')
replace_once('docs/TECHNICAL_DIRECTION.md', '**Status:** ACTIVE PRODUCTION DIRECTION — current bounded implementation is `RENDERER_REUSE_SECOND_SHAPE.md`', '**Status:** ACTIVE PRODUCTION DIRECTION — current bounded implementation is `PROGRESSION_COLLECTION_01.md`')

roadmap = Path('docs/IMPLEMENTATION_ROADMAP.md')
rtext = roadmap.read_text()
rtext = rtext.replace('**Current gate:** Phase 4 — Renderer Reuse / Second Shape\n**Previous gate:** Phase 3 — Production Skeleton 01 — COMPLETE', '**Current gate:** Phase 5 — Progression + Collection 01\n**Previous gate:** Phase 4 — Renderer Reuse / Second Shape — COMPLETE')
rtext = rtext.replace('The tactile probe, complete vertical slice, production renderer pass, evidence-backed interaction corrections and production-shell extraction have passed. The project is now testing whether the high-CMF content thesis survives a materially different second silhouette before progression/catalog scale is allowed.', 'The tactile probe, complete vertical slice, production shell and two-shape renderer-reuse gate have passed. Soft Cube + Soft Heart share the same deformation/material/craft path and the merged phone build was accepted. The project is now validating the one-more-squishy progression/collection loop before representative content expansion.')
rtext = rtext.replace('## Phase 4 — Renderer Reuse / Second Shape — ACTIVE', '## Phase 4 — Renderer Reuse / Second Shape — COMPLETE')
rtext = rtext.replace('## Phase 5 — Progression + Collection\n\n### Goal', '## Phase 5 — Progression + Collection — ACTIVE\n\nCanonical bounded spec:\n\n- `PROGRESSION_COLLECTION_01.md`\n- `PROGRESSION_COLLECTION_01_REVIEW.md`\n\n### Goal')
rtext = rtext.replace('If this fails, repair the renderer/content boundary before adding more shapes.\n\n---\n\n## Phase 5', 'Phone acceptance on the merged Pages build passed on 2026-09-14. The renderer/content reuse gate is closed; future shape work must preserve the same shared path.\n\n---\n\n## Phase 5')
roadmap.write_text(rtext)

replace_once(
    'docs/CONTENT_AND_PROGRESSION.md',
    '**Status:** APPROVED DIRECTION / DEFERRED UNTIL AFTER SECOND-SHAPE GATE\n**Important:** exact names, XP values and unlock thresholds remain provisional until the production shell and second-shape reuse gate are complete.',
    '**Status:** ACTIVE SUPPORTING DIRECTION — Phase 5 Progression + Collection\n**Important:** `PROGRESSION_COLLECTION_01.md` defines the bounded 12-recipe validation tuning. Its XP values/unlock order are test parameters, not final launch balance.',
)
replace_section(
    'docs/CONTENT_AND_PROGRESSION.md',
    '## 2. Base shapes',
    '## 3. Shape implementation rule',
    '''## 2. Base shapes\n\n### Proven production shapes\n\n1. **Soft Cube** — accepted baseline; strong deformation readability.\n2. **Soft Heart** — accepted second silhouette; materially different concave outline on the same renderer/deformation path. It is now a real MVP candidate, not a disposable technical test.\n\n### Remaining MVP candidates\n\n- **Mochi / Dumpling** — rounded soft starter; immediately reads as squeezable.\n- **Peach / Fruit Puff** — asymmetric silhouette with a small cleft/detail.\n- **Mushroom** — broad cap + thick stem; visually distinctive under squash.\n- **Paw** — recognizable tactile silhouette; pads can support subtle material accents.\n- **Blob Creature** — abstract designer-toy form for stranger/adult-neutral recipes.\n\nThe old planning list predated the successful Heart reuse gate. The final six launch shapes are therefore **not locked yet**: Soft Heart remains in contention and one of the remaining candidates may be cut after representative content/material expansion. Do not discard a proven low-burden shape merely to preserve the old count.\n\n### Reserve / post-MVP candidates\n\n- Cloud / Pillow\n- Capsule / Pebble\n\nDo not increase the launch target above roughly six shapes before the content system proves cheap and stable.\n\n'''
    + '## 3. Shape implementation rule',
)

replace_once('docs/RENDERER_REUSE_SECOND_SHAPE.md', '**Status:** ACTIVE BOUNDED IMPLEMENTATION', '**Status:** COMPLETE / ACCEPTED — structural + phone gate passed 2026-09-14')
replace_once('docs/RENDERER_REUSE_SECOND_SHAPE_IMPLEMENTATION_REVIEW.md', '**STRUCTURAL PASS. PHONE PRODUCT ACCEPTANCE PENDING.**', '**PASS — STRUCTURAL + PHONE PRODUCT ACCEPTANCE.**')
replace_once(
    'docs/RENDERER_REUSE_SECOND_SHAPE_IMPLEMENTATION_REVIEW.md',
    'Do **not** mark the whole Phase 4 product gate complete until the merged GitHub Pages build is exercised on phone for edge quality, heart-notch deformation, paint fairness, layout and responsiveness.',
    'The merged GitHub Pages build was subsequently exercised on phone and accepted by the project owner on 2026-09-14. Phase 4 is therefore complete; remaining visual tuning is ordinary later polish, not a reuse-gate blocker.',
)
