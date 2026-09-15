# Sandbox Pivot S2 — Visual Review

**Status:** VISUALLY ACCEPTED FOR PR
**Phase:** S2 — Personal Library
**Final evidence run:** `34962829873`
**Artifact:** `sandbox-s2-modal-fix-visuals`

## Verdict

S2 passes visual acceptance for the production shell.

The personal Library reads as a toy shelf rather than a technical inventory, saved authored toys are distinguishable enough to choose without a face/decal system, `New Squishy` stays obvious at both empty and full capacity, and destructive decisions are explicit.

This is not physical-phone acceptance. Real touch/device review remains a separate release gate.

## Reviewed production states

The final production capture contains:

1. empty Library — phone portrait;
2. three-toy Library — phone portrait;
3. delete confirmation — phone portrait;
4. a non-latest saved toy opened directly into Squeeze;
5. full eight-toy Library — phone portrait;
6. full-Library replacement decision — phone portrait;
7. full Library — short landscape;
8. three-toy Library — desktop.

## What worked

### Empty shelf

The empty state communicates ownership and creation rather than locked content. Capacity is visible but secondary, while the large central `New Squishy` action provides a clear first action.

### Authored-toy cards

The cheap 2D preview is sufficient for S2:

- silhouette communicates shape;
- authored paint and mix-ins remain visible;
- material treatment provides additional differentiation;
- no per-card WebGL surface is required;
- delete remains secondary to opening/squeezing the toy.

The cards therefore satisfy the S2 requirement without creating a second renderer or a permanent multi-WebGL shelf.

### Full shelf

Eight toys still read as owned creations rather than a dense database table. The top-level `New Squishy` action remains available at 8 / 8, correctly communicating that capacity does not block creation.

### Landscape and desktop

The shelf expands to four columns and keeps previews large enough to identify. The layout does not collapse into an eight-column inventory strip.

## Defect found during visual review

The first production visual capture exposed a real S2 defect in delete and replacement modals:

- modal color variables were defined on `.sandbox-library-shell`;
- modals are mounted as siblings rather than descendants of that shell;
- the variables therefore did not resolve inside the modal subtree;
- headings, explanatory copy and card labels inherited unsuitable light global colors and became nearly unreadable on the warm sheet.

This was a decision-safety/accessibility defect, not a cosmetic preference, because both screens govern destructive persistence operations.

## Bounded fix

The fix intentionally stayed inside S2 presentation:

- define the Library ink/muted/line tokens on `.sandbox-library-modal` as well;
- explicitly preserve dark readable modal heading/card text;
- preserve muted but readable explanatory copy;
- compact the phone replacement chooser to four columns so all eight existing toys and `KEEP IT` are visible in one decision surface on 390px portrait.

No card identity system, face/decal system, renderer change or persistence behavior was added.

## Final modal verdict

### Delete

PASS.

The chosen toy remains visually present, the question is readable, `KEEP IT` is the safe secondary action, and `DELETE` is visually destructive without dominating the whole screen.

### Replacement

PASS.

At full capacity the phone dialog now shows:

- the 8 / 8 state;
- a readable explanation that nothing changes until a toy is chosen;
- all eight replacement candidates simultaneously;
- an explicit `Replace` action on each candidate;
- a visible `KEEP IT` cancellation path.

This matches the persistence contract and avoids making the player scroll just to discover the safe exit.

## S3 evidence, not an S2 blocker

Without faces, decals or anchored accessories, authored toys are visually distinguishable but still have limited character/personality. The current shelf is functionally strong enough for ownership and selection, yet there is clear headroom for emotional identity.

That is useful evidence for **S3 — Decor MVP**. It is not justification to expand S2 with a face/accessory subsystem.

## Final visual decision

**PASS / freeze S2 shell.**

Do not reopen the Library layout from desktop preference alone. The next visual uncertainty is the planned S3 identity layer plus real-device touch/scale feel.
