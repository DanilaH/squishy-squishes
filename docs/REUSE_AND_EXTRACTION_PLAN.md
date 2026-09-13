# Squishy Squishes — Reuse & Extraction Plan

**Status:** PRE-DEVELOPMENT PROPOSAL  
**Purpose:** reuse paid-for infrastructure without importing Signal 2000's product complexity.

---

## 1. Governing rule

Dependency direction:

```text
DanilaH/decisions doctrine / constraints
        ↓
DanilaH/mini-games-kit reusable mechanism
        ↓
Squishy Squishes project-specific policy / content / choreography
```

The previous game is a **behavior/pattern reference**, not a source tree to copy wholesale.

Before implementing a generic-looking mechanism locally:

1. inspect the pinned kit API;
2. reuse the kit primitive if it fits without changing Squishy's design;
3. if it is expensive and almost generic, record consumer friction and make the smallest justified shared-kit change;
4. otherwise keep Squishy policy local.

---

## 2. Full-game kit revision

Planned revision:

`DanilaH/mini-games-kit@d17ba31fce2a71335dcc3095f772c3fdd87fe97b`

Why this revision rather than the feel-probe pin:

- it retains the feel/audio primitives already consumed by the probe;
- it adds the reviewed production bootstrap around Yandex;
- it adds versioned JSON repository support;
- it adds browser orientation/activity bridging;
- it has a matching mock runtime;
- it represents the current post-Signal broad extraction stopping point.

The validated probe remains historical evidence on `2da5b501...`; changing the full game's pin does not rewrite the tested result.

---

## 3. mini-games-kit — planned direct reuse

| Shared primitive | Squishy use | Project-owned policy |
| --- | --- | --- |
| continuous interaction semantics | normalize stage/squish progress + velocity for material/audio | stage geometry and completion rules |
| `ContinuousNoiseTexture` | tactile mix/squeeze texture | profile/tuning per Squishy material/stage |
| `PresentationAudioMixer` | baseline ambience + owned premium/reveal state | exact ambience/reveal hierarchy |
| pitch helpers | repeated small accents / accumulation contours | exact SFX and pitch ranges |
| render-density helpers | DPR/backing-store cap | quality tier choice |
| pointer-response helpers | optional normalized pointer/parallax/idle support | actual squish hit testing/deformation |
| `GameplayActivityCoordinator` | aggregate platform/ad/visibility blockers | what gameplay/audio pauses mean locally |
| document visibility bridge | safe lifecycle | local UI behavior |
| viewport orientation bridge | only if final orientation policy uses it | portrait/landscape product rule |
| `StorageAdapter` | persistence seam | save/settings keys and schemas |
| `JsonStorageRepository` | versioned save/settings JSON and serialized writes | validation/migration/defaults |
| Yandex runtime bootstrap | SDK/init/storage/ready lifecycle | save reconciliation and analytics vocabulary |
| mock platform runtime | local development | debug scenarios |
| `YandexAdsAdapter` | ad lifecycle and blockers | placement/cadence/reward meaning |
| `ActionInterstitialGate` | conservative eligibility | craft-count/time thresholds |
| `YandexMirroredStorageAdapter` | optional Player Data mirroring | Squishy freshness/conflict policy |
| `MetricaAnalyticsAdapter` | goal transport | event names/params |
| value-transfer helper | optional visual XP transfer | Lab XP semantic amount/destination |
| image asset pipeline | generated 2D cutout/normalization | Squishy asset conventions/quality |

---

## 4. mini-games-kit — conditional reuse

### `PresentationSkipController`

Do not use initially merely because it exists.

Add if repeated-use testing shows reveal/finish presentation becomes annoying and needs an explicit safe fast-forward boundary.

### `DurablePendingTransactionSession`

Do not use for ordinary deterministic crafts or to persist every in-progress gesture.

Use only if the design later contains an exactly-once staged mutation where:

- outcome is resolved before presentation;
- refresh must preserve the exact outcome;
- reroll/double-apply is unacceptable;
- normal JSON write alone is not enough.

Examples that could justify it later: a random special variant resolved before reveal, or a complex rewarded mutation spanning a presentation interruption.

### gameplay RNG / weighted choice

MVP canonical recipe outcomes are deterministic. Keep gameplay RNG out until a real mechanic needs it.

Cosmetic randomness can remain local/separate.

### Phaser subpath

Not planned. The new project has no reason to inherit Phaser just because Signal 2000 used it.

---

## 5. Signal 2000 — patterns worth adapting

Source project: `DanilaH/cases-yg`.

### 5.1 Pure collection read models

Reference:

`src/game/systems/collection.ts`

Useful pattern:

- build collection snapshots from content registry + durable ownership;
- keep UI derived from a pure read model;
- calculate per-family counts separately from scene rendering;
- expose near-completion/featured-item helpers.

Squishy adaptation:

- per-shape completion;
- global completion;
- recipe card state;
- featured highest-tier completed recipe;
- near-complete shape set.

Do **not** copy Signal types (`GadgetFamilyDefinition`, loot pools, secret/standard ownership).

### 5.2 Pure collection milestone resolver

Reference:

`src/game/systems/collectionMilestones.ts`

Useful pattern:

