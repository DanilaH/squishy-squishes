# Squishy Squishes — Implementation Roadmap

**Status:** SANDBOX PIVOT ACTIVE / S0 APPEARANCE PROBE PASSED
**Current gate:** S1 — Sandbox Core
**Current product thesis:** open creative squishy sandbox + personal library; recipes are optional inspiration/meta, never content gates

The project direction changed after UI/UX Overhaul 02. The existing recipe-first game remains valuable technical evidence and a working release baseline, but it is no longer the target product model.

The new source of truth is:

- `SANDBOX_PIVOT_01_MASTER_PLAN.md`;
- `SANDBOX_PIVOT_01_REVIEW.md`;
- `SANDBOX_PIVOT_01_ASSET_PLAN.md`;
- `SANDBOX_PIVOT_S0_APPEARANCE_PROBE*.md`.

The target loop is now:

`Library → New Squishy → Shape → Free Paint → Mix-ins → Mix → Decorate → Save → Squeeze → New Squishy`

Core content should be broadly available from the start. Progression becomes optional humorous status/recipe meta rather than an unlock wall.

---

# Current roadmap

## S0 — Appearance Probe — PASS / ENGINEERING COMPLETE

Blocking question:

> Can free custom paint be saved compactly, reconstructed after reload, and remain attached to the existing deforming WebGL mesh?

Result: **yes**.

Delivered/proved:

- optional RGBA appearance texture sampled in stable squishy UV space;
- 256×256 paint surface;
- semi-transparent color overlap/blending;
- soft eraser;
- three brush sizes + Undo;
- compact quantized stroke codec;
- save → reload reconstruction;
- real squeeze interaction with custom appearance attached to deformation;
- Pages-only probe via `?appearanceProbe=1`;
- explicit Yandex bundle-exclusion verifier;
- permanent production-browser regression.

Measured persistence evidence:

- representative 3-stroke appearance: **219 B**;
- richer 48-stroke stress appearance: **4,195 B**;
- representative target: **≤ 6 KB**.

Visual evidence also accepted the painted pattern during an actively held stretch, not merely after spring release.

S0 deliberately did **not** introduce SaveState V3, library, mix-ins, decals, recipe meta or ads.

Canonical docs: `SANDBOX_PIVOT_S0_APPEARANCE_PROBE.md`, `SANDBOX_PIVOT_S0_APPEARANCE_PROBE_REVIEW.md`.

---

## S1 — Sandbox Core — CURRENT HARD GATE

Goal: replace the recipe-gated craft path with one coherent player-facing sandbox flow while keeping scope limited to **one custom squishy lifecycle**.

Target S1 flow:

`Shape → Free Paint / Finish → Mix-ins → Mix → Finish → Save → Reopen → Squeeze`

### Required S1 product behavior

- all existing production shapes available immediately;
- shape selection is visual and has no rank requirement;
- free paint has no coverage/completion threshold;
- player may continue after any amount of painting;
- paint supports multiple colors, soft overlap/blending, eraser, brush size and Undo;
- material/finish selection is embedded in the maker rather than becoming another long stage;
- basic mix-ins are combinable without a simulated-particle architecture;
- existing tactile Mix interaction is reused where it still feels appropriate;
- one custom squishy can be saved, reloaded and squeezed;
- SaveState V3 stores authored appearance rather than canonical recipe completion as the primary object;
- old SaveState V2 is handled deliberately rather than silently corrupted.

### S1 architecture constraints

- preserve one generic `SquishSurface` and one shared deformation model;
- no bespoke physics per shape;
- no bitmap screenshots in saves;
- no raw float point arrays;
- keep per-toy appearance around the proven S0 budget unless evidence requires a justified change;
- keep total future 24-slot model plausibly within Yandex player-data limits;
- do not introduce the multi-slot library yet;
- do not introduce recipes/titles yet;
- do not introduce rewarded monetization yet;
- do not introduce draggable ears/reactive accessory physics yet.

### S1 exit evidence

S1 is complete only when production-browser and hands-on evidence proves:

1. each existing shape can enter the free-paint maker without rank gating;
2. paint can be minimal or extensive and still continue;
3. appearance survives the full maker path;
4. mix-ins/finish do not break the generic renderer;
5. a custom toy saves and restores through SaveState V3;
6. restored toy squeezes with its authored appearance intact;
7. old release/Yandex lifecycle still builds and boots correctly;
8. save-size measurements remain credible.

---

## S2 — Personal Library

After one custom toy lifecycle is solid, introduce the retention backbone:

- personal saved-squishy cards;
- initial target: **8 free slots**;
- open any saved toy directly into squeeze mode;
- delete/replace a toy for free;
- create a new squishy from the library;
- slot-cap behavior must never hard-block continued free play;
- target expandable ceiling: roughly 24 slots, subject to real save-size evidence.

No rewarded ad is required to keep playing: a full library must always allow free delete/replace.

---

## S3 — Decor MVP

Add reusable identity after library persistence is stable:

- eyes;
- mouths;
- blush;
- flowers;
- hearts/stars/stickers;
- simple anchored accessories such as ears, bows, horns and crown.

Surface decals should use the same stable appearance/deformation principles proven by S0 where appropriate.

Do not start with draggable ears or custom face physics. First prove that decoration makes saved toys more desirable and recognizable.

---

## S4 — Ideas / Recipes + Humorous Titles

Repurpose the existing canonical recipe work as optional inspiration rather than gating.

