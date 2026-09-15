# Sandbox Pivot S6 — Interstitial Lifecycle Adaptation

**Status:** IMPLEMENTATION SPEC
**Base:** Sandbox Pivot S5 on `main`
**Scope:** lifecycle semantics only; no frequency retuning

## Goal

Adapt the existing conservative interstitial gate to the sandbox lifecycle so ad eligibility advances from **completed saved creations**, and requests happen only at a later **Library natural break**.

S6 does not add a new ad format or a new monetization surface.

## Current defect

`releaseSession.ts` already requests interstitials only from a Library return, but today every transition:

`Squeeze -> Library`

calls `ActionInterstitialGate.recordEligibleAction()`.

That conflates two different behaviors:

1. finishing and saving a newly authored squishy, then returning to Library;
2. opening an old saved squishy, squeezing it, then returning to Library.

The second case is a replay/revisit and must not advance the completed-craft cadence. Otherwise repeatedly opening old toys can satisfy `minActionsBetweenRequests` without any new saved creation.

## Product contract

### Eligible action

One **successfully saved new squishy** is one interstitial-gate action.

The save is authoritative only after the maker transitions:

`finish -> squeeze`

because that transition occurs after `onSaveSquishy()` has returned a saved object. A cancelled full-shelf replacement or failed save never reaches `squeeze` and therefore never counts.

### Natural request boundary

A completed-save action does not request an ad immediately. It remains pending until the player next enters Library.

This keeps ads out of:

- Shape;
- Paint;
- Mix-ins;
- Mix;
- Decor;
- Finish/save persistence;
- Squeeze.

The request is evaluated synchronously from the Library-entry transition, not from a delayed timer.

### Multiple saves before Library

Squeeze exposes `NEW SQUISHY`, so a player can save more than one toy before returning to Library.

S6 must therefore keep a **count** of pending completed saves, not a boolean.

Example:

`save A -> squeeze -> New -> save B -> squeeze -> New -> save C -> squeeze -> Library`

At that Library entry, all three completed-save actions are fed through the existing gate in order. At most one fullscreen request may start at that boundary; the gate's interval policy prevents a second request at the same moment.

### Revisit semantics

`Library -> existing saved toy -> Squeeze -> Library`

adds zero completed-save actions and must not call `recordEligibleAction()` merely because the player returned from Squeeze.

Revisits remain a natural break in the UX sense, but without a pending completed save there is no monetization action to consume.

## Existing policy values remain unchanged

S6 explicitly preserves the current Squishy policy:

- `initialGraceMs: 120_000`
- `minIntervalMs: 150_000`
- `minActionsBetweenRequests: 3`

The pinned shared kit default (`180s / 180s / 4`) and historical monetization notes are references, not a reason to silently rebalance production in this lifecycle fix.

Frequency retuning requires traffic evidence and is outside S6.

## Architecture

Keep using pinned `ActionInterstitialGate` and `runtime.ads.showInterstitial()`.

`releaseSession.ts` should own only:

- recognition of successful sandbox save completions;
- pending completed-save action count;
- recognition of Library entry;
- flushing pending actions into the gate at that natural break;
- semantic request/result analytics.

The shared ad adapter continues to own:

- one-fullscreen-at-a-time protection;
- Yandex SDK callbacks;
- gameplay activity blocking;
- timeout/error/offline handling;
- adapter-level ad lifecycle analytics.

Do not call Yandex SDK APIs directly from `releaseSession.ts`.

## Legacy behavior

The legacy recipe path is not part of the sandbox pivot and must remain behaviorally unchanged in S6.

## Analytics

Keep existing Squishy events:

- `interstitial_request`
- `interstitial_result`

`completedCrafts` continues to mean successful sandbox saves in the current session.

No high-frequency or stage-by-stage ad analytics are required.

## QA acceptance

Permanent browser QA must prove the semantics through the real release session and Yandex runtime stub, not by calling the gate/save mutation directly.

Required evidence:

1. after grace time has elapsed, repeatedly reopening an existing saved toy and returning to Library does **not** request an interstitial;
2. a successful new save does not request an ad while the player is still in Squeeze;
3. first and second completed-save Library returns still do not request with the existing three-action policy;
4. the third completed-save Library return requests exactly one fullscreen ad;
5. the Yandex stub reports exactly one fullscreen request;
6. ordinary Pages/mock flow remains free of interstitial requests by runtime policy;
7. existing release regressions remain green.

QA may control the browser's monotonic clock by applying a time offset to `performance.now()` in the test page. It must not add production test hooks or lower production gate thresholds.

## Non-goals

Do not add or change in S6:

- rewarded ads;
- shelf capacity/rewards;
- sticky/banner ads;
- ad frequency values;
- ad-after-revisit policy;
- currency/shop;
- renderer/shader/physics;
- SaveState schema;
- mini-games-kit version;
- S7 expressive polish.

## Exit gate

S6 is complete only when:

- lifecycle bug is fixed without frequency retuning;
- permanent real-browser/Yandex QA proves the completed-save cadence;
- full Pages/Yandex release validation passes;
- temporary validation scaffolding is removed;
- PR CI is green on the exact merge head;
- post-merge release and Pages deploy remain green.