- compare before/after committed state;
- resolve at most one foreground milestone per core loop;
- explicit priority order so completion outranks weaker beats.

Squishy adaptation candidates:

- first squishy;
- first completed four-recipe shape set;
- half catalog;
- full catalog.

Do not import Secret/loot-pool semantics.

### 5.3 Separate preferences from gameplay save

Reference:

`src/game/systems/settings.ts`

Useful lesson:

- mute/preferences should not race gameplay save writes;
- preference writes should serialize;
- malformed preference can fail soft to default.

In Squishy, implement this with shared `JsonStorageRepository` rather than copying the old repository class.

### 5.4 DEV-only scenario panel

Reference:

`src/debug/createDebugPanel.ts`

This is a high-value production tool worth adapting early.

Squishy debug panel should support:

- force/select any recipe;
- set Lab Rank/XP;
- unlock all recipes;
- seed empty/half/full collection;
- reset save;
- switch RU/EN debug language;
- jump to safe representative craft stages;
- force each material/tier reveal;
- toggle mesh/performance diagnostics;
- test interstitial/rewarded adapters;
- inspect current platform/runtime status.

Production rule copied in spirit: internal controls are guarded by `import.meta.env.DEV`, not enabled by a public query parameter.

### 5.5 Typed RU/EN dictionary

Reference:

`src/i18n/index.ts`

Useful pattern:

- one language object defines the nested key shape;
- a recursive mapped type requires the other language to match;
- app code consumes typed `Messages`.

This is cheap and appropriate to reuse structurally.

### 5.6 Conservative ad-request policy

Reference:

`src/platform/monetization.ts`

Useful product lesson:

- protect early play with a grace period;
- require multiple meaningful results between interstitial requests;
- consume local eligibility on **request**, not only impression, so no-fill/error does not hammer SDK;
- tie request to a user result/collect transition, not a background timer.

Squishy should implement policy around shared `ActionInterstitialGate`, not copy the old class blindly.

Signal's old `180s / 180s / 4 results` values are evidence of a conservative prior, **not automatically Squishy's final values**.

### 5.7 Compact analytics contract

Reference:

`docs/ANALYTICS_EVENTS.md`

Useful lesson:

- events exist to answer concrete funnel/retention/monetization questions;
- no PII;
- keep vocabulary compact;
- adapter transports events, game owns semantics.

### 5.8 Art production discipline

Reference:

`docs/ART_PRODUCTION.md`

Useful production pattern:

- establish a canonical master before creating variants;
- inspect hero size + small UI size;
- make variants systematic rather than independent redesigns;
- use pipeline outputs rather than hand-editing final runtime artifacts;
- log source/revision/cleanup information for generated art;
- profile asset weight once content scale is real.

Squishy adaptation is stronger: variants should mostly be runtime material/config recipes over canonical shape masters, not separate flattened art renders.

### 5.9 Domain truth outside scene choreography

Reference:

`docs/TECHNICAL_DIRECTION.md`

Carry forward:

- pure systems/data own progression/economy truth;
- presentation may stage already-owned values;
- scene/tween callbacks do not determine persistence;
- platform integration sits behind a narrow runtime boundary.

Do **not** copy Signal's scenes, pouch opening, CHIPS, Signal, Overcharge or Secret systems.

---

## 6. Signal 2000 — explicitly do not reuse

Do not port these merely because they are proven code:

- CHIPS wallet/economy;
- Basic/Charged pouch profiles;
- Signal pity;
- Overcharge;
- Hidden Pocket;
- loot pool/drop system;
- duplicate recycle;
- random collectible reward engine;
- pouch geometry/tear mechanic;
- exact reveal carousel;
- Y2K art/audio identity;
- gadget family schema;
- `OpeningScene` orchestration;
- Signal save schema;
- Secret reward rules;
- collection Shelf/Library UI as-is;
- landscape lock as an inherited assumption.

These solve another product.

---

## 7. What remains local to Squishy

Always project-local unless a future second consumer proves otherwise:

- squish mesh topology/deformation tuning;
- shape masks/SDFs;
- mold semantics;
- pour/mix/apply stage rules;
- recipe/content registry;
- Lab Rank progression;
- collection definitions/milestones;
- premium toy-lab art direction;
- exact reveal hierarchy;
- exact audio profiles;
- stage choreography;
- Squishy save codec/migrations;
- analytics vocabulary;
- monetization placement;
- orientation/layout choice;
- onboarding.

---

## 8. Candidate future extraction from this project

Do not create these in `mini-games-kit` preemptively. Observe first.

Potential evidence-producing candidates:

- generic HOLD/DISPENSE continuous stage semantic helper;
- generic area-coverage DRAG/APPLY helper;
- generic deformable 2D soft-object renderer only if another project later needs it;
- collection milestone/read-model patterns only if a second project demonstrates the same smaller contract.

The first implementation should optimize for the game. Extraction follows evidence.

---

## 9. Reuse acceptance

Reuse is successful when:

- it removes already-paid production work;
- the game does not bend its design around old abstractions;
- shared code remains policy-free;
- local code remains easy to understand;
- private dependency setup is explicit and reproducible;
- consumer friction becomes documented evidence rather than a silent fork.

A reused mechanism that increases product complexity is not a win.
