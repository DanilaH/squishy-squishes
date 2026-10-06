# Library showcase — owner-approved scope, 6 October 2026

The owner rejected the previous atmosphere pass as a complete Library redesign:
its small props were scattered on the floor and the two large podiums dominated
the collection. The earlier free-craft release is shipped; this is a separate,
explicitly approved presentation iteration.

## Approved result

- A common compact display shelf. Desktop shows the eight ordinary collection
  places together where space permits; portrait/short screens scroll only the
  catalog. The page, table and primary actions remain fixed.
- One selected toy on a table. Selection keeps the shelf available and uses the
  existing lazy Phaser maker, material shader, input and tactile constants.
  Editing opens the existing Studio; no per-card on-screen renderer is added.
- Supplies belong on furniture, not scattered on the floor. Rounded furniture,
  pastel volume, highlights and contact shadows support the toys.
- Legible selected shape/material, creation from empty places, editing and
  confirmed deletion. Existing eight slots and optional rewarded ten remain.
- Empty, one-toy and full collections, oversized free decor, EN/RU, portrait,
  short landscape and desktop must be reviewed. Save/edit/delete/reload and
  lifecycle/input cancellation must pass before publication.

## Implementation and acceptance

- [x] Feature branch created from published main without local changes.
- [x] Initial display shelf, selected snapshot and inline shared Squeeze wired.
- [x] Responsive composition visually reviewed and corrected.
- [x] Focused selection, gestures, editor promotion, modal and saved-data regressions pass.
- [x] Existing browser/Pages gates adapted to the changed collection navigation,
  retaining specimen, save and input coverage.
- [ ] Strict release check, full browser QA and reviewed visual comparisons pass.
- [ ] Independent final diff review and required exact-head PR checks pass.
- [ ] Merge, actual Pages deployment and public-address acceptance verified.

No new progression, materials, shapes, reward policy, toy naming or selectable
stands are included. This checklist records work and approval, not deployment.

## Verification evidence

- `release:check`: strict TypeScript, CI contract tests, asset smoke, web/Yandex
  builds and upload-root audit passed locally. Original owner art hashes retained.
- 12 focused showcase/free-content cases passed: EN/RU across desktop, portrait
  and short landscape; saved data unchanged, deletion dialog blocks the live toy,
  editing promotes the same maker, oversized wings/handbag fit the table camera.
- Full release/Pages suites and six reviewed Library UI baseline replacements
  remain release gates. Other stage snapshots, tolerances and retries are unchanged.

- Reviewed visual comparison: all six cases / 30 stage snapshots passed locally;
  CI also accepted the six Library replacements without tolerance changes.
- Unmasked workshop camera: 18 cases passed locally. Independent shelf geometry
  passed all 11 viewports with both empty and genuinely saved collections.
- Isolated ad cadence and desktop stroking/blink scenarios passed with unchanged
  time budgets. Concurrent local browser runs hit timing limits; full final-head
  browser/Pages acceptance remains in [PR #93](https://github.com/DanilaH/squishy-squishes/pull/93).
