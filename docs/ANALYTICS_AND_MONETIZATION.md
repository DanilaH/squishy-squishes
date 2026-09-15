# Squishy Squishes — Analytics & Monetization

**Status:** PRE-DEVELOPMENT PROPOSAL

The game should not acquire an economy merely to create ad hooks. Monetization fits between completed tactile loops.

---

## 1. Analytics principles

- Keep the event contract compact.
- Every event should answer a concrete activation, retention, content, performance or monetization question.
- Never emit PII.
- Never log raw pointer movement.
- Keep transport/platform details outside gameplay modules.
- Prefer semantic stage/result events over animation events.
- Do not create analytics events merely because a callback exists.

Production transport is expected through the shared runtime / Metrica adapter.

---

## 2. Primary activation funnel

Recommended first-session funnel:

```text
platform_ready
→ first_tactile_interaction
→ craft_started
→ first_reveal_complete
→ first_result_squeeze
→ result_collected
→ second_craft_started
```

The most useful product question is whether players move from first reward into another craft.

---

## 3. Core event contract

### Platform / activation

#### `platform_ready`
One-shot playable runtime marker aligned with platform ready semantics.

Suggested params:

- `runtime`: `mock | yandex`
- `language`

#### `first_tactile_interaction`
First successful meaningful player interaction for a fresh save.

Suggested params:

- `stage`
- `recipeId`

Emit once.

---

### Recipe / crafting

#### `recipe_selected`
Player selects a recipe.

Params:

- `recipeId`
- `shapeId`
- `tier`
- `completedBefore`

#### `craft_started`
First semantic interaction of a craft instance.

Params:

- `recipeId`
- `shapeId`
- `tier`
- `isRepeat`

#### `craft_stage_complete`
One event per completed semantic stage, not per visual beat.

Params:

- `recipeId`
- `stage`
- optional `elapsedMs` if measured reliably

Do not log high-frequency progress.

#### `reveal_complete`
Finished result reaches stable revealed state.

Params:

- `recipeId`
- `shapeId`
- `tier`
- `isFirstCompletion`

#### `first_result_squeeze`
First meaningful test squeeze on the current revealed result.

Params:

- `recipeId`
- `tier`

One event per craft at most.

#### `result_collected`
Player accepts/exits completed result.

Params:

- `recipeId`
- `tier`
- `isFirstCompletion`
- `labXpAwarded`
- `rankAfter`
- `unlockedCount`

This is the natural post-loop monetization eligibility boundary.

---

### Progression / collection

#### `lab_rank_up`
Params:

- `rankBefore`
- `rankAfter`
- `unlockCount`

#### `recipe_unlocked`
Only if per-recipe unlock analysis is useful; otherwise rank-up params may be enough.

Params:

- `recipeId`
- `shapeId`
- `tier`
- `source`: `rank | other`

#### `collection_open`
Params:

- `completed`
- `total`

#### `collection_item_open`
Player opens a completed item for revisit squeeze.

Params:

- `recipeId`
- `shapeId`
- `tier`

#### `collection_milestone`
Params:

- `kind`
- `current`
- `total`

Avoid separate events for every decorative celebration.

---

## 4. Useful product cuts

Questions the contract should answer:

### Activation

`platform_ready → craft_started → reveal_complete → result_collected`

Where do first-time players disappear?

### Core repeat

`result_collected(first) → second_craft_started`

Does the first reward create “one more” behavior?

### Tactile reward use

`reveal_complete → first_result_squeeze → result_collected`

Do players actually touch the finished object or immediately skip past it?

### Content desirability

Compare recipe selection/completion/replay rates by:

- shape;
- tier;
- material family.

### Collection engagement

`collection_open → collection_item_open`

Is collection a useful replay destination or dead UI?

### Monetization

Compare ad eligibility/request/grant behavior against loop continuation, but avoid overfitting the first small traffic sample.

---

## 5. Interstitial strategy

### Placement

Only request interstitials at a natural boundary after a completed result is accepted/collected and before the next craft becomes active.

Never interrupt:

- pour;
- mix/squish;
- mold press;
- reveal impact;
- result squeeze;
- collection revisit squeeze.

