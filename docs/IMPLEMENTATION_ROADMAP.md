# Squishy Squishes — Implementation Roadmap

**Status:** SANDBOX PIVOT ACTIVE / S1 SANDBOX CORE ENGINEERING PASSED
**Current development gate:** S2 — Personal Library
**External release gate:** real-phone/manual touch acceptance is still outstanding
**Current product thesis:** open creative squishy sandbox + personal library; recipes are optional inspiration/meta, never content gates

The recipe-first version remains useful technical evidence, but it is no longer the target product model.

Current source of truth:

- `SANDBOX_PIVOT_01_MASTER_PLAN.md`;
- `SANDBOX_PIVOT_01_REVIEW.md`;
- `SANDBOX_PIVOT_01_ASSET_PLAN.md`;
- `SANDBOX_PIVOT_S0_APPEARANCE_PROBE*.md`;
- `SANDBOX_PIVOT_S1_CORE.md`;
- `SANDBOX_PIVOT_S1_CORE_REVIEW.md`;
- `SANDBOX_PIVOT_S1_VISUAL_REVIEW.md`;
- `SANDBOX_PIVOT_S1_IMPLEMENTATION_REVIEW.md`.

Target product loop:

`Library → New Squishy → Shape → Free Paint → Mix-ins → Mix → Decorate → Save → Squeeze → New Squishy`

Core creation content should be broadly available from the start. Progression is optional humorous status/recipe meta rather than an unlock wall.

---

# Current roadmap

## S0 — Appearance Probe — PASS / ENGINEERING COMPLETE

Blocking question:

> Can free custom paint be saved compactly, reconstructed after reload, and remain attached to the existing deforming WebGL mesh?

Result: **yes**.

Proved:

- optional RGBA appearance texture in stable squishy UV space;
- 256×256 paint surface;
- semi-transparent overlap/blending;
- soft eraser;
- three brush sizes + Undo;
- compact quantized stroke codec;
- save → reload reconstruction;
- real squeeze with authored appearance attached to deformation;
- Pages-only probe with explicit Yandex bundle exclusion;
- permanent production-browser regression.

Persistence evidence:

- representative 3-stroke appearance: **219 B**;
- richer 48-stroke stress appearance: **4,195 B**;
- per-toy authored appearance target: **≤ 6 KB**.

---

## S1 — Sandbox Core — PASS / ENGINEERING COMPLETE

S1 replaced the normal recipe-gated player path with one coherent single-toy sandbox lifecycle:

`Shape → Free Paint → Mix-ins → Mix & Stretch → Finish → Save → Squeeze`

After reload:

`Home → Squeeze / New Squishy`

Delivered/proved:

- all six production shapes available immediately;
- no rank/XP/recipe gate in core creation;
- free paint with no coverage threshold;
- six colors, three brush sizes, eraser, Undo and Clear;
- six lightweight procedural mix-in families;
- existing real pointer-travel Mix interaction reused;
- Soft / Jelly / Holo finish selection;
- SaveState V3 with bounded authored appearance;
- conservative V2 → V3 migration without fabricated custom toys;
- one custom squishy saves, reloads and squeezes with authored shape/material/paint/mix-ins intact;
- generic `SquishSurface` retained; no per-shape renderer/physics branches;
- Save → first Squeeze ownership beat protected from interstitial interruption;
- responsive phone portrait / short landscape / desktop shell;
- Yandex lifecycle/build verifier retained;
- S0 appearance probe remains a production-browser regression.

Final branch evidence before PR cleanup:

- validation run **34958564679** — strict typecheck + Pages build + Yandex build + verifier: **PASS**;
- browser run **34958564795** — `npm run qa:release`: **8/8 PASS**;
- visual run **34958564725** — production lifecycle screenshots after bounded hero scale correction: **PASS**.

Important scope boundary:

- S1 intentionally persists exactly **one** custom toy even though V3 already uses a `library[]` envelope;
- multi-slot behavior belongs to S2;
- S1 enforces the **6 KB per-toy appearance budget**, but does not fake a final eight-/24-slot payload measurement before the real multi-slot implementation exists.

Canonical final review: `SANDBOX_PIVOT_S1_IMPLEMENTATION_REVIEW.md`.

**Release note:** S1 engineering completion is not real-device acceptance. A physical phone/touch pass is still required before release/moderation claims.

---

## S2 — Personal Library — CURRENT DEVELOPMENT GATE

Goal: turn the proven one-toy lifecycle into the retention backbone without changing the sandbox thesis.

Required behavior:

