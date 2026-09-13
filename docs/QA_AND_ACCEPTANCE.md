# Squishy Squishes — QA & Acceptance

**Status:** PRE-DEVELOPMENT PROPOSAL

This document translates the portfolio-level polish/lifecycle doctrine into Squishy-specific gates. It does not replace `DanilaH/decisions/Yandex Games/POLISH_ACCEPTANCE.md`; that remains the canonical cross-project checklist.

---

## 1. Functional acceptance is not ship acceptance

A craft that can technically progress through all states is an early milestone.

Release acceptance requires the repeated loop to remain pleasant, readable and stable:

`input acknowledgement → continuous tactile response → stage completion → reveal → stable result → satisfying collection exit`

---

## 2. Core tactile acceptance

For pour/add/apply/squish stages:

- input acknowledgement is immediate;
- visual response remains continuous while input changes;
- sound follows semantic action rather than playing as an unrelated loop;
- release/cancel stops owned response cleanly;
- touch and mouse targets are forgiving;
- sound-off state remains understandable;
- no stage depends on tiny precision gestures;
- there is no dead input period that looks interactive but ignores the player.

### Squish-specific

- local deformation remains coherent at extreme allowed drag/press;
- no obvious grid fold or self-crossing dominates normal play;
- silhouette still reads as the intended shape;
- release settles quickly enough to invite another squeeze;
- premium material shader does not make deformation unreadable;
- higher content richness does not reduce frame/input quality.

---

## 3. Craft choreography acceptance

For each representative recipe:

- stage transition is causally readable;
- the environment persists through transformations rather than hard-cutting to unrelated scenes;
- completion impacts are distinct enough without every stage exploding;
- reveal has anticipation but does not stall replay;
- finished object remains visible/stable long enough to enjoy;
- Collect is a satisfying exit, not abrupt disappearance;
- rank/unlock acknowledgement does not cover the hero longer than necessary.

Test simple and premium recipes; premium effects must not be required for basic readability.

---

## 4. Repetition protocol

Before final release, run representative repeated-use sessions.

Minimum useful internal sessions:

### A. Single-recipe stress

Repeat one recipe enough times to expose:

- audio fatigue;
- stage pacing boredom;
- animation repetition;
- pointer cleanup bugs;
- reveal impatience.

### B. Progression run

Fresh save through several unlocks:

- verify meaningful rewards arrive frequently;
- verify no progression drought;
- verify next desired content is visible;
- verify no menu friction dominates play.

### C. Mixed catalog run

Craft several shapes/material tiers back-to-back:

- content really feels different;
- same interaction grammar does not read as copy-paste;
- material audio/reveal hierarchy remains coherent;
- collection ordering remains understandable.

### D. Collection revisit run

Open multiple completed items and squeeze/revisit them without progression rewards. This checks whether finished objects have standalone tactile value.

---

## 5. Lifecycle / interruption matrix

Test interruption during:

- lab idle;
- active pour;
- active squish/drag;
- mold press;
- reveal animation;
- finished result squeeze;
- Collect/progression transition;
- collection detail view;
- rewarded ad;
- interstitial ad.

For each relevant point:

- tab hidden/visible;
- Yandex pause/resume;
- ad open/close;
- pointer cancel;
- resize/orientation change;
- reload.

Expected invariants:

- no stuck pointer capture;
- no orphan continuous audio;
- no duplicated reward/progress;
- no lost already-persisted completion;
- no double stage completion;
- no early resume while another blocker remains;
- no render loop exploding after a long hidden-tab dt.

---

## 6. Save / progression acceptance

Test:

- fresh save;
- corrupted/malformed non-critical settings fallback;
- valid old save migrations once schema version >1 exists;
- rapid repeated settings toggles;
- completion then immediate reload;
- rank-up then reload;
- unlock table determinism;
- completed recipe cannot become locked after reconciliation;
- local/cloud reconciliation if Player Data mirroring is enabled.

No scene/tween callback may be the only owner of a durable progression mutation.

---

## 7. Content registry validation

Automated validation should reject at least:

- duplicate recipe IDs;
- unknown shape/material/filling/finish references;
- missing localization keys;
- invalid tier;
- recipe with unsupported stage ID;
- locked/unreachable content caused by malformed unlock table;
- non-finite/out-of-range material parameters;
- invalid asset paths where build-time validation is feasible.

Prefer failing build/test over silently skipping malformed content.

---

## 8. Performance acceptance

Profile representative cases, not only Milk Mochi.

Must include:

- simple opaque recipe;
- translucent filled recipe;
- most expensive showcase recipe;
- collection grid with launch-scale catalog;
- active diagnostics disabled for release measurement.

Observe:

- FPS/frame-time distribution;
- input-to-response quality;
- canvas backing-store size/DPR;
- GPU/CPU spikes during reveal;
- audio-node lifetime;
- memory across repeated craft cycles;
- asset loading/decoded texture cost;
- transparency/overdraw on mobile.

A premium recipe that drops input quality is not an acceptable “rare effect.” Degrade decoration first.

---

## 9. Responsive/layout acceptance

If both orientations are supported:

Test at minimum:

- desktop wide;
- desktop short-height;
- mobile landscape;
- mobile portrait;
- tall/narrow viewport;
- DPR 1 and high-DPR representative device.

Requirements:

- hero remains comfortably interactable;
- controls do not overlap hero input area badly;
- collection cards remain readable;
- safe areas respected;
- no critical control depends on hover;
- no scroll trap during active canvas interaction.

If portrait is rejected during pre-development, replace these checks with rotate-gate correctness.

---

## 10. Localization acceptance

RU + EN:

- no missing keys;
- no clipped recipe names/buttons;
- no user-facing hardcoded text outside dictionary/debug;
- font supports required glyphs;
- store-facing names can differ from internal stable IDs;
- no text baked into runtime art.

---

## 11. Monetization acceptance

Interstitial:

- never during an active tactile/reveal beat;
- grace/cooldown/craft gate works;
- failed/no-fill request consumes local request eligibility as intended;
- request remains attached to explicit result-exit action;
- close/error restores activity correctly.

Rewarded:

- no reward without adapter reward signal;
- exact XP grant occurs once;
- reload after durable grant preserves it;
- close before reward does not grant;
- animation cannot double-grant;
- ad failure leaves normal progression intact.

---

## 12. Debug/release separation

Production build must not expose:

- force recipe/tier;
- unlock-all;
- save mutation buttons;
- ad test buttons;
- language debug override UI;
- mesh/performance panel unless explicitly safe and intended.

DEV-only debug tools should be impossible to enable through a public query-string trick.

---

## 13. Release-candidate protocol

For the exact candidate revision:

1. build from clean install/environment;
2. run automated tests/typecheck/build;
3. run fresh-save first-session manually;
4. run representative repeated-use session;
5. run lifecycle interruption matrix on high-risk states;
6. run desktop/mobile performance checks;
7. validate RU/EN;
8. validate ads in Yandex DRAFT where available;
9. inspect store thumbnail/screenshots at small size;
10. record remaining issues by user impact, not by file/module count.

---

## 14. Ship rule

Ship when:

- the complete high-frequency loop passes repeated-use;
- remaining defects are non-blocking and understood;
- performance/input are stable on representative targets;
- persistence/ad lifecycle is safe;
- content catalog is coherent;
- no remaining feature has enough user value to justify delaying release relative to its full production burden.

Do not keep polishing invisible implementation elegance after the player-facing product has crossed this gate.