### Local eligibility

Use shared `ActionInterstitialGate` or an equally small policy around it.

Requirements:

- initial grace period after game ready;
- minimum wall-clock interval between requests;
- minimum number of collected craft results between requests;
- consume eligibility on ad **request**, not only successful impression, so no-fill/error does not cause SDK hammering;
- request synchronously from the player's result-exit action rather than a delayed background timer.

### Starting tuning prior

Signal 2000 used a deliberately conservative policy around roughly:

- 180 seconds initial grace;
- 180 seconds minimum request interval;
- 4 meaningful results between requests.

For Squishy these are **starting reference values only**, not locked balance. Craft duration differs and must be measured first.

A plausible first Squishy test is similarly conservative: no interstitial during the first several crafts and never on every result.

---

## 6. Rewarded strategy

The original Lab XP proposal is superseded by the sandbox pivot. S4 deliberately keeps titles as derived meta with no XP/rank authority, so rewarded monetization must not resurrect XP.

### S5 selected MVP: permanent shelf expansion

One explicit rewarded offer is allowed:

`8 saved slots → watch one rewarded video → 10 saved slots permanently`

Why this fits the current product:

- free creation remains unchanged;
- the existing free replace/delete flow remains available at full capacity;
- value is durable and easy to explain;
- SaveState V3 already has `libraryCapacity` and `unlockedRewardIds`;
- no currency, shop, random reward or new cosmetic production is required;
- the CTA can appear only when the free 8-slot shelf is actually full.

S5 must not add a second rewarded offer. Cosmetic/material/accessory packs remain later candidates after the rewarded lifecycle itself is proven.

### Explicitly avoid for S5

- rewarded XP or title progress;
- ad-only Ideas or core creation tools;
- random chests;
- energy refill;
- skip-stage ads;
- rewarded quality boosts;
- repeated shelf-expansion tiers;
- rewarded prompts during active creation or first-result Squeeze.

## 7. Reward grant contract

Rewarded-ad reward semantics must be durable domain work, not presentation work.

Conceptually:

```text
show rewarded
→ adapter confirms reward earned
→ compute exact XP grant from authoritative state
→ persist state
→ analytics grant event
→ animate already-owned XP to destination
```

If the callback can retry or ambiguity becomes possible, use an idempotent reward ID / existing adapter contract and test the exact lifecycle.

Do not grant from a tween completion callback.

---

## 8. Ad lifecycle analytics

Reuse shared adapter lifecycle events where available / useful rather than duplicating them in every scene.

Expected diagnostic vocabulary can include:

- `ad_interstitial_request`
- `ad_interstitial_open`
- `ad_interstitial_close`
- `ad_interstitial_error`
- `ad_rewarded_request`
- `ad_rewarded_open`
- `ad_rewarded_grant`
- `ad_rewarded_close`
- `ad_rewarded_error`

Squishy may add one semantic rewarded-offer event if needed, e.g. `xp_reward_offer_shown` / `xp_reward_offer_accepted`, but only if it answers conversion questions not already observable from request/grant events.

---

## 9. Ads and activity

Ad adapter / activity coordinator must own gameplay blocking edges.

While an ad owns foreground:

- stop new tactile input;
- release pointer capture;
- quiet/pause owned audio;
- stop or pause expensive hero simulation as appropriate;
- never resume until all blockers are clear.

Test visibility + platform pause + ad overlap, not only happy-path ad close.

---

## 10. Sticky/banner ads

Default MVP position: **no sticky banner over the tactile lab**.

Reasons:

- hero object benefits from visual breathing room;
- input area is large;
- permanent ad chrome undermines premium-toy presentation;
- interstitial + one rewarded offer may be sufficient for the first release.

Reconsider only with product/revenue evidence after launch or if Yandex economics require it.

---

## 11. No monetization-led scope growth

Do not add:

- currency merely to sell/boost it;
- shop merely to host rewarded ads;
- luck system merely to create a rewarded luck boost;
- inventory limits merely to sell convenience;
- randomization merely to create rerolls.

The project's advantage is a cheap tactile loop. Monetization should parasitize natural boundaries minimally, not redesign the game around ads.
