# Sandbox Pivot S5 — Rewarded Shelf Expansion

**Status:** IMPLEMENTATION SPEC
**Base:** `main@d547b754b443b1cf7371aef6e9288558279dacb5`
**Scope:** one explicit rewarded-video offer; no S6 interstitial redesign
**Product rule:** free sandbox creation and free replacement/delete remain fully usable without ads

## 1. Goal

Add the smallest rewarded monetization loop that has real permanent value without inventing a currency, shop, loot system or new production-heavy cosmetic catalog.

S5 MVP is exactly one offer:

> **Watch one rewarded video to permanently expand the personal shelf from 8 to 10 slots.**

Reward ID:

`reward:shelf-plus-2:v1`

This is a deliberate low-pressure probe. It monetizes an engaged player who has already filled the free 8-slot Library, while leaving the existing free full-shelf behavior intact.

## 2. Why shelf expansion is the S5 MVP

The current product already has the required durable domain primitives:

- SaveState V3 has `libraryCapacity`;
- SaveState V3 already has bounded `unlockedRewardIds`;
- the Library already has a safe full-capacity replace/cancel flow;
- the pinned shared kit already exposes hardened `runtime.ads.showRewarded()` with gameplay blocking and one-grant-per-callback lifecycle;
- no new renderer, shader, material, accessory art, currency or inventory subsystem is needed.

A cosmetic pack remains a valid later rewarded candidate, but making it the first monetization test would couple ad plumbing to new content production and lock-state presentation. S5 should first prove the rewarded lifecycle itself.

## 3. Player-facing behavior

### Default

- Library capacity remains **8**.
- Nothing changes before the shelf is full.
- No rewarded CTA appears during creation, squeeze, Ideas, Decor or the first ownership beat.

### Full 8 / 8 Library

The existing full-shelf message remains truthful and free:

- `New Squishy` still works;
- saving another squishy still reaches the existing replacement chooser;
- delete remains free;
- replacement remains free.

Alongside that state, show one clearly separate optional offer:

**EN**
- eyebrow: `OPTIONAL UPGRADE`
- title: `MAKE ROOM FOR TWO MORE`
- hint: `Watch one ad to keep 10 squishies on this shelf forever.`
- action: `WATCH AD · +2 SLOTS`

**RU**
- eyebrow: `НЕОБЯЗАТЕЛЬНО`
- title: `ЕЩЁ ДВА МЕСТА НА ПОЛКЕ`
- hint: `Посмотри одну рекламу — и навсегда храни здесь до 10 сквишей.`
- action: `РЕКЛАМА · +2 МЕСТА`

The CTA must visually read as optional and secondary to the normal Library actions.

### Successful reward

Only the rewarded callback grants ownership.

After a durable grant:

- `libraryCapacity` becomes at least **10**;
- `reward:shelf-plus-2:v1` exists exactly once in `unlockedRewardIds`;
- the Library rerenders immediately from `8 / 8` to `8 / 10`;
- the normal add-card / `New Squishy` free slot becomes visible again;
- show a small non-blocking confirmation: `Shelf expanded · 10 slots` / `Полка расширена · 10 мест`.

### Close / no reward / SDK error

- capacity stays unchanged;
- reward ID is not added;
- no fake success presentation;
- the player stays in the Library and can retry by explicit click later;
- replacement/delete/new-squishy behavior remains available.

There is no automatic ad retry.

### Already owned

Once the reward is owned:

- never show the rewarded CTA again;
- do not offer another +2 in S5;
- if 10 / 10 is later reached, keep the normal free replacement/delete behavior.

## 4. Reward domain contract

Add one pure SaveState V3 operation, conceptually:

```ts
grantRewardedShelfExpansion(state, updatedAt?) -> SaveStateV3
```

Required invariants:

- target capacity is 10;
- never reduce an already-higher capacity;
- reward ID is unique;
- repeated grants are idempotent;
- if the reward ID exists but capacity is below 10, reconcile capacity upward rather than trusting the inconsistent pair;
- preserve library/order/completion/meta exactly;
- stay inside SaveState V3.

Do not overload `completedRecipeIds` or introduce SaveState V4.

## 5. Transaction boundary

The game owns durability inside the shared adapter's `onReward` callback:

