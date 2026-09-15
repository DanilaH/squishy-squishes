# Sandbox Pivot S5 — Rewarded Shelf Expansion Review

**Status:** PASS WITH BOUNDED IMPLEMENTATION CONSTRAINTS
**Reviewed spec:** `SANDBOX_PIVOT_S5_REWARDED_SHELF.md`

## Verdict

Proceed.

The shelf expansion is a better S5 MVP than the old XP-reward proposal because the sandbox pivot deliberately removed XP/rank authority from the current product. SaveState V3 already contains both primitives needed for the new reward (`libraryCapacity` and `unlockedRewardIds`), so this can prove real rewarded monetization without creating a new economy or a new persistence version.

## What is strong

### 1. The reward is permanent and legible

`8 → 10 saved squishy slots` is easy to explain, easy to persist and easy to verify. It does not alter the quality of a squishy or gate any creation tool.

### 2. The free fallback remains real

The existing full-library replacement/delete flow must stay unchanged. That prevents the rewarded CTA from becoming a disguised hard gate.

### 3. The offer appears only when relevant

Showing it only at full capacity avoids monetization chrome during the core tactile loop and avoids training players to scan every screen for ad buttons.

### 4. The architecture already has the correct seam

The pinned mini-games-kit rewarded adapter already owns fullscreen activity blocking and callback hardening. Squishy only needs to own the durable reward mutation in `onReward`.

## Corrections / constraints before coding

### A. Do not reuse the old XP-reward section as implementation authority

`docs/ANALYTICS_AND_MONETIZATION.md` predates the sandbox pivot and still names Lab XP as the primary rewarded candidate. S5 should update that document so two contradictory monetization plans do not remain in the repository.

### B. `libraryCapacity` cannot remain constructor-only UI state

`SandboxLibraryApp` currently reads `options.libraryCapacity` during render and save checks. Rewarded expansion requires a mutable local capacity field initialized from the option and updated only from the domain callback result.

Every capacity decision in Library/maker replacement flow must switch to that local field. Missing one call site would create a split-brain UI where 8/10 is displayed but save still thinks the shelf is 8/8.

### C. Do not put the rewarded button only in the post-craft replacement modal

That would create unnecessary pressure after the player has already invested in a new squishy. The primary offer belongs in the full Library state before another craft begins.

The existing replacement modal stays free and unchanged in S5.

### D. Persistence failure must not produce a false grant

`persistSave()` already writes + flushes before assigning the in-memory save state. Keep that order. The UI may adopt capacity 10 only after `runtime.ads.showRewarded()` returns with a successfully persisted reward.

### E. Reward ID and capacity must reconcile safely

The pure grant operation should repair the narrow inconsistent state `reward ID owned + capacity < 10` by raising capacity. It must never lower a capacity already above 10.

### F. Do not touch the current interstitial session policy

The repository already contains sandbox interstitial behavior in `releaseSession.ts` even though roadmap sequencing calls S6 the dedicated adaptation phase. S5 must not retune, remove or expand that behavior. Rewarded shelf expansion is a separate explicit-click path.

## QA review

The proposed QA is appropriate, with two particularly important proofs:

1. browser QA must exercise the actual `runtime.ads.showRewarded()` seam rather than directly calling the save mutation and calling that monetization coverage;
2. Yandex stub coverage must verify one rewarded SDK request and activity lifecycle recovery, while durable storage readback verifies the game-owned grant.

A pure domain test alone is insufficient; a UI-only test alone is also insufficient.

## Scope review

Keep S5 to one reward ID and one permanent capacity step. Do not add a second offer just because the adapter is now wired.

In particular, reject during this PR:

- cosmetic/ad pack catalog;
- more than 10 slots;
- repeated rewarded grinding;
- sticky banners;
- new interstitial tuning;
- currency;
- reward inventory UI;
- SaveState V4;
- mini-games-kit upgrade.

## Decision

**PASS.** Implement the one-time `8 → 10` shelf expansion behind the existing rewarded adapter, update the stale monetization doc, add permanent browser/Yandex QA, run responsive visual acceptance, clean temporary harnesses, then PR/merge only on green evidence.