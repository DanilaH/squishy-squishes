# Sandbox Pivot S2 — Pre-Implementation Review

**Reviewed spec:** `SANDBOX_PIVOT_S2_LIBRARY.md`
**Verdict:** **PASS WITH HARD CONSTRAINTS**

S2 is the right next phase because S1 already proves one authored toy end-to-end. The next product question is retention/ownership breadth, not another creation mechanic.

## What is strong

### 1. Multi-slot behavior extends V3 instead of inventing a new persistence layer

The current V3 envelope already has `library[]` and bounded capacity. S2 should add pure library operations and player UX, not another schema migration.

### 2. Full-capacity behavior avoids a monetization/deletion trap

Allowing `New Squishy` at full capacity and deferring replacement selection until Save preserves creative flow. It is materially better than forcing the player to delete something before they are allowed to create.

### 3. Replacement is transactional

No old toy is removed before explicit choice. Cancel returns to Finish with the authored draft still alive. This is the correct destructive-data model.

### 4. Thumbnail rendering is deliberately cheap

A 2D reconstruction from shared shape boundary + authored appearance is enough for shelf identity. Eight independent WebGL surfaces would add lifecycle/context/performance burden with almost no S2 product value.

### 5. S2 has a real measurement gate

The phase must produce actual 1/8/24 serialized V3 measurements. This prevents the existing `MAX_LIBRARY_CAPACITY = 24` decoder safety bound from accidentally becoming an unsupported product promise.

---

## Hard constraints before implementation

### HC1 — Library mutations must be pure domain helpers

UI code must not directly splice/replace V3 arrays and manually update counters in several handlers. Add tested immutable operations for append, replacement and deletion.

### HC2 — No data loss before confirmed replacement/delete

- entering maker at full capacity changes no persisted library data;
- pressing Save at full capacity changes no persisted library data;
- only choosing a replacement target commits the new toy;
- cancel replacement writes nothing;
- delete confirmation must reference a stable toy ID and only then commit deletion.

### HC3 — Existing saved IDs remain stable

Opening, reloading or rendering a card must not regenerate toy IDs. Replacement creates a new toy ID only for the new authored toy. Other slots remain byte-equivalent unless normal metadata such as `updatedAt` changes at the root.

### HC4 — `totalCrafts` semantics stay historical

Append and confirmed replacement increment `totalCrafts` once. Delete does not decrement it. Cancelled Save/replacement increments nothing.

### HC5 — Empty Library is still a Library

Do not regress to automatically booting directly into Shape when zero toys exist. The product thesis now starts at ownership space; an empty state should show the shelf and a clear New Squishy action.

### HC6 — Card previews cannot depend on live renderer state

Thumbnails must regenerate deterministically from persisted toy data. No screenshot capture at save time, no canvas bitmap serialization, no per-card physics state.

### HC7 — Do not hide weak card identity by adding S3 features

If shape + paint + mix-ins + finish are not enough to distinguish cards emotionally, record that finding. Do not add faces, decals, naming, accessories or rarity labels in S2.

### HC8 — Full library must stay playable offline/mock and in Yandex runtime

Capacity/replacement is a local product-domain rule. It must not depend on ads, network success, leaderboard/profile APIs or rewarded inventory.

### HC9 — Payload fixtures must pass the real decoder

1/8/24 measurements must be built from valid `SavedSquishy` / `AppearanceDocumentV1` data and run through V3 encode/decode assumptions. Do not measure synthetic strings that bypass actual bounds.

### HC10 — Permanent browser QA must exercise non-latest toys

A test that always opens/replaces the last item can miss index/identity bugs. At least one permanent test must reopen/delete/replace a middle or earlier toy and verify surviving order.

---

## Scope risks

### Risk A — `SandboxApp` becomes a 1,200-line god object

S1 already has a substantial class. Library UI/rendering should be split into focused helpers/modules where practical, especially thumbnail rendering and pure persistence operations. Do not pour all shelf logic into pointer-stage code.

### Risk B — delete UI becomes card chrome

Permanent trash buttons on every small card can make the shelf feel like file management. Prefer a quiet secondary affordance/selection state with explicit confirmation.

### Risk C — 8 cards overwhelm portrait

Two columns with large previews is appropriate; scrolling is acceptable. Do not shrink previews aggressively to fit all eight above the fold.

### Risk D — replacement selection looks like delete mode

Copy and treatment should communicate "choose where this new squishy will live" rather than "delete one of these". The old toy is replaced only after the explicit final choice.

---

## Recommended implementation cut

1. `saveV3.ts`: replace S1 single-toy writer with pure append/replace/delete helpers while preserving the decoder/migration contract.
2. Add a small deterministic library thumbnail module using 2D canvas + shared shape boundary + appearance replay.
3. Evolve `SandboxApp` options from one `savedSquishy` to the current library and callbacks for append/replace/delete.
4. Add `library`, `replace`, and delete-confirm UI states while leaving maker pointer stages intact.
5. Boot always to Library.
6. Add deterministic payload-measurement script/test fixture before making any claim about 24 slots.
7. Rewrite/add permanent browser scenarios only after production behavior works.
8. Run production screenshots and independently review card identity.

## Pre-implementation decision

**Proceed.**

The plan is bounded enough to implement without dragging S3/S4/S5 into the phase. The hard stop is if 2D cards cannot convey authored identity at all; in that case S2 should still finish structurally and explicitly hand the emotional-identity gap to S3 rather than expanding scope.