```text
explicit player click
→ runtime.ads.showRewarded({ rewardId, onReward })
→ Yandex onRewarded / Mock rewarded grant
→ compute next SaveState V3
→ repository.write(next)
→ repository.flush()
→ commit in-memory save state
→ return from onReward
→ UI adopts capacity 10
```

If persistence throws, `onReward` throws. The adapter reports a rewarded error and the UI must not claim ownership.

Do not grant from `onClose`, a timer, an animation callback or button click itself.

## 6. Platform / activity contract

Use the pinned shared kit as-is. Do not upgrade it for S5.

Current kit guarantees used by this phase:

- only one fullscreen ad request in flight;
- gameplay activity blocked while rewarded foreground is owned;
- duplicate rewarded callbacks call the game's grant at most once;
- late reward callbacks are ignored;
- mock rewarded adapter runs the same game-owned `onReward` callback for browser QA.

Current Yandex Games SDK documentation still exposes rewarded video through `ysdk.adv.showRewardedVideo()` and specifies `onRewarded` as the callback where the game grants the reward. S5 should stay behind the kit adapter rather than call `ysdk` directly.

## 7. UI ownership

`SandboxLibraryApp` owns presentation only.

Additive option contract should provide a single callback such as:

```ts
onUnlockShelfExpansion(): Promise<{
  granted: boolean;
  libraryCapacity: number;
}>
```

The app should maintain current `libraryCapacity` as mutable view state rather than reading only the constructor option forever.

Do not let the Library write persistence directly.

## 8. Analytics

The shared ad adapter already emits lifecycle diagnostics such as:

- `ad_rewarded_request`;
- `ad_rewarded_open`;
- `ad_rewarded_grant`;
- `ad_rewarded_close`;
- `ad_rewarded_error`.

Add at most two semantic product events if useful:

- `shelf_reward_offer_click` with current `count` / `capacity`;
- `shelf_reward_granted` with resulting `capacity`.

Do not duplicate every SDK lifecycle callback in `releaseSession.ts`.

## 9. QA acceptance

Permanent automated coverage must prove at least:

1. pure reward operation raises 8 → 10 and persists the reward ID;
2. repeated grant does not duplicate reward or keep growing capacity;
3. already-higher capacity is never reduced;
4. reward CTA is absent before full capacity;
5. full 8 / 8 Library still exposes free `New Squishy` behavior and the existing replacement path;
6. mock rewarded click grants exactly once and rerenders 8 / 10;
7. saved V3 readback contains capacity 10 + one reward ID;
8. reload preserves 10 slots and does not show the offer again;
9. Yandex stub records exactly one rewarded request and gameplay activity returns after close;
10. S0–S4, Pages build, Yandex build/verifier and all existing browser regressions stay green;
11. phone portrait and short landscape keep the full-shelf offer contained with no horizontal overflow.

Do not add test-only production hooks or lower existing QA thresholds.

## 10. Explicit non-goals

S5 does **not** add:

- currency;
- shop/store screen;
- consumable boosts;
- loot boxes or random rewards;
- rewarded XP;
- recipe/Idea unlocks;
- ad-only core creation tools;
- cosmetic packs;
- repeated shelf expansion tiers;
- sticky banners;
- new interstitial policy;
- interstitials during creation or Save → first Squeeze;
- renderer/shader changes;
- SaveState V4;
- shared-kit upgrade.

## 11. Stop rules

Stop and reassess if the implementation requires any of the following:

- an economy merely to explain the reward;
- a second reward ledger outside SaveState V3;
- ad callbacks inside renderer/gameplay mechanics;
- a forced ad to save or continue;
- removal of the free replacement path;
- automatic ad invocation without an explicit player click;
- a second rewarded offer before the first lifecycle is validated;
- S6 interstitial changes mixed into the same PR.

## 12. Definition of done

S5 is engineering-complete only when:

- the one-time shelf reward is durable and idempotent;
- reward is granted only from rewarded callback persistence;
- full Library remains usable without ads;
- browser QA includes mock + Yandex rewarded lifecycle evidence;
- responsive visual review passes;
- temporary implementation/visual harnesses are removed;
- final clean-tree `qa:release` passes;
- permanent PR CI passes before merge;
- post-merge Release Check, Browser QA and Pages deployment are green.

Physical-phone/manual touch and real Yandex portal ad delivery remain external release gates.