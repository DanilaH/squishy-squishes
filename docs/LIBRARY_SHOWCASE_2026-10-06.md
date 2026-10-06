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
- [x] Strict release check, full browser QA and reviewed visual comparisons pass.
- [x] Independent final diff review and required exact-head PR checks pass.
- [x] Merge, actual Pages deployment and public-address acceptance verified.

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
- Final shelf sizing passed all four full-flow localized control audits and the
  11-viewport geometry matrix again (five cases), retaining the original caption,
  hit-target, page overflow and pixel-contact assertions.
- All four Jelly UI cases and five workshop continuity cases passed locally
  after adapting the compact heading and inline saved-toy path. The original
  Studio geometry assertions remain, with added inline gesture/save checks.
- Final CI diagnosed missing Library release feedback and a delayed Studio grid
  on editor promotion. Feedback now uses the existing Hall light layer; Studio
  prepares its already loaded art while inline and applies its layout before
  the next paint. No material response constants or save fields changed.
- Complete Pages, Library Hall, visual, Cozy, Candidate and DRAFT gates passed
  for the final runtime. Browser QA isolated one tracing-sensitive stroking test:
  its metrics decayed after motion before sequential assertions. The test now
  records both original thresholds together during the active gesture and uses
  untraced Node waits between CDP touch events. Three CI-mode repeats passed
  locally; final-head acceptance still requires all PR gates.

## Publication — 6 October 2026

[PR #93](https://github.com/DanilaH/squishy-squishes/pull/93) merged after all five
exact-head workflows passed at `44a33311ccefd5240b47b1c2c7e5c2e4eed70d45`.
The final browser shard accepted all 65 cases without retries.

Published game source: `bbbd05c90ab4757098f993e61a2ef26f2f1e17ec`;
Pages branch: `40591d77ed071d557d61f2571394b50cb371e3aa`.
[Postmerge release](https://github.com/DanilaH/squishy-squishes/actions/runs/37439950147)
verified the identical PR tree/build, deployed it, compared the public entry
bytes and passed hosted touch editing, save and reload. Postmerge Candidate
and DRAFT workflows also passed.

Independent public response check: HTML and entry returned HTTP 200;
`/squishy-squishes/assets/index-DC_oLFg-.js` SHA-256:
`5e751b5eb8d3d8148e0e2db678edee50c6f8939b0512dfe156e656fafa8bb5ac`.
A browser using the environment's trusted proxy transport opened the actual
public Library, selected two saved toys, squeezed them and checked the modal,
fixed table and unchanged save. Its extended scenario exceeded the local
proxy time budget, so it is not claimed as an eight-case hosted pass. The
required GitHub hosted browser gate passed; real-phone tactile acceptance
remains the player's check.

[Open the published game](https://danilah.github.io/squishy-squishes/?v=bbbd05c90ab4757098f993e61a2ef26f2f1e17ec).
This follow-up is complete; earlier pending gate bullets above are historical
verification evidence, not additional implementation tasks.
