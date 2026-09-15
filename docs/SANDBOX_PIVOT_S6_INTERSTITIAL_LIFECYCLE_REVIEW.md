# Sandbox Pivot S6 — Interstitial Lifecycle Review

**Status:** PASS WITH IMPLEMENTATION CONSTRAINTS
**Reviewed spec:** `SANDBOX_PIVOT_S6_INTERSTITIAL_LIFECYCLE.md`

## Verdict

Proceed with the lifecycle fix only.

The current sandbox integration has a real semantic defect: `squeeze -> library` is treated as an eligible action whether the squeeze belongs to a newly saved toy or an old Library revisit. This lets replay activity advance a gate intended to represent meaningful completed results.

S6 should repair that distinction without using the phase as an excuse to retune ad frequency.

## Why completed saves are the right action unit

A sandbox creation becomes durable only after `onSaveSquishy()` succeeds. In the current maker, the resulting `finish -> squeeze` transition is therefore a strong semantic signal for one completed save.

By contrast, a saved-toy revisit enters Squeeze directly from Library and never crosses `finish -> squeeze`, so it can be distinguished without IDs, private maker state or test hooks.

## Why a pending count is required

A single pending boolean is insufficient because Squeeze exposes `NEW SQUISHY`. The player can chain multiple successful saves before returning to Library.

The release session should preserve each of those completions as one pending action and flush the count only when a natural Library break is reached.

This is more correct than:

- counting every Squeeze exit;
- consuming gate eligibility immediately at save time;
- requesting an ad while the result is still being squeezed;
- remembering only the latest save.

## Gate semantics

Feeding several pending actions into `ActionInterstitialGate` at one Library boundary is safe with the pinned implementation:

- each completed save remains an action;
- the first action that satisfies both action count and time eligibility consumes one request opportunity;
- the gate immediately establishes its next interval;
- additional pending completed saves at the same boundary can count toward the next request but cannot cause another immediate request because the interval has not elapsed.

Only one `runtime.ads.showInterstitial()` call should be issued for that Library entry.

## Frequency review

Do **not** change the existing Squishy values in this PR:

- 120s initial grace;
- 150s minimum request interval;
- 3 completed-save actions between requests.

The shared kit defaults are more conservative, but changing production frequency without traffic evidence would combine a lifecycle correctness fix with a monetization-balance experiment. Those must remain separate decisions.

## QA review

A good permanent regression must fail on the current implementation for the right reason.

The strongest browser proof is:

1. install the normal Yandex SDK stub;
2. apply a monotonic offset to `performance.now()` so grace has genuinely elapsed without lowering production thresholds;
3. reopen an existing saved toy at least three times and return to Library each time;
4. assert `fullscreenRequests === 0`;
5. complete real sandbox saves with real Mix interaction;
6. assert no request while each newly saved toy remains in Squeeze;
7. return to Library after each completion;
8. assert exactly one request after the third completed-save return.

The clock shim must continue advancing real time plus an offset rather than freezing `performance.now()`, because renderer/audio/tactile code also consumes monotonic time.

## Scope boundaries

Do not couple S6 to:

- rewarded shelf work from S5;
- an analytics redesign;
- new ads UI;
- new interstitial placements;
- S7 accessory/expression polish;
- changes to the shared kit.

The legacy recipe branch in `releaseSession.ts` should remain untouched except where a mechanical refactor can be proven behavior-preserving.

## Decision

**PASS.** Implement pending completed-save actions, flush them only on Library entry, preserve current gate timings, and add real Yandex browser regression coverage before PR/merge.
