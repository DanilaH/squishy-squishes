# Sandbox Pivot S6 — Interstitial Lifecycle Implementation Review

**Status:** IMPLEMENTATION PASS
**Branch:** `sandbox-pivot-s6-interstitial-lifecycle`
**Base:** S5 `main` at `ce1d4d33c99c6f9385db5349eaf96b21d14c213c`

## Verdict

S6 is implementation-complete and suitable for PR/merge pending the normal permanent PR CI gates.

The change fixes sandbox interstitial eligibility semantics without changing ad frequency, rewarded monetization, renderer behavior, SaveState, or the pinned shared kit.

## Defect fixed

Before S6, every sandbox transition:

`Squeeze -> Library`

called `ActionInterstitialGate.recordEligibleAction()`.

That meant repeatedly reopening an already-saved toy could advance the same action counter as a newly completed creation.

S6 separates those concepts:

- `finish -> squeeze` after successful persistence records one pending completed-save action;
- saved-toy revisits record no action;
- pending completed saves are flushed into the existing interstitial gate only when the player next enters Library.

## Consecutive-save handling

The maker allows `NEW SQUISHY` directly from Squeeze. A player can therefore complete multiple saves before reaching Library.

S6 uses a pending **count**, not a boolean. Multiple successful saves remain represented individually and are fed through `ActionInterstitialGate` together at the next Library natural break.

At most one fullscreen request can start at that boundary. Once one action satisfies eligibility, the gate immediately establishes its existing cooldown; later pending actions may count toward a future request but cannot cause a second immediate request.

## Policy preserved

Production tuning was deliberately not changed:

- initial grace: `120_000 ms`;
- minimum request interval: `150_000 ms`;
- completed-save actions between requests: `3`.

The shared kit remains pinned at `d17ba31fce2a71335dcc3095f772c3fdd87fe97b`.

Legacy recipe-mode interstitial behavior remains unchanged.

## Request boundary preserved

No interstitial request is made at save completion itself.

The completed-save action remains pending while the result is in Squeeze and is only evaluated once Library becomes the current stage. There is no background timer.

This keeps fullscreen ads out of Shape, Paint, Mix-ins, Mix, Decor, Finish persistence, and Squeeze.

## Permanent QA

Added `tests/release/s6-interstitial.spec.ts`.

The test uses the production Yandex runtime seam and SDK stub. It does not lower production thresholds or inject a release-session policy override.

To cross the real grace threshold without waiting two minutes, browser QA shadows `performance.now()` with `real performance.now() + monotonic offset`. Time continues to advance normally, avoiding a frozen clock for renderer/tactile code.

The test proves:

- four existing-toy replay cycles (`Library -> Squeeze -> Library`) produce zero fullscreen requests after grace;
- a successful new save produces no request while still in Squeeze;
- the first completed-save Library return remains below the three-action threshold;
- two further saves can be completed consecutively without a Library break and remain pending independently;
- the eventual Library entry flushes completed-save actions 2 and 3 and requests exactly one fullscreen interstitial;
- Yandex Gameplay activity stops for the fullscreen and starts again afterwards.

## Validation evidence

Temporary validation run `34995276916` completed successfully.

Results:

- TypeScript typecheck: PASS;
- Pages production build: PASS;
- Yandex production build: PASS;
- Yandex dist verification: PASS;
- Browser QA: **34 / 34 passed**;
- `git diff --check`: PASS.

The first temporary validation run `34994918692` failed only because the new test used a strict locator matching two DOM `NEW SQUISHY` buttons, one in a hidden panel. Production behavior had not failed. The harness was corrected to use the accessible visible button and the full suite then passed. No production code was changed in response to that harness failure.

## Cleanup

Temporary validation workflow removed before PR:

- `.github/workflows/sandbox-s6.yml`

Permanent S6 source, docs, and browser QA remain.

## Not proven

Browser/Yandex-stub QA does not establish:

- real Yandex ad fill or creative rendering;
- actual portal throttling behavior;
- physical-device audio interruption quality;
- browser chrome/orientation quirks;
- low-end phone thermal/performance behavior.

These remain release/device observations rather than S6 implementation claims.

## Final decision

**PASS.** Open a PR from the clean branch, require permanent Release Check and Release Browser QA on the exact PR head, then squash-merge only if both are green and the head has not moved.
