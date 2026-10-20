# Audit follow-up — 20 October 2026

Owner approved all six findings and the small feel/Ideas improvements in one implementation pass. Source review: `INDEPENDENT_AUDIT_2026-10-20.md`, audited production `f4d97c4`.

## Plan and acceptance

1. Collection integrity: origin-scoped exclusive read/write/journal cleanup; three-way merge of unrelated changes; reject conflicting toy edits without losing the open draft; preserve rewards/capacity; keep one previous complete generation. Recovery exports original data and offers an explicitly confirmed previous-save restore only when a complete backup exists. No automatic reset.
2. Room/editor UX: usable mobile catalog during unpaid pedestal preview, visible actions in both orientations/languages, reliable focus after removing preview, complete sticker labels. Preserve room proportions and 44px targets.
3. Small feel changes: short nonblocking saved confirmation (respect reduced motion); add-more route back to the previous detail catalog; retain catalog scroll position.
4. Ideas: authored arrangements from existing free assets, stable idea IDs/completion rules, one visible preview rendered per frame, no eager hidden-page rasters.
5. Verification: corrected audit reproductions, additional storage interleavings/conflicts/rollback tests, EN/RU phone/landscape/desktop inspection, release/build/upload audit, browser regression suite and visual regression. Inspect final diff, PR gates, then merge and verify Pages. Real phone/native GPU/hosted Yandex ads remain separate acceptance.

## Implementation decisions

- Web Locks serialize same-origin collection access. Node-only tests use a realm queue. A browser lacking Web Locks refuses unsafe writes instead of relying on an expiring lease that a suspended tab could outlive. Cross-device cloud synchronization is not claimed.
- The caller's loaded base determines its intended edits. Independent toy additions and monotonic entitlement metadata merge with current storage; edits/deletions of a concurrently changed toy conflict. The UI offers saving a copy. A newly full collection refreshes the existing explicit replacement flow.
- Reward transactions use a separate origin lock and reread current state before an offer; collection lock is held only for storage operations, not advertisements.
- One previous manifest and its referenced records are retained. Cleanup protects both generations. Recovery preserves the damaged manifest and will not roll back a collection already repaired by another tab.
- Decor shows a compact pedestal-preview management row; the explicit video-reward controls remain on the Pedestals tab. Done redirects to those controls when preview ownership is unresolved. No ad starts implicitly.
- Eight existing idea IDs receive free accessory/face arrangements and short names; the maker starts with those decorative details. Existing shape/paint/material/filling completion rules and all IDs remain intact.

## Validation

Implementation checkpoints: `8683dd1d12be19e425d3c5ff61feb6e4c42c6f62` (storage) and `c84216ea10fdaf2347d7e175bfe0b95a43f3ccb2` (UI integration). Final follow-up also protects an open editor when an ad refreshes repository state and avoids rereading unchanged toy records.

- Local `release:check`: passed, 177 Yandex files / 5,215,187 bytes; existing limit unchanged.
- Nine storage regression cases passed, including interrupted commit, concurrent updates, recovery, and unchanged-record reads. Existing incremental-write/migration tests also passed.
- Seventeen browser regression cases cover mobile/landscape/desktop in RU/EN, real two-tab saves and edit conflicts, last-slot replacement cancellation, reward-time conflicts, recovery export/confirmation, labels, focus, saved feedback and Add more. Targeted runs passed; the last RU screenshot journey required a 90-second overall test budget under software WebGL (individual assertions retain their normal limits).
- Visual baselines intentionally change only the six Ideas screenshots. Full browser/visual and alternate-entrypoint gates must pass on the implementation PR before merge; deployment is established by its post-merge workflow, not by this document.
- Browser evidence uses Chromium with software WebGL. Real phone tactile acceptance and hosted Yandex advertising remain separate.

## Screenshots

- [Phone pedestal preview](evidence/audit-fixes-2026-10-20/room-preview-phone.png)
- [Short landscape preview](evidence/audit-fixes-2026-10-20/room-preview-landscape.png)
- [Explicit unlock controls](evidence/audit-fixes-2026-10-20/room-unlock-phone.png)
- [Add more and selected detail](evidence/audit-fixes-2026-10-20/add-more-phone.png)
- [Saved confirmation](evidence/audit-fixes-2026-10-20/saved-phone.png)
- [Visible Ideas](evidence/audit-fixes-2026-10-20/ideas-phone.png)