- initial target: **8 free saved-squishy slots**;
- cards represent actual authored toys, not canonical recipes;
- open any saved toy directly into squeeze mode;
- create a new squishy from the library;
- delete a toy for free;
- replace a toy for free;
- full library must never hard-block continued free play;
- deterministic slot ordering and persistence across reload;
- safe behavior for malformed/partial library data;
- no XP/rank gate on slots or creation tools.

Required persistence evidence:

- measure real serialized V3 envelope with representative 1-, 8- and stress-library contents;
- validate the practical ceiling before treating **24 slots** as committed;
- keep each authored appearance bounded and compact;
- do not switch to bitmap screenshots or raw float point arrays.

Required UX evidence:

- phone portrait library remains toy-first rather than database-like;
- saved creations are visually distinguishable enough to choose;
- New Squishy is always obvious;
- delete/replace is understandable but not dangerously prominent;
- opening a saved toy gets to tactile squeeze immediately;
- no slot-cap monetization can strand a player.

Explicit S2 non-goals:

- no decor/face subsystem;
- no recipes/titles meta;
- no rewarded ads;
- no shop/currency;
- no draggable appendage physics.

---

## S3 — Decor MVP

Add reusable identity after library persistence is stable:

- eyes;
- mouths;
- blush;
- flowers;
- hearts/stars/stickers;
- simple anchored accessories such as ears, bows, horns and crown.

Reuse stable appearance/deformation principles where appropriate. Do not begin with draggable ears or custom accessory physics.

---

## S4 — Ideas / Recipes + Humorous Titles

Repurpose canonical recipe work as optional inspiration rather than gating.

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

Only after free sandbox + library retention works:

- permanent cosmetic/material packs;
- premium finish packs;
- accessory packs;
- additional library slots.

Rules:

- rewards additive/permanent where practical;
- no “watch or you cannot continue” gate;
- no currency economy required;
- no loot-box duplicate loop;
- base creative play remains meaningful without ads.

---

## S6 — Interstitial Adaptation

Logical pauses may include:

- after saving and returning to library;
- after leaving a squeeze/revisit session;
- other clearly completed loops validated by evidence.

Never interrupt:

- painting;
- mix-ins;
- Mix;
- decorating;
- Save → first ownership/squeeze beat.

---

## S7 — Expressive Polish

Only after the core sandbox/library loop proves its appeal:

- independently draggable ears/appendages;
- richer face response under stretch;
- additional premium materials/finishes;
- stronger ASMR/juice;
- other expressive interactions backed by evidence.

---

# Historical baseline retained from recipe-first version

## Tactile interaction foundation — REUSABLE

Validated mechanics include pointer painting, motion-driven Add/filling shake, real pointer-travel Mix/stretch, generic spring/deformation response, and squeeze/release audio lifecycle.

Do not retune accepted mechanics merely because IA changes. Reuse where they serve the sandbox and delete obsolete stages where they do not.

## Renderer / shape foundation — REUSABLE

Raw WebGL2 still supports six shapes through shared geometry/boundary/deformation logic:

- Soft Square;
- Heart;
- Mochi;
- Peach;
- Mushroom;
- Paw.

S0/S1 prove authored appearance rides the same stable UV/deformation path without per-shape branches.

## Production skeleton / platform integration — REUSABLE

Retained infrastructure includes:

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

Pinned shared kit remains:

`mini-games-kit@d17ba31fce2a71335dcc3095f772c3fdd87fe97b`

unless a later phase has concrete evidence requiring an upgrade.

## Recipe progression / collection — SUPERSEDED AS PRODUCT MODEL

SaveState V2, Lab XP, ranks 1–8, deterministic recipe unlocks and the 24 canonical recipes remain migration/reference material only.

XP/rank must not regain authority over shapes, materials, recipes or the ability to create.

## UI/UX Overhaul 02 — SUPERSEDED AS IA, RETAINED AS VISUAL/QA EVIDENCE

Keep its strongest lessons:

- toy-first hierarchy;
- touch-first responsive shell;
- child-readable concise copy;
- strong ownership presentation;
- production screenshot review discipline;
- phone portrait/landscape/desktop QA.

Do not restore the recipe shelf/next-unlock dashboard model.

---

# Save/model migration rule — S1 RESULT

SaveState V3 is now the production boundary.

Historical V2 progress migrates conservatively as legacy/meta credit. It does **not** fabricate authored toys that never existed.

The V2 key is removed only after successful V3 write/flush. Corrupt/invalid V3 falls back safely rather than being partially trusted.

S2 must extend V3 through the existing bounded library envelope rather than inventing another persistence format without evidence.

---

# Cross-phase stop rules

Stop and reassess if:

- custom appearance starts requiring bitmap screenshots in player storage;
- real multi-slot payload makes the library implausible under platform limits;
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
