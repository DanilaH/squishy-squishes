# Independent Implementation Review — Progression + Collection 01

**Date:** 2026-09-14  
**PR:** #8  
**Review posture:** inspect the implemented Phase 5 diff as hostile evidence, independently from the authoring pass.  
**Verdict:** **STRUCTURAL PASS / DEPLOYED PHONE PRODUCT ACCEPTANCE PENDING**

## 1. Review question

The question is not whether the build now contains XP and a collection screen. It is whether the implementation proves the intended one-more-squishy layer without damaging the accepted tactile loop, importing unnecessary economy/framework complexity, or creating contradictory durable state.

## 2. Progression domain — PASS

`src/game/progression.ts` owns progression policy as pure domain logic.

Verified:

- first completion = 100 validation XP;
- repeat = 25 validation XP;
- Lab Rank is derived from XP rather than persisted;
- unlocked IDs are derived from rank rather than persisted;
- every one of the 12 current canonical variants appears exactly once in the deterministic unlock table;
- module-load invariants reject missing, duplicate and unknown unlock IDs;
- collection card state precedence is `completed > available > locked`;
- milestone resolution compares previous→next collection state, so milestones are edge-triggered rather than repeated forever;
- milestone priority is `full catalog > full shape > half catalog > first squishy`;
- a locked recipe cannot be completed through the domain completion API.

No currency, shop, inventory, duplicate sink, quest layer or generic progression framework was introduced.

## 3. Save V2 / migration — PASS

`src/platform/save.ts` moves durable state to V2 only for `labXp`.

Verified load order:

1. canonical V2;
2. previous production V1 when V2 is absent;
3. legacy slice discoveries when both production saves are absent;
4. fresh default.

The pre-implementation review found a real compatibility problem: Phase 4 allowed all 12 combinations before gating existed, so a player could have a high-rank future recipe completed with too little naive historical XP. The implementation corrects this with `getHistoricalLabXp`: migrated XP is the maximum of historical award-equivalent XP and the XP threshold required by the highest-rank completed recipe.

Therefore previously completed content cannot become effectively re-locked after migration.

The original six Soft Cube IDs and Phase-4 Heart IDs remain unchanged.

## 4. Collect boundary — PASS

Bootstrap remains the durable owner:

- the app requests a completion;
- pure progression logic computes the outcome;
- bootstrap updates in-memory save truth synchronously;
- repository persistence starts asynchronously;
- presentation receives only the computed outcome.

The UI does not derive or grant XP from animation callbacks. The first Collect changes stage synchronously, so a queued second click cannot grant a second award.

No transaction framework was added because the current deterministic, single-threaded Collect boundary does not justify one.

## 5. Unlock UX — PASS structurally

The existing component selector remains intentionally unchanged as the selection model for this bounded pass.

Verified:

- fresh default `soft-square / grape / smooth` is Rank 1 and craftable;
- locked combinations may still be previewed;
- locked selection disables Make and shows the required Lab Rank;
- Make also re-checks domain eligibility in its click handler rather than trusting disabled-button presentation;
- after Collect, local XP and collection presentation update from the returned domain outcome.

Whether component selection is still the best production UX once the catalog grows is deliberately deferred. If twelve-plus curated recipes make this selector awkward, a recipe-first selector should be evaluated in a later content pass instead of forcing this control model to scale indefinitely.

## 6. Collection architecture — PASS

The collection is one DOM/CSS overlay over the existing lab.

Verified:

- no router;
- no second scene framework;
- no per-card WebGL canvases;
- cards are derived from the pure collection snapshot;
- cards are grouped by shape;
- locked / available / completed are distinct states;
- completed items expose a Squeeze action;
- overlay scrolls internally and does not reflow the craft workspace.

This is appropriately cheap for a validation surface rather than pretending to be final collection art direction.

## 7. Revisit / free squeeze — PASS

Completed-item revisit reuses the existing `test` stage and single hero renderer.

Verified:

- the selected completed variant is loaded into the existing renderer;
- revisit mode suppresses NEW presentation;
- primary action becomes Back to lab;
- revisit exit performs no progression callback and grants no XP;
- normal select state clears revisit mode;
- existing activity blocking continues to control renderer interaction.

No freeplay scene or duplicate renderer path was created.

## 8. Tactile-regression review — PASS

The Phase 5 diff does not alter the accepted high-frequency tuning constants for:

- paint completion/brush behavior;
- foam shake distance/idle behavior;
- mix motion/stretch thresholds and gain;
- mold normal/crit progress and decay;
- reveal timing;
- deformation renderer physics/shader path.

This pass stays around the proven loop rather than silently retuning it.

## 9. Findings discovered during independent implementation review

### Finding A — top-bar hitbox could steal craft input — FIXED

The new progression cluster originally restored `pointer-events` on the entire `.collection-summary`. Because the top bar overlaps the workspace, that would have created a large invisible touch/pointer interception zone during paint/shake stages.

Correction:

- summary remains `pointer-events: none`;
- only the Collection button is targetable;
- when disabled during craft, the button itself becomes pointer-transparent.

This keeps the new meta UI from damaging the tactile surface.

### Finding B — reduced-motion override ordering — FIXED

The new rank-progress transition CSS was appended after the existing global reduced-motion block, so it could restore a transition for users requesting reduced motion.

A final reduced-motion override now explicitly disables the rank-progress transition.

### Finding C — collection activity state — FIXED

Stage transitions now keep the Collection button disabled whenever gameplay activity is blocked, not only when the stage is non-select. Blocking also closes an open collection overlay.

### Finding D — documentation cleanup introduced duplicated headings/stale Phase-4 wording — FIXED

Independent doc inspection found duplicated heading markers in README/AGENTS/content direction and stale wording that still described the second-shape gate as pending. These were corrected before merge and the build/typecheck was rerun afterward.

## 10. Validation evidence

After the behavioral implementation and final review corrections, GitHub Actions passed:

- apply/finalization scripts;
- `git diff --check`;
- dependency install;
- strict `npm run typecheck`;
- production `npm run build`.

Temporary mutation workflows/scripts were removed from the final branch and are not part of the intended production diff.

## 11. Remaining product acceptance

No structural blocker remains. The remaining evidence must come from the merged Pages build on a real phone.

Check specifically:

1. top bar does not feel crowded or cover useful interaction area;
2. locked-selection messaging is understandable without explanation;
3. first Collect makes the XP/rank/new-unlock beat readable rather than noisy;
4. Collection scroll/card density feels usable in portrait;
5. completed-card Squeeze opens the correct squishy and Back to lab returns cleanly;
6. tactile input remains unaffected near the top-right meta UI;
7. the first few crafts create a clear next target rather than feeling like arbitrary XP.

## 12. Verdict

**STRUCTURAL PASS / DEPLOYED PHONE PRODUCT ACCEPTANCE PENDING.**

The implementation is bounded and consistent with the product thesis. It adds one durable progression dimension and one compact collection surface, preserves the accepted tactile core, reuses the hero renderer for revisit, keeps progression policy pure, and avoids premature economy/catalog architecture.

Merge is appropriate after this review. Phase 5 itself should only be marked fully complete after the merged Pages build passes the hands-on one-more-loop check.