Target behavior:

- all sandbox tools remain available regardless of title;
- Ideas/Recipes suggest combinations to try;
- matching/completing an idea contributes to light meta progress;
- meta yields humorous titles such as `Новичок`, `Молодой сквишер`, `Жмякатель`, `Сквиш-стилист`, `Крутой сквишер`, `Сквишер-могер` and later tiers;
- exact XP should not dominate player-facing UI;
- titles never unlock required core content.

The existing 24 recipes are input material, not a mandatory final catalog contract.

---

## S5 — Rewarded Monetization

Introduce rewarded ads only after the free sandbox/library loop already works.

Good candidates:

- permanent cosmetic/material packs;
- premium finish packs;
- accessory packs;
- additional library slots.

Rules:

- rewards are additive/permanent where practical;
- no “watch or you cannot continue” gate;
- no currency economy required;
- no loot-box duplicate loop;
- base creative play remains meaningful without ads.

---

## S6 — Interstitial Adaptation

Adapt the existing conservative interstitial system to the new lifecycle.

Good logical pauses include:

- after saving and returning to the library;
- after leaving a squeeze/revisit session;
- other clearly completed loops validated by product evidence.

Never interrupt:

- painting;
- mix-ins;
- Mix;
- decorating;
- save/reveal ownership beat.

---

## S7 — Expressive Polish

Only after the core sandbox retains its appeal:

- independently draggable ears or appendages;
- richer face response under stretch;
- additional premium materials/finishes;
- stronger ASMR/juice;
- other expressive interactions backed by evidence.

This phase is polish, not a prerequisite for validating the sandbox model.

---

# Historical baseline retained from the recipe-first version

The work below remains technically valuable and should be reused rather than discarded, but its old product assumptions no longer control the roadmap.

## Tactile interaction foundation — COMPLETE

Validated reusable mechanics include:

- pointer-driven painting infrastructure;
- motion-driven Add/filling shake;
- real pointer-travel Mix/stretch;
- mold target interaction;
- generic spring/deformation response;
- squeeze/release audio and interaction lifecycle.

Do not retune accepted mechanics merely because the IA changes. Reuse the interaction where it serves the sandbox; remove obsolete stages where it does not.

## Renderer / shape reuse — COMPLETE

The existing raw WebGL2 renderer supports six shapes through shared geometry/boundary/deformation logic:

- Soft Square;
- Heart;
- Mochi;
- Peach;
- Mushroom;
- Paw.

S0 further proved that authored appearance can ride on stable UVs without a per-shape rendering branch.

## Production skeleton / platform integration — COMPLETE

Reusable infrastructure includes:

- app bootstrap boundary;
- mock + Yandex runtime seam;
- typed settings/storage boundaries;
- gameplay activity lifecycle;
- release analytics seam;
- Pages/Yandex dual builds;
- Yandex verifier;
- permanent Release Check;
- permanent production Chromium QA;
- GitHub Pages deployment.

Pinned shared kit remains `mini-games-kit@d17ba31fce2a71335dcc3095f772c3fdd87fe97b` unless a later phase has concrete evidence requiring an upgrade.

## Recipe progression / collection — SUPERSEDED AS PRODUCT MODEL

The old system delivered:

- SaveState V2;
- Lab XP;
- ranks 1–8;
- deterministic recipe unlocks;
- 24 canonical recipes;
- completed recipe revisits.

This code/history is useful migration/reference material, but **XP/rank must no longer gate shapes, materials, recipes or the ability to create** under the sandbox thesis.

## UI/UX Overhaul 02 — SUPERSEDED AS IA, RETAINED AS VISUAL/QA EVIDENCE

Overhaul 02 successfully established:

- toy-first object hierarchy;
- touch-first responsive shell;
- child-readable concise copy;
- strong result/ownership presentation;
- production screenshot review discipline;
- browser QA for phone portrait/landscape/desktop containment.

The recipe shelf/next-unlock IA is no longer the target. Preserve the toy-first visual lessons and QA methodology while rebuilding around Library + New Squishy.

## Feel / Art / Audio Pass 01 — REUSABLE

Existing material/reveal/audio layering remains a useful presentation vocabulary. Reuse selectively; do not let old `standard | special | showcase` recipe tiers force the new sandbox data model.

---

# Save/model migration rule

Do not mutate SaveState V2 into the new library shape piecemeal.

S1 must define an explicit SaveState V3 boundary. Migration policy must decide what historical V2 progress becomes — likely lightweight legacy/meta credit rather than attempting to fabricate custom authored toys that never existed.

A corrupted or ambiguous migration is worse than a conservative migration.

---

# Cross-phase stop rules

Stop and reassess if:

- custom appearance starts requiring bitmap screenshots in player storage;
- average authored toy size makes the planned library implausible under platform limits;
- raw WebGL work becomes the dominant production burden;
- shapes require bespoke deformation/paint code;
- mix-ins demand hundreds of simulated physical particles;
- decoration demands per-asset physics before basic identity is proven;
- recipes/meta start gating the sandbox again;
- rewarded ads become necessary to continue core play;
- currency/shop complexity appears without evidence;
- interstitials interrupt active creation or ownership reward;
- mobile performance collapses during painting/deformation;
- tests modify production mechanics simply to become green;
- scope expands to hide weak paint/mix/squeeze feel.

A failed assumption is evidence. Fix or reduce the assumption before adding another system.
