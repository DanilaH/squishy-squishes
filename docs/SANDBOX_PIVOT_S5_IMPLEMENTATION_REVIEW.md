# Sandbox Pivot S5 — Rewarded Shelf Expansion Implementation Review

**Status:** IMPLEMENTATION PASS
**Branch:** `sandbox-pivot-s5-rewarded-shelf`
**Base:** `main`

## Verdict

S5 is implementation-complete and suitable for PR/merge pending the normal permanent PR CI gates.

The slice remains deliberately narrow: one optional rewarded action on a full free shelf expands durable Library capacity from 8 to 10. It does not add currency, a shop, repeated rewarded grinding, sticky banners, recipe gates, renderer work or SaveState V4.

## Implemented product behavior

- The free Library still starts at 8 slots.
- A full 8/8 Library still allows `New Squishy`; the existing free replacement/delete path remains available.
- Only the full free shelf exposes the optional rewarded offer.
- The offer clearly promises one permanent `+2` slot expansion.
- A successful rewarded grant changes the shelf to 10 slots and persists it.
- After expansion, the rewarded offer disappears permanently and the normal empty `New Squishy` slot becomes available again.
- EN and RU copy are present and responsive.

## Persistence / domain review

`src/platform/saveV3Rewards.ts` owns the narrow reward mutation.

Permanent reward ID:

`reward:shelf-plus-2:v1`

Grant semantics:

- add the reward ID once;
- raise `libraryCapacity` to at least 10;
- never lower a capacity already above 10;
- remain bounded by the existing V3 hard maximum;
- reconcile the narrow inconsistent state `reward owned + capacity < 10` on startup;
- remain idempotent on repeated grant attempts.

SaveState stays V3. No reward-specific schema version was introduced.

## Ad/runtime review

The game uses the pinned mini-games-kit `runtime.ads.showRewarded()` seam rather than calling Yandex SDK advertising APIs directly.

The durable state mutation happens inside the adapter `onReward` callback and is flushed before the UI treats the reward as granted. The adapter remains responsible for fullscreen in-flight protection, duplicate reward callback hardening and gameplay activity blocking.

S5 does not change the existing interstitial policy in `releaseSession.ts`.

## Analytics review

The sandbox-era monetization authority now describes the shelf expansion rather than the obsolete Lab XP proposal.

Game-owned semantic events are limited to the offer click and durable shelf grant. Adapter-owned rewarded lifecycle events remain in the shared runtime, avoiding duplicated SDK diagnostics in the game layer.

## Automated acceptance evidence

Temporary implementation validation run `34990525792` completed successfully.

The validated release suite contained 33 browser tests and passed 33/33, including the permanent S5 coverage for:

- bounded/idempotent grant semantics;
- no reduction of a higher existing capacity;
- offer only on a full free shelf;
- free creation/replacement path remaining available;
- mock rewarded flow `8 -> 10` with durable reload;
- Yandex rewarded request through the real runtime adapter seam;
- duplicate SDK reward callback resulting in one durable grant;
- gameplay activity recovery after the rewarded flow;
- phone portrait and short-landscape containment.

The same validation also passed TypeScript checking, Pages production build, Yandex production build, Yandex dist verification and the pre-existing S0-S4 release regressions.

## Visual acceptance evidence

The first capture exposed a review-harness problem: phone/landscape screenshots were taken at the top of the scrollable Library and therefore did not actually show the rewarded offer. This was not accepted as visual evidence.

The temporary capture was corrected to scroll the offer / post-grant message into the viewport and rerun. Visual run `34993379949` completed successfully.

Original screenshots were inspected for:

- phone 8/8 rewarded offer;
- phone 8/10 post-grant state;
- short landscape rewarded offer;
- desktop rewarded offer;
- RU/Yandex phone rewarded offer.

Result: visual PASS. The CTA, explanatory copy and post-grant state fit without horizontal overflow or clipping. RU copy remains readable. No product CSS fix was required after the corrected capture.

## Cleanup

Temporary S5 scaffolding was removed before PR:

- `.github/workflows/sandbox-s5.yml`
- `.github/workflows/sandbox-s5-visual.yml`
- `scripts/apply-sandbox-s5-rewarded.mjs`
- `tests/release/s5-visual.spec.ts`

Permanent `tests/release/s5-rewarded.spec.ts` remains as release coverage.

## Not proven by browser automation

Do not treat this slice as evidence for physical-device or portal-runtime facts that were not observed directly. In particular, S5 browser QA does not prove:

- real phone touch feel;
- actual Yandex ad inventory/fill behavior;
- real ad creative rendering;
- device audio interruption/resume quality;
- browser chrome/orientation quirks on physical devices;
- thermal/performance behavior on low-end phones.

These are release/device validation concerns, not blockers for the bounded S5 implementation itself.

## Final decision

**PASS.** Open PR from the clean branch, require the normal permanent Release Check and Release Browser QA on the PR head, then squash-merge only if both remain green and the head SHA has not moved.
